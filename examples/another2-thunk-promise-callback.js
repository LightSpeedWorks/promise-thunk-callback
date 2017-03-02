'use strict';

const Thunk = require('./thunk2');

if (typeof module === 'object' && module && module.exports)
	module.exports = Thunk;

//================================================================================
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
