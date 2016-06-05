'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.tools === undefined)
    throw 'ilex.views undefined';

ilex.tools.markup = {};

ilex.tools.markup.addConnectionTag = function (link) {
  var $cont0 = $('<span class="ilex-connection">')
                    .data('ilex-links' , [link]),
    $cont1 = $('<span class="ilex-connection">')
                      .data('ilex-links' , [link]);
  link.link[0].range.surroundContents($cont0[0]);
  link.link[1].range.surroundContents($cont1[0]);
};
