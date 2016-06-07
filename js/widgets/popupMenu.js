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

  that.show = function() {

  };

  that.addElement = function(html, onselect) {

  };

  that.cleanElements = function() {

  };

};
