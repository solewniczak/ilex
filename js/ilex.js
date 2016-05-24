'use strict';

var ilex = {};

//widget is object that occupies part of screen
ilex.widgetsCollection = {};
ilex.widgetsCollection.handlerSize = 3;

//views represenst user views in application
ilex.views = {};

//apply sizes to elements
ilex.applySize = function() {
  ilex.window.find('.ilex-resize').trigger('windowResize');
  ilex.window.find('*').each(function () {
    if ($(this).data('ilex-width'))
      $(this).width($(this).data('ilex-width'))
    if ($(this).data('ilex-height'))
      $(this).height($(this).data('ilex-height'));
  });
  //redraw all canvas elements
  $(document).trigger('canvasRedraw');
};
