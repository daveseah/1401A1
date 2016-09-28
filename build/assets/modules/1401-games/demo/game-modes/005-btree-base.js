/* demo/test/005.js */
define ([
	'keypress',
	'physicsjs',
	'1401/objects/sysloop',
	'1401/settings',
	'1401/system/renderer',
	'1401/system/screen',
	'1401/system/visualfactory',
	'1401/system/piecefactory',
	'1401-games/demo/modules/controls',
	'1401-games/demo/modules/ai'
], function (
	KEY,
	PHYSICS,
	SYSLOOP,
	SETTINGS,
	RENDERER,
	SCREEN,
	VISUALFACTORY,
	PIECEFACTORY,
	SHIPCONTROLS,
	AITEST
) {

	var DBGOUT = true;

///////////////////////////////////////////////////////////////////////////////
/**	SUBMODULE TEST 005 *******************************************************\

	This test module exercises the behavior tree system through
	ai.js.

///////////////////////////////////////////////////////////////////////////////
/** MODULE DECLARATION *******************************************************/

	var MOD = SYSLOOP.New("Test05");

	MOD.SetHandler( 'Initialize', m_Initialize );
	MOD.SetHandler( 'Construct', m_Construct );
	MOD.SetHandler( 'Start', m_Start );

	MOD.EnableInput( true );
	MOD.SetHandler( 'GetInput', m_GetInput);
	MOD.EnableUpdate( true );
	MOD.SetHandler( 'Update', m_Update);


///////////////////////////////////////////////////////////////////////////////
/** PRIVATE VARS *************************************************************/

	var crixa;				// ship piece
	var crixa_inputs;		// encoded controller inputs
	var starfields = [];	// parallax starfield layersey


///////////////////////////////////////////////////////////////////////////////
/** MODULE HANDLER FUNCTIONS *************************************************/

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function m_Initialize() {
		// instead of initializing renderer directly,
		// use SCREEN which will initialize it for us
		var cfg = {
			mode 			: 'fixed',		// 'fixed', 'scaled', or 'fluid'
			renderWidth 	: 512,			// width of viewport
			renderHeight 	: 512,			// height of viewport
			worldUnits 		: 512			// world units visible in viewport
		};
		SCREEN.CreateLayout( cfg );

	}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function m_Construct() {

	        var i, platform;

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

			for (i=0;i<3;i++) {
				platform = VISUALFACTORY.MakeStaticSprite(
					SETTINGS.AssetPath('../demo/resources/teleport.png'),
					do_nothing
				);
				platform.position.set(0,100,100-(i*50));
				RENDERER.AddWorldVisual(platform);
			}

			for (i=0;i<3;i++) {
				platform = VISUALFACTORY.MakeStaticSprite(
					SETTINGS.AssetPath('../demo/resources/teleport.png'),
					do_nothing
				);
				platform.position.set(0,-100,100-(i*50));
				RENDERER.AddWorldVisual(platform);
			}

			function do_nothing () {}

	}

///	HEAP-SAVING PRE-ALLOCATED VARIABLES /////////////////////////////////////

	var x, rot, vp, layers, i, sf;
	var cin;

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function m_Start() {
		RENDERER.SelectWorld3D();
		SHIPCONTROLS.BindKeys();

		// ai testing temporary stuff
        AITEST.BehaviorInitialize(crixa);

		window.DBG_Out( "TEST 005 <b>Behavior Tree AI</b>" );
		window.DBG_Out( "<tt>game-main include: 1401-games/demo/tests/005</tt>" );
		window.DBG_Out( "This is a work in progress." );

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
