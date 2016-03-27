The `app` folder contains files for [Durandal web apps](http://durandaljs.com/), which is the 'host application' into which we can inject our own stuff. 

Of note is the critical `main.js`, which is loaded directly by the index.hbs page with a `<script>` tag via `requirejs`. It in turn loads `shell.js` and `shell.html` which in turn loads the tabbed content which is stored in the viewmodels and views directories.

* To add a new route, edit `shell.js` to specify what viewmodel to load. Durandal will look for a corresponding .html view file with the same name.

* To add new requirejs dependencies, edit `main.js`. 