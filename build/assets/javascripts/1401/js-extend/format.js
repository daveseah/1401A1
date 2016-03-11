/* FORMATTING */
define (function () {

/**	JAVASCRIPT EXTENSIONS ***************************************************\

	These are extensions to the built-Javascript objects that make my life
	a tiny bit better.

\****************************************************************************/


/// NUMBERS //////////////////////////////////////////////////////////////////

//	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Add zero padding to integers, e.g. num.zeroPad(3)
/*/	if (!Number.prototype.zeroPad) {
		Number.prototype.zeroPad = function( numDigits ) {
			var n = Math.abs(this);
			var zeros = Math.max(0, numDigits - Math.floor(n).toString().length );
			var zeroString = Math.pow(10,zeros).toString().substr(1);
			if( this < 0 ) {
				zeroString = '-' + zeroString;
			}
			return zeroString+n;
		};
	} else {
		console.warn('JSHACKS: Number.prototype.zeroPad already exists');
	}

/// STRINGS //////////////////////////////////////////////////////////////////

/*/	bracket a string
/*/	if (!String.prototype.bracket) {
		String.prototype.bracket = function () {
			return '['+this+']';
		};
	} else {
		console.warn('JSHACKS: String.prototype.bracket already exists');
	}

/*/	single-quote a string
/*/	if (!String.prototype.squote) {
		String.prototype.squote = function () {
			return "'"+this+"'";
		};
	} else {
		console.warn('JSHACKS: String.prototype.squote already exists');
	}

/*/	angle-bracket a string
/*/	if (!String.prototype.angle) {
		String.prototype.angle = function () {
			return '<'+this+'>';
		};
	} else {
		console.warn('JSHACKS: String.prototype.angle already exists');
	}


///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE DEFINITION FOR REQUIREJS ***********************************/

	// we're just executing code during master.js init, which makes these
	// extensions available globally. No need to return a "real" module
	
	return {};
	
});