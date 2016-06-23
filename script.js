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
		var names = [];
		for (let i = 0; i < texts_info.length; i++) {
			names.push(texts_info[i].Name);
		}
    ilex.view.console.log(JSON.stringify(names));

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
	  ilexServer.send({action : "requestTextDump", parameters: {target: 'left', text: names[3], version : 3}});
		// or, make requests without version:
		ilexServer.send({action : "requestTextDump", parameters: {target: 'right', text: names[4]}});

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
