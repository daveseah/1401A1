/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

	1401-server.js is imported by 1401.js as a module.

	This server code is based on the Mimosa server.js, but is adapted for use
	with our new Gulp workflow.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

	// import libraries
	var express 		= require('express');
	var bodyParser 		= require('body-parser');
	var engines 		= require('consolidate');
	var compression 	= require('compression');
	var favicon 		= require('serve-favicon');
	var cookieParser 	= require('cookie-parser');
	var errorHandler 	= require('errorhandler');
	var ip 				= require('ip');

	// 1401 livereload manager
	var LR 				= require('./1401-livereload');

	// allocate 
	var app; 			// set by startServer
	var server;			// set by startServer
	var config; 		// save configuration object from startServer()

	// server init hook
	var sv_init_hook;	// if set, then will call before app.listen()


///////////////////////////////////////////////////////////////////////////////

	var EXPRESS_PORT 	= 3000;
	var VIEWS_PATH 		= __dirname+'/views';
	var VIEWS_EXT 		= 'hbs';
	var VIEWS_COMPILER 	= 'handlebars';
	var COMPILED_DIR 	= __dirname+'/../public';
	var BP 				= '          ';
	var INFOP 			= '         >';
	var DP 				= '----------';
	var NP				= '         !';
	var FP				= '         *';
	var ERRP			= '       ERR';


///////////////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The configuration object cfg can be passed to override the listed
	parameters. Since 1401-server is spawned by 1401 as a separate 
	process, configuration can't be passed directly from gulpfile. 
/*/	function startServer ( cfg ) {

		// initialize config from either passed value or as new object
		// save as module-wide object
		config = cfg || {};
		// force optimize false always to use requirejs
		config.port = config.port || EXPRESS_PORT;

		// actually start the web server
		startExpress();
	}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Continuing from startServer, set up Express routing. The app instance is
	passed back to a callback that is defined before startServer() is called,
	which is useful for overriding the default 1401.js behavior. Again,
	this is not setable from the gulpfile.
/*/	function startExpress () {
		// instantiate express app
		app = express();

		// setup views and port
		app.set('views', VIEWS_PATH);
		app.engine(VIEWS_EXT, engines[VIEWS_COMPILER]);
		app.set('view engine', VIEWS_EXT);
		app.set('port', config.port || 3000);

		// middleware declarations
		app.use(compression());
		// uncomment and point path at favicon if you have one
		// app.use(favicon("path to fav icon"));
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({extended: true}));
		app.use(cookieParser());

		// enable node error serving in development environment
		if (app.get('env') === 'development') {
		  app.use(errorHandler());
		}

		// serve static files from compiledDir
		app.use(express.static(COMPILED_DIR));

		// routes are relative to compiledDir
		var router = express.Router();
		router.get('/', function(req, res) {
			var lrcfg = LR.getDefaultParameters();
			var livereloadUrl = req.protocol+"://";
			livereloadUrl += req.hostname+':'+lrcfg.liveReloadPort;
			livereloadUrl += '/livereload.js';
			res.render('index', {
				reload: 	lrcfg.liveReload,
				optimize:  	false,
				reloadjs: 	livereloadUrl
			});
		});
		app.use('/', router);

		// for startup that need to do further configuration
		// to the express app, this hook is provided
		if (typeof (sv_init_hook)==='function') {
			sv_init_hook( app );
		}

		// start it up
		server = app.listen(app.get('port'), function() {
			console.log(DP,'VISIT ONE OF THESE URLS in CHROME WEB BROWSER',DP);
			console.log(BP,'LOCAL - http://localhost:'+app.get('port'));
			console.log(BP,'LAN   - http://'+ip.address()+':'+app.get('port'));
		});

		// server is an instance of http.Server
		return server;

	} // startServer 



///	PROPERTY ACCESS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return the Express App instance
/*/ function getExpressApp() {
		if (!app) 
			console.log(ERRP,'server1401/getExpressApp: app is not yet defined');
		return app;
	}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return the HTTP Server instance
/*/ function getServer () {
		if (!server) 
			console.log(ERRP,'server1401/getServer: server is not yet defined');
		return server;
	}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	The passed hook will be called with the Express app instance BEFORE 
	app.listen() is executed. Call before startServer()
/*/	function setServerInitHook ( hook ) {
		if (typeof hook==='function') {
			sv_init_hook = hook;
		} else {
			throw new Error('arg must be function');
		}
	}


///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE DEFINITION *************************************************/
	module.exports.startServer			= startServer;
	module.exports.getServer			= getServer;
	module.exports.getApp				= getExpressApp;
	module.exports.setServerInitHook	= setServerInitHook;
