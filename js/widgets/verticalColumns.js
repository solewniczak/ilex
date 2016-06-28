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
    height = $parentWidget.data('ilex-height'),
    columnsStaticWidth = 0;

  //calculate columns static width to deal with percentage values
  for (let column of columns) {
    if (typeof column === 'number') {
      columnsStaticWidth += column;
    }
  }
  //static columns widths - calculate percentage value basing on clumnsStaticWidth
  var staticColumns = [],
    //space used in percentage calculations
    avalibleSpace = width - columnsStaticWidth;
  for (let column of columns) {
    if (typeof column === 'string') {
      let value = parseFloat(column) / 100.0;
      staticColumns.push(avalibleSpace * value);
    } else {
      staticColumns.push(column);
    }
  }

  that.table = $('<div class="ilex-verticalColumns ilex-resize">')
                  .css('display', 'table-row')
                  .data('ilex-width', width)
                  .data('ilex-height', height);
  $parentWidget.html(that.table);

  that.columns = [];
  for (let staticColumn of staticColumns) {
    let $column = $('<div>').appendTo(that.table)
                            .css('display', 'table-cell')
                            .data('ilex-width', staticColumn)
                            .data('ilex-height', height);
    that.columns.push($column);
  }

  that.table.on('windowResize', function(event) {
    var width = that.table.parent().data('ilex-width'),
      height = that.table.parent().data('ilex-height');

    that.table.data('ilex-width', width);
    that.table.data('ilex-height', height);

    for (let $column of that.columns) {
      $column.data('ilex-height', height);
    }
  });

  return that;
}
