/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

	This is the main taskrunner for Engine 1401A1. 

	From the command line, type...
		gulp
	...to execute the build-run-livereload cycle
 
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

	var gulp        = require('gulp');
	var bower       = require('gulp-bower');
	var changed     = require('gulp-changed');
	var concat      = require('gulp-concat');
	var del         = require('del');
	var merge       = require('merge-stream');
	var runseq      = require('run-sequence');

	var BOWER       = 'bower_components/';
	var PUBLIC      = 'public/';
	var VENDOR      = PUBLIC + 'modules/vendor/';
	var MODULES     = PUBLIC + 'modules/';
	var ASSETS      = 'assets/';

	var server1401  = require('./server/1401.js');
	var server;


///	GULP TASKS ////////////////////////////////////////////////////////////////
///	
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
			gulp.src(BOWER+'physicsjs/dist/*.js').pipe(gulp.dest(VENDOR+'physicsjs'))
			// some libraries are not bower-managed, saved in vendor-extra an
			// e.g. socket-io, three.min, webrtc-adapter
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
/*/	Default
/*/	gulp.task('default', ['build'], function () {
		runServer();
	});


///	UTILITY FUNCTIONS /////////////////////////////////////////////////////////
///	
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Start up the server module
/*/	function runServer() {
		server = server1401.startServer();
		server1401.startLiveReload();
		// if changing watch path, make sure to change copy paths in tasks
		gulp.watch(ASSETS+'modules/**', function ( event ) {
			runseq (
				['copy-assets'],
				function () { server1401.notifyLiveReload(event); }
			);
		});
	}
