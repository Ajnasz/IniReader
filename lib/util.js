exports.isFunc = function isFunc(arg) {
    return typeof arg === 'function';
};

exports.isArray = function isArray(arg) {
    if (Array.isArray) {
        return Array.isArray(arg);
    } else {
        return Object.prototype.toString.call(arg) === '[object Array]';
    }
};

// vim: expandtab:sw=4:ts=4
