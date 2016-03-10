/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

	server.js is imported by gulpfile.js as a module

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

	// allocate 
	var tinylr;	// set by startLiveReload
	var app; 	// set by startServer
	var server;	// set by startServer


///////////////////////////////////////////////////////////////////////////////

	var LIVERELOAD_PORT = 35729;
	var EXPRESS_PORT 	= 3000;
	var VIEWS_PATH 		= __dirname+'/server/views';
	var VIEWS_EXT 		= 'hbs';
	var VIEWS_COMPILER 	= 'handlebars';
	var COMPILED_DIR 	= __dirname+'/public';

///////////////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function startServer ( config ) {

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
		  console.log('Express server listening on port %s...',app.get('port'));
		});

		return server;

	} // startServer 


///////////////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function startLiveReload() {
		tinylr = require('tiny-lr')();
		tinylr.listen( LIVERELOAD_PORT, function () {
			console.log('LiveReload listening on port %s...',LIVERELOAD_PORT);
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
	} // notifyLiveReload


///	EXPORT ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	module.exports.startServer 		= startServer;
	module.exports.startLiveReload 	= startLiveReload;
	module.exports.notifyLiveReload = notifyLiveReload;
