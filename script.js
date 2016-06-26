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

  // init with requesting info about all texts
  ilexServer.init(function () {
    ilexServer.send({action : "requestAllTextsInfo", parameters: {}});
  }, function (data) {
    var json = JSON.parse(data);
	if (json.action === 'allTextsInfoResponse') {
		var texts_info = json.parameters.texts;
		var document_ids = [];
		var names = [];
		for (let i = 0; i < texts_info.length; i++) {
			document_ids.push(texts_info[i].Id);
			names.push(texts_info[i].Name);
		}
    ilex.view.console.log(JSON.stringify(names));
    ilex.view.fileSelector.loadFilesList(names);

		// - - - - - - - - - - - - - - - - - - - - - - - - - -
		// Request texts using received names
		//
		// first, we need a new function for receiving
		ilexServer.socket.onmessage = function(msg) {
			var json = JSON.parse(msg.data);
			if (json.action === 'textRetrieved') {
				let parameters = json.parameters;
	    	if (parameters.target === 'left') {
	    	    ilex.view.leftText.loadText(parameters.text);
	    	} else if (parameters.target === 'right') {
	    	    ilex.view.rightText.loadText(parameters.text);
	    	}
	    	loadedTexts++;
	    	if (loadedTexts === 2) {
          //experiments with documentsSlider
          let wind1 = ilex.view.slider.addWindow(),
            wind2 = ilex.view.slider.addWindow(),
            hiddenText1 = ilex.widgetsCollection.text(wind1.element, ilex.canvas),
            hiddenText2 = ilex.widgetsCollection.text(wind2.element, ilex.canvas);
          wind1.setContentWidget(hiddenText1);
          wind2.setContentWidget(hiddenText2);
          //applySizes after creating new window
          hiddenText1.loadText("Gdańsk (kaszb. Gduńsk[4], łac. Dantiscum, Dantis, Gedanum[5], niem. Danzig) – miasto na prawach powiatu w północnej Polsce, położone nad Morzem Bałtyckim, u ujścia Motławy do Wisły, nad Zatoką Gdańską, na Pobrzeżu Gdańskim. Centrum kulturalne, naukowe i gospodarcze oraz węzeł komunikacyjny północnej Polski, stolica województwa pomorskiego. Ośrodek gospodarki morskiej z dużym portem handlowym.");
          hiddenText2.loadText("oN-Line System (NLS) – system przeznaczony do współpracy, zaprojektowany w latach 60. przez Douglasa Engelbarta i badaczy z Augmentation Research Center w Stanford Research Institute. System ten jako pierwszy praktycznie wdrażał łącza hipertekstowe, mysz komputerową (wynalezioną przez Engelbarta i Billa Englisha), monitor, okna, prezentacje komputerowe i inne nowoczesne pomysły. System był finansowany przez ARPA, NASA i U.S. Air Force.");
          ilex.applySize();
          ilex.view.slider.slideLeft();
          ilex.applySize();
	    	  //load links
	    	  for (let link of parameters.links) {
	    	    ilex.tools.connections.createLinkVspanSets(ilex.view.leftText, link[0],
	    	                                                ilex.view.rightText, link[1]);
	    	  }


	    	  $(document).trigger('canvasRedraw');
		    	}
			} else if (json.action === 'retrievalFailed') {
    			ilex.view.console.log(json.parameters.error);
		    	$(document).trigger('canvasRedraw');
			} else {
		    	ilex.view.console.log("Received unexpected response");
		    	$(document).trigger('canvasRedraw');
			}
		}

		// then, make requests with version:
	  ilexServer.send({action : "requestTextDump", parameters: {target: 'left', text: document_ids[3], version : 3}});
		// or, make requests without version:
		ilexServer.send({action : "requestTextDump", parameters: {target: 'right', text: document_ids[4]}});

		// - - - - - - - - - - - - - - - - - - - - - - - - - -
	} else if (json.action === 'gettingInfoFailed') {
    	ilex.view.console.log(json.parameters.error);
		$(document).trigger('canvasRedraw');
	} else {
    	ilex.view.console.log("Received unexpected response");
		$(document).trigger('canvasRedraw');
	}
  });

});
