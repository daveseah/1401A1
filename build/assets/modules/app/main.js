/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

	This is the entry point of the webapp, directly loaded by 
	server/views/index.hbs

	A global object SYS1401 is defined to provide services that can not be
	provided by RequireJS or modules loaded by it directly. 
 
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/


/// DECLARE SYS1401 GLOBAL HELPER /////////////////////////////////////////////

// define SYS1401 if it doesn't exist. If it does, that is a serious global
// namespace collision so emit the error and stop running.
if (window.SYS1401) {
	var err = document.createElement('p');
	err.nodeValue = 'Global SYS1401 object is already defined! Aborting.'; 
	document.body.appendChild(err);
	console.error(err);
} else {
	window.SYS1401 = {};
	SYS1401.TYPE = {};
	SYS1401.RCFG = {
		baseUrl: '/modules',
		paths: {
			'text': 'vendor/require/text',
			'durandal':'vendor/durandal/js',
			'plugins' : 'vendor/durandal/js/plugins',
			'transitions' : 'vendor/durandal/js/transitions',
			'knockout': 'vendor/knockout/knockout',
			'bootstrap': 'vendor/bootstrap/js/bootstrap.min',
			'jquery': 'vendor/jquery/jquery.min'
		},
		shim: {
			'bootstrap': {
				deps: ['jquery'],
				exports: 'jQuery'
		   }
		}
	};
	// AddModulePath() is used by 1401-game modules that need to add additional
	// paths to the RequireJS config. Call UpdateModulePaths() afterwards.
	SYS1401.AddModulePath = function ( module, path, exports, deps ) {
		if (typeof module!=='string') {
			console.error('SYS1401.AddModulePath requires string modulename to define');
			return;
		}
		if (typeof path!=='string') {
			console.error('SYSTEM1401.AddModulePath requires string modulename and path');
			return;
		}
		SYS1401.RCFG.paths[module] = path;
		if (typeof exports==='string') {
			SYS1401.RCFG.shim[module] = SYS1401.RCFG.shim[module] || {};
			SYS1401.RCFG.shim[module].exports = exports;
		}
		if (deps) {
			SYS1401.RCFG.shim[module] = SYS1401.RCFG.shim[module] || {};
			SYS1401.RCFG.shim[module].deps = deps;
		}
		// update module paths after each add
		SYS1401.UpdateModulePaths();
	};
	// UpdateModulePaths() resets the requirejs path configuration using the SYS1401
	// global stored object. Use AddModulePath() to update this object.
	SYS1401.UpdateModulePaths = function () {
		requirejs.config(SYS1401.RCFG);
	};
	// LocalPath( module ) returns a requireJS compatible module path
	// relative to the current working directory of the running 1401 Game. 
	// The actual function is set in MASTER.Start() in master.js
	SYS1401.LocalPath = function ( moduleName ) {
		throw "SYS1401.LocalPath() was called before MASTER.Start()";
	};
	// EnableRunSelection() is called before master.js in the _appshell.js
	// file; this is a way to remind programmers that they need to add the
	// MOD.activate Durandal binding to capture queries
	SYS1401.queryEnabled = false;
	SYS1401.GetGameModeQuery = function ( query ) {
		SYS1401.queryEnabled = true;
		SYS1401.query = query || {};        
	};
	// path utility to grab ?run=relative/path/to/module from URL
	// so it can be used as argument in a LocalPath() call
	SYS1401.GameMode = function ( def ) {
		if (SYS1401.queryEnabled) {
			SYS1401.query.mode = SYS1401.query.mode || def;
			// all game modes must be in game-modes directory
			return 'game-modes/'+SYS1401.query.mode;
		} else {
			console.error("_appshell.js must define .activate(query) that calls SYS1401.EnableRunSelection(query) to use run selection!");
		}
	};
	// utilities to determine what "phase" the application is in
	SYS1401.TYPE.PXX = 'UNIMPLEMENTED_FEATURE';
	SYS1401.TYPE.P00 = '00_LOAD_DURANDAL';
	SYS1401.TYPE.P01 = '01_CFG_DURANDAL';
	SYS1401.TYPE.P02 = '02_LOAD_SHELL';
	SYS1401.TYPE.P03 = '03_CFG_SHELL';
	SYS1401.TYPE.P04 = '04_LOAD_VIEWMODEL';
	SYS1401.TYPE.P05 = '05_LOAD_1401';
	SYS1401.TYPE.P06 = '06_CFG_1401';
	SYS1401.TYPE.P07 = '07_GAME_LOADMODULE';
	SYS1401.TYPE.P08 = '08_GAME_LOADSETTINGS';
	SYS1401.TYPE.P09 = '09_GAME_INITIALIZE';
	SYS1401.TYPE.P10 = '10_GAME_LOADASSETS';
	SYS1401.TYPE.P11 = '11_GAME_CONSTRUCT';
	SYS1401.TYPE.P12 = '12_GAME_START';
	SYS1401.TYPE.P13 = '13_GAME_RUNNING';
	SYS1401.PHASE    = SYS1401.TYPE.PXX;


/// START DURANDAL CONFIGURATION //////////////////////////////////////////////
	SYS1401.UpdateModulePaths();
	define([
		'durandal/system', 
		'durandal/app', 
		'durandal/viewLocator'
	], function (system, app, viewLocator) {
		//>>excludeStart("build", true);
		system.debug(true);
		//>>excludeEnd("build");

		// set this to empty string so "| title" isn't appended to window title
		app.title = '';

		app.configurePlugins({
			router: true,
			dialog: true
		});

		app.start().then(function() {
			//Replace 'viewmodels' in the moduleId with 'views' to locate the view.
			//Look for partial views in a 'views' folder in the root.
			viewLocator.useConvention();

			//Show the app by setting the root view model for our application with a transition.
			app.setRoot('app/shell', 'entrance');
		});
	});
} // if SYS1401

/// EXECUTION CONTINUES IN MODULES/APP/SHELL.JS
