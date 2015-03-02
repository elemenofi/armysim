//start and deps
var express = require('express');
var army = express();
var armyEngine = require('./sim/armyEngine.js')

army.use(express.static(__dirname + '/public'));

army.get('/army', function (req, res) {
  res.json(armyEngine.army());
});

army.listen(8000);
console.log("Army started on port 8080");

