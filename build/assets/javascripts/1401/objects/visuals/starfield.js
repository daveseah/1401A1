/* starfield */
define ([
	'three'
], function (
	THREE
) {

	var DBGOUT = true;

/**	STARFIELD ****************************************************************\

	A starfield object is drawn in the center of the background layer.
	It accepts a "tracking position" set through TrackXYZ(). 
	The tracking position pans the layer so it appears to be moving, so it
	should be set the the location of the camera's look-at point. It is 
	strictly a 2D grid.

	buffer rendering code based on example:
	http://threejs.org/examples/webgl_interactive_raycasting_pointcloud.html


/** PRIVATE DECLARATIONS *****************************************************/

	var STAR_SIZE = 1.5;
	var STAR_DENSITY = 10;
	var FIELD_SIZE = 2048;
	var FIELD_CLAMP = FIELD_SIZE / 2;
	var FIELD_BOUND = FIELD_CLAMP / 2;

	
/** OBJECT DECLARATION *******************************************************/

	/* constructor */
	/* extends THREE.PointCloud */
	function StarField ( threeColor ) {

		this.parallax = 1;	// how slow to make this layer

		var geo = m_GeneratePointCloudGeometry( threeColor );
		var mat = new THREE.PointCloudMaterial({ 
			size: STAR_SIZE, 
			vertexColors: THREE.VertexColors,
			sizeAttenuation: false 
		});

		// pass up constructor
		THREE.PointCloud.call( this, geo, mat );

		this.scale.set(FIELD_SIZE,FIELD_SIZE,1);
	}
	/* inheritence */
	StarField.inheritsFrom(THREE.PointCloud);


///	PROPERTY SETTING METHODS /////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	StarField.method('SetParallax', function ( val ) {
		this.parallax = val;
	});	


///	POSITION ACCESS METHODS //////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	StarField.method('TrackXYZ', function ( x, y, z ) {
		var xx = u_WrapCoordinates (-x * this.parallax);
		var yy = u_WrapCoordinates (-y * this.parallax);
		this.position.x = xx;
		this.position.y = yy;
		this.position.z = z * this.parallax;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	StarField.method('Track', function ( vector3 ) {
		this.TrackXYZ(vector3.x, vector3.y, vector3.z);
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	StarField.method('TrackXY', function ( x, y ) {
		this.TrackXYZ( x,y,this.position.z );
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	StarField.method('TrackX', function ( x ) {
		this.TrackXYZ( x, this.position.y, this.position.z );
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	StarField.method('TrackY', function ( y ) {
		this.TrackXYZ( this.position.x, y, this.position.z );
	});


///	SUPPORT FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Returns a THREE.BufferGeometry object, spaced by 1 point per unit.
	The actual position is randomized. The buffer object has four identical
	repeating quadrants.
/*/	function m_GeneratePointCloudGeometry( color ) {

		var pointsWide = STAR_DENSITY*2; 
		var pointsHigh = STAR_DENSITY*2;
		var geometry = new THREE.BufferGeometry();
		var numPoints = pointsWide*pointsHigh;
		var off = numPoints/4;
		if (Math.floor(off)!==off) console.error("point cloud needs to have pointnum divisible by 4");

		var positions = new Float32Array( numPoints*3 );
		var colors = new Float32Array( numPoints*3 );

		var k = 0;
		var dx = 1/pointsWide;
		var dy = 1/pointsHigh;

		for( var i = 0; i < pointsWide / 2; i++ ) {
			for( var j = 0; j < pointsHigh / 2; j++ ) {

				var u = i / pointsWide;
				var v = j / pointsHigh;
				var x = (u - 0.5) + ((Math.random()-0.5)*dx);
				var y = (v - 0.5) + ((Math.random()-0.5)*dy);
				var z = 0;

				// console.log(3*k,3*(k+off),3*(k+off*2),3*(k+off*3));
				positions[ 3 * k ] = x;
				positions[ 3 * k + 1 ] = y;
				positions[ 3 * k + 2 ] = z;

				positions[ 3 * (k+off) ] = x + 0.5;
				positions[ 3 * (k+off) + 1 ] = y;
				positions[ 3 * (k+off) + 2 ] = z;

				positions[ 3 * (k+off*2) ] = x;
				positions[ 3 * (k+off*2) + 1 ] = y + 0.5;
				positions[ 3 * (k+off*2) + 2 ] = z;

				positions[ 3 * (k+off*3) ] = x + 0.5;
				positions[ 3 * (k+off*3) + 1 ] = y + 0.5;
				positions[ 3 * (k+off*3) + 2 ] = z;

				var intensity = 0.25 + Math.random();

				colors[ 3 * k ] = color.r * intensity;
				colors[ 3 * k + 1 ] = color.g * intensity;
				colors[ 3 * k + 2 ] = color.b * intensity;

				colors[ 3 * (k+off) ] = color.r * intensity;
				colors[ 3 * (k+off) + 1 ] = color.g * intensity;
				colors[ 3 * (k+off) + 2 ] = color.b * intensity;

				colors[ 3 * (k+off*2) ] = color.r * intensity;
				colors[ 3 * (k+off*2) + 1 ] = color.g * intensity;
				colors[ 3 * (k+off*2) + 2 ] = color.b * intensity;

				colors[ 3 * (k+off*3) ] = color.r * intensity;
				colors[ 3 * (k+off*3) + 1 ] = color.g * intensity;
				colors[ 3 * (k+off*3) + 2 ] = color.b * intensity;

				k++;
			}
		}

		geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
		geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
		geometry.computeBoundingBox();

		return geometry;
	}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	utility method to calculate repositioning of the starfield to create
	illusion of infinite space with just one grid.
/*/	function u_WrapCoordinates ( c ) {
		c = c % FIELD_CLAMP;
		if (c > +FIELD_BOUND) c = c - FIELD_CLAMP;
		if (c < -FIELD_BOUND) c = c + FIELD_CLAMP;
		return c;
	}


///////////////////////////////////////////////////////////////////////////////
/** RETURN CONSTRUCTOR *******************************************************/
///////////////////////////////////////////////////////////////////////////////

	return StarField;

});
