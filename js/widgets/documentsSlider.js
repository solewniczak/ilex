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

ilex.widgetsCollection.documentsSlider = function ($parentWidget, newWindowWidgetCallback) {
  var that = {},
    //which window display left most
    windowPointer = 0,
    width = $parentWidget.data('ilex-width'),
    height = $parentWidget.data('ilex-height'),
    buttonsWidth = 20,
    innerWidth = 0,
    updateInnerWidth = function(width) {
      innerWidth = width - (that.visibleWindows-1) * ilex.widgetsCollection.handlerSize - 2*buttonsWidth;
    };


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
  //private
  var applyWindowPosition = function () {
    for (let i = 0; i < that.visibleWindows; i++) {
      let ratio = that.position[i],
        win = that.windows[that.windowPointer + i];
        win.element.data('ilex-width', innerWidth * ratio);
    }
  },
  setEqualWindowPositions = function() {
    that.position = [];
    let ratio = 1.0/that.visibleWindows;
    for (let i = 0; i < that.visibleWindows; i++) {
      that.position.push(ratio);
    }
  },
  addWindow = function() {
      var newWindow = {},
        winInd = that.windows.length;
      newWindow.id = winInd;
      newWindow.element = $('<div class="ilex-sliderWindow">').appendTo(that.table)
                                .data('ilex-window', winInd)
                                .css('display', 'table-cell')
                                //width is set by applyWindowPosition
                                .data('ilex-height', height);
      newWindow.contentWidget = undefined;
      newWindow.setContentWidget = function(contentWidget) {
        this.contentWidget = contentWidget;
        this.toolbar = ilex.widgetsCollection.toolbar(contentWidget.dock);
        var curWindow = this;

        //add close window button
        this.toolbar.addButton('<span class="ilex-awesome">&#xf068;</span>',
            function(event) {
              var windowHeight = $(window).height();

              //bakground for animanito purposes
              curWindow.contentWidget.container.css('background', '#fff')
                                               .css('position', 'relative');
              curWindow.contentWidget.container.animate({'top': windowHeight}, function() {
                var removeWindow = function () {
                  var winInd = curWindow.element.data('ilex-window');
                  that.windows.splice(winInd, 1);
                  //update indexes of windows
                  for (let i = winInd; i < that.windows.length; i++) {
                    let win = that.windows[i];
                    win.element.data('ilex-window', i);
                    win.rightSideHandler.data('ilex-window', i);
                  }

                  curWindow.element.remove();
                  curWindow.rightSideHandler.remove();

                  //send close message to widget
                  curWindow.contentWidget.close();

                  updateInnerWidth(width);
                  setEqualWindowPositions();
                  applyWindowPosition();

                  ilex.applySize();
                }

                that.visibleWindows -= 1;

                if (that.visibleWindows === 0) {
                  that.visibleWindows = 1;
                  //if last window was closed, create new window
                  if (that.windows.length === 1) {
                    let lastWindow = that.windows[0],
                      newWindowWidget = newWindowWidgetCallback(lastWindow);
                    lastWindow.setContentWidget(newWindowWidget);
                  //we don't have right side document but we have left side one
                  } else if (that.windowPointer === that.windows.length - 1) {
                    that.slideRight(function () {
                      removeWindow();
                    });
                  } else {
                    removeWindow();
                  }
                } else {
                  removeWindow();
                }
              });
            });
        this.toolbar.addButton('<span class="ilex-awesome">&#xf00d;</span>',
            function(event) {
              var windowHeight = $(window).height();

              //bakground for animanito purposes
              curWindow.contentWidget.container.css('background', '#fff')
                                               .css('position', 'relative');
              curWindow.contentWidget.container.animate({'top': windowHeight},
              function() {
                //send close message to widget
                curWindow.contentWidget.close();
                curWindow.setContentWidget(newWindowWidgetCallback(curWindow));
              });
            });
      };
      newWindow.rightSideHandler = addHandler(winInd);
      that.windows.push(newWindow);
      return newWindow;
  };

  that.createWindow = function () {
    var win = addWindow(),
      newWindowWidget = newWindowWidgetCallback(win);
    win.setContentWidget(newWindowWidget);
    return win;
  };

  that.createWindowSplitSlider = function() {
    that.visibleWindows += 1;
    updateInnerWidth(width);

    //create new text widndow
    if (that.windows.length < that.windowPointer + that.visibleWindows) {
      that.createWindow();
    }
    setEqualWindowPositions();
    applyWindowPosition();
    ilex.applySize(true);
  }

  that.slideLeft = function (callback) {
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
    that.table.animate({'left': slide}, {
      'progress': function () {
        $(document).trigger('canvasRedraw');
      },
      'done': function () {
        if (callback) {
          callback();
        }
      }
    });
  };

  that.slideRight = function (callback) {
    if (that.windowPointer === 0) {
      return;
    }

    that.windowPointer -= 1;
    var rightWidth = that.windows[that.windowPointer + that.visibleWindows]
                      .element.data('ilex-width'),
      //the window to show
      windowToShow = that.windows[that.windowPointer];

    //align left position after resizing windowToShow
    that.table.css('left', that.table.position().left + (windowToShow.element.data('ilex-width') - rightWidth));

    //the window to show
    windowToShow.element.data('ilex-width', rightWidth);
    ilex.applySize();

    let slide = that.table.position().left + (rightWidth + ilex.widgetsCollection.handlerSize);
    that.table.animate({'left': slide}, {
      'progress': function () {
        $(document).trigger('canvasRedraw');
      },
      'done': function () {
        if (callback) {
          callback();
        }
      }
    });
  };

  //create default window
  that.visibleWindows = 1;
  updateInnerWidth(width);

  that.createWindow();

  setEqualWindowPositions();
  applyWindowPosition();

  //create buttons
  let fontSize = '20px';
  ilex.widgetsCollection.verticalToolbar(that.leftButtons, [
    { 'html': '<span class="ilex-awesome" style="font-size: '+fontSize+'">&#xf104;</span>',
      'callback': function(event) {
        that.slideRight();
      }
    },
    //Freeze window
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
    //forward
    { 'html': '<span class="ilex-awesome" style="font-size: '+fontSize+'">&#xf105;</span>',
      'callback': function(event) {
        that.slideLeft();
      }
    },
    //add
    {'html': '<span class="ilex-awesome" style="font-size: '+fontSize+'">&#xf067;</span>',
     'callback': that.createWindowSplitSlider
   },
   //remove
   {'html': '<span class="ilex-awesome" style="font-size: '+fontSize+'">&#xf068;</span>',
    'callback': function(event) {
      if (this.visibleWindows === 1) {
        return;
      }
      that.visibleWindows--;
      updateInnerWidth(width);
      setEqualWindowPositions();
      applyWindowPosition();
      ilex.applySize(true);
    }
  }
  ]);


  that.superContainer.on('windowResize', function(event) {
    width = that.superContainer.parent().data('ilex-width');
    height = that.superContainer.parent().data('ilex-height');
    updateInnerWidth(width);

    that.superContainer.data('ilex-width', width);
    that.container.data('ilex-width', innerWidth);

    that.superContainer.data('ilex-height', height);
    that.table.data('ilex-height', height);
    for (let win of that.windows) {
      win.element.data('ilex-height', height);
      win.rightSideHandler.data('ilex-height', height);
    }
    applyWindowPosition();
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

        applyWindowPosition();
        ilex.applySize();

        //prevent text selection while resizing
        event.preventDefault();
    });
  });

  return that;
};
