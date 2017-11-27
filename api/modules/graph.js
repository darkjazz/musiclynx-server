var express = require('express');

module.exports.make_graph = function(artists, categories, name, min_ranking) {
  var graph = { "nodes": [ { "id": name, "group": 1 } ], "links": [] };
  // var categories = {};
  artists.forEach(function(artist) {
    if (artist.ranking >= min_ranking) {
      graph["nodes"].push({ "id": artist.name, "group": parseInt(artist.ranking) });
      graph["links"].push({ "source": name, "target": artist.name, "value": parseInt(artist.ranking) });
    }
  });
  Object.keys(categories).forEach(function(category) {
    var names = categories[category].slice(1);
    categories[category].map(function(name) {
      if (names.length > 0) {
        graph["links"].push({ "source": name, "target": names[0], "value": 1 });
        names = names.slice(1);
      }
    });
  });
  return graph;
}
