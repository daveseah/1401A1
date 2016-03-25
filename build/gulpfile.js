/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

	This is the main taskrunner for Engine 1401A1. 

	From the command line, type...
		gulp
	...to execute the build-run-livereload cycle
 
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

	var gulp 		= require('gulp');
	var bower 		= require('gulp-bower');
	var changed 	= require('gulp-changed');
	var del 		= require('del');
	var merge		= require('merge-stream');
	var runseq 		= require('run-sequence');

	var BOWER 		= 'bower_components/';
	var PUB 		= 'public/';
	var VENDOR 		= PUB + 'modules/vendor/';
	var ASSETS 		= 'assets/';

	var server1401	= require('./server/1401.js');
	var server;


///	GULP TASKS ////////////////////////////////////////////////////////////////
///	
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	clean out bower components and public directory
/*/	gulp.task('clean:all', function () {
		return del([BOWER,PUB]);
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	clean out public directory
/*/	gulp.task('clean', function () {
		return del(PUB);
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ install bower dependencies in bower.json 
	NOTE: this is always async in Gulp 3, so need to use run-sequence to wait
	for all bower installs to complete when including this task as dependency
/*/	gulp.task('bower-get', function () {
		return bower();
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ copy bower library styles
/*/	gulp.task('copy-bower-styles', function () {
		return merge (
			gulp.src(BOWER+'bootstrap/dist/css/*').pipe(gulp.dest(VENDOR+'bootstrap/css')),
			gulp.src(BOWER+'bootstrap/dist/fonts/*').pipe(gulp.dest(VENDOR+'bootstrap/fonts')),
			gulp.src(BOWER+'bootstrap/dist/fonts/*').pipe(gulp.dest(VENDOR+'bootstrap/fonts')),
			gulp.src(BOWER+'components-font-awesome/css/*').pipe(gulp.dest(VENDOR+'font-awesome/css')),
			gulp.src(BOWER+'components-font-awesome/fonts/*').pipe(gulp.dest(VENDOR+'font-awesome/fonts'))
		);
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ copy bower library javascripts
/*/	gulp.task('copy-bower-libs', function () {
		return merge (
			// copy jquery
			gulp.src(BOWER+'jquery/jquery.min*').pipe(gulp.dest(VENDOR+'jquery')),
			// copy bootstrap
			gulp.src(BOWER+'bootstrap/dist/js/bootstrap*').pipe(gulp.dest(VENDOR+'bootstrap/js')),
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
/*/	copy browser-side assets
/*/	gulp.task('copy-client-assets', function () {
		return merge (
			// copy assets directory as-is
			gulp.src([ASSETS+'modules/**']).pipe(changed(PUB)).pipe(gulp.dest(PUB+'modules')),
			gulp.src([ASSETS+'images/**']).pipe(changed(PUB)).pipe(gulp.dest(PUB+'images')),
			gulp.src([ASSETS+'styles/**']).pipe(changed(PUB)).pipe(gulp.dest(PUB+'styles'))
		);
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ gather and build all files to public 
/*/	gulp.task('build', function ( callback ) {
		runseq ( 
			'bower-get',
			['copy-bower-libs','copy-bower-styles','copy-client-assets'],
			callback
		);
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ run server
/*/	gulp.task('server', function () {
		runServer();
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	default
/*/	gulp.task('default', ['build'], function () {
		runServer();
	});


///	UTILITY FUNCTIONS /////////////////////////////////////////////////////////
///	
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ start up the server module
/*/	function runServer() {
		server = server1401.startServer();
		server1401.startLiveReload();
		// if changing watch path, make sure to change copy paths in tasks
		gulp.watch(ASSETS+'modules/**', function ( event ) {
			runseq (
				['copy-client-assets'],
				function () { server1401.notifyLiveReload(event); }
			);
		});
	}
