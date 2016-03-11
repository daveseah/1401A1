/* action.js */
define ([
	'1401/objects/behaviors/nodes/base'
], function ( 
	BaseNode
) {

	var DBGOUT = true;

/**	Action *****************************************************************\

	This is the base Action node. Extend it as follows:

	function MyAction ( parms ) {
		// call parent constructor
		BehaviorFactory.Action.call( this, parms );
		...
	}
	// set up inheritance
	MyAction.inheritsFrom( BehaviorFactory.Action );
	// define or override new methods
	MyAction.method('Open',function(){...});

	IMPORTANT! Using 'this' instance properties is unsafe if a Node gets
	reused. Store agent state in the Blackboard using the following methods:

		BBGet( pish, key )
		BBSet( pish, key, value )

	A 'pish' is an object with id and ai properties, not necessarily a piece,
	but is "piecelike" as far as the behavior tree is concerned. 


/** OBJECT DECLARATION ******************************************************/

	/* constructor */
	function Action ( read_only_conf ) {
		//	call the parent constructor		
		BaseNode.call (this);
		// save node configuration, if any
		this.SaveConfig(read_only_conf);
		// each node has a name
		this.node_type = BaseNode.TYPE.Action;
		this.AutoName();
	}
	/*/ inheritance /*/
	Action.inheritsFrom(BaseNode);

///	'methods' ///////////////////////////////////////////////////////////////

	/* avoid heap-allocation with reusable variables */
	/* values are not persistent; must refresh every tick! */
	var blackboard;		// scratch memory for AI in piece
	var status, i;		// running state of piece-ish

/// see basenode.js for overrideable methods!
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	call periodically if RUNNING until return SUCCESS, FAILURE
/*/	Action.method('Tick', function ( pish, int_ms ) {
		// execute every tick, must return status
		// console.log(this.name,"tick",pish.name.bracket());
		var out = this.DBG || this.name.bracket();
		if (Math.random()>0.5) {
			if (this.DBG) console.log(out,"success");
			return BaseNode.SUCCESS;
		} else {
			if (this.DBG) console.log(out,"fail");
			return BaseNode.FAILURE;
		}
	});

///////////////////////////////////////////////////////////////////////////////
/** BEHAVIOR PRIVATE FUNCTIONS ***********************************************/

	// Functions should receive entire state in parameters, as stored values
	// in the object instances are not persistent because the same behavior
	// tree's nodes can be used across multiple agents. The blackboard is
	// what provides persistent memory


/** RETURN CONSTRUCTOR *******************************************************/

	return Action;

});