/* piecefactory.js */
define ([
	'1401/settings',
	'1401/objects/pieces/protopiece',
	'1401/objects/pieces/piece',
	'1401/objects/pieces/movingpiece'
], function ( 
	SETTINGS,
	ProtoPiece,
	Piece,
	MovingPiece
) {

	var DBGOUT = true;

/**	PIECEFACTORY *************************************************************\

	piece creation and management

/** MODULE PRIVATE VARIABLES *************************************************/

	var physics_time = 0;


/** PUBLIC API ***************************************************************/

	var API = {};
	API.name = "piecefactory";


///	SYSTEM INTERFACES ////////////////////////////////////////////////////////

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.HeartBeat = function ( interval_ms ) {
		// do piece management, garbage collection if necessary
		physics_time += interval_ms;
		MovingPiece.WorldStep( physics_time );
	};


///	STEP INTERFACES //////////////////////////////////////////////////////////

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	API.PiecesUpdate = ProtoPiece.UpdateAll;
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	API.PiecesThink = ProtoPiece.ThinkAll;
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	API.PiecesExecute = ProtoPiece.ExecuteAll;

/// PIECE LOOKUP /////////////////////////////////////////////////////////////
	API.GetPieceById = function ( id ) {
		if (!id) throw "need id";
		var p = ProtoPiece.PieceDict[id];
		if (!p) throw "piece with id "+ id +" doesn't exist";
		return p;
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	API.GetPieceByVisual = function ( visual ) {
		return this.GetPieceById(visual.pieceId);
	};


///	FACTORY METHODS //////////////////////////////////////////////////////////

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	API.NewPiece = function ( name ) {
		var p = new Piece(name);
		return p;
	};

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	API.NewMovingPiece = function ( name ) {
		var p = new MovingPiece(name);
		return p;
	};



/** RETURN MODULE DEFINITION FOR REQUIREJS ***********************************/

	return API;

});