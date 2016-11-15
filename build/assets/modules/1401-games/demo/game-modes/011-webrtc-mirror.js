/* demo/test/011-webrtc-mirror.js */
define ([
	'keypress',
	'howler',
	'1401/objects/sysloop',
	'1401/settings',
	'1401/system/renderer',
	'1401/system/screen',
	'1401/system/visualfactory',
	'1401/system/piecefactory',
	'1401-games/demo/modules/controls',
	SYS1401.LocalPath('game-modes/lib/webrtc')
], function ( 
	KEY,
	HOWLER,
	SYSLOOP,
	SETTINGS,
	RENDERER,
	SCREEN,
	VISUALFACTORY,
	PIECEFACTORY,
	SHIPCONTROLS,
	WEBRTC
) {

	var DBGOUT = true;

///////////////////////////////////////////////////////////////////////////////
/**	SUBMODULE TEST 011 *******************************************************\
	source codebase: TEST 010
	
	WebRTC mirroring. Can we grab the WebGL canvas and stream it to a video
	destination on the same page? If we can do that, can we stream it to
	another webpage?


///////////////////////////////////////////////////////////////////////////////
/** MODULE DECLARATION *******************************************************/

	var MOD = SYSLOOP.New("Test11");

	MOD.EnableUpdate( true );
	MOD.EnableInput( true );

	MOD.SetHandler( 'Initialize', m_Initialize );
	MOD.SetHandler( 'Construct', m_Construct );
	MOD.SetHandler( 'Start', m_Start );
	MOD.SetHandler( 'GetInput', m_GetInput);
	MOD.SetHandler( 'Update', m_Update);


///////////////////////////////////////////////////////////////////////////////
/** PRIVATE VARS *************************************************************/

	var crixa;				// ship piece
	var crixa_inputs;		// encoded controller inputs
	var starfields = [];	// parallax starfield layersey

	var snd_pewpew;			// sound instance (howler.js)
	var snd_music;


///////////////////////////////////////////////////////////////////////////////
/** MODULE HANDLER FUNCTIONS *************************************************/

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function m_Initialize() {
		// instead of initializing renderer directly,
		// use SCREEN which will initialize it for us
		var cfg = {
			renderViewport 	: 'fixed',		// 'fixed', 'scaled', or 'fluid'
			renderWidth 	: 256,			// width of viewport
			renderHeight 	: 256,			// height of viewport
			renderUnits 	: 256			// world units visible in viewport
		};
		SCREEN.CreateLayout( cfg );

		// invoke webrtc feature testing init
		WEBRTC.Initialize();
	}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function m_Construct() {

			var i, platform;

			RENDERER.SelectWorld3D();
			var cam = RENDERER.Viewport().WorldCam3D();
			var z = cam.position.z;
			var fog = new THREE.Fog(0x000000,z-100,z+50);
			RENDERER.SetWorldVisualFog(fog);

			/* add lights so mesh colors show */
			var ambientLight = new THREE.AmbientLight(0x222222);
			RENDERER.AddWorldVisual(ambientLight);

			var directionalLight = new THREE.DirectionalLight(0xffffff);
			directionalLight.position.set(1, 1, 1).normalize();
			RENDERER.AddWorldVisual(directionalLight);

			/* make starfield */
			var starBright = [ 
				new THREE.Color( 1.0, 1.0, 1.0 ),
				new THREE.Color( 0.5, 0.5, 0.7 ),
				new THREE.Color( 0.3, 0.3, 0.5 )
			];
			var starSpec = {
				parallax: 1
			};		
			starfields = [];
			for (i=0;i<3;i++) {
				starSpec.color=starBright[i];
				var sf = VISUALFACTORY.MakeStarField( starSpec );
				starSpec.parallax *= 0.5;
				sf.position.set(0,0,-100-i);
				RENDERER.AddBackgroundVisual(sf);
				starfields.push(sf);
			}

			/* make crixa ship */
			var shipSprite = VISUALFACTORY.MakeDefaultSprite();
			shipSprite.SetZoom(1.0);
			RENDERER.AddWorldVisual(shipSprite);
			var seq = {
				grid: { columns:2, rows:1, stacked:true },
				sequences: [
					{ name: 'flicker', framecount: 2, fps:4 }
				]
			};
			shipSprite.DefineSequences(SETTINGS.AssetPath('../demo/resources/crixa.png'),seq);
			// shipSprite.PlaySequence("flicker");
			crixa = PIECEFACTORY.NewMovingPiece("crixa");
			crixa.SetVisual(shipSprite);
			crixa.SetPositionXYZ(0,0,0);

			// add extra shooting command
			crixa.Shoot = function ( bool ) {
				if (bool) {
					// snd_pewpew.play();
					console.log(this.name,"shoot bullet");
					// create a new bullet 
					var bp = PIECEFACTORY.NewMovingPiece();
					bp.body.radius = bp.body.geometry.radius = 2;
					bp.body.mass = 0.1;
					// var bvis = VISUALFACTORY.MakeDefaultSprite();
					var sprPath = SETTINGS.AssetPath('../demo/resources/bullet32-blue.png');
					var bvis = VISUALFACTORY.MakeStaticSprite( sprPath, function () {
						bvis.SetZoom(1);
					});
					bp.SetVisual(bvis);	
					RENDERER.AddWorldVisual(bvis);

					// this.state.pos (Physics.vector) The position vector.
					// this.state.vel (Physics.vector) The velocity vector.
					// this.state.acc (Physics.vector) The acceleration vector.
					// this.state.angular.pos (Number) The angular position (in radians, positive is clockwise starting along the x axis)
					// this.state.angular.vel (Number) The angular velocity
					// this.state.angular.acc (Number) The angular acceleration					
					var vel = PHYSICS.vector(0.4, 0);
					vel.rotate(this.body.state.angular.pos);
					vel.vadd(this.body.state.vel);
					bp.body.state.vel = vel;

					bp.body.state.angular.pos = this.body.state.angular.pos;
					var hardpoint = PHYSICS.vector(15,0);
					hardpoint.rotate(this.body.state.angular.pos);
					hardpoint.vadd(this.body.state.pos);
					bp.body.state.pos = hardpoint;

					// tag bullet
					bp.body.isBullet = true;
				}
			};

			// demonstration of texture validity
			var textureLoaded = crixa.Visual().TextureIsLoaded();
			console.log("SHIP TEXTURE LOADED TEST OK?",textureLoaded);
			if (textureLoaded) {
				console.log(". spritesheet dim",crixa.Visual().TextureDimensions());
				console.log(". sprite dim",crixa.Visual().SpriteDimensions());
			} else {
				console.log(".. note textures load asynchronously, so the dimensions are not available yet...");
				console.log(".. sprite class handles this automatically so you don't have to.");
			}

			// make sprites
			for (i=0;i<3;i++) {
				platform = VISUALFACTORY.MakeStaticSprite(
					SETTINGS.AssetPath('../demo/resources/teleport.png'),
					do_nothing
				);
				platform.SetZoom(1.0);
				platform.position.set(0,100,100-(i*50));
				RENDERER.AddWorldVisual(platform);
			}

			for (i=0;i<3;i++) {
				platform = VISUALFACTORY.MakeStaticSprite(
					SETTINGS.AssetPath('../demo/resources/teleport.png'),
					do_nothing
				);
				platform.position.set(0,-125,100-(i*50));
				platform.SetZoom(1.25);
				RENDERER.AddWorldVisual(platform);
			}

			function do_nothing () {}

			// load sound
			var sfx = SETTINGS.AssetPath('../demo/resources/pewpew.ogg');
			snd_pewpew = new Howl({
				urls: [sfx]
			});

		// test WebRTC stuff here
		WEBRTC.Construct();

	}

///	HEAP-SAVING PRE-ALLOCATED VARIABLES /////////////////////////////////////

	var x, rot, vp, layers, i, sf;
	var cin;

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function m_Start() {
		SHIPCONTROLS.BindKeys();

		window.DBG_Out( "TEST 11 <b>WEBRTC STREAM TESTS</b>" );
		window.DBG_Out( "<tt>game-main include: 1401-games/demo/tests/011</tt>" );

		// test WebRTC stuff here
		WEBRTC.Start();
	}	

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function m_GetInput ( interval_ms ) {
		cin = crixa_inputs = SHIPCONTROLS.GetInput();
		if (!!crixa_inputs.forward_acc) {
			crixa.Visual().GoSequence("flicker",1);
		} else {
			crixa.Visual().GoSequence("flicker",0);
		}
		crixa.Accelerate(cin.forward_acc,cin.side_acc);
		crixa.Brake(crixa_inputs.brake_lin);
		crixa.AccelerateRotation(cin.rot_acc);
		crixa.BrakeRotation(crixa_inputs.brake_rot);
		crixa.Shoot(SHIPCONTROLS.Fire());
	}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	var counter = 0;
	var dx = 3;
	function m_Update ( interval_ms ) {

		vp = RENDERER.Viewport();
		vp.Track(crixa.Position());


		/* rotate stars */	
		layers = starfields.length;
		for (i=0;i<starfields.length;i++){
			sf = starfields[i];
			sf.Track(crixa.Position());
		}

		counter += interval_ms;
	}


///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE DEFINITION FOR REQUIREJS ***********************************/
	return MOD;

});
