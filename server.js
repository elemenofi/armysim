var express = require('express');
var army = require('express')();
var bodyParser = require('body-parser');
var http = require('http').Server(army);
var io = require('socket.io')(http);
var engine = require('./sim/engine');

army.use(express.static(__dirname + '/public'));
army.use(bodyParser.json());
army.use(bodyParser.urlencoded({ extended: true}));

io.sockets.on('connection', function (socket) {
  setInterval(function(){
    var armyDTO = {
      name: engine.army().name,
      date: engine.army().formatedDate,
      turns: engine.army().turns,
      commander: engine.army().commander,
      corps: engine.army().corps,
      inspecting: engine.army().inspecting
    };

    socket.emit('army', armyDTO);
  }, 1000);  

  socket.on('inspect', function (data) {
    engine.actions().inspectToggle(engine.army(), data.officer);
  });

  socket.on('pause', function (data) {
    engine.actions().turnsToggle(engine.army());
  });

  socket.on('clear', function () {
    engine.actions().inspectReset(engine.army());
  });
});

http.listen(8000, function(){
  console.log('listening on *:8000');
});

