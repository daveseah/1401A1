/* subtree.js */
define ([
	'1401/objects/behaviors/nodes/base'
], function ( 
	BaseNode
) {

	var DBGOUT = true;

/**	SubTree *****************************************************************\

	This is the base SubTree node. Extend it as follows:

	function MySubTree ( parms ) {
		// call parent constructor
		BehaviorFactory.SubTree.call( this, parms );
		...
	}
	// set up inheritance
	MySubTree.inheritsFrom( BehaviorFactory.SubTree );
	// define or override new methods
	MySubTree.method('Open',function(){...});

	IMPORTANT! Using 'this' instance properties is unsafe if a Node gets
	reused. Store agent state in the Blackboard using the following methods:

		BBGet( pish, key )
		BBSet( pish, key, value )

	A 'pish' is an object with id and ai properties, not necessarily a piece,
	but is "piecelike" as far as the behavior tree is concerned. 


/** OBJECT DECLARATION ******************************************************/

	/* constructor */
	function SubTree ( tree_node, read_only_conf ) {
		//	call the parent constructor		
		BaseNode.call (this);
		// save tree_node
		this.tree_node = tree_node;
		// save node configuration, if any
		this.SaveConfig(read_only_conf);
		// each node has a name
		this.node_type = BaseNode.TYPE.SubTree;
		this.AutoName();
	}
	/*/ inheritance /*/
	SubTree.inheritsFrom(BaseNode);

///	'methods' ///////////////////////////////////////////////////////////////

	/* avoid heap-allocation with reusable variables */
	/* values are not persistent; must refresh every tick! */
	var blackboard;		// scratch memory for AI in piece
	var status, i;		// running state of piece-ish

/// see basenode.js for overrideable methods!
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	initialize the node data structures in prep for running
/*/	SubTree.method('Enter', function ( pish ) {
		// setup that happens just once
		// console.log(this.name,"open",pish.name.bracket());
		pish.ai.blackboard.TreePathPush(this);
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	call periodically if RUNNING until return SUCCESS, FAILURE
/*/	SubTree.method('Tick', function ( pish, int_ms ) {
		return this.tree_node.Execute( pish, int_ms );
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	clean up node data structures when run has completed SUCCESS or FAIL
/*/	SubTree.method('Exit', function ( pish ) {
		// console.log(this.name,"close",pish.name.bracket());
		// cleanup that happens once success/failure occurs
		pish.ai.blackboard.TreePathPop();
	});

///////////////////////////////////////////////////////////////////////////////
/** BEHAVIOR PRIVATE FUNCTIONS ***********************************************/

	// Functions should receive entire state in parameters, as stored values
	// in the object instances are not persistent because the same behavior
	// tree's nodes can be used across multiple agents. The blackboard is
	// what provides persistent memory


/** RETURN CONSTRUCTOR *******************************************************/

	return SubTree;

});