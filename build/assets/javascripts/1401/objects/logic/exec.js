/* exec.js */
define ([
], function ( 
) {

	var DBGOUT = true;

/*****************************************************************************\

	DESCRIPTION

	Exec encapsulates the notion of an executable function context,
	which includes the name, function, and thisObject. 

	To support passing parameters to the , use SetParameter(key,value) to set
	parameters by name, or access this.parms


/** CLASS DECLARATION ********************************************************/

///	CONSTRUCTOR & INHERITANCE /////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function Exec ( exec_name, func, thisObj ) {
		// console.log("execobj",exec_name.bracket());

		// define incrementing instance property
		this.id = m_id_prefix + (m_id_counter++);
		// validate name	
		if (typeof exec_name!=='string') 
			throw new Error ('constructor requires string name');
		this.name = exec_name;
		// validate function	
		if (typeof func!=='function') 
			throw new Error('constructor requires function');
		this.f = func;
		// this object is optional, undefined defaults to global context
		this.t = thisObj;
		// make a new parameters object to be passed to function
		this.parms = {};
		// manager function to be called on Exec
		this.mf = null;
		this.mt = null;
	}

///	"PRIVATE STATIC CLASS VARIABLES" //////////////////////////////////////////
///	can be referenced in instance methods thanks to closures
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	var m_id_counter = 0;
	var m_id_prefix  = 'fexec';

///	PUBLIC CLASS INSTANCE METHODS /////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	execute the function with provided parameter objects
/*/	Exec.method('Execute', function ( callerParms ) {
		this.f.call( this.t, callerParms );
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	monitored version of Execute, calling a monitor object's function if one
	has been set.
/*/	Exec.method('Notify', function ( callerParms ) {
		this.Execute( callerParms );
		if (!this.mf) return;
		// call monitor function with the Exec object, which 
		this.mf.call( this.mt, this );
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	monitor objects are invoked when Exec.Notify() is used instead of Execute()
/*/	Exec.method('SetMonitor', function ( monObj, methodName ) {
		if (!monObj) {
			this.mt = null;
			this.mf = null;
		} else {
			var f = monObj[methodName];
			if (!f) throw new Error ('could not find method');
			if (typeof f !== 'function') throw new Error ('parm2 must be function');
			this.mt = monObj;
			this.mf = f;
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	return monitor object, so it can be invoked
/*/	Exec.method('GetMonitor', function () {
		return this.mt;
	});

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	return the name of the function object
/*/	Exec.method('Name', function () {
		return this.name;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Return the raw parameter object, containing arbitrary properites
/*/	Exec.method('Parameters', function () {
		return this.parms;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Return named parameter, if it exists
/*/	Exec.method('GetParameter', function ( parm_name ) {
		if (!parm_name) 
			throw new Error('require string parm name');
		var parm = this.parms[parm_name];
		if (!parm) 
			throw new Error ('parm '+parm_name+' not in '+this.name);
		return parm;
	});

///////////////////////////////////////////////////////////////////////////////
/** RETURN CONSTRUCTOR *******************************************************/
	return Exec;

});
