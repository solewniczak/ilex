"use strict";

Function.prototype.method = function (name, func) {
  if (this.prototype[name]) {
    throw {
      name: 'MethodExists',
      message: 'method: ' + name + ' already exists'
    };
  }
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
