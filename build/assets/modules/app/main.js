if (window.SYS1401) {
    console.error('Global SYS1401 object is already defined! Aborting.');
} else {
    window.SYS1401 = {};
    SYS1401.R_CONFIG = {
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
    requirejs.config(SYS1401.R_CONFIG);
    define(['durandal/system', 'durandal/app', 'durandal/viewLocator'],  function (system, app, viewLocator) {
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
}


