'use strict';

//requires:
if (ilex === undefined)
  throw 'ilex undefined';
if (ilex.tools === undefined)
    throw 'ilex.tools undefined';
if (ilex.tools.markup === undefined)
    throw 'ilex.tools.markup undefined';
if (ilex.tools.range === undefined)
    throw 'ilex.tools.range undefined';
  if (ilex.tools.address === undefined)
      throw 'ilex.address.range undefined';

ilex.tools.connections = {};

//link := { 'id': String, 'link':
//            [ {'vspan-set': Object[ilex.tools.address.vspanSet],
//               'ranges': Array of Range},
//              {'vspan-set': Object[ilex.tools.address.vspanSet],
//               'ranges': Array of Range} ]
//        }

//functions creates link and adds it to ilex.view.links
//a, b - array of ranges
ilex.tools.connections.createLinkFromRanges = function (doc1, ranges1, doc2, ranges2) {
  var ranges1 = ilex.tools.range.filterCollapsed(ranges1),
    ranges2 = ilex.tools.range.filterCollapsed(ranges2),
    link = {
      'id': 'l'+ilex.view.links.length,
      'link': [
                {'vspanSet': ilex.tools.address.vspanSetFromRanges(ranges1), 'doc': doc1},
                {'vspanSet': ilex.tools.address.vspanSetFromRanges(ranges2), 'doc': doc2}
              ]
      };

  ilex.view.links.push(link);
  ilex.tools.markup.addConnectionTag(link);
  //ilex.tools.connections.updateLinkRanges();
};

//functions creates link and adds it to ilex.view.links
//doc1, doc2 - IlexDocumentObject
//vspanSet1, vspanSet2 - String - vspan-set
ilex.tools.connections.createLinkVspanSets = function (doc1, vspanSet1, doc2, vspanSet2) {
  var vspanSet1Array = ilex.tools.address.vspanSet(vspanSet1),
    vspanSet2Array = ilex.tools.address.vspanSet(vspanSet2),
    link = {
      'id': 'l'+ilex.view.links.length,
      'link': [
                  {'vspanSet': vspanSet1Array, 'doc': doc1},
                  {'vspanSet': vspanSet2Array, 'doc': doc2}
              ]
    };

  ilex.view.links.push(link);
  ilex.tools.markup.addConnectionTag(link);
  //ilex.tools.connections.updateLinkRanges();
};

//update link ranges to point into correct document fragments
ilex.tools.connections.updateLinkRanges = function () {
  var updateLinkRange = function(link, linkEnd) {
    for (let i = 0; i < linkEnd.ranges.length; i++) {
      let range = linkEnd.ranges[i],
        className = '.ilex-link-id-'+link.id+'-range-'+i,
        //http://stackoverflow.com/questions/8771463/jquery-find-what-order-does-it-return-elements-in
        $spans = linkEnd.doc.content.find(className),
        newRange = document.createRange();

      newRange.setStart($spans[0], 0);
      newRange.setEnd($spans[$spans.length-1], 0);
      console.log(newRange);
      linkEnd.ranges[i] = newRange;
    }
  };
  console.log('updateLinkRanges');
  for (let link of ilex.view.links) {
    updateLinkRange(link, link.link[0]);
    updateLinkRange(link, link.link[1]);
  }
};
