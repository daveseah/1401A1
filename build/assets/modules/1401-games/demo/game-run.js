// add additional special modules used by this game //
SYS1401.AddModulePath( 'keypress', 'vendor/Keypress/keypress-2.1.3.min' );
SYS1401.AddModulePath( 'howler', 'vendor/howler/howler', 'Howl' );
SYS1401.AddModulePath( 'webrtc-shim', 'vendor/webrtc-adapter/adapter' );
SYS1401.AddModulePath( 'socket-io', 'vendor-extra/socket.io' );
SYS1401.UpdateModulePaths();
define ([
	'1401/system/debug',
	'1401/settings',
	'1401/objects/sysloop',
	'1401/system/renderer',
	'1401/system/screen',
//	SYS1401.LocalPath(SYS1401.GameMode('001-gameloop')),
//	SYS1401.LocalPath(SYS1401.GameMode('002-stars-finite')),
//	SYS1401.LocalPath(SYS1401.GameMode('003-stars-infinite')),
//	SYS1401.LocalPath(SYS1401.GameMode('004-ship-movement')),
//	SYS1401.LocalPath(SYS1401.GameMode('005-btree-base')),
//	SYS1401.LocalPath(SYS1401.GameMode('006-btree-factory')),
//	SYS1401.LocalPath(SYS1401.GameMode('007-loadassets')),
//	SYS1401.LocalPath(SYS1401.GameMode('008-timer')),
	SYS1401.LocalPath(SYS1401.GameMode('009-ship-bullets')),
//	SYS1401.LocalPath(SYS1401.GameMode('010-screen')),
//	SYS1401.LocalPath(SYS1401.GameMode('011-webrtc-mirror')),
	'webrtc-shim' // required for 011-webrtc-mirror
], function ( 
	DBG,
	SETTINGS,
	SYSLOOP,
	RENDERER,
	SCREEN,
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

	The actual main game logic is in the loaded GAME MODE module, located
	in the game-modes directory


///////////////////////////////////////////////////////////////////////////////
/** PUBLIC API **************************************************************/

	// create a game loop handler object with all necessary functions
	var MAIN = SYSLOOP.InitializeGame('Game-Main');

	// add handlers as needed
	MAIN.SetHandler( 'GameStep'		, API_GameStep );

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	MasterStep is a method reserved for the 'master game loop', which is
	established by the SYSLOOP.InitializeGame() call. MasterStep() is 
	responsible for implementing the game loop order-of-processing and check
	for game events that change levels or runtime modes.
	Note 1: Master.HeartBeat() runs before MasterStep() is called, so
	system modules have already had their Update() called.
	Note 2: Pieces are updated individually here too. Order is important.
/*/	function API_GameStep ( ms ) {

		/* insert game pause control here */
		/* insert game logic call here */
		SYSLOOP.GetInputAll(ms);
		SYSLOOP.PhysicsUpdate(ms);		// SPECIAL PHYSICS UPDATE
		SYSLOOP.PiecesUpdate (ms);		// all pieces update
		SYSLOOP.ModulesUpdate (ms);		// modules update (us included)
		SYSLOOP.ModulesThink (ms);		// modules AI think (us included)
		SYSLOOP.PiecesThink (ms);		// all pieces think
		SYSLOOP.ModulesOverThink (ms);	// modules AI override (us included)
		SYSLOOP.PiecesExecute (ms);		// all pieces execute
		SYSLOOP.ModulesExecute (ms);	// modules AI execute (us included)
		/* insert ui updates here */
		/* insert game level management */

	}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE DEFINITION FOR REQUIREJS ***********************************/
	return MAIN;

});
