/* behavior tree node Wait */
define ([
	'1401/settings',
	'1401/objects/behaviors/nodes/base',
	'1401/objects/behaviors/nodes/action'
], function ( 
	SETTINGS,
	BN,
	Action
) {		

/// Action: Wait ///
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/* subclass from Action */
function Wait ( read_only_conf ) {
	// call the parent constructor
	// BN.Condition, BN.Action, or BN.Decorator
	Action.call (this);	
	// save configuration if any, set common flags
	this.SaveConfig( read_only_conf );
	// each node has a name
	this.node_type = BN.TYPE.Action;
	this.node_class = 'Wait';
	this.AutoName();
}
/* inheritance */
Wait.inheritsFrom(Action);

/* overrides */
// Wait.method( 'Enter', function ( pish ) { });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Wait.method( 'Open', function ( pish ) { 
	var wait = this.config.period;
	this.BBSet(pish,'_endtime',SETTINGS.MasterTime()+wait);
	if (this.DBG) console.log(this.DBG,"waiting",wait+"ms");
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Wait.method( 'Tick', function ( pish, int_ms ) {
	if (SETTINGS.MasterTime() < this.BBGet(pish,'_endtime')) {
		return BN.RUNNING;
	}
	return BN.SUCCESS;	// or FAILURE or RUNNING
});
// Wait.method( 'Close', function ( pish ) { });
// Wait.method( 'Exit', function ( pish ) { });

/*/////////////////////////////////////////////////////////////////////////////

   Helpful Methods
      this.MasterTime()   - current time in ms elapsed
      this.Children()     - return childnode array
      this.HasChildren()  - return true if not empty childnode array
      pish.ai.blackboard  - access blackboard
      pish.ai.behavior    - access behavior tree running the piece
      this.DBG            - set true if config.debug was true

   Blackboard Local Memory is unique for every node in a piece's BT
      this.BBGet(pish,key) 
      this.BBSet(pish,key,val)

   Blackboard Tree Memory is shared by all pieces using that tree
      TreeMemGet(tree_id, key)
      TreeMemSet(tree_id, key, val)

   Blackboard Agent Memory is shared by all nodes running in a piece
      AgentMemGet(key)
      AgentMemSet(key, val)

/*/////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
/** RETURN CONSTRUCTOR *******************************************************/
	return Wait;

});