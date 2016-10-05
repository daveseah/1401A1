/* _appshell.js */
define ([ 
	'1401/master',
	'1401/js-extend/oop',		// returns empty object
	'1401/js-extend/format',	// returns empty object
], function (
	MASTER,
	js_oop,
	js_format
) {


///////////////////////////////////////////////////////////////////////////////
/**	APPSHELL *****************************************************************\

	This is a Durandal ViewModel that does the absolute minimum to start the
	game engine. It returns properties (e.g. displayName) that are linked
	to the corresponding View 'game-init.html' using KnockoutJS data binding.

	We launch the game via the MASTER.Start(), passing itself (the ViewModel)
	so it's available to the game modules if they need to update the HTML
	portions of the screen.


///////////////////////////////////////////////////////////////////////////////
/** PUBLIC API **************************************************************/

	var MOD = {};

	MOD.displayName = 'Blank Template';
	MOD.description = 'Put Your Description here in _appshell.js';

	/**                                                                   **\
		This Durandal viewmodel is used to launch 1401, the game engine.
		We hook some Durandal events to (1) read the URL query string and
		(2) initialize the 1401 game engine, which next launch the 
		'game-run.js' file located in the same directory as this file.
	\**                                                                   **/

	// the 'activate' hook is used to read the query string
	MOD.activate = function ( query ) {
		SYS1401.GetGameModeQuery( query );
	};
	// the 'compositionComplete' hook runs when all HTML has rendered
	// so the UI is stable enough to run the game system
	MOD.compositionComplete = function () {
		MASTER.Start( this );
		// game-run.js is executed by MASTER.Start()
		// game-settings.yaml is loaded by MASTER.Start()
	};


///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE DEFINITION FOR REQUIREJS ***********************************/
	return MOD;

});


