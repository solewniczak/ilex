'use strict';

//requires: ilex.canvas
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.text !== undefined)
  throw 'ilex.widgetsCollection.horizontalSplit already defined';

ilex.widgetsCollection.text = function (windowObject, canvas) {
  if (canvas === undefined)
    throw 'canvas undefined';
  var that = {},
    width = windowObject.element.data('ilex-width'),
    height = windowObject.element.data('ilex-height');

  that.container = $('<div class="ilex-resize ilex-text">')
                  .data('ilex-width', width)
                  .data('ilex-height', height);
  windowObject.element.html(that.container);

  that.setAlternateTextWidget = function (widget) {
    that.container.data('ilex-alternate', widget);
  };

  that.dock = {};
  that.dock.container = $('<div class="ilex-dock">').appendTo(that.container)
                          .data('ilex-width', width);
                          //height depends on button's sizes


  that.scrollWindow = $('<div class="ilex-scrollWindow">')
                  .appendTo(that.container)
                  .css('overflow', 'auto')
                  .css('overflow-x', 'hidden')
                  .data('ilex-width', width)
                  .data('ilex-height', height - that.dock.container.height());

  that.content = $('<div class="ilex-content">').appendTo(that.scrollWindow)
                //proper new line handling
                .css('white-space', 'pre-wrap')
                .data('ilex-height', height - that.dock.container.height())
                .attr('contenteditable', 'true')
                .attr('spellcheck', 'false');
  //initial span
  var $initialSpan = ilex.tools.markup.createIlexSpan().appendTo(that.content)
                                  .data('ilex-startoffset', 0)
                                  .data('ilex-endoffset', 0);
  //new lines custos
  var $custos = $('<div class="ilex-newlineGuard"><br></div>').appendTo(that.content);

  //add toolbar at the end to give it access to entre text object
  that.dock.toolbar = ilex.widgetsCollection.textToolbar(that.dock.container, that, canvas);

  var cursor = {
    'span': null,
    'position': 0,
    'atTheEnd': false,
    //update cursor using current Selection
    'needsUpdate': false,
     'update': function () {
       var selection = window.getSelection();

       //we are in custos div
       if (selection.anchorNode === $custos[0]) {
         this.span = that.content.find('span:last')[0],
         selection.collapse(this.span.childNodes[0], this.span.textContent.length);
       }
       //we are in main div
       if (selection.anchorNode === that.content[0]) {
          this.span = $initialSpan[0];
          this.position = 0;
          this.atTheEnd = true;
       } else {
          this.span = selection.anchorNode.parentElement;
          this.position = selection.anchorOffset;
          if (this.span.nextSibling === null && this.position === this.span.textContent.length) {
            cursor.atTheEnd = true;
          } else {
            this.atTheEnd = false;
          }
       }
       this.needsUpdate = false;
    }
  };
 
  
  //There cannot be empty spans in ilex document
  that.content.on('mouseup', function(event) {
    cursor.update();
  });
  
  that.content.on('keydown', function(event) {
    var selection = window.getSelection(),
        insertAfterCursor = function(str) {
          var text = cursor.span.textContent;
          cursor.span.textContent = text.slice(0, cursor.position) + str +
                                    text.slice(cursor.position);
          cursor.position += str.length;
        };

    //default behaviour
    //https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
    if (
        event.key === 'Alt' ||
        event.key === 'AltGraph' ||
        event.key === 'Cancel' ||
        event.key === 'CapsLock' ||
        event.key === 'Clear' || 
        event.key === 'Convert' ||
        event.key === 'Escape' ||
        event.key === 'Pause' ||
        event.key === 'PageUp' || //there is no pages in hypertext
        event.key === 'PageDown' ||
        event.key === 'ScrollLock' || //maybe we should handle it in good old way :)
        event.key === 'Shift' ||
        event.key === 'Unidentified'
      ) {
      return true;
    }
    if (
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight' ||
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' ||
        event.key === 'Home' ||
        event.key === 'End'
      ) {
      //selection change
      cursor.needsUpdate = true;
      return true;
    }
    if (cursor.needsUpdate) {
      cursor.update();
    }
    //Disable Ctrl shortcouts
    if (event.ctrlKey) {
      return false;
    } else if (event.key === 'Backspace') {
      //remove span
      if (cursor.position === 0) {
        let prevSpan = cursor.span.previousElementSibling;
        
        //do not remove last element
        if (prevSpan !== null && cursor.span.textContent.length === 0) {
          cursor.span.remove();
        }
        cursor.span = prevSpan;
        cursor.position = prevSpan.textContent.length;
        
      }
      let text = cursor.span.textContent;
      cursor.span.textContent = text.slice(0, cursor.position - 1) +
                                  text.slice(cursor.position);
      cursor.position -= 1;
      
      /*let text = cursor.span.textContent;
       console.log(text);
      if (cursor.atTheEnd) {
        cursor.span.textContent = text.slice(0, -1);
        cursor.position -= 1;
        //new line is next charter
        if (text[cursor.position - 1] === '\n') {
          //remove new line from span
          cursor.span.textContent = text.slice(0, -1);
          let $span = ilex.tools.markup.createIlexSpan().appendTo(that.content)
                                  .text('\n')
                                  .css('display', 'block')
                                  .data('ilex-startoffset', 0)
                                  .data('ilex-endoffset', 0);
        
            cursor.span = $span[0];
            cursor.position = 0;
        }
      } else {
        cursor.span.textContent = text.slice(0, cursor.position - 1) +
                                  text.slice(cursor.position);
        cursor.position -= 1;
      }*/
    } else if (event.key === 'Enter') {
      insertAfterCursor('\n');
      /*if (cursor.atTheEnd) {
        let $span = ilex.tools.markup.createIlexSpan().appendTo(that.content)
                                  .append('<br>')
                                  .css('display', 'block')
                                  .data('ilex-startoffset', 0)
                                  .data('ilex-endoffset', 0);
        
        cursor.span = $span[0];
        cursor.position = 0;
      }*/
    } else {
      if (event.key === 'Tab') {
        insertAfterCursor('\t');
      } else {
        insertAfterCursor(event.key);
      }
      //only if it's not last span
      //if (cursor.span.nextElementSibling !== null) {
        $(cursor.span).css('display', 'inline');
//      }
    }
    selection.collapse(cursor.span.childNodes[0], cursor.position);
    
    //prevent default contenteditable behaviour
    return false;
  });

  that.content.on('keypress', function(event) {
    

    
//    let selection = window.getSelection(),
//      character, position, $parentSpan;
//
//    //when we are outside span
//    if (selection.anchorNode === that.content[0] && event.which !== 0) {
//      $parentSpan = that.content.find('span:first');
//      character = String.fromCharCode(event.which);
//      position = 0;
//      $parentSpan.append(character);
//      selection.collapse($paretnSpan[0].childNodes[0], 1);
//    } else {
//      $parentSpan = $(selection.anchorNode.parentNode);
//      if (event.keyCode === 13) {
//
//        character = '\n';
//        position = selection.anchorOffset;
//
//        if ($parentSpan.is(that.content.find('span:last'))) {
//        /*  if ($anchorParent.text().slice(-1) !== '\n'
//              && selection.anchorOffset === $anchorParent.text().length) {
//            document.execCommand('insertHTML', false, '\n');
//          }*/
//
//          document.execCommand('insertHTML', false, '\n');
//
//          let offset = that.content.offset();
//          let lineHeight = parseInt($anchorParent.css('line-height'));
//
//          //if new line is hidden scroll to it
//          if (selRange.getClientRects()[1].bottom - offset.top >=
//              that.scrollWindow.scrollTop() + that.scrollWindow.height() - lineHeight) {
//            that.scrollWindow.scrollTop(that.scrollWindow.scrollTop() + lineHeight);
//          }
//          //that.scrollWindow.scrollTop(that.scrollWindow[0].scrollHeight);
//        } else {
//          document.execCommand('insertHTML', false, '\n');
//        }
//      } else if (event.which !== 0) {
//        character = String.fromCharCode(event.which);
//        position = selection.anchorOffset;
//        document.execCommand('insertHTML', false, String.fromCharCode(event.which));
//      }
//    }
    //update offsets
//    $parentSpan.data('ilex-endoffset', $parentSpan.data('ilex-endoffset') + 1);
//    $parentSpan.nextAll().each(function () {
//      var startOffset = $(this).data('ilex-startoffset'),
//        endOffset = $(this).data('ilex-endoffset');
//
//      $(this).data('ilex-startoffset', startOffset+1);
//      $(this).data('ilex-endoffset', endOffset+1);
//    });
//    ilex.server.action.charAdd(windowObject.id,
//                              position + $parentSpan.data('ilex-startoffset'),
//                              character);
//    event.preventDefault();
  });

  //draw selection
  $(document).on('selectionchange', function(event) {
    var selection = window.getSelection(),
      active = $('.ilex-text:hover');
    if (active.length > 0 && selection.rangeCount >= 1) {
      $('.ilex-text').each(function () {
        if ($(this).is(that.container) && $(this).is(active)) {
          //update newest selection
          if (that.selectionRanges.length === 0) {
            that.selectionRanges[0] = selection.getRangeAt(0);
          } else {
            that.selectionRanges[that.selectionRanges.length - 1] = selection.getRangeAt(0);
          }
        }
      });
    }
    $(document).trigger('canvasRedraw');
  });


  that.loadText = function (text) {
    //Filling algorithm
    that.content.find('span')
                  .data('ilex-endoffset', text.length)
                  .text(text);
  };

  that.close = function () {
    ilex.view.console.log('document closed');
  }



  that.container.on('windowResize', function(event) {
    var width = that.container.parent().data('ilex-width'),
      height = that.container.parent().data('ilex-height');

    that.container.data('ilex-width', width);
    that.scrollWindow.data('ilex-width', width);
    that.dock.container.data('ilex-width', width);
    //that.content doesn't have fix width to react on scrollbar
    //show and hide


    that.container.data('ilex-height', height);
    //dock conatiner height does not choange
    //content height shrinks
    that.content.data('ilex-height', height - that.dock.container.height());
    that.scrollWindow.data('ilex-height', height - that.dock.container.height());
  });
  //allow multiple selection
  that.groupSelections = false;
  //nothing is selected at the begining
  that.selectionRanges = [];

  //we don't want standard browsers draging procedure
  //it confuses the users
  that.container.on('dragstart', function (event) {
    event.preventDefault();
  });

  //Ctrl + A doesn't work yet
  that.content.on('mouseup', function (event) {
    //selection finished, used by finishLinkButton
    that.container.trigger('selectend');
    //group ranges
    that.selectionRanges = ilex.tools.range.groupRanges(that.selectionRanges);
  });
  that.content.on('mousedown', function (event) {
    //we have to clear entire container to avoid 1 px artifact between
    //toolbar and content
    var containerOffset = that.container.offset(),
      widgetRect = canvas.createClientRect(containerOffset.left, containerOffset.top,
                                            that.container.data('ilex-width'),
                                            that.container.data('ilex-height'));
    //clean previous selection
    if (that.groupSelections === false) {
      that.selectionRanges = [];
    //start new selection
    } else {
      //create new range only when previously created is not collapsed
      if (that.selectionRanges.length === 0 ||
          that.selectionRanges[that.selectionRanges.length - 1].collapsed === false) {
        that.selectionRanges[that.selectionRanges.length] = document.createRange();
      }
    }

    $(document).trigger('canvasRedraw');
  });

  //redraw selections
  $(document).on('canvasRedraw', function(event) {
    var rects = [],
      scrollWindowOffset = that.scrollWindow.offset(),
      clipRect = canvas.createClientRect(scrollWindowOffset.left, scrollWindowOffset.top,
                                            that.scrollWindow.data('ilex-width'),
                                            that.scrollWindow.data('ilex-height'));


    //add all selection ranges to draw
    for (let range of that.selectionRanges) {
      let rects = ilex.tools.range.getClientRects(range, that),
        clientRects = canvas.clipClientRectList(clipRect, rects);
      for (let i = 0; i < clientRects.length; i++) {
        let rect = clientRects[i];
        canvas.drawRect(rect, '#a8d1ff');
      }
    }
  });

  //when user scrolls redraw the canvas
  that.scrollWindow.on('scroll', function (event) {
    $(document).trigger('canvasRedraw');
  });

  return that;
};
