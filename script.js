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

  ilex.server = ilex.tools.server.create('ws://127.0.0.1:9000/echobot');
  //download text list
  ilex.server.sendAndRecieve('requestAllTextsInfo', {}, {
    'allTextsInfoResponse':
          function (params) {
            var texts =  params.texts;
            ilex.view.fileSelector.loadFilesList(texts);

            //load example texts
            ilex.view.slider.createWindowSplitSlider();
            ilex.view.slider.createWindow();
            var loadToWindow = function (winInd, id, version) {
              ilex.server.sendAndRecieve('requestTextDump', {
                'text': id,
                'version': version,
                'tab': winInd,
              },
              {
                'textRetrieved':
                  function (params) {
                    ilex.view.loadText(winInd, params.text);
                    //load links
          	    	  for (let link of params.links) {
          	    	    ilex.tools.connections.createLinkVspanSets(ilex.view.slider.windows[0].contentWidget, link[0],
          	    	                                                ilex.view.slider.windows[1].contentWidget, link[1]);
          	    	  }
                  },
                'retrievalFailed':
                  function (params) {
                    ilex.view.console.log(params.error);
                  },
              })
            };
            loadToWindow(0, texts[0].Id, 1);
            loadToWindow(1, texts[1].Id, 1);
            loadToWindow(2, texts[2].Id, 1);
          },
    'retrievalFailed':
          function (params) {
            ilex.view.console.log(params.error);
          },
  });
});
