The `assets` directory contains media assets that will be loaded by a web page: images, scripts, and stylesheets.

The contents of the `assets/` directory is copied to the `public/` directory by Gulp.
Gulp also runs an ExpressJS server that serves the contents of `public/`, using `server/views/index.hbs` as the default document at `/`.