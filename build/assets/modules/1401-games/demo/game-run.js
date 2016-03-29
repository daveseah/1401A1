SYS1401.AddModulePath( 'keypress', 'vendor/Keypress/keypress-2.1.3.min' );
SYS1401.AddModulePath( 'howler', 'vendor/howler/howler' );
SYS1401.AddModulePath( 'webrtc-shim', 'vendor/webrtc-adapter/adapter' );
SYS1401.AddModulePath( 'socket-io', 'vendor-extra/socket.io' );

SYS1401.UpdateModulePaths();
define ([
	'1401/system/debug',
	'1401/settings',
	'1401/objects/sysloop',
	'1401/system/renderer',
/*** UNCOMMENT ONE TEST *****************************************************/
//	SYS1401.LocalPath('tests/001-gameloop')
//	SYS1401.LocalPath('tests/002-stars-finite')
//	SYS1401.LocalPath('tests/003-stars-infinite')
// 	SYS1401.LocalPath('tests/004-ship-movement')
//	SYS1401.LocalPath('tests/005-btree-base')
//	SYS1401.LocalPath('tests/006-btree-factory')
//	SYS1401.LocalPath('tests/007-loadassets')
//	SYS1401.LocalPath('tests/008-timer')
	SYS1401.LocalPath('tests/009-ship-bullets')
], function ( 
	DBG,
	SETTINGS,
	SYSLOOP,
	RENDERER,
	TEST
) {

///////////////////////////////////////////////////////////////////////////////
/**	DEMO GAME ***************************************************************\

	This file, game-main.js, is the starting point of the game. It uses the 
	API for Game Loops (SYSLOOP) to run under the control of master.js.

	In general, you'll be hooking into these functions as necessary.

	MAIN.SetHandler('Initialize', function () {} );
	MAIN.SetHandler('Connect', function () {} );
	MAIN.SetHandler('LoadAssets', function () {} );
	MAIN.SetHandler('Construct', function () {} );
	MAIN.SetHandler('Start', function () {} );
	MAIN.SetHandler('GameStep', function () {} );  // master loop only

	The actual "game code" is in the TEST module defined above. The various
	test modules (e.g. test01, test02, etc) are also SYSLOOP modules, so
	master.js is invoking the same handlers on those objects as well, 
	allowing you to write independent-yet-synchronized modules without
	having to add the glue code yourself.

	Note that the critical GameStep is ONLY implemented by game-main.js.
	It uses a different set of SYSLOOP handlers that need to be explicitly
	enabled. See sysloop.js for documentation.


///////////////////////////////////////////////////////////////////////////////
/** PUBLIC API **************************************************************/

	// create a game loop handler object with all necessary functions
	var MAIN = SYSLOOP.InitializeGame('Game-Main');

	// add handlers as needed
	MAIN.SetHandler( 'Connect', API_HandleConnect );
	MAIN.SetHandler( 'GameStep', API_GameStep );


///////////////////////////////////////////////////////////////////////////////
/** MODULE PRIVATE VARIABLES ************************************************/

	var m_viewmodel;	// durandal viewmodel for databinding, system props


///////////////////////////////////////////////////////////////////////////////
/** MODULE PRIVATE FUNCTIONS ************************************************/

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Connect() passes the application viewmodel, giving modules the
	opportunity to save a reference if it needs to access the HTML
	layer of code (knockout variables, for example)
/*/	function API_HandleConnect ( viewModel ) {

		m_viewmodel = viewModel;
		console.log("MAIN: Initializing!");
		var parm = {
			attachTo: '#container',		// WebGL attaches to this
			renderWidth: 768,			// width of render context
			renderHeight: 768,			// height of render context
			worldUnits: 768				// world units to fit in shortest dim
		};
		RENDERER.Initialize ( parm );
		RENDERER.AutoRender();

		// size the width of the debug window
		$('#debug').css('width',parm.renderWidth+'px');
		// debug.js defines window.DBG_Out() which writes to #debug
	}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	MasterStep is a method reserved for the 'master game loop', which is
	established by the SYSLOOP.InitializeGame() call. MasterStep() is 
	responsible for implementing the game loop order-of-processing and check
	for game events that change levels or runtime modes.
	Note 1: Master.HeartBeat() runs before MasterStep() is called, so
	system modules have already had their Update() called.
	Note 2: Pieces are updated individually here too. Order is important.
/*/	function API_GameStep ( ms ) {

		/* game pause control */
		/* game logic */
		SYSLOOP.GetInputAll(ms);
		/* physics step in autosys */
		SYSLOOP.PiecesUpdate (ms);		// all pieces update
		SYSLOOP.ModulesUpdate (ms);		// modules update (us included)
		SYSLOOP.ModulesThink (ms);		// modules AI think (us included)
		SYSLOOP.PiecesThink (ms);		// all pieces think
		SYSLOOP.ModulesOverThink (ms);	// modules AI override (us included)
		SYSLOOP.PiecesExecute (ms);		// all pieces execute
		SYSLOOP.ModulesExecute (ms);	// modules AI execute (us included)
		/* ui updates */
		/* game level management */

	}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE DEFINITION FOR REQUIREJS ***********************************/
	return MAIN;

});
