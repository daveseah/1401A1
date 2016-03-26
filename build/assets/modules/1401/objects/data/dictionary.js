/* objects.data.dictionary */
define ([
], function ( 
) {

	var DBGOUT = true;

/**	Dictionary **************************************************************\

	Implementation of a dictionary, useful baseclass for Behavior NodeMemory,
	but possibly useful in other situations.


/** OBJECT DECLARATION ******************************************************/

	/* constructor */
	function Dictionary () {
		this.S = {};
	}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Set the value of a key
/*/	Dictionary.method('Set', function ( key, value ) { 
		this.S[key] = value;
	});

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Get the value of a key
/*/	Dictionary.method('Get', function ( key ) {
		return this.S[key];
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Erase the dictionary
/*/	Dictionary.method('Erase', function () {
		this.S = {};
	});


///////////////////////////////////////////////////////////////////////////////
/** MODULE PRIVATE FUNCTIONS ************************************************/



/** RETURN CONSTRUCTOR *******************************************************/

	return Dictionary;

});
