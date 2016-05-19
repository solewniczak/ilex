'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.text !== undefined)
  throw 'ilex.widgetsCollection.horizontalSplit already defined';

$(document).on('windowResize', 'canvas', function (e) {
    var $canvas = $(this),
      width = $canvas.parent().data('ilex-width'),
      height = $canvas.parent().data('ilex-height');
    $canvas.attr('width', width).attr('height', height);
});

ilex.canvas = {};
ilex.canvas.clear = function () {
  var ctx = ilex.canvas.element.getContext('2d');
};

ilex.canvas.drawRect = function (x, y, w, h, color) {
  var ctx = ilex.canvas.element.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(x,y,w,h);
};
