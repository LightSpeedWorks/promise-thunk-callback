'use strict';

process.title = __filename.substr(__dirname.length + 1);
const Thunk = require('./thunk-a');

const benchAll = require('./bench-all');
benchAll(Thunk);
