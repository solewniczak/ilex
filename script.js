'use strict';

$(document).ready(function(){
  $("body").css("overflow", "hidden");

  ilex.window = $('<div>').appendTo('body')
                      .css('position', 'relative')
                      .css('z-index', 2)
                      .data('ilex-width', $(window).width())
                      .data('ilex-height', $(window).height());

  //create ilex canvas element
  ilex.canvas = ilex.widgetsCollection.canvas($("body"), 3);

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
  ilex.server.sendAndRecieve('getAllDocumentsInfo', {}, {
    'allTextsInfoResponse':
          function (params) {
            var texts =  params.texts;
            ilex.view.fileSelector.loadFilesList(texts);

            //load example texts
            ilex.view.slider.createWindowSplitSlider(false);
            ilex.view.slider.createWindow();
            var loadToWindow = function (winInd, id, version) {
              ilex.server.sendAndRecieve('documentGetDump', {
                'text': id,
                'version': version,
                'tab': winInd,
              },
              {
                'documentRetrieved':
                  function (params) {
                    ilex.view.loadText(winInd, params);
                    
                    if (winInd === 2) {
                      //load links
                      for (let link of params.links) {
                        ilex.tools.connections
                          .createLinkVspanSets(ilex.view.slider.windows[0].contentWidget, link[0],
                                               ilex.view.slider.windows[1].contentWidget, link[1]);
                      }
                    }
                  },
                'retrievalFailed':
                  function (params) {
                    ilex.view.console.log(params.error);
                  },
              });
            };
            loadToWindow(0, texts[0].id, texts[0].total_versions);
            loadToWindow(1, texts[3].id, 1); //texts[2].total_versions);
            loadToWindow(2, texts[4].id, 1); //texts[1].total_versions);
          },
    'retrievalFailed':
          function (params) {
            ilex.view.console.log(params.error);
          },
  });
});
