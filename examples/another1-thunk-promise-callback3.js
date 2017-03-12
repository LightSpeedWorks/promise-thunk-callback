'use strict';

if (typeof module === 'object' && module && module.exports)
	module.exports = Thunk;

Thunk.aa = aa;
Thunk.Channel = Channel;
Thunk.all = all;
Thunk.race = race;

var nextTick = typeof setImmediate === 'function' ? setImmediate :
	function nextTick(cb) { setTimeout(cb, 0); };

//================================================================================
function Thunk(setup, cb) {
	var list = typeof cb === 'function' ? [cb] : [];
	var args = null, notYetSetup = true;
	var result = undefined, notYetResult = true;

	callback.then = then;
	callback['catch'] = caught;

	if (typeof setup === 'function' &&
		typeof cb === 'function') {
		notYetSetup = false;
		setup(callback, callback); // throws
		return;
	}

	return callback;

	function callback(first, val) {
		// thunk
		if (typeof first === 'function') {
			if (notYetSetup &&
				typeof setup === 'function' &&
				typeof cb !== 'function')
				try { notYetSetup = false; setup(callback, callback); }
				catch (err) { callback(err); }

			var next = Thunk();
			list.push(function (err, val) {
				try { return valcb(first.apply(null,
					normalizeArgs(arguments)), next); }
				catch (err) { return next(err); }
			});
			if (args)
				(typeof cb === 'object' && cb && cb.nextTick) ?
					(nextTick(fire), void 0) : fire();
			return next;
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
			(typeof cb === 'object' && cb && cb.nextTick) ?
				(nextTick(fire), void 0) : fire() : void 0;
	} // callback

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
	var cb = Thunk();
	this(function (err, val) {
		try { return valcb(err ?
			rejected ? rejected(err) : err :
			val, cb);
		} catch (e) { return cb(e); }
	});
	return cb;
}

function then(resolved, rejected) {
	var cb = Thunk();
	this(function (err, val) {
		try { return valcb(err ?
			rejected ? rejected(err) : err :
			resolved ? resolved(val) : val, cb);
		} catch (e) { return cb(e); }
	});
	return cb;
}

//================================================================================
Thunk.resolve = function resolve(val) {
	return Thunk(function (cb) { valcb(val, cb); }, {nextTick: true});
};

Thunk.reject = function reject(err) {
	return Thunk(function (cb) { cb(err); }, {nextTick: true});
};

//================================================================================
function aa(gtor, cb) {
	if (typeof gtor === 'function') gtor = gtor();

	if (!gtor || typeof gtor.next !== 'function')
		return Thunk(function (cb) { cb(null, gtor); }, cb);

	return Thunk(function (cb) {
		return function callback(err, val) {
			if (arguments.length === 1 && !(err instanceof Error))
				val = err, err = null;
			try { var obj = err ? gtor.throw(err) : gtor.next(val);
			} catch (err) { cb(err); }
			val = obj.value;
			return obj.done ? valcb(val, cb) :
				val && val.constructor === Array ? arrcb(val, callback) :
				val && val.constructor === Object ? objcb(val, callback) :
				valcb(val, callback);
		} ();
	}, cb);
}

function valcb(val, cb) {
	return !val ? cb(null, val) :
		typeof val === 'function' ? val(cb) :
		typeof val.then === 'function' ?
			val.then(function (v) { return cb(null, v); }, cb) :
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
function all(arr, cb) {
	return Thunk(function (cb) {
		(arr.constructor === Array ? arrcb : objcb)(arr, cb);
	}, cb);
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
	var end = false;
	var keys = Object.keys(obj);
	keys.forEach(function (i) {
		valcb(obj[i], function (err, val) {
			if (end) return;
			if (arguments.length === 1 && !(err instanceof Error))
				val = err, err = null;
			if (err) return n = 0, cb(err);
			end = true;
			err ? cb(err) : cb(null, val);
		});
	});
}

function race(arr, cb) {
	return Thunk(function (cb) {
		(arr.constructor === Array ? racecb : raceobjcb)(arr, cb);
	}, cb);
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

// DELETE FROM HERE
//================================================================================
/*
function Promise(setup) {
	var pending = true, err, val, list = [];
	this.$push = function () {
		list.push(arguments);
		if (!pending) nextTick(fire);
	};
	setup(resolve, reject); // throws
	function resolve(v) {
		if (pending) val = v, pending = false;
		nextTick(fire);
	}
	function reject(e) {
		if (pending) err = e, pending = false;
		nextTick(fire);
	}
	function fire() {
		if (pending) return;
		var pair;
		while (pair = list.shift())
			(function (rejected, resolved, cb) {
				try {
					err ? rejected ? valcb(rejected(err), cb): cb(err) :
						valcb(resolved ? resolved(val) : val, cb);
				} catch (e) { cb(e); }
			})(pair[0], pair[1], pair[2]);
	} // fire
	this.toString = function () {
		return pending ? 'pending' :
			err ? 'rejected ' + err : 'resolved ' + val;
	};
}
Promise.prototype.then = function then(resolved, rejected) {
	var self = this;
	return new Promise(function (res, rej) {
		self.$push(rejected, resolved,
			function cb(e, v) { e ? rej(e) : res(v); });
	});
};
Promise.prototype['catch'] = function caught(rejected) {
	return this.then(void 0, rejected);
};
Promise.resolve = function resolve(val) {
	return new Promise(function (res, rej) {
		valcb(val, function (e, v) { e ? rej(e) : res(v); });
	});
};
Promise.reject = function reject(err) {
	return new Promise(function (res, rej) { rej(err); });
};
Promise.all = function all(arr) {
	return new Promise(function (res, rej) {
		arrcb(arr, function (e, v) { e ? rej(e) : res(v); });
	});
};
*/

//================================================================================
function wait(msec, val, cb) {
	return Thunk(function (cb) {
		if (msec < 0) setTimeout(cb, 0, new Error('msec must be plus or zero'));
		else setTimeout(cb, msec, null, val);
	}, cb);
}

//================================================================================
let x = 10, F = false;
function a(v, m) {
	if (v) return;
	m = m || ('assert 失敗 @' + x);
	console.error(m);
	var err = new Error(m);
	console.error(err.stack || err + '');
	throw err;
}
console.log('@x' + ++x + ' wa0'), a(x === 11);
a(wait(1000, 'wa_1000',
   (err, val) => (console.log('@x' + ++x + ' wa1 ' + val + ' ' + err), a(x === 16), 'wa1x   '))
   === undefined);
console.log('@x' + ++x + ' wb0'), a(x === 12);
wait(2000, 'wb_2000')
  ((err, val) => (console.log('@x' + ++x + ' wb1 ' + val + ' ' + err), a(x === 17), 'wb1x   '))
  ((err, val) => (console.log('@x' + ++x + ' wb2 ' + val + ' ' + err), a(x === 18), 'wb2x   '))
  ((err, val) => (console.log('@x' + ++x + ' wb3 ' + val + ' ' + err), a(x === 19), cb => cb(null, 'wb3x   ')))
  ((err, val) => (console.log('@x' + ++x + ' wb4 ' + val + ' ' + err), a(x === 20), cb => cb(null, 'wb4x   ')))
  ((err, val) => (console.log('@x' + ++x + ' wb5 ' + val + ' ' + err), a(x === 21), Promise.resolve('wb5x   ')))
  ((err, val) => (console.log('@x' + ++x + ' wb6 ' + val + ' ' + err), a(x === 22), Promise.resolve('wb6x   ')))
  (err => console.error('@x' + x + ' wb  ' + (err.stack || err + '')));
console.log('@x' + ++x + ' wc0'), a(x === 13);
wait(3000, 'wc_3000')
.then(val => (console.log('@x' + ++x + ' wc1 ' + val), a(x === 23),     'wc1x   '),
      err => (console.log('@x' + ++x + ' wc1 ' + err), a((x = -23, F)), 'wc1e   '))
.then(val => (console.log('@x' + ++x + ' wc2 ' + val), a(x === 24),     'wc2x   '),
      err => (console.log('@x' + ++x + ' wc2 ' + err), a((x = -24, F)), 'wc2e   '))
.catch(err => console.error('@x' + x + ' wc  ' + (err.stack || err + '')));
console.log('@x' + ++x + ' wd0'), a(x === 14);
wait(4000, 'wd_4000')
.then(val => (console.log('@x' + ++x + ' wd1 ' + val), a(x === 25),     Promise.resolve('wd1x   ')),
      err => (console.log('@x' + ++x + ' wd1 ' + err), a((x = -25, F)), Promise.resolve('wd1e   ')))
.then(val => (console.log('@x' + ++x + ' wd2 ' + val), a(x === 26),     Promise.resolve('wd2x   ')),
      err => (console.log('@x' + ++x + ' wd2 ' + err), a((x = -26, F)), Promise.resolve('wd2e   ')))
.then(val => (console.log('@x' + ++x + ' wd3 ' + val), a(x === 27)),
      err => (console.log('@x' + ++x + ' wd3 ' + err), a((x = -27, F))))
.catch(err => console.error('@x' + x + ' wd  ' + (err.stack || err + '')));
console.log('@x' + ++x + ' wz0'), a(x === 15);


let y = 10;
console.log('@y' + ++y + ' y11'), a(y === 11, 'y11');
Thunk.resolve(true)
.then(val => (console.log('@y' + ++y + ' y14 ' + val), a(y === 14, 'y14')),
      err => (console.log('@y' + ++y + ' y14e' + err), a((y = -14), F)))
.catch(err => console.error('@y' + x + ' y14z ' + (err.stack || err + '')));
console.log('@y' + ++y + ' y12'), a(y === 12, 'y12');
Thunk.reject(new Error('always error'))
.then(val => (console.log('@y' + ++y + ' y15 ' + val), a((y = -15), F)),
      err => (console.log('@y' + ++y + ' y15e' + err), a(y === 15, 'y15')))
.catch(err => console.error('@y' + x + ' t15z ' + (err.stack || err + '')));
console.log('@y' + ++y + ' y13'), a(y === 13, 'y13');

let z = 10;
console.log('@z' + ++z + ' z11'), a(z === 11, 'z11');
Thunk(function (res, rej) { res(true); }, {nextTick: true})
.then(val => (console.log('@z' + ++z + ' z14 ' + val), a(z === 14, 'z14')),
      err => (console.log('@z' + ++z + ' z14e' + err), a((z = -14), F)))
.catch(err => console.error('@z' + x + ' z14z ' + (err.stack || err + '')));
console.log('@z' + ++z + ' z12'), a(z === 12, 'z12');
Thunk(function (res, rej) { rej(new Error('always error')); }, {nextTick: true})
.then(val => (console.log('@z' + ++z + ' z15 ' + val), a((z = -15), F)),
      err => (console.log('@z' + ++z + ' z15e' + err), a(z === 15, 'z15')))
.catch(err => console.error('@z' + x + ' t15z ' + (err.stack || err + '')));
console.log('@z' + ++z + ' z13'), a(z === 13, 'z13');

let w = 10;
console.log('@w' + ++w + ' w11'), a(w === 11, 'w11');
Thunk(function (res, rej) { res(true); })
.then(val => (console.log('@w' + ++w + ' w12 ' + val), a(w === 12, 'w12')),
      err => (console.log('@w' + ++w + ' w12e' + err), a((w = -12), F)))
.catch(err => console.error('@w' + x + ' w12w ' + (err.stack || err + '')));
console.log('@w' + ++w + ' w13'), a(w === 13, 'w13');
Thunk(function (res, rej) { rej(new Error('always error')); })
.then(val => (console.log('@w' + ++w + ' w14 ' + val), a((w = -14), F)),
      err => (console.log('@w' + ++w + ' w14e' + err), a(w === 14, 'w14')))
.catch(err => console.error('@w' + x + ' t14w ' + (err.stack || err + '')));
console.log('@w' + ++w + ' w15'), a(w === 15, 'w15');
