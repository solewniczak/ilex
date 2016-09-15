'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.tools === undefined)
    throw 'ilex.tools undefined';
if (ilex.tools.markup === undefined)
    throw 'ilex.tools.markup undefined';

ilex.tools.geometry = {};

//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIDOMClientRect
ilex.tools.geometry.createClientRect = function (x, y, w, h) {
  return {
            bottom: y + h,
            height: h,
            left: x,
            right: x + w,
            top: y,
            width: w,
            x: x,
            y: y
        };
};