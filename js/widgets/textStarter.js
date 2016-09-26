'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.textStarter !== undefined)
  throw 'ilex.widgetsCollection.textStarter already defined';

/*starterWidget*/
ilex.widgetsCollection.textStarter = function (windowObject) {
  var that = {};
  
  that.container = $('<div class="ilex-resize ilex-starterWidget ilex-textStarter">');
  
  windowObject.widget.html(that.container);
  
  let $ico = $('<span class="ilex-awesome">&#xf016;</span>')
                .css('display', 'block')
                .css('font-size', '100px');
  
  that.newDocButton = $('<div class="ilex-noBorderButton">').appendTo(that.container)
                        .css('display', 'block')
                        .append($ico);
  
  //create new document
  that.newDocButton.on('click', function () {
    ilex.tools.mime.createDocument(windowObject, 'plain text');
  });
  
  that.container.on('windowResize', function(event) {
    var width = windowObject.widget.data('ilex-width'),
      height = windowObject.widget.data('ilex-height');
    
    console.log(width, height);
    
    that.container.data('ilex-width', width)
                  .data('ilex-height', height);
    
    //button is block so it will be as width as container
    that.newDocButton.data('ilex-width', width)
                     .data('ilex-height', height)
                     .css('line-height', height + 'px');
  });
  
  return that;
};