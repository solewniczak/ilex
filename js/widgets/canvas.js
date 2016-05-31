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
  //used for debbuging purposes
  that.drawRectsStep = function (rects, color) {
    var colors = ['#ff0000', '#0066ff', '#99ffcc', '#660066', '#003366',
                  '#ffff00', '#ccccff', '#990099', '#ffcc00'];
    var i = 0;
    setInterval(function() {
      let rect = rects[i];
      that.ctx.fillStyle = colors[i];
      that.ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
      i++;
    }, 1000);
  }
  //rects is Array of ClientRect or ClientRectsList
  that.drawRects = function (rects, color) {
    that.ctx.fillStyle = color;
    for (let i = 0; i < rects.length; i++) {
      let rect = rects[i];
      that.ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
    }
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
  //The middle rect has a width of the the widest rect in the list.
  //Top and the bottom ones may be shorter if the selection starts or ends in
  //the middle of a line.

  //returns {rects: [array of three rects], leftBound: {x, y, height},
  //                                        rightBound: {x, y, height}}
  //leftBound and rightBound are used by ray drawing algorithm.
  that.threeRectsSelection = function (rects) {
    var topRect = rects[0],
      bottomRect = rects[rects.length - 1],
      minX = 999999, maxX = 0,
      middleHeight = bottomRect.top - topRect.bottom,
      middleY = topRect.bottom,
      topSpace, topWidth, maxWidth;
    //browser is not very accurate about it so we need to check it
    if (middleHeight < 0) {
      middleHeight = 0;
    }
    //one line selection
    if (rects.length == 1) {
      middleY = topRect.top;
    }
    for (let i = 0; i < rects.length; i++) {
      let rect = rects[i];
      if (rect.left < minX) {
        minX = rect.left;
      }
      if (rect.right > maxX) {
        maxX = rect.right;
      }
    }
    maxWidth = maxX - minX;

    topSpace = topRect.left - minX;
    topWidth = maxWidth - topSpace;

    return {'rects': [
            that.createClientRect(topRect.left, topRect.top, topWidth, topRect.height),
            that.createClientRect(minX, middleY, maxWidth, middleHeight),
            that.createClientRect(minX, bottomRect.top, bottomRect.right - minX, bottomRect.height),
          ],
          'leftBound': {'x': minX,
                        'y': middleY,
                        'height': middleHeight + bottomRect.height
                      },
          'rightBound': {'x': maxX,
                         'y': topRect.top,
                         'height': middleHeight + topRect.height
                       }
        };
  };
  //draw two rects and a line that connects them
  //a, b are ClientRectLists
  that.drawConnection = function (a, b, color) {
    var color = color || '#c1f0c1',
      margin = 0,
      leftThreeRectSel = that.threeRectsSelection(a),
      rightTreeRectSel = that.threeRectsSelection(b);

    that.drawRects(leftThreeRectSel.rects, color);
    that.drawRects(rightTreeRectSel.rects, color);

    //draw connection between threeRectsSelections
    that.ctx.beginPath();
    that.ctx.moveTo(leftThreeRectSel.rightBound.x, leftThreeRectSel.rightBound.y);
    that.ctx.lineTo(leftThreeRectSel.rightBound.x + margin, leftThreeRectSel.rightBound.y);
    that.ctx.lineTo(rightTreeRectSel.leftBound.x - margin, rightTreeRectSel.leftBound.y);
    that.ctx.lineTo(rightTreeRectSel.leftBound.x, rightTreeRectSel.leftBound.y);
    that.ctx.lineTo(rightTreeRectSel.leftBound.x, rightTreeRectSel.leftBound.y +
                                                  rightTreeRectSel.leftBound.height);
    that.ctx.lineTo(rightTreeRectSel.leftBound.x - margin, rightTreeRectSel.leftBound.y +
                                                  rightTreeRectSel.leftBound.height);
    that.ctx.lineTo(leftThreeRectSel.rightBound.x + margin, leftThreeRectSel.rightBound.y +
                                                  leftThreeRectSel.rightBound.height);
    that.ctx.lineTo(leftThreeRectSel.rightBound.x, leftThreeRectSel.rightBound.y +
                                                  leftThreeRectSel.rightBound.height);
    that.ctx.fill();

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
    $(this).attr('width', $(window).width()).attr('height', $(window).height());
    $(document).trigger('canvasRedraw');
  });
  return that;
};
