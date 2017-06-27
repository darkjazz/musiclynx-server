var search = require('youtube-search');
var urlEmbed = require('url-embed');
var EmbedEngine = urlEmbed.EmbedEngine;
var Embed = urlEmbed.Embed;

var engine = new EmbedEngine({
  timeoutMs: 2000,
  referrer: 'musicweb.eecs.qmul.ac.uk'
});

engine.registerDefaultProviders();

const MAX_RESULTS = 10;
const APIKEY = "AIzaSyD3EX9tyyO_Rur72mXbrxteI9S5ImojN9Y";

module.exports.search_videos = function(searchTerm, cb) {
  search(searchTerm, { maxResults: MAX_RESULTS, key: APIKEY }, function(err, results) {
    if(err) cb(err);
    else {
      var embeds = [];
      results.forEach(function (row) {
        console.log(row.link);
        embeds.push(new Embed(row.link));
      });
      engine.getMultipleEmbeds(embeds, function (error, embedResults) {
        if (error) {
          cb({"error": "embed engine failed"});
        } else {
          var index = 0;
          var videos = [];
          embedResults.forEach(function (embed) {
            var video = {}
            video.id = results[index].id;
            video.link = embed.data.html;
            video.width = embed.data.width;
            video.height = embed.data.height;
            video.title = embed.data.title;
            video.high = results[index].thumbnails.high;
            video.thumbnail = results[index].thumbnails.default;
            videos.push(video);
            index++;
          });
          cb(videos);
        }
      });
    }
  });
}
