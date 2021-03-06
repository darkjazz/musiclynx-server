var Couch = require('node-couchdb');
var jsonfile = require('jsonfile');
var uris = require('./uris').uris

const couch = new Couch();
const dbName = "js_div_db_20000";
const max_links = 30;
const max_static_links = 13;

var data = {}

jsonfile.readFile(uris.static_db_dir + uris.ab_static_db + '.json', function(err, obj) {
  if (err) console.log(err);
  data = obj;
  console.log("Acousticbrainz static data loaded!");
});

var capitalize = function(str) { return str.charAt(0).toUpperCase() + str.slice(1) }

var categoryName = function(feature) { return "Similar Artists By " + capitalize(feature); }

module.exports.get_category_name = function(feature) {
  return category_name(feature);
}

module.exports.get_artist = function(id, cb) {
  couch.get(dbName, '_design/views/_view/id_exists', { key: id, group: true }).then((cdbr) => {
    cb(cdbr);
  }, err => {
    if (err.code == "EDOCMISSING") {
      cb({ error: "NOT FOUND" });
    }
    else {
      cb({ error: err });
    }
  });
}

module.exports.get_similar_artists = function(id, cb) {
  couch.get(dbName, '_design/views/_view/all_by_mbid', { 'key': id }).then((cdbr) => {
    var features = { id: id };
    cdbr.data.rows.forEach(function(row) {
      var top = row.value.values.slice(0, max_links);
      features[row.value.type] = top;
    });
    cb(features);
  }, err => {
    if (err.code == "EDOCMISSING") {
      cb({ error: "NOT FOUND" });
    }
    else {
      cb({ error: err });
    }
  })
}

module.exports.get_static_similar_artists = function(id, cb) {
  if (id in data) {
    var links = data[id];
    var categories = [];
    Object.keys(links).forEach(function(element) {
      var category = {};
      var artists = [];
      category.label = categoryName(element);
      links[element].forEach(function(item) {
        artists.push({ "id": item.id, "name": item.name });
      });
      category.artists = artists;
      categories.push(category);
    });
    cb(categories);
  }
  else cb({ "status": "artist not found!" });
}

module.exports.generate_static_content = function(cb) {
  couch.get(dbName, '_design/views/_view/all_by_mbid').then((result) => {
    var db = {}
    var remap = { "Rhythm": "rhythm", "Tonality": "tonality", "Timbre": "timbre" };
    result.data.rows.forEach(function(row) {
      if (!(row.key in db)) {
        db[row.key] = {
          "rhythm": [],
          "tonality": [],
          "timbre": []
        }
      }
      db[row.key][remap[row.value.type]] = row.value.values.slice(0, max_static_links);
    });
    var file = uris.static_db_dir + uris.ab_static_db + '.json';
    jsonfile.writeFile(file, db, function (err) {
      if (err) console.error(err);
    });
    cb();
  });
}
