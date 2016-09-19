'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.widgetsCollection === undefined)
  throw 'ilex.widgetsCollection undefined';
if (ilex.widgetsCollection.changesHistory !== undefined)
  throw 'ilex.widgetsCollection.changesHistory already defined';


ilex.widgetsCollection.changesHistory
  = function(versionsWindowObject, documentWindowObject) {
  var that = {},
    width = versionsWindowObject.element.data('ilex-width'),
    height = versionsWindowObject.element.data('ilex-height');

  that.container = $('<div class="ilex-changesHistory">')
                      .appendTo(versionsWindowObject.element);
  
  //add new version to versions list
  that.addNewVersion = function(date, name, author) {
    let $date = $('<span class="ilex-date">').text(date),
        $name =  $('<span class="ilex-name">').text(name),
        $author =  $('<span class="ilex-author">').text(author),
        $div = $('<div class="ilex-version">').appendTo(that.container);
    $div.append($date, $name, $author);
  }
  
  return that;
}
