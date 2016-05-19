'use strict';

ilex.applySize = function() {
  ilex.window.find('.ilex-resize').trigger('windowResize');
  ilex.window.find('*').each(function () {
    if ($(this).data('ilex-width'))
      $(this).width($(this).data('ilex-width'))
    if ($(this).data('ilex-height'))
      $(this).height($(this).data('ilex-height'));
  });
};

$(document).ready(function(){
  $("body").css("overflow", "hidden");

  ilex.window = $('<div>').appendTo('body')
                      .data('ilex-width', $(window).width())
                      .data('ilex-height', $(window).height());

  $(window).on('resize', function () {
    var width = $(window).width(),
      height = $(window).height();
    ilex.window.data('ilex-width', width).data('ilex-height', height);
    ilex.window.width(width).height(height);
    ilex.applySize();
  });

  ilex.view = ilex.views.twoColumn();

  ilexServer.init(function () {
    ilexServer.send({target: 'left', text: 'xanadu'});
    ilexServer.send({target: 'right', text: 'powiesc_wajdeloty'});
  }, function (data) {
    var json = JSON.parse(data);
    if (json.target === 'left')
        ilex.view.leftText.loadText(json.text);
    else if (json.target === 'right')
        ilex.view.rightText.loadText(json.text);
  });

});
