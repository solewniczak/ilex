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

  that.clearCanvas = function () {
    that.ctx.clearRect(0, 0, $(window).width(), $(window).height());
  };
  //rect is ClientRects
  that.clearRect = function (rect) {
    that.ctx.clearRect(rect.left, rect.top, rect.width, rect.height);
  };
  that.drawRect = function (rect, color) {
    that.ctx.fillStyle = color;
    that.ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
  };
  //https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIDOMClientRect
  that.createClientRect = function (x, y, w, h) {
    return {
      left: x,
      top: y,
      right: x + w,
      bottom: y + h,
      width: w,
      height: h
    };
  };
  //http://stackoverflow.com/questions/2752349/fast-rectangle-to-rectangle-intersection
  //a, b are ClientRects
  that.hasIntersectRect = function (a, b) {
    return (a.left <= b.right &&
             b.left <= a.right &&
             a.top <= b.bottom &&
             b.top <= a.bottom);
  };

  //a, b are ClientRects
  that.intersectionRect = function (a, b) {
    var rect = {};
    if (a.left < b.left) {
      rect.left = b.left;
    } else {
      rect.left = a.left;
    }
    if (a.top < b.top) {
      rect.top = b.top;
    } else {
      rect.top = a.top;
    }
    if (a.right > b.right) {
      rect.right = b.right;
    } else {
      rect.right = a.right;
    }
    if (a.bottom > b.bottom) {
      rect.bottom = b.bottom;
    } else {
      rect.bottom = a.bottom;
    }
    rect.width = rect.right - rect.left;
    rect.height = rect.bottom - rect.top;
    return rect;
  };
  //takes clipping region and ClientRectList
  //returns new ClientRectList clipped to the region
  that.clipClientRectList = function (clipRect, rects) {
    var rects = rects || [],
      hasIntersection = function (rect) {
        return that.hasIntersectRect(clipRect, rect);
      },
      intersection = function (rect) {
        return that.intersectionRect(clipRect, rect);
      },
      newClientRectsList = [];
      for (let i = 0; i < rects.length; i++) {
        let rect = rects[i];
        if (hasIntersection(rect))
          newClientRectsList.push(intersection(rect));
      }
      return newClientRectsList;
  };
  //threeRectsSelection is special data structure that transforms normal browser
  //text selection (build from many rects) into selection build from three rects:
  //the top, the middle and the bottom one. The top and the bottom cover only
  //one line of text. The middle may covers many lines.
  //The middle rect the width of the the widest rect in the list.
  //Top and the bottom ones may be shorter if the selection starts or ends in
  //the middle of a line.

  //returns {rects: [array of three rects], leftBound: {x, y, width},
  //                                        rightBound: {x, y, width}}
  //leftBound and rightBound are used by ray drawing algorithm.
  that.threeRectsSelection = function (rects) {

  };
  //draw two rects and line that connects them
  that.drawConnection = function (a, b) {
    var color = "#c1f0c1";
    that.drawRect(a, color);
    that.drawRect(b, color);
  };

  //basic canvasRedraw behaviour
  $(document).on('canvasRedraw', function(event) {
    that.clearCanvas();
  });
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
