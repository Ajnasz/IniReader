/*jslint node: true, sloppy: true, es5: true */
var IniReaderCore = require('./inireadercore').IniReaderCore;
/**
 * @property interPolationRexG
 * @final
 * @private
 */
var interPolationRexG = /%\(.*?\)/g,
    /**
     * @property interPolationRex
     * @final
     * @private
     */
    interPolationRex = /%\((.*?)\)/;

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
function inheritDefault(block, dflt) {
    var key;
    dflt = typeof dflt === 'object' ? dflt : {};

    if (typeof block === 'object') {
        Object.keys(dflt).forEach(function inheritKey(key) {
            if (!(block.hasOwnProperty(key))) {
                block[key] = dflt[key];
            }
        });
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
    var defaultValues = this.values.DEFAULT,
        output = current,
        sBlock;
    if (typeof defaultValues !== 'undefined') {
        if (block) {
            if (key) {
                output = typeof current === 'undefined' ? defaultValues[key] : current;
            } else {
                output = inheritDefault(current, defaultValues);
            }
        } else {
            Object.keys(current).forEach(function (sBlock) {
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
IniReaderInheritDefault.prototype.getParam = function getParam(param) {
    var block, key, output;

    output = IniReaderInheritDefault.super_.prototype.getParam.call(this, param);
    if (this.values.hasOwnProperty('DEFAULT')) {

        if (param) {
            param = param.split('.');

            block = param[0];
            key = param[1];
        }
        output = this.setDefaultValue(output, block, key);
    }
    return output;
};
exports.IniReaderInheritDefault = IniReaderInheritDefault;
