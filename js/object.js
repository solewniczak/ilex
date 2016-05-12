"use strict";

Function.prototype.method = function (name, func) {
  this.prototype[name] = func;
  return this;
};

Function.method('curry', function () {
  var slice = Array.prototype.slice,
    args = slice.apply(arguments),
    that = this;
  return function () {
    return that.apply(null, args.concat(slice.apply(arguments)));
    };
});

if (typeof Object.beget !== 'function') {
  Object.beget = function (o) {
    var F = function () {};
    F.prototype = o;
    return new F();
  }
}
