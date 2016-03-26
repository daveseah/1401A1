/* priority.js */
define ([
	'1401/settings',
	'1401/objects/behaviors/nodes/base'
], function ( 
	SETTINGS,
	BaseNode
) {

	var DBGOUT = true;

/**	BehaviorTree Priority ***************************************************\
	
	A PriorityNode is a type of composite that returns SUCCESS if any one of
	its children is successful. It returns RUNNING until  all children have
	reported in.

		var node = PriorityNode ([
			Failer(),
			Failer(),
			Suceeder(),
			Failer()
		]);

	node.Tick() would return SUCCESS because one of its children
	reports success. By comparison, the SequenceNode is far less forgiving,
	running SUCCESS only if ALL its children report success, one after
	the other.


/** OBJECT DECLARATION ******************************************************/

	/* constructor */
	function PriorityNode ( children, read_only_conf ) {
		//	call the parent constructor		
		BaseNode.call (this);

		// Priority evaluate left-to-right and have child nodes
		this.children = children || [];	
		// save configuration if any
		this.SaveConfig(read_only_conf);

		// each node has a name
		this.node_type = BaseNode.TYPE.Priority;
		this.AutoName();
	}
	/*/ inheritance /*/
	PriorityNode.inheritsFrom(BaseNode);

///	'methods' ///////////////////////////////////////////////////////////////

	/* avoid heap-allocation with reusable variables */
	var blackboard;		// piece blackboard (AI memory)
	var i, status;		// counter
	var child;			// child node
	var out;			// output holder


/// see basenode.js for overrideable methods!
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	PriorityNode.method('Tick', function ( pish, int_ms ) {
		out = this.DBG || this.name.bracket();
		for (i=0;i<this.children.length;i++) {
			child = this.children[i];
			status = child.Execute(pish,int_ms);
			if (status!==BaseNode.FAILURE) {
				if (DBGOUT) {
					out+= ' '+child.name+'-'+status+' SUCCESS';
					console.log(out);
				}
				return status;
			} else {
				if (DBGOUT) {
					out+= ' '+child.name+'-'+status;
					console.log(out);
				}
			}
		}
		if (DBGOUT) console.log(out,"all",this.children.length,"failed!");
		return BaseNode.FAILURE;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


///////////////////////////////////////////////////////////////////////////////
/** BEHAVIOR PRIVATE FUNCTIONS ***********************************************/

	// Functions should receive entire state in parameters, as stored values
	// in the object instances are not persistent because the same behavior
	// tree's nodes can be used across multiple agents. The blackboard is
	// what provides persistent memory


/** RETURN CONSTRUCTOR *******************************************************/

	return PriorityNode;

});