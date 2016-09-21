// add extra game-related paths
SYS1401.AddModulePath( '1401', '1401' );
SYS1401.AddModulePath( '1401-games', '1401-games');
SYS1401.AddModulePath( 'yaml', 'vendor/yaml.js/yaml','YAML' );
SYS1401.AddModulePath( 'three', 'vendor-extra/three.min','THREE' );
SYS1401.AddModulePath( 'physicsjs', 'vendor/physicsjs/physicsjs-full.min' );
SYS1401.UpdateModulePaths();
define ([
	'plugins/router',
	'1401/system/debug',
	'1401/settings',
	'1401/objects/sysloop',
	'1401/system/autosystem',
	'1401/objects/logic/checkinmonitor'
], function (
	router,
	DEBUG,
	SETTINGS,
	SYSLOOP,
	AUTOSYS,
	CheckInMonitor
) {

	var DBGOUT = true;

///////////////////////////////////////////////////////////////////////////////
/**	GAME MASTER *************************************************************\

	Initializes and launches the game system.
	Controls the master timestep.

	The system loads "games" that are located in the 1401-games directory.
	The path to the 'game-run' module is inferred from the Durandal route,
	and it is dynamically loaded and run.

	MASTER is responsible for initializing all the support services that
	a game module can access. Game modules are objects with an interface
	called SYSLOOP which defines high-level game events such as Initialize,
	LoadAssets, Start, and Step. 


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

		// save the viewmodel
		if (!viewModel) {
			console.error("Master.Start: A Durandal viewmodel must be provided");
			return;
		}
		m_viewmodel = viewModel;

		// Get the 1401-game module path by parsing the router's 
		// moduleId (defined in shell.js router navigation array)
		var moduleId = router.activeInstruction().config.moduleId;
		moduleId = moduleId.substring(0,moduleId.lastIndexOf("/"));

		// extend magic SYS1401 helper object with LocalPath()
		// has to be set here because SETTINGS must be loaded
		SYS1401.LocalPath = function (moduleId) {
		    if (!moduleId) throw "SYS1401.LocalRequire() expects a moduleId";
		    if (!moduleId.endsWith('.js')) moduleId += '.js';
		    return '/'+SETTINGS.GamePath(moduleId);
		};

		// load master settings asynchronously, then load game module
		SETTINGS.Load (SETTINGS.SettingsURI(), _master, function () {
			// select game to load
			m_GameLoad ( moduleId, viewModel );
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
/*/	Given the moduleId, look for corresponding folder in the
	activities directory, and load asyncronously.
	TODO: Make re-entrant proof
/*/	function m_GameLoad ( moduleId, viewModel ) {
		SETTINGS._Initialize( moduleId, viewModel );
		var module_path = SETTINGS.GameMainModulePath( moduleId );
		m_game = null;

		/* load game module asynchronously */
		// this breaks with mimosa build -omp
		var str = module_path;
		if (module_path.length>32) 
			str = module_path.substr(module_path.length-32);
		console.log ("DYNAMIC LOAD ..."+str);
		// module loaded in module_path is passed to m_GameInstantiated
		require ( [module_path], m_GameInstantiated );
		// ...execution continues in m_GameInstantiate()
	}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Called after m_GameLoad's require has loaded the module.
	Load game settings file first...
/*/	function m_GameInstantiated ( loadedModule ) {
		console.groupEnd();
		console.group('Game Startup');

		m_game = loadedModule;
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
				// there is only one master step, defined in game-run.js
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


