var request = require("request");

var mburi = "http://musicbrainz.org";
var artist_search_template = '/ws/2/artist/?query=artist:%&fmt=json';
var user_agent = process.env.MUSICBRAINZ_USER_AGENT || "";

module.exports.artist_search = function(searchTerm, cb) {
  var query = artist_search_template.replace('%', encodeURIComponent(searchTerm));
  var options = { method: 'GET', uri: mburi + query,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': user_agent
    }
  };
  request(options, function(err, response, body)
  {
    cb(body);
  });
}
