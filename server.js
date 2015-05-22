//start and deps
var express = require('express');
var _ = require('underscore');
var bodyParser = require('body-parser');
var army = express();
var armyEngine = require('./sim/armyEngine');

army.use(express.static(__dirname + '/public2'));
army.use(bodyParser.json());
army.use(bodyParser.urlencoded({ extended: true}));

army.get('/army', function (req, res) {

  res.json(armyEngine.army());

  res.end();

});

army.get('/army/turns', function (req, res) {

  armyEngine.actions().turnsToggle(armyEngine.army());

  res.end();

});

army.post('/army/inspect', function (req, res) {

  var officer = req.body;

  armyEngine.actions().inspectToggle(armyEngine.army(), officer);

  res.end();

});

army.post('/army/inspectReset', function (req, res) {

  armyEngine.actions().inspectReset(armyEngine.army());

  res.end();

});

army.listen(8000);

console.log("Army started on port 8000");
