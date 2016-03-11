/* objects.behavior.blackboard */
define ([
	'1401/objects/data/dictionary'
], function ( 
	Dictionary
) {

	var DBGOUT = true;

/**	Behavior Blackboard *****************************************************\

	A blackboard is the memory context for a behavior tree and its nodes. 

	Each piece has a Blackboard which is used for providing a local storage
	context for each in the piece's BehaviorTree (BT). The Blackboard is
	also used to save execution context for each agent's BT.

	The blackboard itself has Get/Set methods for the overall piece.
	For nodes, their local storage is acccess with LocalMemGet/LocalMemSet.
	For all top-level trees, TreeMemGet/TreeMemSet accepts a key;

	- 

   	Project 1401's behavior tree implementation and terminology is inspired
    by Renato Pereira's Behavior Tree tutorials, adapted to use 1401's piece
    and class hierarchy. See https://github.com/behavior3/behavior3js for
    his own implementation of Behavior Trees!	


///////////////////////////////////////////////////////////////////////////////
/** OBJECT DECLARATION ******************************************************/

	/*/ constructor /*/
	function Blackboard () {
		Dictionary.call(this);
		// keep track of tree path for subtree
		this.tree_path = [];
	}
	/*/ constants /*/
	Blackboard.ISOPEN = '_open';
	/*/ inheritance /*/
	Blackboard.inheritsFrom (Dictionary);


///	OVERRIDDEN METHODS //////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Blackboard.method('Erase', function () {
		Dictionary.prototype.Erase.call(this);
		this.tree_path = [];		
	});


/// GLOBAL TREE STORAGE /////////////////////////////////////////////////////
	var m_treemem = {};		// global all trees


/// ALL TREE SHARED MEMORY //////////////////////////////////////////////////
/// use only for shared tree properties and settings
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Blackboard.method('TreeMemGet', function ( tree, key ) {
		return m_treemem[tree.id+":"+key];
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Blackboard.method('TreeMemSet', function ( tree, key, value ) {
		m_treemem[tree.id+':'+key] = value;
	});


///	AGENT-WIDE MEMORY MEMORY ////////////////////////////////////////////////
/// use for AI-related agent state used by all nodes in the BT
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Blackboard.method('AgentMemGet', function ( key ) {
		return this.Get('AM_'+key);
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Blackboard.method('AgentMemSet', function ( key, value ) {
		this.Set('AM_'+key, value);
	});


///	UNIQUE NODE MEMORY //////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Blackboard.method('NodeMemGet', function ( node, key ) {
		var hash = this.NodeMemKey(node,key);
		return this.Get(hash);
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Blackboard.method('NodeMemSet', function ( node, key, value ) {
		var hash = this.NodeMemKey(node,key);
		this.Set(hash, value);
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Blackboard.method('NodeMemKey', function ( node, key ) {
		key = (key!==undefined) ? ':'+key : '';
		return this.TreePath()+':'+node.id + key;
	});


/// SUBTREE PATH SUPPORT ////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Blackboard.method('TreePathPush', function ( tree ) {
		if (!tree.id) 
			throw new Error('must pass tree object w/ id');
		this.tree_path.push( tree.id );
		// console.log("PushPath:",this.TreePath());
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Blackboard.method('TreePathPop', function() {
		this.tree_path.pop();
		// console.log("PopPath:",this.TreePath());
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	Blackboard.method('TreePath', function () {
		return this.tree_path.join(':');
	});


///////////////////////////////////////////////////////////////////////////////
/** RETURN CONSTRUCTOR *******************************************************/
	return Blackboard;

});
