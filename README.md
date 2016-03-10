# Engine 1401A1

This is a HTML5/Javascript **video game framework + build environment** for explaining webapp development concepts and making web-based educational applications.

It is the continuation of [Project 1401](https://github.com/daveseah/project-1401), my ongoing challenge to create a well-documented, elegant, and expressive code architecture that appeals to my coding preferences.

## Quick Start

You will be using a **terminal** window to issue all the following instructions. Install **Git** and **Node** if you haven't already. 

You will need to install the Node package **gulp-cli** once globally: 
```
    > npm install -g gulp-cli
```
Next clone the repository from **Github** into a directory. I use ~dseah/dev on my Mac, but you can use anything you want. 
```
    > cd /your/dev/folder
    > git clone https://github.com/daveseah/Engine-1401A1.git
```
This will create a folder called `Engine-1401A1` containing the project files.

Next, you'll have to install the **project's server-side dependencies** by invoking `npm install` once. The dependencies are already specified for you in the `package.json` file, and will be downloaded automatically:
```
    > cd Engine-1401A1
    > cd build
    > npm install
```
Now you're ready to **build and run** the project! Invoke the **Gulp** task runner's default action by typing:
```
    > gulp
```
The `gulp` command uses the `gulpfile.js` to execute a runtask. The default runtask invokes **Bower** to download the **client-side dependencies** (as specified in `bower.json` file), copy the files it needs into a `public` directory, and then start an **ExpressJS** server. 

You'll see the URL you need to browse to with a web browser to see the app run. I recommend **Chrome** for this project, though any mainstream HTML5-client desktop browser will probably work.

