'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.verticalColumns !== undefined)
  throw 'ilex.widgetsCollection.verticalColumns already defined';


ilex.widgetsCollection.verticalColumns = function ($parentWidget, columns) {
  var that = {},
    width = $parentWidget.data('ilex-width'),
    height = $parentWidget.data('ilex-height');
  
   //static columns widths - calculate percentage value basing on clumnsStaticWidth
  var applySizes = function() {
    for (let i = 0; i < that.columns.length; i++) {
      let $column = that.columns[i];
      $column.data('ilex-width', staticColumns[i]).data('ilex-height', height);
    }
  };

  
  that.table = $('<div class="ilex-verticalColumns ilex-resize">')
                  .css('display', 'flex')
                  .data('ilex-width', width)
                  .data('ilex-height', height);
  $parentWidget.html(that.table);

  var staticColumns = ilex.tools.geometry.staticSizes(columns, width);
  
  that.columns = [];
  for (let staticColumn of staticColumns) {
    let $column = $('<div class="ilex-verticalColumn">').appendTo(that.table)
                            .css('display', 'block');
    that.columns.push($column);
  }
  applySizes();

  that.setColumnWidth = function(column, width) {
    columns[column] = width;
    staticColumns = ilex.tools.geometry.staticSizes(columns, width);
    applySizes();
  };
  
  that.getColumnWidth = function (column) {
    return staticColumns[column];
  };

  that.table.on('windowResize', function(event) {
    width = that.table.parent().data('ilex-width');
    height = that.table.parent().data('ilex-height');

    that.table.data('ilex-width', width);
    that.table.data('ilex-height', height);

    staticColumns = ilex.tools.geometry.staticSizes(columns, width);
    applySizes();
    
  });

  return that;
}
