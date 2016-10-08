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

ilex.tools.geometry.staticSizes = function(sizesList, availableSpace) {
    var staticSizesList = [];
  
    let staticSize = 0;
    //calculate columns static width to deal with percentage values
    for (let size of sizesList) {
      if ($.isNumeric(size)) {
        staticSize += size;
      }
    }
  
    let sizeWithoutStatic = availableSpace - staticSize;
    for (let size of sizesList) {
      //http://stackoverflow.com/questions/31508009/javascript-check-if-input-is-a-percentage
      //percentage
      if (/^\d+(\.\d+)?%$/.test(size)) {
        let value = Number.parseFloat(size) / 100.0;
        staticSizesList.push(sizeWithoutStatic * value);
      } else {
        staticSizesList.push(size);
      }
    }
  return staticSizesList;
};

ilex.tools.geometry.updateColumnsSizes = function(columnSizes, delta) {
  var newColumnSizes = [];
  if (/^\d+(\.\d+)?%$/.test(columnSizes[0]) && $.isNumeric(columnSizes[1])) {
    newColumnSizes[0] = columnSizes[0];
    newColumnSizes[1] = columnSizes[1] - delta;
    if (newColumnSizes[1] < 0) {
      newColumnSizes[1] = 0;
    }
  }
  return newColumnSizes;
};