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
    zIndex = zIndex || 3,
    showTimeout = 500;

  that.container = $('<div class="ilex-popupNote">').appendTo($parentWidget)
              .css('position', 'absolute')
              .css('z-index', zIndex)
              .css('font', '12px IlexSans')
              .css('box-shadow', '0 0 10px #aaa')
              .css('background', '#fbeaa0')
              .css('padding', '5px');
  
  that.container.hide();
  
  var timeoutId;
  that.show = function(top, left, html) {
    timeoutId = window.setTimeout(function () {
      that.container.html(html);
      that.container
        .css('left', left)
        .css('top', top + 10)
        .show();
     }, showTimeout);
  };
  
  that.hide = function () {
    that.container.hide();
    window.clearTimeout(timeoutId);
  };
  
  return that;
};
