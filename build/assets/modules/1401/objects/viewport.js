/* viewport.js */
define ([
	'three',
	'1401/system/debug'
], function ( 
	THREE,
	DEBUG
) {

/****************************************************************************\

	VIEWPORT is our "fixed-size pixel space", which matches the
	resolution of the WebGLRenderer. This resolution is also the
	base resolution for bitmapped images used as backgrounds and
	sprites. 

\****************************************************************************/

///	PRIVATE VARIABLES ////////////////////////////////////////////////////////

	var instance;
	var viewport_count = 0;

	// scratch variables
	var v = new THREE.Vector3(0,0,0);

///	OBJECT DECLARATIONS //////////////////////////////////////////////////////

	/* constructor */
	function Viewport ( name ) {
		this.name = name || "viewport"+(viewport_count++);
		// display mode
		this.mode 			= Viewport.MODE_FIXED;
		// viewport 
		this.width 			= null;		// pixels
		this.height 		= null;		// pixels
		this.aspect 		= null;
		this.$container 	= null;		// jquery container object
		this.webGL 			= null;		// WebGL renderer object
		// world
		this.worldOrigin 	= null;		// where world cams are looking
		this.worldUnits		= null;		// number of visible world units in frame
		this.worldScale 	= null;		// scale factor for world cams to fit world units
		this.worldAspect	= null;		// computed world aspect ratio for 3d cams
		this.worldUp	 	= null;		// up-vector for orienting world cams
		// cameras
		this.camBG 			= null;		// background image (pixel coords)
		this.camWORLD 		= null;		// pieces (world coords) set to...
		this.cam2D			= null;		// ...2d orthographic (world coords)
		this.cam3D			= null;		// ...3d perspective (world coords)
		this.camSCREEN 		= null;		// screen (pixel coords)
		// mouseraycasting
		this.pickers 		= null;		// subscribes to mouse click events
		// hacky access to constructor types
		this.TYPE 			= Viewport;
	}
	Viewport.MODE_FIXED 	= 'fixed';
	Viewport.MODE_SCALED 	= 'scaled';
	Viewport.MODE_FLUID		= 'fluid';

///	INITIALIZATION ///////////////////////////////////////////////////////////

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	// Step 1. Initialize the WebGL surface and size containers exactly
	Viewport.method('InitializeRenderer', function ( cfg ) {
		// dereference required parameters
		var width = cfg.renderWidth;
		var height = cfg.renderHeight;
		var containerId = cfg.attachId;

		// error checking
		if (this.webGL) {
			console.error("Renderer already initialized");
			return;
		}
		if (!(width && height && containerId)) {
			console.error("Call InitializeRenderer() with cwidth, cheight, containerId");
			return;
		}
		// check format of containerId string
		if (typeof containerId !== 'string') {
			console.error("Provide a valid selector");
			return;
		} 
		if (containerId.charAt(0)!=='#') {
			containerId = '#'+containerId;
		}

		var $container = $(containerId);
		if (!$container) {
			console.error("container",containerId,"does not exist");
			return;
		}

		// save values
		this.width 		= width;
		this.height 	= height;
		this.$container = $container;
		this.aspect 	= width / height;

		// create renderer, then attach it
		// see THREE.WebGLRenderer for options you can add
		this.webGL = new THREE.WebGLRenderer( cfg );
		this.webGL.autoClear = false;
		this.$container.append(this.webGL.domElement);

		// set the renderer size
		this.webGL.setSize(this.width,this.height);
		// set the container dimensions as well
		this.$container.css('width',this.width);
		this.$container.css('height',this.height);

		/// CONSOLE DEBUG METHODS /////////////////////

		window.SYS1401.CONTAINER 	= $container;
		window.SYS1401.OVERLAY 		= $('#renderer-overlay');
		window.SYS1401.WEBGL 		= this.webGL;

		/* size a div to width, height in pixels */
		window.SYS1401.sizeElement = function (el,w,h) {
			if (!el) return "must pass element as arg1";
			if (typeof w=='undefined') {
				w = el.width();
				h = el.height();
				return "is "+w+", "+h;
			}
			if (typeof h=='undefined') h = w;
			el.width(w).height(h);
			return "set to "+w+", "+h;
		};

		/* size the webgl canvas to width, height in pixels */
		/* do not call in code */

		window.SYS1401.glSize = function (w,h) {
			instance.SetDimensions(w,h);
			var CAMWORLD = window.SYS1401.CAMWORLD;
			var WEBGL 	= window.SYS1401.WEBGL;
			if (typeof w=='undefined') {
				w = WEBGL.domElement.width;
				h = WEBGL.domElement.height;
				return "glcanvas is "+w+", "+h;
			}
			if (typeof h=='undefined') h = w;
			WEBGL.setSize(w,h);
			if (CAMWORLD instanceof THREE.PerspectiveCamera) {
				CAMWORLD.aspect = 	w/h;
			}
			if (CAMWORLD instanceof THREE.OrthographicCamera) {
				CAMWORLD.left 	= -(w/2);
				CAMWORLD.right 	= +(w/2);
				CAMWORLD.top 	= +(h/2);
				CAMWORLD.bottom = -(h/2);
			}
			CAMWORLD.updateProjectionMatrix();
			return "glsetsize "+w+", "+h;
		};

		window.SYS1401.rSize = function (w,h) {
			return 'renderer div '+SYS1401.sizeElement(SYS1401.CONTAINER,w,h);
		};
		window.SYS1401.roSize = function (w,h) {
			return 'renderer overlay div '+SYS1401.sizeElement(SYS1401.OVERLAY,w,h);
		};


	});
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	// Step 2. Set the World-to-Renderer mapping with "WorldUnits", which
	// specify the minimum guaranteed number of units to be shown in the current
	// display. A value of 10 means that 10 units (-5 to 5) will be visible in
	// world cameras
	Viewport.method('SizeWorldToViewport', function ( worldUnits ) {
		if (!this.webGL) {
			console.error("Call InitializeViewport() before calling InitializeWorld()");
			return;
		}
		if (!worldUnits) {
			console.error("Call with worldUnits, the min");
			return;
		}
		// save world values
		this.worldOrigin = new THREE.Vector3(0,0,0);
		this.worldUp = new THREE.Vector3(0,1,0);	// y-axis is up, camera looks on XY
		this.worldUnits = worldUnits;
		this.worldScale = Math.max(worldUnits/this.width,worldUnits/this.height);
		this.worldAspect = this.width/this.height;
	});
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	// Step 3. Create all the cameras
	Viewport.method('InitializeCameras', function () {
		if (!this.worldScale) {
			console.error("Call InitializeWorld() before calling InitializeCameras()");
		}
		var hw = this.width/2;
		var hh = this.height/2;
		this.worldAspect = hw/hh;
		this.camBG = new THREE.OrthographicCamera(-hw,hw,hh,-hh,0,1000);
		this.camSCREEN = new THREE.OrthographicCamera(-hw,hw,hh,-hh,0,1000);
		var whw = this.width * this.worldScale / 2;
		var whh = this.height * this.worldScale / 2;
		var wox = this.worldOrigin.x;
		var woy = this.worldOrigin.y;

		this.cam3D = new THREE.PerspectiveCamera ( 53.1, this.aspect, 1,10000);
		this.cam3D.position.set(wox,woy,10);
		this.cam3D.up = this.worldUp;
		this.cam3D.lookAt(this.worldOrigin);

		this.cam2D = new THREE.OrthographicCamera(-whw+wox,whw+wox,whh+woy,-whh+woy,0,10000);
		this.cam2D.position.set(wox,woy,10);
		this.cam2D.up = this.worldUp;
		this.cam2D.lookAt(this.worldOrigin);

		this.camSCREEN = new THREE.OrthographicCamera(-hw,hw,hh,-hh,0,1000);

		// update world3d camera by positioning it
		// to default see the entire world
		var d = m_GetFramingDistance(this.cam3D,whw,whh);

		this.cam3D.position.z = d;
		this.cam2D.position.z = d;		

		// assign default world camera as 2D
		this.camWORLD = this.cam2D;
		// update debug reference
		window.SYS1401.CAMWORLD = this.camWORLD;

	});

///	CAMERAS AND DIMENSIONS ///////////////////////////////////////////////////

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	// for updating when browser size changes (see SCREEN module)
	Viewport.method('SetDimensions',function ( width, height ){
		if (!this.webGL) {
			console.error("WebGL is not initialized");
			return;
		}
		if (!width) width = this.width;
		if (!height) height = this.height;
		if (!(width && height && this.webGL)) {
			console.error("ViewPort requires valid width and height. Did you InitializeRenderer()?");
		}
		this.aspect = this.width/this.height;
		this.worldAspect = this.aspect;

		// save values
		this.width 	= width;
		this.height = height;
		this.aspect = width / height;

		// set the renderer size
		this.webGL.setSize(this.width, this.height);
		// set the container dimensions as well
		this.$container.css('width',this.width);
		this.$container.css('height',this.height);
		var $canvas = $(this.WebGLCanvas());
		$canvas.css('width',this.width);
		$canvas.css('height',this.height);

	});
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Viewport.method('Dimensions', function () {
		if (!this.webGL) {
			console.error("WebGL is not initialized");
			return;
		}
		return { 
			width 			: this.width,
			height 			: this.height,
			aspect 			: this.aspect,
			scaledWidth 	: this.$container.width(),
			scaledHeight 	: this.$container.height()
		};
	});
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Viewport.method('WorldDimensions', function () {
		return {
			worldUnits 	: this.worldUnits,
			worldScale 	: this.worldScale,
			worldAspect	: this.worldAspect
		};
	});
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	// update world cameras based on current viewport properties
	Viewport.method('UpdateWorldCameras', function () {

		var whw = this.width * this.worldScale / 2;
		var whh = this.height * this.worldScale / 2;
		var wox = this.worldOrigin.x;
		var woy = this.worldOrigin.y;

		// update world2d camera
		this.cam2D.left  	= -whw+wox;
		this.cam2D.right 	= +whw+wox;
		this.cam2D.top 		= +whh+woy;
		this.cam2D.bottom 	= -whh+woy;

		// update aspect
		this.cam3D.aspect = this.aspect;

		// update project matrices
		this.cam2D.updateProjectionMatrix();
		this.cam3D.updateProjectionMatrix();

	});
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	// update 2D cameras based on current viewport properties
	Viewport.method('UpdateViewportCameras', function () {
		var hw = this.width / 2;
		var hh = this.height / 2;
		this.camBG.left 	= -hw;
		this.camBG.right	= +hw;
		this.camBG.top		= +hh;
		this.camBG.bottom	= -hh;

		this.camSCREEN.left 	= -hw;
		this.camSCREEN.right	= +hw;
		this.camSCREEN.top		= +hh;
		this.camSCREEN.bottom	= -hh;

		this.camBG.updateProjectionMatrix();
		this.camSCREEN.updateProjectionMatrix();
	});
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	// reposition camera to show a the current worldscale within the
	// given viewport dimensions
	Viewport.method('FrameToWorld', function () {
		var whw = this.width * this.worldScale / 2;
		var whh = this.height * this.worldScale / 2;
		// update world3d camera by positioning it
		// to default see the entire world
		var d = m_GetFramingDistance(this.cam3D,whw,whh);
		// update camera distances
		this.cam3D.position.z = d;
		this.cam2D.position.z = d;
	});

///	ACCESSOR METHODS /////////////////////////////////////////////////////////

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Viewport.method('AspectRatio', function () {
		return this.aspect;
	});
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Viewport.method('BackgroundCam', function () { return this.camBG; });
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Viewport.method('WorldCam', function () { return this.camWORLD; });
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Viewport.method('WorldCam2D', function () { return this.cam2D; });
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Viewport.method('WorldCam3D', function () { return this.cam3D; });
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Viewport.method('ScreenCam', function () { return this.camSCREEN; });
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Viewport.method('WebGL', function () { return this.webGL; });
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Viewport.method('WebGLCanvas', function () { return this.webGL.domElement; });
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

///	RENDER CONTROL ///////////////////////////////////////////////////////////

	Viewport.method('Clear', function () { this.webGL.clear(); });
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Viewport.method('ClearDepth', function () { this.webGL.clearDepth(); });
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Viewport.method('Render', function ( rpass ) { 
		this.webGL.render(rpass,rpass.camera);
	});
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Viewport.method('SelectWorld2D', function () {
		this.camWORLD = this.cam2D;
		SYS1401.CAMWORLD = this.camWORLD;
	});
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Viewport.method('SelectWorld3D', function () {
		this.camWORLD = this.cam3D;
		SYS1401.CAMWORLD = this.camWORLD;
	});

///	CAMERA UTILITIES /////////////////////////////////////////////////////////

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Viewport.method('Track', function ( vector3 ) {
		v.x = vector3.x; v.y = vector3.y; v.z = vector3.z;
		this.cam2D.position.x = v.x;
		this.cam2D.position.y = v.y;
		this.cam3D.position.x = v.x;
		this.cam3D.position.y = v.y;
		this.cam3D.lookAt.x = v.x;
		this.cam3D.lookAt.y = v.y;
		this.cam3D.lookAt.z = v.z;
	});



/**	SUPPORT FUNCTIONS *******************************************************/
	// calculates how far a 3D camera with a particular
	// FOV needs to move back to show fWidth and fHeight
	// pixels. Used to frame a particular number of world units
	function m_GetFramingDistance ( cam3D, fWidth, fHeight, safety ) {

		safety = safety || 0.5;
		var buffer = fWidth * safety;

		fWidth += buffer;
		fHeight += buffer;

		// update world3d camera by positioning it
		// to default see the entire world
		var deg2rad = 180 / Math.PI;
		var hfov = deg2rad * (cam3D.fov / 2);
		var tan = Math.tan(hfov);
		var d = Math.max ( fWidth/tan, fHeight/tan );

		// console.log("frame",fWidth*2+'x'+fHeight*2,"D="+d.toFixed(2));
		return d;

	}



///	RETURN SINGLETON /////////////////////////////////////////////////////////

	if (instance===undefined) {
		instance = new Viewport();
		// DEBUG.AddWatch('viewport',instance);
	}

	return instance;

});
