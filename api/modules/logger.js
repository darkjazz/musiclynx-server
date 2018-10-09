var fs = require('fs');

PATH = './static/logs/musiclynx.log';
ENC = 'utf8';

var write = function(addr, guid, str) {
  str = Date.now().toString() + " " + addr + " " + guid + " " + str;
  fs.appendFileSync(PATH, str + "\n", { encoding: ENC, flag: 'a' });
};

module.exports.log_artist = function(addr, guid, artist) {
  var str = artist.id + " " + encodeURIComponent(artist.name);
  write(addr, guid, str);
}

module.exports.log_link = function(addr, guid, link) {
  var str = "category:" + encodeURIComponent(link);
  write(addr, guid, str);
}

module.exports.log_search = function(addr, guid, term) {
  var str = "search:" + encodeURIComponent(term);
  write(addr, guid, str);
}
