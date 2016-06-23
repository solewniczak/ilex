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

//returns cartesian of two ranges lists
ilex.tools.range.cartesian = function(rangeList1, rangeList2) {
  var cartesian = [];
  for (let doc1Range of rangeList1) {
    for (let doc2Range of rangeList2) {
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

  ranges.sort(function (a,b) {
    return a.compareBoundaryPoints(Range.START_TO_START, b);
  });

  let currentRange = ranges[0];
  for (let i = 1; i < ranges.length; i++) {
    let range = ranges[i];
    //range overlaps currentRang
    if (currentRange.compareBoundaryPoints(Range.START_TO_END, range) >= 0) {
      if (range.compareBoundaryPoints(Range.END_TO_END, currentRange) >= 0) {
        currentRange.setEnd(range.endContainer, range.endOffset);
      }
    } else {
      newRanges.push(currentRange);
      currentRange = ranges[i];
    }
  }
  newRanges.push(currentRange);

  return newRanges;
};

//create Array of Range objects from vspan-set
ilex.tools.range.createFromVspanSet = function(doc, vspanSet) {
  var ranges = [];
  for (let interval of vspanSet) {
    let range = document.createRange(),
      start = ilex.tools.markup.findRelativePosition(doc.content, interval.start),
      end = ilex.tools.markup.findRelativePosition(doc.content, interval.end);

    range.setStart(start.element, start.offset);
    range.setEnd(end.element, end.offset);

    ranges.push(range);
  }
  return ranges;
};

//check if range is inside span tag
ilex.tools.range.insideSpan = function(range) {
  if (range.startContainer.parentNode.nodeName === "SPAN" &&
      range.endContainer.parentNode.nodeName === "SPAN") {
    return range.startContainer.parentNode;
  } else {
    return undefined;
  }
};

//It's very tricky.
//In a Selection Range ALWAYS one of its ends is inside SPAN we will call it
//ANCHOR. The second may or may not be inside span. If it is outside we try find
//the first/last selected SPAN and treat it as end of seleciton.

ilex.tools.range.getClientRects = function (range, doc) {
  var pushClientRectsToArray = function(rects, clientRectsList) {
    for (let i = 0; i < clientRectsList.length; i++) {
      rects.push(clientRectsList[i]);
    }
  }, hasSpanParent = function (node) {
    return node.parentNode && node.parentNode.nodeName === 'SPAN';
  },
  createClientRect = function (x, y, w, h) {
    return {
      left: x,
      top: y,
      right: x + w,
      bottom: y + h,
      width: w,
      height: h
    };
  };

  if (range.collapsed === true) {
    return [];
  }
  if (range.startContainer === range.endContainer) {
    return range.getClientRects();
  } else {
    var startElement, endElement;
    //we assume that <BR> selection is not possible
    let rects = [];
    if (hasSpanParent(range.startContainer)) {
      let startRange = document.createRange();
      startRange.setStart(range.startContainer, range.startOffset);
      startRange.setEnd(range.startContainer, range.startContainer.length);
      pushClientRectsToArray(rects, startRange.getClientRects());
      startElement = range.startContainer.parentNode.nextSibling;
    //we have selected <div>
    } else {
      startElement = range.startContainer.childNodes[range.startOffset];
    }


    if (hasSpanParent(range.endContainer)) {
      let endRange = document.createRange();
      endRange.setStart(range.endContainer, 0);
      endRange.setEnd(range.endContainer, range.endOffset);
      pushClientRectsToArray(rects, endRange.getClientRects());
      endElement = range.endContainer.parentNode;
    //we have selected <div>
    } else {
      endElement = range.endContainer.childNodes[range.endOffset].previousSibling;
      pushClientRectsToArray(rects, endElement.getClientRects());
    }

    let elm = startElement;
    while (elm !== endElement) {
      if (elm.nodeName === "BR") {
        let elmRects = elm.getClientRects(),
          rect = elmRects[0];
        pushClientRectsToArray(rects, [createClientRect(rect.left, rect.top, 5, rect.height)]);
      } else {
        pushClientRectsToArray(rects, elm.getClientRects());
      }
      elm = elm.nextSibling;
    }
    return rects;
  }
};
