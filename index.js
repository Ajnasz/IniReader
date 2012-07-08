/*jslint node: true, sloppy: true, es5: true */
// regular expressions to clear, validate and get the values
/*jslint regexp: true */
/**
 * Regular expression to find lines which shouldn't be parsed
 * @property skipLineRex
 * @final
 * @private
 */
var skipLineRex = /^\s*(\n|\#|;)/,
    /**
     * Regular expression to remove white space chars from the beginning and end of
     * a line
     * @property chompRex
     * @final
     * @private
     */
    chompRex = /(?:\n|\r)$/,
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
    keyValueRex = /^\s*([^=]*\w)\s*=\s*(.*)\s*$/,
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
    interPolationRexG = /%\(.*?\)/g,
    /**
     * @property interPolationRex
     * @final
     * @private
     */
    interPolationRex = /%\((.*?)\)/;

/*jslint regexp: false*/

/**
 * Reads a file and returns it's lines as an array
 * @method getLines
 * @param {String} file File name to load and parse
 * @param {Function} cb Callback function to call when parse finished
 * @param {Boolean} async Use synchronous or asynchronous file operations
 * @private
 * @return {Array} Lines of the file
 */
var getLines = function (file, cb, async) {
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
                throw err;
            }
            cb(splitLines(data));
        });
    } else {
        data = fs.readFileSync(file);
        return splitLines(data);
    }
};

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
var fixQuoted = function (str) {
    if (
        (str[0] === '"' && str[str.length - 1] === '"') ||
            (str[0] === "'" && str[str.length - 1] === "'")
    ) {
        return str.substr(1, str.length - 2);
    }
    return str;
};

/**
 * @method inheritDefault
 * @param {Object} block
 * @param {Ojbect} [dflt]
 * @return {Object}
 */
var inheritDefault = function (block, dflt) {
    var inheritDefault, key;
    dflt = typeof dflt === 'object' ? dflt : {};

    if (typeof block === 'object') {
        Object.keys(dflt).forEach(function inheritKey(key) {
            if (!(block.hasOwnProperty(key))) {
                block[key] = dflt[key];
            }
        });
    }

    return block;
};

/**
 * Return a deep copy of the object
 * @method deepCopy
 * @param {Object} sourceObj The object which should be copied
 * @param {Object} [destinationObj] The destination object which should have
 * the new properties after copy
 * @return {Object} Object with the new parameters
 * @private
 */
var deepCopy = function (sourceObj, destinationObj) {
    var out = destinationObj || {}, key;
    Object.keys(sourceObj).forEach(function (key) {
        if (typeof sourceObj[key] === 'object') {
            out[key] = (sourceObj[key].constructor === Array ? [] : {});
            deepCopy(sourceObj[key], out[key]);
        } else {
            out[key] = sourceObj[key];
        }
    });

    return out;
};

/**
 * Parses a .ini file and convert's it's content to a JS object
 * Parser regexps are from the Config::Simple Perl module
 * @class IniReader
 * @extends EventEmitter
 * @constructor
 */
function IniReader(cfg, async) {
    // backward compatibility
    // in first versions the first argument was the file name and the second was
    // the async flag
    if (typeof cfg === 'string') {
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
    this.inheritDefault = !!cfg.inheritDefault;
}
require('util').inherits(IniReader, require('events').EventEmitter);
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
 * @property inheritDefault
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
 * Loads a ini file
 * @method load
 * @param String file
 **/
IniReader.prototype.load = IniReader.prototype.init = function load(file) {
    if (typeof file === 'string') {
        this.file = file;
    }
    if (!this.file) {
        this.emit('error', new Error('No file name given'));
    }
    try {
        if (this.async) {
            getLines(this.file, function parseLines(lines) {
                this.lines = lines;
                this.values = this.parseFile();
                this.emit('fileParse');
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
IniReader.prototype.parseSectionHead = function parseSectionHead(line) {
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
IniReader.prototype.keyValueMatch = function keyValMatch(line) {
    var kvMatch = line.match(keyValueRex);
    return kvMatch ? {key: kvMatch[1], value: kvMatch[2]} : false;
};

/**
  * Parses an init file, and extracts blocks with keys and values
  * @method parseFile
  * @return {Object} The configuration tree
  */
IniReader.prototype.parseFile = function parseFile() {

    var output, lines, groupName, keyVal, line, currentSection, lineNumber;

    output = {};
    lines = this.lines;

    lineNumber = 0;

    while (lines.length) {
        line = lines.shift();

        lineNumber += 1;
        // skip comments and empty lines
        if (!skipLineRex.test(line) && nonWhitespaceRex.test(line)) {
            line = line.replace(chompRex, '');
            line = line.trim();

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
                        output[currentSection][keyVal.key] = fixQuoted(keyVal.value);
                    } else {
                        // outside of a section
                        this.emit('error', new SyntaxError("Syntax error in line " + lineNumber));
                    }
                } else {
                    // keyVal not found and not commented so something is wrong
                    this.emit('error', new SyntaxError("Syntax error in line " + lineNumber));
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
IniReader.prototype.getBlock = function getBlock(block) {
    return this.param(block);
};
/**
  * @method getValue
  * @param String block The name of the block where the key should be defined
  * @param String key The name of the key which value should be returned
  * @return {String | Number | Object | Null | Boolean | Undefiend} the value of the key
  * @deprecated
  */
IniReader.prototype.getValue = function getValue(block, key) {
    var param = block;
    if (typeof key !== 'undefined') {
        param += '.' + key;
    }
    return this.getParam(param);
};

/**
 * Some kind of inheritance
 * @method setDefaultValue
 * @param {{String | Number | Object | Null | Boolean} currentValue
 * @param {Boolean} block
 * @param {String} key
 * @return {Object}
 */
IniReader.prototype.setDefaultValue = function setDefaultValue(currentValue, block, key) {
    var defaultValues = this.values.DEFAULT,
        output = currentValue,
        sBlock;
    if (typeof defaultValues !== 'undefined') {
        if (block) {
            if (key) {
                output = typeof currentValue === 'undefined' ? defaultValues[key] : currentValue;
            } else {
                output = inheritDefault(currentValue, defaultValues);
            }
        } else {
            Object.keys(currentValue).forEach(function (sBlock) {
                if (sBlock !== 'DEFAULT') {
                    output[sBlock] = inheritDefault(currentValue[sBlock], defaultValues);
                }
            });
        }
    }
    return output;
};

/**
 * @method getParam
 * @return {String | Number | Object | Null | Boolean | Undefiend} The property
 * value
 * @param String param The name of the block where the key should be defined
 */
IniReader.prototype.getParam = function getParam(param) {
    var output = this.values,
        block,
        key;

    if (param) {
        param = param.split('.');
        block = param[0];
        key = param[1];

        if (block) {
            output = output[block];

            if (key) {
                output = output[key];
            }
        }
    }

    if (this.inheritDefault && this.values.hasOwnProperty('DEFAULT')) {
        output = this.setDefaultValue(output, block, key);
    }

    return output;
};
/**
 * Sets the parameter in the loaded configuration object.
 * @method setParam
 * @param {String} prop The name of the property which should be set
 * @param {String | Number | Object | Null | Boolean} value The new value of the property
 */
IniReader.prototype.setParam = function setParam(prop, value) {
    if (typeof this.values !== 'object') {
        this.values = {};
    }
    var propKeys = prop.split('.'),
        propKeysLen = propKeys.length,
        ref = this.values;
    if (propKeysLen > 0) {
        propKeys.forEach(function propKeyParser(key, index) {
            if (!ref[key]) {
                ref[key] = {};
            }
            if (index < propKeysLen - 1) {
                ref = ref[key];
            } else {
                ref[key] = value;
            }
        }, this);
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
IniReader.prototype.param = function param(prop, value) {
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
IniReader.prototype.getLe = function getLe(le) {
    return typeof le === 'string' && (le === '\n' || le === '\r\n' || le === '\r') ? le : '\n';
};

/**
 * Converts the currently loaded configuration to a INI file.
 * @method serialize
 * @param {String} [le] Predefined line ending character
 * @return {String} Currently loaded configuration as a INI file content which
 * could be written directly into a file
 */
IniReader.prototype.serialize = function serialize(le) {
    var output = '',
        ws = /\s+/,
        values = this.values,
        group;

    le = this.getLe(le);

    Object.keys(values).forEach(function serializeGroup(group) {
        output += le + '[' + group + ']' + le;
        var groupValues = values[group];

        Object.keys(groupValues).forEach(function serializeKey(key) {
            var value = groupValues[key];
            if (ws.test(value)) {
                if (value.indexOf('"') > -1) {
                    value = "'" + value + "'";
                } else {
                    value = '"' + value + '"';
                }
            }
            output += key + '=' + value + le;
        }, this);
    }, this);

    return output;
};

/**
 * Write ini file to the disk
 * @method write
 * @param {String} [file] File name
 * @param {String} [le] Line ending string
 */
IniReader.prototype.write = function (file, le) {
    if (!file) {
        file = this.file;
    }

    // get last line
    le = this.getLe(le);

    var now = new Date(),
      // create a headline
        output = '; IniReader' + le + '; ' + now.getFullYear() + '-' +
            (now.getMonth() + 1) + '-' + now.getDate() + le,
        ws = /\s+/,
        fs = require('fs'),
        group,
        item,
        value;

    output += this.serialize(le);

    if (this.async) {
        fs.writeFile(file, output, function writeFile(err) {
            if (err) {
                this.emit('error', err);
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
IniReader.prototype.interpolate = function (param) {
    var output = this.getParam(param),
        self = this,
        block,
        key,
        refParams,
        refParam,
        references,
        sBlock,
        sKey;

    if (typeof output !== 'undefined') {
        if (typeof output === 'object') {
            output = deepCopy(output);
        }
        if (param) {
            param = param.split('.');
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

exports.IniReader = IniReader;
