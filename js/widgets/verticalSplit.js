'use strict';

//requires: ilex.widgetsCollection.handlerSize
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.handlerSize === undefined)
  throw 'ilex.widgetsCollection.handlerSize undefined';
if (ilex.widgetsCollection.verticalSplit !== undefined)
  throw 'ilex.widgetsCollection.verticalSplit already defined';

ilex.widgetsCollection.verticalSplit = function ($parentWidget, columnWidths) {
  var that = {},
    width = $parentWidget.data('ilex-width'),
    height = $parentWidget.data('ilex-height'),
    innerWidth = width - ilex.widgetsCollection.handlerSize,
    staticColumnWidths = ilex.tools.geometry.staticSizes(columnWidths, innerWidth);
      
  that.table = $('<div class="ilex-resize ilex-horizontalSplit">')
                    .data('ilex-width', width)
                    .data('ilex-height', height)
                    .css('display', 'flex');

  $parentWidget.html(that.table);
  
  that.columnWidths = columnWidths.slice();

  that.left = $('<div class="ilex-left">').appendTo(that.table)
                          .data('ilex-width', staticColumnWidths[0])
                          .data('ilex-height', height);

  that.handler = $('<div class="ilex-handler">').appendTo(that.table)
                          .css('cursor', 'ew-resize')
                          .data('ilex-width', ilex.widgetsCollection.handlerSize)
                          .data('ilex-height', height)
                          .css('background', '#000');


  that.right = $('<div class="ilex-right">').appendTo(that.table)
                          .data('ilex-width', staticColumnWidths[1])
                          .data('ilex-height', height);

  that.table.on('windowResize', function(event) {
    var width = that.table.parent().data('ilex-width'),
      height = that.table.parent().data('ilex-height'),
      innerWidth = width - ilex.widgetsCollection.handlerSize,
      staticColumnWidths = ilex.tools.geometry.staticSizes(that.columnWidths, innerWidth);

    that.table.data('ilex-width', width).data('ilex-height', height);
    that.table.children().data('ilex-height', height);
    that.left.data('ilex-width', staticColumnWidths[0]);
    that.right.data('ilex-width', staticColumnWidths[1]);
  });
  that.handler.on('mousedown', function(event) {
    var startX = event.pageX,
      leftWidth = that.left.data('ilex-width'),
      rightWidth = that.right.data('ilex-width'),
      innerWidth =  leftWidth + rightWidth,
      orgColumnWidths = that.columnWidths.slice();
    $('body').css('cursor', 'ew-resize');
    //prevent selectin while resizing
    $(document).on('selectstart.ilex.horizontalSplit', function(event) {
      event.preventDefault();
    });
    $(document).on('mouseup.ilex.horizontalSplit', function () {
      $(document).off('mouseup.ilex.horizontalSplit');
      $(document).off('mousemove.ilex.horizontalSplit');
      $(document).off('selectstart.ilex.horizontalSplit');
      $('body').css('cursor', 'initial');
    });
    $(document).on('mousemove.ilex.horizontalSplit', function(event) {
      //calculate new position
      var delta = event.pageX - startX;
      
      that.columnWidths = ilex.tools.geometry.updateColumnsSizes(orgColumnWidths, delta);
      
      ilex.applySize();

      //prevent text selection while resizing
      event.preventDefault();
    });
  });
  that.handler.on('dblclick', function (event) {
    //return to start position
    that.columnWidths = columnWidths.slice();
    ilex.applySize();
  });
  return that;
  
};
