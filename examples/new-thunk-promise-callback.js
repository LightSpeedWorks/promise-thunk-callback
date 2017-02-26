// callback = arguments[arguments.length - 1] : (err, val) => void
// thunk = (cb) => thunk : function
// promise = .then/.catch : promise
// generator = .next/.throw : {done: boolean, value: any}
// stream = .on(end|error|data)/.emit/.end : stream

sleep(1000, 'sa_1000',
   (err, val) => (console.log('sa1 ' + val + ' ' + err), 'sa1x   '));
sleep(2000, 'sb_2000')
  ((err, val) => (console.log('sb1 ' + val + ' ' + err), 'sb1x   '));
sleep(3000, 'sc_3000')
.then(val => (console.log('sc1 ' + val), 'sc1x   '),
      err => (console.log('sc1 ' + err), 'sc1e   '))
.then(val => (console.log('sc2 ' + val), 'sc2x   '),
      err => (console.log('sc2 ' + err), 'sc2e   '));

Sleep(1050, 'SA_1050',
   (err, val) => (console.log('SA1 ' + val + ' ' + err), 'SA1x   '));
Sleep(2050, 'SB_2050')
  ((err, val) => (console.log('SB2 ' + val + ' ' + err), 'SB2x   '));
Sleep(3050, 'SC_3050')
.then(val => (console.log('SC1 ' + val), 'SC1x   '),
      err => (console.log('SC1 ' + err), 'SC1e   '))
.then(val => (console.log('SC2 ' + val), 'SC2x   '),
      err => (console.log('SC2 ' + err), 'SC2e   '));

delay(1100, 'da_1100',
   (err, val) => (console.log('da1 ' + val + ' ' + err), 'da1x   '));
delay(2100, 'db_2100')
  ((err, val) => (console.log('db1 ' + val + ' ' + err), 'db1x   '))
  ((err, val) => (console.log('db2 ' + val + ' ' + err), 'db2x   '));
delay(3100, 'dc_3100')
.then(val => (console.log('dc1 ' + val), 'dc1x   '),
      err => (console.log('dc1 ' + err), 'dc1e   '))
.then(val => (console.log('dc2 ' + val), 'dc2x   '),
      err => (console.log('dc2 ' + err), 'dc2e   '));

wait(1200, 'wa_1200',
   (err, val) => (console.log('wa1 ' + val + ' ' + err), 'wa1x   '));
wait(2200, 'wb_2200')
  ((err, val) => (console.log('wb1 ' + val + ' ' + err), 'wb1x   '))
  ((err, val) => (console.log('wb2 ' + val + ' ' + err), 'wb2x   '));
wait(3200, 'wc_3200')
.then(val => (console.log('wc1 ' + val), 'wc1x   '),
      err => (console.log('wc1 ' + err), 'wc1e   '))
.then(val => (console.log('wc2 ' + val), 'wc2x   '),
      err => (console.log('wc2 ' + err), 'wc2e   '));

Wait(1300, 'Wa_1300',
   (err, val) => (console.log('Wa1 ' + val + ' ' + err), 'Wa1x   '));
Wait(2300, 'Wb_2300')
  ((err, val) => (console.log('Wb1 ' + val + ' ' + err), 'Wb1x   '))
  ((err, val) => (console.log('Wb2 ' + val + ' ' + err), 'Wb2x   '));
Wait(3300, 'Wc_3300')
.then(val => (console.log('Wc1 ' + val), 'Wc1x   '),
      err => (console.log('Wc1 ' + err), 'Wc1e   '))
.then(val => (console.log('Wc2 ' + val), 'Wc2x   '),
      err => (console.log('Wc2 ' + err), 'Wc2e   '));


function sleep(msec, val, cb) {
	var list = typeof cb === 'function' ? [cb] : [];
	function thunk(cb) {
		if (typeof cb === 'function') list.push(cb);
	}
	function callback(err, val) {
		if (arguments.length === 1 && !(err instanceof Error))
			val = err, err = null;
		return list.map(function (f) { return f(err, val); })[0];
	}
	thunk.promise = null;
	thunk.then = then;
	thunk['catch'] = caught;
	if (msec < 0) setTimeout(callback, 0, new Error('msec must be plus or zero'));
	else setTimeout(callback, msec, null, val);
	return thunk;
}

function Sleep(msec, val, cb) {
	var list = typeof cb === 'function' ? [cb] : [];
	function callback(err, val) {
		if (typeof err === 'function') return list.push(err), void 0;
		if (arguments.length === 1 && !(err instanceof Error))
			val = err, err = null;
		return list.map(function (f) { return f(err, val); })[0];
	}
	callback.promise = null;
	callback.then = then;
	callback['catch'] = caught;
	if (msec < 0) setTimeout(callback, 0, new Error('msec must be plus or zero'));
	else setTimeout(callback, msec, null, val);
	return callback;
}

function delay(msec, val, cb) {
	return thunkPromiseCallback(function (cb) {
		if (msec < 0) setTimeout(cb, 0, new Error('msec must be plus or zero'));
		else setTimeout(cb, msec, null, val);
	}, cb);
}

function wait(msec, val, cb) {
	return callbackThunkPromise(function (cb) {
		if (msec < 0) setTimeout(cb, 0, new Error('msec must be plus or zero'));
		else setTimeout(cb, msec, null, val);
	}, cb).thunk;
}

function Wait(msec, val, cb) {
	return Thunk(function (cb) {
		if (msec < 0) setTimeout(cb, 0, new Error('msec must be plus or zero'));
		else setTimeout(cb, msec, null, val);
	}, cb);
}

function thunkPromiseCallback(setup, cb) {
	var list = typeof cb === 'function' ? [cb] : [];
	function callback(err, val) {
		if (arguments.length === 1 && !(err instanceof Error))
			val = err, err = null;
		return list.map(function (f) { return f(err, val); })[0];
	}
	function thunk(cb) {
		return thunkPromiseCallback(function (cb2) {
			list.push(function (err, val) {
				if (arguments.length === 1 && !(err instanceof Error))
					val = err, err = null;
				try { return cb2(null,
						typeof cb === 'function' ?
							cb(err, val) : void 0);
				} catch (err) { return cb2(err); }
			});
		});
	}
	thunk.promise = null;
	thunk.then = then;
	thunk['catch'] = caught;
	if (typeof setup === 'function') setup(callback);
	return thunk;
}

function callbackThunkPromise(setup, cb) {
	var list = typeof cb === 'function' ? [cb] : [];
	function callback(err, val) {
		if (arguments.length === 1 && !(err instanceof Error))
			val = err, err = null;
		return list.map(function (f) { return f(err, val); })[0];
	}
	function thunk(cb) {
		return callbackThunkPromise(function (cb2) {
			list.push(function (err, val) {
				if (arguments.length === 1 && !(err instanceof Error))
					val = err, err = null;
				try { return cb2(null,
						typeof cb === 'function' ?
							cb(err, val) : void 0);
				} catch (err) { return cb2(err); }
			});
		}).thunk;
	}
	thunk.promise = null;
	thunk.then = then;
	thunk['catch'] = caught;
	callback.thunk = thunk;
	if (typeof setup === 'function') setup(callback);
	return callback;
}

function Thunk(setup, cb) {
	var list = typeof cb === 'function' ? [cb] : [];
	function callback(first, val) {
		if (typeof first === 'function')
			return Thunk(function (cb2) {
				list.push(function (err, val) {
					if (arguments.length === 1 && !(err instanceof Error))
						val = err, err = null;
					try { return cb2(null, first(err, val));
					} catch (err) { return cb2(err); }
				});
			});
		if (arguments.length === 1 && !(first instanceof Error))
			val = first, first = null;
		return list.map(function (f) { return f(first, val); })[0];
	}
	callback.promise = null;
	callback.then = then;
	callback['catch'] = caught;
	if (typeof setup === 'function') setup(callback);
	return callback;
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

aa(function *() {
	console.log('aa start');
	yield cb => setTimeout(cb, 4000);
	console.log('aa sleep:', yield sleep(200, 'aa sleep'));
	console.log('aa Sleep:', yield Sleep(200, 'aa Sleep'));
	console.log('aa delay:', yield delay(200, 'aa delay'));
	console.log('aa wait :', yield wait(200, 'aa wait'));
	console.log('aa Wait :', yield Wait(200, 'aa Wait'));
	console.log('aa cb => sleep:', yield cb => sleep(200, 'aa sleep', cb));
	console.log('aa cb => Sleep:', yield cb => Sleep(200, 'aa Sleep', cb));
	console.log('aa cb => delay:', yield cb => delay(200, 'aa delay', cb));
	console.log('aa cb => wait :', yield cb => wait(200, 'aa wait', cb));
	console.log('aa cb => Wait :', yield cb => Wait(200, 'aa Wait', cb));
	console.log('aa sleep.then:', yield sleep(200, 'aa sleep').then(v => v).then(v => v));
	console.log('aa Sleep.then:', yield Sleep(200, 'aa Sleep').then(v => v).then(v => v));
	console.log('aa delay.then:', yield delay(200, 'aa delay').then(v => v).then(v => v));
	console.log('aa wait.then :', yield wait(200, 'aa wait').then(v => v).then(v => v));
	console.log('aa Wait.then :', yield Wait(200, 'aa Wait').then(v => v).then(v => v));
	console.log('aa sleep()():', yield sleep(200, 'aa sleep')(vv));
	console.log('aa Sleep()():', yield Sleep(200, 'aa Sleep')(vv));
	console.log('aa delay()():', yield delay(200, 'aa delay')(vv)(vv)(vv));
	console.log('aa wait()() :', yield wait(200, 'aa wait')(vv)(vv)(vv));
	console.log('aa Wait()() :', yield Wait(200, 'aa Wait')(vv)(vv)(vv));
	console.log('aa []:', yield [Wait(200, '200'), Wait(100, '100'), Wait(300, '300')]);
	console.log('aa {}:', yield {x:Wait(200, '200'), y:Wait(100, '100'), z:Wait(300, '300')});
	return 'aa end';
	function vv(err, val) { return val; }
})
.then(val => console.log('aa end: ' + val),
      err => console.log('aa err: ' + err));

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
