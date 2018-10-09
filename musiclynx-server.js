require('dotenv').load();
var cors = require('cors')
var express = require('express');
var bodyParser = require('body-parser');
var front = require('./api/modules/front');

var app = module.exports = express();

var port = process.env.PORT || 8080;
var db_active = false;
var allow_deploy_api = false;

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

if (db_active) {
  app.use('/acousticbrainz', require('./api/acousticbrainz'));
  app.use('/moodplay', require('./api/moodplay'));
  app.use('/youtube', require('./api/youtube'));
}

app.use('/artist', require('./api/artist'));
app.use('/musicbrainz', require('./api/musicbrainz'));
app.use('/dbpedia', require('./api/dbpedia'));
app.use('/wikidata', require('./api/wikidata'));
app.use('/sameas', require('./api/sameas'));
app.use('/audio', require('./api/audio'));
app.use('/musiclynx', require('./api/musiclynx'));
app.use('/musixmatch', require('./api/musixmatch'));
app.use('/moodplay', require('./api/moodplay'));
// app.use('/lastfm', require('./api/lastfm'));

if (allow_deploy_api) app.use('/data', require('./api/data'));

app.get('/', function (req, res) {
  res.send(front.serve_front())
});

app.listen(port, function () {
  console.log('MusicLynx server listening on port ' + port + '!')
});
