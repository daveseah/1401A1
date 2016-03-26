/* behavior/tree.js */
define ([
	'1401/settings'
], function ( 
	SETTINGS
) {

	var DBGOUT = true;
	var DBGAI = true;

/**	Behavior Tree ***********************************************************\

    Project 1401's behavior tree implementation and terminology is inspired
    by Renato Pereira's Behavior Tree tutorials, adapted to use 1401's piece
    and class hierarchy. See https://github.com/behavior3/behavior3js for
    his own implementation of Behavior Trees!

	- 

	A Behavior Tree (BT) structures a set of robot control nodes that are
	evaluated in a well-defined order. The control types are: 

	COMPOSITE	Node that processes child nodes in some order
	ACTION		Node that does game-engine work (like a command)
	DECORATOR 	Node that filters the output of its single child
	CONDITION 	Node that detects conditions

	Each BT is comprised of many subtrees of the above nodes, and the
	status of each node type is evaluated from left-to-right. The return
	status (SUCCESS, FAIL or RUNNING) determines whether subsequent nodes
	or entire subtrees execute. 

	A BT is a REUSABLE structure that is define-once, apply-to-many.
	The nodes make use of a memory structure called a Blackboard, 
	which is essentially a runtime memory context for the node's raw code.

	-

	1401 IMPLEMENTATION

	Each Piece has an ai property with the following subproperties:
	ai.behavior  	= a BehaviorTree
	ai.blackboard 	= local memory context for BehaviorTree

	The ai.behavior.Execute() function is called in Piece.Think()
	if it exists. This happens after Piece.Update().


/** OBJECT DECLARATION ******************************************************/

	/* constructor */
	function BehaviorTree ( name, rootNode ) {
		this.id = 'BT'+BehaviorTree.idCounter++;
		this.name = name || 'behavior'+this.id.zeroPad(3);
		this.rootNode = rootNode || null;
	}

///	'static' properties //////////////////////////////////////////////////////
	BehaviorTree.idCounter = 1;


/// EXECUTE THE BEHAVIOR TREE ///////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	convenient way to do the Execute tick on the root node
/*/	BehaviorTree.method('Execute', function ( pish, interval_ms ){
		// AI step control (run/no-run)
		if (SETTINGS.DEBUG_AI) {
			if (!SETTINGS.DEBUG_AI_STEP) return;
			console.group("AI STEP ["+SETTINGS.MasterFrame().zeroPad(5)+"] "+SETTINGS.MasterTime()+'ms');
		}
		this.rootNode.Execute ( pish, interval_ms );
		if (SETTINGS.DEBUG_AI) console.groupEnd();

	});

/// ACCESSOR METHODS ////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Accessor for returning RootNode 
/*/	BehaviorTree.method('RootNode', function () {
		return this.rootNode;
	});


///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/** RETURN CONSTRUCTOR *******************************************************/

	return BehaviorTree;

});