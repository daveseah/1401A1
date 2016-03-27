#### ABOUT 1401

The **1401 Game System** is designed to be a well-behaved and expressive object-oriented framework for exploring simple game design concepts. It works inside the Durandal Web App framework.

Although its intended for simple games, the framework also strives to be a purposefully-structured, modular codebase.

The coding style is deliberately more C#-like than the usual Javascript conventions, and relies on some small extensions to the Object class to provide some syntactical sugar. Otherwise, the code is all pure Javascript.

#### FEATURES

The current demo exercises the underlying subsystems with a sprite-based 2D spaceship flying on an infinite starfield. The current libraries in use are:

* ThreeJS - a WebGL high speed graphics system for 2D and 3D graphics
* Keypress - a keyboard input module
* Howler - an audio playback module

The 1401 Game System is built around the idea of **pieces** that have **visuals** representing them. A number of classes and factory methods exist to create pieces, visuals, the renderer, and time-step based animation.

This system is a work-in-progress, so the architecture and features are subject to change. 

#### ADDING TO DURANDAL

For purposes of this document, let's say you're adding a new game tab for 'Pickles'. Follow these instructions:

* in `1401-games`, create a folder called `pickles`.
* in `1401-games/pickles`, copy the files in `1401-games/demo/game-*`
* in `app/shell.js`, edit the route definition to add 
To add a new game tab, create a folder in `1401-games` with the name of your new game.  it to app/shell.js's route definition DurandalApp can launch the **1401 Game System**

MASTER is the 1401 Game System launcher, and exposes a single method called `Start()` that accepts a `gameID` that matches a subfolder in the `1401-games` directory. The `game-start.js` file is dynamically loaded through RequireJS.

