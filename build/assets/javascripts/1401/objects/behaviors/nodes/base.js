/* basenode.js */
define ([
	'1401/settings'
], function ( 
	SETTINGS
) {

	var DBGOUT = true;

/**	Behavior BaseNode *******************************************************\

    Project 1401's behavior tree implementation and terminology is inspired
    by Renato Pereira's Behavior Tree tutorials, adapted to use 1401's piece
    and class hierarchy. See https://github.com/behavior3/behavior3js for
    his own implementation of Behavior Trees!

    -

    The BaseNode implements the common runtime functions of a BehaviorTree-
    style node. Each node is like a mini program, and it needs a reference
    to the parent behavior tree, the piece instance, and the time. 

    BaseNode is not created directly, but is subclassed into the following
    types. They all return SUCCESS, FAIL, RUNNING when called.

    Sequence    Composite that executes its children (all success)
    Priority    Composite that excecutes its children (first success)
    MemSequence A Sequence that remembers its last RUNNING node
    MemPriority A Priority that remembers its last RUNNING node
    Action      Basenode for code that actually does something in engine
    Decorator   Basenode for filter
    Condition   Basenode for a condition test

    5 EVENT TYPES are propagated through a BehaviorTree for every "tick" 
    of the AI clock. 

    Enter   - always called first
    Open    - called on very first "Enter" for one-time init
    Tick    - returns RUNNING, SUCCESS, or FAIL
    Close   - called when SUCCESS or FAILURE condition met
    Exit    - always called last

    The piece and interval_ms since the last call are passed to each event,
    so piece properties are available to event handlers.
    
    NOTE:   All behavior node instances are REUSABLE across behavior trees, 
            so it's important NOT to store state as instance properties 
            inheriting classes.
    
    NOTE:   To use the blackboard within a method:
            - this.BBGet (pish, key) 
            - this.BBSet (pish, key, value)

            The Get/Set methods in BaseNode use the tree and node ids to
            create  a unique key hash within the blackboard. See blackboard.js
            for more  details about hos this works.

    TIP:    To avoid growing the runtime heap, avoid declaring var in any of 
            the events.


/** OBJECT DECLARATION ******************************************************/

	/* constructor */
	function BaseNode () {
		// each node has a unique id and an associated tree
		this.id = BaseNode.idCounter++;
		// composite and decorator nodes have children
		this.children = [];
		this.DBG = false;
		this.MEMO = '';
		// each node has a name and description
		this.node_type = BaseNode.TYPE.BaseNode;
		this.name = this.node_type+this.id;
	}

///	'static' properties /////////////////////////////////////////////////////
	BaseNode.idCounter = 1;

///	'enums' /////////////////////////////////////////////////////////////////
	BaseNode.RUNNING 		= 'R'; 
	BaseNode.SUCCESS 		= 'S';
	BaseNode.FAILURE 		= 'F';
	BaseNode.TYPE 			= {};
	BaseNode.TYPE.BaseNode 	= 'BAS';
	BaseNode.TYPE.Action 	= 'ACT';
	BaseNode.TYPE.Condition = 'CON';
	BaseNode.TYPE.Decorator = 'DEC';
	BaseNode.TYPE.Sequence 	= 'SEQ';
	BaseNode.TYPE.Priority 	= 'PRI';
	BaseNode.TYPE.SubTree 	= 'SUB';


///	'flags' /////////////////////////////////////////////////////////////////
	BaseNode.IS_OPEN	= '_isopen';

///	'methods' ///////////////////////////////////////////////////////////////

	/* avoid heap-allocation with reusable variables */
	/* values are not persistent; must refresh every tick! */
	var x_blackboard;		// scratch memory for AI in piece
	var x_tree_id;			// scratch variable for tree id
	var x_state;			// running state of piece-ish


///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Return the children node array for this basenode. It may be empty.
/*/	BaseNode.method('Children', function () {
		return this.children;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Utility to return length of the children node array
/*/	BaseNode.method('HasChildren', function () {
		return (this.children.length > 0);
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Utility to return the master time from SETTINGS
/*/	BaseNode.method('MasterTime', function () {
		return SETTINGS.MasterTime();
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Utility to return the master time from SETTINGS
/*/	BaseNode.method('AutoName', function () {
		this.name = this.node_type+this.id;
		this.name += this.MEMO;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Utility to save shared configuration properties
/*/	BaseNode.method('SaveConfig', function ( read_only_conf ) {
		this.config = read_only_conf || {};
		this.DBG = (this.config.trace!==undefined) ? this.config.trace : false;
	});



///	BLACKBOARD //////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	wrapper for blackboard.GetLocal to simplify access during authoring
/*/	BaseNode.method('BBGet', function ( pish, key ) {
		if (pish&&key) {
			return pish.ai.blackboard.NodeMemGet( this, key );
		}
		throw new Error('BBGet requires a piece and a key');
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	wrapper for blackboard.SetLocal to simplify access during authoring
/*/	BaseNode.method('BBSet', function ( pish, key, value ) {
		if (pish&&key&&(value!==undefined)) {
			pish.ai.blackboard.NodeMemSet( this, key, value );
			return;
		}
		throw new Error('BBSet requires a piece, key, and value');
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	return the hashpath, if a unique string based on the current
	executing node is needed for anything
/*/	BaseNode.method('NodeHash', function ( pish, key ) {
		return pish.ai.blackboard.NodeMemKey(pish,key);
	});


///	MAIN EXECUTION //////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Main method for handling "ticks" to the AI. This is the glue that calls
	all the event handlers (e.g. enter, open) in the correct order.
	NOTES:
	. pish.ai has .blackboard store unique to it.
	. node state is stored in pish.ai.blackboard[tree_id+node_id]
	. Execute is propagated to every child BT node
	. Tick does the work and returns status, but does NOT propagate the 
	  signal to children automatically. CompositeNodes implement that.
/*/ BaseNode.method('Execute', function ( pish, int_ms ) {
		// always call "enter"
		this.Enter(pish);
		// if first-time running, call "open"
		if (!this.BBGet(pish, BaseNode.IS_OPEN)) {
			this.BBSet(pish, BaseNode.IS_OPEN, true);
			this.Open(pish);
		}
		// execute the behavior code and check if it succeeded
		state = this.Tick(pish, int_ms);
		// if the node isn't still running, then call "close"
		if (state !== BaseNode.RUNNING) {
			this.BBSet(pish, BaseNode.IS_OPEN, false);
			this.Close(pish);
		}
		// always call "exit"
		this.Exit(pish);
		// return state to whoever called Execute.
		return state; 
	});


/// OVERRIDEABLE METHODS /////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	do execution management on entry of this node
/*/	BaseNode.method('Enter', function ( pish ) {
		// code that happens before every tick
		// console.log(this.name,"enter",pish.name.bracket());
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	initialize the node data structures in prep for running
/*/	BaseNode.method('Open', function ( pish ) {
		// setup that happens just once per run
		// console.log(this.name,"open",pish.name.bracket());
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	call periodically if RUNNING until return SUCCESS, FAILURE
/*/	BaseNode.method('Tick', function ( pish, int_ms ) {
		// execute every tick, must return status
		// console.log(this.name,"tick",pish.name.bracket());
		return BaseNode.SUCCESS;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	clean up node data structures when run has completed SUCCESS or FAIL
/*/	BaseNode.method('Close', function ( pish ) {
		// console.log(this.name,"close",pish.name.bracket());
		// cleanup that happens once success/failure occurs
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	do execution management on exit of this node
/*/	BaseNode.method('Exit', function ( pish ) {
		// console.log(this.name,"exit",pish.name.bracket());
		// code that happens after every tick
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


///////////////////////////////////////////////////////////////////////////////
/** BEHAVIOR PRIVATE FUNCTIONS ***********************************************/



/** RETURN CONSTRUCTOR *******************************************************/

	return BaseNode;

});