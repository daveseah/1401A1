The Engine 1401A1 build system makes use of the following development tools: 

* **git** - the distributed source code management system
* **node.js** - the server-side javascript-based runtime environment
* **npm** - the server-side package manager for node.js libraries
* **Bower** - the browser-side package manager for javascript libraries
* **Gulp** -  a task/build runner for automating the development process

The codebase itself is built on top of the following frameworks:

* **ExpressJs** - a node.js package that simplifies web server development
* **RequireJs** - a modular javascript script loader for web browsers
* **DurandalJs** - a modular MVVM web application framework for web browsers
* **KnockoutJs** - a MVVM data binding layer for web browsers

Here is a high-level map of the project structure:
``` text
SOURCE CODE FILES
  assets/               # browser-side 1401A1 source code+media
    images/             # .. small images
    javascripts/        # .. modular javascript (uses requirejs)
    styles/             # .. css stylesheets and related images
    vendor-extra/       # .. javascript libs not managed by bower
  server/               # server-side 1401A1 source code+media
    1401.js             # 1401A1 server (run from gulpfile.js)
    views/              # .. express templates
      index.hbs         # .. 1401A1 index page

CONFIGURATION FILES
  gulpfile.js           # build task definitions for gulp
  bower.json            # bower dependencies (used by gulp-bower)
  package.json          # node.js dependencies (used by npm)

GENERATED DIRECTORIES (NOT IN REPO)
  bower_components/     # browser-side libraries (bower-managed)
  node_modules/         # server-side libraries (npm-managed)
  public/               # "compiled" code served by 1401.js

```

See the README files within subdirectories for more detailed information.
