'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.horizontalColumns !== undefined)
  throw 'ilex.widgetsCollection.horizontalColumns already defined';


ilex.widgetsCollection.horizontalColumns = function ($parentWidget, columns) {
  var that = {},
    width = $parentWidget.data('ilex-width'),
    height = $parentWidget.data('ilex-height');
  
   //static columns widths - calculate percentage value basing on clumnsStaticWidth
  var applySizes = function() {
    for (let i = 0; i < that.columns.length; i++) {
      let $column = that.columns[i];
      $column.data('ilex-width', width).data('ilex-height', staticColumns[i]);
    }
  };

  
  that.container = $('<div class="ilex-horizontalColumns ilex-resize">')
                  .data('ilex-width', width)
                  .data('ilex-height', height);
  $parentWidget.html(that.container);

  var staticColumns = ilex.tools.geometry.staticSizes(columns, height);
  
  that.columns = [];
  for (let staticColumn of staticColumns) {
    let $column = $('<div class="ilex-horizontalColumn">').appendTo(that.container);
    that.columns.push($column);
  }
  applySizes();

  that.setColumnHeight = function(column, height) {
    columns[column] = height;
    staticColumns = ilex.tools.geometry.staticSizes(columns, height);
    applySizes();
  };
  
  that.getColumnHeight = function (column) {
    return staticColumns[column];
  };

  that.container.on('windowResize', function(event) {
    width = that.container.parent().data('ilex-width');
    height = that.container.parent().data('ilex-height');

    that.container.data('ilex-width', width);
    that.container.data('ilex-height', height);

    staticColumns = ilex.tools.geometry.staticSizes(columns, height);
    applySizes();
    
  });

  return that;
}
