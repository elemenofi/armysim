//start and deps
var express = require('express');
var _ = require('underscore');
var army = express();
var armyEngine = require('./sim/armyEngine.js')

army.use(express.static(__dirname + '/public'));

army.get('/army', function (req, res) {
  res.json(armyEngine.army().companies);
});

army.listen(8000);
console.log("Army started on port 8080");
