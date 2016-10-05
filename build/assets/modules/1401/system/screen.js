/* screen */
define ( [
	'knockout',
	'1401/objects/sysloop',
	'1401/settings',
	'1401/system/renderer',
	'1401/objects/viewport'
], function (
	KO,
	SYSLOOP,
	SETTINGS,
	RENDERER,
	VIEWPORT
) {

///////////////////////////////////////////////////////////////////////////////
/**	SCREEN *******************************************************************\

	The SCREEN module manages the Bootstrap3-based HTML aspects of the user
	interface. It supersedes UIBIND and the step/common/lib controls systems.

	The screen-managed shell is all placed in a div defined by ROOT_ID,
	which is completely emptied before new div elements are added. The CSS
	is added programmatically.

	LAYOUT

	  div#display
        div#renderer
          div#overlay
          webgl-canvas
        div#dbg1401
        div#nfo1401

	LAYOUT RULES

	FIXED 	- #renderer drawn upper left of #display, 1:1 pixel
	SCALED 	- #renderer canvas is scaled to fit browser window
	FLUID 	- #renderer is 1:1 pixels but is resized


///////////////////////////////////////////////////////////////////////////////
/** PRIVATE SYSTEM VARIABLES *************************************************/

	var ROOT_ID 		= 'display';	// id of parent div
	var RENDERER_ID		= 'renderer';	// id of renderer div
	var m_root 			= null;			// jquery obj (also in SCREEN.Root)
	var m_cfg 			= null;			// remember configuration
	var m_resize_timer	= null;			// screen resizing delay


///////////////////////////////////////////////////////////////////////////////
/** SYSLOOP API **************************************************************/

	var SCREEN 			= {};
		SCREEN.Root 	= null;
		SCREEN.Main 	= null;			// main renderer area
		SCREEN.Overlay 	= null;			// html over Main
		SCREEN.CPanel 	= null;			// control panel
		SCREEN.Debug 	= null;			// debug area
		SCREEN.Info 	= null;			// informational area

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	grab handles to all main elements of the screen.
/*/	SCREEN.Initialize = function ( cfg ) {
		var id = ROOT_ID;
		var root = document.getElementById(id);
		if (!root) {
			console.warn("SCREEN requires div #"+id,"element");
			return;
		} 
		// define main areas, redefine root as jquery object
		m_root = root = $(root);
		if (m_root.children().length) {
			console.warn('SCREEN is erasing existing children of div#'+id);
		}
		root.empty();

/*/
	SEP 30, 2016
	REWRITING INITIALIZE so it can take columns into account and provide writing to them.
	The renderer for WebGL will need to shrink not to the browser dimensions, 
	but to the containing span.

	Right now, the insertion of the html works based on the passed cfg, but the layout code is still buggy.
/*/

		// check layout mode
		var spanTotal = 0;
		var columnTotal = cfg.columns.length;

		var el, elRenderer;
		var elRow = $("<div class='row'></div>");
		root.append(elRow);

		for (var i=0;i<columnTotal;i++) {
			var col = cfg.columns[i];
			// check column spans
			if ((col.span<1)||(col.span>12)) 
				throw "SCREEN: col span "+col.span+" invalid";
			if (col.span)
				spanTotal += col.span;
			if (spanTotal > 12) 
				throw "SCREEN: cumulative col span > 12";
			// check renderer
			if ((col.type==='renderer')&&(elRenderer))
				throw "SCREEN: Only 1 'renderer' allowed";

			// if we get this far, then assume all data is valid
			switch (col.type) {
				case 'html':
					el = $('<div class="col-md-'+col.span+'"></div>');
					break;
				case 'renderer': 
					el = $('<div class="col-md-'+col.span+'"></div>');
					root = el;
					elRenderer = $('<div id="'+RENDERER_ID+'" class="col-md-'+col.span+'"></div>');
					break;
				default:
					throw "column type "+col.type+" not understood";
			}
			// at this point we have an element we can add to the row
			elRow.append(el);
			console.log('column',i,'=',JSON.stringify(col));
		}

		root.append( '<div id="nfo1401"></div>' );
		SCREEN.Info 	= $( '#nfo1401' );

		root.append( elRenderer );
		SCREEN.Main 	= $( '#'+RENDERER_ID );

		root.append( '<div id="dbg1401"></div>' );
		SCREEN.Debug 	= $( '#dbg1401' );

		// save root references
		SCREEN.Root 	= root; // same as m_root

		// add sub areas
		SCREEN.Main.append( '<div id="renderer-overlay"></div>' );
		SCREEN.Overlay 	= $( '#renderer-overlay' );

		// make basic CSS rules
		SCREEN.Main.css('position','relative');
		SCREEN.Overlay.css('position','absolute');
		SCREEN.Overlay.css('top',0);

		// add debug styling.
		SCREEN.Debug.css('font-size','12px');
		SCREEN.Debug.css('overflow-y','scroll');
		SCREEN.Debug.css('line-height','1.5em');
		SCREEN.Debug.css('height','9em');
		SCREEN.Debug.css('background-color','rgba(192,192,192,0.5)');
		// add info styling
		SCREEN.Info.css('font-size','smaller');
	};

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SCREEN.RootAppend = function ( htmlstr ) {
		SCREEN.Root.append(htmlstr);
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SCREEN.RootPrepend = function ( htmlstr ) {
		SCREEN.Root.prepend(htmlstr);
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SCREEN.WebGLCanvas = function () {
		return RENDERER.Viewport().WebGLCanvas();
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Call during CONSTRUCT phase, so INITIALIZE has had time to run
/*/	SCREEN.CreateLayout = function ( cfg ) {

		// check parameters
		u_NormalizeConfig( cfg );
		if (!m_root) SCREEN.Initialize( cfg );

		// info
		console.info('SCREEN is setting-up',cfg.columns.count,'column layout with',cfg.renderViewport,'layout');

		// add 'attachTo' parameter for RENDERER 
		cfg.attachId = RENDERER_ID;	
		// save configuration for later adjustment
		m_cfg = cfg;

		// special case for fluid
		if (cfg.renderViewport===VIEWPORT.TYPE.MODE_FLUID) {
			var dim = u_GetBrowserDimensions();
			cfg.renderWidth 	= dim.boxWidth;
			cfg.renderHeight 	= dim.boxHeight;
			cfg.renderUnits  	= Math.min(dim.boxWidth,dim.boxHeight);
		}
		// Start renderer
		RENDERER.Initialize ( cfg );
		window.SYS1401.WEBGL = VIEWPORT.WebGL();

		// dispatch correct display mode
		switch (cfg.renderViewport) {
			case VIEWPORT.TYPE.MODE_FIXED:
				SCREEN.SetFixedLayout ( cfg );
				break;
			case VIEWPORT.TYPE.MODE_SCALED:
				SCREEN.SetScaledLayout ( cfg );
				break;
			case VIEWPORT.TYPE.MODE_FLUID:
				SCREEN.SetFluidLayout ( cfg );
				break;
			default:
				throw "mode "+cfg.renderViewport+" not implemented";
		}

		// start renderer refresh
		RENDERER.AutoRender();

	}; 

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Renderer is in the upper left and doesn't change size
/*/	SCREEN.SetFixedLayout = function ( cfg ) {
		console.log("SCREEN: setting fixed layout");
		u_SetAbsoluteSize( SCREEN.Overlay, cfg );
};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	set position absolute to cfg dimensions
/*/	function u_SetAbsoluteSize ( jsel, cfg ) {
		jsel.css('width',cfg.renderWidth);
		jsel.css('height',cfg.renderHeight);
		jsel.css('position','absolute');
		var dim = u_GetBrowserDimensions();
		SCREEN.Info.css('width',cfg.renderWidth);
		SCREEN.Debug.css('width',cfg.renderWidth);

	}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ a scaled lout will size itself to fit within the available space
/*/	SCREEN.SetScaledLayout = function ( cfg ) {
		// hide nfo and debug because this messes up dimensions
		// until it's rewritten to take Debug and Info into account
		SCREEN.Debug.hide();
		SCREEN.Info.hide();
		// resize viewport on browser resize after 250ms
		$(window).resize(function () {
			clearTimeout(m_resize_timer);
			m_resize_timer = setTimeout(u_ScaleRendererToFit,500);
		});
		u_ScaleRendererToFit();
	}; 
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	When scaling the renderer, we don't need to adjust any camera parameters
/*/	function u_ScaleRendererToFit () {
		var dim = u_GetBrowserDimensions();

		var canvas = $(VIEWPORT.WebGLCanvas());
		canvas.css('width',dim.scaledWidth);
		canvas.css('height',dim.scaledHeight);
		SCREEN.Overlay.css('width',dim.scaledWidth);
		SCREEN.Overlay.css('height',dim.scaledHeight);
		SCREEN.Main.css('width',dim.scaledWidth);
		SCREEN.Main.css('height',dim.scaledHeight);

		SCREEN.Debug.css('width',dim.scaledWidth);
		SCREEN.Debug.css('top',dim.boxBottom+'px');
	}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	a fluid layout resizes itself to fill all available space
/*/	SCREEN.SetFluidLayout = function ( cfg ) {
		// hide nfo and debug
		SCREEN.Debug.hide();
		SCREEN.Info.hide();
		// resize viewport on browser resize after 250ms
		$(window).resize(function () {
			clearTimeout(m_resize_timer);
			m_resize_timer = setTimeout(u_ResizeRendererToFit,250);
		});
		u_ResizeRendererToFit();
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	When resizing the renderer, we need to adjust camera parameters so 
	the world is still drawn 1:1
/*/	function u_ResizeRendererToFit () {
		var dim = u_GetBrowserDimensions();

		VIEWPORT.SetDimensions(dim.boxWidth, dim.boxHeight);
		VIEWPORT.UpdateWorldCameras();
		VIEWPORT.UpdateViewportCameras();
	}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function u_GetBrowserDimensions () {
		// get dimensions of the viewable area (no scrolling)
		var screenHeight 	= $(window).height();
		var displayWidth 	= $(document).width();
		var displayHeight 	= screenHeight - m_root.offset().top;

		// take any space added to the #display container saved in m_root
		var insetWidth = parseInt(m_root.css('margin-left'))+parseInt(m_root.css('margin-right'));
		insetWidth += parseInt(m_root.css('padding-left'))+parseInt(m_root.css('padding-right'));
		displayWidth = displayWidth - insetWidth;

		var insetHeight = parseInt(m_root.css('margin-top'))+parseInt(m_root.css('margin-bottom'));
		insetHeight += parseInt(m_root.css('padding-top'))+parseInt(m_root.css('padding-bottom'));
		displayHeight = displayHeight - insetHeight;

		// calculate max size to fit current renderer
		var scaledWidth, 
			scaledHeight, 
			multiplier;

		var aspect = m_cfg.renderWidth / m_cfg.renderHeight;
		multiplier = Math.min(
			displayWidth / m_cfg.renderWidth,
			displayHeight / m_cfg.renderHeight
		);
		scaledHeight 	= Math.floor(m_cfg.renderHeight * multiplier);
		scaledWidth		= Math.floor(scaledHeight * aspect);

		return {
			visWidth 		: displayWidth,		// client area
			visHeight 		: screenHeight,
			boxWidth 		: displayWidth,		// without nav
			boxHeight 		: displayHeight,
			scaledWidth 	: scaledWidth,		// canvas scaled
			scaledHeight 	: scaledHeight
		};
	}



///////////////////////////////////////////////////////////////////////////////
/** SCREEN API ***************************************************************/

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	add screen title to INFO area 
/*/	SCREEN.SetInfo = function ( htmlstr ) {
		SCREEN.Info.empty().append(htmlstr);
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SCREEN.SetDisplayMargin = function ( margin ) {
		if (Number.isInteger(margin)) margin += 'px';
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Utility function to hide scrollbars on the body
/*/	SCREEN.HideScrollbars = function () {
		$('body').css('overflow','hidden');
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SCREEN.AddRow = function ( id, cls, parent ) {
		id = (id) ? 'id="'+id+'" ' : '';
		cls = 'class="row '+ ((cls)?cls:'')+ '" ';
		parent = parent || SCREEN.Overlay;
		if (!parent) throw "SCREEN.AddRow() after init phase!";
		var html = '<div '+id+cls+'></div>';
		var row = $(html);
		parent.append(row);
		return row;
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Add a button to default area. Returns jQuery object created button
/*/	SCREEN.AddButton = function ( id, label, parent ) {
		if (!id) throw "arg1 must be a unique string";
		label = label || 'Button';
		parent = parent || SCREEN.Overlay;
		if (!parent) throw "SCREEN.AddButton() after init phase!";
		var html = '<button id="'+id+'" class="btn">'+label+'</button>';
		var jbtn = $(html);
		parent.append(jbtn);
		return jbtn;
	};


///////////////////////////////////////////////////////////////////////////////
/** UTILITY FUNCTIONS ********************************************************/
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function u_NormalizeConfig( cfg ) {
		cfg = cfg || {};
		// check for legal modes
		switch (cfg.renderViewport) {
			case undefined:
				throw 'SCREEN: config object missing renderViewport property';
			case VIEWPORT.TYPE.MODE_FIXED:
			case VIEWPORT.TYPE.MODE_SCALED:
			case VIEWPORT.TYPE.MODE_FLUID:
				break;
			default:
				throw "SCREEN: "+cfg.renderViewport+" is not a valid mode";
		}
		// process render parameters
		cfg.renderWidth = cfg.renderWidth || 512;
		cfg.renderHeight = cfg.renderHeight || 512;
		var minWorldUnits = Math.min(cfg.renderWidth, cfg.renderHeight);
		cfg.renderUnits = cfg.worldUnits || minWorldUnits;
		// process layout parameters
		if (Array.isArray(cfg.columns) || (cfg.columns===undefined)) {
			cfg.columns = cfg.columns || [];
			if (cfg.columns.length) {
				for (var i=0;i<cfg.columns.length;i++) {
					var cobj = cfg.columns[i];
					if (Number.isInteger(cobj.span) && (typeof cobj.type=='string')) continue;
					// if get this far, bad!
					throw "Normalize requires correct span and type\n"+JSON.stringify(cobj);
				}
			} else {
				// create default layout with no other HTML sidebar
				// elements
				cfg.columns = [
					{ span: 12, type: 'renderer' }
				];
			}
		} else {
			throw "SCREEN: columns must be an array containing column config objects";
		}

		return cfg;
	}


///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE ************************************************************/
	return SCREEN;

});
