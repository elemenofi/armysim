//start and deps
var express = require('express');
var _ = require('underscore');
var bodyParser = require('body-parser');
var army = express();
var armyEngine = require('./sim/armyEngine');

army.use(express.static(__dirname + '/public'));
army.use(bodyParser.json());
army.use(bodyParser.urlencoded({ extended: true}));

army.get('/army', function (req, res) {

  res.json(armyEngine.army());

});

army.get('/army/turns', function (req, res) {

  armyEngine.actions().turnsToggle(armyEngine.army());

  res.json(armyEngine.army().day);

});

army.post('/army/inspect', function (req, res) {

  armyEngine.actions().inspectToggle(armyEngine.army(), req.body);

  res.json(req.body.lastName);

});

army.post('/army/inspectReset', function (req, res) {

  console.log("resetInpesct");
  
  armyEngine.actions().inspectReset(armyEngine.army());

});

army.listen(8000);

console.log("Army started on port 8000");
