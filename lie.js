var immediate = require('immediate');
// Creates a deferred: an object with a promise and corresponding resolve/reject methods
function Promise(resolver) {
     if (!(this instanceof Promise)) {
        return new Promise(resolver);
    }
    var successQueue = [];
    var failureQueue = [];
    var resolved = false;
    function pending(onFulfilled, onRejected){
        return Promise(function(resolver,rejecter){
                successQueue.push({
                    callback:onFulfilled,
                    resolver:resolver,
                    rejecter:rejecter
                });
                failureQueue.push({
                    callback:onRejected,
                    resolver:resolver,
                    rejecter:rejecter
                });
        });
    }
    function then(onFulfilled, onRejected) {
        return resolved?resolved(onFulfilled, onRejected):pending(onFulfilled, onRejected);
    }
    this.then = then;
    function resolve(success, value){
        resolved = function(onFulfilled, onRejected) {
            var callback = success ? onFulfilled : onRejected;
            if (typeof callback !== 'function') {
                return {then:then};
            }
            return Promise(function(resolve,reject){
                immediate(execute,callback,value,resolve,reject);
           });
        };
        var queue = success ? successQueue : failureQueue;
        var queued;
        for (var i = 0, l = queue.length; i < l; i++) {
            queued = queue[i];
            if (queued.callback) {
                immediate(execute,queued.callback, value, queued.resolver, queued.rejecter);
            }else if(success){
                queued.resolver(value);
            }else{
                queued.rejecter(value);
            }
        }
        
    }
    function yes(value) {
        if (!resolved) {
            resolve(true, value);
        }
    }
    function no (reason) {
        if (!resolved) {
            resolve(false, reason);
        }
    }
    try{
        resolver(function(a){
            if(a && typeof a.then==='function'){
                a.then(yes,no);
            }else{
                yes(a);
            }
        },no);
    }catch(e){
        no(e);
    }

// Executes the callback with the specified value,
// resolving or rejecting the deferred
    function execute(callback, value, resolve, reject) {
            try {
                var result = callback(value);
                if (result && typeof result.then === 'function') {
                    result.then(resolve, reject);
                }
                else {
                    resolve(result);
                }
            }
            catch (error) {
                reject(error);
            }
    }
}

module.exports = Promise;
