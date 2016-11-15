/* sysloop.js */
define ([
	'1401/system/autosystem',
	'1401/system/piecefactory',
	'1401/objects/logic/checkinmonitor'
], function ( 
	AUTOSYS,
	PIECEFACTORY,
	CheckInMonitor
) {

	var DBGOUT = false;

///////////////////////////////////////////////////////////////////////////////
/**	API SYSLOOP *************************************************************\

	This module creates a "SysLoop" object that codifies the main lifetime
	and runtime events for the game system so you don't have to type out a
	lot of boilerplate. 

	The order of LIFETIME operations in the game loop is as follows:

	Connect 	Pass the parent Durandal viewmodel instance if the module 
				needs it for DOM access. 
	Initialize	Module can initialize data structures for itself, 
				allocate memory, set simple variables, but not
				use any other game systems yet.
	LoadAssets	Module can load any assets. When the assets are loaded,
				Module should call the passed Done() function to allow
				game initialization to proceed.
	Construct 	Module may access game systems like RENDERER and PIECEFACTORY,
				which by now are fully initialized and safe to use.
	Start 		Module may access OTHER modules and communicate with them,
				setting final parameters
	GameStep 	Main Module receives periodical timestamps, with the elapsed
				time since the last step as a parameter
	
	Additionally, the RUNTIME operations that are supported are:

	GetInput 	received input notification
	Update 		Called from within Step after GetInput and before Think.
	Think 		time to process AI on your module
	OverThink 	time to override any thoughts of managed pieces
	Execute 	time to execute actual action commands

	Note that you need to call EnableUpdate(), EnableInput() and EnableAI() for
	runtime calls to be made. 

	EXAMPLE:

	Assuming module is imported as SYSLOOP:
		var OBJ = SYSLOOP.New ('name')
		OBJ.SetHandler('Connect', function_object );
		etc...

	IMPORTANT:

	SYSLOOP keeps track of all loop objects that have been created, and MASTER
	calls module's ConnectAll(), InitializeAll(), etc so game-main.js doesn't
	have to. If you use SYSLOOP to create your own modules, you also don't
	have to worry about it either. You do have to be mindful, though, that the
	order of modules called during a phase is not guaranteed. If you need to
	be sure, don't use SYSLOOP for your module, and implement  the calls
	yourself.

	IMPORTANT:

	The game-main.js file should use the following call to establish itself
	as the prime game loop:

		var MAIN = SYSLOOP.InitializeGame('name');

	This ensures that it is always called before all other SYSLOOP modules.
	It should only be called once in the lifetime of the game.


///////////////////////////////////////////////////////////////////////////////
/** SUPPORT CLASS ************************************************************/

	/* constructor */
	function SysLoop ( name ) {
		if (typeof name === 'string') {
			this.name = name;
		} else {
			console.error("SysLoop constructor requires string");
		}
		// lifetime
		this.HandleConnect = null;
		this.HandleInitialize = null;
		this.HandleLoadAssets = null;
		this.HandleConstruct = null;
		this.HandleStart = null;
		this.HandleGameStep = null;
		this.HandleStop = null;
		this.HandlePause = null;
		// runtime flags
		this.processInput = false;
		this.processAI = false;
		this.processUpdate = false;
		// runtime functions
		this.HandleInput = null;
		this.HandleUpdate = null;
		this.HandleThink = null;
		this.HandleOverThink = null;
		this.HandleExecute = null;
		// events
		this.HandleChangeStage = null;
		// current runmode
		this._runmode = SysLoop.RUNMODE_INIT;
	}
	/* constants */
	SysLoop.RUNMODE_INIT 	= 0;
	SysLoop.RUNMODE_RUNNING = 1;
	SysLoop.RUNMODE_PAUSED 	= 2;
	SysLoop.RUNMODE_EXITING = 3;
	SysLoop.RUNMODE_STOPPED = 4;
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SysLoop.method('IsRunning', function () { 
		return (this._runmode==SysLoop.RUNMODE_RUNNING);
	});

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	All instances of SysLoop are updated by Master at critical moments, but
	each instance has to define a handler. type is the name of the handler,
	f is the callback function.
/*/	SysLoop.method('SetHandler', function ( hook, f ) {
		console.assert(typeof f === 'function',"must past a function handler!");
		hook = hook || 'undefined';
		hook = hook.toLowerCase();
		switch (hook) {
			// lifetime
			case 'connect':
				this.HandleConnect = f;
				break;
			case 'initialize':
				this.HandleInitialize = f;
				break;
			case 'loadassets':
				this.HandleLoadAssets = f;
				break;
			case 'construct':
				this.HandleConstruct = f;
				break;
			case 'start':
				this.HandleStart = f;
				break;
			// gamestep
			case 'gamestep':
				/* called by master sysloop only! */
				this.HandleGameStep = f;
				break;
			// gamestep phases
			case 'update':
				this.HandleUpdate = f;
				break;
			case 'getinput':
				this.HandleInput = f;
				break;
			case 'think':
				this.HandleThink = f;
				break;
			case 'overthink':
				this.HandleOverThink = f;
				break;
			case 'execute':
				this.HandleExecute = f;
				break;
			default:
				console.error('SYSTEMLOOP:','unknown handler',hook.angle(),"in module",this.name.bracket());
				break;
		}
	});	

/**	FEATURE ENABLING FUNCTIONS **********************************************/
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SysLoop.method('EnableAI', function ( flag ) {
		flag = flag || true;
		this.processAI = flag;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SysLoop.method('EnableInput', function ( flag ) {
		flag = flag || true;
		this.processInput = flag;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SysLoop.method('EnableUpdate', function ( flag ) {
		flag = flag || true;
		this.processUpdate = flag;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SysLoop.method('EnableDebug', function ( flag ) {
		flag = flag || true;
		DBGOUT = flag;
	});

/**	INITIALIZATION FUNCTIONS ************************************************/
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SysLoop.method('Connect', function ( viewModel ) {
		if (this.HandleConnect) {
			this.HandleConnect.call(this,viewModel);
		} else {
			if (DBGOUT) console.log(this.name,"Connect: no handler defined");
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SysLoop.method('Initialize', function () {
		if (this.HandleInitialize) {
			this.HandleInitialize.call(this);
		} else {
			if (DBGOUT) console.log(this.name,"Initialize: no handler defined");
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SysLoop.method('LoadAssets', function ( checkIn ) {
		if (this.HandleLoadAssets) {
			this.HandleLoadAssets.call(this, checkIn);
		} else {
			if (DBGOUT) console.log(this.name,"LoadAssets: no handler defined");
			checkIn.Notify();
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SysLoop.method('Construct', function () {
		if (this.HandleConstruct) {
			this.HandleConstruct.call(this);
		} else {
			if (DBGOUT) console.log(this.name,"Construct: no handler defined");
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SysLoop.method('Start', function ( startTimeMs ) {
		this._runmode = SysLoop.RUNMODE_RUNNING;
		if (this.HandleStart) {
			this.HandleStart.call(this, startTimeMs);
		} else {
			if (DBGOUT) console.log(this.name,"Start: no handler defined");
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SysLoop.method('Step', function ( intervalMs ) {
		if (this!==m_master_gameloop) {
			console.warn("ERROR in SYSLOOP",this.name.bracket()+': Use Update, not Step');
			return;
		}
		if (this.HandleGameStep) {
			this.HandleGameStep.call(this, intervalMs);
		} else {
			if (DBGOUT) console.log(this.name,"Step: no handler defined");
		}
	});

/**	STEP FUNCTIONS **********************************************************/
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SysLoop.method('GetInput', function ( intervalMs ) {
		if (!m_CheckDoInput(this)) return;
		if (this.HandleInput) {
			this.HandleInput.call(this, intervalMs);
		} else {
			if (DBGOUT) console.log(this.name,"GetInput: no handler defined");
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SysLoop.method('Update', function ( intervalMs ) {
		if (!m_CheckDoUpdate(this)) return;
		if (this.HandleUpdate) {
			this.HandleUpdate.call(this, intervalMs);
		} else {
			if (DBGOUT) console.log(this.name,"Update: no handler defined");
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SysLoop.method('Think', function ( intervalMs ) {
		if (!m_CheckDoAI(this)) return;
		if (this.HandleThink) {
			this.HandleThink.call(this, intervalMs);
		} else {
			if (DBGOUT) console.log(this.name,"Think: no handler defined");
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SysLoop.method('OverThink', function ( intervalMs ) {
		if (!m_CheckDoAI(this)) return;
		if (this.HandleOverThink) {
			this.HandleOverThink.call(this, intervalMs);
		} else {
			if (DBGOUT) console.log(this.name,"OverThink: no handler defined");
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	SysLoop.method('Execute', function ( intervalMs ) {
		if (!m_CheckDoAI(this)) return;
		if (this.HandleExecute) {
			this.HandleExecute.call(this, intervalMs);
		} else {
			if (DBGOUT) console.log(this.name,"Execute: no handler defined");
		}
	});


//////////////////////////////////////////////////////////////////////////////
/**	CLEANUP FUNCTIONS *******************************************************/

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Release any data structures
/*/	SysLoop.method('Release', function () {
		// console.log('releasing allocated data, if any');
	});


//////////////////////////////////////////////////////////////////////////////
/**	EVENT FUNCTIONS *********************************************************/

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	ChangeStage() stub for levels
/*/	SysLoop.method('ChangeStage', function ( stage_id ) {
		if (this.HandleChangeStage) {
			this.HandleChangeStage.call(this, stage_id);
		} else {
			if (DBGOUT) console.log(this.name,"ChangeStage: no handler defined");
		}
	});


//////////////////////////////////////////////////////////////////////////////
/** PUBLIC API **************************************************************/

	var FACTORY = {};	// MGR, FACTORY, or CLASS
	FACTORY.name = "SysLoop";

/// HEAP-SAVING PRE-ALLOCATED VARIABLES ////////////////////////////////////

	var arr, i;


///	SysLoop CREATION ///////////////////////////////////////////////////////

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Returns a pre-made SysLoop object to handle the MasterJS standard
	with defaults; just override with your own methods.
/*/	FACTORY.New = function ( name ) {
		return m_AddNewSysLoop (name);
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	The Main Loop is executed first!
/*/	FACTORY.InitializeGame = function ( name ) {
		if (m_master_gameloop) {
			// this happens because we load a "default game" in master.js
			// that could be overriden by a dynamic module load.
			m_master_gameloop.Release();
		}
		m_master_gameloop = new SysLoop(name);
		console.log("MASTER SYSLOOP INSTANCE CREATED",m_master_gameloop.name.bracket());
		return m_master_gameloop;
	};

///	STAGE CHANGE EVERYONE ///////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	FACTORY.ChangeStageAll = function ( stage_id ) {
		arr = m_LoopsArray();
		for (i=0;i<arr.length;i++) {
			m_loops[arr[i]].ChangeStage(stage_id);
		}
		m_master_gameloop.ChangeStage(stage_id);
	};

///	SYSTEM CALL EVERYONE ////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	FACTORY.ConnectAll = function ( viewmodel ) {
		arr = m_LoopsArray();
		for (i=0;i<arr.length;i++) {
			m_loops[arr[i]].Connect(viewmodel);
		}
		m_master_gameloop.Connect(viewmodel);
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	FACTORY.InitializeAll = function ( ) {
		arr = m_LoopsArray();
		for (i=0;i<arr.length;i++) {
			m_loops[arr[i]].Initialize();
		}
		m_master_gameloop.Initialize();
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	FACTORY.LoadAssetsAll = function ( checkIn ) {
		var mycim = new CheckInMonitor( this, f_LoadComplete );
		arr = m_LoopsArray();
		for (i=0;i<arr.length;i++) {
			var sloop = m_loops[arr[i]];
			var name = sloop.name || 'undefined'+i;
			var cin = mycim.NewCheckIn('sysloop.'+sloop.name);
			sloop.LoadAssets( cin );
		}
		mycim.Activate();

		// this is called when the monitored loads are done
		function f_LoadComplete () {
			// last checkIn.Notify() handled by master game loop
			m_master_gameloop.LoadAssets(checkIn);
		}
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	FACTORY.ConstructAll = function ( ) {
		arr = m_LoopsArray();
		for (i=0;i<arr.length;i++) {
			m_loops[arr[i]].Construct();
		}
		m_master_gameloop.Construct();
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	FACTORY.StartAll = function ( start_ms ) {
		arr = m_LoopsArray();
		for (i=0;i<arr.length;i++) {
			m_loops[arr[i]].Start(start_ms);
		}
		m_master_gameloop.Start(start_ms);
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	FACTORY.GameStep = function ( ms ) {
		m_master_gameloop.Step(ms);
		/* DON'T CALL STEP on SUBMODULES! */
		/* Step is reserved for Master Sysloop */
	};


///	STEP SUBCALL EVERYONE ///////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	FACTORY.GetInputAll = function ( ms ) {
		arr = m_LoopsArray();
		for (i=0;i<arr.length;i++) {
			m_loops[arr[i]].GetInput(ms);
		}
		m_master_gameloop.GetInput(ms);
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	FACTORY.PhysicsUpdate = function ( ms ) {
		PIECEFACTORY.PhysicsStep( ms );
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	FACTORY.ModulesUpdate = function ( ms ) {
		arr = m_LoopsArray();
		for (i=0;i<arr.length;i++) {
			m_loops[arr[i]].Update(ms);
		}
		m_master_gameloop.Update(ms);
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	FACTORY.ModulesThink = function ( ms ) {
		arr = m_LoopsArray();
		for (i=0;i<arr.length;i++) {
			m_loops[arr[i]].Think(ms);
		}
		m_master_gameloop.Think(ms);
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	FACTORY.ModulesOverThink = function ( ms ) {
		arr = m_LoopsArray();
		for (i=0;i<arr.length;i++) {
			m_loops[arr[i]].OverThink(ms);
		}
		m_master_gameloop.OverThink(ms);
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	FACTORY.ModulesExecute = function ( ms ) {
		arr = m_LoopsArray();
		for (i=0;i<arr.length;i++) {
			m_loops[arr[i]].Execute(ms);
		}
		m_master_gameloop.Execute(ms);
	};


///	PIECE AI UPDATES /////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	FACTORY.PiecesUpdate = function ( ms ) {
		PIECEFACTORY.PiecesUpdate ( ms );
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	FACTORY.PiecesThink = function ( ms ) {
		PIECEFACTORY.PiecesThink ( ms );
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	FACTORY.PiecesExecute = function ( ms ) {
		PIECEFACTORY.PiecesExecute ( ms );
	};


///////////////////////////////////////////////////////////////////////////////
/** MODULE PRIVATE VARIABLES ************************************************/

	var m_master_gameloop;		// the master loop that is run first
	var m_loops = {};		// loop collection to ensure uniqueness


///////////////////////////////////////////////////////////////////////////////
/** MODULE PRIVATE FUNCTIONS ************************************************/

/// MORE HEAP-SAVING PRE-ALLOCATED VARIABLES //////////////////////////////////

	var loop, doMe, aiDefined;

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function m_AddNewSysLoop ( name ) {
		loop = m_loops[name];
		if (loop) {
			console.error("A loop module named",name.bracket(),"already declared");
			return null;
		} else {
			loop = new SysLoop(name);
			m_loops[name] = loop;
			return loop;
		}
	}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function m_LoopsArray () {
		return Object.keys(m_loops);
	}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function m_CheckDoInput ( slobj ) {
		doMe = slobj.processInput;
		if (doMe) return true;
		if ((doMe===false) && (slobj.HandleInput)) {
			// repurpose process flag from "false" to "0" for output-once
			slobj.processInput = 0;
			console.error('module',slobj.name.bracket(),'InputHandler is defined but processing is disabled');
		}
	}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function m_CheckDoUpdate ( slobj ) {
		doMe = slobj.processUpdate;
		if (doMe) return true;
		if ((doMe===false) && (slobj.HandleUpdate)) {
			// repurpose process flag from "false" to "0" for output-once
			slobj.processUpdate = 0;
			console.error('module',slobj.name.bracket(),'UpdateHandler is defined but processing is disabled');
		}
	}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	function m_CheckDoAI ( slobj ) {
		doMe = slobj.processAI;
		if (doMe) return true;
		aiDefined = slobj.HandleThink!==null;
		aiDefined = aiDefined || slobj.HandleOverThink!==null; 
		aiDefined = aiDefined || slobj.HandleExecute!==null;
		if ((doMe===false) && (aiDefined)) {
			// repurpose process flag from "false" to "0" for output-once
			slobj.processAI = 0;
			console.error('module',slobj.name.bracket(),'AI handler(s) defined but processing is disabled');
		}
	}


///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE DEFINITION FOR REQUIREJS ***********************************/
	return FACTORY;
	
});
