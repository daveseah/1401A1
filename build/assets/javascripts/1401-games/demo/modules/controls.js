/* demo/controls.js */
define ([
	'keypress'
], function ( 
	KEY
) {

	var DBGOUT = false;

///////////////////////////////////////////////////////////////////////////////
/**	SUBMODULE CONTROLS *******************************************************\

	implement keyboard controls for crixa ship


///////////////////////////////////////////////////////////////////////////////
/** PRIVATE VARS *************************************************************/

	// input state object
	var _input = {
		forward_acc: 	0,
		side_acc: 		0,
		rot_acc: 		0,
		brake_lin: 		0,
		brake_rot:   	0,
		fire: 			0,
		fireReady: 		true
	};

	m_fireready = true;


	// default values
	var DEFAULT_ACC 		= 0.001;	// units per second^2
	var DEFAULT_ROTACC 		= 0.0001;	// radians per second^2
	var DEFAULT_BRAKE 	 	= 0.05;		// percent slow per second
	var DEFAULT_ROTBRAKE 	= 0.50;		// percent slow rotation per second

	var MAX_VEL				= 10;		// units per second
	var MAX_ROTVEL			= 0.25;		// radians per second

	// key listener initialized in BindKeys
	var _key = null;


///////////////////////////////////////////////////////////////////////////////
/** MODULE DECLARATION *******************************************************/

	var CONTROLS = {};
	CONTROLS.name = "demo/controls";

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	CONTROLS.GetInput = function () {
		return _input; 
	};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	CONTROLS.BindKeys = function () {
		if (!_key) _key = new KEY.Listener();
		m_BindThrusters( _key );
	};

	CONTROLS.Fire = function () {
		if (_input.fire===1) {
			_input.fire = 0;
			return true;
		} 	
		return false;
	};


///////////////////////////////////////////////////////////////////////////////
/** MODULE HANDLER FUNCTIONS *************************************************/

	function m_BindThrusters ( key ) {

		key.register_combo({
			keys: 'w',
			prevent_repeat: true,
			on_keydown: function () { 
				_input.forward_acc = +DEFAULT_ACC; 
			},
			on_keyup: function () {
				_input.forward_acc = 0; 
			}
		});

		key.register_combo({
			keys: 's',
			prevent_repeat: true,
			on_keydown: function () { 
				_input.forward_acc = -DEFAULT_ACC; 
			},
			on_keyup: function () {
				_input.forward_acc = 0; 
			}
		});

		key.register_combo({
			keys: 'q',
			prevent_repeat: true,
			on_keydown: function () { 
				_input.side_acc = +DEFAULT_ACC; 
			},
			on_keyup: function () {
				_input.side_acc = 0; 
			}
		});

		key.register_combo({
			keys: 'e',
			prevent_repeat: true,
			on_keydown: function () { 
				_input.side_acc = -DEFAULT_ACC; 
			},
			on_keyup: function () {
				_input.side_acc = 0; 
			}
		});

		key.register_combo({
			keys: 'a',
			prevent_repeat: true,
			on_keydown: function () { 
				if (DBGOUT) console.log("rot left");
				_input.brake_rot = 0;
				_input.rot_acc = +DEFAULT_ROTACC; 
			},
			on_keyup: function () {
				if (DBGOUT) console.log("rot left stop");
				_input.brake_rot = DEFAULT_ROTBRAKE;
				_input.rot_acc = 0; 
			}
		});

		key.register_combo({
			keys: 'd',
			prevent_repeat: true,
			on_keydown: function () {
				_input.brake_rot = 0;
				_input.rot_acc = -DEFAULT_ROTACC; 
				if (DBGOUT) console.log("rot right");
			},
			on_keyup: function () {
				if (DBGOUT) console.log("rot right stop");
				_input.brake_rot = DEFAULT_ROTBRAKE;
				_input.rot_acc = 0; 
			}
		});

		key.register_combo({
			keys: 'space',
			prevent_repeat: true,
			on_keydown: function () {
				_input.brake_lin = DEFAULT_BRAKE;
				if (DBGOUT) console.log("brake");
			},
			on_keyup: function () {
				if (DBGOUT) console.log("brake released");
				_input.brake_lin = 0;
			}
		});

		key.register_combo({
			keys: 'c',
			prevent_repeat: true,
			on_keydown: function () {
				if (!_input.fireTimer) {
					_input.fireTimer = setInterval(function(){
						_input.fireReady = true;
						_input.fireTimer = null;
					},1000);
					_input.fire = 1;
				} else {
					_input.fire = 0;
				}

			},
			on_keyup: function () {
				_input.fire = 0;
			}
		});

	}


///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE DEFINITION FOR REQUIREJS ***********************************/
	return CONTROLS;

});
