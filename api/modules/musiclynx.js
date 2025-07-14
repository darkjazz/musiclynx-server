var jsonfile = require("jsonfile");
var uris = require("./uris").uris;
var sa = require("./sameas");

var data = {};

jsonfile.readFile(
  uris.static_db_dir + uris.linked_static_db + ".json",
  function (err, obj) {
    if (err) console.log(err);
    data = obj;
    console.log("Linked artists static data loaded!");
  },
);

module.exports.find_dbpedia_link = function (mbid, cb) {
  if (mbid in data) {
    cb(decodeURIComponent(data[mbid]));
  } else {
    cb({ error: "not found" });
  }
};

module.exports.find_musicbrainz_id = function (artist_uri, cb) {
  const parts = artist_uri.split("/");
  const name = encodeURIComponent(parts.pop());
  const encoded_uri = parts.join("/") + "/" + name;

  if (encoded_uri in data) {
    cb(data[encoded_uri]);
  } else {
    cb({ error: "not found" });
  }
};
