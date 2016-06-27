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

ilex.widgetsCollection.documentsSlider = function ($parentWidget, visibleWindows) {
  var that = {},
    //which window display left most
    windowPointer = 0,
    width = $parentWidget.data('ilex-width'),
    height = $parentWidget.data('ilex-height'),
    buttonsWidth = 20,
    innerWidth = 0,
    updateInterWidth = function(width) {
      innerWidth = width - (that.visibleWindows-1) * ilex.widgetsCollection.handlerSize - 2*buttonsWidth;
    };

  that.visibleWindows = visibleWindows;
  updateInterWidth(width);


  //contains slider and slider navigation buttons
  that.superContainer = $('<div class="ilex-resize ilex-documentsSlider">')
                    .data('ilex-width', width)
                    .data('ilex-height', height);
  $parentWidget.html(that.superContainer);

  that.superTable = ilex.widgetsCollection.verticalColumns(that.superContainer, [0, buttonsWidth, '100%', buttonsWidth]);


  //container for frozen content
  that.frozenContainer = that.superTable.columns[0];

  that.leftButtons = that.superTable.columns[1];
  that.leftButtons.css('position', 'relative').css('z-index', 5);


  that.container = that.superTable.columns[2];


  that.rightButtons = that.superTable.columns[3];
  //position: absolute fixes strange chrome bug, that misspostion right buttons
  that.rightButtons.css('position', 'absolute').css('z-index', 5).css('right', 0);


  that.table = $('<div>').appendTo(that.container)
                    .css('display', 'table-row')
                    //some huge value
                  .css('width', '100000px')
                  .data('ilex-height', height)
                  .css('position', 'absolute');

  //Array of {element: jQuery Element,
  //          contentWidget: Objct,
  //          setContentWidget: function(),
  //          rightSideHandler = jQuery Element
  //         }
  //number of windows cannot be smaller than visibleWindows
  that.windows = [];
  //most left window index
  that.windowPointer = 0;

  var addHandler = function(winInd) {
    return $('<div class="ilex-handler">').appendTo(that.table)
                            .css('display', 'table-cell')
                            .css('cursor', 'ew-resize')
                            .data('ilex-window', winInd)
                            .data('ilex-width', ilex.widgetsCollection.handlerSize)
                            .data('ilex-height', height)
                            .css('background', '#000');
  };
  that.applyWindowPosition = function () {
    for (let i = 0; i < that.visibleWindows; i++) {
      let ratio = that.position[i],
        win = that.windows[that.windowPointer + i];
      if (win) {
        win.element.data('ilex-width', innerWidth * ratio);
      } else {
        that.addWindow(ratio);
      }
    }
  };
  that.addWindow = function(widthRatio) {
      var newWindow = {};
      newWindow.element = $('<div class="ilex-sliderWindow">').appendTo(that.table)
                                .css('display', 'table-cell')
                                .data('ilex-width', innerWidth * widthRatio)
                                .data('ilex-height', height);
      newWindow.contentWidget = undefined;
      newWindow.setContentWidget = function(contentWidget) {
        this.contentWidget = contentWidget;
        this.toolbar = ilex.widgetsCollection.toolbar(contentWidget.dock);
        var curWindow = this;

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
      newWindow.rightSideHandler = addHandler(that.windows.length);
      that.windows.push(newWindow);
      return newWindow;
  };

  //remove current window
  that.removeCurrentWindow = function () {

  };

  that.slideLeft = function () {
    if (that.windowPointer + that.visibleWindows >= that.windows.length) {
      return;
    }
    var leftWidth = that.windows[that.windowPointer].element.data('ilex-width'),
      tablePos = that.table.position(),
      slide = tablePos.left - (leftWidth + ilex.widgetsCollection.handlerSize);

    //apply width to window that will be shown
    that.windows[that.windowPointer + that.visibleWindows].element.data('ilex-width', leftWidth);

    that.windowPointer += 1;

    ilex.applySize();
    that.table.animate({'left': slide});
  };

  that.slideRight = function () {
    if (that.windowPointer === 0) {
      return;
    }
    that.windowPointer -= 1;
    var rightWidth = that.windows[that.windowPointer + that.visibleWindows]
                      .element.data('ilex-width'),
      tablePos = that.table.position(),
      slide = tablePos.left + (rightWidth + ilex.widgetsCollection.handlerSize);

    //newly shown window
    that.windows[that.windowPointer].element.data('ilex-width', rightWidth);
    ilex.applySize();
    console.log(tablePos.left, slide);
    that.table.animate({'left': slide});
  };

  //create start windows
  that.position = [];
  let ratio = 1.0/that.visibleWindows;
  for (let i = 0; i < that.visibleWindows; i++) {
    that.position.push(ratio);
    that.addWindow(ratio);
  }

  //create buttons
  let fontSize = '20px';
  ilex.widgetsCollection.verticalToolbar(that.leftButtons, [
    { 'html': '<span class="ilex-awesome" style="font-size: '+fontSize+'">&#xf104;</span>',
      'callback': function(event) {
        that.slideRight();
      }
    },
    {
      'html': '<span class="ilex-awesome" style="font-size: '+fontSize+'">&#xf152;</span>',
      'htmlOn': '<span class="ilex-awesome" style="font-size: '+fontSize+'">&#xf191;</span>',
      'callbackOn': function(event) {
        return;
        var win = that.windows(windowPointer);
        that.frozenContainer.append(win.contentWidget.container.detach());
        that.frozenContainer.data('ilex-width', win.data('ilex-width'));
        that.removeCurentWindow();
        ilex.applySizes();
      },
      'callbackOff': function(event) {
        that.leftButtons.css('left', '0');
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
       that.visibleWindows += 1;
       updateInterWidth(width);
       let ratio = 1.0/that.visibleWindows;
       that.position = [];
       for (let i = 0; i < that.visibleWindows; i++) {
         that.position.push(ratio);
       }
       that.applyWindowPosition();
       ilex.applySize(true);
     }
   }
  ]);


  that.superContainer.on('windowResize', function(event) {
    /*var width = that.superContainer.parent().data('ilex-width'),
      height = that.superContainer.parent().data('ilex-height'),
      innerWidth = width - ilex.widgetsCollection.handlerSize;

    that.superContainer.data('ilex-width', width).data('ilex-height', height);
    that.container.children().data('ilex-height', height);

    let visibleWindows = that.getVisibleWindows();
    visibleWindows[0].element.data('ilex-width', innerWidth * that.position[0]);
    visibleWindows[1].element.data('ilex-width', innerWidth * that.position[1]);*/
    /*var width = that.container.data('ilex-width'),
      height = that.container.data('ilex-height'),
      innerWidth = width - ilex.widgetsCollection.handlerSize;

    let visibleWindows = that.getVisibleWindows();
    visibleWindows[0].element.data('ilex-width', innerWidth * that.position[0]);
    visibleWindows[1].element.data('ilex-width', innerWidth * that.position[1]);*/
  });



  that.container.on('mousedown', '.ilex-handler', function(event) {
      var $handler = $(this),
        winInd = $handler.data('ilex-window'),
        leftWidth = that.windows[winInd].element.data('ilex-width'),
        rightWidth = that.windows[winInd + 1].element.data('ilex-width'),
        startX = event.pageX;

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

        that.position[winInd - that.windowPointer] = newLeftWidth/innerWidth;
        that.position[winInd + 1 - that.windowPointer] = newRightWidth/innerWidth;

        that.applyWindowPosition();
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
