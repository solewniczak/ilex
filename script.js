'use strict';

var ilex = {};

ilex.widgets = [];
//widget is object that occupies some part of screen
ilex.widgetsCollection = {};
ilex.widgetsCollection.handlerSize = 3;
ilex.widgetsCollection.verticalSplit = function ($parentWidget, position) {
  var that = {},
    position = position || [0.5, 0.5],
    width = $parentWidget.width(),
    height = $parentWidget.height(),
    innerHeight = height - ilex.widgetsCollection.handlerSize,
    $container = $('<div class="ilex-resize ilex-verticalSplit">').appendTo($parentWidget)
                          .width(width)
                          .height(height);

  that.top = $('<div class="ilex-top">').appendTo($container)
                          .width(width)
                          .height(innerHeight * position[0]);
  that.handler = $('<div class="ilex-handler">').appendTo($container)
                          .data("ilex-position", position)
                          .width($parentWidget.width())
                          .height(ilex.widgetsCollection.handlerSize)
                          .css('background', '#000');

  that.bottom = $('<div class="ilex-bottom">').appendTo($container)
                          .width(width)
                          .height(innerHeight * position[1]);
  return that;
};

$(document).on('windowResize', '.ilex-verticalSplit', function (e) {
    var $container = $(this),
      width = $container.parent().data('ilex-width'),
      height = $container.parent().data('ilex-height'),
      interHeight = height - ilex.widgetsCollection.handlerSize,
      top = $container.children('.ilex-top'),
      bottom = $container.children('.ilex-bottom'),
      position = $container.children('.ilex-handler').data('ilex-position');

    $container.data('ilex-width', width).data('ilex-height', height);

    $container.children().data('ilex-width', width);

    top.data('ilex-height', interHeight * position[0]);
    bottom.data('ilex-height', interHeight * position[1]);
});

ilex.widgetsCollection.horizontalSplit = function ($parentWidget, position) {
  var that = {},
    position = position || [0.5, 0.5],
    width = $parentWidget.width(),
    height = $parentWidget.height(),
    innerWidth = width - ilex.widgetsCollection.handlerSize,
    $table = $('<div class="ilex-resize ilex-horizontalSplit">').appendTo($parentWidget)
                      .width(width)
                      .height(height)
                      .css('display', 'table-row');

  that.left = $('<div class="ilex-left">').appendTo($table)
                          .css('display', 'table-cell')
                          .width(innerWidth * position[0])
                          .height(height);
  that.handler = $('<div class="ilex-handler">').appendTo($table)
                          .data("ilex-position", position)
                          .css('display', 'table-cell')
                          .width(ilex.widgetsCollection.handlerSize)
                          .height(height)
                          .css('background', '#000');

  that.right = $('<div class="ilex-right">').appendTo($table)
                          .css('display', 'table-cell')
                          .width(innerWidth * position[1])
                          .height(height);

  return that;
};
$(document).on('windowResize', '.ilex-horizontalSplit', function (e) {
    var $table = $(this),
      width = $table.parent().data('ilex-width'),
      height = $table.parent().data('ilex-height'),
      innerWidth = width - ilex.widgetsCollection.handlerSize,
      left = $table.children('.ilex-left'),
      right = $table.children('.ilex-right'),
      position = $table.children('.ilex-handler').data('ilex-position');

    $table.data('ilex-width', width).data('ilex-height', height);
    $table.children().data('ilex-height', height);

    left.data('ilex-width', innerWidth * position[0]);
    right.data('ilex-width', innerWidth * position[1]);

});

ilex.textFill = function(text, $container) {
  var createParagraph = function($container) {
    var $paragraph = $('<p class="ilex-paragraph">').appendTo($container)
                          .css('margin-bottom', '10px');
    return $paragraph;
  },
  paragraphs = text.split('\n\n');
  for (let p of paragraphs) {
    let $p = createParagraph($container);
    $p.html(p.nl2br());
  }
}

$(document).on('dragstart', '.ilex-paragraph', function(e) {
  var $this = $(this);
  e.preventDefault();
});

$(document).on('selectstart', '.ilex-content', function(e) {
  var $this = $(this);
});

$(document).on('selectionchange', '.ilex-content', function(e) {
  var $this = $(this);

});

$(document).on('mousedown', '.ilex-content', function(e) {
  var $this = $(this);
  console.log("start_selection");
});

$(document).on('mouseup', '.ilex-content', function(e) {
  var $this = $(this);
  console.log("end selection");
});

ilex.widgetsCollection.textToolbar = function ($parentWidget) {
  var that = {},
    addButton = function($toolbar, text, command) {
      var $button = $('<span class="ilex-button">').appendTo($toolbar)
                      .text(text)
                      .data('command', command)
                      .css('border', '1px solid #000')
                      .css('cursor', 'pointer');
      return $button;
    },
    $toolbar = $('<div class="ilex-text-toolbar">').appendTo($parentWidget);

    addButton($toolbar, 'Bold', 'bold');
    addButton($toolbar, 'Italic', 'italic');
    addButton($toolbar, 'Underline', 'underline');
};

$(document).on('mousedown', '.ilex-button', function (e) {
  var command = $(this).data('command');
  document.execCommand(command, false, null);
  console.log(e);
  //prevent focus stealing
  e.preventDefault();
});

ilex.widgetsCollection.text = function ($parentWidget) {
  var that = {},
    width = $parentWidget.width(),
    height = $parentWidget.height(),
    $container = $('<div class="ilex-resize ilex-text">').appendTo($parentWidget)
                    .css("position", "relative")
                    .css('overflow', 'auto')
                    .width(width)
                    .height(height),
    $toolbar = $('<div class="ilex-content-tools">').appendTo($container),
    $content = $('<div class="ilex-content">').appendTo($container)
                  .attr('contenteditable', 'true'),
    $cursor = $('<div class="ilex-cursor">').appendTo($container)
              .css('position', 'absolute')
              .css('color', '#000')
              .width(3)
              .height(12)
              .hide();
    ilex.widgetsCollection.textToolbar($toolbar);
    that.loadText = function (text) {
      //Filling algorithm
      ilex.textFill(text, $content);
    };
    return that;
};

$(document).on('mousedown', '.ilex-word', function(e) {
  var $this = $(this);
  console.log($this.text());
});

$(document).on('windowResize', '.ilex-text', function (e) {
    var $container = $(this),
      width = $container.parent().data('ilex-width'),
      height = $container.parent().data('ilex-height');
    $container.data('ilex-width', width).data('ilex-height', height);
});

$(document).ready(function(){
  $("body").css("overflow", "hidden");
  ilex.window = $('<div>').appendTo('body')
                      .width($(window).width())
                      .height($(window).height());
  $(window).on('resize', function () {
    var width = $(window).width(),
      height = $(window).height();
    ilex.window.data('ilex-width', width).data('ilex-height', height);
    ilex.window.width(width).height(height);
    ilex.window.find('.ilex-resize').trigger('windowResize');
    ilex.window.find('*').each(function () {
      if ($(this).data('ilex-width'))
        $(this).width($(this).data('ilex-width'))
      if ($(this).data('ilex-height'))
        $(this).height($(this).data('ilex-height'));
    });
  });
  ilex.fileSelector = ilex.widgetsCollection.verticalSplit(ilex.window, [0.1, 0.9]);
  ilex.pannels = ilex.widgetsCollection.horizontalSplit(ilex.fileSelector.bottom);
  ilex.leftText = ilex.widgetsCollection.text(ilex.pannels.left);
  ilex.rightText = ilex.widgetsCollection.text(ilex.pannels.right);

  ilexServer.init(function () {
    ilexServer.send({target: 'left', text: 'xanadu'});
    ilexServer.send({target: 'right', text: 'powiesc_wajdeloty'});
  }, function (data) {
    var json = JSON.parse(data);
    if (json.target === 'left')
      ilex.leftText.loadText(json.text);
    else if (json.target === 'right')
      ilex.rightText.loadText(json.text);
  });

});
