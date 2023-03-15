const fs = require('fs');
// regular expressions to clear, validate and get the values
/* jslint regexp: true */
/**
 * Regular expression to find lines which shouldn't be parsed
 * @property skipLineRex
 * @final
 * @private
 */
const util = require('./util');

const skipLineRex = /^\s*(\n|#|;)/;
/**
     * Regular expression to find non whitespace characters
     * @property nonWhitespaceRex
     * @final
     * @private
     */
const nonWhitespaceRex = /\S/;
/**
     * Regular expression to find key/value pairs in a line
     * @property keyValueRex
     * @final
     * @private
     */
const keyValueRex = /^\s*([^=]+)\s*=\s*(.*)\s*$/;
/**
     * Regular expression to find group entry marker in an ini file
     * @property groupRex
     * @final
     * @private
     */
const groupRex = /^\s*\[\s*([^\]]+)\s*\]$/;
/**
     * @property interPolationRexG
     * @final
     * @private
     */
const interPolationRexG = /%\([^)]*\)/g;
/**
     * @property interPolationRex
     * @final
     * @private
     */
const interPolationRex = /%\(([^)]*)\)/;

/* jslint regexp: false */

function getObjKey(obj, key) {
  return key.split('.').reduce((o, k) => {
    if (o && typeof o[k] !== 'undefined') {
      return o[k];
    }

    return undefined;
  }, obj);
}
function splitLines(d) {
  const data = d.toString();
  let lines;
  if (data.indexOf('\r\n') > -1) {
    lines = data.split('\r\n');
  } else if (data.indexOf('\n') > -1) {
    lines = data.split('\n');
  } else if (data.indexOf('\r') > -1) {
    lines = data.split('\r');
  } else { // mostly it's only one line
    lines = [data];
  }
  return lines.filter((line) => line !== '');
}
/**
 * Reads a file and returns it's lines as an array
 * @method getLines
 * @param {String} file File name to load and parse
 * @param {Function} cb Callback function to call when parse finished
 * @param {Boolean} isAsync Use synchronous or asynchronous file operations
 * @private
 * @return {Array} Lines of the file
 */
function getLines(file, cb, isAsync) {
  if (isAsync) {
    fs.readFile(file, (err, data) => {
      if (err) {
        cb(err, null);
      } else {
        cb(null, splitLines(data));
      }
    });

    return undefined;
  }
  const data = fs.readFileSync(file);
  return splitLines(data);
}

function unquoteValue(value, type) {
  if (type === '"') {
    return value.replace(/\\"/g, '"');
  }
  return value.replace(/\\'/g, '\'');
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
  const doubleQuoted = (str[0] === '"' && str[str.length - 1] === '"');
  const singleQuoted = (str[0] === '\'' && str[str.length - 1] === '\'');
  let output;

  if (doubleQuoted || singleQuoted) {
    output = str.slice(1, -1);

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
  const ws = /^\s+|\s+$/;

  if (ws.test(value) || /^['"]|['"]$/.test(value)) {
    if (/'/.test(value)) {
      if (/"/.test(value)) {
        // escape
        const val = value.split('').reduce((str, cur, index, array) => {
          if (cur === '"' && array[index - 1] !== '\\') {
            return `${str}\\"`;
          }

          return str + cur;
        }, '');
        return `"${val}"`;
      }

      return `"${value}"`;
    } if (/"/.test(value)) {
      return `'${value}'`;
    }
    return `"${value}"`;
  }
  return value;
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
  const out = destinationObj || Object.create(null);
  Object.keys(sourceObj).forEach((key) => {
    if (typeof sourceObj[key] === 'object') {
      out[key] = (util.isArray(sourceObj[key]) ? [] : Object.create(null));
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
 * @param {Boolean} [isAsync] (Deprecated) Use the cfg.async instead.
 */
function IniReaderCore(cfg, isAsync) {
  this.construct(cfg, isAsync);
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
 * Callback type `HeaderCallback`.
 * @callback HeaderCallback
 * @this IniReaderCore
 * @param {String} [le] The line ending.
 * @returns {String}
 */
/**
 * Error event emitted every time an error occurred
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
 * string too, which was the file name to parse, but that behavior is
 * deprecated)
 *     @param {Boolean} [cfg.async] If true, it will use asynchronous calls to
 *     read and write files
 *     @param {String} [cfg.file] The file name to read or write during
 *     operations
 *     @param {HeaderCallback} [cfg.header] A function returning a header
 *     string prepended to the output. Defaults to writing the current date as a
 *     comment. Can be used to write anything, so handle with care.
 *     @param {Boolean} [cfg.multiValue] Allow to have multi value if the key
 *     occurs more than once
 * @param {Boolean} [isAsync] (Deprecated) Use the cfg.async instead.
 * @constructor
 */
IniReaderCore.prototype.construct = function construct(conf, isAsync) {
  // backward compatibility
  // in first versions the first argument was the file name and the second
  // was the async flag
  let cfg = conf;
  if (typeof cfg === 'string') {
    cfg.multiValue = false;
    cfg = {
      file: cfg,
    };
    if (isAsync === 'boolean') {
      cfg.async = isAsync;
    }
  }
  cfg = cfg || Object.create(null);
  this.async = !!cfg.async;
  this.file = cfg.file || null;
  this.header = cfg.header || function header(le) {
    const now = new Date();
    return (
      `; IniReader${le
      }; ${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}${this.getLe(le)}`
    );
  };
  this.multiValue = cfg.multiValue || false;
  this.hooks = cfg.hooks || null;
};
/**
 * Loads a ini file
 * @method load
 * @param String file
 * */
IniReaderCore.prototype.load = function load(file) {
  if (typeof file === 'string') {
    this.file = file;
  }
  if (!this.file) {
    this.emit('error', new Error('No file name given'));
    return;
  }
  try {
    if (this.async) {
      getLines(this.file, (err, lines) => {
        if (err) {
          this.emit('error', err);
        } else {
          this.lines = lines;
          this.values = this.parseFile();
          this.emit('fileParse');
        }
      }, true);
    } else {
      this.lines = getLines(this.file);
      this.values = this.parseFile();
      this.emit('fileParse');
    }
  } catch (e) {
    this.emit('error', e);
  }
};
IniReaderCore.prototype.init = IniReaderCore.prototype.load;

/**
  * Tries to find a group name in a line
  * @method parseSectionHead
  * @type {String|False}
  * @return {String | False} the group name if found or false
  */
IniReaderCore.prototype.parseSectionHead = function parseSectionHead(line) {
  const groupMatch = line.match(groupRex);
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
  const kvMatch = line.match(keyValueRex);

  return kvMatch ? { key: kvMatch[1].trim(), value: kvMatch[2].trim() } : false;
};

/**
  * Parses an init file, and extracts blocks with keys and values
  * @method parseFile
  * @return {Object} The configuration tree
  */
IniReaderCore.prototype.parseFile = function parseFile() {
  const output = Object.create(null);
  const lines = this.lines.concat([]);

  let lineNumber = 0;

  let currentValue;
  let currentSection;
  while (lines.length) {
    const line = lines.shift().trim();

    lineNumber += 1;
    // skip comments and empty lines
    if (!skipLineRex.test(line) && nonWhitespaceRex.test(line)) {
      // block name
      const groupName = this.parseSectionHead(line);
      if (groupName) {
        currentSection = groupName;
        if (!output[currentSection]) {
          output[currentSection] = Object.create(null);
        }
      } else {
        // key/value pairs
        const keyVal = this.keyValueMatch(line);

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
            this.emit('error', new SyntaxError(`INI Syntax error in line ${lineNumber}`));
            return undefined;
          }
        } else {
          // keyVal not found and not commented so something is wrong
          this.emit('error', new SyntaxError(`INI Syntax error in line ${lineNumber}`));
          return undefined;
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
 * @return {String | Number | Object | Null | Boolean | undefiend} The property
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
  * @return {String | Number | Object | Null | Boolean | undefiend} the value of the key
  * @deprecated
  */
IniReaderCore.prototype.getValue = function getValue(block, key) {
  let param = block;
  if (typeof key !== 'undefined') {
    param += `.${key}`;
  }
  return this.getParam(param);
};

function findValidBlock(param, values) {
  if (values[param]) {
    return param;
  }

  const paramArr = param.split('.');
  let pl = paramArr.length;

  // if searching only for the block or param is empty
  if (pl < 2) {
    return param;
  }

  while (pl > 0) {
    const blockName = paramArr.slice(0, pl).join('.');

    if (values[blockName]) {
      return blockName;
    }
    pl -= 1;
  }

  return undefined;
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
  let output = this.values;

  if (param) {
    const p = (util.isArray(param)) ? param.join('.') : param;

    const block = findValidBlock(p, output);

    if (!block) {
      return undefined;
    }

    const key = p.slice(block.length + 1);

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

function getBlockAndKey(prop, values) {
  let block;
  let key;
  let propArr;

  if (util.isArray(prop)) {
    [block, key] = prop;
  } else {
    block = findValidBlock(prop, values);

    if (!block) {
      propArr = prop.split('.');
      key = propArr.pop();
      block = propArr.join('.');
    } else {
      key = prop.slice(block.length + 1);
    }
  }

  return [block, key];
}

/**
 * Sets the parameter in the loaded configuration object.
 * @method setParam
 * @param {String | Array} prop The name of the property which should be set
 * @param {String | Number | Object | Null | Boolean} value The new value of the property
 */
IniReaderCore.prototype.setParam = function setParam(prop, value) {
  if (typeof this.values !== 'object') {
    this.values = Object.create(null);
  }

  const blockAndKey = getBlockAndKey(prop, this.values);
  const block = blockAndKey[0];
  const key = blockAndKey[1];

  if (!this.values[block]) {
    this.values[block] = Object.create(null);
  }

  if (Object.prototype.toString.call(value) === '[object Object]') {
    deepCopy(value, this.values[block]);
  } else {
    this.values[block][key] = value;
  }
};

/*
 * Removes parameter from the loded configuration object
 * @param {String | Array} prop The name of the property which should be removed
 */
IniReaderCore.prototype.removeParam = function removeParam(prop) {
  if (typeof this.values !== 'object') {
    this.values = Object.create(null);
  }
  const blockAndKey = getBlockAndKey(prop, this.values);
  const block = blockAndKey[0];
  const key = blockAndKey[1];

  if (!key) {
    delete this.values[block];
    return;
  }

  delete this.values[block][key];
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
  let output;
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
IniReaderCore.prototype.serialize = function serialize(lineEnd) {
  const { values } = this;
  const { multiValue } = this;

  const le = this.getLe(lineEnd);

  return Object.keys(values).reduce((out, group) => {
    const output = `${out}${le}[${group}]${le}`;
    const groupValues = values[group];

    return Object.keys(groupValues).reduce((groupValuesOutput, key) => {
      const keyValue = groupValues[key];
      let iterate;

      if (multiValue && util.isArray(keyValue)) {
        iterate = keyValue;
      } else {
        iterate = [keyValue];
      }

      return groupValuesOutput + iterate.map((value) => [key, quoteValue(value)]).map((kv) => {
        const hook = getObjKey(this.hooks, 'write.keyValue');

        if (hook) {
          return hook.call(this, kv, group);
        }
        return kv;
      }).map((kv) => kv.join('=')).join(le) + le;
    }, output);
  }, '');
};

/**
 * Write ini file to the disk
 * @method write
 * @param {String} [file] File name
 * @param {String} [le] Line ending string
 */
IniReaderCore.prototype.write = function write(f, lineEnd) {
  let output = '';

  // get file path
  const file = f || this.file;

  // get line ending
  const le = this.getLe(lineEnd);

  // prepend a header, if configured
  if (typeof this.header === 'function') {
    output += this.header.call(this, le);
  }

  // build data content
  output += this.serialize(le);

  // write
  if (this.async) {
    fs.writeFile(file, output, (err) => {
      if (err) {
        this.emit('error', err);
        return;
      }
      this.emit('fileWritten', file);
    });
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
IniReaderCore.prototype.interpolate = function interpolate(parameters) {
  let param = parameters;
  let output = this.getParam(param);
  const self = this;
  let block;
  let key;
  let refParams;
  let refParam;
  let references;

  if (typeof output !== 'undefined') {
    if (typeof output === 'object') {
      output = deepCopy(output);
    }

    if (param) {
      if (!util.isArray(param)) {
        param = param.split('.');
      }
      [block, key] = param;
    }

    // no argument given
    if (typeof block === 'undefined') {
      Object.keys(output).forEach((sBlock) => {
        Object.keys(output[sBlock]).forEach((sKey) => {
          output[sBlock][sKey] = self.interpolate(`${sBlock}.${sKey}`);
        });
      });
      // argument is block or block.key
      //
      // argument is block
    } else if (typeof key === 'undefined') {
      Object.keys(output).forEach((sKey) => {
        output[sKey] = self.interpolate(`${block}.${sKey}`);
      });
      // argument is block.key
    } else if (typeof output === 'string') {
      references = output.match(interPolationRexG);
      if (references) {
        references.forEach((reference) => {
          const refKey = reference.replace(interPolationRex, '$1');
          refParams = refKey.split('.');
          // interpolation in current block
          if (refParams.length < 2) {
            refParam = `${block}.${refParams[0]}`;
          } else {
            refParam = refKey;
          }
          output = output.replace(reference, self.interpolate(refParam));
        });
      }
    }
  }
  return output;
};

exports.IniReaderCore = IniReaderCore;

// vim: expandtab:sw=4:ts=4
