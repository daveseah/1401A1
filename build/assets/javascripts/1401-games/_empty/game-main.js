/* empty/game-main.js */
define ([
	'1401/system/debug',
	'1401/settings',
	'1401/objects/sysloop',
	'1401/system/renderer'
], function ( 
	DBG,
	SETTINGS,
	SYSLOOP,
	RENDERER
) {

	var DBGOUT = true;

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
	var MAIN = SYSLOOP.InitializeGame('DefaultEmpty-Main');

	// add handlers as needed
	MAIN.SetHandler('Connect', function () {
		var str = "Master has loaded the default empty game.\n\n";
		str += "Make sure that you either update the DEFAULT_GAME module ";
		str += "defined at the top of master.js, OR set the USE_DYNAMIC_LOADING ";
		str += "flag to true and make sure the viewmodel file is calling ";
		str += "MASTER.Start() with the correct subdirectory name in ";
		str += "1401-games/\n\n";
		console.warn(str);
	} );


///////////////////////////////////////////////////////////////////////////////
/** MODULE PRIVATE VARIABLES ************************************************/

	var m_viewmodel;	// durandal viewmodel for databinding, system props


///////////////////////////////////////////////////////////////////////////////
/** MODULE PRIVATE FUNCTIONS ************************************************/



///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE DEFINITION FOR REQUIREJS ***********************************/
	return MAIN;

});
