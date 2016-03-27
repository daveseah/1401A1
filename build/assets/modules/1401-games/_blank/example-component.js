/* _blank/player.js */
define ([
	'1401/objects/sysloop',
	'1401/settings',
	'1401/system/renderer',
	'1401/system/visualfactory',
	'1401/system/piecefactory',
], function ( 
	SYSLOOP,
	SETTINGS,
	RENDERER,
	VISUALFACTORY,
	PIECEFACTORY
) {

	var DBGOUT = true;

///////////////////////////////////////////////////////////////////////////////
/**	SUBMODULE EXAMPLE ********************************************************\

	Creating a module that is a SYSLOOP will automatically connect it to 
	the 1401 system loop. You can write code that works like a stand-alone
	component.

///////////////////////////////////////////////////////////////////////////////
/** MODULE DECLARATION *******************************************************/

	var MOD = SYSLOOP.New("BlankTemplate");

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	MOD.SetHandler( 'Initialize', function () {
		var bg_png = SETTINGS.AssetPath('../demo/resources/bg.png');
		RENDERER.SetBackgroundImage ( bg_png );
	});

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	MOD.SetHandler( 'Construct', function () {
	});

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	MOD.SetHandler( 'Start', function () {
		window.DBG_Out( "<b>BLANK TEMPLATE</b>" );
		window.DBG_Out( "<p>This HTML is emitted to the debug window</p>" );
		console.group("Player.Start");
		console.log("This message is printed to the console");
		console.groupEnd();
	});

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	MOD.EnableUpdate();
	MOD.SetHandler( 'Update', function ( elapsed_ms ) {
		// called every tick, with milliseconds elapsed
	});

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	MOD.EnableAI();
	MOD.SetHandler( 'Think', function () { 
		// called every tick after Update
	});


///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE DEFINITION FOR REQUIREJS ***********************************/
	return MOD;

});
