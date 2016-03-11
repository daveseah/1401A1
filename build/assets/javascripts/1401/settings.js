/* 1401.settings */
define ([
	'yaml',
	'three'
], function ( 
	YAML,
	THREE
) {

///////////////////////////////////////////////////////////////////////////////
/**	MASTER SETTINGS *********************************************************\
//////////////////////////////////////////////////////////////////////////////
	
	Contains global settings, properties, constants

	The actual global values are stored in an inaccessible object called
	S. 

	Note that this module returns a FUNCTION, which also has additional
	functions attached to it. To retrieve/set a property:
		var val = SETTINGS('propname');
		SETTINGS.Set('propname', value);


//////////////////////////////////////////////////////////////////////////////
/** MODULE PRIVATE VARIABLES ************************************************/
//////////////////////////////////////////////////////////////////////////////

	var VIEW_MODEL;			// durandal viewmodel reference

	// these variables are dereferenced from S object for
	// speed (though it's probably not important at all to do this)

	var CURRENT_TIME_MS;	// current time in milliseconds
	var CURRENT_FRAME_NUM;	// current frame number (for debugging)

	// set constant paths
	var PATH_1401 		= '/1401/';
	var PATH_1401_GAMES	= '/1401-games/';
	var URI_1401 		= '/javascripts'+PATH_1401;
	// this gets GameID() added during InitializePaths()
	var URI_GAME_DIR 	= '/javascripts'+PATH_1401_GAMES;
	var FILE_SYS_SET 	= 'settings.yaml';
	var MOD_GAME_RUN 	= 'game-main';	
	var FILE_GAME_SET 	= 'game-settings.yaml';

	// game-specific paths are loaded via m_InitializeGamePaths()
	// and rely on GAME_ID being set
	var GAME_ID;			// game id string (e.g. "demo")


///	ADD DEFAULT KEY,VALUES ///////////////////////////////////////////////////

	var S = {};		// global system property object

	/* master timimg */
	S.FPS = 30;
	S.TIMESTEP = Math.floor(1000 / S.FPS);


//////////////////////////////////////////////////////////////////////////////
/** PUBLIC API **************************************************************/
//////////////////////////////////////////////////////////////////////////////

///	BASIC PROPERTY SETTING/GETTING
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Retrieve value of associated property
/*/	var SETTINGS = function ( key ) {
		var value = S[key];
		if (!value)
			console.error("Requested key",key.bracket(),"doesn't exist!");
		return value;
	};
	SETTINGS.name = "1401.settings";
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Explicit Get method for use by subclassers or fans of symmetry
/*/	SETTINGS.Get = SETTINGS;
	
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Set the value of a key
/*/	SETTINGS.Set = function ( key, value ) { 
		if (S[key]) 
			console.warn ('overwriting',key.bracket(),'with new value ['+value+']');
		S[key]=value;
	};

/// 1401 Debug Trace Flags (set in master.yaml)
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/ Look for trace flags in system1401.dbg_trace
/*/	SETTINGS.InfoTrace = function ( key ) {
		var sys = S.system1401;
		if (!sys) return false;
		var trace = sys.info_trace;
		if (!trace) return false;
		return (trace[key]===true);
	};

/// SYSTEM INITIALIZATION ////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SETTINGS._Initialize = function ( gameId, viewModel ) {
		if (VIEW_MODEL) {
			// if VIEW_MODEL is defined, then we need to reload
			// this application because a new tab was clicked
			location.reload();
		}
		m_InitializeMeta ( gameId, viewModel );
		m_InitializeGamePaths();

	};


/// SYSTEM PROPERTIES ////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	for use only by extending classes of settings!
/*/	SETTINGS._RawStorage = function () {
		return S;
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	called from master step every frame to update master time. 
/*/	SETTINGS._SetMasterTime = function ( current_time_ms ) {
		if (current_time_ms!==undefined) {
			CURRENT_TIME_MS = current_time_ms;
		}
		return CURRENT_TIME_MS;
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	called from master step every frame to update frame count
/*/	SETTINGS._SetMasterFrame = function ( current_frame_num ) {
		if (current_frame_num!==undefined) {
			CURRENT_FRAME_NUM = current_frame_num;
		}
		return CURRENT_FRAME_NUM;
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Return the master time, in milliseconds. Used by system-related services;
	Games should use the Timer class instead.
/*/	SETTINGS.MasterTime = function () {
		if (CURRENT_TIME_MS===undefined) {
			console.log("*** WARN *** MasterTime() was called before system startup. Returning 0ms.");
			return 0;
		}
		return CURRENT_TIME_MS;
	};
	SETTINGS.MasterFrame = function () {
		if (CURRENT_FRAME_NUM===undefined) {
			console.log("*** WARN *** MasterFrame() was called before system startup. Returning 0ms.");
			return 0;
		}
		return CURRENT_FRAME_NUM;
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Return current game's viewmodel for KnockOut, etc purposes
/*/	SETTINGS.AppViewModel = function () { return VIEW_MODEL; };
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Return current 1401 settings path for asset load
/*/	SETTINGS.SettingsURI = function () {
		return URI_1401+FILE_SYS_SET;
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Return current game directory path, with <extra> added.
/*/	SETTINGS.GamePath = function ( extra ) {
		extra = extra || '';
		if (URI_GAME_DIR===undefined) 
			console.error("GamePath is invalid before MasterGameLoad");
		return URI_GAME_DIR+extra;
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Return current game directory path, with <extra> added.
	Useful for loading assets in the game directory. Checks if extra is
	a URL and returns that so remote assets can be fetched; make sure
	to initialize Renderer with crossOrigin:true to use URLs
/*/	SETTINGS.AssetPath = function ( extra ) {
		extra = extra || '';
		if ((extra.length>0) && (m_IsURL(extra))) return extra;
		if (URI_GAME_DIR===undefined) 
			console.error("AssetPath for local resources is invalid before MasterGameLoad");
		if (extra.length>0) return URI_GAME_DIR+extra;
		console.error("AssetPath requires a string path argument");
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Return current 1401 settings path.
/*/	SETTINGS.GameSettingsURI = function () {
		if (URI_GAME_DIR===undefined) 
			console.error("GamePath is invalid before MasterGameLoad");
		return URI_GAME_DIR+FILE_GAME_SET;
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Return current 1401 GameID
/*/	SETTINGS.GameID = function () {
		if (GAME_ID) return GAME_ID;
		else {
			console.log('GameID is invalid before Master.Start()');
		}
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Return current 1401 system path, with <extra> added.
	Useful for loading assets in the 1401 system directory.
/*/	SETTINGS.SystemURI = function ( extra ) {
		extra = extra || '';
		return URI_1401+extra;
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Return path to game module "main" file, for use with requireJS in
	master.js. Requires a FULL URI for dynamic use.
/*/	SETTINGS.GameMainModulePath = function ( gameId ) {
		gameId = gameId || this.GameID();
		if (URI_GAME_DIR===undefined) 
			console.error("GameMainModule is invalid before MasterGameLoad");
		return URI_GAME_DIR + '/' + MOD_GAME_RUN+'.js';
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Return TRUE if str begins with http:// or https://
/*/	SETTINGS.IsURL = function ( str ) {
		return m_IsURL(str);
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SETTINGS.XSSTextureCheck = function ( path ) {
		var isURL = SETTINGS.IsURL( path );
		if (!isURL) return;  // not a URL? no problem
		if (THREE.ImageUtils.crossOrigin!==undefined) return;
		/* WE HAVE A PROBLEM...ABORT WITH UNHANDLED ERROR */
		throw new Error ("Renderer.Initialize() needs crossOrigin:true to load: "+path);
	};


/// Loading YAML Settings Files /////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Load YAML configuration file asynchronously. Caller should provide
	a callback function to resume execution after the file is parsed,
	otherwise values will not be valid.
/*/	SETTINGS.Load = function ( yamlFilePath, that, callback, failureIsOK ) {

		// console.warn("Settings.Load() can not be called after LoadLocalStorage(). Aborting load:",'<'+yamlFilePath+'>');

		YAML.load( yamlFilePath, function(yobj) {

			// if there's a problem, bail
			if (yobj===null) {
				if (failureIsOK) {
					console.warn("SETTINGS: ignoring missing settings file");
					console.warn(",        ",yamlFilePath);
					callback.call(that,false);
				} else {
					console.error("Could not load 1401 master settings file:",yamlFilePath);
				}
				return;
			}
	
			// otherwise use jquery to recursive copy properties
			$.extend(true, S, yobj);

			// check for mistakes and gotchyas
			m_Validate();

			// print notice on asynch load
			var filename = yamlFilePath.replace(/^.*[\\\/]/, '');
			var str = yamlFilePath;
			if (yamlFilePath.length>32) 
				str = yamlFilePath.substr(yamlFilePath.length-32);
			console.log("SETTINGS LOAD ..."+str);
			// let caller know we're done!
			callback.call(that, true);

		});

	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Load YAML configuration file using newer CheckInMonitor (CIM) convention, 
	which is useful for loading multiple within SYSLOOP.LoadAssets() 
	using sub-CIMs
/*/	SETTINGS.ManagedLoad = function ( yamlFilePath, checkIn ) {
		if (!checkIn) throw new Error ('ManagedLoad req CheckInMonitor object');
		SETTINGS.Load( yamlFilePath, this, function (yobj) { 
			checkIn.Notify(yamlFilePath);
		});
	};



//////////////////////////////////////////////////////////////////////////////
/** MODULE PRIVATE FUNCTIONS ************************************************/
//////////////////////////////////////////////////////////////////////////////

	function m_InitializeMeta ( gameId, viewModel ) {
		GAME_ID = gameId;
		VIEW_MODEL = viewModel;
	}

	function m_InitializeGamePaths() {
		// game path (inside gamesdir)
		URI_GAME_DIR = URI_GAME_DIR + GAME_ID + '/';
	}

	function m_Validate () {
	}

	function m_IsURL ( str ) {
		return (str.indexOf('http://')===0) || (str.indexOf('https://')===0);
	}



//////////////////////////////////////////////////////////////////////////////
/** SNEAKY DEBUG STUFF *******************************************************/
//////////////////////////////////////////////////////////////////////////////
	
	// debug key behavior
	SETTINGS.DEBUG_TRACE_BY_KEY 	= true;
	SETTINGS.DEBUG_SHOW_TIME		= true;
	// polled by BehaviorTree
	SETTINGS.DEBUG_AI 				= false;
	SETTINGS.DEBUG_AI_STEP			= false;
	// polled by master to slow update cycle
	SETTINGS.DEBUG_INTERVAL			= 0;
	SETTINGS.SLOW_FACTOR			= 10;
	SETTINGS.SLOW_MULTIPLE 			= 1;
	// internal debug state switch
	SETTINGS.DEBUG_KEY_STATE 		= false;
	window.DBGKEY = false;

	window.onkeydown = function (e) {
		if (!SETTINGS.DEBUG_TRACE_BY_KEY) return;
		if (!e) e = window.event;
		if (!e.altKey) return;

		if (!SETTINGS.DEBUG_KEY_STATE) {
			SETTINGS.DEBUG_KEY_STATE = true;
			window.DBGKEY = SETTINGS.DEBUG_KEY_STATE;
			if (SETTINGS.DEBUG_SHOW_TIME)
				console.log("DBGKEY ++++ ["+SETTINGS.MasterFrame().zeroPad(5)+"] "+SETTINGS.MasterTime()+'ms');
			e.preventDefault();
		}
	};

	window.onkeyup = function (e) {
		if (!SETTINGS.DEBUG_TRACE_BY_KEY) return;
		if (!e) e = window.event;
		if (SETTINGS.DEBUG_KEY_STATE) {
			if (SETTINGS.DEBUG_KEY_STATE) {
				switch (e.keyCode) {
					case 49: // '1'
						SETTINGS.DEBUG_AI_STEP = true;
						break;
					case 189: // '-'
						SETTINGS.DEBUG_INTERVAL = S.TIMESTEP * SETTINGS.SLOW_FACTOR * SETTINGS.SLOW_MULTIPLE;
						console.log("*****");
						console.log("*****", (SETTINGS.SLOW_FACTOR * SETTINGS.SLOW_MULTIPLE)+'X',"SLOW TIMESTEP (ALT= to restore)");
						console.log("*****");
						SETTINGS.SLOW_MULTIPLE++;
						break;
					case 187: // '='
						SETTINGS.DEBUG_INTERVAL = S.TIMESTEP;
						console.log("*****");
						console.log("***** NORMAL TIMESTEP");
						console.log("*****");
						break;
					}
			}
			if (!e.altKey) {
				SETTINGS.DEBUG_KEY_STATE = false;
				window.DBGKEY = SETTINGS.DEBUG_KEY_STATE;
				if (SETTINGS.DEBUG_SHOW_TIME)
					console.log("DBGKEY ---- ["+SETTINGS.MasterFrame().zeroPad(5)+"] "+SETTINGS.MasterTime()+'ms');
				e.preventDefault();
			}
		}
	};


///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Programmatic enable of AI STEP Debugging
/*/	SETTINGS.EnableAIDebugStepping = function () {
		SETTINGS.DEBUG_AI = true;
		var msg = "\n";
		msg += "********************************\n";
		msg += " AI STEP DEBUG MODE IS ENABLED!\n";
		msg += " USE AI STEP KEY (ALT-1)\n";
		msg += "********************************\n";
		msg += "\n";
		console.log(msg);
	};	

//////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE DEFINITION FOR REQUIREJS **********************************/
//////////////////////////////////////////////////////////////////////////////

	// settings is a FUNCTION that can be invoked. weird, right?
	return SETTINGS;

});
