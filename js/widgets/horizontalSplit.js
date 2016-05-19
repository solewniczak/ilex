'use strict';

//requires: ilex.widgetsCollection.handlerSize
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.handlerSize === undefined)
  throw 'ilex.widgetsCollection.handlerSize undefined';
if (ilex.widgetsCollection.horizontalSplit !== undefined)
  throw 'ilex.widgetsCollection.horizontalSplit already defined';

ilex.widgetsCollection.horizontalSplit = function ($parentWidget, position) {
  var that = {},
    position = position || [0.5, 0.5],
    makeResizeCallback = function(that) {
      return function(event) {
        var width = that.table.parent().data('ilex-width'),
          height = that.table.parent().data('ilex-height'),
          innerWidth = width - ilex.widgetsCollection.handlerSize;

        that.table.data('ilex-width', width).data('ilex-height', height);
        that.table.children().data('ilex-height', height);
        that.left.data('ilex-width', innerWidth * that.position[0]);
        that.right.data('ilex-width', innerWidth * that.position[1]);
      };
    },
    makeHandlerMousedownCallback = function(that) {
      return function(event) {
        var startX = event.pageX,
          leftWidth = that.left.data('ilex-width'),
          rightWidth = that.right.data('ilex-width'),
          innerWidth =  leftWidth + rightWidth;
        $('body').css('cursor', 'ew-resize');
        //prevent selectin while resizing
        $(document).on('selectstart', function(event) {
          event.preventDefault();
        });
        $(document).on('mouseup', function () {
          $(document).off('mouseup');
          $(document).off('mousemove');
          $(document).off('selectstart');
          $('body').css('cursor', 'initial');
        });
        $(document).on('mousemove', function(event) {
          //calculate new position
          var delta = event.pageX - startX,
            newLeftWidth = leftWidth + delta,
            newRightWidth = rightWidth - delta;
            if (newLeftWidth < 0) {
              newLeftWidth = 0;
              newRightWidth = innerWidth;
            } else if (newRightWidth < 0) {
              newLeftWidth = innerWidth;
              newRightWidth = 0;
            }
          that.position = [newLeftWidth/innerWidth, newRightWidth/innerWidth];

          ilex.applySize();
        });
      };
    },
    makeHandlerDblcliskCallback = function(that) {
      return function (event) {
        //return to start position
        that.position = position;
        ilex.applySize();
      }
    },
    width = $parentWidget.data('ilex-width'),
    height = $parentWidget.data('ilex-height'),
    innerWidth = width - ilex.widgetsCollection.handlerSize;
  that.table = $('<div class="ilex-resize ilex-horizontalSplit">').appendTo($parentWidget)
                    .data('ilex-width', width)
                    .data('ilex-height', height)
                    .css('display', 'table-row');

  that.left = $('<div class="ilex-left">').appendTo(that.table)
                          .css('display', 'table-cell')
                          .data('ilex-width', innerWidth * position[0])
                          .data('ilex-height', height);
  that.position = position;
  that.handler = $('<div class="ilex-handler">').appendTo(that.table)
                          .data("ilex-position", position)
                          .css('display', 'table-cell')
                          .css('cursor', 'ew-resize')
                          .data('ilex-width', ilex.widgetsCollection.handlerSize)
                          .data('ilex-height', height)
                          .css('background', '#000');


  that.right = $('<div class="ilex-right">').appendTo(that.table)
                          .css('display', 'table-cell')
                          .data('ilex-width', innerWidth * position[1])
                          .data('ilex-height', height);

  that.table.on('windowResize', makeResizeCallback(that));
  that.handler.on('mousedown', makeHandlerMousedownCallback(that));
  that.handler.on('dblclick', makeHandlerDblcliskCallback(that));
  return that;
};
