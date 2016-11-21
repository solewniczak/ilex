'use strict';

//requires: ilex.canvas
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.text !== undefined)
  throw 'ilex.widgetsCollection.horizontalSplit already defined';

ilex.widgetsCollection.textEdiotr = function($parent) {
  var that = {},
    width = $parent.data('ilex-width'),
    height = $parent.data('ilex-height'),
    scrollBarWidth = 15;
  
  var countLineWidth = function () {
    var width = $parent.data('ilex-width');
    //has scroll bar
    if (that.content.get(0).scrollHeight > that.content.height()) {
      return width - scrollBarWidth;
    } else {
      return width;
    }
  };

  that.container = $('<div class="ilex-resize ilex-textEditor">')
                  .data('ilex-width', width)
                  .data('ilex-height', height);
  $parent.append(that.container);
  
//  that.scrollWindow = $('<div class="ilex-scrollWindow">')
//                .appendTo(that.container)
//                .css('overflow-y', 'auto')
//                .css('overflow-x', 'hidden')
//                .data('ilex-width', width)
//                .data('ilex-height', height);

  that.content = $('<div class="ilex-content">').appendTo(that.container)
                //proper new line handling
                .css('white-space', 'pre-wrap')
                .css('overflow-y', 'auto')
                .css('overflow-x', 'hidden')
                .data('ilex-height', height)
                .attr('contenteditable', 'true')
                .attr('spellcheck', 'false');

  //textDocument := [Line, Line, Line]
  //Line := {elm: $jQueryElm, absStart: int, absEnd: int, spans: [Span, Span]}
  //Span := {elm: $jQueryElm, absStart: int, absEnd: int}
  
  that.textDocument = {
    'createLine': function () {
      var $line = $('<div class="ilex-line">')
                    .width(countLineWidth()),
          $span = ilex.tools.markup.createIlexSpan().appendTo($line);
      return $line;
    },
    'insertLineAfter': function($after) {
      var $line = this.createLine();
      if ($after === undefined) {
        $line.appendTo(that.content);
      } else {
        $line.insertAfter($after);
      }
      return $line;
    },
    //relPos - position in span
    'insertText': function($span, relPos, text, notify) {
      if (notify === undefined) {
        notify = true;
      }
      var focus = {};         
      
      $span.text($span.text().slice(0, relPos) + text + $span.text().slice(relPos));
      
      if (notify) {
        let absStart = this.absPosition($span, relPos);
        that.content.trigger('documentAddText',[{
                                'absStart': absStart,
                                'value': text,
                                'span': $span[0]
                              }]);
      }
      
      focus.span = $span[0];
      focus.position = relPos + 1;
      
      return {'focus': focus};
    },
    
    'breakLine': function ($span, relPos, notify) {
      if (notify === undefined) {
        notify = true;
      }
      var focus = {},
          text = $span.text(),
          textBeforePos = text.slice(0, relPos),
          textAfterPos = text.slice(relPos),
          $oldLine = $span.parent(),
          $spansAfterCursor = $span.nextAll("span").detach();
    
      //update old line
      $span.text(textBeforePos + "\n");
      let $newLine = that.textDocument.insertLineAfter($oldLine),
          $newLineSpan = $newLine.find("span");
      $newLineSpan.text(textAfterPos);
      //cloning should be done another way
      //$newLineSpan.addClass(cursor.span.className);
      $newLineSpan.after($spansAfterCursor);
      
      if (notify) {
        let absStart = this.absPosition($span, relPos);
        that.content.trigger('documentAddText',[{
                        'absStart': absStart,
                        'value': '\n',
                        'span': $span[0]
                      }]);
      }

      focus.span = $newLineSpan[0];
      focus.position = 0;
      
      //scroll
      let newLineOffset = $newLine.offset();
      that.content.scrollTop(newLineOffset.top);
      
      return {'focus': focus};
    },
    
    //returns {
    //         length: '',
    //         removedSpanClasses: [],
    //         focus: {span: js obj, position: int}
    //        }
    'removeTextSingleSpan': function ($span, relStart, relEnd) {
      var $line = $span.parent(),
          length = 0,
          removedSpanClasses = [],
          focus = {};
      
      $span.text($span.text().slice(0, relStart) + $span.text().slice(relEnd));
      length = relEnd - relStart;

      if ($span.is($line.children(':last')) && $span.text().length === 0) {
        throw "assert: textDocument.removeTextSingleLine: you can't remove '\n' this way";
      }

      //II.3 & II.4
      if ($span.text().length === 0 && $span.prev().length === 0) {
        focus.span = $span.next()[0];
        focus.position = 0;

        removedSpanClasses.push($span.attr('class'));
        $span.remove();
      //II.6
      } else if($span.text().length === 0 && $span.prev().length > 0) {
        focus.span = $span.prev()[0];
        focus.position = focus.span.textContent.length;

        removedSpanClasses.push($span.attr('class'));
        $span.remove();
      //II.2
      } else if($span.text().length > 0 && relStart === 0 && $span.prev().length > 0) {
        focus.span = $span.prev()[0];
        focus.position = focus.span.textContent.length;
      //II.7
      } else if($span.text().length > 0 && relStart === 0 && $span.prev().length === 0) {
        focus.span = $span[0];
        focus.position = relStart;
      //II.1 && II.5
      } else {
        focus.span = $span[0];
        focus.position = relStart;
      }
      return {
        'length': length,
        'removedSpanClasses': removedSpanClasses,
        'focus': focus
      };
    },
    
    //returns {absStart: 'start position of removal',
    //         length: '',
    //         removedSpanClasses: [],
    //         focus: {span: js obj, position: int}
    //        }
    'removeTextSingleLine': function ($startSpan, relStart, $endSpan, relEnd) {
      var $line = $startSpan.parent(),
          length = 0,
          removedSpanClasses = [],
          focus = {};
      if ($startSpan.is($endSpan)) {
        return this.removeTextSingleSpan($startSpan, relStart, relEnd);
      } else {
        //remove SPANs between
        let $span = $startSpan.next();
        while (!$span.is($endSpan)) {
          length += $span.text().length;
          removedSpanClasses.push($span.attr('class'));
          
          let $nextSpan = $span.next();
          $span.remove();
          $span = $nextSpan;
          if ($span.length === 0) {
            throw "textDocument.removeTextSingleLine: can't reach end span";
          }
        }
        
        //remove text from startSpans
        length += $startSpan.text().length - relStart;
        $startSpan.text($startSpan.text().slice(0, relStart));
        
        //remove text from endSpan
        length += relEnd;
        $endSpan.text($endSpan.text().slice(relEnd, $endSpan.text().length));
        
        //we cannot select \n to removal
        if ($endSpan.is($line.children(':last')) && $endSpan.text().length === 0) {
          throw "assert: textDocument.removeTextSingleLine: you can't remove '\n' this way";
        }
        
        //II.5
        if ($startSpan.text().length === 0 && $endSpan.text().length === 1
            && $endSpan.is($line.children(':last'))) {
          
          removedSpanClasses.push($startSpan.attr('class'));
          $startSpan.remove();
          
          focus.span = $endSpan[0];
          focus.position = 0;
        //II.4 && II.3
        } else if ($startSpan.prev().length === 0 && $startSpan.text().length === 0
                  && $endSpan.text().length > 0) {
          
          removedSpanClasses.push($startSpan.attr('class'));
          $startSpan.remove();
          
          focus.span = $endSpan[0];
          focus.position = 0;
        //II.2
        } else if($startSpan.prev().length > 0 && relStart === 0 
                  && $endSpan.text().length > 0) {
          focus.span = $startSpan.prev()[0];
          focus.position = focus.span.textContent.length;
          
          removedSpanClasses.push($startSpan.attr('class'));
          $startSpan.remove();
          
        //II.6
        } else if($startSpan.prev().length > 0 && relStart === 0 
                  && $endSpan.text().length === 0) {
          
          focus.span = $startSpan.prev()[0];
          focus.position = focus.span.textContent.length;
          
          removedSpanClasses.push($startSpan.attr('class'));
          $startSpan.remove();
          
          removedSpanClasses.push($endSpan.attr('class'));
          $endSpan.remove();
        //II.8
        } else if (relStart > 0 && $endSpan.text().length === 0) {
          focus.span = $startSpan[0];
          focus.position = relStart;
          
          removedSpanClasses.push($endSpan.attr('class'));
          $endSpan.remove();
        //II.1
        } else {
          focus.span = $startSpan[0];
          focus.position = relStart;
        }
        
      }
      return {
        'length': length,
        'removedSpanClasses': removedSpanClasses,
        'focus': focus
      };
    },
    
    //returns {
    //         length: '',
    //         removedSpanClasses: [],
    //         focus: {span: js obj, position: int}
    //        }
    'removeText': function ($startSpan, relStart, $endSpan, relEnd, notify) {
      if (notify === undefined) {
        notify = true;
      }
      var length = 0,
          absStart = that.textDocument.absPosition($startSpan, relStart),
          removedSpanClasses = [],
          focus = {},
          $startLine = $startSpan.parent(),
          $endLine = $endSpan.parent();
      
      //Backspace and Delece can produce out ofr range relPositions
      //Deal with it here
      //I assume that you can remove only one charter at once => $startSpan == $endSpan
      
      //Backspace
      if (relStart < 0) {
        if ($startSpan.prev().length > 0) {
          $startSpan = $endSpan = $startSpan.prev();
          relStart = $startSpan.text().length - 1;
          relEnd = relStart;
        //join lines
        } else if ($startLine.prev().length > 0) {
          $startLine = $startLine.prev();
          $startSpan = $startLine.children(':last');
          relStart = $startSpan.text().length - 1;
        //block removal we cannot go behind document.
        //don't trigger documentRemoveText message
        } else {
          focus.span = $startSpan[0];
          focus.position = relEnd;
          return {
            'length': 0,
            'removedSpanClasses': [],
            'focus': focus
          };
        }
      //Delete
      //We cannot set cursor after \n so we must have SPAN on right
      } else if (relEnd > $endSpan.text().length) {
        $startSpan = $endSpan = $startSpan.next();
        relStart = 0;
        relEnd = 1;
      } else if (relEnd === $endSpan.text().length &&
                   $endSpan.text().charAt(relStart) === '\n') {
        //join lines
        if ($startLine.next().length > 0) {
          $endLine = $startLine.next();
          $endSpan = $endLine.children(':first');
          relEnd = 0;
        //you cannot delete last newline in file
        } else {
          focus.span = $startSpan[0];
          focus.position = relStart;
          return {
            'length': 0,
            'removedSpanClasses': [],
            'focus': focus
          };
        }
      }
      
      if ($startLine.is($endLine)) {
        let lineInfo = this.removeTextSingleLine($startSpan, relStart, $endSpan, relEnd);
        length = lineInfo.length;
        removedSpanClasses = lineInfo.removedSpanClasses;
        focus = lineInfo.focus;
      } else {
        //process lines between
        let $line = $startLine.next();    
        while(!$line.is($endLine)) {
          length += this.getLineLength($line);
          $line.children().each(function() {
            removedSpanClasses.push(this.className);
          });
          
          let $nextLine = $line.next();
          $line.remove();
          $line = $nextLine;
          if ($line.length === 0) {
            throw "textDocument.removeText: can't reach end line";
          }
        }
        
        //III.1
        if ($startLine.children(':first').is($startSpan) && relStart === 0 &&
            $endLine.children(':first').is($endSpan) && relEnd === 0) {
          length += this.getLineLength($startLine);
          $startLine.children().each(function() {
            removedSpanClasses.push(this.className);
          });
          $startLine.remove();
          focus.span = $endLine.children(':first')[0];
          focus.position = 0;
          
        //III.2 & III.4 & III.5 -> nie można zaznaczyć '\n'
        } else if ($startLine.children(':first').is($startSpan) && relStart === 0) {
          
          length += this.getLineLength($startLine);
          $startLine.children().each(function() {
            removedSpanClasses.push(this.className);
          });
          $startLine.remove();
          
          let info = this.removeTextSingleLine($endLine.children(':first'),
                                               0, $endSpan, relEnd);
          length += info.length;
          removedSpanClasses =
                    removedSpanClasses.concat(info.removedSpanClasses);
          focus = info.focus;
        //III.3
        } else {
          $startLine.append($endLine.children());
          let info = this.removeTextSingleLine($startSpan, relStart, $endSpan, relEnd);
          length += info.length;
          removedSpanClasses =
                    removedSpanClasses.concat(info.removedSpanClasses);
          focus = info.focus;

          //remove empty end line
          $endLine.remove();
        }
      }
      
      if (notify) {
        //send removal event  
        that.content.trigger('documentRemoveText',[{
                      'absStart': absStart,
                      'length': length,
                      'removedSpanClasses': removedSpanClasses
                    }]);
      }
           
      return {
        'length': length,
        'removedSpanClasses': removedSpanClasses,
        'focus': focus
      };
    },
    'getLineLength': function ($line) {
      var length = 0;
      $line.children().each(function () {
        length += this.textContent.length;
      });
      return length;
    },
    'absPosition': function ($start, relPos) {
      var length = 0;
      that.content.find('span').each(function () {
        if ($(this).is($start)) {
          return false;
        }
        length += $(this).text().length;
      });
      return length + relPos;
    },
    'relPosition': function (absPos) {
      var startAbsPos = absPos,
          focus;
      that.content.find('span').each(function () {
        if (absPos < $(this).text().length) {
          focus = {};
          focus.span = this;
          focus.position = absPos;
          
          return false;
        } else {
          absPos -= $(this).text().length;
        }
      });
      if (focus === undefined) {
        console.log('textDocument.relPosition: ' + startAbsPos + ' out of range');
        return false;
      }
      return focus;
    }
  };
  

  
  var cursor = {
    'span': null,
    'position': 0,

    //update cursor using current Selection
    'needsUpdate': false,
    'update': function () {
      var selection = window.getSelection();
      //we are in main div
      if (selection.anchorNode === that.content[0]) {
        this.setSpan(that.content.find('span')[0]);
        this.position = 0;
      } else {
        this.setSpan(selection.anchorNode.parentElement);
        this.position = selection.anchorOffset;
      }
      this.needsUpdate = false;
    },
    'toSelection':  function () {
      var selection = window.getSelection();
      selection.collapse(this.span.childNodes[0], this.position);
    },
    'setSpan': function(span, position) {
//      $(this.span).css('outline', '0');
      $(this.span).parent().css('background', 'none');
      this.span = span;    
      //set span mark
//      $(span).css('outline', '1px solid rgba(0, 0, 0, 0.3)');
      $(this.span).parent().css('background', 'rgba(100, 100, 100, 0.1)');
    }
  };
  
  var selectionRange = document.createRange();
  
  var getSingleSpanSpans = function(span, relStart, relEnd) {
    var line = span.parentElement;
    //II.9
    if (relStart !== 0 && relEnd !== span.textContent.length) {
      let text = span.textContent,
          leftText = text.slice(0, relStart),
          middleText = text.slice(relStart, relEnd),
          rightText = text.slice(relEnd);
      ilex.tools.markup.createIlexSpan().text(leftText).insertBefore(span);
      ilex.tools.markup.createIlexSpan().text(rightText).insertAfter(span);
      span.textContent = middleText;
    //II.7 & II.2
    } else if (relStart === 0 && relEnd !== span.textContent.length) {
      let text = span.textContent,
          leftText = text.slice(0, relEnd),
          rightText = text.slice(relEnd);

      ilex.tools.markup.createIlexSpan().text(rightText).insertAfter(span);
      span.textContent = leftText;
    //II.3 & II.6
    } else if (relStart === 0 && relEnd === span.textContent.length) {
      //nothing to do
    //II.10
    } else if(relStart !== 0 && relEnd === span.textContent.length) {
       let text = span.textContent,
          leftText = text.slice(0, relStart),
          rightText = text.slice(relStart, relEnd);

      ilex.tools.markup.createIlexSpan().text(leftText).insertBefore(span);
      span.textContent = rightText;
    }      
    return $(span);
  };
  
  var getSingleLineSpans = function (startSpan, relStart, endSpan, relEnd) {
    var line = startSpan.parentElement;
    
    if (startSpan === endSpan) {
      return getSingleSpanSpans(startSpan, relStart, relEnd);
    } else {
      let $spans =
          getSingleSpanSpans(startSpan, relStart, startSpan.textContent.length);
      //spans between
      let span = startSpan.nextElementSibling;
      while (span !== endSpan) {
        $spans = $spans.add(span);
        span = span.nextElementSibling;
        if (span === null) {
          throw "textEditor.getSingleLineSpans: can't reach end span";
        }
      }
      let $endSpan = getSingleSpanSpans(endSpan, 0, relEnd);
      $spans = $spans.add($endSpan);
      
      return $spans;
    }
  };
  
  //public API
  
  that.getRangeSpans = function(range) {
    if (range.collapsed === true) {
      return $();
    }
    var startSpan = range.startContainer.parentElement,
        startLine = startSpan.parentElement,
        relStart = range.startOffset,
        endSpan = range.endContainer.parentElement,
        endLine = endSpan.parentElement,
        relEnd = range.endOffset;
    if (startLine === endLine) {
      return getSingleLineSpans(startSpan, relStart, endSpan, relEnd); 
    } else {
      //select all spans between lines
      let $spans = getSingleLineSpans(startSpan, relStart,
                                  startLine.lastChild, startLine.lastChild.textContent.length);
      let line = startLine.nextElementSibling;
      while (line !== endLine) {
        $spans = $spans.add($(line).children());
        line = line.nextElementSibling;
        if (line === null) {
          throw "textEditor.getSelectionSpans: can't reach end line";
        }
      }
      let $endLineSpans = getSingleLineSpans(endLine.firstChild, 0,
                                  endSpan, relEnd)
      $spans = $spans.add($endLineSpans);
      
      return $spans;
    }
  };
  
  //Returns spans that covers selection or create new ones if needed
  that.getSelectionSpans = function () {
    return that.getRangeSpans(selectionRange);
  };
  
  that.setContent = function (text) {
    //clean content
    that.content.html('');
    
    for (let line of text.match(/.*\n/g)) {
      let $line = that.textDocument.insertLineAfter();
      //that.textEditor.textDocument.insertText($line.find("span"), 0, line + "\n");
      $line.find("span").text(line);
    }
  };
  
  that.insertText = function(absStart, text) {
    var focus = that.textDocument.relPosition(absStart);
    
    for (let i = 0; i < text.length; i++) {
      let ch = text.charAt(i), info;
      if (ch === '\n') {
        info = that.textDocument.breakLine($(focus.span), focus.position, false);
      } else {
        info = that.textDocument.insertText($(focus.span), focus.position, ch, false);
      }
      focus = info.focus;
    }  
  };
  
  that.removeText = function(absStart, length) {
    var start = that.textDocument.relPosition(absStart - 1),
        end = that.textDocument.relPosition(absStart + length - 1);
    
    that.textDocument.removeText($(start.span), start.position,
                                 $(end.span), end.position, false);
  };

  
   //There cannot be empty spans in ilex document
  that.content.on('mouseup', function(event) {
    var selection = window.getSelection();
    if (selection.isCollapsed) {
      cursor.update();
    }
  });
    
  that.content.on('keydown', function(event) {
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
    
    //update curosr span if it was moved by arrow keys
    if (cursor.needsUpdate) {
      cursor.update();
    }
    
    //cursor helpers
    var insertAfterCursor = function (char) {
      let info = that.textDocument.insertText($(cursor.span), cursor.position, char);
      
      cursor.setSpan(info.focus.span);
      cursor.position = info.focus.position;
    };
    var removeSelectedText = function () {
      if (selectionRange.collapsed === false) {
        let $startSpan = $(selectionRange.startContainer.parentElement),
            $endSpan = $(selectionRange.endContainer.parentElement);

        let info = that.textDocument.removeText($startSpan, selectionRange.startOffset,
                                    $endSpan, selectionRange.endOffset);
        
        cursor.setSpan(info.focus.span);
        cursor.position = info.focus.position;
        
        //remove selection
        selectionRange = document.createRange();
      }
    };
    
    //Delete selection
    if (selectionRange.collapsed === false &&
        (event.key === 'Backspace' || event.key === 'Delete')) {
      removeSelectedText();
    } else if (event.key === 'Backspace') {
      let info = that.textDocument.removeText($(cursor.span), cursor.position-1,
                                              $(cursor.span), cursor.position);
      cursor.setSpan(info.focus.span);
      cursor.position = info.focus.position;
    } else if (event.key === 'Delete') {
      let info = that.textDocument.removeText($(cursor.span), cursor.position,
                                              $(cursor.span), cursor.position+1);
      cursor.setSpan(info.focus.span);
      cursor.position = info.focus.position;
    } else {
      removeSelectedText();
      if (event.key === 'Enter') {
        let info = that.textDocument.breakLine($(cursor.span), cursor.position);
        //update cursor position
        cursor.setSpan(info.focus.span);
        cursor.position = info.focus.position;
      } else if (event.key === 'Tab') {
        insertAfterCursor("\t");
      } else {
        insertAfterCursor(event.key);
      }
    }
    
    cursor.toSelection();
    
    event.preventDefault();
  });
  
  //draw selection
  $(document).on('selectionchange.ilex.text', function(event) {
    var selection = window.getSelection(),
      active = $('.ilex-content:hover');
    if (active.length > 0 && selection.rangeCount >= 1) {
      $('.ilex-content').each(function () {
        if ($(this).is(that.content) && $(this).is(active)) {
          selectionRange = ilex.tools.range.normalize(selection.getRangeAt(0));
        }
      });
    }
    $(document).trigger('canvasRedraw');
  });
  
  that.container.on('windowResize', function(event) {
    var width = $parent.data('ilex-width'),
      height = $parent.data('ilex-height');

    that.container.data('ilex-width', width);
    that.content.data('ilex-width', width);
    
    
    that.content.find('.ilex-line').data('ilex-width', countLineWidth());
    
    //that.content doesn't have fix width to react on scrollbar
    //show and hide


    that.container.data('ilex-height', height);
    //dock conatiner height does not choange
    //content height shrinks
    that.content.data('ilex-height', height);
    //that.scrollWindow.data('ilex-height', height);

  });


  //we don't want standard browsers draging procedure
  //it confuses the users
  that.container.on('dragstart', function (event) {
    event.preventDefault();
  });

  //Ctrl + A doesn't work yet
  that.content.on('mouseup', function (event) {
    //selection finished, used by finishLinkButton
    //that.container.trigger('selectend');
  });
  that.content.on('mousedown', function (event) {
    //we have to clear entire container to avoid 1 px artifact between
    //toolbar and content
    var containerOffset = that.container.offset(),
      widgetRect = ilex.canvas.createClientRect(containerOffset.left, containerOffset.top,
                                            that.container.data('ilex-width'),
                                            that.container.data('ilex-height'));

    //create new range only when previously created is not collapsed
    selectionRange = document.createRange();

    $(document).trigger('canvasRedraw');
  });

  $(document).on('canvasRedraw', function(event) {
    //redraw selections
    var scrollWindowOffset = that.content.offset(),
        clipRect = ilex.canvas.createClientRect( scrollWindowOffset.left,
                                            scrollWindowOffset.top,
                                            that.content.data('ilex-width'),
                                            that.content.data('ilex-height'));

    var rects = ilex.tools.range.getClientRects(selectionRange, that),
        clientRects = ilex.canvas.clipClientRectList(clipRect, rects);

    for (let i = 0; i < clientRects.length; i++) {
      let rect = clientRects[i];
      ilex.canvas.drawRect(rect, 'rgba(0, 108, 255, 0.3)');
    }

  });

  //when user scrolls redraw the canvas
  that.content.on('scroll', function (event) {
    $(document).trigger('canvasRedraw');
  });

  return that;
};