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

	SCREEN MODES

	CONSOLE - fixed presentation on large screen, with sidebar areas 
			  surrounding a WebGL canvas
	MOBILE 	- responsive presentation on small screens, using a 
			  ui framework, with an optional WebGL canvas
	NONE    - no sidebar areas at all

	Both a LAYOUT RULE and a SCREEN MODE can be set, and they will behave
	as you would expect.


///////////////////////////////////////////////////////////////////////////////
/** PRIVATE SYSTEM VARIABLES *************************************************/

	var ROOT_ID 		= 'display';	// id of parent div
	var RENDERER_ID		= 'renderer';	// id of renderer div
	var m_cfg 			= null;			// remember configuration
	var m_resize_timer	= null;			// screen resizing delay
	var m_layouts		= {};			// layout dictionary objects
	var mode_layout 	= null;			// current layout mode in m_layouts
	var mode_vp 		= null;			// current viewport mode


///////////////////////////////////////////////////////////////////////////////
/** SYSLOOP API **************************************************************/

	var SCREEN 				= {};
		SCREEN.Root 		= null;
		SCREEN.Main 		= null;			// main renderer area
		SCREEN.Overlay 		= null;			// html over Main
		SCREEN.CPanel 		= null;			// control panel
		SCREEN.Debug 		= null;			// debug area
		SCREEN.Info 		= null;			// informational area

		SCREEN.T_NONE 		= 'none';
		SCREEN.T_CONSOLE 	= 'console';
		SCREEN.T_MOBILE 	= 'mobile';
		// hacky access to constructor types, e.g. SCREEN.TYPE.T_NONE
		SCREEN.TYPE 		= SCREEN;		

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	MAIN CALL. Valid during CONSTRUCT phase
/*/	SCREEN.CreateLayout = function ( cfg ) {

		// check parameters
		u_NormalizeConfig( cfg );

		// add 'attachTo' parameter for RENDERER 
		cfg.attachId = RENDERER_ID;	

		// save configuration for later adjustment
		m_cfg 		= cfg;
		mode_vp 	= cfg.renderViewport;
		mode_layout	= cfg.screenLayout;

		// handle mode setup
		switch (cfg.screenLayout) {
			case SCREEN.T_NONE:
				SCREEN.InitializeDefault( cfg );
				break;
			case SCREEN.T_CONSOLE:
				SCREEN.InitializeDesktopMode( cfg );
				break;
			case SCREEN.T_MOBILE:
				SCREEN.InitializeAppMode( cfg );
				break;
			default:
				throw "Unexpected screenLayout "+cfg.screenLayout;
		}

		// start renderer refresh
		RENDERER.AutoRender();

	}; 
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Renderer is the main element on the screen, unlike Console or App mode
/*/	SCREEN.InitializeDefault = function ( cfg ) {
		var root = m_DefineRoot();

		root.append( '<div id="nfo1401"></div>' );
		root.append( '<div id="'+RENDERER_ID+'"></div>' );
		root.append( '<div id="dbg1401"></div>' );
		// save references
		SCREEN.Root 	= root;
		SCREEN.Main 	= $( '#'+RENDERER_ID );
		SCREEN.Info 	= $( '#nfo1401' );
		SCREEN.Debug 	= $( '#dbg1401' );
		// sub areas
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

		// resize according to screen mode
		SCREEN.RefreshDimensions( cfg );
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Desktop mode is used for main presentation that requires sidebar UI areas
	that can be shown/hidden on demand
/*/	SCREEN.InitializeDesktopMode = function ( cfg ) {
		// define default sizing parameters

		// [      T      ]
		// [ L ][ M ][ R ] 
		// [      B      ]
		var lobj = {
			// top header
			top 			: null,
			topHeight 		: cfg.topHeight || cfg.topHeight===0 ? 0 : 80,
			// middle table and table row
			middle 			: null,
			midrow 			: null,
			// main render area
			main 			: null,
			// left sidebar
			left 			: null,
			leftWidth 		: cfg.leftWidth || cfg.leftWidth===0 ? 0 : 160,
			// right sidebar
			right 			: null,
			rightWidth 		: cfg.rightWidth || cfg.rightWidth===0 ? 0 : 160,
			// bottom footer
			bottom 			: null,
			bottomHeight	: cfg.bottomHeight || cfg.bottomHeight===0 ? 0 : 80
			// visibility flags
		};

		// grab empty jquery ROOT element
		var jqroot 	= m_DefineRoot();

		// define areas
		lobj.top 	= $('<div id="top"></div>');
		lobj.bottom = $('<div id="bottom"></div>');
		lobj.middle = $('<table></table>');
		lobj.midrow = $('<tr></tr>');
		lobj.left 	= $('<td id="left"></td>');
		lobj.main 	= $('<td id="main" align="center"></td>');
		lobj.right 	= $('<td id="right"></td>');

		// construct 
		jqroot.append('<div id="nfo1401"></div>');
		lobj.midrow.append(lobj.left,lobj.main,lobj.right);
		lobj.middle.append(lobj.midrow);
		jqroot.append(lobj.top,lobj.middle,lobj.bottom);
		jqroot.append('<div id="dbg1401"></div>');
		// add renderer
		lobj.main.append('<div id="'+RENDERER_ID+'"></div>');
		lobj.main.append('<div id="renderer-overlay"></div>');

		// set background colors
		lobj.top.css('background-color','#EEE');
		lobj.left.css('background-color','#DDD');
		lobj.right.css('background-color','#DDD');
		lobj.bottom.css('background-color','#EEE');

		// set dimensions
		if (lobj.topHeight===0) {
			lobj.top.hide();
		} else {
			lobj.top.height(lobj.topHeight);
		}
		if (lobj.bottomHeight===0) {
			lobj.bottom.hide();
		} else {
			lobj.bottom.height(lobj.bottomHeight);
		}
		lobj.middle.width('100%');
		if (lobj.leftWidth===0) {
			lobj.left.hide();
		} else {
			lobj.left.width(lobj.leftWidth);
		}
		if (lobj.rightWidth===0) {
			lobj.right.hide();
		} else {
			lobj.right.width(lobj.rightWidth);
		}

		// save references to layout table
		m_SaveLayout(cfg.screenLayout, lobj);

		// save SCREEN globals
		SCREEN.Root 	= jqroot;
		SCREEN.Main 	= $('#'+RENDERER_ID );
		SCREEN.Info 	= $('#nfo1401');
		SCREEN.Debug 	= $('#dbg1401');
		SCREEN.Overlay 	= $('#renderer-overlay');

		SCREEN.Main.css('position','relative');		
		SCREEN.Overlay.css('position','absolute');
		SCREEN.Overlay.css('top',0);

		// special case for fluid
		if (cfg.renderViewport===VIEWPORT.TYPE.MODE_FLUID) {
			var dim = u_GetLayoutDimensions();
			cfg.renderWidth  = dim.boxWidth;
			cfg.renderHeight = dim.boxHeight;
			cfg.renderUnits  = Math.min(dim.boxWidth,dim.boxHeight);
		}
		// Start renderer
		RENDERER.Initialize ( cfg );
		window.SYS1401.WEBGL = VIEWPORT.WebGL();

		// resize according to screen mode
		SCREEN.RefreshDimensions( cfg );
	};

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Call this to resize the screenbased on the screen mode and the viewport
	mode, which is read from the config passed in OR the saved global config
/*/	SCREEN.RefreshDimensions = function ( cfg ) {
		cfg = cfg || m_cfg;
		switch (cfg.screenLayout) {
			case SCREEN.T_NONE:
				// dispatch correct display mode
				switch (cfg.renderViewport) {
					case VIEWPORT.TYPE.MODE_FIXED:
						SCREEN.SetFixed ( cfg );
						break;
					case VIEWPORT.TYPE.MODE_SCALED:
						SCREEN.SetScaled ( cfg );
						break;
					case VIEWPORT.TYPE.MODE_FLUID:
						SCREEN.SetFluid ( cfg );
						break;
					default:
						throw "mode "+cfg.renderViewport+" not implemented";
				}		
				break;
			case SCREEN.T_CONSOLE:
				switch (cfg.renderViewport) {
					case VIEWPORT.TYPE.MODE_FIXED:
						SCREEN.ConsoleSetFixed ( cfg );
						break;
					case VIEWPORT.TYPE.MODE_SCALED:
						SCREEN.ConsoleSetScaled ( cfg );
						SCREEN.Info.hide();
						SCREEN.Debug.hide();
						break;
					case VIEWPORT.TYPE.MODE_FLUID:
						SCREEN.ConsoleSetFluid ( cfg );
						SCREEN.Info.hide();
						SCREEN.Debug.hide();
						break;
					default:
						throw "mode "+cfg.renderViewport+" not implemented";
				}
				break;			
			case SCREEN.T_MOBILE:
				throw "MOBILE NOT IMPLEMENTED";
		}

	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/	SCREEN.InitializeAppMode = function ( cfg ) {
		throw "InitializeAppMode() not implemented";
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
/*/	Renderer is in the upper left and doesn't change size
/*/	SCREEN.SetFixed = function ( cfg ) {
		console.log("SCREEN: setting fixed layout");
		u_SetAbsoluteSize( SCREEN.Overlay, cfg );
};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Renderer is in table layout in middle and doesn't change size
/*/	SCREEN.ConsoleSetFixed = function ( cfg ) {
		console.log("SCREEN: setting console fixed layout");
		u_SetAbsoluteSize( SCREEN.Overlay, cfg );
};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	set position absolute to cfg dimensions
/*/	function u_SetAbsoluteSize ( jsel, cfg ) {
		jsel.width(cfg.renderWidth);
		jsel.height(cfg.renderHeight);
		jsel.css('position','absolute');
		var dim = u_GetBrowserDimensions();
		SCREEN.Info.width(cfg.renderWidth);
		SCREEN.Debug.width(cfg.renderWidth);

	}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ a scaled lout will size itself to fit within the available space
/*/	SCREEN.SetScaled = function ( cfg ) {
		// hide nfo and debug because this messes up dimensions
		// until it's rewritten to take Debug and Info into account
		SCREEN.Debug.hide();
		SCREEN.Info.hide();
		// resize viewport on browser resize after 250ms
		$(window).resize(function () {
			clearTimeout(m_resize_timer);
			m_resize_timer = setTimeout(u_ScaleToFit,500);
		});
		u_ScaleToFit();
	}; 
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ console layout version of SetScaled
/*/	SCREEN.ConsoleSetScaled = function ( cfg ) {
		// resize viewport on browser resize after 250ms
		$(window).resize(function () {
			clearTimeout(m_resize_timer);
			m_resize_timer = setTimeout(u_ConsoleScaleToFit,500);
		});
		u_ConsoleScaleToFit();
	}; 
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	scale renderer to maximally fit into browser
/*/	function u_ScaleToFit () {
		var dim = u_GetBrowserDimensions();
		var canvas = $(VIEWPORT.WebGLCanvas());

		canvas.width(dim.scaledWidth);
		canvas.height(dim.scaledHeight);

		SCREEN.Overlay.width(dim.scaledWidth);
		SCREEN.Overlay.height(dim.scaledHeight);
		SCREEN.Main.width(dim.scaledWidth);
		SCREEN.Main.height(dim.scaledHeight);

		SCREEN.Debug.width(dim.scaledWidth);
		SCREEN.Debug.css('top',dim.boxBottom+'px');
	}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	scale renderer to maximally fit into console layout mode
/*/	function u_ConsoleScaleToFit () {
		var dim = u_GetLayoutDimensions();
		var canvas = $(VIEWPORT.WebGLCanvas());

		canvas.width(dim.scaledWidth);
		canvas.height(dim.scaledHeight);

		SCREEN.Overlay.width(dim.scaledWidth);
		SCREEN.Overlay.height(dim.scaledHeight);
		SCREEN.Main.width(dim.scaledWidth);
		SCREEN.Main.height(dim.scaledHeight);
	}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	resize renderer to fill available browser space
/*/	SCREEN.SetFluid = function ( cfg ) {
		// hide nfo and debug
		SCREEN.Debug.hide();
		SCREEN.Info.hide();
		// resize viewport on browser resize after 250ms
		$(window).resize(function () {
			clearTimeout(m_resize_timer);
			m_resize_timer = setTimeout(u_ResizeToFit,250);
		});
		u_ResizeToFit();
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	resize renderer to fill available space in console layout mode
/*/	SCREEN.ConsoleSetFluid = function ( cfg ) {
		// resize viewport on browser resize after 250ms
		$(window).resize(function () {
			clearTimeout(m_resize_timer);
			m_resize_timer = setTimeout(u_ConsoleResizeToFit,250);
		});
		u_ConsoleResizeToFit();
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	When resizing the renderer, we need to adjust camera parameters so 
	the world is still drawn 1:1
/*/	function u_ResizeToFit () {
		var dim = u_GetBrowserDimensions();

		VIEWPORT.SetDimensions(dim.boxWidth, dim.boxHeight);
		VIEWPORT.UpdateWorldCameras();
		VIEWPORT.UpdateViewportCameras();
	}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	When resizing the renderer, we need to adjust camera parameters so 
	the world is still drawn 1:1
/*/	function u_ConsoleResizeToFit () {
		var dim = u_GetLayoutDimensions();

		VIEWPORT.SetDimensions(dim.boxWidth, dim.boxHeight);
		VIEWPORT.UpdateWorldCameras();
		VIEWPORT.UpdateViewportCameras();
	}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function u_GetBrowserDimensions () {
		var root = SCREEN.Root;
		// get dimensions of the viewable area (no scrolling)
		var screenHeight 	= $(window).height();
		var displayWidth 	= $(document).width();
		var displayHeight 	= screenHeight - root.offset().top;

		// take any space added to the #display container saved in root
		var insetWidth = parseInt(root.css('margin-left'))+parseInt(root.css('margin-right'));
		insetWidth += parseInt(root.css('padding-left'))+parseInt(root.css('padding-right'));
		displayWidth = displayWidth - insetWidth;

		var insetHeight = parseInt(root.css('margin-top'))+parseInt(root.css('margin-bottom'));
		insetHeight += parseInt(root.css('padding-top'))+parseInt(root.css('padding-bottom'));
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
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function u_GetLayoutDimensions () {

		// get elements
		var lout = m_GetLayout();
		var main = lout.main;

		// get base dimensions
		var dim = u_GetBrowserDimensions();

		// adjust for current layout mode
		var calcWidth = dim.boxWidth - lout.leftWidth - lout.rightWidth;
		var calcHeight = dim.boxHeight - lout.topHeight - lout.bottomHeight;
		var aspect = m_cfg.renderWidth / m_cfg.renderHeight;
		var multiplier = Math.min(
			calcWidth / m_cfg.renderWidth,
			calcHeight / m_cfg.renderHeight
		);
		dim.scaledHeight = Math.floor(m_cfg.renderHeight * multiplier);
		dim.scaledWidth = Math.floor(dim.scaledHeight * aspect);
		dim.boxWidth = calcWidth;
		dim.boxHeight = calcHeight;

		return dim;
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
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SCREEN.HideLeft = function () {
		var lobj = m_GetLayout();
		if (lobj.leftWidthSaved) {
			console.warn('left sidebar already hidden');
		} else {
			lobj.leftWidthSaved = lobj.leftWidth;
			lobj.leftWidth = 0;	// used for calculation
			lobj.left.hide();
			SCREEN.RefreshDimensions();
		}
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SCREEN.ShowLeft = function () {
		var lobj = m_GetLayout();
		if (!lobj.leftWidthSaved) {
			console.warn('left sidebar already showing');
		} else {
			lobj.leftWidth = lobj.leftWidthSaved;
			lobj.leftWidthSaved = 0;
			lobj.left.show();
			SCREEN.RefreshDimensions();
		}
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SCREEN.HideRight = function () {
		var lobj = m_GetLayout();
		if (lobj.rightWidthSaved) {
			console.warn('right sidebar already hidden');
		} else {
			lobj.rightWidthSaved = lobj.rightWidth;
			lobj.rightWidth = 0;	// used for calculation
			lobj.right.hide();
			SCREEN.RefreshDimensions();
		}
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SCREEN.ShowRight = function () {
		var lobj = m_GetLayout();
		if (!lobj.rightWidthSaved) {
			console.warn('right sidebar already showing');
		} else {
			lobj.rightWidth = lobj.rightWidthSaved;
			lobj.rightWidthSaved = 0;
			lobj.right.show();
			SCREEN.RefreshDimensions();
		}
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SCREEN.HideTop = function () {
		var lobj = m_GetLayout();
		if (lobj.topHeightSaved) {
			console.warn('top already hidden');
		} else {
			lobj.topHeightSaved = lobj.topHeight;
			lobj.topHeight = 0;	// used for calculation
			lobj.top.hide();
			SCREEN.RefreshDimensions();
		}
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SCREEN.ShowTop = function () {
		var lobj = m_GetLayout();
		if (!lobj.topHeightSaved) {
			console.warn('top already showing');
		} else {
			lobj.topHeight = lobj.topHeightSaved;
			lobj.topHeightSaved = 0;
			lobj.top.show();
			SCREEN.RefreshDimensions();
		}
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SCREEN.HideBottom = function () {
		var lobj = m_GetLayout();
		if (lobj.bottomHeightSaved) {
			console.warn('top already hidden');
		} else {
			lobj.bottomHeightSaved = lobj.bottomHeight;
			lobj.bottomHeight = 0;	// used for calculation
			lobj.bottom.hide();
			SCREEN.RefreshDimensions();
		}
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SCREEN.ShowBottom = function () {
		var lobj = m_GetLayout();
		if (!lobj.bottomHeightSaved) {
			console.warn('top already showing');
		} else {
			lobj.bottomHeight = lobj.bottomHeightSaved;
			lobj.bottomHeightSaved = 0;
			lobj.bottom.show();
			SCREEN.RefreshDimensions();
		}
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
		switch (cfg.screenLayout) {
			case undefined:
				cfg.screenLayout = SCREEN.T_NONE;
				console.warn('SCREEN: no screenLayout defined; using default');
				break;
			case SCREEN.T_NONE:
			case SCREEN.T_CONSOLE:
			case SCREEN.T_MOBILE:
				break;
			default:
				throw "SCREEN: "+cfg.screenLayout+" is not a valid layout";
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
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Retrieve a "layout object" that has dimensions of the various areas 
	associated with each named layout. Returns current layout if no
	layoutName is passed
/*/	function m_GetLayout ( layoutName ) {
		var lout;
		if (layoutName) lout = m_layouts[layoutName];
		else lout = m_layouts[mode_layout];
		if (!lout) throw "invalid layout keystring: "+layoutName;
		return lout;
	}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function m_SaveLayout ( layoutName, lobj ) {
		if (m_layouts[layoutName]) { }
		m_layouts[layoutName] = lobj;
	}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function m_DefineRoot () {
		var id = ROOT_ID;
		var root = document.getElementById(id);
		if (!root) throw "SCREEN requires div #"+id,"element";
		// define main areas
		root = $(root);
		if (root.children().length) {
			console.warn('SCREEN is erasing existing children of div#'+id);
		}
		root.empty();
		return root;
	}

///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE ************************************************************/
	return SCREEN;

});
