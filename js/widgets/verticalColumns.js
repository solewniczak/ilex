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
  var staticColumns = [],
    calculateSizes = function() {
      var columnsStaticWidth = 0;
      //calculate columns static width to deal with percentage values
      for (let column of columns) {
        if (typeof column === 'number') {
          columnsStaticWidth += column;
        }
      }

      staticColumns = [];
      
      //space used in percentage calculations
      var avalibleSpace = width - columnsStaticWidth;
      for (let column of columns) {
        if (typeof column === 'string') {
          let value = parseFloat(column) / 100.0;
          staticColumns.push(avalibleSpace * value);
        } else {
          staticColumns.push(column);
        }
      }
  }, applySizes = function() {
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

  calculateSizes();
  that.columns = [];
  for (let staticColumn of staticColumns) {
    let $column = $('<div class="ilex-verticalColumn">').appendTo(that.table)
                            .css('display', 'block');
    that.columns.push($column);
  }
  applySizes();

  that.setColumnWidth = function(column, width) {
    columns[column] = width;
    calculateSizes();
    applySizes();
  };


  that.table.on('windowResize', function(event) {
    width = that.table.parent().data('ilex-width');
    height = that.table.parent().data('ilex-height');

    that.table.data('ilex-width', width);
    that.table.data('ilex-height', height);

    applySizes();
    
  });

  return that;
}
