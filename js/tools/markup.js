'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.tools === undefined)
    throw 'ilex.views undefined';

ilex.tools.markup = {};

//span count is used to create unique identifiers for all visible spans
ilex.tools.markup.spanCount = 0;

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
        //if cloned DocumentFragmen has a root select it from original document
        return $('#'+$root.attr('id'));
    }
  }

  return undefined;
};
var count = 0;
ilex.tools.markup.addConnectionTag = function (link) {
  var addLink = function(linkEnd) {
    var $spanTag = ilex.tools.markup.entireTagSelected(linkEnd.range);

    if ($spanTag) {
      let links = $spanTag.data('ilex-links');
      links.push(link);
      $spanTag.data('ilex-links', links);
    } else {
      let $cont = $('<span class="ilex-connection" id="ilex-span-'+ilex.tools.markup.spanCount+'">')
                        .data('ilex-links' , [link]);
      ilex.tools.markup.spanCount += 1;
      linkEnd.range.surroundContents($cont[0]);
    }
  }

  addLink(link.link[0]);
  addLink(link.link[1]);

};
