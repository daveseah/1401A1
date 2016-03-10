/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

	This is the main taskrunner for Engine 1401A1. 

	From the command line, type...
		gulp
	...to execute the build-run-livereload cycle
 
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

	var gulp 		= require('gulp');
	var changed 	= require('gulp-changed');
	var bower 		= require('gulp-bower');
	var merge		= require('merge-stream');
	var runseq 		= require('run-sequence');

	var BOWER 		= 'bower_components/';
	var PUB 		= 'public/';
	var VLIB 		= PUB + 'vendor/';
	var ASSETS 		= 'assets/';

	var server1401	= require('./server.js');
	var server;


///	GULP TASKS ////////////////////////////////////////////////////////////////
///	
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ install bower dependencies in bower.json 
	NOTE: this is always async in Gulp 3, so need to use run-sequence to wait
	for all bower installs to complete when including this task as dependency
/*/	gulp.task('bower', function () {
		return bower();
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ copy styles
/*/	gulp.task('copy-styles', function () {
		return merge (
			gulp.src(BOWER+'bootstrap/dist/css/*').pipe(gulp.dest(VLIB+'bootstrap/css')),
			gulp.src(BOWER+'bootstrap/dist/fonts/*').pipe(gulp.dest(VLIB+'bootstrap/fonts')),
			gulp.src(BOWER+'bootstrap/dist/fonts/*').pipe(gulp.dest(VLIB+'bootstrap/fonts')),
			gulp.src(BOWER+'components-font-awesome/css/*').pipe(gulp.dest(VLIB+'font-awesome/css')),
			gulp.src(BOWER+'components-font-awesome/fonts/*').pipe(gulp.dest(VLIB+'font-awesome/fonts'))
		);
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ copy library javascripts
/*/	gulp.task('copy-libs', function () {
		return merge (
			// copy jquery
			gulp.src(BOWER+'jquery/jquery.min*').pipe(gulp.dest(VLIB+'jquery')),
			// copy bootstrap
			gulp.src(BOWER+'bootstrap/dist/js/bootstrap*').pipe(gulp.dest(VLIB+'bootstrap/js')),
			// copy durandal
			gulp.src(BOWER+'durandal/js/**').pipe(gulp.dest(VLIB+'durandal/js')),
			gulp.src(BOWER+'durandal/img/**').pipe(gulp.dest(VLIB+'durandal/img')),
			gulp.src(BOWER+'durandal/css/**').pipe(gulp.dest(VLIB+'durandal/css')),
			// copy require
			gulp.src(BOWER+'requirejs/require.js').pipe(gulp.dest(VLIB+'require')),
			gulp.src(BOWER+'requirejs-text/text.js').pipe(gulp.dest(VLIB+'require')),
			// copy knockout
			gulp.src(BOWER+'knockout.js/knockout.js').pipe(gulp.dest(VLIB+'knockout'))
		);
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	copy assets
/*/	gulp.task('copy-assets', function () {
		return merge (
			// copy assets directory as-is
			gulp.src([ASSETS+'**']).pipe(changed(PUB)).pipe(gulp.dest(PUB))
		);
	});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ build all assets
/*/	gulp.task('build', function ( callback ) {
		runseq ( 
			'bower',
			['copy-libs','copy-styles','copy-assets'],
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
		gulp.watch('assets/javascripts/**', function ( event ) {
			runseq (
				['copy-assets'],
				function () { server1401.notifyLiveReload(event); }
			);
		});
	}
