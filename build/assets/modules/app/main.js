/// REQUIREJS CONFIG //////////////////////////////////////////////////////////

requirejs.config({
    baseUrl: '/modules',
    paths: {
        'text': 'vendor/require/text',
        'durandal':'vendor/durandal/js',
        'plugins' : 'vendor/durandal/js/plugins',
        'transitions' : 'vendor/durandal/js/transitions',
        'knockout': 'vendor/knockout/knockout',
        'bootstrap': 'vendor/bootstrap/js/bootstrap.min',
        'jquery': 'vendor/jquery/jquery.min',
 // ---- project 1401 paths added --------------------------------------------- //
        '1401' :        '1401',
        '1401-games' :  '1401-games',
// ---- project 1401 extra libs ---------------------------------------------- // 
        'three' :       'vendor-extra/three.min',
        'yaml':         'vendor/yaml.js/yaml',
        'physicsjs' :   'vendor/physicsjs/physicsjs-full.min',
        'keypress' :    'vendor/Keypress/keypress-2.1.3.min',
        'howler' :      'vendor/howler/howler',
        'webrtc-shim' : 'vendor/webrtc-adapter/adapter',
        'socket-io':    'vendor-extra/socket.io'
    },
    shim: {
        'bootstrap': {
            deps: ['jquery'],
            exports: 'jQuery'
       },
// ---- project 1401 non-AMD libs -------------------------------------------- // 
        'three': {
            exports: 'THREE'
        },
        'yaml': {
            exports: 'YAML'
        }
    }
});

/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\
 
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

define([
    'durandal/system', 
    'durandal/app', 
    'durandal/viewLocator'
],  function (
    system, 
    app, 
    viewLocator
) {

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
