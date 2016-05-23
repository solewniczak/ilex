'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.canvas !== undefined)
  throw 'ilex.widgetsCollection.cavas already defined';

ilex.widgetsCollection.canvas = function ($parentWidget, zIndex) {
  var that = {},
    zIndex = zIndex || 2;

  that.clearRect = function (x, y, w, h) {
    that.ctx.clearRect(x,y,w,h);
  };
  that.drawRect = function (x, y, w, h, color) {
    that.ctx.fillStyle = color;
    that.ctx.fillRect(x,y,w,h);
  };
  //canvas always appends and never replace parentContent
  //it's additional layer
  that.canvas = $('<canvas class="ilex-resize">').appendTo($parentWidget)
                .css('position', 'absolute')
                .css('top', 0).css('left', 0)
                .css('z-index', zIndex)
                .attr('width', $(window).width())
                .attr('height', $(window).height());
  that.ctx = that.canvas[0].getContext('2d');

  that.canvas.on('windowResize',function(that) {
    return function(event) {
      var width = that.canvas.parent().data('ilex-width'),
        height = that.canvas.parent().data('ilex-height');
      that.canvas.attr('width', width).attr('height', height);
    };
  });
  return that;
};
