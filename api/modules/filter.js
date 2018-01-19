var express = require('express');

var jaccard = function(artists, degree) {
  artists.forEach(function(artist) {
    artist["jaccard"] = artist.ranking / ( artist.degree + degree );
  });
  return artists.sort((a, b) => b.jaccard - a.jaccard);
}

var collaborative = function(artists, degree) {
  artists.forEach(function(artist) {
    artist["collaborative"] = artist.ranking / Math.min(artist.degree, degree);
  });
  return artists.sort((a, b) => b.collaborative - a.collaborative);
}

var sorensen = function(artists, degree) {
  artists.forEach(function(artist) {
    artist["sorensen"] = 1.0 / Math.sqrt(artist.degree * degree) * artist.ranking;
  });
  return artists.sort((a, b) => b.sorensen - a.sorensen);
}

var max_degree = function(artists, category_degrees, degree) {
  artists.forEach(function(artist) {
    var weighted = artist.common_categories.reduce((sum, category) =>
      (sum + ( parseInt(artist.ranking) / parseInt(category_degrees[category.uri]))), 0);
    artist["max_degree"] = (1.0 / Math.max(parseInt(artist.degree), degree)) * weighted;
  });
  return artists.sort((a, b) => b.max_degree - a.max_degree);
}

var heat_prob = function(artists, category_degrees, degree, lambda) {
  artists.forEach(function(artist) {
    var weighted = artist.common_categories.reduce((sum, category) =>
      (sum + ( parseInt(artist.ranking) / parseInt(category_degrees[category.uri]))), 0);
      artist["heat_prob"] = 1.0 / (Math.pow(degree, 1.0-lambda) * Math.pow(artist.degree, lambda)) * weighted
  });
  return artists.sort((a, b) => b.heat_prob - a.heat_prob);
}

var apply_filter = function(filter, artists, category_degrees, degree, lambda, limit) {
  switch (filter) {
    case 0:
      break;
    case 1:
      artists = jaccard(artists, degree);
      break;
    case 2:
      artists = collaborative(artists, degree);
      break;
    case 3:
      artists = sorensen(artists, degree);
      break;
    case 4:
      artists = max_degree(artists, category_degrees, degree);
      break;
    case 5:
      artists = heat_prob(artists, category_degrees, degree, lambda);
      break;
  }
  return artists.slice(0, limit);
}

module.exports.jaccard = jaccard;
module.exports.collaborative = collaborative;
module.exports.sorensen = sorensen;
module.exports.max_degree = max_degree;
module.exports.heat_prob = heat_prob;
module.exports.apply_filter = apply_filter;
