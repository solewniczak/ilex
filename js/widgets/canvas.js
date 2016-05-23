'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.canvas !== undefined)
  throw 'ilex.widgetsCollection.cavas already defined';

ilex.widgetsCollection.canvas = function ($parentWidget) {
  var that = {};
  
  that.clear = function () {
    var ctx = that.canvas.getContext('2d');
  };
  that.drawRect = function (x, y, w, h, color) {
    var ctx = that.canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(x,y,w,h);
  };
  that.canvas = $('<canvas class="ilex-resize">').appendTo($parentWidget)
                .css('position', 'absolute')
                .attr('width', $(window).width())
                .attr('height', $(window).height());

  that.canvas.on('windowResize',function(that) {
    return function(event) {
      var width = that.canvas.parent().data('ilex-width'),
        height = that.canvas.parent().data('ilex-height');
      that.canvas.attr('width', width).attr('height', height);
    };
  });
  return that;
};
