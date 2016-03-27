/* OOP */
define (function () {

/**	JAVASCRIPT EXTENSIONS ***************************************************\

	These are extensions to the built-Javascript objects that make my life
	a tiny bit better.

\****************************************************************************/

/// OBJECT INHERITANCE ///////////////////////////////////////////////////////

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Add 'method' method to all functions, so there is less mucking about with
	ugly prototype assignments. Compare:

	Piece.prototype.fooMethod = function() { ... };
	...to...
	Piece.method('foo',function() { ... });	

/*/	if (!Function.prototype.method) {	
		Function.prototype.method = function (name, func) {
			// 'this' = constructor function object
			// 'this.prototype' = function object w/ methods
			// add the method
			this.prototype[name] = func;
			// return the function object for assignment
			return this;
		};
	} else {
		console.warn('JSHACKS: Function.prototype.method already exists');
	}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Likewise for object inheritance, replace:
	MovingPiece.prototype = Object.create(Piece.prototype);
	MovingPiece.prototype.constructor = MovingPiece;
	...with...
	MovingPiece.inheritsFrom(Piece);

	inheritsFrom() operates on constructor function objects. It creates a new
	prototype object from the passed constructor function, which allows
	Javascript inheritance to work.
/*/
	if (!Function.prototype.inheritsFrom) {
		Function.prototype.inheritsFrom = function ( otherConstructor ) {
			// 'this' = constructor function object, not created instance
			// create function prototype chain
			this.prototype = Object.create ( otherConstructor.prototype );
			this.prototype.constructor = this;
			this.superproto = otherConstructor.prototype;
		};
	} else {
		console.warn('JSHACKS: Function.prototype.inheritsFrom already exists');
	}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Syntactic sugar for invoking an "overriden" method as one would with
	the "super()" call in classical inheritance. A good review of the subject
	can be found at this url:
	http://blog.salsify.com/engineering/super-methods-in-javascript
	Basically, Javascript doesn't need super() because you can call the
	function directly through the prototype chain. ECMA6 adds super() support,
	so this will inevitably become obsolete.
/*/	
	if (!Function.prototype.superCall) {
		Function.prototype.superCall = function ( methodName, instance ) {
			var sup = this.prototype[methodName];
			if (sup) {
				var args = Array.prototype.slice.call(arguments);
				args.splice(0,2);
				sup.apply(instance,args);
			} else {
				console.error('method',methodName.bracket(),"doesn't exist in prototype");
			}
		};
	} else {
		console.warn('JSHACKS: Function.prototype.superCall already exists');
	}


///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Polyfill for String.endsWith, part of ES6 
/*/	if (!String.prototype.endsWith) {
	  String.prototype.endsWith = function(searchString, position) {
	      var subjectString = this.toString();
	      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
	        position = subjectString.length;
	      }
	      position -= searchString.length;
	      var lastIndex = subjectString.indexOf(searchString, position);
	      return lastIndex !== -1 && lastIndex === position;
	  };
	}



///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE DEFINITION FOR REQUIREJS ***********************************/

	// we're just executing code during master.js init, which makes these
	// extensions available globally. No need to return a "real" module
	
	return {};
	
});