var assert = require('assert');
var iniReader = require('../index');

// initialize

var parser = new iniReader.IniReader();

var errFound = false;
parser.on('error', function (err) {
	errFound = true;
	assert.equal({}.polluted, undefined);
	assert.notEqual({}.polluted, 'polluted');
});
parser.load('./pollute.ini');

assert.ok(errFound, 'Error not found');


var parser = new iniReader.IniReader();

var errFound = false;
parser.load('./ize-nowrite.ini');
parser.on('error', function (err) {
	errFound = true;
	assert.equal({}.polluted, undefined);
	assert.notEqual({}.polluted, 'polluted');
});
parser.setParam('__proto__.polluted', 'polluted');
assert.equal(parser.getParam('__proto__.polluted'), undefined);
assert.ok(errFound, 'Error not found');
