const MongoClient = require('mongodb').MongoClient;
var uri = require('./uris').uris.mongodb;
var usr = require('./auth').user;

const user_name = process.env.MLAB_USER || usr.name;
const user_pass = process.env.MLAB_PASS || usr.pass;
const connect_string = uri.replace("%u", user_name).replace("%p", user_pass);
const db_name = uri.split("/").pop();
const col = 'log';
const enableLogs = true;

var write = function(addr, guid, log) {
  try {
    log.date = Date.now();
    log.ip = addr;
    log.uaid = guid;
    if (enableLogs) {
      MongoClient.connect(connect_string, { useNewUrlParser: true }, function(err, client) {
        if (!err) {
          const db = client.db(db_name);
          db.collection(col).insertOne(log);
          client.close();
        }
        else {
          console.error(err)
        }
      });
    }
  }
  catch(error) {
    console.error(error)
  }
};

module.exports.log_artist = function(addr, guid, artist) {
  var log = { artist_id: artist.id, artist_name: artist.name };
  write(addr, guid, log);
}

module.exports.log_link = function(addr, guid, link) {
  var log = { category: link };
  write(addr, guid, log);
}

module.exports.log_search = function(addr, guid, term) {
  var log = { search: term };
  write(addr, guid, log);
}
