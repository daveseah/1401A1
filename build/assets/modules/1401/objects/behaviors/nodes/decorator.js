/* decorator.js */
define ([
	'1401/objects/behaviors/nodes/base'
], function ( 
	BaseNode
) {

	var DBGOUT = true;

/**	Decorator ***************************************************************\

	This is the base Decorator node. Extend it as follows:

	function MyDecorator ( parms ) {
		// call parent constructor
		BehaviorFactory.Decorator.call( this, parms );
		...
	}
	// set up inheritance
	MyDecorator.inheritsFrom( BehaviorFactory.Decorator );
	// define or override new methods
	MyDecorator.method('Open',function(){...});

	IMPORTANT! Using 'this' instance properties is unsafe if a Node gets
	reused. Store agent state in the Blackboard using the following methods:

		BBGet( pish, key )
		BBSet( pish, key, value )

	A 'pish' is an object with id and ai properties, not necessarily a piece,
	but is "piecelike" as far as the behavior tree is concerned. 


/** OBJECT DECLARATION ******************************************************/

	/* constructor */
	function Decorator ( child, read_only_conf ) {
		//	call the parent constructor		
		BaseNode.call (this);
		// save the child node
		this.children.push(child);
		// save configuration if any
		this.SaveConfig(read_only_conf);

		// each node has a name
		this.node_type = BaseNode.TYPE.Decorator;
		this.AutoName();
	}
	/*/ inheritance /*/
	Decorator.inheritsFrom(BaseNode);

///	'methods' ///////////////////////////////////////////////////////////////

	/* avoid heap-allocation with reusable variables */
	/* values are not persistent; must refresh every tick! */
	var blackboard;		// scratch memory for AI in piece
	var status, i;		// running state of piece-ish
	var child;			// child holder
	var out;			// output holder

/// see basenode.js for overrideable methods!
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	call periodically if RUNNING until return SUCCESS, FAILURE
/*/	Decorator.method('Tick', function ( pish, int_ms ) {
		// execute every tick, must return status
		// console.log(this.name,"tick",pish.name.bracket());
		child = this.children[0];
		status = child.Execute( pish, int_ms );
		// do something with the status before returning it
		return status;
	});

///////////////////////////////////////////////////////////////////////////////
/** BEHAVIOR PRIVATE FUNCTIONS ***********************************************/

	// Functions should receive entire state in parameters, as stored values
	// in the object instances are not persistent because the same behavior
	// tree's nodes can be used across multiple agents. The blackboard is
	// what provides persistent memory


/** RETURN CONSTRUCTOR *******************************************************/

	return Decorator;

});