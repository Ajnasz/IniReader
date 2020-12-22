var assert = require('assert');
var iniReader = require('../index');

// initialize

var parser = new iniReader.IniReader();

parser.load('./pollute.ini');
assert.equal({}.polluted, undefined);
assert.notEqual({}.polluted, 'polluted');
assert.equal(parser.values.__proto__.polluted, 'polluted');

var parser = new iniReader.IniReader();

var errFound = false;
parser.load('./ize-nowrite.ini');
parser.setParam('__proto__.polluted', 'polluted');
assert.equal({}.polluted, undefined);
assert.notEqual({}.polluted, 'polluted');
assert.equal(parser.getParam('__proto__.polluted'), 'polluted');
