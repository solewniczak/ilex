  'use strict';

//requires: ilex.widgetsCollection.handlerSize, ilex.widgetsCollection.verticalToolbar
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.handlerSize === undefined)
  throw 'ilex.widgetsCollection.handlerSize undefined';
if (ilex.widgetsCollection.verticalToolbar === undefined)
  throw 'ilex.widgetsCollection.verticalToolbar undefined';
if (ilex.widgetsCollection.verticalColumns === undefined)
  throw 'ilex.widgetsCollection.verticalColumn undefined';
if (ilex.widgetsCollection.toolbar === undefined)
  throw 'ilex.widgetsCollection.toolbar undefined';
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
    buttonsWidth = 20,
    innerWidth = width - ilex.widgetsCollection.handlerSize;

  //contains slider and slider navigation buttons
  that.superContainer = $('<div class="ilex-resize ilex-documentsSlider">')
                    .data('ilex-width', width)
                    .data('ilex-height', height);
  $parentWidget.html(that.superContainer);

  that.superTable = ilex.widgetsCollection.verticalColumns(that.superContainer, [buttonsWidth, '100%', buttonsWidth]);

  that.leftButtons = that.superTable.columns[0];
  that.leftButtons.css('position', 'relative').css('z-index', 5);

  //calculate ilex width later basing on buttons width
  that.container = that.superTable.columns[1];


  that.rightButtons = that.superTable.columns[2];
  //position: absolute fixes strange chrome bug, that misspostion right buttons
  that.rightButtons.css('position', 'absolute').css('z-index', 5).css('right', 0);

  //create buttons
  let fontSize = '20px';
  ilex.widgetsCollection.verticalToolbar(that.leftButtons, [
    { 'html': '<span class="ilex-awesome" style="font-size: '+fontSize+'">&#xf104;</span>',
      'callback': function(event) {
        that.slideRight();
      }
    }
  ]);

  ilex.widgetsCollection.verticalToolbar(that.rightButtons, [
    { 'html': '<span class="ilex-awesome" style="font-size: '+fontSize+'">&#xf105;</span>',
      'callback': function(event) {
        that.slideLeft();
      }
    }, //forward
    {'html': '<span class="ilex-awesome" style="font-size: '+fontSize+'">&#xf067;</span>',
     'callback': function (event) {
       let pannels = that.position.length + 1,
         ratio = 1.0/pannels;
       that.position = [];
       for (let i = 0; i < pannels; i++) {
         that.position.push(ratio);
         that.window(windowPointer + i).element
             .data('ilex-width', innerWidth * ratio);
       }
       ilex.applySize(true);
     }
   }
  ]);

  that.table = $('<div>').appendTo(that.container)
                    .css('display', 'table-row')
                    //some huge value
                  .css('width', '100000px')
                  .data('ilex-height', height)
                  .css('position', 'absolute');




  //console.log(that.container);

  //Array of {element: jQuery, contentWidget: Objct, setContentWidget: function()}
  var windows = [];
  var addWindow = function(pos) {
      var newWindow = {};
      newWindow.element = $('<div class="ilex-sliderWindow">').appendTo(that.table)
                                .css('display', 'table-cell')
                                .data('ilex-width', innerWidth * pos)
                                .data('ilex-height', height);
      newWindow.contentWidget = undefined;
      newWindow.setContentWidget = function(contentWidget) {
        this.contentWidget = contentWidget;
        this.toolbar = ilex.widgetsCollection.toolbar(contentWidget.dock);
        var curWindow = this;
        console.log(this.toolbar);
        this.toolbar.addButton('<span class="ilex-awesome">&#xf068;</span>',
            function(event) {
              var windowHeight = $(window).height();
              curWindow.contentWidget.container.css('position', 'relative');
              curWindow.contentWidget.container.animate({'top': windowHeight}, function() {
                this.remove();
                //remove slider window
                curWindow.element.remove();
              });
            });
      };
      windows.push(newWindow);
      return newWindow;
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
    var visibleWindows = [];
    for (let i = 0; i < that.position.length; i++) {
      visibleWindows.push(that.window(windowPointer + i));
    }
    return visibleWindows;
  };

  that.getVisibleHandler = function() {
    return that.handler(windowPointer);
  };

  that.slideLeft = function () {
    if (windowPointer + 2 >= windows.length) {
      return;
    }
    var leftWidth = that.window(windowPointer).element.data('ilex-width'),
      tablePos = that.table.position(),
      slide = tablePos.left - (leftWidth + ilex.widgetsCollection.handlerSize);

    windowPointer += 1;

    that.window(windowPointer + 1).element.data('ilex-width', leftWidth);
    ilex.applySize();

    that.table.animate({'left': slide});
  };
  that.slideRight = function () {
    if (windowPointer === 0) {
      return;
    }
    var leftWidth = that.window(windowPointer).element.data('ilex-width'),
      rightWidth = that.window(windowPointer + 1).element.data('ilex-width'),
      tablePos = that.table.position(),
      slide = tablePos.left + (leftWidth + ilex.widgetsCollection.handlerSize);

    windowPointer -= 1;

    //newly shown window
    that.window(windowPointer).element.data('ilex-width', rightWidth);
    ilex.applySize();

    that.table.animate({'left': slide});
  };

  that.position = position;

  elements.push(addWindow(position[0]));
  elements.push(addHandler());
  elements.push(addWindow(position[1]));

  that.superContainer.on('windowResize', function(event) {
    /*var width = that.superContainer.parent().data('ilex-width'),
      height = that.superContainer.parent().data('ilex-height'),
      innerWidth = width - ilex.widgetsCollection.handlerSize;

    that.superContainer.data('ilex-width', width).data('ilex-height', height);
    that.container.children().data('ilex-height', height);

    let visibleWindows = that.getVisibleWindows();
    visibleWindows[0].element.data('ilex-width', innerWidth * that.position[0]);
    visibleWindows[1].element.data('ilex-width', innerWidth * that.position[1]);*/
    var width = that.container.data('ilex-width'),
      height = that.container.data('ilex-height'),
      innerWidth = width - ilex.widgetsCollection.handlerSize;

    let visibleWindows = that.getVisibleWindows();
    visibleWindows[0].element.data('ilex-width', innerWidth * that.position[0]);
    visibleWindows[1].element.data('ilex-width', innerWidth * that.position[1]);
  });



  that.container.on('mousedown', '.ilex-handler', function(event) {
    if (that.getVisibleHandler()[0] !== this) {
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

      visibleWindows[0].data('ilex-width', that.position[0] * innerWidth);
      visibleWindows[1].data('ilex-width', that.position[1] * innerWidth);
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
