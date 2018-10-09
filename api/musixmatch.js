var express = require('express');
var msx = require('./modules/musixmatch');
var module_msx = express.Router();

/*
Module: Musixmatch
*/

/*
Search Artists: <span>/get_similar_artists/:id/:name</span>
Example: http://musiclynx-api.herokuapp.com/musixmatch/get_similar_artists/07b6020a-c539-4d68-aeef-f159f3befc76/Band%20Of%20Horses
*/
module_msx.get('/get_similar_artists/:id/:name', function(req, res) {
  msx.get_similar_artists(req.params.id, req.params.name, function(category) {
    res.send(category);
  });
});

module.exports = module_msx;
