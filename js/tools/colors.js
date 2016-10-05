'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.tools === undefined)
    throw 'ilex.tools undefined';
if (ilex.tools.markup === undefined)
    throw 'ilex.tools.markup undefined';

ilex.tools.colors = {};

ilex.tools.colors.htmlToRgba = function (htmlColor, alpha) {
  if (alpha === undefined) {
    alpha = 1;
  }
  var red = htmlColor.substr(1, 2),
      green = htmlColor.substr(3, 2),
      blue = htmlColor.substr(5, 2);
    
  var redInt = Number.parseInt(red, '16'),
      greenInt = Number.parseInt(green, '16'),
      blueInt = Number.parseInt(blue, '16');
  
  return 'rgba('+redInt+','+greenInt+','+blueInt+','+alpha+')';
};