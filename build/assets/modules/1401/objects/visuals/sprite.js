/* sprite.js */
define ([
	'three',
	'1401/settings'
], function ( 
	THREE,
	SETTINGS
) {

	var DBGOUT = false;

/**	SPRITE *******************************************************************\

	An extension of the THREE.Sprite class:
	* spritesheet
	* sprite animation


/** PRIVATE DECLARATIONS *****************************************************/

	var DEFAULT_FPS = 4;

/** OBJECT DECLARATION *******************************************************/

	/* constructor */
	function InqSprite ( spriteMaterial ) {

		// pass up constructor
		THREE.Sprite.call(this,spriteMaterial);

		// make this testable
		this.inqsprite = true;

		// spritesheet support
		this.frames = null;		// frame objects (deprecated)
		this.frameIndex = 0;	// deprecated
		this.frameRate = 6;		// default framerate, on 4s (deprecated)

		// spritesheet support
		this.sequences = {};	// sequence objects
		this.seqRateTimer = Math.floor(1000/DEFAULT_FPS);
		this.seqRuns = 0;		// run counter/pause countrol
		// full sequence play mode
		this.seqMode = InqSprite.RUN_INIT;
		this.seq = null;		// current sequence
		// deferred spritesheet load
		this.sequenceQueue = [];

		// set when spritesheet in use
		// to ensure proper scaling
		this.fractionalWidth = null;
		this.fractionalHeight = null;
		this.zoom = 1;

		// update handler
		this.updateFunc = null;

		// async loading flags
		this.textureQueue = [];
		this.textureQCount = 0;

	}
	/* special values for seqRuns */
	InqSprite.MODE_FOREVER = -1;
	InqSprite.MODE_STOPPED = 0;
	/* values > 0 are run count */
	/* sequence play control */
	InqSprite.RUN_INIT = 20;
	InqSprite.RUN_PLAYING = 21;
	InqSprite.RUN_LAST = 22;
	InqSprite.RUN_COMPLETE = 23;

	/* inheritance */
	InqSprite.inheritsFrom(THREE.Sprite);

/// PRE-ALLOCATED HEAP-SAVING VARIABLES /////////////////////////////////////

	var override, seq, elapsed, opacity, runs, isPlaying, isSequenceMatch;
	var cmd, frame, bm;


///	OVERRIDE METHODS ////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	var _super = {};
	_super.toJSON = THREE.Sprite.prototype.toJSON;
	_super.clone = THREE.Sprite.prototype.clone;
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	InqSprite.method('toJSON', function () {
		var json = _super.toJSON.call(this);
		json.ex1401 = {
			type: 'inqsprite',
			properties: {
				sequences: this.sequences,
				seqRateTimer: this.seqRateTimer,
				seqRuns: this.seqRuns,
				seq: this.seq,
				fractionalWidth: this.fractionalWidth,
				fractionalHeight: this.fractionalHeight,
				zoom: this.zoom
			}
		};
		return json;
	});

///	METHODS /////////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	InqSprite.method('Update', function ( ms ) {
		// private updateFunction for certain kinds of animation support
		override = false;
		if (this.updateFunc) {
			// updateFunc can override default update methods by returning TRUE
			override = this.updateFunc.call (this, ms);
		}
		if (!override) {
			if (this.seq) {
				this.PRI_UpdateSequence ( ms );
			}
			if (this.pulseDirection!==undefined) {
				this.PRI_UpdatePulse ( ms );
			}
		}
	});

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Shows next frame of the current sequence based on elapsed time.
/*/	InqSprite.method('PRI_UpdateSequence', function ( ms ) {
		if (this.seqMode==InqSprite.RUN_COMPLETE) return;
		this.seqRateTimer -= ms;
		if (this.seqMode==InqSprite.RUN_LAST) {
			// handles last timer cycle so last frame shows entire time
			this.seqMode = InqSprite.RUN_COMPLETE;
		}
		if (this.seqRuns==InqSprite.MODE_STOPPED) return;
		seq = this.seq;
		if (this.seqRateTimer <= 0 ) {
			this.seqRateTimer = seq.rate;
			++seq.index;
			// end of frame sequence reached, check runs
			if (seq.index>seq.frames.length-1) {
				// any more runs to go?
				if (this.seqRuns>0) {
					--this.seqRuns;
					if (this.seqRuns==InqSprite.MODE_STOPPED) {
						this.seqMode = InqSprite.RUN_LAST;
						seq.index = seq.frames.length-1;
					} else {
						seq.index = 0;
					}
				} else {
					seq.index = 0;
				}
			}
			if (this.seqMode!==InqSprite.RUN_LAST)
				this.PRI_ShowSequenceFrame(seq);
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	handles pulse behavior
	pulseStart, pulseEnd, pulseDuration, pulseDirection
/*/	InqSprite.method('PRI_UpdatePulse', function ( ms ) {

		elapsed = SETTINGS.MasterTime() - this.pulseStart;
		if (elapsed>this.pulseDuration) {
			elapsed=this.pulseDuration;
		}
		opacity =  elapsed / this.pulseDuration;
		opacity = (this.pulseDirection>0) ? opacity : 1 - opacity;
		this.material.opacity = opacity;
		this.material.needsUpdate = true;
		if (elapsed===this.pulseDuration) {
			if (this.pulseRepeat) {
				this.pulseDirection *= -1;
				this.pulseStart=SETTINGS.MasterTime();
				this.pulseSend=this.pulseStart+this.pulseDuration;
			} else {
				this.pulseDirection=undefined;
			}
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ texturePath is relative to root of public directory, which contains /javascript
	folder.
/*/	InqSprite.method('SetTexture', function ( texturePath, onValid ) {
		if (!onValid) console.warn("InqSprite.SetTexture() should use callback");
		var that = this;
		this.textureQueue.push('['+(this.textureQCount++)+']'+texturePath);

		SETTINGS.XSSTextureCheck (texturePath);

		var texture = THREE.ImageUtils.loadTexture ( texturePath, THREE.UVMAPPING, st_onload, st_onerr );
		console.assert(texture,"Can't find texture",texturePath);
		this.material.map = texture;
		this.material.needsUpdate = true;

		// support function called on successful texture load, called only once
		// per texture path apparently (?)
		function st_onload ( texture ) {
			var loaded = that.textureQueue.shift();
			if (DBGOUT) console.log("Sprite.SetTexture(): async load complete",loaded);

			// get fullsize dimensions of texture in pixels
			var ww = texture.image.width;
			var hh = texture.image.height;

			// set the sprite to the proper size
			that.SetScaleXYZ( ww, hh, 1 );
			if (DBGOUT) console.log("Sprite.SetTexture(): setting scale",ww+'x'+hh);

			// inform callee
			if (onValid) onValid.call(that, texture);

			// check for queued sequence play comment
			that.PRI_CheckSequenceQueue();
		}

		function st_onerr ( err ) {
			var loaded = that.textureQueue.shift();
			if (DBGOUT) console.error("Sprite.SetTexture(): failed to load",loaded);	
			console.log(err);
		}

	});

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ to rotate a sprite, you need to rotate its material, not its visual
	rotation property.
/*/	InqSprite.method('Rotate', function ( rot ) {
		this.material.rotation = rot;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	return true if material loaded
/*/	InqSprite.method('TextureIsLoaded', function () {
		return this.material.map.image!==undefined;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	return size of sprite texture (material) if it's been loaded yet,
	undefined if invalid
/*/	InqSprite.method('TextureDimensions', function () {
		if (this.TextureIsLoaded()) {
			return { 
				w: this.material.map.image.width, 
				h: this.material.map.image.height
			};
		} else {
			console.error('Sprite texture not yet loaded, so texture dimensions not available');
			return undefined;
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	return size of sprite (taking spritesheet into account) if it's valid,
	undefined if invalid
/*/	InqSprite.method('SpriteDimensions', function () {
		if (this.TextureIsLoaded()) {
			var fracWidth = this.fractionalWidth || 1;
			var fracHeight = this.fractionalHeight || 1;
			var dim = this.TextureDimensions();
			dim.w *= fracWidth;
			dim.h *= fracHeight;
			return dim;
		} else {
			console.error('Sprite texture not yet loaded, so Sprite dimensions not available');
			return undefined;
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	This is a ThreeJS-specific non-uniform scale setter. It's used to size
	a sprite exactly to the size it should be. Z is not scaled.
/*/	InqSprite.method('SetScaleXYZ', function ( x,y,z ) {
		var s = this.zoom;
		this.scale.set(s*x,s*y,z); // for threeJS scaling, which we are controlling
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*	This will return the current scale of the sprite, which might not be what
	you want. Use TextureDimensions() and SpriteDimensions() to get the 
	native size of the sprite texture (spritesheet) or sprite base dimensions.
/*/	InqSprite.method('ScaleXYZ', function () {
		return { x: scale.x, y: scale.y, z: scale.z }; // for threeJS scaling
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	This is a universal scaling factor, separate from ScaleXYZ, for relative
	sizing of sprites (think of it as a zoom)
/*/	InqSprite.method('SetZoom', function ( s ) {
		this.zoom = s;
		// handle asynchronous loading condition
		if (this.TextureIsLoaded()) {
			var dim = this.SpriteDimensions();
			// SetScaleXYZ will use zoom setting
			this.SetScaleXYZ( dim.w, dim.h, 1);
		} else {
			if (DBGOUT) console.warn("Called SetZoom("+this.zoom+") before texture loaded. Deferring operation");
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	InqSprite.method('Zoom', function ( s ) {
		return this.zoom;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	InqSprite.method('Show', function () {
		this.visible = true;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	InqSprite.method('Hide', function () {
		this.visible = false;
	});





/**	SPRITE SEQUENCES ********************************************************\

	Sprite Sequences are based on spritesheets. Yay!

\****************************************************************************/

/*/	DefineSequences() accepts a graphics pathname and a sequence spec to
	create 'named sequences' of sprite frames. The graphics pathname 
	should be arranged as a spritesheet grid. The specification is:
	{
		DIVIDE SPRITESHEET BY ROWS/COLS
		grid: { rows: <int>, columns: <int>, stacked:<bool> },
		- or - 
		USE CELLS OF SIZE WIDTHxHEIGHT
		grid: { width: <int>, height: <int>, stacked:<bool> },

		sequences: [
			{ name: <string>, framecount: <int>, fps: <int> }
			...
		]
	}
	The 'stacked' property, when true, restarts each sequence at the
	beginning of a row on the spritesheet, as opposed to a packed
	spritesheet.
/*/	InqSprite.method('DefineSequences', function ( textureName, spec, onValid ) {

		var that = this;

		var grid = spec.grid;
		if (!grid) throw "DefineSequences: requires spec.grid object";
	//  validate grid property
		if (grid.width && grid.height) {
			// this is a block-style definition
			// validate numbers
			if (typeof grid.width!=='number') throw "DefineSequences: width must be integer";
			if (typeof grid.height!=='number') throw "DefineSequences: height must be integer";
			grid.type = 'block';
		} 
		if (grid.columns && grid.rows) {
			// this is a partition grid definition
			// validate that we haven't already set the 'block' 
			if (grid.type==='block') throw "DefineSequences: columns/rows invalid when using width/height";
			if (typeof spec.grid.rows!=='number') throw "DefineSequences: rows must be integer";
			if (typeof spec.grid.columns!=='number') throw "DefineSequences: columns must be integer";
			// check for valid texture size later
			grid.type = 'grid';			
		}
	//  validate sequences property
		var seqs = spec.sequences && spec.sequences.length;
		seqs = spec.sequences && (spec.sequences.length > 0);
		if (seqs) {
			seqs = spec.sequences;
		} else {
			console.error("DefineSequences: spec.sequences is bad");
			return;
		}
	//  validate sequences property
		this.SetTexture(textureName, ContinueDefineSequences); 

		/*** this function executes after SetTexture() call succeeds **/
		function ContinueDefineSequences (texture) {

			var index = 0;
			var fracWidth, fracHeight;
			switch (grid.type) {
				case 'block':
					grid.columns 	= Math.floor(texture.image.width / grid.width);
					grid.rows 		= Math.floor(texture.image.height / grid.height);
					if (DBGOUT) console.log('BLOCK MODE: fitted cell grid',grid.columns+'x'+grid.rows);
					fracWidth 		= grid.width / texture.image.width;
					fracHeight 		= grid.height / texture.image.height;
					if (DBGOUT) console.log('BLOCK MODE: frac cell dim',fracWidth.toFixed(3)+'x'+fracHeight.toFixed(3));
					break;
				case 'grid':
					// grid.columns and grid.rows already defined by spec
					// test width
					fracWidth  		= 1 / grid.columns;
					if ((texture.image.width % grid.columns)!==0)
						throw "DefineSequences: width of texture should be evenly divisible by columns";
					// test height
					fracHeight 		= 1 / grid.rows;

					if ((texture.image.height % grid.rows)!==0)
						throw "DefineSequences: height of texture should be evenly divisible by rows";
					break;
				default: 
					throw "DefineSequences: unexpected grid type!"+grid;
			}

			// now iterate over each sequence
			for (var i=0;i<seqs.length;i++) {

				var name = seqs[i].name;
				var fcount = seqs[i].framecount;
				var fps = seqs[i].fps || DEFAULT_FPS;
				var frate = Math.floor(1000/fps);
				var str1 = '';
				var str2 = '';
				var str3 = '';

				str2 += "SEQ "+name.bracket();
				if (grid.stacked) {
					str2+=" stacked "+grid.type;
					var mod = index % grid.columns;
					if (mod) index += grid.columns - mod;
					console.assert(index < (grid.rows * grid.columns),"index out of range");
				}

				/* Sequence Object Definition */
				var sobj = {
					name: name,
					index: 0,
					mode: InqSprite.RUN_INIT,
					rate: frate,
					frames: []
				};

				str1 += index.zeroPad(3)+'-'+(index+fcount-1).zeroPad(3);
				if (DBGOUT) console.log(str1,str2);

				for (var f=0;f<fcount;f++) {
					console.assert(index < (grid.rows * grid.columns),"index out of range");
					/* Frame Object Definition */
					var fobj = {
						fw:     fracWidth,
						fh:     fracHeight,
//						offx:   (index % grid.columns) / grid.columns,
						offx:   (index % grid.columns) * fracWidth,	// left
//						offy:   1 - (1/grid.rows) - (Math.floor(index / grid.columns) / grid.rows)
						offy:   1 - (Math.floor(index / grid.columns) * fracHeight) - fracHeight
					};
					sobj.frames.push(fobj);
					str3 = '('+fobj.offx.toFixed(3)+', ';
					str3 += fobj.offy.toFixed(3)+') ';
					if (DBGOUT) console.log(' ',index.zeroPad(3),str3);
					++index;
				}
				// save the sequence object
				that.sequences[name]=sobj;
			}

			// save magic sprite scaler properties used by draw routines
			that.fractionalWidth = fracWidth;
			that.fractionalHeight = fracHeight;
			// after texture has loaded, we want to make sure that
			// we scale it to the size of a grid cell to override
			// SetTexture's default "scale to fit" everything.
			that.scale.x *= fracWidth;
			that.scale.y *= fracHeight;

			// load first sequence,first frame to force sprite drawing
			that.GoSequence(seqs[0].name);

			// inform callee
			if (onValid) onValid.call(that, texture);

		} // end of ContinuingFunction

	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	PlaySequence() starts to play the sequence at the designated seqName +
	offset, if one is defined.
/*/	InqSprite.method('PlaySequence', function ( seqName, runs ) {
		if (this.textureQueue.length) {
			this.sequenceQueue.push({name:seqName, runs: runs, mode:'play'});
			if (DBGOUT) console.log("Sprite.PlaySequence(): deferring",seqName.bracket(),"until texture loaded");
			return;
		}
		runs = runs || InqSprite.MODE_FOREVER;
		seq = this.sequences[seqName];
		if (!seq) {
			console.error("sequence",seqName,"does not exist");
			return;
		}
		seq.index = 0;
		// set the current sequence
		this.seqMode = InqSprite.RUN_INIT;
		this.PRI_SetSequence(seq,runs);
		// show the frame
		this.seqMode = InqSprite.RUN_PLAYING;
		this.PRI_ShowSequenceFrame(seq);
		// RUN_LAST will be set by update loop
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	GoSequence() loads the sequence, with an optional offset, and then
//  stops.
/*/	InqSprite.method('GoSequence', function ( seqName, offset ) {
		if (this.textureQueue.length) {
			this.sequenceQueue.push({name:seqName, offset: offset, mode:'go'});
			if (SETTINGS.InfoTrace('sprite')) {
				console.log("Sprite.GoSequence(): deferring",seqName.bracket(),"until texture loaded");
			}
			return;
		}
		runs = InqSprite.MODE_STOPPED;
		offset = offset || 0;
		seq = this.sequences[seqName];
		if (!seq) {
			console.error("sequence",seqName,"does not exist");
			return;
		}
		if (offset) {
			if (offset>seq.frames.length-1) {
				offset = seq.frames.length-1;
				console.warn("warning: offset for",seqName," > framecount");
			}
			if (offset<0) {
				offset = 0;
				console.warn("warning: offset < 0");
			}
			seq.index = offset;
		} else {
			seq.index = 0;
		}
		// set the current sequenc
		this.seqMode = InqSprite.RUN_INIT;
		this.PRI_SetSequence(seq,runs);
		// show the frame
		this.seqMode = InqSprite.RUN_PLAYING;
		this.PRI_ShowSequenceFrame(seq);
		// set completed
		this.seqMode = InqSprite.RUN_LAST;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Advance the current sequence by one frame.
/*/	InqSprite.method('IncrementSequence', function () {
		this.seq.index++;
		if (this.seq.index > this.seq.frames.length-1)
			this.seq.index = 0;
	});
/*/	Back-up the current sequence by one frame.
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	InqSprite.method('DecrementSequence', function () {
		this.seq.index--;
		if (this.seq.index<0) 
			this.seq.index = this.seq.frames.length-1;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Check to see if Sequence is done playing
/*/	InqSprite.method('SequenceIsPlaying', function ( seqName ) {
		isPlaying = this.seqRuns !== InqSprite.MODE_STOPPED;
		isSequenceMatch = true;
		if (seqName) {
			isSequenceMatch = (this.seq===this.sequences[seqName]);
		}
		return (isPlaying && isSequenceMatch);
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Return TRUE if on last frame of sequence
/*/	InqSprite.method('SequenceIsLastFrame', function () {
		return (this.seq.index==this.seq.frames.length-1);
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Return TRUE if the complete repeated run has completed in full.
	Which is not the same as checking if MODE_STOPPED is true, which
	is a form of pause control (weird pause control, though)
/*/	InqSprite.method('SequenceIsRunComplete', function () {
		return (this.seqMode==InqSprite.RUN_COMPLETE);
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	InqSprite.method('SequenceIsRunPlaying', function () {
		return (this.seqMode==InqSprite.RUN_PLAYING);
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Return Sequence Run Remaining (-1 = infinite)
/*/	InqSprite.method('SequenceRunsRemaining', function ( seqName ) {
		return this.seqRuns;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Return Sequence Frame Count
/*/	InqSprite.method('SequenceFrameCount', function ( seqName ) {
		seq = this.PRI_GetSequence(seqName);
		return seq.frames.length;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Return current sequence name
/*/	InqSprite.method('SequenceCurrentName', function () {
		return this.seq.name;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Return current frame index 
/*/	InqSprite.method('SequenceCurrentIndex', function () {
		return this.seq.index;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	PRIVATE utility to return current sequence or named sequence 
/*/	InqSprite.method('PRI_GetSequence', function ( seqName ) {
		// if seqName null, then return current sequence (default case)
		return (seqName===undefined) ? this.seq : this.sequences[seqName];
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	PRIVATE: show current frame of the passed sequence object
/*/	InqSprite.method('PRI_ShowSequenceFrame', function ( seq ) { 
		frame = seq.frames[seq.index];
		bm = this.material.map;
		bm.repeat.set(frame.fw,frame.fh);
		bm.offset.set(frame.offx,frame.offy);
		if (bm.image) {
			bm.image.needsUpdate = true;
		} else {
			console.error("Invalid image ");
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Sets current sequence and initializes in default STOPPED state
/*/	InqSprite.method('PRI_SetSequence', function ( seq, runs ) {
		runs = runs || InqSprite.MODE_STOPPED;
		this.seqRuns = runs;
		this.seqRateTimer = seq.rate;
		this.seq = seq;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	If PlaySequence() or GoSequence() is called while DefineSequence() is
	still loading, it is queued and checked in SetTexture()'s success func
/*/	InqSprite.method('PRI_CheckSequenceQueue', function () {
		cmd = this.sequenceQueue.shift();
		if (!cmd) return;
		switch (cmd.mode) {
			case 'go':
				if (DBGOUT) console.info("executing deferred GoSequence",cmd.name.bracket());
				this.GoSequence(cmd.name,cmd.offset);
				break;
			case 'play':
				if (DBGOUT) console.info("executing deferred PlaySequence",cmd.name.bracket());
				this.PlaySequence(cmd.name,cmd.runs);
				break;
			default: 
				console.error('unknown seqcmd',cmd.name);
		} 
	});


/// SPRITE PULSING ///////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/	InqSprite.method('PulseUp', function ( period_ms, repeat ) {
		// don't start if a pulse is already ongoing
		if (this.pulseDuration) return;
		// otherwise do it
		period_ms = period_ms || 1000;
		this.pulseStart = SETTINGS.MasterTime();
		this.pulseEnd = this.pulseStart + period_ms;
		this.pulseDuration = period_ms;
		this.pulseDirection = 1;
		this.pulseRepeat = repeat || false;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/	InqSprite.method('PulseDown', function ( period_ms, repeat ) {
		// don't start if a pulse is already ongoing
		if (this.pulseDuration) return;
		// otherwise do it
		period_ms = period_ms || 1000;
		this.pulseStart = SETTINGS.MasterTime();
		this.pulseEnd = this.pulseStart + period_ms;
		this.pulseDuration = period_ms;
		this.pulseDirection = -1;
		this.pulseRepeat = repeat || false;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/	InqSprite.method('IsPulsing', function () {
		return (this.pulseDuration>0);
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/	InqSprite.method('StopPulsing', function () {
		this.pulseDuration=0;
		this.pulseDirection=undefined;
	});


/** RETURN CONSTRUCTOR *******************************************************/

	return InqSprite;

});