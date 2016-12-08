'use strict';

//http://stackoverflow.com/questions/5680013/how-to-be-notified-once-a-web-font-has-loaded

//This function also checks if we have modern browser:
//Chrome >= 35
//Firefox >= 41
//More info:
//https://developer.mozilla.org/en-US/docs/Web/API/CSS_Font_Loading_API
document.fonts.ready.then(function() {
  
  $('.ilex-noJavaScriptNotice').remove();
  
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

  ilex.view = ilex.views.slider(ilex.canvas);

  ilex.server = ilex.tools.server.create('ws://127.0.0.1:9000/echobot');
  //download text list
  ilex.server.sendAndRecieve('getAllDocumentsInfo', {}, {
    'allTextsInfoResponse':
          function (params) {
            var texts =  params.texts;
            ilex.documents.setFileArray(texts);

            //load example texts
            let win1 = ilex.view.slider.createWindow();
            ilex.view.slider.addWindowAfter(win1);
            
            
//            let win2 = ilex.view.slider.createWindow();
//            ilex.view.slider.addWindowAfter(win2);
            
            ilex.view.slider.visibleWindows.inc();

            ilex.applySize();
            
            var loadToWindow = function (winInd, id, version) {
              ilex.view.loadDocument(winInd, id);
              
//              ilex.server.sendAndRecieve('documentGetDump', {
//                'text': id,
//                'version': version,
//                'tab': winInd,
//              },
//              {
//                'documentRetrieved':
//                  function (params) {
//                    ilex.view.loadDocument(winInd, ilex.documents.get(params.id));
//                    
//                    if (winInd === 2) {
//                      //load links
//                      for (let link of params.links) {
//                        ilex.tools.connections
//                          .createLinkVspanSets(ilex.view.slider.windows[0].contentWidget, link[0],
//                                               ilex.view.slider.windows[1].contentWidget, link[1]);
//                      }
//                    }
//                  },
//                'retrievalFailed':
//                  function (params) {
//                    console.log(params.error);
//                  },
//              });
            };
            loadToWindow(0, texts[0].id, texts[0].totalVersions);
            loadToWindow(1, texts[1].id, texts[1].totalVersions);
          },
    'retrievalFailed':
          function (params) {
            console.log(params.error);
          },
  });
});
