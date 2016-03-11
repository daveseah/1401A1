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
		// viewport 
		this.width 			= null;		// pixels
		this.height 		= null;		// pixels
		this.aspect 		= null;
		this.containerId 	= null;		// #container
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
	}

///	INITIALIZATION ///////////////////////////////////////////////////////////

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	// Step 1. Initialize the WebGL surface and size containers exactly
	Viewport.method('InitializeRenderer', function ( width, height, containerId ) {
		if (this.webGL) {
			console.error("Renderer already initialized");
			return;
		}
		if (!(width && height && containerId)) {
			console.error("Call InitializeRenderer() with cwidth, cheight, containerId");
			return;
		}
		if (typeof containerId !== 'string') {
			console.error("Provide a valid selector");
			return;
		}
		var $container = $(containerId);
		if (!$container) {
			console.error("container",containerId,"does not exist");
			return;
		}

		// save values
		this.width = width;
		this.height = height;
		this.containerId = containerId;
		this.aspect = width / height;

		// create renderer, then attach it
		this.webGL = new THREE.WebGLRenderer();
		this.webGL.autoClear = false;
		$container.append(this.webGL.domElement);

		// set the renderer size
		this.webGL.setSize(this.width,this.height);
		// set the container dimensions as well
		$container.css('width',this.width);
		$container.css('height',this.height);


	});
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	// Step 2. Set the World-to-Renderer mapping with "WorldUnits", which
	// specify the minimum guaranteed number of units to be shown in the current
	// display. A value of 10 means that 10 units (-5 to 5) will be visible in
	// world cameras
	Viewport.method('InitializeWorld', function ( worldUnits ) {
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
	});
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	// Step 3. Create all the cameras
	Viewport.method('InitializeCameras', function () {
		if (!this.worldScale) {
			console.error("Call InitializeWorld() before calling InitializeCameras()");
		}
		var hw = this.width/2;
		var hh = this.height/2;
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
	});

///	CAMERAS AND DIMENSIONS ///////////////////////////////////////////////////

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	// for updating when browser size changes (TBD)
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
		this.aspect = width/height;
	});
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Viewport.method('Dimensions', function () {
		if (!this.webGL) {
			console.error("WebGL is not initialized");
			return;
		}
		return { 
			width: this.width,
			height: this.height
		};
	});
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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

		// update world3d camera by positioning it
		// to default see the entire world
		var d = m_GetFramingDistance(this.cam3D,whw,whh);

		this.cam3D.position.z = d;
		this.cam2D.position.z = d;

		this.cam2D.updateProjectionMatrix();
		this.cam3D.updateProjectionMatrix();

	});
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Viewport.method('UpdateViewportCameras', function () {
		var hw = this.width/2;
		var hh = this.height/2;
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
	});
	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Viewport.method('SelectWorld3D', function () {
		this.camWORLD = this.cam3D;
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

	function m_GetFramingDistance ( cam3D, fWidth, fHeight ) {

		var safety = 0.5;
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
