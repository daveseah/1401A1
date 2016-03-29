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
    };
    // UpdateModulePaths() resets the requirejs path configuration using the SYS1401
    // global stored object. Use AddModulePath() to update this object.
    SYS1401.UpdateModulePaths = function () {
        requirejs.config(SYS1401.RCFG);
    };

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

        app.title = 'Engine1401A1';

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
