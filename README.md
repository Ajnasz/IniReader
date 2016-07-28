IniReader is a small module for nodejs. You can parse .ini configuration files with it.

## The constructor ##
### Arguments ###

The constructor accepts configuration parameters as an object:

* async: (Optional), Boolean, default: false, Set to true if you wan't to use asynchron calls to read and/or write configuration files
* file: (Optional), String, default: empty, You can set the configuration file name here
* inheritDefault: (Optional), String, default: false, If this option is true and your configuration has a section with a name `DEFAULT` the other sections will inherit it's values if they are not defined.
* multiValue: (Optional), Boolean, default: false, If true, keys which occures more then once will be collected into array. If false, overwrites them
* hooks: (Optional), object, default: null. With hooks, you can call your own function to change thekey or value before writing it to the disk. Supported hooks are write.keyValue:
``
`config.hooks = {keyValue: function (keyValue, group) {
	var key = keyValue[0],
		value = keyValue[1];
	if (group === 'someGroup' && key === 'changethis') {
		 keyValue[1] = changeValue(value);
	}

	return keyValue;
}}
```

It will process the value with the `changeValue` function of `changethis` key under the `someGroup` group.
Make sure you return the keyValue after processing.


## Methods ##


### load ###
Loads and parses the configuration file.

#### Arguments: ####
* file: (Optional), String, Name of the configuration file to read. If you didn't set the file name in the constructor, you must do it here.


### write ###
Writes out the configuration into a file

#### Arguments: ####
* file: (Optional), String, Name of the configuration file to write. If you didn't set the file name in the constructor, you must do it here.
* le: (Optional), String, default: '\n', Line ending. Possible values are: '\n', '\r\n', '\r'


### param ###
Method to get or set a configuration value, or a section or the whole configuration as an object

#### Arguments: ####
* prop: (Optional), String, Array, The name of the property or block. If the argument is empty, it will return the whole configuration object. To retreive a block, give the name of the block. `iniReaderInstance.param('blockname')`. To retreive a property value, give the name of the block and the property name concatenated with a dot `blockname.propertyname` or as array `["blockname", "propertyname"]`
* value: (Optional), String,Number,Object, The value of the parameter. Pass an object to add several properties to a section

When the `prop` name contains period, it will try to find the best matching block and key by the following rules:
Always the most specific block name will win:

file:

```
[foo.bar.baz]
qux=quux in block

[foo]
bar.baz.qux=quux in key
```

`iniReaderInstance.param('foo.bar.baz');` will return `quux in block`.

For manual access use the  `iniReaderInstance.values` property: `iniReaderInstance.values['foo']['bar.baz.qux']`;

When you set a value and the block name contains period, it will create the most specific block and the least specific key:

`iniReaderInstance.param('foo.bar.baz.qux', 'quux')` will create the following structure:

```
[foo.bar.baz]
qux=quux
```

You can override this behaviour by setting the property manually:

```
iniReaderInstance.values['foo'] = {
	'bar.baz.qux': 'quux'
};
```

### interpolate ###

#### _Arguments_ ####
* _prop_: (Optional), String, The name of the property or block.

#### _Description_ ####
Same as the method _param_ with the argument _prop_ but this method
extends recursively all the patterns _%(xxx)_ by the value which would
be returned by _param(xxx)_. The patterns can be _%(blockname.key)_ or _%(key)_,
assuming that _key_ refers to the current block.

For example, if the file _.ini_ is
```
 [sectionA]
 a=foo
 b=%(a)/bar
 [sectionB]
 c=%(sectionA.b)/baz
```
_interpolate_ called with the parameter _'sectionA.b'_ will return
_foo/bar_ and, with the parameter _'sectionB.c'_, it will return
_foo/bar/baz_.

## Basic usage ##

```javascript
// include
var iniReader = require('./inireader');
// initialize
var parser = new iniReader.IniReader();
parser.load('./myconf.ini');
// get the config tree
parser.getBlock();
// get only a sub section
parser.param('blockname');
// get a config value. The blockname is mandantory
parser.param('blockname.key');
// add or update (if exists) config
// if the block doesn't exists it will be created;
parser.param('blockname.key', 'foo');
parser.param(['blockname', 'otherKey'], 'bar');
// update the config
parser.write();
// create a new config
parser.write('myotherconf.ini');
```

## Using callbacks ##

```javascript
var iniReader = require('./inireader');
// initialize
var parser = new iniReader.IniReader();
parser.on('fileParse', function() {
  // get the config tree
  this.getBlock();
  // get only a sub section
  this.param('blockname');
  // get a config value. The blockname is mandantory
  this.param('blockname.key');
  // add or update (if exists) config
  // if the block doesn't exists it will be created;
  parser.param('blockname.key', 'foobar');
  // update the config
  parser.write();
  // create a new config
  parser.write('myotherconf.ini');
});
parser.load('./myconf.ini');
```

## Using async file reading ##

```javascript
var iniReader = require('./inireader');
// initialize
var parser = new iniReader.IniReader({async: true});
parser.on('fileParse', function() {
  // get the config tree
  this.getBlock();
  // get only a sub section
  this.param('blockname');
  // get a config value. The blockname is mandantory
  this.param('blockname.key');
  // add or update (if exists) config
  // if the block doesn't exists it will be created;
  parser.param('blockname.key', 'foobar');
  // update the config
  parser.write();
  // create a new config
  parser.write('myotherconf.ini');
});
parser.load('./myconf.ini');
```


## Using hooks ##

var iniReader = require('./inireader');
// initialize
var parser = new iniReader.IniReader({
	async: false,
	hooks: {
		write: function (keyValue, group) {
			if (group === 'uppercase') {
				keyValue[1] = keyValue[1].toUpperCase();
			}

			return keyValue;
		}
	}
});
