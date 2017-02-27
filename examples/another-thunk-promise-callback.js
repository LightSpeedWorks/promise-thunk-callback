'use strict';

// Thunk0

//================================================================================
function Thunk0(setup) {
	var list = [], args;
	try{ setup(cb); } catch (e) { cb(e); }
	return thunk;

	function cb(err, val) {
		if (args) return args[0] ?
			err ? console.log('rejected twice:', err, args[0]) : console.log('resolved after rejected:', val, args[0]) :
			err ? console.log('rejected after resolved:', err, args[1]) : console.log('resolved twice:', val, args[1]);
		args = arguments;
		list.length && fire();
	} // cb

	function thunk(cb) {
		list.push(cb);
		args && fire();
		return Thunk0(function (next) { cb.next = next; });
	} // thunk

	function fire() {
		var cb;
		while (cb = list.shift()) {
			var next = cb.next;
			try {
				var r = cb.apply(null, args);
				if (typeof r === 'function') r(next);
				else if (r && r.then) r.then(function (v) { next(null, v); }, next);
				else if (r instanceof Error) next(r);
				else next(null, r);
			} catch (e) { next(e); }
		}
	} // fire
} // Thunk0

//if (typeof module === 'object' && module && module.exports)
//	module.exports = Thunk;

//================================================================================
function Thunk1(setup) {
	var list = [], next, args;
	try { setup(cb); } catch (e) { cb(e); }
	return thunk;

	function thunk(cb) {
		list.push(cb);
		args && fire();
		return Thunk1(function (cb) { next = cb; });
	} // thunk

	function cb(err, val) {
		args = arguments;
		list.length && fire();
	} // cb

	function fire() {
		try {
			var callback;
			while (callback = list.shift()) {
				var r = callback.apply(null, args);
				if (typeof r === 'function') r(next);
				else if (r && r.then) r.then(function (v) { next(null, v); }, next);
				else if (r instanceof Error) next(r);
				else next(null, r);
			}
		} catch (e) { next(e); }
	} // fire
} // Thunk1

//================================================================================
function Thunk(setup, cb) {
	var list = typeof cb === 'function' ? [cb] : [];
	var args = null, initialized = false;
	var next = null, result = undefined;

	callback.promise = null;
	callback.then = then;
	callback['catch'] = caught;

	if (typeof setup === 'function' &&
		typeof cb === 'function') {
		initialized = true;
		setup(callback, callback); // throws
		return;
	}
	return callback;

	function callback(first, val) {
		// thunk
		if (typeof first === 'function') {
			if (!initialized &&
				typeof setup === 'function' &&
				typeof cb !== 'function')
				try { initialized = true; setup(callback, callback); }
				catch (err) { callback(err); }

			if (!next) {
				next = Thunk();
				list.push(function (err, val) {
					var args = normalizeArgs(arguments);
					try {
						var r = first.apply(null, args);
						return valcb(r, next); }
					catch (err) { return next(err); }
				});
			}
			if (args) fire();
			return next;
		}

		// callback
		if (!args) args = normalizeArgs(arguments);
		return fire();
		// return list.map(function (f) { return f.apply(null, args); })[0];
	}
	function fire() {
		var cb = null;
		while (cb = list.shift()) {
			var r = cb.apply(null, args);
			if (!result) result = r;
		}
		return result;
	}
}

var slice = [].slice;

function normalizeArgs(args) {
	switch (args.length) {
		case 0: return [];
		case 1: return args[0] instanceof Error ? [args[0]] : [null, args[0]];
		case 2: return [args[0], args[1]];
		case 3: return [args[0], [args[1], args[2]]];
		default: return [args[0]].concat(slice.call(args, 1));
	}
}

function caught(rejected) {
	return this.then(void 0, rejected);
}

function then(resolved, rejected) {
	var thunk = this;
	return (this.promise || (this.promise = new Promise(function (resolve, reject) {
		thunk(function (err, val) { return err ? reject(err) : resolve(val); });
	}))).then(resolved, rejected);
}

function wait(msec, val, cb) {
	return Thunk(function (cb) {
		if (msec < 0) setTimeout(cb, 0, new Error('msec must be plus or zero'));
		else setTimeout(cb, msec, null, val);
	}, cb);
}

//================================================================================
wait(1000, 'wa_1000',
   (err, val) => (console.log('wa1 ' + val + ' ' + err), 'wa1x   '));
wait(2000, 'wb_2000')
  ((err, val) => (console.log('wb1 ' + val + ' ' + err), 'wb1x   '))
  ((err, val) => (console.log('wb2 ' + val + ' ' + err), 'wb2x   '))
  ((err, val) => (console.log('wb3 ' + val + ' ' + err), cb => cb(null, 'wb3x   ')))
  ((err, val) => (console.log('wb4 ' + val + ' ' + err), cb => cb(null, 'wb4x   ')))
  ((err, val) => (console.log('wb5 ' + val + ' ' + err), Promise.resolve('wb5x   ')))
  ((err, val) => (console.log('wb6 ' + val + ' ' + err), Promise.resolve('wb6x   ')));
wait(3000, 'wc_3000')
.then(val => (console.log('wc1 ' + val), 'wc1x   '),
      err => (console.log('wc1 ' + err), 'wc1e   '))
.then(val => (console.log('wc2 ' + val), 'wc2x   '),
      err => (console.log('wc2 ' + err), 'wc2e   '));
wait(4000, 'wd_4000')
.then(val => (console.log('wd1 ' + val), Promise.resolve('wd1x   ')),
      err => (console.log('wd1 ' + err), Promise.resolve('wd1e   ')))
.then(val => (console.log('wd2 ' + val), Promise.resolve('wd2x   ')),
      err => (console.log('wd2 ' + err), Promise.resolve('wd2e   ')))
.then(val => console.log('wd3 ' + val),
      err => console.log('wd3 ' + err));

//================================================================================
function aa(gtor, cb) {
	if (typeof gtor === 'function') gtor = gtor();

	if (!gtor || typeof gtor.next !== 'function')
		return Thunk(function (cb) { cb(null, gtor); }, cb);

	return Thunk(function (cb) {
		return function next(err, val) {
			if (arguments.length === 1 && !(err instanceof Error))
				val = err, err = null;
			try { var obj = err ? gtor.throw(err) : gtor.next(val);
			} catch (err) { cb(err); }
			val = obj.value;
			return obj.done ? cb(null, val) :
				val && val.constructor === Array ? arrcb(val, next) :
				val && val.constructor === Object ? objcb(val, next) :
				valcb(val, next);
		} ();
	}, cb);
}

function valcb(val, cb) {
	return !val ? cb(null, val) :
		typeof val === 'function' ? val(cb) :
		typeof val.then === 'function' ? val.then(cb, cb) :
		typeof val.cb === 'function' ? aa(val)(cb) :
		val instanceof Error ? cb(val) :
		cb(null, val);
}

function arrcb(arr, cb) {
	var n = arr.length, res = new Array(n);
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
function Channel() {
	var recvs = [], sends = [];
	return channel;

	function channel(first, val) {
		var args = arguments;
		if (typeof first === 'function')
			recvs.push(first);
		else {
			if (arguments.length === 1 && !(first instanceof Error))
				args = [null, first];
			sends.push(args);
		}
		while (sends.length > 0 && recvs.length > 0)
			recvs.shift().apply(null, sends.shift());
	}
}
