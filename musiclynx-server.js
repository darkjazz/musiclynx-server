var cors = require('cors')
var express = require('express');
var bodyParser = require('body-parser');

var app = module.exports = express();

var ip = process.env.MUSICLYNX_SERVER_PORT || 7757;

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/musiclynx', require('./api/musiclynx'));
app.use('/musicbrainz', require('./api/musicbrainz'));
app.use('/dbpedia', require('./api/dbpedia'));
app.use('/wikidata', require('./api/wikidata'));
app.use('/sameas', require('./api/sameas'));
app.use('/acousticbrainz', require('./api/acousticbrainz'));
app.use('/moodplay', require('./api/moodplay'));
app.use('/youtube', require('./api/youtube'));
app.use('/lastfm', require('./api/lastfm'));

app.get('/', function (req, res) {
  res.send('MusicLynx Server Root..')
});

app.listen(ip, function () {
  console.log('MusicLynx server listening on port ' + ip + '!')
});
