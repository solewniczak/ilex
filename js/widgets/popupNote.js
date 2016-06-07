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

  that.show = function(html) {
    
  };

  return that;
};
