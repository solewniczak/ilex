'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.fileSelector !== undefined)
  throw 'ilex.widgetsCollection.fileSelector already defined';


ilex.widgetsCollection.fileSelector = function ($parentWidget) {
  var that = {},
    width = $parentWidget.data('ilex-width'),
    height = $parentWidget.data('ilex-height');

  that.container = $('<div class="ilex-resize ilex-fileSelector">')
                  .css('overflow', 'auto')
                  .css('margin', '5px')
                  .data('ilex-width', width)
                  .data('ilex-height', height);
  $parentWidget.html(that.container);

  that.loadFilesList = function(filesList) {
    for (let file of filesList) {
      let $div = $('<div>').text(file.name).appendTo(that.container)
                .attr('draggable', 'true')
                .css('overflow', 'hidden')
                .css('font-size', '10px')
                .css('padding', '2px')
                .css('width', '50px')
                .css('height', '50px')
                .css('border', '1px solid #000')
                .css('margin-right', '50px')
                .css('cursor', '-webkit-grab')
                .css('cursor', 'grab')
                .css('float', 'left');
      $div.on('dragstart', function(event) {
        event.originalEvent.dataTransfer.setData('ilex/file', JSON.stringify(file));
        $('.ilex-dropableRegion').show();
      });
      $div.on('dragend', function(event) {
        $('.ilex-dropableRegion').css('background', 'transparent').hide();
      });
    };
  };
  
  that.container.on('windowResize', function(event) {
    width = that.container.parent().data('ilex-width');
    height = that.container.parent().data('ilex-height');
    
    that.container.data('ilex-width', width).data('ilex-height', height);
  });


  return that;
}
