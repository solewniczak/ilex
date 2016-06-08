'use strict';

$(document).ready(function(){
  $("body").css("overflow", "hidden");

  ilex.window = $('<div>').appendTo('body')
                      .css('position', 'relative')
                      .css('z-index', 3)
                      .data('ilex-width', $(window).width())
                      .data('ilex-height', $(window).height());

  //create ilex canvas element
  ilex.canvas = ilex.widgetsCollection.canvas($("body"), 2);

  ilex.popupMenu = ilex.widgetsCollection.popupMenu($("body"), 4);

  $(window).on('resize', function () {
    var width = $(window).width(),
      height = $(window).height();
    ilex.window.data('ilex-width', width).data('ilex-height', height);
    ilex.window.width(width).height(height);
    ilex.applySize();
  });

  ilex.view = ilex.views.twoColumn(ilex.canvas);

  var loadedTexts = 0;
  ilexServer.init(function () {
    ilexServer.send({target: 'left', text: 'xanadu'});
    ilexServer.send({target: 'right', text: 'powiesc_wajdeloty'});
  }, function (data) {
    var json = JSON.parse(data);
    if (json.target === 'left') {
        ilex.view.leftText.loadText(json.text);
    } else if (json.target === 'right') {
        ilex.view.rightText.loadText(json.text);
    }
    loadedTexts++;
    if (loadedTexts === 2) {
      //load links
      for (let link of json.links) {
        ilex.tools.connections.createLinkVspanSets(ilex.view.leftText, link[0],
                                                    ilex.view.rightText, link[1]);
      }
      $(document).trigger('canvasRedraw');
    }
  });

});
