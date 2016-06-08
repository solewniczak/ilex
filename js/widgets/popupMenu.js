'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.popupMenu !== undefined)
  throw 'ilex.widgetsCollection.popupMenu already defined';

ilex.widgetsCollection.popupMenu = function ($parentWidget, zIndex) {
  var that = {},
    zIndex = zIndex || 3,
    elements = [];

  that.menu = $('<div class="ilex-popup-menu">').appendTo($parentWidget)
                                .css('z-index', zIndex)
                                .css('position', 'absolute')
                                .hide();

  that.show = function(x, y) {
    that.menu.offset({'top': top, 'left': left}).show();
  };

  that.addElement = function(html, onclick) {
    var $elm = $('<div>').html(html).appendTo(that.menu);
    $elm.on('click', function (event) {
      onclick(event);
      that.menu.hide();
    });
  };

  that.clean = function() {
    that.menu.html('');
  };

  return that;
};
