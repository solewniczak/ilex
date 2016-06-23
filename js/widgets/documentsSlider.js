'use strict';

//requires: ilex.widgetsCollection.handlerSize
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.handlerSize === undefined)
  throw 'ilex.widgetsCollection.handlerSize undefined';
if (ilex.widgetsCollection.documentsSlider !== undefined)
  throw 'ilex.widgetsCollection.horizontalSplit already defined';

ilex.widgetsCollection.documentsSlider = function ($parentWidget, position) {
  var that = {},
    //position.length means visible widows
    position = position || [0.5, 0.5],
    //which window display left most
    windowPointer = 0,
    width = $parentWidget.data('ilex-width'),
    height = $parentWidget.data('ilex-height'),
    innerWidth = width - ilex.widgetsCollection.handlerSize;

  that.container = $('<div class="ilex-resize ilex-documentsSlider">')
                    .data('ilex-width', width)
                    .data('ilex-height', height);
  $parentWidget.html(that.container);

  that.table = $('<div class="ilex-slider">').appendTo(that.container)
                    .css('display', 'table-row')
                    .css('width', '100000px')
                    .css('position', 'absolute');



  var addWindow = function(pos) {
        return $('<div class="ilex-sliderWindow">').appendTo(that.table)
                                .css('display', 'table-cell')
                                .data('ilex-width', innerWidth * pos)
                                .data('ilex-height', height);
      },
      addHandler = function() {
        return $('<div class="ilex-handler">').appendTo(that.table)
                                .data('ilex-position', position)
                                .css('display', 'table-cell')
                                .css('cursor', 'ew-resize')
                                .data('ilex-width', ilex.widgetsCollection.handlerSize)
                                .data('ilex-height', height)
                                .css('background', '#000');
      };

  //jQuery elements: window, handler, window, handler, ...
  var elements = [];
  that.addWindow = function () {
    var newWindow;
    elements.push(addHandler());
    newWindow = addWindow(position[1]);
    elements.push(newWindow);
    return newWindow;
  };

  //window has even indexes, handlers odd
  that.window = function(ind) {
    let globInd = ind * 2;
    if (elements.length <= globInd) {
      return undefined;
    }
    return elements[globInd];
  };
  that.handler = function(ind) {
    let globInd = ind * 2 + 1;
    if (elements.length <= globInd) {
      return undefined;
    }
    return elements[globInd];
  };
  //return array of visible windows
  that.getVisibleWindows = function() {
    return [that.window(windowPointer), that.window(windowPointer + 1)];
  };

  that.getVisibleHandler = function() {
    return that.handler(windowPointer);
  };

  that.slideLeft = function () {
    var leftWidth = that.window(windowPointer).width() +
                        ilex.widgetsCollection.handlerSize,
        tablePos = that.table.position(),
        slide = tablePos.left - leftWidth;
    windowPointer += 1;
    that.table.animate({'left': slide});
  };
  that.slideRight = function () {
    var slideWidth = that.window(windowPointer-1).width() +
                        ilex.widgetsCollection.handlerSize,
        tablePos = that.table.position(),
        slide = tablePos.left + slideWidth;
    windowPointer -= 1;
    that.table.animate({'left': slide});
  };

  that.position = position;

  elements.push(addWindow(position[0]));
  elements.push(addHandler());
  elements.push(addWindow(position[1]));


  that.container.on('windowResize', function(event) {
    var width = that.container.parent().data('ilex-width'),
      height = that.container.parent().data('ilex-height'),
      innerWidth = width - ilex.widgetsCollection.handlerSize;

    that.container.data('ilex-width', width).data('ilex-height', height);
    that.table.children().data('ilex-height', height);

    let visibleWindows = that.getVisibleWindows();
    visibleWindows[0].data('ilex-width', innerWidth * that.position[0]);
    visibleWindows[1].data('ilex-width', innerWidth * that.position[1]);
  });
  that.container.on('mousedown', '.ilex-handler', function(event) {
    if (!that.getVisibleHandler().is(this)) {
      return;
    }
    var startX = event.pageX,
      visibleWindows = that.getVisibleWindows(),
      leftWidth = visibleWindows[0].data('ilex-width'),
      rightWidth = visibleWindows[1].data('ilex-width'),
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

      //prevent text selection while resizing
      event.preventDefault();
    });
  });
  that.table.find('ilex-handler').on('dblclick', function (event) {
    //return to start position
    that.position = position;
    ilex.applySize();
  });
  return that;
};
