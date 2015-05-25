var express = require('express');
var army = require('express')();
var http = require('http').Server(army);
var io = require('socket.io')(http);
var _ = require('underscore');
var bodyParser = require('body-parser');
var armyEngine = require('./sim/armyEngine');

army.use(express.static(__dirname + '/public'));
army.use(bodyParser.json());
army.use(bodyParser.urlencoded({ extended: true}));

io.sockets.on('connection', function(socket){
	
	setInterval(function(){
		
		var armyDTO = {
			corps: armyEngine.army().corps,
			turns: armyEngine.army().turns,
			commander: armyEngine.army().commander,
			name: armyEngine.army().name,
			date: armyEngine.army().formatedDate,
			inspecting: armyEngine.army().inspecting
		};

		socket.emit('army', armyDTO);

	}, 1000);  

	socket.on('inspect', function (data) {
		armyEngine.actions().inspectToggle(armyEngine.army(), data.officer);
	});

  socket.on('pause', function (data) {
  	armyEngine.actions().turnsToggle(armyEngine.army());
  });

  socket.on('clear', function () {
  	armyEngine.actions().inspectReset(armyEngine.army());
  });
	
});

http.listen(8000, function(){
  console.log('listening on *:8000');
});

