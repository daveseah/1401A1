/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

	1401.js is the 'server startup' code, called directly from the gulpfile
	in runServer(). It is invoked in a separate node instance, so it can be
	killed and restarted independently of the gulp build process.

	For unmodified 1401A1 instances, you won't have to change this unless
	you want to add new features.

	To add new features, create your own version of 1401.js (name 
	it something else) that does a call to server.setServerInitHook( hook )
	BEFORE calling startServer(). The hook function will recieve an instance
	of the express app, which can be modified BEFORE app.listen() is invoked.
	You can add your own routes, etc, then.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

	var server = require('./1401-server');

///////////////////////////////////////////////////////////////////////////////

	server.startServer();

///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE DEFINITION *************************************************/
	module.exports.setServerInitHook = server.setServerInitHook;
