/* protopiece.js */
define ([
], function ( 
) {

	var DBGOUT = false;

/**	ProtoPiece *******************************************************************\

	A representation of a logical ProtoPiece. The ProtoPiece class establishes the
	minimum meta data that represents its logical membership:

		roles: 		what roles does this piece have? Think of it as powers.
		tags: 		what special game markers are applied to this piece?
		factions: 	what "side" is this piece on? 
		groups: 	what functional group is this piece part of?

	There aren't any official methods for this yet

	This module is designed to be imported and used as a based for creating
	extended Piece classes in a constructor chain. 


/** OBJECT DECLARATION ******************************************************/

/// HEAP-SAVING PREALLOCATED VARIABLES ////////////////////////////////////////////

	var dict, keys, num, i, p, pieces;

///	PROTO ProtoPiece //////////////////////////////////////////////////////////////
///	stores common metadata shared with all ProtoPieces

	/* constructor */
	function ProtoPiece( name ) {
		this.id = ProtoPiece.idCounter++;
		this.name = name || 'pobj';
		this.roles = {};
		this.tags = {};
		this.factions = {};
		this.groups = {};

		// save to universal ProtoPiece array
		m_SaveProtoPiece(this);
	}

///	PROTOTYPE PROPERTIES /////////////////////////////////////////////////////
///	these are unique instances (like static class variables)

	ProtoPiece.PieceDict = {};
	ProtoPiece.PieceList = [];
	ProtoPiece.idCounter = 1;

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Called by MasterGameLoop to call every piece's Update() loop, where
	they can update state as necessary.
/*/	ProtoPiece.UpdateAll = function ( interval_ms ) {
		dict = ProtoPiece.PieceDict;
		keys = ProtoPiece.KeyArray = Object.keys(dict);
		num = keys.length;
		// console.log("calling update on",num,"pieces");
		if (!num) return;
		ProtoPiece.PieceList = [];
		for (i=0;i<num;i++) {
			p = dict[keys[i]];
			ProtoPiece.PieceList.push(p);
			p.Update( interval_ms );
		}
	};

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Called by MasterGameLoop to give every piece thinking time for
	AI. Each piece establishes an 'intention' that will be carried
	out during Execute. Piece manager modules will receive an
	'OverThink' event that can override these intentions.
/*/	ProtoPiece.ThinkAll = function ( interval_ms ) {
		pieces = ProtoPiece.PieceList;
		for (i=0;i<pieces.length;i++) {
			p = pieces[i];
			p.Think( interval_ms );
		}
	};

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Called by MasterGameLoop to give every piece execution time
	to carry-out what it had been thinking during Think(), possibly
	overriden by a piece manager.
/*/	ProtoPiece.ExecuteAll = function ( interval_ms ) {
		pieces = ProtoPiece.PieceList;
		for (i=0;i<pieces.length;i++) {
			p = pieces[i];
			p.Execute( interval_ms );
		}
	};

/** PRIVATE SUPPORT METHODS **************************************************/

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/ m_SaveProtoPiece ( ProtoPiece )
	save ProtoPiece to the module-wide table of created ProtoPieces. This table
	is used during ProtoPiece.Update(), ProtoPiece.Think(), and ProtoPiece.Execute().
	It is also used to look-up ProtoPieces by id as a service.
/*/	function m_SaveProtoPiece ( piece ) {
		if (!piece) return;
		if (!piece.name) return;
		if (!piece.id) {
			console.error("Piece needs an id property");
			return;
		}
		p = ProtoPiece.PieceDict[piece.id];
		if (p) {
			console.error("attempted to save duplicate id. aborting.");
			return;
		} else { 
			ProtoPiece.PieceDict[piece.id] = piece;
		}
	}

/** RETURN CONSTRUCTOR *******************************************************/

	return ProtoPiece;

});