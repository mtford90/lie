'use strict';

var immediate = require('immediate');
var handlers = require('./handlers');
module.exports = unwrap;

function unwrap(promise, func, value) {
  immediate(function() {
    var returnValue;
    try {
      returnValue = func(value);
    } catch (e) {
      var handler = handlers.reject(promise, e);
      if (!handler.queue.length) {
        // Ensure that errors are not completely swallowed.
        console.error(e);
        console.error('Unhandled error in promise chain', {error: e, func: func, value: value});
      }
      return handler;
    }
    if (returnValue === promise) {
      handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
    } else {
      handlers.resolve(promise, returnValue);
    }
  });
}