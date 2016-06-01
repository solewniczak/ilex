'use strict';

//requires: ilex.canvas
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.text !== undefined)
  throw 'ilex.widgetsCollection.horizontalSplit already defined';

ilex.widgetsCollection.text = function ($parentWidget, canvas) {
  if (canvas === undefined)
    throw 'canvas undefined';
  var that = {},
    textFill = function(text, $container) {
      var nl2br = function(string) {
          return string.replace(/\n/g, "<br />");
      };
      $container.append(nl2br(text));
    },
    width = $parentWidget.data('ilex-width'),
    height = $parentWidget.data('ilex-height');

    that.container = $('<div class="ilex-resize ilex-text">')
                    .data('ilex-width', width)
                    .data('ilex-height', height);
    $parentWidget.html(that.container);

    that.dock = {};
    that.dock.container = $('<div class="ilex-dock">').appendTo(that.container)
                            .data('ilex-width', width);
                            //height depends on button's sizes
    that.dock.toolbar = ilex.widgetsCollection.textToolbar(that.dock.container);

    that.scrollWindow = $('<div class="ilex-scrollWindow">')
                    .appendTo(that.container)
                    .css('overflow', 'auto')
                    .data('ilex-width', width)
                    .data('ilex-height', height - that.dock.container.height());

    that.content = $('<div class="ilex-content">').appendTo(that.scrollWindow)
                  .data('ilex-height', height - that.dock.container.height())
                  .attr('contenteditable', 'true');

    //draw selections
    $(document).on('selectionchange', function(event) {
      var selection = window.getSelection(),
        active = $('.ilex-text:hover');

      if (active.length > 0 && selection.rangeCount >= 1) {
        $('.ilex-text').each(function () {
          if ($(this).is(that.container) && $(this).is(active)) {
            that.selectionRange = selection.getRangeAt(0);
          }
        });
      }
      $(document).trigger('canvasRedraw');
    });

    //prevent inserting block elements when pressing return key
    that.content.on('keydown', function(event) {
      // trap the return key being pressed
      if (event.keyCode === 13) {
        let selection = window.getSelection();
        // insert 2 br tags (if only one br tag is inserted the cursor won't go to the next line)
        document.execCommand('insertHTML', false, '<br><br>');
        // prevent the default behaviour of return key pressed
        event.preventDefault();
      }
  });



    that.loadText = function (text) {
      //Filling algorithm
      textFill(text, that.content);
    };
    //selections of the text
    that.selections = [];
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
    //nothing is selected at the begining
    that.selectionRange = {};
    that.container.on('mouseenter', function(event) {
      var selection = window.getSelection();
      selection.removeAllRanges();
      console.log(that.selectionRange);
      //if something is selected get focus
      if (that.selectionRange.constructor.name === 'Range') {
        selection.addRange(that.selectionRange);
      }
      $(document).trigger('canvasRedraw');
    });

    //we don't want standard browsers draging procedure
    //it confuses the users
    that.container.on('dragstart', function (event) {
      event.preventDefault();
    });

    var drawSelection = function () {
      var rects,
        scrollWindowOffset = that.scrollWindow.offset(),
        clipRect = canvas.createClientRect(scrollWindowOffset.left, scrollWindowOffset.top,
                                              that.scrollWindow.data('ilex-width'),
                                              that.scrollWindow.data('ilex-height'));


      //duck typing
      if (typeof that.selectionRange.getClientRects === 'function') {
        rects = canvas.clipClientRectList(clipRect, that.selectionRange.getClientRects());
      } else {
        rects = [];
      }

      for (let i = 0; i < rects.length; i++) {
        let rect = rects[i];
        canvas.drawRect(rect, '#a8d1ff');
      }
    };

    //Ctrl + A doesn't work yet
    that.container.on('mouseup', function (event) {
      //selection finished, used by finishLinkButton
      that.container.trigger('selectend');

    });
    that.container.on('mousedown', function (event) {
      //we have to clear entire container to avoid 1 px artifact between
      //toolbar and content
      var containerOffset = that.container.offset(),
        widgetRect = canvas.createClientRect(containerOffset.left, containerOffset.top,
                                              that.container.data('ilex-width'),
                                              that.container.data('ilex-height'));
      that.selectionRange = {};
      $(document).trigger('canvasRedraw');
    });

    //redraw selections
    $(document).on('canvasRedraw', function(event) {
      drawSelection();
    });

    //when user scrolls redraw the canvas
    that.scrollWindow.on('scroll', function (event) {
      $(document).trigger('canvasRedraw');
    });

    return that;
};
