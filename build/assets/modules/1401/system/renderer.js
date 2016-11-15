/* renderer.js */
define ([
	'three',
	'1401/objects/viewport',
	'1401/settings'
], function ( 
	THREE,
	VIEWPORT,
	SETTINGS
) {

	var DBGOUT = true;

/**	RENDERER *****************************************************************\

	ThreeJS-based rendering system

/** MODULE PRIVATE VARIABLES *************************************************/

	var _timer_resizing;

	var RP_BG 		= new THREE.Scene();	// drawn with camBG
	var RP_WORLD 	= new THREE.Scene();	// drawn with camWORLD
	var RP_WORLD2 	= new THREE.Scene();	// drawn with camWORLD
	var RP_UI 		= new THREE.Scene();	// drawn with camSCREEN
	var RP_OVER 	= new THREE.Scene();	// drawn with camSCREEN

	var BG_SPRITE 	= null;

	var PICK_SUBSCRIBERS = null;			// API.SubscribeToMousePicks()

	var CAPTURE_SCREEN = false;				// for screen capturing
	var CAPTURE_CALLBACK = null;

	var _prerender = [];					// registered render
	var _heartbeat = [];					// registered renderer heartbeat

	var i,j;								// pre-allocated indexers


/** PUBLIC API ***************************************************************/

	var API = {};
	API.name = "renderer";

///	RENDER INIT & CONTROL ////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Initialize Rendersystem 
	displayMode is fixed, scaled, or fluid
	renderWidth, renderHeight, attachTo are required
	worldUnits is the number of worldUnits to fit into the pixel viewport
	crossOrigin is to allow non-server media assets to load
/*/	API.Initialize = function ( parm ) {
		// order of initialization is important
		VIEWPORT.InitializeRenderer(
			parm.renderWidth,
			parm.renderHeight,
			parm.attachId
		);

		// using the renderWidth,Height as a 
		VIEWPORT.SizeWorldToViewport(
			parm.worldUnits || Math.min(parm.renderWidth, parm.renderHeight)
		);
		VIEWPORT.InitializeCameras();

		// assign default cameras to renderpasses
		RP_BG.camera = VIEWPORT.BackgroundCam();
		RP_WORLD.camera = VIEWPORT.WorldCam();
		RP_WORLD2.camera = VIEWPORT.WorldCam();
		RP_UI.camera = VIEWPORT.ScreenCam();
		RP_OVER.camera = VIEWPORT.ScreenCam();

		// enable cross-origin
		if (parm.crossOrigin===true)
			THREE.ImageUtils.crossOrigin='';

	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Heartbeat Tasks execute during before GameStep every frame. This is used
	by extenders of RENDERER to insert custom processing routines
/*/	API.RegisterHeartBeatTask = function ( func ) {
		if (typeof func !== 'function') {
			console.error("RegisterHeartBeat requires a function");
			return;
		} 
		_heartbeat.push(func);
	};	
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Heartbeat Tasks execute during before GameStep every frame. This is used
	by extenders of RENDERER to insert custom processing routines
/*/	API.RegisterPrerenderTask = function ( func ) {
		if (typeof func !== 'function') {
			console.error("RegisterPrerenderTask requires a function");
			return;
		} 
		_prerender.push(func);
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Capture
/*/	API.CaptureJPEG = function ( callback ) {
		CAPTURE_SCREEN = true;
		if (typeof callback==='function') {
			CAPTURE_CALLBACK = callback;
		} else {
			throw new Error('CaptureJPEG requires a callback function to receive jpg base64 data');
		}
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ for manually rendering on every update with explicit call
/*/	API.Render = function () {

		// issue any prerendering function objects
		for(i=0;i<_prerender.length;i++) {
			_prerender[i]();
		}

		VIEWPORT.Clear();
		VIEWPORT.Render ( RP_BG );

		VIEWPORT.ClearDepth();
		VIEWPORT.Render ( RP_WORLD );

		VIEWPORT.ClearDepth();
		VIEWPORT.Render ( RP_WORLD2 );

		VIEWPORT.ClearDepth();
		VIEWPORT.Render ( RP_UI );

		VIEWPORT.ClearDepth();
		VIEWPORT.Render ( RP_OVER );

		// screen capture
		if (CAPTURE_SCREEN) {
			var buffer = VIEWPORT.WebGLCanvas();
			var jpg = buffer.toDataURL( 'image/jpeg', 0.5 );
			if (CAPTURE_CALLBACK) {
				CAPTURE_CALLBACK.call( this, jpg );
				CAPTURE_CALLBACK = null;
			}
			CAPTURE_SCREEN = false;
		}
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ call once to start auto drawing with no need to call on update
/*/	API.AutoRender = function () {
		requestAnimationFrame( API.AutoRender );
		API.Render();
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ called by Master.Step() prior to Game.MasterStep()
/*/	API.HeartBeat = function ( interval_ms ) {
		// do system-related cleanup and processing
		for(i=0;i<_heartbeat.length;i++) {
			_heartbeat[i]();
		}
	};


///	RENDERPASSES /////////////////////////////////////////////////////////////
/*/	These routines are useful for adding/removing a single visual (which is
	a THREE object3d) at a time.
/*/
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.AddWorldVisual = function ( visual ) {
		RP_WORLD.add(visual);
		if (DBGOUT && SETTINGS.InfoTrace('rpass')) console.log("added "+visual.id,">>> RP_WORLD");
	};
///	---
	API.SetWorldVisualFog = function ( fog ) {
		RP_WORLD.fog = fog;
		if (DBGOUT && SETTINGS.InfoTrace('rpass')) console.log("added fog"+fog.name,">>> RP_WORLD");
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.AddWorldOverlayVisual = function ( visual ) {
		RP_WORLD2.add(visual);
		if (DBGOUT && SETTINGS.InfoTrace('rpass')) console.log("added "+visual.id,">>> RP_WORLD2");
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.AddBackgroundVisual = function ( visual ) {
		RP_BG.add(visual);
		if (DBGOUT && SETTINGS.InfoTrace('rpass')) {
			console.log("added "+visual.id,">>> RP_BG");
			if ((RP_BG.camera.far + visual.position.z)<0) {
				console.warn('*** WARN *** BG visual may not be in view fustrum of BGCAM');
			}
		}
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.AddUIVisual = function ( visual ) {
		RP_UI.add(visual);
		if (DBGOUT && SETTINGS.InfoTrace('rpass')) console.log("added "+visual.id,">>> RP_UI");
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.AddScreenOverlayVisual = function ( visual ) {
		RP_OVER.add(visual);
		if (DBGOUT && SETTINGS.InfoTrace('rpass')) console.log("added "+visual.id,">>> RP_OVER");
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.RemoveBackgroundVisual = function ( visual ) {
		RP_BG.remove(visual);
		if (DBGOUT && SETTINGS.InfoTrace('rpass')) console.log("RP_BG >>>",visual.id.toString(),"removed");
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.RemoveWorldVisual = function ( visual ) {
		RP_WORLD.remove(visual);
		if (DBGOUT && SETTINGS.InfoTrace('rpass')) console.log("RP_WORLD >>>",visual.id.toString(),"removed");
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.RemoveWorldOverlayVisual = function ( visual ) {
		RP_WORLD2.remove(visual);
		if (DBGOUT && SETTINGS.InfoTrace('rpass')) console.log("RP_WORLD2 >>>",visual.id.toString(),"removed");
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.RemoveUIVisual = function ( visual ) {
		RP_UI.remove(visual);
		if (DBGOUT && SETTINGS.InfoTrace('rpass')) console.log("RP_UI >>>",visual.id.toString(),"removed");
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.RemoveScreenOverlayVisual = function ( visual ) {
		RP_OVER.remove(visual);
		if (DBGOUT && SETTINGS.InfoTrace('rpass')) console.log("RP_OVER >>>",visual.id.toString(),"removed");
	};



///	CAMERA and VIEWPORT //////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.SelectWorld2D = function () {
		VIEWPORT.SelectWorld2D();
		RP_WORLD.camera = VIEWPORT.WorldCam();
		RP_WORLD2.camera = VIEWPORT.WorldCam();
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.SelectWorld3D = function () {
		VIEWPORT.SelectWorld3D();
		RP_WORLD.camera = VIEWPORT.WorldCam();
		RP_WORLD2.camera = VIEWPORT.WorldCam();
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.Viewport = function () {
		return VIEWPORT;
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.Resize = function ( w, h ) {
		window.SYS1401.glSize(w,h);
	};


///	BACKGROUND IMAGE /////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.SetBackgroundImage = function ( texturePath, callback, callee ) {

		SETTINGS.XSSTextureCheck (texturePath);

		var bgMap = THREE.ImageUtils.loadTexture(texturePath,THREE.UVMAPPING, mi_SaveHeight);
		var bgMat = new THREE.SpriteMaterial( {map:bgMap} );
		if (BG_SPRITE) this.RemoveBackgroundVisual(BG_SPRITE);
		BG_SPRITE = new THREE.Sprite(bgMat);
		BG_SPRITE.position.set(0,0,-999); // clip for 2D is 1000
		this.AddBackgroundVisual(BG_SPRITE);
	
		function mi_SaveHeight(texture) {
			BG_SPRITE.scale.set(texture.image.width,texture.image.height,1);
			if (callback) callback.call(callee, texture);
		}

	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.CurrentBackground = function () {
		if (BG_SPRITE) {
			return BG_SPRITE;
		} else {
			console.warn('CurrentBackground: no bg sprite is set');
			return undefined;
		}
	};


///	RETURN RENDERPASSES //////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.RenderPasses = function () {
		return {
			RP_BG 		: RP_BG,
			RP_WORLD 	: RP_WORLD,
			RP_WORLD2 	: RP_WORLD2,
			RP_UI 		: RP_UI,
			RP_OVER 	: RP_OVER
		};
	};


/// RAYCASTING CLICK SUPPORT///////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.EnableMousePicks = function () {
		if (!PICK_SUBSCRIBERS) {
			PICK_SUBSCRIBERS = [];
			$(VIEWPORT.WebGL().domElement).click(m_CastRay);
		} else {
			console.error("MousePicking already enabled");
		}
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.SubscribeToMousePicks = function ( func ) {

		// make sure a function is provided
		if (!(func instanceof Function)) return; 
		// fail if EnableMousePicks() wasn't called first
		if (!PICK_SUBSCRIBERS) {
			console.error("Renderer.EnableMousePicks() must be called before subscribing");
			return;
		}

		// add function to subscribers if it's not already one
		if (PICK_SUBSCRIBERS.indexOf(func) < 0) {
			PICK_SUBSCRIBERS.push(func);
		} else {
			console.log("SubscribeToMousePicks:","duplicate subscription ignored",func.toString());
			return;
		}
	};



/// SUPPORT FUNCTIONS ///////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Handles clicks on objects in the world
/*/	function m_CastRay ( event ) {
		event.preventDefault();

		// requires ThreeJS R69 or greater

		// mouse->world position
		var offset = $(event.currentTarget).offset();
		// normalize to -1 to 1
		// this appears to be threejs convention, though our coordinates in the world
		var dim = VIEWPORT.Dimensions();
		var x =  (((event.pageX-offset.left) / dim.scaledWidth)-0.5)*2;
		var y = -(((event.pageY-offset.top) / dim.scaledHeight)-0.5)*2;
		var vector = new THREE.Vector3(x, y, -1);

		// current camera, objects
		var camera = VIEWPORT.WorldCam();

		/*/	NOTE:
			we are using an orthographic camera setup that differs from most
			orthographic example setups (not using screen coordinates), 
			so the typical raycasting algorithms aren't working out of the box. Plus
			our version of threeJS is R67, and raycasting changed in R69.
			So I'm doing a 2D-only walk of our pieces 
		/*/

		var raycaster, dir;

		if (camera instanceof THREE.OrthographicCamera) {

			dir = new THREE.Vector3();
			raycaster = new THREE.Raycaster();

			vector.unproject(camera);
			dir.set(0,0,-1).transformDirection(camera.matrixWorld);
			raycaster.set(vector,dir);

		} else {
			console.error("perspective camera raypicking is not yet implemented");
		}

		var objects = RP_WORLD.children;
		var intersections = raycaster.intersectObjects(objects);

		var type = (camera instanceof THREE.PerspectiveCamera) ? 'PerspectiveCam' : 'OrthoCam';
		if (intersections.length) {
			// console.log(type,'('+x.toFixed(2)+', '+y.toFixed(2)+')',intersections);
			for (var i=0;i<PICK_SUBSCRIBERS.length;i++) {
				var func = PICK_SUBSCRIBERS[i];
				func.call( null, intersections );
			}
		}
	}

	window.dbg_capscrn = function () {
		API.CaptureJPEG(function(jpg){
			var img = $("<img src='"+jpg+"' style='padding:4px;float:left;width:100px;height:100px'>");
			$('#debug').append(img);
		});
		return "capturing data";
	};

///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE DEFINITION FOR REQUIREJS ***********************************/
	return API;

});