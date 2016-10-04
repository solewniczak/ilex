'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.popupNote !== undefined)
  throw 'ilex.widgetsCollection.popupMenu already defined';

ilex.widgetsCollection.popupNote = function ($parentWidget, zIndex) {
  var that = {},
    zIndex = zIndex || 3;

  that.container = $('<div class="ilex-popupNote">').appendTo($parentWidget)
              .css('position', 'absolute')
              .css('z-index', zIndex)
              .css('border', '1px solid #000')
              .css('font-size', '80%')
              .css('background', '#fff')
              .css('padding', '5px');
  
  that.container.hide();
  
  that.show = function(html) {
    that.container.html(html);
    that.container.show();
  };
  
  that.hide = function () {
    that.container.hide();
  };
  
  $(window).on('mousemove', function (event) {
    that.container.offset({
          'left': event.pageX,
          'top': event.pageY - that.container.height() - 20
    });         
  });

  return that;
};
