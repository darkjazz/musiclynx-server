require('dotenv').load();
var cors = require('cors')
var express = require('express');
var bodyParser = require('body-parser');

var app = module.exports = express();

//var ip = process.env.MUSICLYNX_SERVER_PORT || 7757;
var ip = process.env.PORT || 8080;
var db_active = false;
var allow_deploy_api = false;

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

if (db_active) {
  app.use('/musiclynx', require('./api/musiclynx'));
  app.use('/acousticbrainz', require('./api/acousticbrainz'));
  app.use('/moodplay', require('./api/moodplay'));
  app.use('/youtube', require('./api/youtube'));
  app.use('/lastfm', require('./api/lastfm'));
}

app.use('/artist', require('./api/artist'));
app.use('/musicbrainz', require('./api/musicbrainz'));
app.use('/dbpedia', require('./api/dbpedia'));
app.use('/wikidata', require('./api/wikidata'));
app.use('/sameas', require('./api/sameas'));

if (allow_deploy_api) app.use('/data', require('./api/data'));

app.get('/', function (req, res) {
  res.send('MusicLynx Server Root..')
});

app.listen(ip, function () {
  console.log('MusicLynx server listening on default port!')
});
