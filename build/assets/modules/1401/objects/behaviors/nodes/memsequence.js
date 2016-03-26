/* memsequence.js */
define ([
	'1401/settings',
	'1401/objects/behaviors/nodes/base'
], function ( 
	SETTINGS,
	BaseNode
) {

/**	BehaviorTree Sequence ***************************************************\

	A MemSequenceNode is a type of composite that returns SUCCESS ONLY IF 
	all its children return are successful. Like a regular Sequence,
	each child is executed one after the other. MemSequences remember if
	a child returned RUNNING, and can return directly to it on the next
	call.

		var node = MemSequenceNode ([
			Suceeder(),
			Failer()
		]);

	node.Tick() would return FAIL because one of its children reports fail. By
	comparison, the PriorityNode type is more forgiving, returning SUCCESS if
	any of its children are successful.
	

/** OBJECT DECLARATION ******************************************************/

	/* constructor */
	function MemSequenceNode ( children, read_only_conf ) {
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
	MemSequenceNode.inheritsFrom(BaseNode);

///	'methods' ///////////////////////////////////////////////////////////////

	/* avoid heap-allocation with reusable variables */
	var blackboard;		// piece blackboard (AI memory)
	var i, status;		// counter
	var child;			// child holder
	var out;			// output holder


/// see basenode.js for overrideable methods!
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	MemSequenceNode.method('Open', function ( pish ) {
		this.BBSet(pish,'_current',0);
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	MemSequenceNode.method('Tick', function ( pish, int_ms ) {
		out = this.DBG || this.name.bracket();
		for (i=this.BBGet(pish,'_current');i<this.children.length;i++) {
			child = this.children[i];
			status = child.Execute(pish, int_ms);
			if (status!==BaseNode.SUCCESS) {
				if (status==BaseNode.RUNNING) {
					this.BBSet(pish,'_current',i);
				}
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

	return MemSequenceNode;

});