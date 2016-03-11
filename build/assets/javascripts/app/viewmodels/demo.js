/* gameshell.js */
define ([ 
	'knockout', 
	'1401/master',
	'1401/js-extend/oop',		// returns empty object
	'1401/js-extend/format',	// returns empty object

], function (
	ko, 
	MASTER,
	js_oop,
	js_format
) {


///////////////////////////////////////////////////////////////////////////////
/** PUBLIC API **************************************************************/

	var MOD = {};
	MOD.displayName = 'GameShell';
	MOD.description = 'Game system testing code';
	MOD.gameId 		= 'demo';
	MOD.compositionComplete = function () {
		MASTER.Start( this );
	};

///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE DEFINITION FOR REQUIREJS ***********************************/
	return MOD;

});


