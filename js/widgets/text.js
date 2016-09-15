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
  windowObject.widget.html(that.container);

  that.setAlternateTextWidget = function (widget) {
    that.container.data('ilex-alternate', widget);
  };

  that.dock = {};
  that.dock.container = $('<div class="ilex-dock">').appendTo(that.container)
                          .data('ilex-width', width);
                          //height depends on button's sizes


  that.scrollWindow = $('<div class="ilex-scrollWindow">')
                  .appendTo(that.container)
                  .css('overflow-y', 'auto')
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
  ilex.tools.markup.createIlexSpan().appendTo(that.content)
                                  .data('ilex-startoffset', 0)
                                  .data('ilex-endoffset', 0);
  //new lines custos
  //var $custos = $('<div class="ilex-custos"><br></div>').appendTo(that.content);

  //add toolbar at the end to give it access to entre text object
  //that.dock.toolbar = ilex.widgetsCollection.textToolbar(that.dock.container, that, canvas);
  that.dock.titleToolbar = ilex.widgetsCollection.toolbar(that.dock);
  that.dock.toolbar = ilex.widgetsCollection.toolbar(that.dock);
  
  //'Group selection' may be supported in futhure releses
  /*that.dock.toolbar.addButton('Group selections',
    function() {
      $(this).addClass('ilex-active');
      that.groupSelections = true;
    }, 
    function () {
      $(this).removeClass('ilex-active');
      that.groupSelections = false;
    }
  );*/

  var cursor = new Proxy({
    'span': null,
    'position': 0,
    
    //update cursor using current Selection
    'needsUpdate': false,
    'update': function () {
      var selection = window.getSelection();
//      if (selection.anchorNode === $custos[0]) {
//        this.span = that.content.find('span:last')[0],
//        selection.collapse(this.span.childNodes[0], this.span.textContent.length);
//      //we are in main div
//      } else
    
      //we are in main div
      if (selection.anchorNode === that.content[0]) {
        this.span = that.content.find('span')[0];
        this.position = 0;
      } else {
        this.span = selection.anchorNode.parentElement;
        this.position = selection.anchorOffset;
      }
      this.needsUpdate = false;
    },
    'toSelection':  function () {
      var selection = window.getSelection();
      selection.collapse(this.span.childNodes[0], this.position);
    }
  },
  //proxy handlers
  {
    set: function(obj, prop, value) {
      if (prop === 'span') {
        let span = value;
        that.content.find('span').css('outline', '0');
        $(span).css('outline', '1px solid rgba(0, 0, 0, 0.3)');
        if ($(span).hasClass('ilex-connection')) {
          console.log(span.classList);
        }
      }
      
      //the default behaviour
      obj[prop] = value;
      return true;
    }
  });

  
  that.dock.toolbar.addButton('Escape link',
  function(event) {
    var span = cursor.span;
    if ($(span).hasClass('ilex-connection')) {
//      if (span.nextElementSibling !== $custos[0]) {
//        cursor.span = span.nextElementSibling;
//      } else {
//        cursor.span = ilex.tools.markup.createIlexSpan().insertAfter(span)[0];
//      }
        if (span.nextElementSibling !== null) {
            cursor.span = span.nextElementSibling;
        } else {
            cursor.span = ilex.tools.markup.createIlexSpan().insertAfter(span)[0];
        }
      cursor.position = 0;
    }
    
    cursor.toSelection();
    //don't loose selection
    event.preventDefault();
  });
  
  //target - id, version, position, range
  that.createLink = function(target) {
    
  };
  
  that.dock.toolbar.addButton('Link left',
  function(button) {
    var leftWindow = windowObject.getWindow(windowObject.id-1);
    if (leftWindow !== undefined) {
      console.log(leftWindow);
    }
  });
  
  that.dock.toolbar.addButton('Link right',
  function(button) {
    var rightWindow = windowObject.getWindow(windowObject.id+1);
    if (rightWindow !== undefined) {
      that.createLink();
    }
  });
  
  that.dock.toolbar.addButton('Changes history',
  function(button) {
    that.changesHistoryWindow.show();
  });
  
  //document on the server
  that.document = null;
    
  that.changesHistoryWindow = ilex.widgetsCollection.floatingWindow();
  that.changesHistory = ilex.widgetsCollection.changesHistory(that.changesHistoryWindow);

  var fillChangesHistory = function () {
    that.document.getVersionsInfo(function (params) {
      console.log(params);
    });
  };

  //name input
  that.name = $('<input type="text">').appendTo(that.dock.titleToolbar.container)
  				.css('width', '250px');

  that.name.on('change', function () {
    //if we input to empty document, create new one
    if (that.document === null) {
      that.document = ilex.server.document(windowObject.tabId, that.name.val());
      fillChangesHistory();
    }
    that.document.changeName($(this).val());
  });

 
  
  //There cannot be empty spans in ilex document
  that.content.on('mouseup', function(event) {
    var selection = window.getSelection();
    if (selection.isCollapsed) {
      cursor.update();
    }
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
          that.document.addText(cursor.position - 1 + $span.data('ilex-startoffset'), str);
                    
          cursor.span.textContent = text.slice(0, cursor.position) + str +
                                    text.slice(cursor.position);
          cursor.position += str.length;
        },
        updateAfterRemove = function(relPosition, length) {
          length = length || 1;
          //update offsets
          let $span = $(cursor.span);
          $span.data('ilex-endoffset', $span.data('ilex-endoffset') - length);
          updateOffsets($span, -length);

          that.document.removeText(relPosition + $span.data('ilex-startoffset'), length);
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
        event.key === 'PageUp' || //there is no pages in hypertext :)
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
     //Disable Ctrl shortcouts
    if (event.ctrlKey) {
      return false;
    }
    
    //if we input to empty document, create new one
    if (that.document === null) {
      that.document = ilex.server.document(windowObject.tabId, that.name.val());
      fillChangesHistory();
    }
    
    
    let preventDeletion = false;
    //if we have slected range remove it first
    if (that.selectionRanges.length > 0 && that.selectionRanges[0].collapsed === false) {
      //the last selected range is our edit range
      //remove it from selection ranges
      let editRange = that.selectionRanges.pop(),
          startSpan = editRange.startContainer.parentElement,
          endSpan = editRange.endContainer.parentElement;
      
      cursor.span = startSpan;
      cursor.position = editRange.startOffset;
      
      if (startSpan === endSpan) {
        
        updateAfterRemove(editRange.startOffset, editRange.endOffset - editRange.startOffset);
               
        let text = startSpan.textContent;
        startSpan.textContent = text.slice(0, editRange.startOffset) +
                              text.slice(editRange.endOffset);
        
        //we have removed entire content
        if (startSpan.textContent.length === 0) {
          if (cursor.span.previousElementSibling !== null) {
            cursor.span = cursor.span.previousElementSibling;
            cursor.position = cursor.span.textContent.length;
            startSpan.remove();
          } else if (cursor.span.nextElementSibling !== null) {
            cursor.span = cursor.span.nextElementSibling;
            cursor.position = 0;
            startSpan.remove();
          //if curosr doesn't have previous and next element, it is only span and don't remove it.
          } else {
            cursor.span.appendChild(document.createTextNode(''));
          }
        }
        
      } else {
        let length = startSpan.textContent.length - editRange.startOffset,
            startOffset = editRange.startOffset;
       
        let elm = startSpan.nextElementSibling;
         //remove from start span
        if (editRange.startOffset === 0) {
          //start span is first span on the list
          if (startSpan.previousElementSibling === null) {
            cursor.span = endSpan;
            cursor.position = 0;
            $(endSpan).data('ilex-startoffset', $(startSpan).data('ilex-startoffset'));
          } else {
            cursor.span = startSpan.previousElementSibling;
            cursor.position = cursor.span.textContent.length;
          }
          
          startSpan.remove();
        } else {
          startSpan.textContent = startSpan.textContent.slice(0, editRange.startOffset);
        }
        while (elm !== endSpan) {
          let elmToRemove = elm;
          length += elm.textContent.length;
          elm = elm.nextElementSibling;
          elmToRemove.remove();
        }
        length += editRange.endOffset;
        
       
        if (editRange.endOffset === endSpan.textContent.length) {
          endSpan.remove();
          
          //create new ilex span
          if (that.content.find('span').length === 0) {
            let newSpan = ilex.tools.markup.createIlexLine().prependTo(that.content)
                                  .data('ilex-startoffset', 0)
                                  .data('ilex-endoffset', 0);
            cursor.span = newSpan[0];
            cursor.position = 0;
          }
        } else {
          endSpan.textContent = endSpan.textContent.slice(editRange.endOffset);
        }
        
        updateAfterRemove(startOffset, length);
      }
      
      that.selectionRanges = [];
      
      //we don't want backspace and delete
      preventDeletion = true;
    }

    //update curosr span if it was moved by arrow keys
    if (cursor.needsUpdate) {
      cursor.update();
    }
    
    if (event.key === 'Backspace') {  
      if (
          !(cursor.position === 0 && cursor.span.previousElementSibling === null) &&
          !preventDeletion
        ) {
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
      if (
          !(cursor.position === cursor.span.textContent.length &&
//            cursor.span.nextElementSibling === $custos[0]) &&
            cursor.span.nextElementSibling === null) &&
          !preventDeletion
        ) {
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
    
    cursor.toSelection();

    
    //prevent default contenteditable behaviour
    return false;
  });

  //draw selection
  $(document).on('selectionchange.ilex.text', function(event) {
    var selection = window.getSelection(),
      active = $('.ilex-content:hover');
    if (active.length > 0 && selection.rangeCount >= 1) {
      $('.ilex-content').each(function () {
        if ($(this).is(that.content) && $(this).is(active)) {
          let selectionRange = ilex.tools.range.normalize(selection.getRangeAt(0));
          //update newest selection
          if (that.selectionRanges.length === 0) {
            that.selectionRanges[0] = selectionRange;
          } else {
            that.selectionRanges[that.selectionRanges.length - 1] = selectionRange;
          }
        }
      });
    }
    $(document).trigger('canvasRedraw');
  });


  that.loadText = function (params) {
//    //Filling algorithm
//    var chunkSize = 400,
//        chunk = function(str) {
//          var chunks = [];
//          for (var i = 0, charsLength = str.length; i < charsLength; i += chunkSize) {
//              chunks.push(str.substring(i, i + chunkSize));
//          }
//          return chunks;
//        };
//    
//    //Create new span for evety 100 characters for performance purposes
//    //remove all spanf from content
//    that.content.find('span').remove();
//    let addedChars = 0;
//    for (let ch of chunk(params.text)) {
//      let len = ch.length;
//      //ilex.tools.markup.createIlexSpan().insertBefore($custos)
//      ilex.tools.markup.createIlexSpan().appendTo(that.content)
//                                        .data('ilex-startoffset', addedChars)
//                                        .data('ilex-endoffset', addedChars + len)
//                                        .text(ch);
//      addedChars += len;
//    };
    
    let addedChars = 0;
    for (let line of params.text.split("\n")) {
      let len = line.length + 1; //+1 for new line character \n
      ilex.tools.markup.createIlexLine().appendTo(that.content)
          .data('ilex-startoffset', addedChars)
          .data('ilex-endoffset', addedChars + len)
          .text(line);
      addedChars += len;
    }
    
    if (params.isEditable === false) {
      that.content.attr('contenteditable', 'false');
    }

    that.name.val(params.name);
    that.document = ilex.server.document(windowObject.tabId, params.name, params.id);
    fillChangesHistory();
  };

  that.container.on('windowResize', function(event) {
    var width = windowObject.element.data('ilex-width'),
      height = windowObject.element.data('ilex-height');

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

  $(document).on('canvasRedraw', function(event) {
    //redraw selections
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
        canvas.drawRect(rect, 'rgba(0, 108, 255, 0.3)');
      }
    }
  });

  //when user scrolls redraw the canvas
  that.scrollWindow.on('scroll', function (event) {
    $(document).trigger('canvasRedraw');
  });

  return that;
};
