'use strict';

//requires: ilex.widgetsCollection.handlerSize
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.handlerSize === undefined)
  throw 'ilex.widgetsCollection.handlerSize undefined';
if (ilex.widgetsCollection.verticalSplit !== undefined)
  throw 'ilex.widgetsCollection.verticalSplit already defined';

ilex.widgetsCollection.verticalSplit = function ($parentWidget, position) {
  var that = {},
    position = position || [0.5, 0.5],
    makeResizeCallback = function(that) {
      return function(event) {
        var width = that.container.parent().data('ilex-width'),
          height = that.container.parent().data('ilex-height'),
            interHeight = height - ilex.widgetsCollection.handlerSize;

        that.container.data('ilex-width', width).data('ilex-height', height);
        that.container.children().data('ilex-width', width);
        that.top.data('ilex-height', interHeight * that.position[0]);
        that.bottom.data('ilex-height', interHeight * that.position[1]);
      };
    },
    makeHandlerMousedownCallback = function(that) {
      return function(event) {
        var startY = event.pageY,
          topHeight = that.top.data('ilex-height'),
          bottomHeight = that.bottom.data('ilex-height'),
          innerHeight =  topHeight + bottomHeight;
        $('body').css('cursor', 'ns-resize');
        //prevent selectin while resizing
        $(document).on('selectstart', function(event) {
          event.preventDefault();
        });
        $(document).on('mouseup', function () {
          $(document).off('mouseup');
          $(document).off('mousemove');
          $(document).off('selectstart');
          $('body').css('cursor', 'initial');
        });
        $(document).on('mousemove', function(event) {
          //calculate new position
          var delta = event.pageY - startY,
            newTopHeight = topHeight + delta,
            newBottomHeight = bottomHeight - delta;
          if (newTopHeight < 0) {
            newTopHeight = 0;
            newBottomHeight = innerHeight;
          } else if (newBottomHeight < 0) {
            newTopHeight = innerHeight;
            newBottomHeight = 0;
          }

          that.position = [newTopHeight/innerHeight, newBottomHeight/innerHeight];

          ilex.applySize();
        });
      };
    },
    width = $parentWidget.data('ilex-width'),
    height = $parentWidget.data('ilex-height'),
    innerHeight = height - ilex.widgetsCollection.handlerSize;

  that.container = $('<div class="ilex-resize ilex-verticalSplit">').appendTo($parentWidget)
                      .data('ilex-width', width)
                      .data('ilex-height', height);

  that.top = $('<div class="ilex-top">').appendTo(that.container)
                          .data('ilex-width', width)
                          .data('ilex-height', innerHeight * position[0]);

  that.position = position;
  that.handler = $('<div class="ilex-handler">').appendTo(that.container)
                          .css('cursor', 'ns-resize')
                          .data('ilex-width', $parentWidget.width())
                          .data('ilex-height', ilex.widgetsCollection.handlerSize)
                          .css('background', '#000');

  that.bottom = $('<div class="ilex-bottom">').appendTo(that.container)
                          .data('ilex-widht', width)
                          .data('ilex-height', innerHeight * position[1]);

  that.container.on('windowResize', makeResizeCallback(that));
  that.handler.on('mousedown', makeHandlerMousedownCallback(that));
  return that;
};

/*$(document).on('windowResize', '.ilex-verticalSplit', function (e) {
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
});*/
