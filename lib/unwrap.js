'use strict';

module.exports = unwrap;

function unwrap(fulfill, reject, value) {
  var then = value && value.then;
  var valueType = typeof value;
  if ((valueType === 'function' || valueType === 'object') && typeof then === 'function') {
    then.call(value, fulfill, reject);
  } else {
    fulfill(value);
  }
}