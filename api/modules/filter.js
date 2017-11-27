var express = require('express');

module.exports.jaccard = function(artists, degree) {
  artists.forEach(function(artist) {
    artist["jaccard"] = artist.ranking / ( artist.degree + degree );
  });
  return artists;
}

module.exports.collaborative = function(artists, degree) {
  artists.forEach(function(artist) {
    artist["collaborative"] = artist.ranking / Math.min(artist.degree, degree);
  });
  return artists;
}

module.exports.sorensen = function(artists, degree) {
  artists.forEach(function(artist) {
    artist["sorensen"] = 1.0 / Math.sqrt(artist.degree * degree) * artist.ranking;
  });
  return artists;
}
