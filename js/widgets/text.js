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
                .attr('contenteditable', 'true');
  //initial span
  ilex.tools.markup.createIlexSpan().appendTo(that.content)
                                  .data('ilex-startoffset', 0)
                                  .data('ilex-endoffset', 0);
  //new lines custos
  $('<div class="ilex-newlineGuard">').appendTo(that.content);

  //add toolbar at the end to give it access to entre text object
  that.dock.toolbar = ilex.widgetsCollection.textToolbar(that.dock.container, that, canvas);


  that.content.on('keydown', function(event) {
    //Disable Ctrl shortcouts
    if (event.ctrlKey) {
      event.preventDefault();
    }
  });

  that.content.on('keypress', function(event) {
    let selection = window.getSelection(),
      character, position, $parentSpan;

    //when we are outside span
    if (selection.anchorNode === that.content[0] && event.which !== 0) {
      $parentSpan = that.content.find('span:first');
      character = String.fromCharCode(event.which);
      position = 0;
      $parentSpan.append(character);
      selection.collapse($paretnSpan[0].childNodes[0], 1);
    } else {
      $parentSpan = $(selection.anchorNode.parentNode);
      if (event.keyCode === 13) {

        character = '\n';
        position = selection.anchorOffset;

        if ($parentSpan.is(that.content.find('span:last'))) {
        /*  if ($anchorParent.text().slice(-1) !== '\n'
              && selection.anchorOffset === $anchorParent.text().length) {
            document.execCommand('insertHTML', false, '\n');
          }*/

          document.execCommand('insertHTML', false, '\n');

          let offset = that.content.offset();
          let lineHeight = parseInt($anchorParent.css('line-height'));

          //if new line is hidden scroll to it
          if (selRange.getClientRects()[1].bottom - offset.top >=
              that.scrollWindow.scrollTop() + that.scrollWindow.height() - lineHeight) {
            that.scrollWindow.scrollTop(that.scrollWindow.scrollTop() + lineHeight);
          }
          //that.scrollWindow.scrollTop(that.scrollWindow[0].scrollHeight);
        } else {
          document.execCommand('insertHTML', false, '\n');
        }
      } else if (event.which !== 0) {
        character = String.fromCharCode(event.which);
        position = selection.anchorOffset;
        document.execCommand('insertHTML', false, String.fromCharCode(event.which));
      }
    }
    //update offsets
    $parentSpan.data('ilex-endoffset', $parentSpan.data('ilex-endoffset') + 1);
    $parentSpan.nextAll().each(function () {
      var startOffset = $(this).data('ilex-startoffset'),
        endOffset = $(this).data('ilex-endoffset');

      $(this).data('ilex-startoffset', startOffset+1);
      $(this).data('ilex-endoffset', endOffset+1);
    });
    ilex.server.action.charAdd(windowObject.id,
                              position + $parentSpan.data('ilex-startoffset'),
                              character);
    event.preventDefault();
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
