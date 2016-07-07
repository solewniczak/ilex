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
       } else {
          this.span = selection.anchorNode.parentElement;
          this.position = selection.anchorOffset;
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
        updateOffsets = function ($span, num) {
          $span.nextAll().each(function () {
            var startOffset = $(this).data('ilex-startoffset'),
              endOffset = $(this).data('ilex-endoffset');

            $(this).data('ilex-startoffset', startOffset + num);
            $(this).data('ilex-endoffset', endOffset + num);
          });
        },
        insertAfterCursor = function(str) {
          var text = cursor.span.textContent;

          //update offsets
          let $span = $(cursor.span);
          $span.data('ilex-endoffset', $span.data('ilex-endoffset') + str.length);
          updateOffsets($span, str.length);
          //index of charter AFTER which we insert new string
          ilex.server.action.documentAddText(windowObject.id,
                                    cursor.position - 1 + $span.data('ilex-startoffset'), str);
                    
          cursor.span.textContent = text.slice(0, cursor.position) + str +
                                    text.slice(cursor.position);
          cursor.position += str.length;
        },
        updateAfterRemove = function(relPosition) {
          //update offsets
          let $span = $(cursor.span);
          $span.data('ilex-endoffset', $span.data('ilex-endoffset') - 1);
          updateOffsets($span, -1);

          ilex.server.action.documentRemoveText(windowObject.id,
                                        relPosition + $span.data('ilex-startoffset'), 1);
        },
        jumpToNextSpan = function() {
          let nextSpan = cursor.span.nextElementSibling;

          if (cursor.span.textContent.length === 0) {
            cursor.span.remove();
          }
          cursor.span = nextSpan;
          cursor.position = 0;
        },
        jumpToPrevSpan = function() {
          let prevSpan = cursor.span.previousElementSibling;

          if (cursor.span.textContent.length === 0) {
            cursor.span.remove();
          }
          cursor.span = prevSpan;
          cursor.position = cursor.span.textContent.length;
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
      if (cursor.position !== 0 || cursor.span.previousElementSibling !== null) {
        //remove span
        if (cursor.position === 0) {
          jumpToPrevSpan();
        }

        //update offsets
        updateAfterRemove(cursor.position - 1);

        let text = cursor.span.textContent;
        cursor.span.textContent = text.slice(0, cursor.position - 1) +
                              text.slice(cursor.position);
        cursor.position -= 1;

        //if we backspaced last charter from span remove it
        if (cursor.span.textContent.length === 0) {
          if (cursor.span.previousElementSibling !== null) {
            jumpToPrevSpan();
          } else {
            jumpToNextSpan();
          }
        }
      }
    } else if (event.key === 'Delete') {
      //we are not at the end of file
      if (cursor.span.nextElementSibling !== $custos[0]) {
        //we are before new span
        if (cursor.position === cursor.span.textContent.length) {
          jumpToNextSpan();
        }

        //update offsets
        updateAfterRemove(cursor.position);

        let text = cursor.span.textContent;
        cursor.span.textContent = text.slice(0, cursor.position) +
                                    text.slice(cursor.position + 1);

        //if we deleted last charter from span remove it
        if (cursor.span.textContent.length === 0) {
          jumpToNextSpan();
        }
      }
      //position does not change
    } else if (event.key === 'Enter') {
      insertAfterCursor('\n');
    } else if (event.key === 'Tab') {
      insertAfterCursor('\t');
    } else {
       insertAfterCursor(event.key);
    }
    selection.collapse(cursor.span.childNodes[0], cursor.position);
    
    //prevent default contenteditable behaviour
    return false;
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
