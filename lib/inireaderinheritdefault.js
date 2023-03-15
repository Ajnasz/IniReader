/* jslint node: true, sloppy: true, es5: true */
const { IniReaderCore } = require('./inireadercore');
const util = require('./util');
/**
 * @property inheritDefault
 * @type {Boolean}
 * @value true
 * @final
 */

/**
 * @method inheritDefault
 * @param {Object} block
 * @param {Ojbect} [dflt]
 * @return {Object}
 */
function inheritDefault(block, df) {
  const obj = typeof df === 'object' ? df : {};

  if (typeof block === 'object') {
    return Object.entries(obj).reduce((output, [key, value]) => {
      if (!(key in block)) {
        return Object.assign(output, { [key]: value });
      }

      return output;
    }, { ...block });
  }

  return block;
}
/**
 * Extends the functionality of the IniReaderCore class. It makes possible for a
 * ini file object to inherit default values from another object. Similar to
 * Python ConfigParser class http://docs.python.org/library/configparser.html
 * @class IniReaderInheritDefault
 * @constructor
 * @extends IniReaderCore
 * @param {Object} [cfg] Configuration object. (In older versions it could be a
 * string too, which was the file name to parse, but that behaviour is
 * deprectaed)
 *     @param {Boolean} [cfg.async] If true, it will use asynchronous calls to
 *     read and write files
 *     @param {String} [cfg.file] The file name to read or write during
 *     operations
 */
function IniReaderInheritDefault(cfg, async) {
  this.construct(cfg, async);
  this.inheritDefault = true;
}
require('util').inherits(IniReaderInheritDefault, IniReaderCore);
/**
 * Some kind of inheritance
 * @method setDefaultValue
 * @param {{String | Number | Object | Null | Boolean} current
 * @param {Boolean} block
 * @param {String} key
 * @return {Object}
 */
IniReaderInheritDefault.prototype.setDefaultValue = function setDefaultValue(current, block, key) {
  const defaultValues = this.values.DEFAULT;
  let output = current;
  if (typeof defaultValues !== 'undefined') {
    if (block) {
      if (key) {
        output = typeof current === 'undefined' ? defaultValues[key] : current;
      } else {
        output = inheritDefault(current, defaultValues);
      }
    } else {
      Object.keys(current).forEach((sBlock) => {
        if (sBlock !== 'DEFAULT') {
          output[sBlock] = inheritDefault(current[sBlock], defaultValues);
        }
      });
    }
  }
  return output;
};
/**
 * @method getParam
 * @param {String} [param] The name of the block where the key should be
 * defined. You can get the whole configuration tree by not setting this
 * argument.
 * You can get a configuration block by passing its name: getParam('fooblock').
 * You can get a specific property by passing its block name with the property
 * name. They should be concatenated with a ".":
 * getParam('fooblock.barproperty').
 * If values object has a DEFAULT property it will extend the output with it.
 * @return {String | Number | Object | Null | Boolean | Undefiend} The property
 * value
 */
IniReaderInheritDefault.prototype.getParam = function getParam(paramPath) {
  let block;
  let key;

  let param = paramPath;
  // eslint-disable-next-line no-underscore-dangle
  const output = IniReaderInheritDefault.super_.prototype.getParam.call(this, param);
  if ('DEFAULT' in this.values) {
    if (param) {
      if (!util.isArray(param)) {
        param = param.split('.');
      }

      [block, key] = param;
    }
    return this.setDefaultValue(output, block, key);
  }
  return output;
};
exports.IniReaderInheritDefault = IniReaderInheritDefault;

// vim: expandtab:sw=4:ts=4
