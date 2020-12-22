var assert = require('assert');
var iniReader = require('../index');

// initialize

var parser = new iniReader.IniReader();

parser.load('./pollute.ini');
assert.equal({}.polluted, undefined);
assert.notEqual({}.polluted, 'polluted');
