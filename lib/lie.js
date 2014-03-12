'use strict';

var immediate = require('immediate');
var unwrap = require('./unwrap');
var trycatch = require('./trycatch');

var INTERNAL = function () {};

module.exports = Promise;

function Promise(resolver) {
  if (typeof resolver !== 'function') {
    throw new TypeError('resolver must be a function');
  }
  this.state = 'pending';
  this.value = undefined;
  this.queue = [];
  if (resolver !== INTERNAL) {
    this.resolveFromResolver(resolver);
  }
}

Promise.prototype.then = function (onSuccess, onError) {
  if (this.state === 'pending') {
    var promise = new Promise(INTERNAL);
    this.queue.push({
      promise: promise,
      onSuccess: onSuccess,
      onError: onError
    });
    return promise;
  } else if (this.state === 'fulfilled' && typeof onSuccess === 'function') {
    return this.resolve(onSuccess);
  } else if (this.state === 'rejected' && typeof onError === 'function') {
    return this.resolve(onError);
  } else {
    return this;
  }
};
function getThen(value) {
  return value && value.then;
}
Promise.prototype.resolve = function (func) {
  var self = this;
  var promise = new Promise(INTERNAL);
  immediate(function fulfillImmediate() {
    var thenResult = trycatch(func, self.value);
    if (thenResult.status === 'error') {
      return promise.reject(thenResult.value);
    }
    var value = thenResult.value;
    if (self === value) {
      return promise.reject(new TypeError('This isn\'t a klein promise'));
    }
    var valueType = typeof value;
    if (valueType === 'object' || valueType === 'function') {
      var thenValue = trycatch(getThen, value);
      if (thenValue.status === 'error') {
        return promise.reject(thenValue.value);
      }
      var then = thenValue.value;
      if (typeof then !== 'function') {
        
      }
    } else {
      return promise.fulfill(value);
    }
  });
  return promise;
};

Promise.prototype['catch'] = function (onError) {
  return this.then(null, onError);
};

Promise.prototype.fulfill = function (value) {
  if (this.state !== 'pending') {
    return;
  }
  this.state = 'fulfilled';
  this.value = value;
  this.transition();
};
Promise.prototype.reject = function (reason) {
  if (this.state !== 'pending') {
    return;
  }
  this.state = 'rejected';
  this.value = reason;
  this.transition();
};