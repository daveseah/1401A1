define ([
	'1401/settings',
	'1401/objects/sysloop',
	'1401/system/autosystem',
	'1401/objects/logic/checkinmonitor',
	'1401-games/_empty/game-main'
], function (
	SETTINGS,
	SYSLOOP,
	AUTOSYS,
	CheckInMonitor,
	DEFAULT_GAME
) {

	var DBGOUT = true;

	// Set this to TRUE if not setting a DEFAULT_GAME
	// Dynamic loading breaks code optimization if you are trying to use it
	var USE_DYNAMIC_LOADING = true;

///////////////////////////////////////////////////////////////////////////////
/**	GAME MASTER *************************************************************\

	Initializes and launches the game system.
	Also maintains the time step.

	The system loads "games" that are located in the 1401-apps directory,
	and loads the 'game-main' module to start.


///////////////////////////////////////////////////////////////////////////////
/** PUBLIC API **************************************************************/

	var MASTER = {};			// module API object
	var _master = this;			// reference to 'this'


//	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	This is called by the associated viewmodel on composition.Complete
	The viewModel and gameId are passed for safekeeping
/*/	MASTER.Start = function ( viewModel ) {
		console.group('Master Startup');

		if (SETTINGS.DEBUG_AI) {
			var msg = "\n";
			msg += "********************************\n";
			msg += " AI STEP DEBUG MODE IS ENABLED!\n";
			msg += " USE AI STEP KEY (ALT-1)\n";
			msg += "********************************\n";
			msg += "\n";
			console.log(msg);
		}

		if (!viewModel) {
			console.error("Master.Start: A Durandal viewmodel must be provided");
			return;
		}
		m_viewmodel = viewModel;

		if (!viewModel.gameId) {
			console.error('Master.Start: ViewModel is missing gameId parameter.');
			return;
		}

		// load master settings asynchronously then load game module
		SETTINGS.Load (SETTINGS.SettingsURI(), _master, function () {
			// select game to load
			m_GameLoad ( viewModel.gameId, viewModel );
		});

		// ...execution continues in m_GameLoad()

	};


///////////////////////////////////////////////////////////////////////////////
/** MODULE PRIVATE VARIABLES *************************************************/

	var m_game_path = null;		// current path to game
	var m_game = null;			// current game
	var m_viewmodel = null;		// parent viewmodel

	var m_timeout_id;			// used for LoadAssets timeout

	var m_timer_id;
	var m_current_time_ms = 0;	// global timer
	var m_interval_ms = SETTINGS('TIMESTEP');
	var m_current_frame_num = 0;	


///////////////////////////////////////////////////////////////////////////////
/** SUPPORTING PRIVATE FUNCTIONS *********************************************/

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Given the gameId, look for corresponding folder in the
	activities directory, and load asyncronously.
	TODO: Make re-entrant proof
/*/	function m_GameLoad ( gameId, viewModel ) {
		SETTINGS._Initialize( gameId, viewModel );
		var module_path = SETTINGS.GameMainModulePath( gameId );
		m_game = null;

		/* load game module asynchronously */
		if (USE_DYNAMIC_LOADING) {
			// this breaks with mimosa build -omp
			var str = module_path;
			if (module_path.length>32) 
				str = module_path.substr(module_path.length-32);
			console.log ("DYNAMIC LOAD ..."+str);
			console.log(module_path);
			require ( [module_path], m_GameInstantiated );
		} else {
			console.log("!!! STATIC LOAD", DEFAULT_GAME.name.bracket());
			m_GameInstantiated ( DEFAULT_GAME );
		}
		// ...execution continues in m_GameInstantiate()

		
	}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Called after m_GameLoad's require has loaded the module.
	Load game settings file first...
/*/	function m_GameInstantiated ( loadedGame ) {
		console.groupEnd();
		console.group('Game Startup');

		m_game = loadedGame;
		var gameSettings = SETTINGS.GameSettingsURI();
		SETTINGS.Load(gameSettings, _master, m_GameInitialize);

		// ...execution continues in m_GameInitialize()
	}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Initialize game data structures now that settings are loaded
/*/	function m_GameInitialize () {

		SYSLOOP.ConnectAll ( m_viewmodel );

		AUTOSYS.Initialize();
		SYSLOOP.InitializeAll();

		var cim = new CheckInMonitor( _master, function () {
			clearInterval(m_timeout_id);
			// ...execution continues in m_gameConstructAndStart()
			m_GameConstructAndStart();
		});

		AUTOSYS.LoadAssets( cim.NewCheckIn('master.autosys') );
		SYSLOOP.LoadAssetsAll ( cim.NewCheckIn('master.sysloop') );
		cim.Activate();

		m_timeout_id = setInterval(function(){
			console.log('Still waiting for LoadAssets to complete...');
			console.log(cim.Status().string);
		}, 5000);

	}
	
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Resume game loading process...
/*/	function m_GameConstructAndStart () {

		SYSLOOP.ConstructAll ();

		// initialize time!
		m_current_time_ms = 0;
		SETTINGS._SetMasterTime(m_current_time_ms);
		SETTINGS._SetMasterFrame(m_current_frame_num);

		SYSLOOP.StartAll ( m_current_time_ms );


		// game will get called on every Step() from here on out
		m_timer_id = setInterval( m_TimeStep, m_interval_ms );
		
		console.groupEnd();
		if (DBGOUT) console.log("*** BEGIN RUN LOOP ***");
	}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Resume game loading process...
/*/	function m_TimeStep() {
		if (!m_game) return;

		try {
			// update mastertime
			SETTINGS._SetMasterTime ( m_current_time_ms );
			SETTINGS._SetMasterFrame ( m_current_frame_num );

			// step the game
			if (m_game.IsRunning()) {
				AUTOSYS.HeartBeat( m_interval_ms );
				// there is only one master step, defined in game-main.js
				SYSLOOP.GameStep( m_interval_ms );
				// note that GameStep is responsible for calling
				// GetInput, Update, Think, etc in the correct order
			}
			
			// update mastertime counter
			m_current_time_ms += m_interval_ms;
			m_current_frame_num++;

			// unset debug step
			if (SETTINGS.DEBUG_TRACE_BY_KEY) {
				SETTINGS.DEBUG_AI_STEP = false;		
			}
			if (SETTINGS.DEBUG_INTERVAL>0) {
				clearInterval(m_timer_id);
				m_timer_id = setInterval( m_TimeStep, SETTINGS.DEBUG_INTERVAL );
				SETTINGS.DEBUG_INTERVAL = 0;
			}
		} catch (e) {
			console.error(e.stack);
			throw new Error(e);
		}

	}


///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE DEFINITION FOR REQUIREJS ***********************************/

	return MASTER;

});
