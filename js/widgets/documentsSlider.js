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
    width = $parentWidget.data('ilex-width'),
    height = $parentWidget.data('ilex-height'),
    buttonsWidth = 20,
    innerWidth = 0,
    updateInnerWidth = function() {
      var width = that.container.data('ilex-width');
      innerWidth = width - (that.visibleWindows-1) * ilex.widgetsCollection.handlerSize;
    };


  //contains slider and slider navigation buttons
  that.superContainer = $('<div class="ilex-resize ilex-documentsSlider">')
                    .data('ilex-width', width)
                    .data('ilex-height', height);
  $parentWidget.html(that.superContainer);

  that.superTable = ilex.widgetsCollection.verticalColumns(that.superContainer, [0, buttonsWidth, '100%', buttonsWidth]);
  
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
  //if we have frozen window
  that.windowFrozen = false;
  
  var createHandlerObject = function(winInd) {
    return $('<div class="ilex-handler">')
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
          win = that.windows[that.windowPointer + i],
          width = innerWidth * ratio;
        win.element.data('ilex-width', width);
        win.widget.data('ilex-width', width);
        win.droppableRegion.top.width(width);
      
      win.droppableRegion.left.width(width*0.5);
      
      win.droppableRegion.right.width(width*0.5);
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
      win.rightSideHandler.data('ilex-window', i);
    }
  },
  createWindowObject = function(winInd) {
    var newWindow = {};
    
    newWindow.id = winInd;
    newWindow.element = $('<div class="ilex-sliderWindow">')
                              .data('ilex-window', winInd)
                              .css('background', '#fff')
                              .css('display', 'table-cell')
                              .css('position', 'relative')
                              //width is set by applyWindowPosition
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
      ilex.server.documentGetDump(winInd, file.id, file.totalVersions,
        function(params) {
          var win = that.addWindowBefore(newWindow.id);
          //load new text
          win.setContentWidget(newWindowWidgetCallback(win));
          win.contentWidget.loadText(params);
          ilex.applySize();
        }
      );
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
      ilex.server.documentGetDump(winInd, file.id, file.totalVersions,
        function(params) {
          var win = that.addWindowAfter(newWindow.id);
          //load new text
          win.setContentWidget(newWindowWidgetCallback(win));
          win.contentWidget.loadText(params);
          ilex.applySize();
        }
      );
    });
    
    newWindow.droppableRegion.top = $('<div class="ilex-dropableRegion">')
                              .appendTo(newWindow.element)
                              .css('position', 'absolute')
                              .hide();
                              //width is set by applyWindowPosition
                              //height set by window resize
    
    newWindow.droppableRegion.top.on('drop', function (event) {
      event.preventDefault();
      var file = JSON.parse(event.originalEvent.dataTransfer.getData('ilex/file')), 
          windowHeight = $(window).height();

      //by default newest version
      //get new document
      ilex.server.documentGetDump(winInd, file.id, file.totalVersions,
        function(params) {

          //bakground for animanito purposes
          newWindow.contentWidget.container.css('background', '#fff')
                                           .css('position', 'relative');
          newWindow.contentWidget.container.animate({'top': windowHeight},
          function() {
            //send close message to widget
            newWindow.contentWidget.close();
            newWindow.removeWidget();
            
            //load new text
            newWindow.setContentWidget(newWindowWidgetCallback(newWindow));
            newWindow.contentWidget.loadText(params);
            
            ilex.applySize();
          });

        }
      );
      
      

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

      //send close message to widget
      newWindow.contentWidget.close();
      
      updateInnerWidth();
      setEqualWindowPositions();
      applyWindowPosition();

      ilex.applySize();
    }
    newWindow.setContentWidget = function(contentWidget) {
      this.contentWidget = contentWidget;
      this.toolbar = ilex.widgetsCollection.toolbar(contentWidget.dock);
      var curWindow = this;

      //Close document and hide its window.
      this.toolbar.addButton('Close tab', //<span class="ilex-awesome">&#xf068;</span>
          function(event) {
            var windowHeight = $(window).height();

            //bakground for animanito purposes
            curWindow.contentWidget.container.css('background', '#fff')
                                             .css('position', 'relative');
            curWindow.contentWidget.container.animate({'top': windowHeight}, function() {
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
                    curWindow.remove();
                  });
                } else {
                  curWindow.remove();
                }
              } else {
                curWindow.remove();
              }
            });
          });
      //Close document and move first document from left.
      //If there is no document on the left create new document.
      this.toolbar.addButton('Close document', //<span class="ilex-awesome">&#xf00d;</span>
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
              
//              //there is no window to the right
//              if (curWindow.id+1 >= that.windows.length) {
//                curWindow.setContentWidget(newWindowWidgetCallback(curWindow));
//              //move windows to the right
//              } else {
//                curWindow.remove();
//              }
            });
          });
      
        //resize widget to window size
//        this.contentWidget.container.trigger('windowResize');
      };
      newWindow.rightSideHandler = createHandlerObject(winInd);
      //function returns window object of antother window 
      newWindow.getWindow = function(id) {
        return that.windows[id];
      };
      
      return newWindow;
  },
  addWindow = function() {
    var winInd = that.windows.length,
        newWindow = createWindowObject(winInd);
    
    //append window to the end
    newWindow.element.appendTo(that.table);
    newWindow.rightSideHandler.appendTo(that.table);
    
    that.windows.push(newWindow);
    
    ilex.applySize();
    
    return newWindow;
  };

  that.createWindow = function () {
    var win = addWindow(),
      newWindowWidget = newWindowWidgetCallback(win);
    win.setContentWidget(newWindowWidget);
    return win;
  };
  
  that.addWindowAfter = function(afterInd) {
    var winInd = afterInd + 1,
        newWindow = createWindowObject(winInd);
    
    newWindow.element.insertAfter(that.windows[afterInd].rightSideHandler);
    newWindow.rightSideHandler.insertAfter(newWindow.element);
    
    that.windows.splice(winInd, 0, newWindow);
    updateIlexWindowData();
    
    that.visibleWindows += 1;
    
    updateInnerWidth();
    
    setEqualWindowPositions();
    applyWindowPosition();
    ilex.applySize(true);
    
    return newWindow;
  };
  
  that.addWindowBefore = function(beforeInd) {
    var winInd = beforeInd,
        newWindow = createWindowObject(winInd);
    
    newWindow.element.insertBefore(that.windows[beforeInd].element);
    newWindow.rightSideHandler.insertAfter(newWindow.element);
    
    that.windows.splice(winInd, 0, newWindow);
    updateIlexWindowData();
    
    that.visibleWindows += 1;
    
    updateInnerWidth();
    
    setEqualWindowPositions();
    applyWindowPosition();
    ilex.applySize(true);
    
    return newWindow;
  };
  
//  that.moveWindowBefore = function(beforeInd, winInd) {
//    var win = that.windows[winInd],
//        element = win.element.detach(),
//        handler = win.rightSideHandler.detach();
//    
//    element.insertBefore(that.windows[beforeInd].element);
//    handler.insertAfter(element);
//    
//    //insert element before
//    that.windows.splice(beforeInd, 0, that.windows[winInd]);
//    //remove previous
//    that.windows.splice(winInd, 1);
//    updateIlexWindowData();
//    
//  };
  
  that.detachWindow = function(winInd) {
    var win = that.windows[winInd],
        element = win.element.detach(),
        handler = win.rightSideHandler.detach();
    that.windows.splice(winInd, 1);
    return win;
  };
  
  that.attachBefore = function(beforeInd) {
    
  };

  that.createWindowSplitSlider = function(animate) {
    if (animate === undefined) {
      animate = true;
    }
    
    that.visibleWindows += 1;
    
    updateInnerWidth();

    //create new text widndow
    if (that.windows.length < that.windowPointer + that.visibleWindows) {
      that.createWindow();
    }
    setEqualWindowPositions();
    applyWindowPosition();

    ilex.applySize(animate);
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
  
  updateInnerWidth();

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
        var win = that.windows[that.windowPointer],
            winWidth = win.element.width();
//            handlerOffset = win.rightSideHandler.offset(),
//            tableOffset = that.table.offset();
//        that.leftButtons.css('left', handlerOffset.left - that.leftButtons.width());
//        that.table.css('left', tableOffset.left - that.leftButtons.width());
//        that.detachWindow(that.windowPointer);
//        
//        that.superTable.setColumnWidth(0, winWidth);
//        
//        //modify element to fit new container
//        win.element.css('display', 'block');
//        
//        that.frozenContainer.append(win.element);
//        
//        
//        that.visibleWindows -= 1;
//        updateInnerWidth(width);
//        setEqualWindowPositions();
//        applyWindowPosition();
//        
//        ilex.applySize();
//        
//        that.windowFrozen = true;

        var width = that.container.data('ilex-width'),
            offset = that.table.offset(),
            win = that.detachWindow(that.windowPointer),
            winWidth = win.element.data('ilex-width');
        
        that.superTable.setColumnWidth(0, winWidth);
        win.element.css('display', 'block')
                    .css('z-index', 10);
        that.frozenContainer.append(win.element);
        
        that.container.data('ilex-width', width - winWidth);
        that.table.css('left', offset.left + winWidth);
        
        that.visibleWindows -= 1;
        setEqualWindowPositions();
        
        updateInnerWidth();
        
        applyWindowPosition();
        ilex.applySize();
        
      },
      'callbackOff': function(event) {
        //var win = that.windows[that.windowPointer];
//        that.leftButtons.css('left', '0');
//        win.element.css('left', '0');
        
        var width = that.container.data('ilex-width'),
            offset = that.table.offset();
        
        that.superTable.setColumnWidth(0, 0);
        
        that.container.data('ilex-width', width + 100);
        that.table.css('left', offset.left - 100);
        updateInnerWidth();
        
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
      
      updateInnerWidth();
      
      setEqualWindowPositions();
      applyWindowPosition();
      ilex.applySize(true);
    }
  }
  ]);


  that.superContainer.on('windowResize', function(event) {
    var width = that.superContainer.parent().data('ilex-width'),
      height = that.superContainer.parent().data('ilex-height');
    
    that.superContainer.data('ilex-width', width);
    updateInnerWidth();
    that.container.data('ilex-width', innerWidth);

    that.superContainer.data('ilex-height', height);
    that.table.data('ilex-height', height);
    
    for (let win of that.windows) {
      win.element.data('ilex-height', height);
      win.widget.data('ilex-height', height);
      
      win.droppableRegion.top.height(height*0.2);
      win.droppableRegion.left.height(height);
      win.droppableRegion.right.height(height);
      
      win.rightSideHandler.data('ilex-height', height);
    }
    //set windows width
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
