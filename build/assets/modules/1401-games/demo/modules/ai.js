/* demo/ai.js */
define ([
	'1401/system/debug',
	'1401/system/logicfactory',
	'1401/system/behaviorfactory'
], function ( 
	DBG,
	LOGICFACTORY,
	BF
) {

	var DBGOUT = false;

///////////////////////////////////////////////////////////////////////////////
/**	TEST AI CONCEPTS *******************************************************\

	005.js 		- test basic nodes
	007.js		- test memory nodes


///////////////////////////////////////////////////////////////////////////////
/** PRIVATE VARS *************************************************************/


///////////////////////////////////////////////////////////////////////////////
/** MODULE DECLARATION *******************************************************/

	var AI = {};
	AI.name = "demo/aitest";

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	AI.PieceTest = function (p) {

		console.group("AI PieceTest");

		var t = LOGICFACTORY.NewTimer();
		t.Start(1000,1000);
		LOGICFACTORY.DisposeTimer(t);
		console.log(t);

		console.groupEnd();

	};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	AI.BehaviorInitialize = function ( piece ) {
		console.log("\n\n*** TESTING BEHAVIOR TREE ***\n");
		
		var b = new BF.Priority([
			new BF.Action(),
			new BF.Decorator(new BF.Action()),
			new BF.Sequence([
				new BF.Condition({memo:'IsDoorOpen'}),
				new BF.Action({memo:'GoThrough'}),
				new BF.Condition({memo:'IsSurvived'}),
				new BF.Action({memo:'Dance'})
			],{memo:'OpenDoor'}),
			new BF.Condition({memo:'BaseDoor'}),
			new BF.Action({memo:'Idle'}),
			new BF.Action(),
			new BF.Action()
		],{memo:'Ship'});

		var bb = new BF.SubTree(b,{memo:'SUB'});

		// behavior names are case insensitive
		BF.DefineBehavior('testMe', bb);
		BF.AssignBehavior('testme', piece);
	};


///////////////////////////////////////////////////////////////////////////////
/** MODULE HANDLER FUNCTIONS *************************************************/



///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE DEFINITION FOR REQUIREJS ***********************************/
	return AI;

});
