var promise = require('../lib/lie');
var promisesAplusTests = require("promises-aplus-tests");
var adapter = {};
//based off rsvp's adapter
adapter.deferred = function () {
  var pending = {};
  pending.promise = new promise(function(resolve, reject) {
    pending.resolve = resolve;
    pending.reject = reject;
  });
  

  return pending;
};


promisesAplusTests(adapter, { reporter: "nyan", bail: true}, function () {
	console.log('done');
	process.exit();
});
