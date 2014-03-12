'use strict';

module.exports = trycatch;

function trycatch(func, value) {
  var args = [], i = 0;
  if (arguments.length > 1) {
    while (++i < arguments.length) {
      args[i - 1] = arguments[i];
    }
  }
  var out = {};
  try {
    if (args.length === 0) {
      out.value = func();
    } else if (args.length === 1) {
      out.value = func(value);
    } else {
      out.value = func.apply(undefined, args);
    }
    out.status = 'success';
  } catch (e) {
    out.value = e;
    out.status = 'error';
  }
}