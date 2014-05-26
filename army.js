//army web app
var express = require('express');
var army = express(); 			

// configuration
army.configure(function() {
	army.use(express.static(__dirname + '/public'));
	army.use(express.logger('dev')); 						
	army.use(express.bodyParser()); 							
});

//routes
army.get('/army', function(req, res) {
	res.json(officers);
});

army.get('*', function(req, res) {
	res.sendfile('./public/index.html');
});

//port
army.listen(8080);
console.log("Army started on port 8080");

var day = 0;
var maXp = 40;
var maxCr = 3;
var maxGr = 2;
var maxLtGr = 1;
var names = ["Alberti", "Cabrera", "Belgrano", "Alberti", "Roca", "Paz", "Lopez", "Malbran", "Cabrera", "Gorriti", "Gonzalez"];
var ranks = ["Teniente", "Coronel", "General", "Teniente General"];
var officers = [];

function populateOfficers () {
	var randName = Math.floor(Math.random() * names.length);
	var officer = {
		name: names[randName], 
		xp: Math.floor((Math.random() * 3) + 34),
		rank: ranks[3],
		alignment: Math.floor(Math.random() * 100)
	}; 
	officers.push(officer);
	for (var i=0;i<2;i++) {
		var randName = Math.floor(Math.random() * names.length);
		var officer = {
			name: names[randName], 
			xp: Math.floor((Math.random() * 3) + 24),
			rank: ranks[2],
			alignment: Math.floor(Math.random() * 100)
		}; 
		officers.push(officer);
	}
	for (var i=0;i<3;i++) {
		var randName = Math.floor(Math.random() * names.length);
		var officer = {
			name: names[randName], 
			xp: Math.floor((Math.random() * 3) + 14),
			rank: ranks[1],
			alignment: Math.floor(Math.random() * 100)
		}; 
		officers.push(officer);
	}
}

function newOfficer () {
	var randName = Math.floor(Math.random() * names.length);
	var officer = {
		name: names[randName], 
		xp: Math.floor(Math.random() * 10),
		rank: ranks[0],
		alignment: Math.floor(Math.random() * 100)
	}; 
	officers.push(officer);
}

function giveExperience () {
	for (var i=0;i<officers.length;i++) {
		officers[i].xp++;
	}
}

function checkExperience () {
	for (var i=0;i<officers.length;i++) {
		var xp = officers[i].xp;
		var rank = officers[i].rank;
		if (xp > maXp) {
			officers.splice(i, 1);
		} if (xp >= 20 && ranks == ranks[0]) {
			officers.splice(i, 1);
		}
	}
}

function checkOrderOfBattle () {
	if (officers.length < 10) {
		var recruits = 10 - officers.length;
		for (i=0;i<recruits;i++) {
			newOfficer();
		}
	}
}

function checkRank () {
	for (var i=0;i<officers.length;i++) {
		var officer = officers[i];
		var xp = officer.xp;
		if (xp > 35) {
			if (checkRankSlots(ranks[3])<maxLtGr) {
				officer.rank = ranks[3];
			}
		} else if (xp > 25) {
			if (checkRankSlots(ranks[2])<maxGr) {
				officer.rank = ranks[2];
			}
		} else if (xp > 14) {
			if (checkRankSlots(ranks[1])<maxCr) {
				officer.rank = ranks[1];
			}
		}
	}
}

function compareRanks(a, b) {
  return b.xp - a.xp;
}

function checkRankSlots(rank) {
	var count = 0;
	for (var i=0;i<officers.length;i++) {
		var officer = officers[i];
		if (officer.rank == rank) {
			count++;
		}
	}
	return count;
};

function passTurn () {
	if (day == 0) {
		populateOfficers();
	}
	day++;
	officers.sort(compareRanks);
	checkOrderOfBattle();
	giveExperience();
	checkRank();
	checkExperience();

	// console.log(officers);
}

setInterval(function(){
	passTurn();
}, 2000);

