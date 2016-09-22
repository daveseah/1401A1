/* timer .js */
define ([
	'1401/settings'
], function ( 
	SETTINGS
) {

	var DBGOUT = false;

/**	Timer *******************************************************************\

	To use: In Initialize(), call Timer.InitializePool() once to allocate a
	a pool of timers.  After that, you can call Timer.NewTimer() and 
	Timer.DisposeTimer() any time after the IniitalizePool() is invoked.

	### GENERAL USE ###

	Create a new timer, and always dispose of it when you're done!

		var timer = Timer.NewTimer();
		timer.Dispose();

	METHODS

	The following methods are available on the Timer objects. In
	general, you set up the MODE and callbacks, then call Start().

	COUNTER MODE

	This is an infinite count-up counter, reporting number of ticks

		timer.SetModeCounter();
		// tick every 3 seconds, after a 1 sec delayed start		
		timer.Start( 3000, 1000 );
		// inspect timer count
		var current = timer.Count();
		// returns 1 always, because it never stops
		var remaining = timer.CountRemaining();

	TIMER MODE

	This is an infinite count-up timer, reporting elapsed millseconds

		timer.SetModeTimer();
		// start timing 
		timer.Start(); 
		// inspect
		var currentMs = timer.TimeElapsed();
		// returns 1 always, because it never stops
		var remaining = timer.TimeRemaining(); 

	ONE SHOT MODE

	This is the default timer, which starts and then stops when
	the specified period is complete.

		timer.SetModeOneShot();
		// start timer with duration 3000, starting delayed by 500
		timer.Start( 1000, 500 );
		// inspect
		var isComplete = timer.IsComplete();
		var elapsed = timer.TimeElapsed();
		var remaining = timer.TimeRemaining();

	REPEATING MODE

	Works like ONES SHOT mode, except it repeats for the specified
	number of times before completing. If you set the count to 0,
	then it repeats forever. This is useful when using the callabcks.

		timer.SetModeRepeat( 100 );
		// start timer with duration 1000, no delay
		timer.Start( 1000 );
		// set callback handler that ticks every time
		// the repeat occurs
		timer.SetNotifyRepeat( function ( t ) {
			console.log('timer', t.id, 'completed countdown');
			console.log('. remaining count',t.CountRemaining());
		});
		// set callback handler that calls when all counts are
		// done
		timer.SetNotifyComplete( function ( t ) {
			console.log('timer', t.id, 'finished');
		});

	PAUSING OPERATION

		timer.Pause();
		timer.UnPause();
		timer.TogglePause();

	REUSING A TIMER 

		If you want to reuse a timer instance that's handy, use Reset()
		on the instance then set it up again.

			timer.Reset();
			// do everything again
			timer.SetModeRepeat ( 100 );
			timer.SetNotifyComplete( function ( t ) {
				console.log('timer', t.id, 'finished');
			});
			timer.Start( 1000, 3000 );

	TIMER INSPECTION 

	There are a variety of timer inspection methods. Note that the
	return value depends on the timer mode.

		var isComplete = timer.IsComplete();
		var isDelayed = timer.IsDelayed();
		var isRunning = timer.IsRunning();
		var isPaused = timer.IsPaused();

		var elapsed = timer.TimeElapsed()
		var remaining = timer.TimeRemaining()
		var count = timer.Count();
		var countLeft = CountRemaining();

	TIMER NOTIFICATION

		SetNotifyDelayed ( f ) - callback on delayed start
		SetNotifyComplete ( f) - callback on timer complete
		SetNotifyRepeat ( f ) - callback on timer repeat

/** OBJECT DECLARATION ******************************************************/

///	Timer ////////////////////////////////////////////////////////////////////

	/* constructor */
	function Timer () {
		this.Reset();
		this.id = ++Timer.idCounter;
	}
	/* class id counter */
	Timer.idCounter = 0;
	/* class constants - mode */
	Timer.MODE_ONESHOT 		= 'S';	// timer complete at end of period
	Timer.MODE_REPEAT 		= 'R';	// timer repeats every period
	Timer.MODE_LOOP 		= 'L';	// timer repeats every period N times
	Timer.MODE_TIMING		= 'T';	// timer just keeps track of time
	Timer.MODE_COUNTER		= 'C';	// counter counts every period
	/* class constants - timer state */
	Timer.WAITING			= 10;	// created but not initialized
	Timer.READY 			= 11;	// initialized and ready to go
	Timer.DELAYED			= 12;	// 
	Timer.RUNNING 			= 13;	// actively timing
	Timer.COMPLETE 			= 14;	// timing completed
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('SetModeCounter', function () {
		this.mode = Timer.MODE_COUNTER;
		this.loop_count = 0;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('SetModeTiming', function () {
		this.mode = Timer.MODE_TIMING;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('SetModeOneShot', function () {
		this.mode = Timer.MODE_ONESHOT;
		this.loop_count = 0;
		this.loop_max = 1;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('SetModeRepeat', function ( count ) {
		if (count) {
			this.mode = Timer.MODE_LOOP;
			this.loop_count = 0;
			this.loop_max = count;
		} else {
			this.mode = Timer.MODE_REPEAT;
			this.loop_count = 0;
			this.loop_max = -1; // this doesn't affect any calculations
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('SetNotifyDelayed', function ( f ) {
		if (!f) {
			this.notifyDelayed = null;
		} else {
			console.assert (f && (typeof f == 'function'),"need function or null!");
			this.notifyDelayed = f;
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('SetNotifyComplete', function ( f ) {
		if (!f) {
			this.notifyComplete = null;
		} else {
			console.assert (f && (typeof f == 'function'),"need function or null!");
			this.notifyComplete = f;
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('SetNotifyRepeat', function ( f ) {
		if (!f) {
			this.notifyRepeat = null;
		} else {
			console.assert (f && (typeof f == 'function'),"need function or null!");
			this.notifyRepeat = f;
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	Start the timer
/*/	Timer.method('Start', function ( period, delay ) {
		console.assert(period,"Timer.Start: Defaulting to 3000ms");
		period = period || 3000;
		delay = delay || 0;
		this.period = period;
		this.delay = delay;
		this.time_start = SETTINGS.MasterTime();
		this.status = Timer.READY;
		if (this.delay!==0) {
			// this.time_start modified in UPDATE code
			this.time_end = this.time_start + this.delay;
			this.status = Timer.DELAYED;
		} else {
			this.time_end = this.time_start + this.period;
			this.status = Timer.RUNNING;
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('Reset', function ( opt ) {
		opt = opt || {};
		opt.saveHandlers = opt.saveHandlers || false;

		this.mode = Timer.MODE_ONESHOT;
		this.status = Timer.WAITING;
		this.isPaused = false;

		this.period = 3000;	// duration/period in milliseconds
		this.delay = 0;		// delay in milliseconds
		
		this.time_start = null;
		this.time_end = null;
		this.loop_max = 1;
		this.loop_count = 0;
		this.duration_paused = 0;
		
		if (!opt.saveHandlers) {
			this.notifyRepeat = null;
			this.notifyComplete = null;
			this.notifyDelayed = null;
		}
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('Pause', function () { 
		if (this.IsRunning()) this.isPaused = true;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('UnPause', function () { 
		if (this.IsRunning()) this.isPaused = false; 
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('TogglePause', function () { 
		if (this.IsRunning()) this.isPaused = !this.isPaused; 
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('IsComplete', function () {
		return (this.status===Timer.COMPLETE);
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('IsDelayed', function () {
		return (this.status===Timer.DELAYED);
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('IsRunning', function () {
		return (this.status===Timer.RUNNING);
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('IsPaused', function () {
		return (this.isPaused);
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('TimeElapsed', function () {
		return SETTINGS.MasterTime() - this.time_start;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('TimeRemaining', function () {
		// in timer mode, there's ALWAYS more time...
		if (this.mode==Timer.MODE_TIMING) return 1;
		// otherwise, return positive remaining time in milliseconds
		var tt = this.time_end - SETTINGS.MasterTime();
		if (tt<0) tt = 0;
		return tt;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('TimePaused', function () {
		return this.duration_paused;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('Count', function () {
		return this.loop_count;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.method('CountRemaining', function () {
		// in counter mode, there's always one more
		if (this.mode==Timer.MODE_COUNTER) return 1;
		if (this.mode==Timer.MODE_REPEAT) return 1;

		// otherwise, return remaining count
		return this.loop_max - this.loop_count;
	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	internal method to update timer state, called by Timer.Heartbeat()
	DON'T CALL THIS
/*/	Timer.method('Update', function ( elapsed_ms ) {

		// are we paused? extend the time_end by current interval
		if (this.isPaused) {
			this.duration_paused += elapsed_ms;
			this.time_end += elapsed_ms;
			return;
		}
		// nothing to do? then just return
		if (this.status===Timer.WAITING) return;
		if (this.status===Timer.COMPLETE) return;

		var current_time = SETTINGS.MasterTime();

		// otherwise, do timer magic!
		switch (this.status) {
			case Timer.DELAYED:
				if (current_time >= this.time_end) {
					this.time_start = current_time;
					this.time_end = current_time + this.period;
					this.status = Timer.RUNNING;
					if (this.notifyDelayed)
						this.notifyDelayed.call({},this);
					if (DBGOUT) console.log('del start',this.id);
				}
				break;
			case Timer.RUNNING:
				if (this.mode == Timer.MODE_TIMING) break;
				if (current_time >= this.time_end) {
					switch (this.mode) {
						case Timer.MODE_ONESHOT:
							this.status = Timer.COMPLETE;
							if (this.notifyComplete) 
								this.notifyComplete.call({},this);
							break;
						case Timer.MODE_REPEAT:
							this.status = Timer.RUNNING;
							this.time_start = current_time;
							this.time_end = this.time_start + this.period;
							if (this.notifyRepeat)
								this.notifyRepeat.call({},this);
							break;
						case Timer.MODE_LOOP:
							if (++this.loop_count < this.loop_max) {
								this.status = Timer.RUNNING;
								this.time_start = current_time;
								this.time_end = this.time_start + this.period;
								if (this.notifyRepeat)
									this.notifyRepeat.call({},this);
							} else {
								this.status = Timer.COMPLETE;
								if (DBGOUT) console.log(this.id,"COMPLETE");
								if (this.notifyComplete) 
									this.notifyComplete.call({},this);
							}
							break;
						case Timer.MODE_COUNTER:
							++this.loop_count;
							this.time_start = current_time;
							this.time_end = this.time_start + this.period;
							if (this.notifyRepeat)
								this.notifyRepeat.call({},this);
							break;

					} // switch: mode
				}
				break;
		} // switch: status

	});
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/ Dispose of Timer by removing it from pool. Convenience feature so you
	don't have to think about pools.
/*/	Timer.method('Dispose', function () {
		Timer.DisposeTimer(this);
	});



/** MODULE DATA STRUCTURES ***************************************************/

	Timer.pool_size = 0;
	Timer.pool = [];
	Timer.pool_index = 0;

	// allocate counter storage to avoid growing heap on update calls
	var pobj, i;

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/ Initialize the pool of Timer objects, which hold a timer instance,
	an allocation flag, and a timer index number. N
/*/	Timer.InitializePool = function ( psize ) {
		Timer.pool_size = psize || Timer.pool_size || 100;
		for (i=0;i<Timer.pool_size;i++){
			// new pobj each time to store new pieces
			var pobj = {
				timer: new Timer(),
				allocated: false,
				index: i
			};
			Timer.pool[i] = pobj;
		}
	};

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.NewTimer = function ( period, delay ) {
		var timer = null;
		if (Timer.pool.length===0) 
			console.assert('Timer.InitializePool() was not called');
		for (i=0;i<Timer.pool_size;i++) {
			pobj = Timer.pool[Timer.pool_index];
			if (!pobj.allocated) {
				pobj.allocated = true;
				timer = pobj.timer;
				timer.Reset();
				break;
			}
			Timer.pool_index++;
			if (Timer.pool_index>=Timer.pool_size) Timer.pool_index = 0;
		}
		if (!timer) throw new Error("*** all timers allocated; increase pool size");
		if (DBGOUT) console.log("Timer.NewTimer: timer",timer.id,"allocated");
		return timer;
	};

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.DisposeTimer = function ( timer ) {

		var found = false;
		for (i=0;i<Timer.pool_size;i++) {
			pobj = Timer.pool[Timer.pool_index];
			if (pobj.timer===timer) {
				pobj.allocated = false;
				pobj.timer.Reset();
				found = true;
				break;
			}
			Timer.pool_index++;
			if (Timer.pool_index >= Timer.pool_size) Timer.pool_index = 0;		
		}
		if (DBGOUT) {
			if (found) 
				console.log("Timer.DisposeTimer: timer",pobj.timer.id,"released");
			else 
				console.log("Timer.DisposeTimer: timer",timer.id,"was not found in pool");
		}
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
	Timer.HeartBeat = function ( interval_ms ) {
		for (i=0;i<Timer.pool_size;i++) {
			pobj = Timer.pool[i];
			if (pobj.allocated) {
				pobj.timer.Update ( interval_ms );
			}
		}
	};


/** RETURN CONSTRUCTOR *******************************************************/

	return Timer;

});