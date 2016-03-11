/* sequence.js */
define ([
	'1401/settings',
	'1401/objects/behaviors/nodes/base'
], function ( 
	SETTINGS,
	BaseNode
) {

	var DBGOUT = false;

/**	BehaviorTree Sequence ***************************************************\

	A SequenceNode is a type of composite that returns SUCCESS ONLY IF all its
	children return are successful. Each child is executed one after the
	other.

		var node = SequenceNode ([
			Suceeder(),
			Failer()
		]);

	node.Tick() would return FAIL because one of its children reports fail. By
	comparison, the PriorityNode type is more forgiving, returning SUCCESS if
	any of its children are successful.
	

/** OBJECT DECLARATION ******************************************************/

	/* constructor */
	function SequenceNode ( children, read_only_conf ) {
		//	call the parent constructor		
		BaseNode.call (this);

		// Sequences evaluate left-to-right and have child nodes
		this.children = children || [];	
		// save configuration if any
		this.SaveConfig( read_only_conf );

		// each node has a name
		this.node_type = BaseNode.TYPE.Sequence;
		this.AutoName();
	}
	/*/ inheritance /*/
	SequenceNode.inheritsFrom(BaseNode);

///	'methods' ///////////////////////////////////////////////////////////////

	/* avoid heap-allocation with reusable variables */
	var blackboard;		// piece blackboard (AI memory)
	var i, status;		// counter
	var child;			// child holder
	var out;			// output holder


/// see basenode.js for overrideable methods!
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SequenceNode.method('Tick', function ( pish, int_ms ) {
		out = this.DBG || this.name.bracket();
		for (i=0;i<this.children.length;i++) {
			child = this.children[i];
			status = child.Execute(pish, int_ms);
			if (status!==BaseNode.SUCCESS) {
				if (this.DBG) {
					out+= ' '+child.name+'-'+status+' ABORT';
					console.log(out);
				}
				return status;
			} else {
				if (this.DBG) out+= ' '+child.name+'-'+status;
			}
		}
		if (this.DBG) 
			console.log(out,"all",this.children.length,"success!");
		return BaseNode.SUCCESS;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


///////////////////////////////////////////////////////////////////////////////
/** BEHAVIOR PRIVATE FUNCTIONS ***********************************************/

	// Functions should receive entire state in parameters, as stored values
	// in the object instances are not persistent because the same behavior
	// tree's nodes can be used across multiple agents. The blackboard is
	// what provides persistent memory


/** RETURN CONSTRUCTOR *******************************************************/

	return SequenceNode;

});