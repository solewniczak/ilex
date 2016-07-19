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

//apply sizes to elements
ilex.applySize = function(animateWidth, animateHeight, selector) {
  animateWidth = animateWidth || false;
  animateHeight = animateHeight || false;
  selector = selector || '*';
  
  $.when($('.ilex-resize').trigger('windowResize'))
  .done(function () {
    ilex.window.find(selector).each(function () {
      if ($(this).data('ilex-width') && $(this).data('ilex-width') !== $(this).width()) {
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
      if ($(this).data('ilex-height') && $(this).data('ilex-height') !== $(this).height()) {
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
