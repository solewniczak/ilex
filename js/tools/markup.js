'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.tools === undefined)
    throw 'ilex.tools undefined';

ilex.tools.markup = {};

//span count is used to create unique identifiers for all visible spans
ilex.tools.markup.spanCount = 0;
ilex.tools.markup.generateIlexSpanId = function () {
  var id = 'ilex-span-'+ilex.tools.markup.spanCount;
  ilex.tools.markup.spanCount += 1;
  return id;
};

ilex.tools.markup.createIlexSpan = function () {
    var $span =
      $('<span id="'+ilex.tools.markup.generateIlexSpanId()+'">');
    return $span;
};

//Create new span BEFORE @span
//It's important not to break original span.
//It may be used by Range API endContainer.
ilex.tools.markup.sliceIlexSpanBefore = function (span, offset) {
  if (span.nodeName !== 'SPAN') {
    throw 'ilex.tools.markup.sliceIlexSpanBetween: first argument is not span node';
  }
  var text = $(span).text(),
    //text[offset] is OUTSIDE of leftText
    leftText = text.slice(0, offset),
    rightText = text.slice(offset),
    startoffset = $(span).data('ilex-startoffset'),
    endoffset = $(span).data('ilex-endoffset'),
    classes = $(span).attr('class'),
    links = $(span).data('ilex-links') || [];

  $(span)
        .data('ilex-startoffset', startoffset + offset)
        .data('ilex-endoffset', endoffset)
        .addClass(classes)
        .data('ilex-links', links)
        .text(rightText);
  //don't create extra span element
  if (offset === 0) {
    return $(span);
  }

  var $leftSpan = ilex.tools.markup.createIlexSpan()
          .data('ilex-startoffset', startoffset)
          .data('ilex-endoffset', startoffset + offset)
          .addClass(classes)
          .data('ilex-links', links)
          .text(leftText);

  $(span).before($leftSpan);

  return $(span);
};

//Create new span AFTER @span
//It's important not to break original span.
//It may be used by Range API endContainer.
ilex.tools.markup.sliceIlexSpanAfter = function (span, offset) {
  if (span.nodeName !== 'SPAN') {
    throw 'ilex.tools.markup.sliceIlexSpanBetween: first argument is not span node';
  }
  var text = $(span).text(),
    //text[offset] is OUTSIDE of leftText
    leftText = text.slice(0, offset),
    rightText = text.slice(offset),
    startoffset = $(span).data('ilex-startoffset'),
    endoffset = $(span).data('ilex-endoffset'),
    classes = $(span).attr('class'),
    links = $(span).data('ilex-links') || [];

  $(span)
        .data('ilex-startoffset', startoffset)
        .data('ilex-endoffset', startoffset + offset)
        .addClass(classes)
        .data('ilex-links', links)
        .text(leftText);

  //don't create extra span element
  if (text === leftText) {
    return $(span);
  }

  var $rightSpan = ilex.tools.markup.createIlexSpan()
            .data('ilex-startoffset', startoffset + offset)
            .data('ilex-endoffset', endoffset)
            .addClass(classes)
            .data('ilex-links', links)
            .text(rightText);

  $(span).after($rightSpan);
  return $(span);
};

//Create new span AFTER @span
//It's important not to break original span.
//It may be used by Range API endContainer.
ilex.tools.markup.sliceIlexSpanBetween = function (span, start, end) {
  if (span.nodeName !== 'SPAN') {
    throw 'ilex.tools.markup.sliceIlexSpanBetween: first argument is not span node';
  }
  //don't create collapsed ranges
  if (start === end) {
    throw 'ilex.tools.markup.sliceIlexSpanBetween: start('+start+') is equal to end('+end+')';
  }
  var text = $(span).text();
  if (start === 0) {
    return ilex.tools.markup.sliceIlexSpanAfter(span, end);
  } else if (text.length === end) {
    return ilex.tools.markup.sliceIlexSpanBefore(span, start);
  }

  var startoffset = $(span).data('ilex-startoffset'),
    endoffset = $(span).data('ilex-endoffset'),
    classes = $(span).attr('class'),
    links = $(span).data('ilex-links') || [], //there are spans wihout links
    leftText = text.slice(0, start),
    middleText = text.slice(start, end),
    rightText  = text.slice(end);

    var $leftSpan = ilex.tools.markup.createIlexSpan()
                .data('ilex-startoffset', startoffset)
                .data('ilex-endoffset', startoffset + start)
                .addClass(classes)
                .data('ilex-links', links)
                .text(leftText);

    //middle span
    $(span)
                .data('ilex-startoffset', startoffset + start)
                .data('ilex-endoffset', startoffset + end)
                .data('ilex-links', links)
                .text(middleText);

    var $rightSpan = ilex.tools.markup.createIlexSpan()
                .data('ilex-startoffset', startoffset + end)
                .data('ilex-endoffset', endoffset)
                .addClass(classes)
                .data('ilex-links', links)
                .text(rightText);

    $(span).before($leftSpan);
    $(span).after($rightSpan);

    return $(span);
};

//add link into ilex span
ilex.tools.markup.addLink = function ($span, link) {
  //if links undefined create new array
  var links = $span.data('ilex-links') || [];
  links.push(link);
  $span.data('ilex-links', links);
};

//returns root parent of DocumentFragment or undefined if fragment doesn't
//have single root element
ilex.tools.markup.getRoot = function(documentFragment) {
  var $tmp = $("<div>").append(documentFragment),
    //filter empty texts
    contents = $tmp.contents().filter(function() {
      return (this.nodeType === Node.ELEMENT_NODE) ||
             (this.nodeType === Node.TEXT_NODE && this.length > 0);
    });

  if (contents.length === 1 && contents[0].nodeType === Node.ELEMENT_NODE) {
    return $(contents[0]);
  }
  return undefined;
};

//The entireTagSelected checks if selRange fits entirely in some tag

//In the Range API this two ranges are diffirent:
//<span>[This is selected range]</span>
//[<span>This is selected range</span>]
//Although from the user point of view they are equal. There is also no visual
//diffirence between them. Selection API .getRangeAt call always returns fast
//case. The second case is a result of Range.surroundContents.

//The entireTagSelected treats both of this cases in the same way and in both
//causes return <span> element.
ilex.tools.markup.entireTagSelected = function (selRange) {
  var commonAncestor = selRange.commonAncestorContainer,
    commonAncestorRange = document.createRange();

  commonAncestorRange.selectNodeContents(commonAncestor);

  //<span>[This is selected range]</span>
  if (selRange.compareBoundaryPoints(Range.END_TO_END, commonAncestorRange) === 0 &&
    selRange.compareBoundaryPoints(Range.START_TO_START, commonAncestorRange) === 0) {
    return $(commonAncestor.parentNode);
  //[<span>This is selected range</span>]
  } else {
    let selRangeContents = selRange.cloneContents(),
      $root = ilex.tools.markup.getRoot(selRangeContents);
    if ($root) {
        //if cloned DocumentFragmen has a root, select it from original document
        return $('#'+$root.attr('id'));
    }
  }

  return undefined;
};

ilex.tools.markup.addConnectionTag = function (link) {
  var addLink = function(linkEnd) {
    for (let i = 0; i < linkEnd.vspanSet.length; i++) {
      let vspan = linkEnd.vspanSet[i],
        start = ilex.tools.markup.findRelativePosition(linkEnd.doc.content, vspan.start),
        end = ilex.tools.markup.findRelativePosition(linkEnd.doc.content, vspan.end);

      if (start.element === end.element) {
        let $span = ilex.tools.markup.sliceIlexSpanBetween(start.element.parentNode,
                                                           start.offset,
                                                           end.offset);
        $span.addClass('ilex-link-id-'+link.id+'-range-'+i);
        $span.addClass('ilex-connection');
        ilex.tools.markup.addLink($span, link);
      } else {
        let $start = ilex.tools.markup.sliceIlexSpanBefore(start.element.parentNode, start.offset),
          $end = ilex.tools.markup.sliceIlexSpanAfter(end.element.parentNode, end.offset);

        for (let $node = $start; !$node.is($end); $node = $node.next()) {
          if ($node[0].nodeName === "SPAN") {
            $node.addClass('ilex-link-id-'+link.id+'-range-'+i);
            $node.addClass('ilex-connection');
            ilex.tools.markup.addLink($node, link);
          }
        };
        $end.addClass('ilex-link-id-'+link.id+'-range-'+i);
        $end.addClass('ilex-connection');
        ilex.tools.markup.addLink($end, link);
      }
    }
  };

  addLink(link.link[0]);
  addLink(link.link[1]);


};

//Range API returns start and end offsets relaively to start or end Element.
//Element can be DOM Node or continious text (text without any Nodes inside).

//Function takes document offset (as return by Ilex back-end) and returns the
//element and the relative offset proper for Range API.

//To achieve intended behaviour, we bound jQuery.data('ilex-startoffset') and
//jQuery.data('ilex-endoffset') to every <span> in IlexDocumentObject.content.
//'ilex-startoffset' indicates the absolute position of the FIRST character
//AFTER the Node opening tag.
//'ilex-endoffset' indicates the absolute position of the FIRST character
//AFTER the Node ending tag.

//IlexDocumentObject.content can consists of three element types:
//  1. text elemens - we must take care of proper &something; handling
//  2. <br> Nodes - <br> is inserted after \n character which it represents
//  3. <span> Nodes - span elements means nothing from back-end point of view

//return {element: element, offset: relatieve offset}
ilex.tools.markup.findRelativePosition = function($parent, absoluteOffset) {
  var result = undefined;
  $parent.find('span').each(function() {
    let startOffset = $(this).data('ilex-startoffset'),
      endOffset = $(this).data('ilex-endoffset');

    if (startOffset <= absoluteOffset && endOffset >= absoluteOffset) {
      result = {'element': this.childNodes[0], 'offset': absoluteOffset - startOffset};
      return;
    }
  });

  return result;
};

//translate relatieve offset into absolute offset
ilex.tools.markup.findAbsolutePosition = function(node, relatieveOffset) {
  if (node.nodeName !== 'SPAN') {
    throw 'ilex.tools.markup.findAbsolutePosition: first argument is not span node';
  }

  return $(node).data('ilex-startoffset') + relatieveOffset
}
