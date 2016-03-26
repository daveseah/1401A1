/* demo/test/008.js */
define ([
	'keypress',
	'physicsjs',
	'1401/objects/sysloop',
	'1401/settings',
	'1401/system/renderer',
	'1401/system/visualfactory',
	'1401/system/piecefactory',
	'1401-games/demo/modules/controls',	
	'1401/objects/logic/timer'
], function (
	KEY,
	PHYSICS,
	SYSLOOP,
	SETTINGS,
	RENDERER,
	VISUALFACTORY,
	PIECEFACTORY,
	SHIPCONTROLS,
	Timer
) {

	var DBGOUT = true;

///////////////////////////////////////////////////////////////////////////////
/**	SUBMODULE TEST 005 *******************************************************\

	This test module exercises the behavior tree system through
	ai.js.

///////////////////////////////////////////////////////////////////////////////
/** MODULE DECLARATION *******************************************************/

	var MOD = SYSLOOP.New("Test03");
	MOD.EnableUpdate( true );
	MOD.EnableInput( true );

	MOD.SetHandler( 'Construct', m_Construct );
	MOD.SetHandler( 'Start', m_Start );
	MOD.SetHandler( 'GetInput', m_GetInput);
	MOD.SetHandler( 'Update', m_Update);


///////////////////////////////////////////////////////////////////////////////
/** PRIVATE VARS *************************************************************/

	var crixa;				// ship piece
	var crixa_inputs;		// encoded controller inputs
	var starfields = [];	// parallax starfield layersey

	var num_timers = 10;	// number of timers to create and test
	var num_modetests = 4;
	var num_extra = 1;
	var tOneShot;
	var tRepeat;
	var tCounter;
	var tTiming;
	var tPaused;

///////////////////////////////////////////////////////////////////////////////
/** MODULE HANDLER FUNCTIONS *************************************************/

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function m_Construct() {
		console.log("*** ALLOCATING",num_timers,"TIMERS");
		Timer.InitializePool(num_timers + num_modetests + num_extra);

		console.log("*** BUILDING SPACE ENVIRONMENT");
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
	}

///	HEAP-SAVING PRE-ALLOCATED VARIABLES /////////////////////////////////////

	var x, rot, vp, layers, i, sf;
	var cin;

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function m_Start() {
		RENDERER.SelectWorld3D();
		SHIPCONTROLS.BindKeys();

		window.DBG_Out( "TEST 008 <b>Debug Timer</b>" );
		window.DBG_Out( "<tt>game-main include: 1401-games/demo/tests/008</tt>" );

		console.log("*** test pausing");
		tPaused = Timer.NewTimer();
		tPaused.Start(5000,20000);
		tPaused.SetNotifyDelayed(function(t){
			console.log('*** TPAUSED START 5000 ms');
			setTimeout(function(){
				// pause after 3 seconds
				console.log('*** TPAUSED pausing 2500 ms');
				tPaused.Pause();
				setTimeout(function(){
					// unpause after 2.5 seconds.
					console.log('*** TPAUSED resuming...');
					tPaused.UnPause();
				},2500);
			},3000);
		});
		tPaused.SetNotifyComplete(function(t) {
			console.log('*** TPAUSED TimeElapsed(), TimePaused()',t.TimeElapsed(),t.TimePaused());
			console.log('timeElapsed-timePaused = time spent running (should be 5000):',t.TimeElapsed()-t.TimePaused());
		});

		console.log("*** Setting Random Timer Durations");
		for (var i=0;i<num_timers;i++) {
			var timer = Timer.NewTimer();
			timer.SetModeOneShot();
			timer.SetNotifyComplete(disposeMe);
			var dur = Math.floor(Math.random()*4000+1000);
			var del = Math.floor(Math.random()*5000);
			console.log("starting timer",timer.id,'dur/delay',dur,del);
			timer.Start(dur,del);
		}
		function disposeMe(t) {
			console.log('completed',t.id,'now disposing');
			t.Dispose();
		}

		// mode tests
		console.log("*** Setting single test timer");

		tOneShot = Timer.NewTimer();
		tOneShot.Start(1000,10000);
		tOneShot.SetNotifyDelayed(notifyDelayed);
		tOneShot.SetNotifyComplete(notifyComplete);
		tOneShot.SetNotifyRepeat(notifyRepeat);

		tRepeat = Timer.NewTimer();
		tRepeat.SetModeRepeat( 3 );
		tRepeat.SetNotifyDelayed(notifyDelayed);
		tRepeat.SetNotifyComplete(notifyComplete);
		tRepeat.SetNotifyRepeat(notifyRepeat);
		tRepeat.Start(1000,10000);

		tCounter = Timer.NewTimer();
		tCounter.SetModeCounter();
		tCounter.SetNotifyDelayed(notifyDelayed);
		tCounter.SetNotifyComplete(notifyComplete);
		tCounter.SetNotifyRepeat(notifyRepeat);
		tCounter.Start(1000,10000);

		tTiming = Timer.NewTimer();
		tTiming.SetModeTiming();
		tTiming.SetNotifyDelayed(notifyDelayed);
		tTiming.SetNotifyComplete(notifyComplete);
		tTiming.SetNotifyRepeat(notifyRepeat);
		tTiming.Start(1000,10000);

		console.log('***',tOneShot.id,'is OneShot');
		console.log('***',tRepeat.id,'is Repeat 3 times');
		console.log('***',tCounter.id,'is Counting');
		console.log('***',tTiming.id,'is Timing');
		console.log('***','time/remaining count/remaining');

		function notifyDelayed (timer) {
			console.log(timer.id,'mode-'+timer.mode,'delay start');
		}
		function notifyComplete (timer) {
			console.log(timer.id,'mode-'+timer.mode,'complete');
		}
		function notifyRepeat (timer) {
			console.log(timer.id,'mode-'+timer.mode,'repeat');
		}

		var status = setInterval( function () {
			// do status traces only for first 15 seconds
			if (tTiming.TimeElapsed()>10000) return;
			console.log(info(tOneShot)+' - '+info(tRepeat)+' - '+info(tCounter)+' - '+info(tTiming));
		},1000);
			
		function info(timer) {
			var str = timer.id+":";
			str += timer.TimeElapsed()+'/'+timer.TimeRemaining()+' ';
			str += timer.Count()+'/'+timer.CountRemaining();
			return str;
		}

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
