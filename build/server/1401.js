/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

	1401.js is imported by gulpfile.js as a module, executing in the context
	of the node.js environment. 

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

	// allocate 
	var tinylr;	// set by startLiveReload
	var app; 	// set by startServer
	var server;	// set by startServer


///////////////////////////////////////////////////////////////////////////////

	var LIVERELOAD_PORT = 35729;
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

///////////////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function startServer ( config ) {

		// close server if it's already running
		var server_restart = (server) ? true : false;
		if (server) {
			server.close();
		}

		// set defaults
		config = config || {};
		config.liveReload = config.liveReload || {};
		config.liveReload.enabled = config.liveReload.enabled || true;
		config.isOptimize = config.isOptimize!==undefined;

		// instantiate express app
		app = express();

		// setup views and port
		app.set('views', VIEWS_PATH);
		app.engine(VIEWS_EXT, engines[VIEWS_COMPILER]);
		app.set('view engine', VIEWS_EXT);
		app.set('port', process.env.PORT || EXPRESS_PORT || 3000);

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
			var fullURL = req.protocol+"://";
			fullURL += req.hostname+':'+LIVERELOAD_PORT;
			fullURL += '/livereload.js';
			res.render('index', {
				reload: 	config.liveReload,
				optimize:  	config.isOptimize,
				reloadjs: 	fullURL
			});
		});
		app.use('/', router);

		// start it up
		server = app.listen(app.get('port'), function() {
			if (server_restart) return;
			console.log(DP,'VISIT ONE OF THESE URLS in CHROME WEB BROWSER',DP);
			console.log(BP,'LOCAL ... http://localhost:'+app.get('port'));
			console.log(BP,'LAN ..... http://'+ip.address()+':'+app.get('port'));
		});

		return server;

	} // startServer 


///////////////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function startLiveReload() {
		tinylr = require('tiny-lr')();
		tinylr.listen( LIVERELOAD_PORT, function () {
			console.log(DP,'Live reload of assets is enabled',DP);
		});
	} // startLiveReload


///////////////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function notifyLiveReload (event) {
		var fileName = require('path').relative(__dirname, event.path);
		tinylr.changed({
			body: {
				files: [fileName]
			}
		});
		console.log(FP,'reload:',fileName);
		startServer();
	} // notifyLiveReload


///	EXPORT ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	module.exports.startServer 		= startServer;
	module.exports.startLiveReload 	= startLiveReload;
	module.exports.notifyLiveReload = notifyLiveReload;
