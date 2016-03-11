/* checkinmonitor.js */
define ([
	'1401/objects/logic/checkin'
], function ( 
	CheckIn
) {

	var DBGOUT = false;

/*****************************************************************************\

	CALLBACK COUNTER

	Used by LoadAssets() to distribute callback "check-in" objects. When all
	check-in objects have Execute() invoked, triggers the next stage
	of loading. 

/*****************************************************************************/

///	"PRIVATE STATIC CLASS VARIABLES" //////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	var m_id_counter = 0;
	var m_id_prefix  = 'cim';


/** CLASS DECLARATION ********************************************************/

///	CONSTRUCTOR & INHERITANCE /////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Manager for CheckIns
/*/	function CheckInMonitor ( that, func ) {
		if (typeof func !== 'function') {
			throw new Error('must pass thisObj, function to constructor');
		}
		// define incrementing instance property
		this.id = m_id_prefix + (m_id_counter++);
		// notify callback
		this.t = that;
		this.f = func;
		// checkin array
		this.Initialize();
	}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Initialize the CIM to pre-allocated state
/*/	CheckInMonitor.method('Initialize', function () {
		this.checkedOut = [];
		this.checkedIn = [];
		this.active = false;
		this.count = 0;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Enable debugging manually
/*/	CheckInMonitor.method('ShowDebug', function ( flag ) {
		flag = (flag===undefined) ? true : flag;
		DBGOUT = flag;
		if (flag) 
			console.log("++ CheckInMonitor DBGOUT enabled");
		else 
			console.log("-- CheckInMonitor DBGOUT disabled");
	});

/** METHODS ******************************************************************/

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	creates an CheckIn Object that notifies the creating CheckInMonitor
	so it can keep track of when all CheckIns have completed
/*/	CheckInMonitor.method('NewCheckIn', function ( name ) {
		if (!name) throw new Error('NewCheckIn requires name identifier');
		if (DBGOUT) console.log(this.id,'checkin created:',name);
		var checkIn = new CheckIn ( name, this.PRI_CheckIn, this );
		this.checkedOut.push(checkIn);
		return checkIn;
	});

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	When activated, a CIM will actively fire when checkin matches checkout
	queues. Call this when all check-in objects have been created.
/*/	CheckInMonitor.method('Activate', function () {
		this.active = true;
		if (DBGOUT) console.log(this.id,'>>> PROCESSING >>>');
		this.PRI_CheckInCheck();
	});

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	called by a CheckIn Execute object, which passes name during call
/*/	CheckInMonitor.method('PRI_CheckIn', function ( name ) {
		// on checkin, increment the check-in count and save
		this.count++;
		this.checkedIn.push( name );
		// check if actively processing
		var left = this.checkedOut.length - this.count;
		if (!this.active) {
			if (DBGOUT) console.log(this.id, name.bracket(),'checked-in,',left ,'left (inactive)');
			return;
		}
		if (DBGOUT) console.log(this.id,name.bracket(),'checked-in,',left ,'left');
		this.PRI_CheckInCheck();
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	check to see if all check-ins have occured, fires notifier callback
/*/	CheckInMonitor.method('PRI_CheckInCheck', function () {
		var total = this.checkedOut.length;
		if (this.count == total) {
			if (DBGOUT) console.log(this.id,'*** all checked in ***');
			// success!
			this.f.call(this.t,this.o);
			// reset!
			this.Initialize();
		}
	});


///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Return status object
/*/	CheckInMonitor.method('Status', function () {
		var status = {};
		status.string = "counted:"+this.count;
		status.string += " checkedIn:"+this.checkedIn.length;
		status.string += " checkedOut:"+this.checkedOut.length;
		status.string += " active:"+this.active;
		return status;
	});


///////////////////////////////////////////////////////////////////////////////
/** RETURN CONSTRUCTOR *******************************************************/
	return CheckInMonitor;

});
