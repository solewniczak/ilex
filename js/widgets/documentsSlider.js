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
          innerWidth = width - (that.visibleWindows.get()-1) *
            ilex.widgetsCollection.handlerSize;

      return innerWidth;
    };

  //contains slider and slider navigation buttons
  that.superContainer = $('<div class="ilex-resize ilex-documentsSlider">')
                    .data('ilex-width', width)
                    .data('ilex-height', height);
  $parentWidget.html(that.superContainer);
  
  that.superTable = ilex.widgetsCollection.verticalColumns(that.superContainer, [0, buttonsWidth, '100%', buttonsWidth]);
  
  that.froozenWindow = null;
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


  
  var createHandlerObject = function() {
    return $('<div class="ilex-handler">')
                            .css('cursor', 'ew-resize')
                            .data('ilex-width', ilex.widgetsCollection.handlerSize)
                            .data('ilex-height', height)
                            .css('background', '#000');
  };
  //public
  that.windows = function() {
    var windows = [],
    updateIlexWindowData = function () {
      for (let i = 0; i < windows.length; i++) {
        let win = windows[i];
        win.element.data('ilex-window', i);
      } 
    };
    return {
      'length': 0,
      'get': function(ind) {
        if (ind < 0 || ind >= windows.length) {
          return undefined;
        }
        return windows[ind];
      },
      'last': function() {
        return windows[windows.length-1];
      },
      'getAll': function() {
        return windows;
      },
      'push': function(win) {
        windows.push(win);
        this.length = windows.length;
        updateIlexWindowData();
      },
      'unshift': function(win) {
        windows.unshift(win);
        this.length = windows.length;
        updateIlexWindowData();
      },
      'splice': function(start, deleteCount, win) {
        if (win === undefined) {
          windows.splice(start, deleteCount);
        } else {
          windows.splice(start, deleteCount, win);
        }
        this.length = windows.length;
        updateIlexWindowData();
      }
    };
  }();
  
  //most left window index
  that.windowPointer = 0;
  //if we have frozen window
  that.windowFrozen = false;
  

  that.visibleWindows = function() {
    var visWindows = 0,
        position = [],
      setEqualWindowPositions = function() {
        position = [];
        let ratio = 1.0/visWindows;
        for (let i = 0; i < visWindows; i++) {
          position.push(ratio);
        }
      };
    return {
      'get': function() {
        return visWindows;
      },
      'inc': function () {
        if (visWindows === that.windows.length) {
          console.log('visibleWindows cannot be greater than windows.length');
        }
        visWindows += 1;
        setEqualWindowPositions();
        this.applyWindowPosition();
      },
      'dec': function () {
        if (visWindows === 0) {
          return false;
        }
        visWindows -= 1;
        setEqualWindowPositions();
        this.applyWindowPosition();
      },
      'applyWindowPosition': function () {
        for (let i = 0; i < visWindows; i++) {
          let ratio = position[i],
              win = that.windows.get(that.windowPointer + i),
              width = getInnerWidth() * ratio;

          win.setWidth(width);
        }
      },
      'setPosition': function(id, val) {
        position[id] = val;
        this.applyWindowPosition();
      },
      'shiftRight': function () {
        var tmp = position[position.length - 1];
        for (let i = position.length - 1; i >= 1; i--) {
          position[i] = position[i - 1];
        }
        position[0] = tmp;

        this.applyWindowPosition();
      },
      'shiftLeft': function () {
        var tmp = position[0];
        for (let i = 0; i < position.length - 1; i++) {
          position[i] = position[i + 1];
        }
        position[position.length-1] = tmp;

        this.applyWindowPosition();
      },
    };
  }();
  
  that.createWindow = function() {
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
      var win = that.createWindow();
      that.addWindowBefore(win, newWindow.getInd());
      
      that.visibleWindows.inc();
       
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
      var win = that.createWindow();
      that.addWindowAfter(win, newWindow.getInd());
      
      that.visibleWindows.inc();
      
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
      newWindow.contentWidget = undefined;
    };
    
    newWindow.remove = function () {
      var winInd = newWindow.getInd();
      that.windows.splice(winInd, 1);
      
      newWindow.element.remove();
      newWindow.rightSideHandler.remove();

      ilex.server.tabClose(winInd);
    };
    
    newWindow.getWidth = function () {
      return newWindow.element.data('ilex-width');
    };
    
    newWindow.setWidth = function(width) {
      newWindow.element.data('ilex-width', width);
      newWindow.widget.data('ilex-width', width);
      
      newWindow.droppableRegion.top.data('ilex-width', width);
      newWindow.droppableRegion.left.data('ilex-width', width*0.5);
      newWindow.droppableRegion.right.data('ilex-width', width*0.5);
    };
    
    newWindow.getHeight = function () {
      return  newWindow.element.data('ilex-height');
    };
    
    newWindow.setHeight = function (height) {
        newWindow.element.data('ilex-height', height);
        newWindow.widget.data('ilex-height', height);
      
        newWindow.droppableRegion.top.height(height*0.2);
        newWindow.droppableRegion.left.height(height);
        newWindow.droppableRegion.right.height(height);
      
        newWindow.rightSideHandler.data('ilex-height', height);
    };
    
    newWindow.getInd = function () {
      return newWindow.element.data('ilex-window');
    };
    
    newWindow.closeTab = function(event) {
      var windowHeight = $(window).height();
      //cannot close last tab
      if (that.windows.length === 1) {
        let lastWin = that.windows.get(0);
        lastWin.closeDocument();
        lastWin.setContentWidget(createStarterWidget(lastWin));
        ilex.applySize();
        return;
      }
      
      //bakground for animanito purposes
      newWindow.contentWidget.container.css('position', 'relative');
                                       
      newWindow.contentWidget.container.animate({'top': windowHeight}, function() {
        if (that.windows.get(that.windowPointer + 1) !== undefined) {
          var nextWidgetIsStarter = that.windows.get(that.windowPointer + 1)
                                          .widget.children(':first')
                                          .hasClass('ilex-starterWidget');
        } else {
          var nextWidgetIsStarter = false;
        }
        
        //slide right window
        if (that.visibleWindows.get() === 1
            && !nextWidgetIsStarter
            && that.windowPointer < that.windows.length - 1) {
          that.slideLeft(function () {
            var removedWidth = newWindow.getWidth();
            newWindow.remove();
            //remember about decresing window pointar after removing window
            that.windowPointer -= 1;
            //align left slide
            that.table.css('left', that.table.position().left + removedWidth + 
                          ilex.widgetsCollection.handlerSize);
            ilex.applySize();
          });
        //slide left window
        } else if (that.visibleWindows.get() === 1
            && that.windowPointer > 0) {
          that.slideRight(function () {
            newWindow.remove();
            ilex.applySize();
          }); 
        //just remove window
        } else {
          newWindow.remove();
          that.visibleWindows.dec();
          ilex.applySize();
        }
      });
    };
    
    newWindow.closeDocument = function(event) {
      ilex.server.tabClose(newWindow.tabId);
      newWindow.tabId = tabId;
      tabId += 1;
      newWindow.widget.html('');
      newWindow.contentWidget = undefined;
    };
    
    newWindow.setContentWidget = function(contentWidget) {
      newWindow.contentWidget = contentWidget;
    };
    
    newWindow.rightSideHandler = createHandlerObject();
    
    //function returns window object of antother window 
    newWindow.getWindow = function(id) {
      return that.windows.get(id);
    };

    return newWindow;
  };
  
  that.createStarterWindow = function () {
    var newWindow = that.createWindow(),
        widget = createStarterWidget(newWindow);
    
    newWindow.setContentWidget(widget);
    
    return newWindow;
  };
  
  that.addWindowAfter = function(newWindow, afterInd) {
    if (afterInd === undefined) {
      newWindow.element.appendTo(that.table);
      newWindow.rightSideHandler.insertAfter(newWindow.element);
      that.windows.push(newWindow);
    } else {
      newWindow.element.insertAfter(that.windows.get(afterInd).rightSideHandler);
      newWindow.rightSideHandler.insertAfter(newWindow.element);
      that.windows.splice(afterInd + 1, 0, newWindow);
    }
  };
  
  that.addWindowBefore = function(newWindow, beforeInd) {
    if (beforeInd === undefined) {
      beforeInd = 0;
    }
    
    if (beforeInd > 0) {
      that.addWindowAfter(newWindow, beforeInd-1);
    } else {
      newWindow.id = 0;
      newWindow.element.prependTo(that.table);
      newWindow.rightSideHandler.insertAfter(newWindow.element);
      
      that.windows.unshift(newWindow);
    }
    
  }
  
  that.detachWindow = function(winInd) {
    var win = that.windows.get(winInd),
        element = win.element.detach(),
        handler = win.rightSideHandler.detach();
    
    that.windows.splice(winInd, 1);

    return win;
  };

  that.slideLeft = function (callback) {
    if (that.windowPointer + that.visibleWindows.get() >= that.windows.length) {
      return;
    }
    //break if some animation in progress
    if (that.table.is(':animated')) {
      return;
    }
    
    var leftWidth = that.windows.get(that.windowPointer ).getWidth(),
        tablePos = that.table.position(),
        slide = tablePos.left - (leftWidth + ilex.widgetsCollection.handlerSize);
        
    //move to next window
    that.windowPointer += 1;
    
    //swap positions
    that.visibleWindows.shiftLeft();
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
    //break if some animation in progress
    if (that.table.is(':animated')) {
      return;
    }

    that.windowPointer -= 1;
    
    var windowToShow = that.windows.get(that.windowPointer),
        windowToShowPreviousWidth = windowToShow.getWidth();

    //set positions to new windows
    that.visibleWindows.shiftRight();

    //align left position after resizing right window
    let widthDelta = windowToShowPreviousWidth - windowToShow.getWidth();
    that.table.css('left', that.table.position().left + widthDelta);
    
    ilex.applySize();

    let slide = that.table.position().left + (windowToShow.getWidth() +
                                            ilex.widgetsCollection.handlerSize);
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
  
  $(document).on('ilex-linkClicked', function(event, windowObject, link) {
    var getWindowDocumentId = function(windowObject) {
      if (windowObject !== undefined &&
          windowObject.contentWidget !== undefined &&
          typeof windowObject.contentWidget.getFileInfo === 'function') {
        return windowObject.contentWidget.getFileInfo('id');
      }
      return null;
    };
    var loadAndScroll = function(win, documentId, version, callback) {
      if (getWindowDocumentId(win) === documentId) {
        win.contentWidget.loadVersion(version, callback);
      } else {
        win.closeDocument();
        ilex.tools.mime.loadDocument(win, documentId, version, callback);
      }
    };
    var closeWindowsAfter = function (windowObj) {
      if (windowObj === undefined) {
        return;
      }
      
      for (let i = that.windows.length - 1; i > windowObj.getInd(); i -= 1) {
        let win = that.windows.get(i);
        win.remove();
      }
    };
    
    //1
    if (that.visibleWindows.get() === 1) {
      let rightWindow = that.windows.get(windowObject.getInd() + 1),
          leftWindow = that.windows.get(windowObject.getInd() - 1);
      
      //1.1
      if (getWindowDocumentId(rightWindow) === link.to.documentId) {
        loadAndScroll(rightWindow,
          link.to.documentId,
          link.to.versionNo,
        function () {
          that.visibleWindows.inc();
          ilex.applySize();
        });  
      //1.2
      } else if (getWindowDocumentId(leftWindow) === link.to.documentId) {
        loadAndScroll(leftWindow,
          link.to.documentId,
          link.to.versionNo,
        function () {
          that.visibleWindows.inc();
          that.slideRight();
        });
      //1.3
      } else {
        let newWindow = that.createWindow();
        that.addWindowAfter(newWindow, windowObject.getInd());
        closeWindowsAfter(newWindow);
        
        loadAndScroll(newWindow,
          link.to.documentId,
          link.to.versionNo,
        function () {
          that.visibleWindows.inc();
          ilex.applySize();
        });
      }
    //2.1, 2.2, 2.3
    } else if (that.visibleWindows.get() === 2
                 && windowObject.getInd() === that.windowPointer) {
      let rightWindow = that.windows.get(windowObject.getInd() + 1),
          leftWindow = that.windows.get(windowObject.getInd() - 1);
      //2.1
      if (getWindowDocumentId(rightWindow) === link.to.documentId) {
        loadAndScroll(rightWindow,
          link.to.documentId,
          link.to.versionNo);
      //2.2
      } else if (getWindowDocumentId(leftWindow) === link.to.documentId) {
        loadAndScroll(leftWindow,
          link.to.documentId,
          link.to.versionNo,
        function () {
          that.slideRight();
        });
      //2.3
      } else {
        let newWindow = that.createWindow();
        that.addWindowAfter(newWindow, windowObject.getInd());
        
        closeWindowsAfter(newWindow);
        
        loadAndScroll(newWindow,
          link.to.documentId,
          link.to.versionNo);
      }
    //2.4, 2.5, 2.6
    } else if (that.visibleWindows.get() === 2
                 && windowObject.getInd() === that.windowPointer + 1) {
      let rightWindow = that.windows.get(windowObject.getInd() + 1),
            leftWindow = that.windows.get(windowObject.getInd() - 1);
      //2.4
      if (getWindowDocumentId(leftWindow) === link.to.documentId) {
        loadAndScroll(leftWindow,
          link.to.documentId,
          link.to.versionNo);
      //2.5
      } else if (getWindowDocumentId(rightWindow) === link.to.documentId) {
        loadAndScroll(rightWindow,
          link.to.documentId,
          link.to.versionNo,
        function () {
          that.slideLeft();
        });
      //2.6
      } else {
        let newWindow = that.createWindow();
        that.addWindowAfter(newWindow, windowObject.getInd());
        closeWindowsAfter(newWindow);
        
        loadAndScroll(newWindow,
          link.to.documentId,
          link.to.versionNo,
        function () {
           that.slideLeft();
        });
      }
    }
  });
  

  let win = that.createStarterWindow();
  that.addWindowAfter(win);
  that.visibleWindows.inc();

  
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
            winWidth = win.getWidth();
        
        that.superTable.setColumnWidth(0, winWidth);
        win.element.css('z-index', 10);
        
        //save frozen window object
        that.froozenWindow = win;
        that.frozenContainer.append(win.element);
        
        that.container.data('ilex-width', width - winWidth);
        that.table.css('left', offset.left + winWidth);
        
        that.visibleWindows.dec();
        ilex.applySize();
      },
      'callbackOff': function(event) {
        var width = that.container.data('ilex-width'),
            frozenWidth = that.frozenContainer.data('ilex-width'),
            offset = that.table.offset();
        
        that.addWindowBefore(that.froozenWindow, that.windowPointer);
        that.froozenWindow = null;
        
        that.visibleWindows.inc();
        
        that.superTable.setColumnWidth(0, 0);
        
        that.container.data('ilex-width', width + frozenWidth);
        that.table.css('left', offset.left - frozenWidth);
        
        //applyWindowPosition();
        ilex.applySize();
      }
    }
  ]);

  ilex.widgetsCollection.verticalToolbar(that.rightButtons, [
    //forward
    { 'html': '<span class="ilex-awesome" style="font-size: '+fontSize+'">&#xf105;</span>',
      'callback': function(event) {
        var starterWidget = that.windows.last().widget.children(':first');

        if (that.windowPointer + that.visibleWindows.get() === that.windows.length
           && !starterWidget.hasClass('ilex-starterWidget')) {
          //check if starter widget visible on the right
          let win = that.createStarterWindow();
          that.addWindowAfter(win);
        }
        that.slideLeft();
      }
    },
    //add
    {'html': '<span class="ilex-awesome" style="font-size: '+fontSize+'">&#xf067;</span>',
     'callback': function () {
      if (that.windows.length < that.windowPointer + that.visibleWindows.get() + 1) {
        let starterWidget = that.windows.last().widget.children(':first');
         if (starterWidget.hasClass('ilex-starterWidget')) {
          //check if starter widget visible on the right
          return;
         } else {
           var win = that.createStarterWindow();
           that.addWindowAfter(win);
         }
      }
      that.visibleWindows.inc();
      ilex.applySize(true);
     }
   },
   //remove
   {'html': '<span class="ilex-awesome" style="font-size: '+fontSize+'">&#xf068;</span>',
    'callback': function(event) {
      if (this.visibleWindows === 1) {
        return;
      }
  
      that.visibleWindows.dec();
      ilex.applySize(true);
    }
  }
  ]);


  that.superContainer.on('windowResize', function(event) {
    var width = that.superContainer.parent().data('ilex-width'),
      height = that.superContainer.parent().data('ilex-height');
    
    that.superContainer.data('ilex-width', width);
    //that.container.data('ilex-width', getInnerWidth());

    that.superContainer.data('ilex-height', height);
    that.table.data('ilex-height', height);
    
    for (let win of that.windows.getAll()) {
      win.setHeight(height);
    }
    if (that.froozenWindow !== null) {
      that.froozenWindow.setHeight(height);
    }
    
    //set windows width
    that.visibleWindows.applyWindowPosition();
  });



  that.container.on('mousedown', '.ilex-handler', function(event) {
      var $handler = $(this),
        winInd = $handler.prev().data('ilex-window'),
        leftWidth = that.windows.get(winInd).getWidth(),
        rightWidth = that.windows.get(winInd + 1).getWidth(),
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

        that.visibleWindows.setPosition(winInd - that.windowPointer,
                                        newLeftWidth/getInnerWidth());
        that.visibleWindows.setPosition(winInd + 1 - that.windowPointer,
                                        newRightWidth/getInnerWidth());

        ilex.applySize();

        //prevent text selection while resizing
        event.preventDefault();
    });
  });

  return that;
};
