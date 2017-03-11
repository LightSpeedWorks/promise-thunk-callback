(function () {
'use strict';

(function (g) {
'use strict';

// Unified Thunk! Thunk with Promise and Callback!
// thunk === promise === callback!

if (typeof module === 'object' && module && module.exports)
	module.exports = Thunk;

g.Thunk = Thunk;

Thunk.aa = aa;
Thunk.all = all;
Thunk.race = race;
Thunk.resolve = resolve;
Thunk.reject = reject;
Thunk.Channel = Channel;
Thunk.wait = wait;

var nextTickDo = typeof process === 'object' && process &&
	typeof process.nextTick === 'function' ? process.nextTick :
	typeof setImmediate === 'function' ? setImmediate :
	function nextTickDo(cb) { setTimeout(cb, 0); };

var tasksInProgress = false, tasksQueue = [];
function nextTick() {
	tasksQueue.push(arguments);
	if (tasksInProgress) return;
	tasksInProgress = true;
	nextTickDo(tasksExecutor);
}
function tasksExecutor() {
	tasksInProgress = true;
	var args;
	while (args = tasksQueue.shift()) args[0](args[1], args[2]);
	tasksInProgress = false;
}

var slice = [].slice;

//================================================================================
function Thunk(setup, cbOpts) {
	var list = typeof cbOpts === 'function' ? [normalizeCb(cbOpts)] : [];
	var args = null, notYetSetup = true;
	var result = undefined, notYetResult = true;

	thunk.then = then;
	thunk['catch'] = caught;

	if (typeof setup === 'function') {
		if (typeof cbOpts === 'function') {
			notYetSetup = false;
			setup(thunk, thunk); // throws
			return;
		}
		else if (cbOpts && cbOpts.immediate) {
			notYetSetup = false;
			setup(thunk, thunk); // throws
		}
	}

	return thunk;

	function thunk(callback) {
		if (typeof callback === 'function') {
			if (notYetSetup &&
				typeof setup === 'function')
				try { notYetSetup = false; setup(thunk, thunk); }
				catch (err) { thunk(err); }

			return Thunk(function (thunk) {
				list.push(function (err, val) {
					if (arguments.length === 1)
						err instanceof Error || (val = err, err = null);
					else if (arguments.length > 2)
						val = slice.call(arguments, 1);
					try { return valcb(callback(err, val), thunk); }
					catch (err) { return thunk(err); }
				});
				if (args) nextTick(fire);
			}, {immediate: true});
		}

		// callback
		//if (args) {
		//	var args2 = normalizeArgs(arguments);
		//	args[0] ?
		//		args2[0] ?
		//			console.log('rejected twice:', args2[0], args[0]) :
		//			console.log('resolved after rejected:', args2[1], args[0]) :
		//		args2[0] ?
		//			console.log('rejected after resolved:', args2[0], args[1]) :
		//			console.log('resolved twice:', args2[1], args[1]);
		//}

		// if (!args) args = normalizeArgs(arguments);
		if (!args) {
			args = arguments;
			if (arguments.length === 1)
				callback instanceof Error || (args = [null, callback]);
			else if (arguments.length > 2)
				args = [callback, slice.call(arguments, 1)];
		}
		return list.length > 0 ? void nextTick(fire) : void 0;
	} // thunk

	function fire() {
		var cb = null;
		while (cb = list.shift()) {
			var r = cb.apply(null, args);
			if (notYetResult) result = r, notYetResult = false;
		}
		return result;
	} // fire
}

function normalizeArgs(args) {
	switch (args.length) {
		case 0: case 2: return args;
		case 1: return args[0] instanceof Error ? args : [null, args[0]];
		case 3: return [args[0], [args[1], args[2]]];
		default: return [args[0], slice.call(args, 1)];
	}
}

function normalizeCb(cb) {
	return function (err, val) {
		if (arguments.length === 1)
			err instanceof Error || (val = err, err = null);
		else if (arguments.length > 2)
			val = slice.call(arguments, 1);
		return cb(err, val);
	};
}

function caught(rejected) {
	var self = this;
	return Thunk(function (cb) {
		self(function (err, val) {
			try { return valcb(err ?
				rejected ? rejected(err) : err : val, cb);
			} catch (err) { return cb(err); }
		});
	}, {immediate: true});
}

function then(resolved, rejected) {
	var self = this;
	return Thunk(function (cb) {
		self(function (err, val) {
			try { return valcb(err ?
				rejected ? rejected(err) : err :
				resolved ? resolved(val) : val, cb);
			} catch (err) { return cb(err); }
		});
	}, {immediate: true});
}

//================================================================================
function resolve(val) {
	return Thunk(function (cb) { valcb(val, cb); });
}

function reject(err) {
	return Thunk(function (cb) { cb(err); });
}

//================================================================================
function aa(gtor, cbOpts) {
	if (typeof gtor === 'function') gtor = gtor();

	return Thunk(!gtor || typeof gtor.next !== 'function' ?
		function (callback) { valcb(gtor, callback); } :
		function (callback) {
			return function cb(err, val) {
				if (arguments.length === 1)
					err instanceof Error || (val = err, err = null);
				else if (arguments.length > 2)
					val = slice.call(arguments, 1);
				try { var obj = err ? gtor.throw(err) : gtor.next(val);
				} catch (err) { return callback(err); }
				val = obj.value;
				return obj.done ? valcb(val, callback) :
					typeof val === 'function' ? nextTick(val, cb) :
					typeof val === 'object' && val ? (
						typeof val.then === 'function' ?
							val.then(function (v) { return valcb(v, cb); }, cb) :
						typeof val.next === 'function' ? aa(val, cb) :
						val.constructor === Array ? arrcb(val, cb) :
						val.constructor === Object ? objcb(val, cb) :
						val instanceof Error ? nextTick(cb, val) :
						nextTick(cb, null, val)
					) :
					nextTick(cb, null, val);
			} ();
		}, cbOpts);
}

function valcb(val, cb) {
	return !val ? cb(null, val) :
		typeof val === 'function' ? nextTick(val, cb) :
		typeof val.then === 'function' ?
			val.then(function (v) { return valcb(v, cb); }, cb) :
		typeof val.next === 'function' ? aa(val, cb) :
		val instanceof Error ? cb(val) :
		cb(null, val);
}

function arrcb(arr, cb) {
	var n = arr.length, res = new Array(n);
	if (n === 0) return cb(null, arr);
	arr.forEach(function (val, i) {
		valcb(val, function (err, val) {
			if (arguments.length === 1)
				err instanceof Error || (val = err, err = null);
			else if (arguments.length > 2)
				val = slice.call(arguments, 1);
			if (err) return n = 0, cb(err);
			res[i] = val;
			if (--n === 0) cb(null, res);
		});
	});
}

function objcb(obj, cb) {
	var keys = Object.keys(obj), n = keys.length;
	if (n === 0) return cb(null, obj);
	var res = keys.reduce(function (res, i) { res[i] = void 0; return res; }, {});
	keys.forEach(function (i) {
		valcb(obj[i], function (err, val) {
			if (arguments.length === 1)
				err instanceof Error || (val = err, err = null);
			else if (arguments.length > 2)
				val = slice.call(arguments, 1);
			if (err) return n = 0, cb(err);
			res[i] = val;
			if (--n === 0) cb(null, res);
		});
	});
}

//================================================================================
function all(arr, cbOpts) {
	return Thunk(function (cb) {
		(arr.constructor === Array ? arrcb : objcb)(arr, cb);
	}, cbOpts);
}

function racecb(arr, cb) {
	var end = false;
	arr.forEach(function (val, i) {
		valcb(val, function (err, val) {
			if (end) return;
			if (arguments.length === 1)
				err instanceof Error || (val = err, err = null);
			else if (arguments.length > 2)
				val = slice.call(arguments, 1);
			end = true;
			err ? cb(err) : cb(null, val);
		});
	});
}

function raceobjcb(obj, cb) {
	var keys = Object.keys(obj), end = false;
	keys.forEach(function (i) {
		valcb(obj[i], function (err, val) {
			if (end) return;
			if (arguments.length === 1)
				err instanceof Error || (val = err, err = null);
			else if (arguments.length > 2)
				val = slice.call(arguments, 1);
			end = true;
			err ? cb(err) : cb(null, val);
		});
	});
}

function race(arr, cbOpts) {
	return Thunk(function (cb) {
		(arr.constructor === Array ? racecb : raceobjcb)(arr, cb);
	}, cbOpts);
}

//================================================================================
function Channel() {
	var list = [], values = [], ctx = this;
	return function channel(cb) {
		if (typeof cb === 'function')
			list.push(cb);
		else {
			var args = arguments;
			if (arguments.length === 1)
				cb instanceof Error || (args = [null, cb]);
			else if (arguments.length > 2)
				args = [cb, slice.call(arguments, 1)];
			values.push(args);
			// values.push(normalizeArgs(arguments));
		}
		while (values.length > 0 && list.length > 0)
			list.shift().apply(ctx, values.shift());
	}
}

//================================================================================
function wait(msec, val, cbOpts) {
	return Thunk(function (cb) {
		if (msec < 0) setTimeout(cb, 0, new Error('msec must be plus or zero'));
		else setTimeout(cb, msec, null, val);
	}, cbOpts);
}

})(Function('return this')());

const benchAll = require('./bench-all');
benchAll(Thunk);

})();
