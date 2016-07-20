'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.console !== undefined)
  throw 'ilex.widgetsCollection.console already defined';


//params {width: , height:, top: , left:, label: }
ilex.widgetsCollection.floatingWindow = function (params) {
  var that = {};
  
  params = params || {};
  params.label = params.label || '';
  params.width = params.width || 300;
  params.height = params.height || 200;
  params.top = params.top || $(window).height()/2 - params.height/2;
  params.left = params.left || $(window).width()/2 - params.width/2;
  params.zIndex = params.zIndex || 10;
  
  that.element = $('<div class="ilex-floatingWindow">').appendTo("body")
                  .css('position', 'absolute')
                  .width(params.width)
                  .height(params.height)
                  .css('z-index', params.zIndex)
                  .offset({'top': params.top, 'left': params.left})
                  .css('background', '#000')
                  .hide();
  
  var barHeight = 32,
      borderWidth = 3;
  
  that.bar = $('<div class="ilex-windowBar">').appendTo(that.element)
                  .css('position', 'absolute')
                  .offset({'top': borderWidth, 'left': borderWidth})
                  .width(params.width - 2*borderWidth)
                  .height(barHeight)
                  .data('ilex-width', params.width - 2*borderWidth)
                  .data('ilex-height', barHeight)
                  .css('background', '#ccc');
  
  let barTop = borderWidth + barHeight;
  that.content = $('<div class="ilex-windowContent">').appendTo(that.element)
                  .css('position', 'absolute')
                  .offset({'top': barTop, 'left': borderWidth})
                  .width(params.width - 2*borderWidth)
                  .height(params.height - barTop - borderWidth)
                  //for content widgets
                  .data('ilex-width', params.width - 2*borderWidth)
                  .data('ilex-height', params.height - barTop - borderWidth)
                  .css('background', '#fff');
  
  that.barDock = {};
  that.barDock.container = $('<div class="ilex-barDock">').appendTo(that.bar);
  that.barToolbar = ilex.widgetsCollection.toolbar(that.barDock);
  //close window button
  that.barToolbar.addButton('<span class="ilex-awesome">&#xf00d;</span>', function(event) {
    that.element.hide();
  });

  //prevent dragging while clicking buttons
  that.barToolbar.container.on('mousedown', '.ilex-button', function(event) {
    event.stopPropagation();
  });
  
  that.label = $('<span class="ilex-windowLabel">').appendTo(that.barToolbar.container)
                                                    .text(params.label);
  
  var mouse = {
    'isDown': false,
    'drag': function (cursor) {
      this.isDown = true;
    },
    'setCursor': function (cursor) {
      if (this.isDown === false) {
        $('body').css('cursor', cursor);
      }
    },
    'resizeCursor': function () {
      var cursor = this.getCursor();
      if (cursor.indexOf('resize') > -1) {
        return true;
      }
      return false;
    },
    'getCursor': function () {
      return $('body').css('cursor');
    },
    'drop': function(){
      $('body').css('cursor', 'initial');
      this.isDown = false;
      this.resize = false;
    }
  }
  
  //moving window
  that.bar.on('mousedown', function(event) {
    var offset = that.element.offset(),
        startX = event.pageX,
        startY = event.pageY;
    
    mouse.setCursor('move');
    mouse.drag();
    
    //prevent selectin while moving
    $(document).on('selectstart.ilex.floatingWindow', function(event) {
      event.preventDefault();
    });
    $(document).on('mouseup.ilex.floatingWindow', function () {
      $(document).off('selectstart.ilex.floatingWindow');
      $(document).off('mouseup.ilex.floatingWindow');
      $(document).off('mousemove.ilex.floatingWindow');
      mouse.drop();
    });
    $(document).on('mousemove.ilex.floatingWindow', function(event) {
      //calculate new position
      var deltaX = startX - event.pageX,
          deltaY = startY - event.pageY,
          newTop = offset.top - deltaY,
          newLeft = offset.left - deltaX;

      if (newTop < 0) {
        newTop = 0;
      } else if (newTop > $(window).height() - (barHeight + borderWidth)) {
        newTop = $(window).height() - (barHeight + borderWidth);
      }
      
      if (newLeft < 0) {
        newLeft = 0;
      } else if (newLeft > $(window).width() - that.element.width()) {
        newLeft = $(window).width() - that.element.width();
      }
      
      that.element.offset({top: newTop, left: newLeft});
      //prevent text selection while resizing
      event.preventDefault();
    });
  });
  
  var cursor = 'initial';
  //resizing window
  that.element.on('mousemove', function(event) {
    //corners
    //nr of px 
    var cornerScope = 10,
        windowOffset = that.element.offset(),
        corner = {};
    corner.topLeft = {'top': windowOffset.top,
                      'left': windowOffset.left};
    corner.topRight = {'top': windowOffset.top,
                       'left': windowOffset.left + that.element.width()};
    corner.bottomLeft = {'top': windowOffset.top + that.element.height(),
                        'left': windowOffset.left};
    corner.bottomRight = {'top': windowOffset.top + that.element.height(),
                        'left': windowOffset.left + that.element.width()};
    
    var mouseOverBorder = function() {
      //left
      if (event.pageX <= windowOffset.left + borderWidth) {
        return 'w-resize';
        //right
      } else if (event.pageX >= windowOffset.left + that.element.width() - borderWidth) {
        return 'e-resize';
        //top
      } else if (event.pageY <= windowOffset.top + borderWidth) {
        return 'n-resize';
        //bottom
      } else if (event.pageY >= windowOffset.top + that.element.height() - borderWidth) {
        return 's-resize';
      }
      return null;
    },
    //works ONLY WHEN cursor !== null
    mouseOverCorner = function(cursor) {
      if (event.pageY <= corner.topLeft.top + cornerScope && 
          event.pageX <= corner.topLeft.left + cornerScope) {
        return 'nw-resize';
      }
      if (event.pageY <= corner.topLeft.top + cornerScope && 
          event.pageX >= corner.topLeft.left + that.element.width() - cornerScope) {
        return 'ne-resize';
      }
      if (event.pageY >= corner.topLeft.top + that.element.height() - cornerScope && 
          event.pageX <= corner.topLeft.left + cornerScope) {
        return 'sw-resize';
      }
      if (event.pageY >= corner.topLeft.top + that.element.height() - cornerScope && 
          event.pageX >= corner.topLeft.left + that.element.width() - cornerScope) {
        return 'se-resize';
      }
      return cursor;
    };
    
    let cursor = mouseOverBorder();
    if (cursor !== null) {
      cursor = mouseOverCorner(cursor);
      mouse.setCursor(cursor);
    } else {
      mouse.setCursor('initial');
    }
  });
  
  //resize      
  that.element.on('mousedown', function(event) {
    if (mouse.resizeCursor()) {
      var cursor = mouse.getCursor();
      mouse.drag();
      var startOffset = that.element.offset(),
          startWidth = that.element.width(),
          startHeight = that.element.height(),
          startX = event.pageX,
          startY = event.pageY;
      
      //prevent selectin while moving
      $(document).on('selectstart.ilex.floatingWindow', function(event) {
        event.preventDefault();
      });
      $(document).on('mouseup.ilex.floatingWindow', function () {
        $(document).off('selectstart.ilex.floatingWindow');
        $(document).off('mouseup.ilex.floatingWindow');
        $(document).off('mousemove.ilex.floatingWindow');
        mouse.drop();
      });
      $(document).on('mousemove.ilex.floatingWindow', function(event) {
        //calculate new size
        var deltaX = startX - event.pageX,
            deltaY = startY - event.pageY,
            newWidth = startWidth,
            newHeight = startHeight,
            newX = startOffset.left,
            newY = startOffset.top;
        var wResize = function() {
          newWidth = startWidth + deltaX;
          newX = startOffset.left - deltaX;
        }, eResize = function () {
          newWidth = startWidth - deltaX;
        }, nResize = function () {
          newHeight = startHeight + deltaY;
          newY = startOffset.top - deltaY;
        }, sResize = function() {
          newHeight = startHeight - deltaY;
        }
        if (cursor === 'w-resize') {
          wResize();
        } else if (cursor === 'e-resize') {
          eResize();
        } else if (cursor == 'n-resize') {
          nResize();
        } else if (cursor == 's-resize') {
          sResize();
        } else if (cursor == 'nw-resize') {
          nResize();
          wResize();
        } else if (cursor == 'ne-resize') {
          nResize();
          eResize();
        } else if (cursor == 'se-resize') {
          sResize();
          eResize();
        } else if (cursor == 'sw-resize') {
          sResize();
          wResize();
        }
        
        
        that.element.width(newWidth).height(newHeight)
                    .offset({'top': newY, 'left': newX});
        
        //resize window elements
        that.element.trigger('windowResize');

        //prevent text selection while resizing
        event.preventDefault();
      });
    }
  });
  
  that.element.on('mouseleave', function() {
     mouse.setCursor('initial');
  });

  that.element.on('windowResize', function() {
    var width = $(this).width() - 2*borderWidth,
        height = $(this).height() - 2*borderWidth - barHeight;
    
    that.bar.width(width);
    that.bar.data('ilex-width', width);
    
    that.content.width(width);
    that.content.height(height);
    that.content.data('ilex-widht', width);
    that.content.data('ilex-height', height);
    
    that.element.find('.ilex-resize').trigger('windowResize');
  });
  
  that.show = function() {
    that.element.show();
  };
  
  that.remove = function () {
    that.element.remove();
  };

  return that;
}
