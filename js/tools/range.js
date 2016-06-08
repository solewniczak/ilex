'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.tools === undefined)
    throw 'ilex.tools undefined';
if (ilex.tools.address === undefined)
    throw 'ilex.tools.address undefined';

ilex.tools.range = {};

ilex.tools.range.filterCollapsed = function(ranges) {
  var notCollapsedranges = [];
  for (let range of ranges) {
    if(range.collapsed === false) {
      notCollapsedranges.push(range);
    }
  }
  return notCollapsedranges;
};

//returns cartesian of two ranges lists
ilex.tools.range.cartesianOfNotCollapsedRanges = function(rangeList1, rangeList2) {
  var cartesian = [];
  for (let doc1Range of ilex.tools.range.filterCollapsed(rangeList1)) {
    for (let doc2Range of ilex.tools.range.filterCollapsed(rangeList2)) {
        cartesian.push([doc1Range, doc2Range]);
    }
  }
  return cartesian;
};

//group as many ranges as possible and return resulting list
ilex.tools.range.groupRanges = function(ranges) {
  if (ranges.length === 0) {
    return [];
  }
  var newRanges = [];
  //console.log(ranges);
  ranges.sort(function (a,b) {
    return a.compareBoundaryPoints(Range.START_TO_START, b);
  });

  let currentRange = ranges[0];
  for (let i = 1; i < ranges.length; i++) {
    let range = ranges[i];
    //range overlaps currentRange

    if (currentRange.compareBoundaryPoints(Range.START_TO_END, range) >= 0) {
      console.log(currentRange);
      console.log(range);
      if (range.compareBoundaryPoints(Range.END_TO_END, currentRange) >= 0) {
        currentRange.setEnd(range.endContainer, range.endOffset);
      }
    } else {
      newRanges.push(currentRange);
      currentRange = ranges[i];
    }
  }
  newRanges.push(currentRange);
console.log(newRanges);
  return newRanges;
};

//create Array of Range objects from vspan-set
ilex.tools.range.createFromVspanSet = function(doc, vspanSet) {
  var ranges = [],
    vspanIntervals = ilex.tools.address.vspanSet(vspanSet);
  for (let interval of vspanIntervals) {
    let range = document.createRange();
    console.log(doc.content.contents());
    range.setStart(doc.content.contents()[0], interval.start);
    range.setEnd(doc.content.contents()[0], interval.end);
    ranges.push(range);
  }
  return ranges;
};
