/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

	LiveReload Module 

	Accessible from both gulpfile.js and 1401-server.js

 
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

	var LIVERELOAD_PORT 	= 35729;
	var tinylr 				= require('tiny-lr')();
	var config;

	// text constants
	var DP 				= '----------';
	var FP				= '         *';


///	LIVE RELOAD SUPPORT ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Called by gulpfile.js to enable livereload for browser-served files. Note
	that livereload does NOT restart the Node server.
	**NOTE** that you need to install the LiveReload Browser Extension, 
	and also TURN IT ON in the browser (it defaults to off until clicked)
/*/	function startLiveReload ( cfg ) {
		config = cfg || getDefaultParameters();
		tinylr.listen( config.liveReloadPort, function () {
			console.log(DP,'Live reload of assets is enabled, (port',
				config.liveReloadPort+')',DP);
		});
	} // startLiveReload
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Called by gulpfile when a livereload event has been detected.
	**NOTE** that you need to install the LiveReload Browser Extension, 
	and also TURN IT ON in the browser (it defaults to off until clicked)
/*/	function notifyLiveReload ( event ) {
		var fileName = require('path').relative(__dirname, event.path);
		tinylr.changed({
			body: {
				files: [fileName]
			}
		});
		console.log(FP,'reload:',fileName);
	} // notifyLiveReload
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Called by gulpfile's runServer() to reload the whole webpage
/*/	function reloadAll () {
		tinylr.changed({
			body: {
				files: ['/']
			}
		});
	}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Called both by gulpfile.runServer() and by 1401-server.js. Note that
	1401-server.js uses this to get the default parameters, not the
	parameters that may have been set by runServer(). This is because
	the require() from different modules does not create a cached instance
	due to 1401-server running from a different process!
/*/	function getDefaultParameters () {
		// set default livereload values
		var cfg = {};
		cfg.liveReload = {};
		cfg.liveReload.enabled = true;
		cfg.liveReloadPort = LIVERELOAD_PORT;
		return cfg;
	}


///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE DEFINITION *************************************************/
	module.exports.notifyLiveReload 	= notifyLiveReload;
	module.exports.startLiveReload 		= startLiveReload;
	module.exports.reloadAll			= reloadAll;
	module.exports.getDefaultParameters = getDefaultParameters;

