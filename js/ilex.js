'use strict';

var ilex = {};

//widget is object that occupies part of screen
ilex.widgetsCollection = {};
ilex.widgetsCollection.handlerSize = 3;

//Array of contrast collors used in link drawing
//http://stackoverflow.com/questions/470690/how-to-automatically-generate-n-distinct-colors
ilex.linksColors = [
  '#FFB300', //Vivid Yellow
  '#803E75', //Strong Purple
  '#FF6800', //Vivid Orange
  '#A6BDD7', //Very Light Blue
  '#C10020', //Vivid Red
  '#CEA262', //Grayish Yellow
  '#817066', //Medium Gray

  //The following will not be good for people with defective color vision
  '#007D34', //Vivid Green
  '#F6768E', //Strong Purplish Pink
  '#00538A', //Strong Blue
  '#FF7A5C', //Strong Yellowish Pink
  '#53377A', //Strong Violet
  '#FF8E00', //Vivid Orange Yellow
  '#B32851', //Strong Purplish Red
  '#F4C800', //Vivid Greenish Yellow
  '#7F180D', //Strong Reddish Brown
  '#93AA00', //Vivid Yellowish Green
  '#593315', //Deep Yellowish Brown
  '#F13A13', //Vivid Reddish Orange
  '#232C16', //Dark Olive Green
];

ilex.transclusionsColors = [
  '#FFB300', //Vivid Yellow
  '#803E75', //Strong Purple
  '#FF6800', //Vivid Orange
  '#A6BDD7', //Very Light Blue
  '#C10020', //Vivid Red
  '#CEA262', //Grayish Yellow
  '#817066', //Medium Gray

  //The following will not be good for people with defective color vision
  '#007D34', //Vivid Green
  '#F6768E', //Strong Purplish Pink
  '#00538A', //Strong Blue
  '#FF7A5C', //Strong Yellowish Pink
  '#53377A', //Strong Violet
  '#FF8E00', //Vivid Orange Yellow
  '#B32851', //Strong Purplish Red
  '#F4C800', //Vivid Greenish Yellow
  '#7F180D', //Strong Reddish Brown
  '#93AA00', //Vivid Yellowish Green
  '#593315', //Deep Yellowish Brown
  '#F13A13', //Vivid Reddish Orange
  '#232C16', //Dark Olive Green
];

//views represenst user views in application
ilex.views = {};

//additional ilex tools
ilex.tools = {};

//global map of documents
//docId => ‘class’: ‘klasa utowrzonego dokumentu’,
//	‘created’: ‘data utworzenia’,
//	‘format’: ‘format dokumentu’,
//	‘id’: ‘id nowoutworzonego dokumentu’,
//	‘modified’: ‘powinna być równa dacie created’,
//	name: ‘nazwa’,
//	‘totalVersions’: 1
ilex.documents = {};
ilex.documents.map = new Map();
ilex.documents.set = function(id, file) {
  ilex.documents.map.set(id, file);
  $(document).trigger('ilex-documentsChanged');
};
ilex.documents.setFileArray = function(files) {
  for (let f of files) {
    ilex.documents.map.set(f.id, f);
  }
  $(document).trigger('ilex-documentsChanged');
};

ilex.documents.get = function(id) {
  return ilex.documents.map.get(id);
};

//CONFIG
ilex.conf = function () {
  var defaults = {}, types = {}, callbacks = {};
  //defaults
  defaults['nelson mode'] = false;
  types['nelson mode'] = 'Boolean';
  callbacks['nelson mode'] = function(value) {
     $(document).trigger('canvasRedraw');
  };
  
  defaults['browsing mode'] = 0;
  types['browsing mode'] = 'Integer';
  callbacks['browsing mode'] = function(value) {
    if (value === 0) {
     $(document).trigger('ilex-navigationModeOff');
    } else if(value === 1) {
       $(document).trigger('ilex-navigationModeOn');
    }
  };
    
  //run callbacks 
  for (let key in defaults) {
    if (defaults.hasOwnProperty(key)) {
      if(!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
      //get value
      var value = JSON.parse(localStorage.getItem(key));
      callbacks[key](value);
    }
  }
  
  
  return {
    'get': function (key) {
      var value = localStorage.getItem(key);
      return JSON.parse(value);
    },
    'set': function (key, value) {
      localStorage.setItem(key, JSON.stringify(value));
      callbacks[key](value);
    }
  };
}();


ilex.symHash = function (a,b) {
  var len = a.length < b.length ? a.length : b.length,
      hash = '';
  for (let i = 0; i < len; i++) {
    let x = a.charCodeAt(i),
        y = b.charCodeAt(i);
    hash += (x+y).toString();
  }
  return hash;
};

ilex.linkHash = function (link) {
  var x = link.firstDocumentId + link.firstPosition,
      y = link.secondDocumentId + link.secondPosition;
  return ilex.symHash(x, y);
};

//notifications
$(document).on('ilex-newVersionAvailable', function (event, data) {
  var file = ilex.documents.get(data.document);
  file.totalVersions = data.version;
  ilex.documents.set(file.id, file);
  $(document).trigger('ilex-fileInfoUpdated', file.id);
});


//apply sizes to elements
ilex.applySize = function(animateWidth, animateHeight, selector) {
  animateWidth = animateWidth || false;
  animateHeight = animateHeight || false;
  selector = selector || '*';
  
  $.when($('.ilex-resize').trigger('windowResize'))
  .done(function () {
    ilex.window.find(selector).each(function () {
      if ($(this).data('ilex-width') !== undefined &&
          $(this).data('ilex-width') !== $(this).width()) {
        if (animateWidth) {
          $(this).animate({'width': $(this).data('ilex-width')}, {
            'progress': function () {
              $(document).trigger('canvasRedraw');
            }
          });
        } else {
          $(this).width($(this).data('ilex-width'));
        }
      }
      if ($(this).data('ilex-height') !== undefined &&
          $(this).data('ilex-height') !== $(this).height()) {
        if (animateHeight) {
          $(this).animate({'height': $(this).data('ilex-height')}, {
            'progress': function () {
              $(document).trigger('canvasRedraw');
            }
          });
        } else {
          $(this).height($(this).data('ilex-height'));
        }
      }
    });
    //redraw all canvas elements
    $(document).trigger('canvasRedraw');
  });
};
