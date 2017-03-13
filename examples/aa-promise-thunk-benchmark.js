'use strict';

process.title = __filename.substr(__dirname.length + 1);
const aa = require('aa');
//const aa = require('aa/aa01');
//const aa = require('aa/aa02');
const Thunk = require('promise-thunk');

	//================================================================================
	// wait(msec: number, val: any, cbOpts: Function | Options): Thunk | Promise
	function wait(msec, val, cbOpts) {
		return Thunk(function (cb) {
			if (msec < 0) setTimeout(cb, 0, new Error('msec must be plus or zero'));
			else setTimeout(cb, msec, null, val);
		}, cbOpts);
	} // wait

Thunk.aa = aa;
Thunk.wait = wait;

const benchAll = require('./bench-all-for-old');
benchAll(Thunk);
