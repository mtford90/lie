'use strict';

var immediate = require('immediate');
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
  var promise;
  if (this.state === 'pending') {
    promise = new Promise(INTERNAL);
    this.queue.push({
      promise: promise,
      onSuccess: onSuccess,
      onError: onError
    });
    return promise;
  } else if (this.state === 'fulfilled' && typeof onSuccess === 'function') {
    promise = new Promise(INTERNAL);
    resolve(this.value, promise, onSuccess);
    return promise;
  } else if (this.state === 'rejected' && typeof onError === 'function') {
    promise = new Promise(INTERNAL);
    resolve(this.value, promise, onError);
    return promise;
  } else {
    return this;
  }
};
function getThen(value) {
  return value && value.then;
}
function resolve(resolvedValue, promise, func) {
  immediate(function fulfillImmediate() {
    var thenResult = trycatch(func, resolvedValue);
    if (thenResult.status === 'error') {
      return promise.reject(thenResult.value);
    }
    var value = thenResult.value;
    if (promise === value) {
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
        return promise.fulfill(value);
      }
      var called = 0;
      var lastResult = trycatch(function callThen() {
        then.call(value, function successHandler(success) {
          if (called++) {
            return;
          }
          promise.fulfill(success);
        }, function rejectionHandler(reason) {
          if (called++) {
            return;
          }
          promise.reject(reason);
        });
      });
      if (!called && lastResult.status === 'error') {
        called++;
        return promise.reject(lastResult.value);
      }
    } else {
      return promise.fulfill(value);
    }
  });
}

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

Promise.prototype.transition = function () {
  var i = -1;
  var len = this.queue.length;
  var func;
  while (++i < len) {
    if (this.state === 'fulfilled') {
      func = this.queue[i].onSuccess;
    } else if (this.state === 'rejected') {
      func = this.queue[i].onError;
    }
    if (typeof func === 'function') {
      resolve(this.value, this.queue[i].promise, func);
    } else {
      if (this.state === 'fulfilled') {
        this.queue[i].promise.fulfill(this.value);
      } else if (this.state === 'rejected') {
        this.queue[i].promise.reject(this.value);
      }
    }
  }
};

Promise.prototype.resolveFromResolver = function (resolver) {
  var self = this;
  var called = 0;
  var result = trycatch(function callResolver() {
    resolver(function successResolver(success) {
      if (called++) {
        return;
      }
      self.fulfill(success);
    }, function rejectionResolver(reason) {
      if (called++) {
        return;
      }
      self.reject(reason);
    });
  });
  if (!called && result.status === 'error') {
    called++;
    return result.reject(result.value);
  }
};