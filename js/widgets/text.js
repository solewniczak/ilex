'use strict';

//requires: ilex.canvas
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.text !== undefined)
  throw 'ilex.widgetsCollection.horizontalSplit already defined';

/*$(document).on('dragstart', '.ilex-paragraph', function(e) {
  var $this = $(this);
  e.preventDefault();
});

$(document).on('selectstart', '.ilex-content', function(e) {
  var $this = $(this);
  $this.find('.ilex-selection').replaceWith(function () {
    return $(this).html();
  });
});

$(document).on('mouseup', '.ilex-content', function(e) {
  var $this = $(this),
    selection = window.getSelection(),
    rects, range;

  //we select nothing, just click on the text
  if (selection.isCollapsed || selection.rangeCount < 1)
    return;

  //highlight selection

  range = selection.getRangeAt(0);
  rects = range.getClientRects();
  for (let i = 0; i < rects.length; i++) {
    let rect = rects[i];
    ilex.canvas.drawRect(rect.left, rect.top,
                        rect.width, rect.height, '#a8d1ff');
  }
});*/

ilex.widgetsCollection.text = function ($parentWidget, canvas) {
  if (canvas === undefined)
    throw 'canvas undefined';
  var that = {},
    textFill = function(text, $container) {
      var createParagraph = function($container) {
        var $paragraph = $('<p class="ilex-paragraph">').appendTo($container)
                              .css('margin-bottom', '10px');
        return $paragraph;
      },
      nl2br = function(string) {
          return string.replace(/\n/g, "<br />");
      },
      paragraphs = text.split('\n\n');
      for (let p of paragraphs) {
        let $p = createParagraph($container);
        $p.html(nl2br(p));
      }
    },
    width = $parentWidget.data('ilex-width'),
    height = $parentWidget.data('ilex-height');

    that.container = $('<div class="ilex-resize ilex-text">')
                    .data('ilex-width', width)
                    .data('ilex-height', height);
    $parentWidget.html(that.container);

    that.dock = {};
    that.dock.container = $('<div class="ilex-dock">').appendTo(that.container)
                            .data('ilex-width', width)
                            .data('ilex-height', ilex.widgetsCollection.textDockHeight);

    that.scrollWindow = $('<div class="ilex-scrollWindow">')
                    .appendTo(that.container)
                    .css('overflow', 'auto')
                    .data('ilex-width', width)
                    .data('ilex-height', height - ilex.widgetsCollection.textDockHeight);

    that.content = $('<div class="ilex-content">').appendTo(that.scrollWindow)
                  .data('ilex-height', height - ilex.widgetsCollection.textDockHeight)
                  .attr('contenteditable', 'true');

    that.dock.toolbar = ilex.widgetsCollection.textToolbar(that.dock.container);

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
      that.content.data('ilex-height', height - ilex.widgetsCollection.textDockHeight);
      that.scrollWindow.data('ilex-height', height - ilex.widgetsCollection.textDockHeight);

    });

    //we don't want standard browsers draging procedure
    //it confuses the users
    that.container.on('dragstart', function (event) {
      event.preventDefault();
    });

    //Ctrl + A doesn't work
    that.container.on('mouseup', function (event) {
      var selection = window.getSelection(),
        rects, range;

      //we select nothing, just click on the text
      if (selection.isCollapsed || selection.rangeCount < 1)
        return;

      //highlight selection
      range = selection.getRangeAt(0);
      rects = range.getClientRects();

      for (let i = 0; i < rects.length; i++) {
        let rect = rects[i];
        canvas.drawRect(rect.left, rect.top,
                            rect.width, rect.height, '#a8d1ff');
      }
      //clearPreviousSelection(event);
    });
    that.container.on('mousedown', function (event) {
      var range = document.createRange(),
        textRange = range.selectNode(that.container[0]),
        rect = range.getBoundingClientRect();
      console.log(rect);
      canvas.clearRect(rect.left, rect.top, rect.width, rect.height)
    });
    return that;
};
