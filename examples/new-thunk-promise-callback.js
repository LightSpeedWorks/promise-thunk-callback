// callback = arguments[arguments.length - 1] : (err, val) => void
// thunk = (cb) => thunk : function
// promise = .then/.catch : promise
// generator = .next/.throw : {done: boolean, value: any}
// stream = .on(end|error|data)/.emit/.end : stream

sleep(1000, 'sa_1000',
   (err, val) => (console.log('sa1 ' + val + ' ' + err), 'sa1x'));
sleep(2000, 'sb_2000')
  ((err, val) => (console.log('sb1 ' + val + ' ' + err), 'sb1x'));
sleep(3000, 'sc_3000')
.then(val => (console.log('sc1 ' + val), 'sc1x'),
      err => (console.log('sc1 ' + err), 'sc1e'))
.then(val => (console.log('sc2 ' + val), 'sc2x'),
      err => (console.log('sc2 ' + err), 'sc2e'));

SLEEP(1050, 'SA_1050',
   (err, val) => (console.log('SA1 ' + val + ' ' + err), 'SA1x'));
SLEEP(2050, 'SB_2050')
  ((err, val) => (console.log('SB2 ' + val + ' ' + err), 'SB2x'));
SLEEP(3050, 'SC_3050')
.then(val => (console.log('SC1 ' + val), 'SC1x'),
      err => (console.log('SC1 ' + err), 'SC1e'))
.then(val => (console.log('SC2 ' + val), 'SC2x'),
      err => (console.log('SC2 ' + err), 'SC2e'));

delay(1100, 'da_1100',
   (err, val) => (console.log('da1 ' + val + ' ' + err), 'da1x'));
delay(2100, 'db_2100')
  ((err, val) => (console.log('db1 ' + val + ' ' + err), 'db1x'))
  ((err, val) => (console.log('db2 ' + val + ' ' + err), 'db2x'));
delay(3100, 'dc_3100')
.then(val => (console.log('dc1 ' + val), 'dc1x'),
      err => (console.log('dc1 ' + err), 'dc1e'))
.then(val => (console.log('dc2 ' + val), 'dc2x'),
      err => (console.log('dc2 ' + err), 'dc2e'));

wait(1200, 'wa_1200',
   (err, val) => (console.log('wa1 ' + val + ' ' + err), 'wa1x'));
wait(2200, 'wb_2200')
  ((err, val) => (console.log('wb1 ' + val + ' ' + err), 'wb1x'))
  ((err, val) => (console.log('wb2 ' + val + ' ' + err), 'wb2x'));
wait(3200, 'wc_3200')
.then(val => (console.log('wc1 ' + val), 'wc1x'),
      err => (console.log('wc1 ' + err), 'wc1e'))
.then(val => (console.log('wc2 ' + val), 'wc2x'),
      err => (console.log('wc2 ' + err), 'wc2e'));

Wait(1300, 'Wa_1300',
   (err, val) => (console.log('Wa1 ' + val + ' ' + err), 'Wa1x'));
Wait(2300, 'Wb_2300')
  ((err, val) => (console.log('Wb1 ' + val + ' ' + err), 'Wb1x'))
  ((err, val) => (console.log('Wb2 ' + val + ' ' + err), 'Wb2x'));
Wait(3300, 'Wc_3300')
.then(val => (console.log('Wc1 ' + val), 'Wc1x'),
      err => (console.log('Wc1 ' + err), 'Wc1e'))
.then(val => (console.log('Wc2 ' + val), 'Wc2x'),
      err => (console.log('Wc2 ' + err), 'Wc2e'));

WAIT(1400, 'WA_1400',
   (err, val) => (console.log('WA1 ' + val + ' ' + err), 'WA1x'));
WAIT(2400, 'WB_2400')
  ((err, val) => (console.log('WB1 ' + val + ' ' + err), 'WB1x'))
  ((err, val) => (console.log('WB2 ' + val + ' ' + err), 'WB2x'));
WAIT(3400, 'WC_3400')
.then(val => (console.log('WC1 ' + val), 'WC1x'),
      err => (console.log('WC1 ' + err), 'WC1e'))
.then(val => (console.log('WC2 ' + val), 'WC2x'),
      err => (console.log('WC2 ' + err), 'WC2e'));


function sleep(msec, val, cb) {
	var callbackList = typeof cb === 'function' ? [cb] : [];
	function thunk(cb) {
		if (typeof cb === 'function')
			callbackList.push(cb);
	}
	function callback(err, val) {
		var vals = callbackList.map(function (f) { return f(err, val); });
		callbackList = [];
		return vals[0];
	}
	thunk.then = then;
	thunk['catch'] = caught;
	if (msec < 0) setTimeout(callback, 0, new Error('msec must be plus or zero'));
	else setTimeout(callback, msec, null, val);
	return thunk;
}

function SLEEP(msec, val, cb) {
	var callbackList = typeof cb === 'function' ? [cb] : [];
	function callback(err, val) {
		if (typeof err === 'function')
			callbackList.push(err);
		else {
			var vals = callbackList.map(function (f) { return f(err, val); });
			callbackList = [];
			return vals[0];
		}
	}
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
	cb = callbackThunkPromise(function (cb) {
		if (msec < 0) setTimeout(cb, 0, new Error('msec must be plus or zero'));
		else setTimeout(cb, msec, null, val);
	}, cb);
	return cb.thunk;
}

function Wait(msec, val, cb) {
	// waitと同じ
	cb = callbackThunkPromise(function (cb) {
		if (msec < 0) setTimeout(cb, 0, new Error('msec must be plus or zero'));
		else setTimeout(cb, msec, null, val);
	}, cb);
	return cb.thunk;
}

function WAIT(msec, val, cb) {
	return UnifiedCallbackThunkPromise(function (cb) {
		if (msec < 0) setTimeout(cb, 0, new Error('msec must be plus or zero'));
		else setTimeout(cb, msec, null, val);
	}, cb);
}

function thunkPromiseCallback(setup, cb) {
	var callbackList = typeof cb === 'function' ? [cb] : [];
	function callback(err, val) {
		var vals = callbackList.map(function (f) { return f(err, val); });
		callbackList = [];
		return vals[0];
	}
	function thunk(cb) {
		var thunk2 = thunkPromiseCallback();
		callbackList.push(function (err, val) {
			try {
				return thunk2.callback(null,
					typeof cb === 'function' ?
						cb.apply(this, arguments) : void 0);
			} catch (err) { return thunk2.callback(err); }
		});
		return thunk2;
	}
	thunk.then = then;
	thunk['catch'] = caught;
	thunk.callback = callback;
	if (typeof setup === 'function') setup(callback);
	return thunk;
}

function callbackThunkPromise(setup, cb) {
	var callbackList = typeof cb === 'function' ? [cb] : [];
	function callback(err, val) {
		var vals = callbackList.map(function (f) { return f(err, val); });
		callbackList = [];
		return vals[0];
	}
	function thunk(cb) {
		var cb2 = callbackThunkPromise();
		callbackList.push(function (err, val) {
			try {
				return cb2(null,
					typeof cb === 'function' ?
						cb.apply(this, arguments) : void 0);
			} catch (err) { return cb2(err); }
		});
		return cb2.thunk;
	}
	thunk.promise = null;
	thunk.then = then;
	thunk['catch'] = caught;
	callback.thunk = thunk;
	if (typeof setup === 'function') setup(callback);
	return callback;
}

function UnifiedCallbackThunkPromise(setup, cb) {
	var callbackList = callback.list = typeof cb === 'function' ? [cb] : [];
	function callback(err, val) {
		if (typeof err === 'function') {
			var cb = err, cb2 = UnifiedCallbackThunkPromise();
			callbackList.push(function (err, val) {
				try {
					return cb2(null, cb.apply(this, arguments));
				} catch (err) { return cb2(err); }
			});
			return cb2;
		}
		else {
			var vals = callbackList.map(function (f) { return f(err, val); });
			callbackList = [];
			return vals[0];
		}
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
	var self = this;
	return (this.promise || (this.promise = new Promise(function (resolve, reject) {
		self(function (err, val) { err ? reject(err) : resolve(val); });
	}))).then(resolved, rejected);
}
