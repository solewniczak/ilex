'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.tools === undefined)
    throw 'ilex.tools undefined';

ilex.tools.markup = {};

//span count is used to create unique identifiers for all visible spans
ilex.tools.markup.spanCount = 0;
ilex.tools.markup.createIlexSpan = function () {
    var $span =
      $('<span class="ilex-connection" id="ilex-span-'+ilex.tools.markup.spanCount+'">');
    ilex.tools.markup.spanCount += 1;
    return $span;
};

//returns root parent of DocumentFragment or undefined if fragment doesn't
//have single root element
ilex.tools.markup.getRoot = function(documentFragment) {
  var $tmp = $("<div>").append(documentFragment),
    contents = $tmp.contents();
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
    for (let range of linkEnd.ranges) {
      let $spanTag = ilex.tools.markup.entireTagSelected(range);

      if ($spanTag) {
        let links = $spanTag.data('ilex-links');
        links.push(link);
        $spanTag.data('ilex-links', links);
      } else {
        let $cont = ilex.tools.markup.createIlexSpan().data('ilex-links', [link]);
        range.surroundContents($cont[0]);
      }
    }
  }

  addLink(link.link[0]);
  addLink(link.link[1]);

};

//Range API returns start and end offsets relaively to start or end element.
//Element can be DOM Node or continious text (text without any Nodes inside).

//Function takes document offset (as return by Ilex back-end) and returns the
//element and the relative offset proper for Range API.

//To achieve intended behaviour, we bound jQuery.data('ilex-position') to every
//node in IlexDocumentObject.content. 'ilex-position' means the absolute position of the
//first character AFTER the Node.

//IlexDocumentObject.content can consists of three element types:
//  1. text elemens - we must take care of proper &something; handling
//  2. <br> Nodes - <br> nodes represents '\n' back-end characters. We must count
//     it as one character.
//  3. <span> Nodes - span elements means nothing from back-end point of view

ilex.tools.markup.findRelativePosition = function(doc, offset) {

};
