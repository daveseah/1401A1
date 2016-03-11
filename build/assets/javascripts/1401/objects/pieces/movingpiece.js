/* movingpiece.js */
define ([
	'three',
	'physicsjs',
	'1401/objects/pieces/piece'
], function ( 
	THREE,
	PHYSICS,
	Piece
) {

	var DBGOUT = true;

/**	MovingPiece **************************************************************\

	A MovingPiece implements the dynamic movement of a piece. The parent
	Piece class, by comparison, only has the notion of position and visual
	representation. Pieces have more features, of course, but MovingPiece
	builds upon them. 

	NOTES

	This module is designed to be imported and used as a based for creating
	extended Piece classes in a constructor chain. 


/** OBJECT DECLARATION ******************************************************/

///	MOVING PIECE /////////////////////////////////////////////////////////////
///	implements dynamic movement

	/*/ constructor /*/
	function MovingPiece ( name ) {

	//	call the parent constructor		
		Piece.call (this, name);

	//	position and orientation
	//	this.position - defined in Piece
	//	this.rotation - defined in Piece

	//	utility position data
	//	this.position0 - defined in Piece
	//	this.position1 - defined in Piece
	//	this.position2 - defined in Piece

	//	physics features via physics engine
	this.body = PHYSICS.body('circle', {
		x: 0, y:0, radius: 15,
		vx: 0, vy: 0
	});
	MovingPiece.WORLD.add(this.body);
	this.body.cof = 0.9;

	//	initialize default values
		m_InitializeDefaults(this);

	}
	/* static vars */
	MovingPiece.WORLD = PHYSICS();	// create master world instance
	/* static methods */
	MovingPiece.WorldStep = function ( current_time ) {
		MovingPiece.WORLD.step( current_time );
	};
	/*/ inheritance /*/
	MovingPiece.inheritsFrom(Piece);


///	BASIC LIFECYCLE METHODS ///////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Override Piece.Update() as necessary
/*/	MovingPiece.method ('Update', function ( interval_ms ) {
		// handle physics
		if (this.body) {
			// update position and orientation
			this.SetPositionXY( this.body.state.pos.x, this.body.state.pos.y );
			this.SetRotationZ( this.body.state.angular.pos );
		}
		// call overridden Update() method directly
		Piece.superCall('Update', this, interval_ms);

	});


///	PHYSICS METHODS  /////////////////////////////////////////////////////////
	var v = new PHYSICS.vector();
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	MovingPiece.method('Accelerate', function ( ax, ay ) {
		v.set(ax,ay);
		v.rotate(this.rotation.z ,0);
		this.body.sleep(false);
		this.body.state.acc = v;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	MovingPiece.method('Brake', function ( braking ) {
		if (!braking) return;
		this.body.sleep(false);
		this.body.state.vel.mult(1-braking);
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	MovingPiece.method('AccelerateRotation', function ( az ) {
		this.body.sleep(false);
		this.body.state.angular.acc = az;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	MovingPiece.method('BrakeRotation', function ( braking ) {
		if (!braking) return;
		this.body.sleep(false);
		this.body.state.angular.acc = 0;
		this.body.state.angular.vel *= 1-braking;
	});



/** UTILITY FUNCTIONS ********************************************************/

	function m_InitializeDefaults ( piece ) {
		// moving piece defaults
	}

/** RETURN CONSTRUCTOR *******************************************************/

	return MovingPiece;

});