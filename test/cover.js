var promise = require('../lib/lie');
//based off rsvp's adapter
exports.deferred = function () {
  var pending = {};
  pending.promise = new promise(function(resolve, reject) {
    pending.resolve = resolve;
    pending.reject = reject;
  });
  

  return pending;
};
