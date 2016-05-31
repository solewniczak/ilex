'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.textToolbar !== undefined)
  throw 'ilex.widgetsCollection.horizontalSplit already defined';

ilex.widgetsCollection.textToolbar = function ($parentWidget) {
  var that = {},
    addButton = function(that, text, node) {
      var elementsAreEqual = function(a, b) {
        var $a = $(a), $b = $(b);
        if ($a.prop("tagName") === $b.prop("tagName") && $a.attr('class') === $b.attr('class')) {
          return true;
        }
        return false;
      },
      $button = $('<div class="ilex-button ilex-awesome">').appendTo(that.toolbar)
                      .html(text);
      $button.on('mousedown', function (event) {
        var selection = window.getSelection(),
          surroundRange = document.createRange(),
          $surround, selectionRange;

        //this doesn't work with custom <b> style
        //document.execCommand(command, false, null);

        if (selection.rangeCount <= 0) {
          return;
        }
        selectionRange = selection.getRangeAt(0);
        //create new surround node
        $surround = $(node);

        //if selection is surrounded, remove surrounded target
        console.log(selectionRange.startOffset, selectionRange.startContainer);
        if (selectionRange.startOffset === 0 &&
            elementsAreEqual(selectionRange.startContainer, $surround)) {
          let commonAncestor = $(selectionRange.commonAncestorContainer)
          //remove only parent element
          commonAncestor.replaceWith(commonAncestor.contents());
          console.log(commonAncestor.contents());
          //surroundRange.selectNode(commonAncestor.contents()[0]);
        } else {
          //create new Node
          selectionRange.surroundContents($surround[0]);
          surroundRange.selectNode($surround.contents()[0]);
        }

        //select previously selected text
        selection.removeAllRanges();
        selection.addRange(surroundRange);

        //prevent focus stealing
        event.preventDefault();
      });
      return $button;
    };
    that.toolbar = $('<div class="ilex-text-toolbar">').appendTo($parentWidget);

    addButton(that, '&#xf032;', '<b>');
    addButton(that, '&#xf033;', '<i>');
    addButton(that, '&#xf0cd;', '<u>');

    return that;
};
