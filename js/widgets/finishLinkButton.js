'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';

//doc1, doc2 must have .selectionRange property which indicates currently
//selected part of the document
ilex.widgetsCollection.finishLinkButton = function ($parentWidget, doc1, doc2) {
  var that = {};
  //We append not replace parent widget
  //Besouse we are absolute positioning
  //Unicode Character 'LINK SYMBOL' (U+1F517)
  that.button = $('<div class="ilex-button cycle">🔗</div>').appendTo($parentWidget)
                    .css('position', 'absolute')
                    .css('top', 100)
                    .css('left', 100).hide();
  return that;
}
