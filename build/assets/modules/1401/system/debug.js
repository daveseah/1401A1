/* debug.js */
define ([
	'1401/system/screen'	
], function ( 
	SCREEN
) {

	var DBGOUT = true;
	var GLOBAL = true;

/**	Debug *******************************************************************\

	The Debug object implements utilities for debugging and documenting.
	It will eventually implement an on-screen console, but right now it's
	just a stub for some documentation routines.

/** MODULE DECLARATION ******************************************************/

	var API = {};
	API.name = "debug";

	var m_watching = {};


///	INSPECTION ROUTINES //////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	InspectModule() prints a list of public properties and methods for each
	require module that contains the passed string. It returns a string, so
	you will have to console.log() to see the output.
/*/	API.InspectModule = function ( str ) {
		var rm = require.s.contexts._.defined;
		var mlist = [];
		var base = '1401/';
		if (str===undefined) str = base;
		str = (typeof str =='string') ? str : base;

		Object.keys(rm).forEach(function(key){
			var name = key.toString();
			if (name.indexOf(str)>=0) {
				mlist.push(key);
			}
		});

		var out = '\n';
		for (var i=0;i<mlist.length;i++) {
			var objName = mlist[i];
			out += objName+'\n';
			if (str!==base) {
				out+= "-----\n";
				var mod = rm[objName];
				out += m_DumpObj(mod);
				out += '\n';
			}
		}
		if (mlist.length) {
			console.log(out);
			return mlist.length + ' modules listed';
		} else 
			return "module " +str.bracket()+" not found";
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
/*/	InspectObject() accepts an object and a label, and prints a list of
	all the methods and properties in it. It returns a string, so you will
	have to console.log() to see the output.
/*/	API.InspectObject = function ( obj, depth ) {
		if (!obj) return "Must pass an object or 1401 watched object key string";

		var out = "";
		// handle command line calls	
		switch (typeof obj) {
			case 'object':
			case 'function': 
				break;
			case 'string':
				// see if string is a watched object stored in debugger
				var globj = m_watching[obj]; 
				if (!globj) {
					out = "pass object or 1401 watched object key";
					if (Object.keys(m_watching).length) {
						out += ' (strings listed below):\n';
						Object.keys(m_watching).forEach(function(key){
							out+="\t";
							out+=key;
							out+="\n";
						});
					}
					return out;
				} else {
					return this.InspectObject(globj);
				}
				break;
			default:
				return "must pass object or function, not "+(typeof obj);
		}

		// handle recursive scan
		depth = depth || 0;
		var label = obj.constructor.name || '(anonymous object)';
		var indent = "";
		for (var i=0;i<=depth;i++) indent+='\t';
		out+= label+'\n';
		out+= "\n";
		out += m_DumpObj(obj, depth+1);
		var proto = Object.getPrototypeOf(obj);
		if (proto) {
			out += "\n"+indent+"IN PROTO: ";
			out += this.InspectObject(proto,depth+1);
			out += "\n";
		}
		if (depth===0) out = '\n'+out;
		console.log(out);
		return obj;
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Use to add an instance of something temporarilyl inspectable by
	console InspectObject(). Useful for gaining access to certain objects
	that are buried inside a module, such as singleton instances like
	1401/objects/viewport
/*/	API.AddWatch = function ( key, obj ) {
		if (typeof key!=='string') {
			return "key must be a string";
		}
		key = key.toLowerCase();
		var exists = m_watching[key];
		if (exists) console.warn ("AddWatch:",key,"redefined");
		m_watching[key]=obj;
		console.info("AddWatch: defined new debug object key",key.bracket(),obj);
	};

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Append a <div>msg</div> to the #debug div. Can be overridden by adding
	selector argument
/*/	API.Out = function ( msg, escape_msg, selector ) {
		m_DebugOut( msg, escape_msg, selector );
	};



/** SUPPORTING FUNCTIONS ****************************************************/
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Support function for InspectModule() and InspectObject()
	Also checks m_watching array
/*/	function m_DumpObj ( obj, depth ) {
		var indent = "";
		for (var i=0;i<depth;i++) indent+='\t';

		var str = "";
		Object.keys(obj).forEach(function(key){
			var prop = obj[key];
			var type = typeof prop;
			str += indent;
			str += type + '\t'+key;
			switch (type) {
				case 'function':
					var regexp = /function.*\(([^)]*)\)/;
					var args = regexp.exec(prop.toString());
					str+= ' ('+args[1]+')'; 
					break;
				default:
					break;
			}
			str += '\n';
		});	
		return str;
	}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Debugger window text output
/*/	function m_DebugOut ( msg, escape_msg, selector ) {
		selector = selector || SCREEN.Debug;
		var $dbg = $(selector);
		if (Object.prototype.toString.call($dbg)==='[object Array]') {
			$dbg = $dbg[0];		// get first matching element
		}
		if (escape_msg) {
			var e = document.createElement('div');
			var t = document.createTextNode(msg);
			e.appendChild(t);
			$dbg.append(e);
		} else {
			$dbg.append('<div>'+msg+'</div>');
		}
	}


/** GLOBAL HOOKS *************************************************************/

	if (GLOBAL) {
		window.InspectModule = API.InspectModule;
		window.InspectObject = API.InspectObject;
		window.DBG_Out = function ( msg, selector ) {
			API.Out(msg,false, selector);
		};
		window.DBG_OutClean = function ( msg, selector ) {
			API.Out(msg,true,selector);
		};
	}


/** RETURN MODULE ************************************************************/

	return API;

});