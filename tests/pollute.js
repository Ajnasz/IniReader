const assert = require('assert');
const iniReader = require('../index');

// initialize

(() => {
  const parser = new iniReader.IniReader();

  parser.load('./pollute.ini');
  assert.equal({}.polluted, undefined);
  assert.notEqual({}.polluted, 'polluted');
  // eslint-disable-next-line no-proto
  assert.equal(parser.values.__proto__.polluted, 'polluted');
})();

(() => {
  const parser = new iniReader.IniReader();
  parser.load('./ize-nowrite.ini');
  parser.setParam('__proto__.polluted', 'polluted');
  assert.equal({}.polluted, undefined);
  assert.notEqual({}.polluted, 'polluted');
  assert.equal(parser.getParam('__proto__.polluted'), 'polluted');
})();
