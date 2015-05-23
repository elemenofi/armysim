var express = require('express');
var army = require('express')();

var http = require('http').Server(army);
var io = require('socket.io')(http);
var _ = require('underscore');
var bodyParser = require('body-parser');
// var army = express();
var armyEngine = require('./sim/armyEngine');


army.use(express.static(__dirname + '/public2'));
army.use(bodyParser.json());
army.use(bodyParser.urlencoded({ extended: true}));

var armyDTO = {};

army.get('/army', function (req, res) {

  res.json(armyDTO);

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

io.on('connection', function(socket){
	setInterval(function(){
		var armyDTO = {
			corps: armyEngine.army().corps,
			turns: armyEngine.army().turns,
			commander: armyEngine.army().commander,
			name: armyEngine.army().name,
			date: armyEngine.army().formatedDate
		};
		io.emit('army', armyDTO);
	}, 2000)
  
});

http.listen(8000, function(){
  console.log('listening on *:8000');
});

