// callback = arguments[arguments.length - 1] : (err, val) => void
// thunk = (cb) => thunk : function
// promise = .then/.catch : promise
// generator = .next/.throw : {done: boolean, value: any}
// stream = .on(end|error|data)/.emit/.end : stream

sleep(1000, 'sa_1000',
	(err, val) => console.log('sa1', val, err));
sleep(2000, 'sb_2000')
	((err, val) => console.log('sb2', val, err));
sleep(3000, 'sc_3000')
.then(val => console.log('sc1', val), err => console.log('sc1 ' + err))
.then(val => console.log('sc2', val), err => console.log('sc2 ' + err));

delay(1100, 'da_1100',
	(err, val) => console.log('da1', val, err));
delay(2100, 'db_2100')
	((err, val) => console.log('db2', val, err));
delay(3100, 'dc_3100')
.then(val => console.log('dc1', val), err => console.log('dc1 ' + err))
.then(val => console.log('dc2', val), err => console.log('dc2 ' + err));

wait(1200, 'wa_1200',
	(err, val) => console.log('wa1', val, err));
wait(2200, 'wb_2200')
	((err, val) => console.log('wb2', val, err))
	((err, val) => console.log('wb2x', val, err));
wait(3200, 'wc_3200')
.then(val => console.log('wc1', val), err => console.log('wc1 ' + err))
.then(val => console.log('wc2', val), err => console.log('wc2 ' + err));


function sleep(msec, val, cb) {
	var callbackList = cb ? [cb] : [];
	function callback(err, val) {
		callbackList.forEach(function (f) { f(err, val); });
		callbackList = [];
	}
	function thunk(cb) {
		if (cb) callbackList.push(cb);
		if (msec < 0) setTimeout(callback, 0, new Error('msec must be plus or zero'));
		else setTimeout(callback, msec, null, val);
	}
	thunk.then = then;
	thunk['catch'] = caught;
	return thunk;
}

function delay(msec, val, cb) {
	var thunk = thunkPromiseCallback(cb, function () {
		if (msec < 0) setTimeout(cb, 0, new Error('msec must be plus or zero'));
		else setTimeout(cb, msec, null, val);
	});
	cb = thunk.callback;
	return thunk;
}

function wait(msec, val, cb) {
	cb = callbackThunkPromise(cb, function () {
		if (msec < 0) setTimeout(cb, 0, new Error('msec must be plus or zero'));
		else setTimeout(cb, msec, null, val);
	});
	return cb.thunk;
}

function caught(rejected) {
	return this.then(void 0, rejected);
}

function then(resolved, rejected) {
	var self = this;
	return new Promise(function (resolve, reject) {
		self(function (err, val) {
			err ? reject(err) : resolve(val);
		});
	}).then(resolved, rejected);
}

function thunkPromiseCallback(cb, setup) {
	var callbackList = cb ? [cb] : [];
	function callback(err, val) {
		callbackList.forEach(function (f) { f(err, val); });
		callbackList = [];
	}
	function thunk(cb) {
		if (cb) callbackList.push(cb);
		if (setup) setup();
	}
	thunk.then = then;
	thunk['catch'] = caught;
	thunk.callback = callback;
	return thunk;
}

function callbackThunkPromise(cb, setup) {
	var callbackList = cb ? [cb] : [];
	function callback(err, val) {
		callbackList.forEach(function (f) { f(err, val); });
		callbackList = [];
	}
	function thunk(cb) {
		if (cb) callbackList.push(cb);
		if (setup) setup();
		var cb2 = callbackThunkPromise();
		callbackList.push(cb2);
		return cb2.thunk;
	}
	thunk.then = then;
	thunk['catch'] = caught;
	callback.thunk = thunk;
	return callback;
}
