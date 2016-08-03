/*jslint node: true, sloppy: true */
// regular expressions to clear, validate and get the values
/*jslint regexp: true */
/**
 * Regular expression to find lines which shouldn't be parsed
 * @property skipLineRex
 * @final
 * @private
 */
var util = require('./util');
var skipLineRex = /^\s*(\n|\#|;)/,
    /**
     * Regular expression to find non whitespace characters
     * @property nonWhitespaceRex
     * @final
     * @private
     */
    nonWhitespaceRex = /\S/,
    /**
     * Regular expression to find key/value pairs in a line
     * @property keyValueRex
     * @final
     * @private
     */
    keyValueRex = /^\s*([^=]+)\s*=\s*(.*)\s*$/,
    /**
     * Regular expression to find group entry marker in an ini file
     * @property groupRex
     * @final
     * @private
     */
    groupRex = /^\s*\[\s*([^\]]+)\s*\]$/,
    /**
     * @property interPolationRexG
     * @final
     * @private
     */
    interPolationRexG = /%\([^)]*\)/g,
    /**
     * @property interPolationRex
     * @final
     * @private
     */
    interPolationRex = /%\(([^)]*)\)/;

/*jslint regexp: false*/

function getObjKey(obj, key) {
    return key.split('.').reduce(function (obj, key) {
        if (obj && typeof obj[key] !== 'undefined') {
            return obj[key];
        }

        return;
    }, obj);
}

/**
 * Reads a file and returns it's lines as an array
 * @method getLines
 * @param {String} file File name to load and parse
 * @param {Function} cb Callback function to call when parse finished
 * @param {Boolean} async Use synchronous or asynchronous file operations
 * @private
 * @return {Array} Lines of the file
 */
function getLines(file, cb, async) {
    var fs = require('fs'), splitLines, data;
    splitLines = function (data) {
        data = data.toString();
        var lines;
        if (data.indexOf('\r\n') > -1) {
            lines = data.split('\r\n');
        } else if (data.indexOf('\n') > -1) {
            lines = data.split('\n');
        } else if (data.indexOf('\r') > -1) {
            lines = data.split('\r');
        } else { // mostly it's only one line
            lines = [data];
        }
        return lines.filter(function emptyLineFilter(line) {
            return line !== '';
        });
    };
    if (async) {
        fs.readFile(file, function fileReadCb(err, data) {
            if (err) {
                cb(err, null);
            } else {
                cb(null, splitLines(data));
            }
        });
    } else {
        data = fs.readFileSync(file);
        return splitLines(data);
    }
}

function unquoteValue(value, type) {
    if (type === '"') {
        return value.replace(/\\"/g, '"');
    } else {
        return value.replace(/\\'/g, '\'');
    }
}

/**
 * If a string is inside quotes, the quotes will be removed It doesn't care
 * about escaped/not escaped strings. So you can have thing like this:
 * "lorem ipsum" dolor sit"
 * and you will receive:
 * lorem ipsum" dolor sit
 * @method fixQuoted
 * @param {String} str
 * @return {String} String without starting and closing quotes
 * @private
 */
function fixQuoted(str) {
    var doubleQuoted = (str[0] === '"' && str[str.length - 1] === '"'),
        singleQuoted = (str[0] === '\'' && str[str.length - 1] === '\''),
        output;

    if (doubleQuoted || singleQuoted) {
        output = str.substr(1, str.length - 2);

        if (doubleQuoted) {
            output = unquoteValue(output, '"');
        } else {
            output = unquoteValue(output, "'");
        }
    } else {
        output = str;
    }

    return output;
}

function quoteValue(value) {
    var ws = /^\s+|\s+$/;

    if (ws.test(value) || /^['"]|['"]$/.test(value)) {
        if (/'/.test(value)) {
            if (/"/.test(value)) {
                // escape
                value = value.split('').reduce(function (str, cur, index, array) {
                    if (cur === '"' && array[index - 1] !== '\\') {
                        return str + '\\"';
                    }

                    return str + cur;
                }, '');
            }

            return '"' + value + '"';
        } else if (/"/.test(value)) {
            return '\'' + value + '\'';
        } else {
            return '"' + value + '"';
        }
    } else {
        return value;
    }
}

/**
 * Return a deep copy of the object
 * @method deepCopy
 * @param {Object} sourceObj The object which should be copied
 * @param {Object} [destinationObj] The destination object which should have
 * the new properties after copy
 * @return {Object} Object with the new parameters
 * @private
 */
function deepCopy(sourceObj, destinationObj) {
    var out = destinationObj || {};
    Object.keys(sourceObj).forEach(function (key) {
        if (typeof sourceObj[key] === 'object') {
            out[key] = (util.isArray(sourceObj[key]) ? [] : {});
            deepCopy(sourceObj[key], out[key]);
        } else {
            out[key] = sourceObj[key];
        }
    });

    return out;
}

/**
 * Parses a .ini file and convert's it's content to a JS object
 * Parser regexps are from the Config::Simple Perl module
 * @class IniReaderCore
 * @constructor
 * @module IniReader
 * @main IniReader
 * @extends EventEmitter
 * @param {Object} [cfg] Configuration object. (In older versions it could be a
 * string too, which was the file name to parse, but that behaviour is
 * deprectaed)
 *     @param {Boolean} [cfg.async] If true, it will use asynchronous calls to
 *     read and write files
 *     @param {String} [cfg.file] The file name to read or write during
 *     operations
 * @param {Boolean} [async] (Deprecated) Use the cfg.async instead.
 */
function IniReaderCore(cfg, async) {
    this.construct(cfg, async);
}
require('util').inherits(IniReaderCore, require('events').EventEmitter);
/**
 * Name of the file.
 * Doing a load method and without specifying it's name directly that property
 * will be used.
 * Doing a write method and without specifying it's name directly that property
 * will be used.
 * @property file
 * @type {String}
 * @default null
 */
/**
 * If true all file operation will be done asynchronously
 * @property async
 * @type {Boolean}
 * @default false
 */
/**
 * Error event emitted every time an error occured
 * @event error
 */
/**
 * Event emitted when a file parse finished
 * @event fileParse
 */
/**
 * Event emitted when the configuration has been written to a file
 * @event fileWritten
 */
/**
 * Initializes the configuration properties
 * @method construct
 * @param {Object} [cfg] Configuration object. (In older versions it could be a
 * string too, which was the file name to parse, but that behaviour is
 * deprectaed)
 *     @param {Boolean} [cfg.async] If true, it will use asynchronous calls to
 *     read and write files
 *     @param {String} [cfg.file] The file name to read or write during
 *     operations
 *     @param {Boolean} [cfg.multiValue] Allow to have multi value if the key
 *     occures more than once
 * @param {Boolean} [async] (Deprecated) Use the cfg.async instead.
 * @constructor
 */
IniReaderCore.prototype.construct = function (cfg, async) {
    // backward compatibility
    // in first versions the first argument was the file name and the second was
    // the async flag
    if (typeof cfg === 'string') {
        cfg.multiValue = false;
        cfg = {
            file: cfg
        };
        if (async === 'boolean') {
            cfg.async = async;
        }
    }
    cfg = cfg || {};
    this.async = !!cfg.async;
    this.file = cfg.file || null;
    this.multiValue = cfg.multiValue || false;
    this.hooks = cfg.hooks || null;
};
/**
 * Loads a ini file
 * @method load
 * @param String file
 **/
IniReaderCore.prototype.load = IniReaderCore.prototype.init = function load(file) {
    if (typeof file === 'string') {
        this.file = file;
    }
    if (!this.file) {
        this.emit('error', new Error('No file name given'));
        return;
    }
    try {
        if (this.async) {
            getLines(this.file, function parseLines(err, lines) {
                if (err) {
                    this.emit('error', err);
                } else {
                    this.lines = lines;
                    this.values = this.parseFile();
                    this.emit('fileParse');
                }
            }.bind(this), true);
        } else {
            this.lines = getLines(this.file);
            this.values = this.parseFile();
            this.emit('fileParse');
        }
    } catch (e) {
        this.emit('error', e);
    }
};

/**
  * Tries to find a group name in a line
  * @method parseSectionHead
  * @type {String|False}
  * @return {String | False} the group name if found or false
  */
IniReaderCore.prototype.parseSectionHead = function parseSectionHead(line) {
    var groupMatch = line.match(groupRex);
    return groupMatch ? groupMatch[1] : false;
};

/**
  * Tries to find a key/value pair in a line
  * @method keyValueMatch
  * @type {Object|False}
  * @return {Object | False} the key value pair in an object ({key: 'key',
  * value;'value'}) if found or false
  */
IniReaderCore.prototype.keyValueMatch = function keyValMatch(line) {
    var kvMatch = line.match(keyValueRex);

    return kvMatch ? {key: kvMatch[1].trim(), value: kvMatch[2].trim()} : false;
};

/**
  * Parses an init file, and extracts blocks with keys and values
  * @method parseFile
  * @return {Object} The configuration tree
  */
IniReaderCore.prototype.parseFile = function parseFile() {

    var output, lines, groupName, keyVal, line, currentSection, lineNumber, currentValue;

    output = {};
    lines = this.lines;

    lineNumber = 0;

    while (lines.length) {
        line = lines.shift().trim();

        lineNumber += 1;
        // skip comments and empty lines
        if (!skipLineRex.test(line) && nonWhitespaceRex.test(line)) {

            // block name
            groupName = this.parseSectionHead(line);
            if (groupName) {
                currentSection = groupName;
                if (!output[currentSection]) {
                    output[currentSection] = {};
                }
            } else {
                // key/value pairs
                keyVal = this.keyValueMatch(line);

                if (keyVal) {
                    if (currentSection) {
                        currentValue = output[currentSection][keyVal.key];

                        if (typeof currentValue !== 'undefined' && this.multiValue) {
                            if (util.isArray(currentValue)) {
                                currentValue.push(fixQuoted(keyVal.value));
                            } else {
                                output[currentSection][keyVal.key] = [currentValue, fixQuoted(keyVal.value)];
                            }
                        } else {
                            output[currentSection][keyVal.key] = fixQuoted(keyVal.value);
                        }
                    } else {
                        // outside of a section
                        this.emit('error', new SyntaxError("INI Syntax error in line " + lineNumber));
                    }
                } else {
                    // keyVal not found and not commented so something is wrong
                    this.emit('error', new SyntaxError("INI Syntax error in line " + lineNumber));
                }
            }
        }

    }

    return output;
};
/**
 * Method to get a one property value or a ini block or all of the block of
 * the loaded configuration
 * @method getBlock
 * @return {String | Number | Object | Null | Boolean | Undefiend} The property
 * value
 * @type Object
 * @deprecated
 */
IniReaderCore.prototype.getBlock = function getBlock(block) {
    return this.param(block);
};
/**
  * @method getValue
  * @param String block The name of the block where the key should be defined
  * @param String key The name of the key which value should be returned
  * @return {String | Number | Object | Null | Boolean | Undefiend} the value of the key
  * @deprecated
  */
IniReaderCore.prototype.getValue = function getValue(block, key) {
    var param = block;
    if (typeof key !== 'undefined') {
        param += '.' + key;
    }
    return this.getParam(param);
};

function findValidBlock(param, values) {
    var paramArr, pl, blockName;

    if (values[param]) {
        return param;
    }

    paramArr = param.split('.');
    pl = paramArr.length;

    // if searching only for the block or param is empty
    if (pl < 2) {
        return param;
    }

    while (pl--) {
        blockName = paramArr.slice(0, pl).join('.');

        if (values[blockName]) {
            return blockName;
        }
    }

}

/**
 * Method to get the configuration tree or a configuration block a specific
 * value in a block.
 * @method getParam
 * @param {String} [param] The name of the block where the key should be
 * defined. You can get the whole configuration tree by not setting this
 * argument.
 * You can get a configuration block by passing its name: getParam('fooblock').
 * You can get a specific property by passing its block name with the property
 * name. They should be concatenated with a ".":
 * getParam('fooblock.barproperty').
 * @return {String | Number | Object | Null | Boolean | Undefiend} The property
 * value
 */
IniReaderCore.prototype.getParam = function getParam(param) {
    var output = this.values,
        block,
        key, undef;

    if (param) {

        if (util.isArray(param)) {
            param = param.join('.');
        }

        block = findValidBlock(param, output);

        if (!block) {
            return undef;
        }

        key = param.slice(block.length + 1);

        if (block) {
            if (key) {
                output = output[block][key];
            } else {
                output = output[block];
            }
        }
    }

    return output;
};
/**
 * Sets the parameter in the loaded configuration object.
 * @method setParam
 * @param {String | Array} prop The name of the property which should be set
 * @param {String | Number | Object | Null | Boolean} value The new value of the property
 */
IniReaderCore.prototype.setParam = function setParam(prop, value) {
    if (typeof this.values !== 'object') {
        this.values = {};
    }

    var block, key, propArr;

    if (util.isArray(prop)) {
        block = prop[0];
        key = prop[1];
    } else {
        block = findValidBlock(prop, this.values);

        if (!block) {
            propArr = prop.split('.');
            key = propArr.pop();
            block = propArr.join('.');
        } else {
            key = prop.slice(block.length + 1);
        }
    }

    if (!this.values[block]) {
        this.values[block] = {};
    }

    if (Object.prototype.toString.call(value) === '[object Object]') {
        deepCopy(value, this.values[block]);
    } else {
        this.values[block][key] = value;
    }
};
/**
 * Setter and getter method. If only the first parameter defined it will return
 * the value of the parameter. If the second parameter set, it will set the
 * parameter in the loaded configuration object.
 * @method param
 * @param {String} prop The name of the property which should be returned or
 * which should be set
 * @param {String | Number | Object | Null | Boolean} value The new value of the property
 * @return {String | Number | Object | Null | Boolean | Undefiend} The property
 * value if the method was called with one argument or undefined if it was
 * called with two arguments
 */
IniReaderCore.prototype.param = function param(prop, value) {
    var output;
    if (typeof value === 'undefined') {
        output = this.getParam(prop);
    } else {
        output = this.setParam(prop, value);
    }
    return output;
};

/**
 * @method getLe
 * @param {String} [le] Predefined line ending character. Only "\n", "\r" and
 * "\r\n" are valid values!
 * @return {String} The line ending character or characters. Default is "\n"
 */
IniReaderCore.prototype.getLe = function getLe(le) {
    return typeof le === 'string' && (le === '\n' || le === '\r\n' || le === '\r') ? le : '\n';
};

/**
 * Converts the currently loaded configuration to a INI file.
 * @method serialize
 * @param {String} [le] Predefined line ending character
 * @return {String} Currently loaded configuration as a INI file content which
 * could be written directly into a file
 */
IniReaderCore.prototype.serialize = function serialize(le) {
    var output = '',
        values = this.values,
        multiValue = this.multiValue;

    le = this.getLe(le);

    return Object.keys(values).reduce(function serializeGroup(output, group) {
        output += le + '[' + group + ']' + le;
        var groupValues = values[group];

        return Object.keys(groupValues).reduce(function serializeKey(output, key) {
            var keyValue = groupValues[key],
                iterate;

            if (multiValue && util.isArray(keyValue)) {
                iterate = keyValue;
            } else {
                iterate = [keyValue];
            }

            output += iterate.map(function (value) {
                return [key, quoteValue(value)];
            }).map(function (keyValue) {
                var hook = getObjKey(this.hooks, 'write.keyValue');

                if (hook) {
                    return hook.call(this, keyValue, group);
                } else {
                    return keyValue;
                }
            }.bind(this)).map(function (keyValue) {
                return keyValue.join('=');
            }).join(le);

            return output + le;
        }.bind(this), output);
    }.bind(this), output);
};

/**
 * Write ini file to the disk
 * @method write
 * @param {String} [file] File name
 * @param {String} [le] Line ending string
 */
IniReaderCore.prototype.write = function (file, le) {
    if (!file) {
        file = this.file;
    }

    // get last line
    le = this.getLe(le);

    var now = new Date(),
      // create a headline
        output = '; IniReader' + le + '; ' + now.getFullYear() + '-' +
            (now.getMonth() + 1) + '-' + now.getDate() + le,
        fs = require('fs');

    output += this.serialize(le);

    if (this.async) {
        fs.writeFile(file, output, function writeFile(err) {
            if (err) {
                this.emit('error', err);
                return;
            }
            this.emit('fileWritten', file);
        }.bind(this));
    } else {
        fs.writeFileSync(file, output);
        this.emit('fileWritten', file);
    }
};

/**
 * @method interpolate
 * @param {String} param
 * @return {Object}
 */
IniReaderCore.prototype.interpolate = function (param) {
    var output = this.getParam(param),
        self = this,
        block,
        key,
        refParams,
        refParam,
        references;

    if (typeof output !== 'undefined') {

        if (typeof output === 'object') {
            output = deepCopy(output);
        }

        if (param) {
            if (!util.isArray(param)) {
                param = param.split('.');
            }
            block = param[0];
            key = param[1];
        }

        // no argument given
        if (typeof block === 'undefined') {
            Object.keys(output).forEach(function (sBlock) {
                Object.keys(output[sBlock]).forEach(function (sKey) {
                    output[sBlock][sKey] = self.interpolate(sBlock + '.' + sKey);
                });
            });
        // argument is block or block.key
        } else {
            // argument is block
            if (typeof key === 'undefined') {
                Object.keys(output).forEach(function (sKey) {
                    output[sKey] = self.interpolate(block + '.' + sKey);
                });
            // argument is block.key
            } else {
                if (typeof output === 'string') {
                    references = output.match(interPolationRexG);
                    if (references) {
                        references.forEach(function (reference) {
                            var refKey = reference.replace(interPolationRex, '$1');
                            refParams = refKey.split('.');
                            // interpolation in current block
                            if (refParams.length < 2) {
                                refParam = block + '.' + refParams[0];
                            } else {
                                refParam = refKey;
                            }
                            output = output.replace(reference, self.interpolate(refParam));
                        });
                    }
                }
            }
        }
    }
    return output;
};

exports.IniReaderCore = IniReaderCore;

// vim: expandtab:sw=4:ts=4
