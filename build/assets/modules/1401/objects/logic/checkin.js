/* checkin.js */
define ([
], function ( 
) {

	var DBGOUT = true;

/*****************************************************************************\

	DESCRIPTION

	CheckIn object is a kind of event trigger object that's linked to a
	monitoring object (e.g. CheckInMonitor) that waits for all its triggers
	to checkin before continue with an operation. It's used by LoadAssets phase
	of a SYSLOOP

/** CLASS DECLARATION ********************************************************/

	/* private static vars */
	var m_id_counter = 0;

///	CONSTRUCTOR & INHERITANCE /////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function CheckIn ( name, func, that ) {
		// define incrementing instance property
		this.id = 'cim' + (m_id_counter++);
		// validate name	
		if (typeof name!=='string') 
			throw new Error ('constructor requires string name');
		this.name = name;
		// validate function	
		if (typeof func!=='function') 
			throw new Error('constructor requires function');
		this.f = func;
		// this object is optional, undefined defaults to global context
		this.t = that;
		// make a new parameters object to be passed to function
	}


///	PUBLIC CLASS INSTANCE METHODS /////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	CheckIn.method('Notify',function(){
		// return notify name and this instance
		this.f.call(this.t,this.name,this);
	});

///////////////////////////////////////////////////////////////////////////////
/** RETURN CONSTRUCTOR *******************************************************/
	return CheckIn;

});