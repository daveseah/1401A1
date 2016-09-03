/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

	1401.js is the 'server startup' code, called directly from the gulpfile
	in runServer(). It is invoked in a separate node instance, so it can be
	killed and restarted independently of the gulp build process.

	For unmodified 1401A1 instances, you won't have to change this unless
	you want to add new features.

	To add new features, append additional modules and write a function that
	initializes them via the server.setServerInitHook() call. This function
	receives an instance of Express app before app.listen() is called.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

	var server = require('./1401-server');

/// START SERVER //////////////////////////////////////////////////////////////	

	server.setServerInitHook ( function ( app ) {
		// your additional ExpressJS app initialization goes here
	});
	server.startServer();

///////////////////////////////////////////////////////////////////////////////
