/*jslint node: true, es5: true */
/**
 * Parses a .ini file and convert's it's content to a JS object Parser regexps
 * are from the Config::Simple Perl module.
 * @module IniReader
 */
/**
 * Constructs either a {{#crossLink "IniReaderCore"}}{{/crossLink}} or a
 * {{#crossLink "IniReaderInheritDefault"}}{{/crossLink}} class depends
 * on the inheritDefault configuration property.
 * @class IniReader
 * @constructor
 * @param {Object} cfg
 *     @param {Boolean} [cfg.inheritDefault] If true it will construct a
 *     IniReaderInheritDefault class, if false a IniReaderCore
 *     @param {Boolean} [cfg.async] If true, it will use asynchronous calls to
 *     read and write files
 *     @param {String} [cfg.file] The file name to read or write during
 *     operations
 */
function IniReader(cfg) {
    var IniReaderMod;
    cfg = cfg || {};
    if (!!cfg.inheritDefault) {
        IniReaderMod = require('./lib/inireaderinheritdefault').IniReaderInheritDefault;
    } else {
        IniReaderMod = require('./lib/inireadercore').IniReaderCore;
    }

    return new IniReaderMod(cfg);
}

exports.IniReader = IniReader;
