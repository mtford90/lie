'use strict';
var resolveThenable = require('./resolveThenable');
var states = require('./states');

exports.resolve = resolver;
function resolver(self, value) {
  var thenable, then;
  try {
    then = value && value.then;
    if (value && typeof value === 'object' && typeof then === 'function') {
      thenable = function thenable() {
        then.apply(value, arguments);
      };
    }
  } catch (e) {
    return rejector(self, e);
  }

  if (thenable) {
    resolveThenable.safely(self, thenable);
  } else {
    self.state = states.FULFILLED;
    self.outcome = value;
    var i = -1;
    var len = self.length;
    while (++i < len) {
      self[i].callFulfilled(value);
      self[i] = void 0;
    }
  }
  return self;
}
exports.reject = rejector;

function rejector(self, error) {
  self.state = states.REJECTED;
  self.outcome = error;
  var i = -1;
  var len = self.length;
  while (++i < len) {
    self[i].callRejected(error);
  }
  return self;
}