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

ilex.widgetsCollection.documentsSlider = function ($parentWidget, createStarterWidget) {
  var that = {},
    tabId = 0,
    //which window display left most
    width = $parentWidget.data('ilex-width'),
    height = $parentWidget.data('ilex-height'),
    buttonsWidth = 20,
    getInnerWidth = function() {
      var width = that.container.data('ilex-width'),
          innerWidth = width - (that.visibleWindows-1) *
            ilex.widgetsCollection.handlerSize;

      return innerWidth;
    };

  //contains slider and slider navigation buttons
  that.superContainer = $('<div class="ilex-resize ilex-documentsSlider">')
                    .data('ilex-width', width)
                    .data('ilex-height', height);
  $parentWidget.html(that.superContainer);
  
  that.superTable = ilex.widgetsCollection.verticalColumns(that.superContainer, [0, buttonsWidth, '100%', buttonsWidth]);
  
  that.frozenContainer = that.superTable.columns[0];
  that.frozenContainer.css('position', 'relative').css('z-index', 15);

  that.leftButtons = that.superTable.columns[1];
  that.leftButtons.css('position', 'relative').css('z-index', 15);


  that.container = that.superTable.columns[2];

  that.rightButtons = that.superTable.columns[3];
  //position: absolute fixes strange chrome bug, that misspostion right buttons
  //that.rightButtons.css('position', 'absolute').css('z-index', 15).css('right', 0);
  
  that.rightButtons.css('position', 'relative').css('z-index', 15);

  that.table = $('<div>').appendTo(that.container)
                    .css('display', 'flex')
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
  //if we have frozen window
  that.windowFrozen = false;
  
  var createHandlerObject = function() {
    return $('<div class="ilex-handler">')
                            .css('cursor', 'ew-resize')
                            .data('ilex-width', ilex.widgetsCollection.handlerSize)
                            .data('ilex-height', height)
                            .css('background', '#000');
  };
  //private
  var applyWindowPosition = function () {
    for (let i = 0; i < that.visibleWindows; i++) {
      if (that.position[i] === undefined) {
        console.log("can't apply position: postion not set");
        return;
      }
      let ratio = that.position[i],
          win = that.windows[that.windowPointer + i],
          width = getInnerWidth() * ratio;
      
        win.element.data('ilex-width', width);
        win.widget.data('ilex-width', width);
        win.droppableRegion.top.width(width);
      
      win.droppableRegion.left.width(width*0.5);
      
      win.droppableRegion.right.width(width*0.5);
    }
  },
  updateWindowsPositions = function () {
    let sum = 0.0;
    for (let i = 0; i < that.visibleWindows; i++) {
      let win = that.windows[that.windowPointer + i];
      sum += win.element.width();
    }
    for (let i = 0; i < that.visibleWindows; i++) {
      let win = that.windows[that.windowPointer + i];
      that.position[i] = win.element.width()/sum;
    }
  },
  setEqualWindowPositions = function() {
    that.position = [];
    let ratio = 1.0/that.visibleWindows;
    for (let i = 0; i < that.visibleWindows; i++) {
      that.position.push(ratio);
    }
  },
  updateIlexWindowData = function () {
    for (let i = 0; i < that.windows.length; i++) {
      let win = that.windows[i];
      win.element.data('ilex-window', i);
    }
  },
  createWindowObject = function() {
    var newWindow = {};
    
    //winId - determines its postion
    //tabId - is logical connection between client and server
    
    newWindow.tabId = tabId;
    tabId++;
    newWindow.element = $('<div class="ilex-sliderWindow">')
                              .css('background', '#fff')
                              .css('position', 'relative')
                              //width is set by applyWindowPosition
                              .data('ilex-width', 0)
                              .data('ilex-height', height);

    //dropable regions for opening new documents
    newWindow.droppableRegion = {};
    
            
    newWindow.droppableRegion.left = $('<div class="ilex-dropableRegion">')
                              .appendTo(newWindow.element)
                              .css('position', 'absolute')
                              .hide();
                              //width is set by applyWindowPosition
                              //height and top set by window resize
    
     newWindow.droppableRegion.left.on('drop', function (event) {
      event.preventDefault();
      var file = JSON.parse(event.originalEvent.dataTransfer.getData('ilex/file'));

      //by default newest version
      //get new document
      var win = that.addWindowBefore(newWindow.element.data('ilex-window'));
      ilex.tools.mime.loadDocument(win, file.id);
      ilex.applySize();
    });
    
    
    newWindow.droppableRegion.right = $('<div class="ilex-dropableRegion">')
                              .appendTo(newWindow.element)
                              .css('position', 'absolute')
                              //width is set by applyWindowPosition
                              //height set by window resize
                              .css('right', 0)
                              .hide();
    
    newWindow.droppableRegion.right.on('drop', function (event) {
      event.preventDefault();
      var file = JSON.parse(event.originalEvent.dataTransfer.getData('ilex/file'));

      //by default newest version
      //get new document
      var win = that.addWindowAfter(newWindow.element.data('ilex-window'));
      ilex.tools.mime.loadDocument(win, file.id);
      ilex.applySize();
      
    });
    
    newWindow.droppableRegion.top = $('<div class="ilex-dropableRegion">')
                              .appendTo(newWindow.element)
                              .css('position', 'absolute')
                              .hide();
                              //width is set by applyWindowPosition
                              //height set by window resize
    
    newWindow.droppableRegion.top.on('drop', function (event) {
      event.preventDefault();
      var file = JSON.parse(event.originalEvent.dataTransfer.getData('ilex/file')); 
          //windowHeight = $(window).height();

      //by default newest version
      //get new document
      
      //close old document
      ilex.server.tabClose(newWindow.tabId);
      
      newWindow.tabId = tabId;
      tabId++;
      
      newWindow.removeWidget();
      ilex.tools.mime.loadDocument(newWindow, file.id);
      //ilex.applySize();
    });

    
    newWindow.element.on('dragenter', '.ilex-dropableRegion', function (event) {
      event.preventDefault();
      $(this).css('background', 'rgba(40, 215, 40, 0.2)');
    });
    newWindow.element.on('dragleave', '.ilex-dropableRegion', function (event) {
      event.preventDefault();
      $(this).css('background', 'transparent');
    });
    newWindow.element.on('dragover', '.ilex-dropableRegion', function (event) {
      event.preventDefault();
    });

    
    
    newWindow.widget = $('<div class="ilex-widget">').appendTo(newWindow.element)
                          //width is set by applyWindowPosition
                          .data('ilex-height', height);
    newWindow.contentWidget = undefined;
    
    newWindow.removeWidget = function() {
      newWindow.widget.html('');
    };
    
    newWindow.remove = function () {
      var winInd = newWindow.element.data('ilex-window');
      that.windows.splice(winInd, 1);
      
      //update indexes of windows
      updateIlexWindowData();

      newWindow.element.remove();
      newWindow.rightSideHandler.remove();

      ilex.server.tabClose(winInd);
      
      //send close message to widget
      //newWindow.contentWidget.close();

      setEqualWindowPositions();
      applyWindowPosition();

      ilex.applySize();
    };
    
    newWindow.closeTab = function(event) {
      var windowHeight = $(window).height();
      //cannot close last tab
      if (that.windows.length === 1) {
        return;
      }
      
      //bakground for animanito purposes
      newWindow.contentWidget.container.css('position', 'relative');
                                       
      newWindow.contentWidget.container.animate({'top': windowHeight}, function() {

        that.visibleWindows -= 1;
        if (that.visibleWindows === 0) {
          that.visibleWindows = 1;
          if (that.windowPointer === that.windows.length - 1) {
            that.slideRight(function () {
              newWindow.remove();
            });
          } else {
            newWindow.remove();
          }
        } else {
          newWindow.remove();
        }
      });
    };
    
    newWindow.closeDocument = function(event) {
      ilex.server.tabClose(newWindow.tabId);
      newWindow.tabId = tabId;
      tabId += 1;
      newWindow.widget.html('');
    };
    
    //Close document and move first document from left.
    //If there is no document on the left create new document.
//    newWindow.closeDocument = function(event) {
//      var windowHeight = $(window).height();
//
//      //close tab and "reopen" it with new id
//      ilex.server.tabClose(newWindow.tabId);
//      newWindow.tabId = tabId;
//      tabId++;
//
//      //bakground for animanito purposes
//      newWindow.contentWidget.container.css('background', '#fff')
//                                       .css('position', 'relative');
//      newWindow.contentWidget.container.animate({'top': windowHeight},
//        function() {
//          //send close message to widget
//          //curWindow.contentWidget.close();
//          this.setContentWidget(newWindowWidgetCallback(newWindow));
//
////              //there is no window to the right
////              if (curWindow.id+1 >= that.windows.length) {
////                curWindow.setContentWidget(newWindowWidgetCallback(curWindow));
////              //move windows to the right
////              } else {
////                curWindow.remove();
////              }
//      });
//    };
    
    newWindow.setContentWidget = function(contentWidget) {
      this.contentWidget = contentWidget;
    };
    
    newWindow.rightSideHandler = createHandlerObject();
    
    //function returns window object of antother window 
    newWindow.getWindow = function(id) {
      return that.windows[id];
    };

    return newWindow;
  };
  
  that.createWindow = function() {
    var newWindow = createWindowObject(),
        winInd = that.windows.length;
    
    newWindow.id = winInd;
    //append window to the end
    newWindow.element.appendTo(that.table);
    newWindow.rightSideHandler.appendTo(that.table);
    
    newWindow.element.data('ilex-window', that.windows.length);
    
    that.windows.push(newWindow);

    
    setEqualWindowPositions();
    applyWindowPosition();
    
    ilex.applySize();
    
    return newWindow;
  };
  
  that.addWindowAfter = function(afterInd) {
    var winInd = afterInd + 1,
        newWindow = createWindowObject();
    
    newWindow.id = winInd;
    newWindow.element.insertAfter(that.windows[afterInd].rightSideHandler);
    newWindow.rightSideHandler.insertAfter(newWindow.element);
    
    that.windows.splice(winInd, 0, newWindow);
    updateIlexWindowData();
    
    that.visibleWindows += 1;
    
    setEqualWindowPositions();
    applyWindowPosition();
    ilex.applySize(true);
    
    return newWindow;
  };
  
  that.appendWindowBefore = function(beforeInd, windowObj) {
    var winInd = beforeInd;
    
    windowObj.id = winInd;
    windowObj.element.insertBefore(that.windows[beforeInd].element);
    windowObj.rightSideHandler.insertAfter(windowObj.element);
    
    that.windows.splice(winInd, 0, windowObj);
    updateIlexWindowData();
    
    return windowObj;
  };
  
  that.addWindowBefore = function(beforeInd, animate, windowObj) {
    var winInd = beforeInd,
        windowObj = windowObj || createWindowObject();
    
    if (animate === undefined) {
      animate = true;
    }
    
    that.appendWindowBefore(beforeInd, windowObj);
    
    that.visibleWindows += 1;
    
    setEqualWindowPositions();
    applyWindowPosition();
    ilex.applySize(animate);
    
    return windowObj;
  };
  
  that.detachWindow = function(winInd) {
    var win = that.windows[winInd],
        element = win.element.detach(),
        handler = win.rightSideHandler.detach();
    
    that.windows.splice(winInd, 1);
    updateIlexWindowData();
    
    return win;
  };
  
  that.createWindowSplitSlider = function(animate) {
    if (animate === undefined) {
      animate = true;
    }
    
    //create new text widndow
    if (that.windows.length < that.windowPointer + that.visibleWindows + 1) {
      //check if starter widget visible on the right
      let starterWiget = that.windows[that.windows.length - 1].widget.children(':first');
      //block action
      if (starterWiget.hasClass("ilex-starterWidget")) {
        return;
      }

      let newWindow = that.createWindow();
      let widget = createStarterWidget(newWindow);
      newWindow.setContentWidget(widget);
    }
    
    that.visibleWindows += 1;
    setEqualWindowPositions();
    applyWindowPosition();

    ilex.applySize(animate);
  }

  that.slideLeft = function (callback) {
    if (that.windowPointer + that.visibleWindows >= that.windows.length) {
      return;
    }
    //break if some animation in progress
    if (that.table.is(':animated')) {
      return;
    }
    
    var leftWidth = that.windows[that.windowPointer].element.data('ilex-width'),
      tablePos = that.table.position(),
      slide = tablePos.left - (leftWidth + ilex.widgetsCollection.handlerSize);

    //apply width to window that will be shown
    that.windows[that.windowPointer + that.visibleWindows].element.data('ilex-width', leftWidth);
    
    ilex.applySize();
    
    //move to next window
    that.windowPointer += 1;
    
        
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
    //break if some animation in progress
    if (that.table.is(':animated')) {
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
        var width = that.container.data('ilex-width'),
            offset = that.table.offset(),
            win = that.detachWindow(that.windowPointer),
            winWidth = win.element.data('ilex-width');
        
        that.superTable.setColumnWidth(0, winWidth);
        win.element.css('z-index', 10);
        
        //save frozen window object
        that.froozenWindow = win;
        that.frozenContainer.append(win.element);
        
        that.container.data('ilex-width', width - winWidth);
        that.table.css('left', offset.left + winWidth);
        
        that.visibleWindows -= 1;
        setEqualWindowPositions();
        
        applyWindowPosition();
        ilex.applySize();
        
      },
      'callbackOff': function(event) {
        var winElement = that.frozenContainer.html(),
            width = that.container.data('ilex-width'),
            frozenWidth = that.frozenContainer.data('ilex-width'),
            offset = that.table.offset();
        
        that.appendWindowBefore(that.windowPointer, that.froozenWindow);
        that.froozenWindow = undefined;
        
        that.visibleWindows += 1;

        updateWindowsPositions();
        applyWindowPosition();
        
        that.superTable.setColumnWidth(0, 0);
        
        that.container.data('ilex-width', width + frozenWidth);
        that.table.css('left', offset.left - frozenWidth);
        
        applyWindowPosition();
        ilex.applySize();
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
      
      setEqualWindowPositions();
      applyWindowPosition();
      ilex.applySize(true);
    }
  }
  ]);


  that.superContainer.on('windowResize', function(event) {
    var updateWindowSize = function(win) {
        win.element.data('ilex-height', height);
        win.widget.data('ilex-height', height);
      
        win.droppableRegion.top.height(height*0.2);
        win.droppableRegion.left.height(height);
        win.droppableRegion.right.height(height);
      
        win.rightSideHandler.data('ilex-height', height);
      },
      width = that.superContainer.parent().data('ilex-width'),
      height = that.superContainer.parent().data('ilex-height');
    
    that.superContainer.data('ilex-width', width);
    //that.container.data('ilex-width', getInnerWidth());

    that.superContainer.data('ilex-height', height);
    that.table.data('ilex-height', height);
    
    for (let win of that.windows) {
     updateWindowSize(win);
    }
    if (that.froozenWindow !== undefined) {
      updateWindowSize(that.froozenWindow);
    }
    
    //set windows width
    applyWindowPosition();
  });



  that.container.on('mousedown', '.ilex-handler', function(event) {
      var $handler = $(this),
        winInd = $handler.prev().data('ilex-window'),
        leftWidth = that.windows[winInd].element.data('ilex-width'),
        rightWidth = that.windows[winInd + 1].element.data('ilex-width'),
        startX = event.pageX;

      $('body').css('cursor', 'ew-resize');
      //prevent selectin while resizing
      $(document).on('selectstart.ilex.text', function(event) {
        event.preventDefault();
      });
      $(document).on('mouseup.ilex.text', function () {
        $(document).off('mouseup.ilex.text');
        $(document).off('mousemove.ilex.text');
        $(document).off('selectstart.ilex.text');
        $('body').css('cursor', 'initial');
      });

      $(document).on('mousemove.ilex.text', function(event) {
        //calculate new position
        var delta = event.pageX - startX,
          newLeftWidth = leftWidth + delta,
          newRightWidth = rightWidth - delta;
        if (newLeftWidth < 0) {
          newLeftWidth = 0;
          newRightWidth = getInnerWidth();
        } else if (newRightWidth < 0) {
          newLeftWidth = getInnerWidth();
          newRightWidth = 0;
        }

        that.position[winInd - that.windowPointer] = newLeftWidth/getInnerWidth();
        that.position[winInd + 1 - that.windowPointer] = newRightWidth/getInnerWidth();

        applyWindowPosition();
        ilex.applySize();

        //prevent text selection while resizing
        event.preventDefault();
    });
  });

  return that;
};
