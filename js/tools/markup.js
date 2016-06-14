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
    for (let i = 0; i < linkEnd.ranges.length; i++) {
      let range = linkEnd.ranges[i],
        vspan = linkEnd.vspanSet[i],
        $spanTag = ilex.tools.markup.entireTagSelected(range);

      if ($spanTag) {
        let links = $spanTag.data('ilex-links');
        links.push(link);
        $spanTag
          .addClass('ilex-link-id-'+link.id+'-range-'+i)
          .data('ilex-links', links);
      } else {
        let $cont = ilex.tools.markup.createIlexSpan()
                                    //we use attr instead of data to see the
                                    //value in the document inspector
                                    .attr('data-ilex-startoffset', vspan.start)
                                    .attr('data-ilex-endoffset', vspan.end)
                                    .addClass('ilex-link-id-'+link.id+'-range-'+i)
                                    .data('ilex-links', [link]);

        range.surroundContents($cont[0]);
      }
      //update links ranges

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
//jQuery.data('ilex-endoffset') to every node in IlexDocumentObject.content.
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
  var elements = $parent.contents();
  if (elements.length === 0) {
    return undefined;
  }
  //doc.container has always ilex-startoffset = 0 and ilex-endoffset = 0
  var prevElement = $parent,
    curElement = elements[0];

  //check if the offset is at the begin of a parent
  if (curElement.nodeType  === Node.TEXT_NODE) {
    let startOffset = $parent.data('ilex-startoffset'),
      length = curElement.length;

    if (absoluteOffset <= startOffset + length) {
      return {'element': curElement, 'offset': absoluteOffset - startOffset};
    }
  }

  for (let i = 0; i < elements.length; i++) {
    curElement = elements[i];

    //if the current element is TEXT_NODE, the previous must be ELEMENT_NODE
    //there cannot be two TEXT_NODEs in a row - becouse they will be one
    //TEXT_NODE :)
    if (curElement.nodeType === Node.TEXT_NODE) {
      let endOffset = $(prevElement).data('ilex-endoffset'),
        length = curElement.length;

      if (absoluteOffset <= endOffset + length) {
        return {'element': curElement, 'offset': absoluteOffset - endOffset};
      }
    //check span content
    //http://ejohn.org/blog/nodename-case-sensitivity/
    } else if (curElement.tagName === 'SPAN') {
      let endOffset = $(curElement).data('ilex-endoffset');

      if (absoluteOffset < endOffset) {
        let result = ilex.tools.markup.findRelativePosition($(curElement), absoluteOffset);
        if (result !== undefined) {
          return result;
        }
      }
    }

    prevElement = curElement;
  }

  return undefined;
};

//translate relatieve offset into absolute offset
ilex.tools.markup.findAbsolutePosition = function(node, relatieveOffset) {
  if (node.previousSibling === null) {
    return $(node.parentNode).data('ilex-startoffset') + relatieveOffset
  } else {
    return $(node.parentNode).data('ilex-startoffset') +
            $(node.previousSibling).data('ilex-endoffset') +
            relatieveOffset;
  }
}

//Function takes UTF-8 content adds <br> before evety '\n' characters. Every <br>
//contatins data-ilex-position attribute - absolute offset of the FIRST
//caracter AFTER <br> tag.
ilex.tools.markup.nl2brWithAddresses = function(content) {
  var newContent = '';
  for (let i = 0; i < content.length; i++) {
    let char = content[i];
    if (char === '\n') {
      newContent += '\n<br data-ilex-startoffset="'+(i+1)+'" data-ilex-endoffset="'+(i+1)+'">';
    } else {
      newContent += char;
    }
  }
  return newContent;
  //change every second space into &nbsp;
};
