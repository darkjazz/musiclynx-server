var express = require('express');

module.exports.jaccard = function(artists, degree) {
  artists.forEach(function(artist) {
    artist["jaccard"] = artist.ranking / ( artist.degree + degree );
  });
  return artists.sort((a, b) => b.jaccard - a.jaccard);
}

module.exports.collaborative = function(artists, degree) {
  artists.forEach(function(artist) {
    artist["collaborative"] = artist.ranking / Math.min(artist.degree, degree);
  });
  return artists.sort((a, b) => b.collaborative - a.collaborative);
}

module.exports.sorensen = function(artists, degree) {
  artists.forEach(function(artist) {
    artist["sorensen"] = 1.0 / Math.sqrt(artist.degree * degree) * artist.ranking;
  });
  return artists.sort((a, b) => b.sorensen - a.sorensen);
}

module.exports.max_degree = function(artists, degree) {
  // to be implemented
  return artists;
}
