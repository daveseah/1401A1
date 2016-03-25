The `app` folder contains files for [Durandal web apps](http://durandaljs.com/), which is the 'host application' into which we can inject our own stuff. 

Of note is the critical `main.js`, which is loaded directly by the index.hbs page with a `<script>` tag via `requirejs`. It in turn loads `shell.js` which in turn loads the tabbed views in the webapp. When adding new directories and libraries, you must edit `main.js` to make them acecssible via requirejs.

