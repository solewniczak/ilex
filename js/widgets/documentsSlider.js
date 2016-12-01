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

        $(document).trigger('ilex-slider-windowAddedAfter', [windows.length - 2, win]);
      },
      'unshift': function(win) {
        windows.unshift(win);
        this.length = windows.length;
        updateIlexWindowData();
        
        $(document).trigger('ilex-slider-windowAddedAfter', [-1, win]);
      },
      'insert': function (ind, win) {
        windows.splice(ind, 0, win);
        this.length = windows.length;
        updateIlexWindowData();
        
        $(document).trigger('ilex-slider-windowAddedAfter', [ind-1, win]);
      },
      'remove': function (ind) {
        windows.splice(ind, 1);
        this.length = windows.length;
        updateIlexWindowData();
        
        $(document).trigger('ilex-slider-windowRemoved', [ind]);
      },
      'swap': function (win1, win2) {
        var win1Ind = win1.getInd(),
            win2Ind = win2.getInd();
        
        windows[win1Ind] = win2;
        windows[win2Ind] = win1;
        
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
        position = [];
    return {
      'setEqualWindowPositions': function() {
        position = [];
        let ratio = 1.0/visWindows;
        for (let i = 0; i < visWindows; i++) {
          position.push(ratio);
        }
      },
      'get': function() {
        return visWindows;
      },
      'inc': function () {
        if (visWindows === that.windows.length) {
          console.log('visibleWindows cannot be greater than windows.length');
        }
        visWindows += 1;
        this.setEqualWindowPositions();
        this.applyWindowPosition();
        $(document).trigger('ilex-slider-viewChanged', [that.windowPointer, visWindows]);
      },
      'dec': function () {
        if (visWindows === 0) {
          return false;
        }
        visWindows -= 1;
        this.setEqualWindowPositions();
        this.applyWindowPosition();
        $(document).trigger('ilex-slider-viewChanged', [that.windowPointer, visWindows]);
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
      'isVisible': function(winInd) {
        if (winInd >= that.windowPointer &&
            winInd < that.windowPointer + visWindows) {
          return true;
        }
        return false;
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
      that.windows.remove(winInd);
      
      newWindow.element.remove();
      newWindow.rightSideHandler.remove();

      let docObj = newWindow.contentWidget.getDocumentObject();
      if (docObj !== undefined) {
        ilex.server.tabClose(docObj.getTabId());
      }

      $(document).trigger('ilex-slider-viewChanged', [that.windowPointer, that.visibleWindows.get()]);
    };
    
    newWindow.getWidth = function () {
      return newWindow.element.data('ilex-width');
    };
    
    newWindow.setWidth = function(width) {
      newWindow.element.data('ilex-width', width);
      newWindow.widget.data('ilex-width', width);
      
      newWindow.droppableRegion.top.data('ilex-width', width);
    };
    
    newWindow.getHeight = function () {
      return  newWindow.element.data('ilex-height');
    };
    
    newWindow.setHeight = function (height) {
        newWindow.element.data('ilex-height', height);
        newWindow.widget.data('ilex-height', height);
      
        newWindow.droppableRegion.top.height(height);
      
        newWindow.rightSideHandler.data('ilex-height', height);
    };
    
    newWindow.getInd = function () {
      return newWindow.element.data('ilex-window');
    };
    
    newWindow.isVisible = function () {
      var visWin = that.visibleWindows.get(),
          winPtr = that.windowPointer;
      if (this.getInd() >= winPtr && this.getInd() < winPtr + visWin) {
        return true;
      }
      return false;
    };
    
    newWindow.scrollTo = function (halfLink) {
      
    };
    
    //Close tab behaviour when closing visible windows:
    //1. get window from the right
    //2. if no window on the right, scroll left
    //3. if we are most left, decrease visibleWindows
    //4. if last winodow, close open starter window
    newWindow.closeTab = function(event) {
      let mostRightId = that.windows.length - 1;
      let rightVisible = that.windowPointer + that.visibleWindows.get() - 1;
      
      //close window on the left of our view
      if (newWindow.getInd() < that.windowPointer) {
        var width = newWindow.getWidth(),
            newLeft = that.table.position().left + width +
                        ilex.widgetsCollection.handlerSize;
        
        that.windowPointer -= 1;

        that.table.css('left', newLeft);
        newWindow.remove();
      
      //Ad. 4 we have closed last window
      } else if (that.windows.length === 1) {
        newWindow.remove();
        let win = that.createStarterWindow();
        that.addWindowAfter(win);
        $(document).trigger('ilex-slider-viewChanged', [that.windowPointer, that.visibleWindows.get()]);
        
      //Ad. 3 we have less windows than visibleWindows
      } else if (that.visibleWindows.get() === that.windows.length) {
        that.visibleWindows.dec();
        newWindow.remove();
      //Ad. 2 closed last visible window and we don't have window on the right
      } else if (that.visibleWindows.isVisible(newWindow.getInd()) &&
                rightVisible === mostRightId) {
        that.slideRight(function () {
          newWindow.remove();
        });
                  
      //Ad. 1 we've closed visible window but we have the window on the right
      //OR we close window on the left of visible windows
      } else {
        newWindow.remove();
      }
      
      ilex.applySize();
    };
        
    newWindow.closeDocument = function(event) {
      ilex.server.tabClose(newWindow.tabId);
      newWindow.tabId = tabId;
      tabId += 1;
      newWindow.widget.html('');
      newWindow.contentWidget = undefined;
    };
    
      
    newWindow.detach = function(winInd) {
      newWindow.element = newWindow.element.detach();
      newWindow.rightSideHandler = newWindow.rightSideHandler.detach();

      that.windows.remove(newWindow.getInd());
      
      return newWindow;
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
      afterInd = -1;
      newWindow.element.appendTo(that.table);
      newWindow.rightSideHandler.insertAfter(newWindow.element);
      that.windows.push(newWindow);
    } else {
      newWindow.element.insertAfter(that.windows.get(afterInd).rightSideHandler);
      newWindow.rightSideHandler.insertAfter(newWindow.element);
      that.windows.insert(afterInd + 1, newWindow);
    }
  };
  
  that.swapWindows = function(ind1, ind2) {
    if (ind1 === ind2) {
      return;
    } else if (ind1 > ind2) {
      let tmp = ind1;
      ind1 = ind2;
      ind2 = tmp;
    }
    
    var window1 = that.windows.get(ind1),
        window2 = that.windows.get(ind2);
    var win1Prev = window1.element.prev();
    
    window1.element.insertAfter(window2.rightSideHandler);
    window1.rightSideHandler.insertAfter(window1.element);
    
    if (win1Prev.length === 0) {
      window2.element.prependTo(that.table);
    } else {
      window2.element.insertAfter(win1Prev);
    }
    window2.rightSideHandler.insertAfter(window2.element);
    
    that.windows.swap(window1, window2);
    ilex.applySize();
    
    $(document).trigger('ilex-slider-viewChanged', [that.windowPointer, that.visibleWindows.get()]);
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
    
  };

  that.slideLeft = function (callback, winInd) {
    if (that.windowPointer + that.visibleWindows.get() >= that.windows.length) {
      return;
    }
    //break if some animation in progress
    if (that.table.is(':animated')) {
      return;
    }
    
    that.visibleWindows.setEqualWindowPositions();
    ilex.applySize();
    
    if (winInd === undefined) {
      winInd = that.windowPointer + 1;
    }
    
    var flyOver = winInd - that.windowPointer,
        tablePos = that.table.position();
        
    var slide = tablePos.left;
    for (let i = 0; i < flyOver; i++) {
      //move to next window
      that.windowPointer += 1;
      //swap positions
      that.visibleWindows.shiftLeft();
      //add slide
      slide -= that.windows.get(that.windowPointer).getWidth() + ilex.widgetsCollection.handlerSize;      
    }
    ilex.applySize();
    
    $(document).trigger('ilex-slider-viewChanged',
                        [that.windowPointer, that.visibleWindows.get()]);
    
    $(document).trigger('ilex-slider-slidingStarted');
    that.table.animate({'left': slide}, {
      'progress': function () {
        $(document).trigger('canvasRedraw');
      },
      'done': function () {
        $(document).trigger('ilex-slider-slidingFinished');
        if (callback) {
          callback();
        }
      }
    });
  };

  that.slideRight = function (callback, winInd) {
    if (that.windowPointer === 0) {
      return;
    }
    //break if some animation in progress
    if (that.table.is(':animated')) {
      return;
    }
    
    that.visibleWindows.setEqualWindowPositions();
    ilex.applySize();
    
    if (winInd === undefined) {
      winInd = that.windowPointer - 1;
    }
    
    
    var flyOver = that.windowPointer - winInd,
      tablePos = that.table.position();
    
    var slide = that.table.position().left;
    for (let i = 0; i < flyOver; i++) {
      //move to next window
      that.windowPointer -= 1;
      let prev_width = that.windows.get(that.windowPointer).getWidth();
      //swap positions
      that.visibleWindows.shiftRight();
      let diff = that.windows.get(that.windowPointer).getWidth() - prev_width;
      slide += that.windows.get(that.windowPointer).getWidth() +
                  ilex.widgetsCollection.handlerSize - diff;
    }
    
    ilex.applySize();
    
    $(document).trigger('ilex-slider-viewChanged',
                        [that.windowPointer, that.visibleWindows.get()]);
    
    $(document).trigger('ilex-slider-slidingStarted');
    that.table.animate({'left': slide}, {
      'progress': function () {
        $(document).trigger('canvasRedraw');
      },
      'done': function () {
        $(document).trigger('ilex-slider-slidingFinished');
        if (callback) {
          callback();
        }
      }
    });
  };
  
  that.slideTo = function (windowPointer, callback) {
    if (windowPointer < 0 || windowPointer >= that.windows.length) {
      console.log('that.slideTo: windowPointer ' + windowPointer + ' out of bound');
      return;
    }
    //last windows
    if (windowPointer + that.visibleWindows.get() >= that.windows.length) {
        windowPointer = that.windows.length - that.visibleWindows.get();
    }
    
    if (windowPointer > that.windowPointer) {
      that.slideLeft(callback, windowPointer);
    } else if (windowPointer < that.windowPointer) {
      that.slideRight(callback, windowPointer);
    }
  };
  
//  that.updateAllLinks = function () {
//    for (var i = 0; i <= that.windows.length; i++) {
//      var curWin = that.windows.get(i),
//          curWidget = curWin.contentWidget;
//      if (curWidget.isLinkable()) {
//        //block edition while updating
//        curWidget.textEditor.allowChanges = false;
//        that.documentLinks.load(params.newLinks, function () {
//          that.clearLinks();
//          //load links
//          let resolved = that.documentLinks.getResolved();
//          for (let resolvedLink of resolved) {
//            that.setLink(resolvedLink);
//          }
//          
//          $(document).trigger('canvasRedraw');
//          
//          that.textEditor.allowChanges = true;
//        });
//      }
//    }
//  };
  
  $(document).on('ilex-linkClicked', function(event, windowObject, resolvedLink) {
    var createDocInfoObj = function(docId, ver) {
      return {
        'docId': docId,
        'ver': ver,
        'equals': function (b) {
          if (this.docId === b.docId && this.ver === b.ver) {
            return true;
          }
          return false;
        }
      }
    };
    var docInfo = function(winObj) {
      if (winObj === undefined) {
        return createDocInfoObj(-1, -1);
      } else {
        var contentWidget = winObj.contentWidget,
            docId = contentWidget.getFileInfo('id'),
            ver = contentWidget.getVersion();
        return createDocInfoObj(docId, ver);
      }
    };
    //When jumping on link resol it one more time to get the lastest
    //possible version!
    var halfLink = resolvedLink;
    ilex.server.linkGetLR(resolvedLink, function (msg) {
      var docId = msg.documentId,
          ver = msg.versionNo,
          leftWindow = that.windows.get(windowObject.getInd() - 1),
          rightWindow = that.windows.get(windowObject.getInd() + 1),
          leftInfo = docInfo(leftWindow),
          halfLinkInfo = createDocInfoObj(docId, ver),
          rightInfo = docInfo(rightWindow);
      
      //document to the right
      if (halfLinkInfo.equals(rightInfo)) {
        if (!rightWindow.isVisible()) {
          if (that.visibleWindows.get() === 1) {
            that.visibleWindows.inc();
            ilex.applySize(true, false, '*', function () {
              rightWindow.scrollTo(halfLink);
            });
          } else {
            that.slideLeft(function () {
              rightWindow.scrollTo(halfLink);
            });
          }
        } else {
          rightWindow.scrollTo(halfLink);
        }
      } else if (halfLinkInfo.equals(leftInfo)) {
        if (!leftWindow.isVisible()) {
          if (that.visibleWindows.get() === 1) {
            that.visibleWindows.inc();
            ilex.applySize(false, false, '*', function () {
              that.slideRight(function () {
                leftWindow.scrollTo(halfLink);
              });
            });
          } else {
            that.slideRight(function () {
              leftWindow.scrollTo(halfLink);
            });
          }
        } else {
          leftWindow.scrollTo(halfLink);
        }
      } else {
        let newWindow = that.createWindow();
        that.addWindowAfter(newWindow, windowObject.getInd());
        ilex.tools.mime.loadDocument(newWindow, docId, ver,
          function () {
            if (!newWindow.isVisible()) {
              if (that.visibleWindows.get() === 1) {
                that.visibleWindows.inc();
                ilex.applySize(true, false, '*', function () {
                  newWindow.scrollTo(halfLink);
                });
              } else {
                that.slideLeft(function () {
                  newWindow.scrollTo(halfLink);
                });
              }
            } else {
              $(document).trigger('ilex-slider-viewChanged', [that.windowPointer, that.visibleWindows.get()]);
             newWindow.scrollTo(halfLink);
            }

        });
      }

    });
    
//    var getWindowDocumentId = function(windowObject) {
//      if (windowObject !== undefined &&
//          windowObject.contentWidget !== undefined &&
//          typeof windowObject.contentWidget.getFileInfo === 'function') {
//        return windowObject.contentWidget.getFileInfo('id');
//      }
//      return null;
//    };
//    var loadAndScroll = function(win, documentId, version, callback) {
//      if (getWindowDocumentId(win) === documentId) {
//        win.contentWidget.loadVersion(version, callback);
//      } else {
//        win.closeDocument();
//        ilex.tools.mime.loadDocument(win, documentId, version, callback);
//      }
//    };
//    let newWindow = that.createWindow();
//    that.addWindowAfter(newWindow, windowObject.getInd());
//
//    loadAndScroll(newWindow,
//      haflLink.DocumentId,
//      haflLink.versionNo);
    
//    var closeWindowsAfter = function (windowObj) {
//      if (windowObj === undefined) {
//        return;
//      }
//      
//      for (let i = that.windows.length - 1; i > windowObj.getInd(); i -= 1) {
//        let win = that.windows.get(i);
//        win.remove();
//      }
//    };
//    
//    //1
//    if (that.visibleWindows.get() === 1) {
//      let rightWindow = that.windows.get(windowObject.getInd() + 1),
//          leftWindow = that.windows.get(windowObject.getInd() - 1);
//      
//      //1.1
//      if (getWindowDocumentId(rightWindow) === link.to.documentId) {
//        loadAndScroll(rightWindow,
//          link.to.documentId,
//          link.to.versionNo,
//        function () {
//          that.visibleWindows.inc();
//          ilex.applySize();
//        });  
//      //1.2
//      } else if (getWindowDocumentId(leftWindow) === link.to.documentId) {
//        loadAndScroll(leftWindow,
//          link.to.documentId,
//          link.to.versionNo,
//        function () {
//          that.visibleWindows.inc();
//          that.slideRight();
//        });
//      //1.3
//      } else {
//        let newWindow = that.createWindow();
//        that.addWindowAfter(newWindow, windowObject.getInd());
//        closeWindowsAfter(newWindow);
//        
//        loadAndScroll(newWindow,
//          link.to.documentId,
//          link.to.versionNo,
//        function () {
//          that.visibleWindows.inc();
//          ilex.applySize();
//        });
//      }
//    //2.1, 2.2, 2.3
//    } else if (that.visibleWindows.get() === 2
//                 && windowObject.getInd() === that.windowPointer) {
//      let rightWindow = that.windows.get(windowObject.getInd() + 1),
//          leftWindow = that.windows.get(windowObject.getInd() - 1);
//      //2.1
//      if (getWindowDocumentId(rightWindow) === link.to.documentId) {
//        loadAndScroll(rightWindow,
//          link.to.documentId,
//          link.to.versionNo);
//      //2.2
//      } else if (getWindowDocumentId(leftWindow) === link.to.documentId) {
//        loadAndScroll(leftWindow,
//          link.to.documentId,
//          link.to.versionNo,
//        function () {
//          that.slideRight();
//        });
//      //2.3
//      } else {
//        let newWindow = that.createWindow();
//        that.addWindowAfter(newWindow, windowObject.getInd());
//        
//        closeWindowsAfter(newWindow);
//        
//        loadAndScroll(newWindow,
//          link.to.documentId,
//          link.to.versionNo);
//      }
//    //2.4, 2.5, 2.6
//    } else if (that.visibleWindows.get() === 2
//                 && windowObject.getInd() === that.windowPointer + 1) {
//      let rightWindow = that.windows.get(windowObject.getInd() + 1),
//            leftWindow = that.windows.get(windowObject.getInd() - 1);
//      //2.4
//      if (getWindowDocumentId(leftWindow) === link.to.documentId) {
//        loadAndScroll(leftWindow,
//          link.to.documentId,
//          link.to.versionNo);
//      //2.5
//      } else if (getWindowDocumentId(rightWindow) === link.to.documentId) {
//        loadAndScroll(rightWindow,
//          link.to.documentId,
//          link.to.versionNo,
//        function () {
//          that.slideLeft();
//        });
//      //2.6
//      } else {
//        let newWindow = that.createWindow();
//        that.addWindowAfter(newWindow, windowObject.getInd());
//        closeWindowsAfter(newWindow);
//        
//        loadAndScroll(newWindow,
//          link.to.documentId,
//          link.to.versionNo,
//        function () {
//           that.slideLeft();
//        });
//      }
//    }
  });
  

  let win = that.createStarterWindow();
  that.addWindowAfter(win);
  that.visibleWindows.inc();
  
  $(document).on('ilex-openDocument', function (event, file, afterInd) {
      //by default newest version
      //get new document
      var win = that.createWindow();
      that.addWindowBefore(win, that.windowPointer + that.visibleWindows.get());
       
      ilex.tools.mime.loadDocument(win, file.id);
      that.slideLeft();
    });
  
  $(document).on('ilex-slider-swapWindows', function (event, ind1, ind2) {
    that.swapWindows(ind1, ind2);
  });
  
  $(document).on('ilex-slider-setWindowPointer', function (event, windowPointer) {
    that.slideTo(windowPointer);
  });
  
  $(document).on('ilex-slider-goToNewDocumentTab', function (event) {
    var starterWidget = that.windows.last().widget.children(':first');

    if (!starterWidget.hasClass('ilex-starterWidget')) {
      //check if starter widget visible on the right
      let win = that.createStarterWindow();
      that.addWindowAfter(win);
    }
    that.slideTo(that.windows.last().getInd());
  });
  
  
  //create buttons
  let fontSize = '20px';
  ilex.widgetsCollection.verticalToolbar(that.leftButtons, [
    { 'html': '<span class="ilex-awesome" style="font-size: '+fontSize+'">&#xf104;</span>',
      'callback': function(event) {
        that.slideRight();
      }
    },
    //Freeze window
//    {
//      'html': '<span class="ilex-awesome" style="font-size: '+fontSize+'">&#xf152;</span>',
//      'htmlOn': '<span class="ilex-awesome" style="font-size: '+fontSize+'">&#xf191;</span>',
//      'callbackOn': function(event) {
//        var width = that.container.data('ilex-width'),
//            offset = that.table.offset(),
//            win = that.windows.get(that.windowPointer).detach(),
//            winWidth = win.getWidth();
//        
//        that.superTable.setColumnWidth(0, winWidth);
//        win.element.css('z-index', 10);
//        
//        //save frozen window object
//        that.froozenWindow = win;
//        that.frozenContainer.append(win.element);
//        
//        that.container.data('ilex-width', width - winWidth);
//        that.table.css('left', offset.left + winWidth);
//        
//        that.visibleWindows.dec();
//        ilex.applySize();
//      },
//      'callbackOff': function(event) {
//        var width = that.container.data('ilex-width'),
//            frozenWidth = that.frozenContainer.data('ilex-width'),
//            offset = that.table.offset();
//        
//        that.addWindowBefore(that.froozenWindow, that.windowPointer);
//        that.froozenWindow = null;
//        
//        that.visibleWindows.inc();
//        
//        that.superTable.setColumnWidth(0, 0);
//        
//        that.container.data('ilex-width', width + frozenWidth);
//        that.table.css('left', offset.left - frozenWidth);
//        
//        //applyWindowPosition();
//        ilex.applySize();
//      }
//    }
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
      $(document).trigger('ilex-slider-slidingStarted');
      ilex.applySize(true, false, '*', function () {
        $(document).trigger('ilex-slider-slidingFinished');
      });
     }
   },
   //remove
   {'html': '<span class="ilex-awesome" style="font-size: '+fontSize+'">&#xf068;</span>',
    'callback': function(event) {
      if (that.visibleWindows.get() === 1) {
        return;
      }
  
      that.visibleWindows.dec();
      $(document).trigger('ilex-slider-slidingStarted');
      ilex.applySize(true, false, '*', function () {
        $(document).trigger('ilex-slider-slidingFinished');
      });
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
