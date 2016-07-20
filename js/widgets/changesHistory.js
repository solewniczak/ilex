'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.console !== undefined)
  throw 'ilex.widgetsCollection.console already defined';


ilex.widgetsCollection.changesHistory = function (windowObject) {
  var that = {},
    width = windowObject.element.data('ilex-width'),
    height = windowObject.element.data('ilex-height');

  return that;
}
