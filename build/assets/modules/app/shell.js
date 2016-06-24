/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    The Durandal application shell is loaded by /modules/app/main.js as an
    object that defines object method related to routing. The routes,
    defined in the activate: function, specify what modules to load in the
    router.map() call. There is one module defined per route, which appears
    in the shell's navigation menu. 

    Note that shell.js is a Durandal "viewmodel", and has a corresponding
    "view" in shell.html that is "bound" using KnockoutJS.
 
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

define([
    'plugins/router', 
    'durandal/app'
], function (router, app) {
    // return object that implements 
    return {
        router: router,
        search: function() {
            //It's really easy to show a message box.
            //You can add custom options too. 
            // Also, it returns a promise for the user's response.
            app.showMessage('Search not yet implemented...');
        },
        activate: function () {
            router.map([
                { route: '', title:'Welcome', moduleId: 'app/viewmodels/welcome', nav: true },
                { route: 'flickr', moduleId: 'app/viewmodels/flickr', nav: false },
                { route: '_blank', title:'Blank', moduleId: '1401-games/_blank/_appshell', nav: true },
                { route: 'demo', title:'Demo', moduleId: '1401-games/demo/_appshell', nav: true }
            ]).buildNavigationModel();
            
            return router.activate();
        }
    };
});

/// EXECUTION CONTINUES IN PATHS-TO-VIEWMODELS SPECIFIED BY MODULEID
/// IN EACH ROUTE
