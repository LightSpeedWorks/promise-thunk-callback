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

var nextTick = //typeof process === 'object' && process &&
	//typeof process.nextTick === 'function' ? process.nextTick :
	typeof setImmediate === 'function' ? setImmediate :
	function nextTick(cb) { setTimeout(cb, 0); };

var NN = 50, nn = NN;

//================================================================================
function Thunk(setup, cbOpts) {
	var list = typeof cbOpts === 'function' ? [cbOpts] : [];
	var args = null, notYetSetup = true;
	var result = undefined, notYetResult = true;
	var doNextTick = cbOpts != null && cbOpts.nextTick;

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

	function thunk(cb) {
		if (typeof cb === 'function') {
			if (notYetSetup &&
				typeof setup === 'function')
				try { notYetSetup = false; setup(thunk, thunk); }
				catch (err) { thunk(err); }

			return Thunk(function (thunk) {
				list.push(function (err, val) {
					try { return valcb(cb.apply(null,
						normalizeArgs(arguments)), thunk); }
					catch (err) { return thunk(err); }
				});
				if (args)
					doNextTick || --nn < 0 ?
						(nn = NN, void nextTick(fire)) :
						fire();
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

		if (!args) args = normalizeArgs(arguments);
		return list.length > 0 ?
			doNextTick || --nn < 0 ? (nn = NN, void nextTick(fire)) :
				fire() : void 0;
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

var slice = [].slice;

function normalizeArgs(args) {
	switch (args.length) {
		case 0: case 2: return args;
		case 1: return args[0] instanceof Error ? args : [null, args[0]];
		case 3: return [args[0], [args[1], args[2]]];
		default: return [args[0]].concat(slice.call(args, 1));
	}
}

function caught(rejected) {
	var self = this;
	return Thunk(function (thunk) {
		self(function (err, val) {
			try { return valcb(err ?
				rejected ? rejected(err) : err :
				val, thunk);
			} catch (e) { return thunk(e); }
		});
	}, {immediate: true});
}

function then(resolved, rejected) {
	var self = this;
	return Thunk(function (thunk) {
		self(function (err, val) {
			try { return valcb(err ?
				rejected ? rejected(err) : err :
				resolved ? resolved(val) : val, thunk);
			} catch (e) { return thunk(e); }
		});
	}, {immediate: true});
}

//================================================================================
function resolve(val) {
	return Thunk(function (thunk) { valcb(val, thunk); }, {nextTick: true});
}

function reject(err) {
	return Thunk(function (thunk) { thunk(err); }, {nextTick: true});
}

//================================================================================
function aa(gtor, cbOpts) {
	if (typeof gtor === 'function') gtor = gtor();

	return Thunk(!gtor || typeof gtor.next !== 'function' ?
		function (thunk) { valcb(gtor, thunk); } :
		function (thunk) {
			return function cb2(err, val) {
				if (arguments.length === 1 && !(err instanceof Error))
					val = err, err = null;
				try { var obj = err ? gtor.throw(err) : gtor.next(val);
				} catch (err) { return thunk(err); }
				val = obj.value;
				return obj.done ? valcb(val, thunk) :
					val && val.constructor === Array ? arrcb(val, cb2) :
					val && val.constructor === Object ? objcb(val, cb2) :
					valcb(val, cb2);
			} ();
		}, cbOpts);
}

function valcb(val, cb) {
	return !val ? cb(null, val) :
		typeof val === 'function' ?
			--nn < 0 ? (nn = NN, nextTick(function () { val(cb); })) : val(cb) :
		typeof val.then === 'function' ?
			val.then(function (v) { return valcb(v, cb); }, cb) :
		typeof val.next === 'function' ? aa(val)(cb) :
		val instanceof Error ? cb(val) :
		cb(null, val);
}

function arrcb(arr, cb) {
	var n = arr.length, res = new Array(n);
	if (n === 0) return cb(null, arr);
	arr.forEach(function (val, i) {
		valcb(val, function (err, val) {
			if (arguments.length === 1 && !(err instanceof Error))
				val = err, err = null;
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
			if (arguments.length === 1 && !(err instanceof Error))
				val = err, err = null;
			if (err) return n = 0, cb(err);
			res[i] = val;
			if (--n === 0) cb(null, res);
		});
	});
}

//================================================================================
function all(arr, cbOpts) {
	return Thunk(function (thunk) {
		(arr.constructor === Array ? arrcb : objcb)(arr, thunk);
	}, cbOpts);
}

function racecb(arr, cb) {
	var end = false;
	arr.forEach(function (val, i) {
		valcb(val, function (err, val) {
			if (end) return;
			if (arguments.length === 1 && !(err instanceof Error))
				val = err, err = null;
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
			if (arguments.length === 1 && !(err instanceof Error))
				val = err, err = null;
			end = true;
			err ? cb(err) : cb(null, val);
		});
	});
}

function race(arr, cbOpts) {
	return Thunk(function (thunk) {
		(arr.constructor === Array ? racecb : raceobjcb)(arr, thunk);
	}, cbOpts);
}

//================================================================================
function Channel() {
	var list = [], args = [], ctx = this;
	return function channel(cb) {
		if (typeof cb === 'function')
			list.push(cb);
		else args.push(normalizeArgs(arguments));
		while (args.length > 0 && list.length > 0)
			list.shift().apply(ctx, args.shift());
	}
}

//================================================================================
function wait(msec, val, cbOpts) {
	return Thunk(function (thunk) {
		if (msec < 0) setTimeout(thunk, 0, new Error('msec must be plus or zero'));
		else setTimeout(thunk, msec, null, val);
	}, cbOpts);
}

})(Function('return this')());
