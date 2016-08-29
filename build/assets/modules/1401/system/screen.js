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

	The screen-managed shell is all placed in a div defined by m_root_id,
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

	var m_root_id 		= 'display';	// id of parent div
	var m_renderer_id	= 'renderer';	// id of renderer div
	var m_root 			= null;			// jquery object for root
	var m_cfg 			= null;			// remember configuration
	var m_resize_timer	= null;			// screen resizing delay


///////////////////////////////////////////////////////////////////////////////
/** SYSLOOP API **************************************************************/

	var SCREEN 			= SYSLOOP.New('SCREEN');
		SCREEN.Main 	= null;			// main renderer area
		SCREEN.Overlay 	= null;			// html over Main
		SCREEN.CPanel 	= null;			// control panel
		SCREEN.Debug 	= null;			// debug area
		SCREEN.Info 	= null;			// informational area

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	grab handles to all main elements of the screen.
/*/	SCREEN.SetHandler( 'Connect', function () {
//		var root = document.getElementById('sys1401');
		var id = m_root_id;
		var root = document.getElementById(id);
		if (!root) {
			console.warn("SCREEN requires div #"+id,"element");
			return;
		} 
		console.info("SCREEN CONNECT: appending to div#",id);
		// define main areas
		m_root = root = $(root);
		root.empty();
		root.append( '<div id="nfo1401"></div>' );
		root.append( '<div id="'+m_renderer_id+'"></div>' );
		root.append( '<div id="dbg1401"></div>' );
		// save references
		SCREEN.Main 	= $( '#'+m_renderer_id );
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

	});

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Call during CONSTRUCT phase, so INITIALIZE has had time to run
/*/	SCREEN.CreateLayout = function ( cfg ) {
		if (!m_root) {
			throw "SCREEN.Configure() called before Connect phase complete";
		}
		// check parameters
		u_NormalizeConfig( cfg );

		// info
		console.info('SCREEN.CreateLayout is creating',cfg.mode,'layout');

		// add 'attachTo' parameter for RENDERER 
		cfg.attachId = m_renderer_id;
		// save configuration for later adjustment
		m_cfg = cfg;

		// special case for fluid
		if (cfg.mode===VIEWPORT.TYPE.MODE_FLUID) {
			var dim = u_GetBrowserDimensions();
			cfg.renderWidth 	= dim.boxWidth;
			cfg.renderHeight 	= dim.boxHeight;
			cfg.worldUnits  	= Math.min(dim.boxWidth,dim.boxHeight);
		}
		// Start renderer
		RENDERER.Initialize ( cfg );
		window.SYS1401.WEBGL = VIEWPORT.WebGL();


		// dispatch correct display mode
		switch (cfg.mode) {
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
				throw "mode "+cfg.mode+" not implemented";
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
		switch (cfg.mode) {
			case VIEWPORT.TYPE.MODE_FIXED:
			case VIEWPORT.TYPE.MODE_SCALED:
			case VIEWPORT.TYPE.MODE_FLUID:
				break;
			case undefined:
				cfg.mode = VIEWPORT.TYPE.MODE_FIXED;
				console.warn('SCREEN mode not specified; default to FIXED');
				break;
			default:
				throw "error: "+cfg.mode+" is not a valid mode";
		}
		// process remaining parameters
		cfg.renderWidth 	= cfg.renderWidth || 512;
		cfg.renderHeight 	= cfg.renderHeight || 512;
		var minWorldUnits 	= Math.min(cfg.renderWidth, cfg.renderHeight);
		cfg.worldUnits 		= cfg.worldUnits || minWorldUnits;
		return cfg;
	}


///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE ************************************************************/
	return SCREEN;

});
