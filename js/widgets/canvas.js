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
  that.drawRect = function (rect, color, stroke) {
    var stroke = stroke || false;
    if (stroke) {
      that.ctx.strokeStyle = color;
      that.ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
    } else {
      that.ctx.fillStyle = color;
      that.ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
    }
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
  that.drawRects = function (rects, color, stroke) {
    that.ctx.fillStyle = color;
    for (let i = 0; i < rects.length; i++) {
      let rect = rects[i];
      that.drawRect(rect, color, stroke);
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
  //joint all rects into strips
  that.getRectsStrips = function (rects) {
    //stripe: {top, bottom, left, right}
    var stripes = [], stripeRects = [];
    for (let i = 0; i < rects.length; i++) {
      let rect = rects[i],
        createNewStripe = true;
      //find if rect is part of existing stripe
      for (let stripe of stripes) {
        if (rect.top >= stripe.top && rect.bottom <= stripe.bottom) {
          createNewStripe = false;
          if (stripe.left > rect.left) {
            stripe.left = rect.left;
          }
          if (stripe.right < rect.right) {
            stripe.right = rect.right;
          }
        }
      }
      if (createNewStripe) {
        stripes.push({
                'top': rect.top,
                'bottom': rect.bottom,
                'left': rect.left,
                'right': rect.right
              });
      }
    }
    for (let stripe of stripes) {
      stripeRects.push(that.createClientRect(stripe.left, stripe.top,
                                            stripe.right - stripe.left,
                                            stripe.bottom - stripe.top));
    }
    return stripeRects;
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
    if (rects.length === 0) {
      throw 'cannot create threeRectsSelection: no rects was passed';
    }
    var rects = that.getRectsStrips(rects),
      topRect = rects[0],
      bottomRect = rects[rects.length - 1],
      minX = 999999, maxX = 0,
      middleHeight = bottomRect.top - topRect.bottom,
      middleY = topRect.bottom,
      topSpace, topWidth, maxWidth;
    //browser is not very accurate about it so we need to check it
    if (middleHeight < 0) {
      middleHeight = 0;
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

    //one line selection
    if (rects.length === 1) {
      return [that.createClientRect(topRect.left, topRect.top, topWidth, topRect.height)];
    } else if (middleHeight === 0) {
      return [
              that.createClientRect(topRect.left, topRect.top, topWidth, topRect.height),
              that.createClientRect(minX, bottomRect.top, bottomRect.right - minX, bottomRect.height),
            ];
    } else {
      return [
              that.createClientRect(topRect.left, topRect.top, topWidth, topRect.height),
              that.createClientRect(minX, middleY, maxWidth, middleHeight),
              that.createClientRect(minX, bottomRect.top, bottomRect.right - minX, bottomRect.height),
            ];
    }
  };
  //draw two rects and a line that connects them
  //a, b are ClientRectLists
  that.drawConnection = function (left, right, color, stroke) {
    var color = color || '#c1f0c1',
      stroke = stroke || false,
      leftThreeRectSel = that.threeRectsSelection(left),
      rightTreeRectSel = that.threeRectsSelection(right);
    //check selections order
    if (leftThreeRectSel[0].left > rightTreeRectSel[0].left) {
      let t = leftThreeRectSel;
      leftThreeRectSel = rightTreeRectSel;
      rightTreeRectSel = t;
    }
    var getLeftJoinPoints = function () {
      if (leftThreeRectSel.length === 1) {
        let rect = leftThreeRectSel[0];
        return {
          'top': {'x': rect.right, 'y': rect.top},
          'bottom': {'x': rect.right, 'y': rect.bottom}
        };
      } else if (leftThreeRectSel.length === 2) {
        let topRect = leftThreeRectSel[0];
        return {
          'top': {'x': topRect.right, 'y': topRect.top},
          'bottom': {'x': topRect.right, 'y': topRect.bottom}
        };
      } else if (leftThreeRectSel.length === 3) {
        let topRect = leftThreeRectSel[0],
          middleRect = leftThreeRectSel[1];
        return {
          'top': {'x': topRect.right, 'y': topRect.top},
          'bottom': {'x': middleRect.right, 'y': middleRect.bottom}
        };
      }
    }, getRightJoinPoints = function () {
      if (rightTreeRectSel.length === 1) {
        let rect = rightTreeRectSel[0];
        return {
          'top': {'x': rect.left, 'y': rect.top},
          'bottom': {'x': rect.left, 'y': rect.bottom}
        };
      } else if (rightTreeRectSel.length === 2) {
        let bottomRect = rightTreeRectSel[1];
        return {
          'top': {'x': bottomRect.left, 'y': bottomRect.top},
          'bottom': {'x': bottomRect.left, 'y': bottomRect.bottom}
        };
      } else if (rightTreeRectSel.length === 3) {
        let bottomRect = rightTreeRectSel[2],
          middleRect = rightTreeRectSel[1];
        return {
          'top': {'x': middleRect.left, 'y': middleRect.top},
          'bottom': {'x': bottomRect.left, 'y': bottomRect.bottom}
        };
      }
    },
    //start in bottom right corner
    drawLeftContainer = function() {
      if (leftThreeRectSel.length === 1) {
        let rect = leftThreeRectSel[0];
        that.ctx.moveTo(rect.right, rect.bottom);
        that.ctx.lineTo(rect.left, rect.bottom);
        that.ctx.lineTo(rect.left, rect.top);
        that.ctx.lineTo(rect.right, rect.top);
      } else if (leftThreeRectSel.length === 2) {
        let topRect = leftThreeRectSel[0],
          bottomRect = leftThreeRectSel[1];

        that.ctx.moveTo(topRect.right, topRect.bottom);
        that.ctx.lineTo(bottomRect.right, topRect.bottom);
        that.ctx.lineTo(bottomRect.right, bottomRect.bottom);
        that.ctx.lineTo(bottomRect.left, bottomRect.bottom);
        that.ctx.lineTo(bottomRect.left, bottomRect.top);
        that.ctx.lineTo(topRect.left, bottomRect.top);
        that.ctx.lineTo(topRect.left, topRect.top);
        that.ctx.lineTo(topRect.right, topRect.top);

      } else if (leftThreeRectSel.length === 3) {
        let topRect = leftThreeRectSel[0],
          middleRect = leftThreeRectSel[1],
          bottomRect = leftThreeRectSel[2];

        that.ctx.moveTo(middleRect.right, middleRect.bottom);
        that.ctx.lineTo(bottomRect.right, middleRect.bottom);
        that.ctx.lineTo(bottomRect.right, bottomRect.bottom);
        that.ctx.lineTo(bottomRect.left, bottomRect.bottom);
        that.ctx.lineTo(middleRect.left, middleRect.top);
        that.ctx.lineTo(topRect.left, middleRect.top);
        that.ctx.lineTo(topRect.left, topRect.top);
        that.ctx.lineTo(topRect.right, topRect.top);
      }
    }, drawRightContainer = function() {
      //start from top left corner

      if (rightTreeRectSel.length === 1) {
        let rect = rightTreeRectSel[0];
        that.ctx.lineTo(rect.right, rect.top);
        that.ctx.lineTo(rect.right, rect.bottom);
        that.ctx.lineTo(rect.left, rect.bottom);

      } else if (rightTreeRectSel.length === 2) {
        let topRect = rightTreeRectSel[0],
          bottomRect = rightTreeRectSel[1];

        that.ctx.lineTo(topRect.left, topRect.bottom);
        that.ctx.lineTo(topRect.left, topRect.top);
        that.ctx.lineTo(topRect.right, topRect.top);
        that.ctx.lineTo(topRect.right, topRect.bottom);
        that.ctx.lineTo(bottomRect.right, topRect.bottom);
        that.ctx.lineTo(bottomRect.right, bottomRect.bottom);
        that.ctx.lineTo(bottomRect.left, bottomRect.bottom);

      } else if (rightTreeRectSel.length === 3) {
        let topRect = rightTreeRectSel[0],
          middleRect = rightTreeRectSel[1],
          bottomRect = rightTreeRectSel[2];

        that.ctx.lineTo(topRect.left, middleRect.top);
        that.ctx.lineTo(topRect.left, topRect.top);
        that.ctx.lineTo(topRect.right, topRect.top);
        that.ctx.lineTo(middleRect.right, middleRect.bottom);
        that.ctx.lineTo(bottomRect.right, middleRect.bottom);
        that.ctx.lineTo(bottomRect.right, bottomRect.bottom);
        that.ctx.lineTo(bottomRect.left, bottomRect.bottom);
      }
    };

    that.ctx.save();
    if (!stroke) {
      that.ctx.globalAlpha = 0.4;
      that.ctx.fillStyle = color;
    } else {
      //stroke connection should not contain interior lines
      that.ctx.strokeStyle = color;
      that.ctx.lineWidth = 3;
    }

    //draw connection between threeRectsSelections
    that.ctx.beginPath();
    let leftBound = getLeftJoinPoints(),
      rightBound = getRightJoinPoints();

    drawLeftContainer();
    that.ctx.lineTo(rightBound.top.x, rightBound.top.y);
    drawRightContainer();
    that.ctx.lineTo(leftBound.bottom.x, leftBound.bottom.y);

    if (stroke) {
      that.ctx.stroke();
    } else {
      that.ctx.fill();
    }

    that.ctx.restore();

  };

  //basic canvasRedraw behaviour
  $(document).on('canvasRedraw', function(event) {
    that.clearCanvas();
  });
  //canvas always appends and never replace parentContent
  //it's additional layer
  that.canvas = $('<canvas class="ilex-resize">').appendTo($parentWidget)
                .css('position', 'absolute')
                //prevent focus stealing
                .css('pointer-events', 'none')
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
