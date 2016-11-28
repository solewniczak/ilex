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

//range is normalized range

ilex.tools.range.getClientRects = function (range, doc) {
  var pushClientRectsToArray = function(rects, clientRectsList) {
    for (let i = 0; i < clientRectsList.length; i++) {
      rects.push(clientRectsList[i]);
    }
  },
  getTextSelectionRange = function(container, startOffset, endOffset) {
    var rects = [],
        range = document.createRange();
    
    range.setStart(container, startOffset);
    range.setEnd(container, endOffset);
    return range.getClientRects();
  },
  selectSpansFromSingleLine = function(range) {
    if (range.startContainer === range.endContainer) {
      return range.getClientRects();
    } else {
      var startSpan = range.startContainer.parentElement,
          endSpan = range.endContainer.parentElement,
          rects = [];

      pushClientRectsToArray(rects,
                             getTextSelectionRange(range.startContainer,
                                                   range.startOffset,
                                                   range.startContainer.length));
      pushClientRectsToArray(rects,
                     getTextSelectionRange(range.endContainer, 0, range.endOffset));

      let span = startSpan.nextElementSibling;
      while (span !== endSpan) {
        if (span === null) {
          throw "ilex.tools.range.getTextSelectionRange: can't reach end span";
        }
        pushClientRectsToArray(rects, span.getClientRects());
        span = span.nextElementSibling;
      }

      return rects;
    }
  };

  if (range.collapsed === true) {
    return [];
  }
  var startLine = range.startContainer.parentElement.parentElement,
      endLine = range.endContainer.parentElement.parentElement,
      rects = [];

  if (startLine === endLine) {
    pushClientRectsToArray(rects, selectSpansFromSingleLine(range));
  } else {
    let startLineRange = document.createRange(),
        endLineRange = document.createRange();

    startLineRange.setStart(range.startContainer, range.startOffset);
    startLineRange.setEnd(startLine.lastElementChild.firstChild,
                          startLine.lastElementChild.firstChild.length);
    pushClientRectsToArray(rects, selectSpansFromSingleLine(startLineRange));
    
    //create rect from the end of first line text to the end of first line <div>
    let lastRect = rects[rects.length-1],
        startLineOffset = $(startLine).offset(),
        startLineRight = startLineOffset.left + $(startLine).width(),
        finishLineRect =
          ilex.tools.geometry.createClientRect(lastRect.left,
                                               lastRect.top,
                                               startLineRight - lastRect.left,
                                               lastRect.height);
    pushClientRectsToArray(rects, [finishLineRect]);
    
    endLineRange.setStart(endLine.firstElementChild.firstChild, 0);
    endLineRange.setEnd(range.endContainer, range.endOffset);
    pushClientRectsToArray(rects, selectSpansFromSingleLine(endLineRange));
   
    let line = startLine.nextElementSibling;
    while (line !== endLine) {
      pushClientRectsToArray(rects, line.getClientRects());
      line = line.nextElementSibling;
    }
  }
  return rects;
};


//start and end container are always span texts.
ilex.tools.range.normalize = function (range) {
  var hasSpanParent = function (node) {
    return node.parentNode && node.parentNode.nodeName === 'SPAN';
  };
  
  if (
      (!hasSpanParent(range.startContainer) &&      
        !range.startContainer.hasChildNodes()) ||
     (!hasSpanParent(range.endContainer) &&      
        !range.endContainer.hasChildNodes()) ) {
    console.log("textEditor.normalizeRange: document doesn't contains any lines.");
    return document.createRange();
  }
  
  //we have selected <div>
  if (!hasSpanParent(range.startContainer)) {
    range.setStart(range.startContainer.childNodes[range.startOffset].childNodes[0], 0);
  }

  if (!hasSpanParent(range.endContainer)) {
    range.setEnd(range.endContainer.childNodes[range.endOffset].childNodes[0], 0);
  }
  
  return range;
};

