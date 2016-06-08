'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.tools === undefined)
    throw 'ilex.tools undefined';

ilex.tools.address = {};

//parese vspan-set into convinient form for Range
ilex.tools.address.vspanSet = function(vspanSet) {
  var vspanArray = vspanSet.split(' '),
    vspanIntervals = [];

  for (let vspan of vspanArray) {
    let t = vspan.split('+'),
      start =  Number.parseInt(t[0]),
      end = start + Number.parseInt(t[1]);
    vspanIntervals.push({'start': start, 'end': end});
  }

  return vspanIntervals;
};
