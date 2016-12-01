/* game-run.js */
define ([
	'1401/settings',
	'1401/objects/sysloop',
	'1401/system/renderer',
	'1401/system/screen',
	'1401/system/visualfactory',
	'1401/system/piecefactory',
	SYS1401.LocalPath(SYS1401.GameMode('example-component'))
], function ( 
	SETTINGS,
	SYSLOOP,
	RENDERER,
	SCREEN,
	VISUALFACTORY,
	PIECEFACTORY,
	COMPONENT
) {

///////////////////////////////////////////////////////////////////////////////
/**	BLANK TEMPLATE ***********************************************************\

	This file, game-run.js, is the starting point of the game. It uses the 
	API for Game Loops (SYSLOOP) to run under the control of master.js.

	In general, you'll be hooking into these functions as necessary.

	MAIN.SetHandler('Initialize', function () {} );
	MAIN.SetHandler('Connect', function () {} );
	MAIN.SetHandler('LoadAssets', function () {} );
	MAIN.SetHandler('Construct', function () {} );
	MAIN.SetHandler('Start', function () {} );
	MAIN.SetHandler('GameStep', function () {} );  // master loop only

	The convention is to just set-up the master gameloop with the
	MAIN.SetHandler('GameStep' ...) call, then to load a specific
	runfile out of the game-modes subdirectory. For an example, see the
	1401-games/demo app. 

	Note that the critical GameStep is ONLY implemented by game-run.js.
	It uses a different set of SYSLOOP handlers that need to be explicitly
	enabled. See sysloop.js for documentation.


///////////////////////////////////////////////////////////////////////////////
/** PUBLIC API **************************************************************/

	// create a game loop handler object with all necessary functions
	var MAIN = SYSLOOP.InitializeGame('Game-Run');

	// add handlers as needed
	MAIN.SetHandler( 'Connect'		, API_HandleConnect );
	MAIN.SetHandler( 'Initialize'	, API_HandleInitialize );
	MAIN.SetHandler( 'Construct'	, API_HandleConstruct );
	MAIN.SetHandler( 'GameStep'		, API_GameStep );


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
		console.log("MAIN: Initializing!");

		// save the viewmodel if we want it later
		m_viewmodel = viewModel;
	}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Initialize() happens after Connect() is complete for all SYSLOOP modules.
/*/	function API_HandleInitialize () {

		// instead of initializing renderer directly,
		// use SCREEN which will initialize it for us
		var cfg = {
			renderViewport 	: 'fixed',		// layout mode
			renderWidth 	: 768,			// width of viewport
			renderHeight 	: 768,			// height of viewport
			worldUnits 		: 768			// world units visible in viewport
		};
		SCREEN.CreateLayout( cfg );
		SCREEN.SetInfo('<h4>PlanTitle</h4><p>Starter template</p>');
		SCREEN.SetDisplayMargin(20);
	}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Construct() happens after Iniitialize is complete for all SYSLOOP modules.
/*/	function API_HandleConstruct () {
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
		var crixa = PIECEFACTORY.NewMovingPiece("crixa");
		crixa.SetVisual(shipSprite);
		crixa.SetPositionXYZ(0,0,0);
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


///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE DEFINITION FOR REQUIREJS ***********************************/
	return MAIN;

});
