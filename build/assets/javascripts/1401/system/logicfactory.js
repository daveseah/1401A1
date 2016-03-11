/* logicfactory.js */
define ([
	'1401/settings',
	'1401/objects/logic/timer'
], function ( 
	SETTINGS,
	Timer
) {

	var DBGOUT = true;


/**	LogicFactory *************************************************************\

	This factory module manages the pool of available logic controllers
	such as timers, filters, event emitters, and detectors. 


/** MODULE PRIVATE VARIABLES *************************************************/

var MAX_TIMERS = 100;			// total number of timers to create


/** PUBLIC API ***************************************************************/

	var API = {};
	API.name = "logicfactory";


/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Called by Master so system modules can do housekeeping before GameStep
/*/	API.HeartBeat = function ( interval_ms ) {
		Timer.HeartBeat ( interval_ms );
	};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Called by Master to initialize logic systems 
/*/	API.Initialize = function () {

		/* 	DAVE SEZ:
			it is now the responsibility of the author to initialize the
		 	timer pool! See new Timer.js docs
		 */

		// create a bunch of timers
		// Timer.InitializePool();
	};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	return an available timer from the timer pool
/*/	API.NewTimer = Timer.NewTimer;
	API.DisposeTimer = Timer.DisposeTimer;


/// FACTORY METHODS ///////////////////////////////////////////////////////////


	/** RETURN MODULE DEFINITION FOR REQUIREJS ***********************************/

	return API;


});