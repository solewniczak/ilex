'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.textToolbar !== undefined)
  throw 'ilex.widgetsCollection.horizontalSplit already defined';

ilex.widgetsCollection.textToolbar = function ($parentWidget, textWidget) {
  var that = {},
    alternateTextWidget,
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
      if (typeof node === 'function') {
        $button.on('mousedown', node);
      } else {
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
      }
      return $button;
    },
    addSeparator = function () {
      $('<div class="ilex-separator">').appendTo(that.toolbar);
    };

    //we need alternate text widget to perform transclusion
    that.setAlternateTextWidget = function (widget) {
      alternateTextWidget = widget;
    };

    that.toolbar = $('<div class="ilex-text-toolbar">').appendTo($parentWidget);

    addButton(that, '&#xf032;', '<b>');
    addButton(that, '&#xf033;', '<i>');
    addButton(that, '&#xf0cd;', '<u>');
    addSeparator();
    var transcludeButton = addButton(that, '&#xf10d;', function() {
      alert('transclude');
    });
    that.toolbar.find('.ilex-button').addClass('ilex-disabled');

    //we enable transclusion button when:
    //1. something is selected in alternate text
    //2. we have collapsed selection in text widget
    let enableTransclusion = function() {
      if (alternateTextWidget.selectionRange.collapsed !== undefined &&
          alternateTextWidget.selectionRange.collapsed === false) {
        if (textWidget.selectionRange.collapsed !== undefined &&
            textWidget.selectionRange.collapsed === true) {
          return true;
        }
      }
      return false;
    };

    //enable transclusion when user gives focus
    textWidget.container.on('selectstart', function(event) {
      console.log(transcludeButton);
      if (enableTransclusion()) {
        transcludeButton.removeClass('ilex-disabled');
      } else {
        transcludeButton.addClass('ilex-disabled');
      }
    });

    textWidget.container.on('mouseenter', function(event) {
      that.toolbar.find('.ilex-button').removeClass('ilex-disabled');
        //check if enable transclude button
        if (enableTransclusion()) {
          transcludeButton.removeClass('ilex-disabled');
        } else {
          transcludeButton.addClass('ilex-disabled');
        }
    });
    textWidget.container.on('mouseleave', function(event) {
      that.toolbar.find('.ilex-button').addClass('ilex-disabled');
    });

    return that;
};
