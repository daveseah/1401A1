/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

	This is the main taskrunner for Engine 1401A1. 

	From the command line, type...
		gulp
	...to execute the build-run-livereload cycle
 
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

	// modules
	var gulp        = require('gulp');
	var bower       = require('gulp-bower');
	var changed     = require('gulp-changed');
	var concat      = require('gulp-concat');
	var del         = require('del');
	var merge       = require('merge-stream');
	var runseq      = require('run-sequence');
	var argv  		= require('yargs').argv;

	// paths
	var BOWER       = 'bower_components/';
	var PUBLIC      = 'public/';
	var VENDOR      = PUBLIC + 'modules/vendor/';
	var MODULES     = PUBLIC + 'modules/';
	var ASSETS      = 'assets/';
	var SERVER 		= 'server/';

	// for managing the 1401 server node process
	var spawn 		= require('child_process').spawn;
	var exec 		= require('child_process').exec;
	var server1401;

	// for handling livereload
	var LR 			= require('./server/1401-livereload');
	var restart_timeout;

	// text constants
	var BP 				= '          ';
	var INFOP 			= '         >';
	var DP 				= '----------';
	var DBGP			= '**********';
	var NP				= '         !';
	var FP				= '         *';
	var ERRP			= '       ERR';


///	GULP TASKS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Clean-out bower components and public directory
/*/	gulp.task('clean:all', function () {
		return del([BOWER,PUBLIC]);
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	clean out public directory
/*/	gulp.task('clean', function () {
		return del(PUBLIC);
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Install bower dependencies in bower.json 
	NOTE: this is always async in Gulp 3, so need to use run-sequence to wait
	for all bower installs to complete when including this task as dependency
/*/	gulp.task('bower-get', function () {
		return bower();
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Copy framework-related modules and assets in bower_components.
	As far as I can tell, this is the "best practice" approach to copy
	from bower_components
/*/	gulp.task('copy-bower-assets', function () {
		return merge (
			// copy jquery
			gulp.src(BOWER+'jquery/jquery.min*').pipe(gulp.dest(VENDOR+'jquery')),
			// copy bootstrap
			gulp.src(BOWER+'bootstrap/dist/js/bootstrap*').pipe(gulp.dest(VENDOR+'bootstrap/js')),
			gulp.src(BOWER+'bootstrap/dist/css/*').pipe(gulp.dest(VENDOR+'bootstrap/css')),
			gulp.src(BOWER+'bootstrap/dist/fonts/*').pipe(gulp.dest(VENDOR+'bootstrap/fonts')),
			gulp.src(BOWER+'bootstrap/dist/fonts/*').pipe(gulp.dest(VENDOR+'bootstrap/fonts')),
			// copy font awesome
			gulp.src(BOWER+'components-font-awesome/css/*').pipe(gulp.dest(VENDOR+'font-awesome/css')),
			gulp.src(BOWER+'components-font-awesome/fonts/*').pipe(gulp.dest(VENDOR+'font-awesome/fonts')),
			// copy durandal
			gulp.src(BOWER+'durandal/js/**').pipe(gulp.dest(VENDOR+'durandal/js')),
			gulp.src(BOWER+'durandal/img/**').pipe(gulp.dest(VENDOR+'durandal/img')),
			gulp.src(BOWER+'durandal/css/**').pipe(gulp.dest(VENDOR+'durandal/css')),
			// copy require
			gulp.src(BOWER+'requirejs/require.js').pipe(gulp.dest(VENDOR+'require')),
			gulp.src(BOWER+'requirejs-text/text.js').pipe(gulp.dest(VENDOR+'require')),
			// copy knockout
			gulp.src(BOWER+'knockout.js/knockout.js').pipe(gulp.dest(VENDOR+'knockout'))
			// NOTE: add additional bower assets in the 'copy-more-bower-assets' task
			// this task is for 1401 essentials only
		);
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Copy extra framework modules and assets from bower_components. 
	Use copy-frame-assets as an example
/*/	gulp.task('copy-more-bower-assets', function () {
		// add additional bower_component libraries
		return merge (
			// copy yaml
			gulp.src(BOWER+'yaml.js/dist/yaml.*').pipe(gulp.dest(VENDOR+'yaml.js')),
			// copy keypress
			gulp.src(BOWER+'Keypress/*.js').pipe(gulp.dest(VENDOR+'Keypress')),
			// copy howler
			gulp.src(BOWER+'howler/*.js').pipe(gulp.dest(VENDOR+'howler')),
			// copy physicsjs
			gulp.src(BOWER+'physicsjs/dist/*.js').pipe(gulp.dest(VENDOR+'physicsjs')),
			// copy webrtc shims
			gulp.src(BOWER+'webrtc-adapter/release/adapter.js').pipe(gulp.dest(VENDOR+'webrtc-adapter'))
			// NOTE: For libraries are not bower-managed, save them in 
			// modules/vendor-extra and they will be copied over in 'copy-assets'
		);
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Copy non-framework modules and assets, ignoring Markdown files.
    This includes vendor-extra, which contains non-bower managed libs.
/*/	gulp.task('copy-assets', function () {
		return merge (
			// copy modules directory, skipping framework
			gulp.src([
					ASSETS+'modules/**/!(*.md)'
				])
			    .pipe(changed(PUBLIC))
			    .pipe(gulp.dest(PUBLIC+'modules')),
			// copy images directory as-is
			gulp.src([
					ASSETS+'images/**/!(*.md)'
				])
			    .pipe(changed(PUBLIC))
			    .pipe(gulp.dest(PUBLIC+'images')),
			// copy stylesheets as-is
			gulp.src([
					ASSETS+'styles/**/!(*.md)'
				])
			    .pipe(changed(PUBLIC))
			    .pipe(gulp.dest(PUBLIC+'styles'))
		);
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Example of concatenation (not used)
/*/	gulp.task('example-concat', function () {
		return merge ( 
		    // note: add additional gulp pipes at top, not bottom //
			gulp.src([
					ASSETS+'modules/vendor_extra/*.css'
				])
		    	.pipe(concat('vendor_extra.css'))
		    	.pipe(gulp.dest(PUBLIC+'styles'))
		);
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Gather and build all files to public 
/*/	gulp.task('build', function ( callback ) {
		runseq ( 
			'bower-get',
			[
				'copy-bower-assets',
				'copy-more-bower-assets',
				'copy-assets'
			],
			callback
		);
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Run server
/*/	gulp.task('server', function () {
		runServer();
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Run server in debug mode
/*/	gulp.task('debug', ['build'], function () {
		runServer({ debug: true });
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Default
/*/	gulp.task('default', function () {
		runseq (
			'build',
			'server'
		);
	});


///	SERVER ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Start up the server module, passing yargs.argv object, which will be
	used as a configuration object by startServer
/*/	function runServer( cfg ) {
		// debug flag will spawn server with node-inspector
		config = cfg || {};
		config.debug = config.debug || false;

		// spawn the process!
		spawnProcess( config );
	}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ spawn the process based on the stored config parameters
/*/	function spawnProcess ( cfg ) {
		var progname = 'node';
		var args = [];
		if (config.debug) {
			progname += '-debug';
			args.push('--debug-brk=0');
			args.push('-c');
			console.log( DBGP,'RUNNING IN NODE DEBUG MODE' );
		}
		var script = './server/1401.js';
		args.push(script);
		var opt = {
			env: process.env,
			detached: true
		};

		// check for running 1401 process
		var check = progname+' '+script;
		exec('pgrep -f "'+check+'"', function (err,stdout,stdin) {
			if (stdout) {
				console.log("\n!!! 1401 SERVER IS ALREADY RUNNING !!!");
				console.log("    Is it running in another terminal window?");
				console.log("    Use control-c to terminate it.\n");
				console.log("    If server has crashed, use 'pgrep -f 1401.js' to find the PID number");
				console.log("    then use 'kill -9 <PID number>' to force termination.\n");
				// exec('pkill '+stdout, function(err,stdout,stdin) {});
			} else {
				// fork the 1401 process
				server1401 = spawn( progname, args, opt, 
					function( err, stdout, stderr ) {
						console.log('callback from spawn');
						if (err) console.log(err);
						if (stdout) console.log(stdout);
						if (stderr) console.log(stderr);
					}
				);
				// redirect child stdout so we can see it more as it happens
				server1401.stdout.pipe(process.stdout);
				server1401.stderr.pipe(process.stderr);

				// start livereload
				// spawn livereload configuration w/ default config
				LR.startLiveReload();

				// If changing watch path, make sure to change copy paths in tasks
				// Requires LiveReload browser extension installed in browser
				// and it must enabled AND connected.
				gulp.watch(ASSETS+'modules/**', function ( event ) {
					runseq (
						['copy-assets'],
						function () { LR.notifyLiveReload( event ); }
					);
				});

				// handle changes to server files
				gulp.watch([SERVER+'**/**.js',SERVER+'**/**.hbs'], function ( event ) {
					var delay = 1500;
					kill1401server();
					console.log(DBGP,'SERVER  reload in',delay,'ms...');
					if (restart_timeout) clearTimeout(restart_timeout);
					restart_timeout = setTimeout( function() {
						spawnProcess();
						console.log(DBGP,'BROWSER reload in',delay,'ms...');
						setTimeout( function () {
							LR.reloadAll();
						}, delay);
					}, delay);
				});
			}
		});
	}


///	PROCESS CONTROL ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Kill the running instance of 1401.js
/*/	function kill1401server () {
		if (server1401) {
			process.kill(-server1401.pid);
			server1401 = null;
			console.log('\n');
		}
	}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	EXECUTE IMMEDIATELY: On control-c, we need to stop the 1401 webserver
/*/	process.on('SIGINT', function () {
		kill1401server();
		console.log('exiting process...');
		process.exit();
	});
