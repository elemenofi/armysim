//army web app
var express = require('express'),
	army = express(), 			
	Chance = require('chance'),
    chance = new Chance();

// Get a random zip code
chance.zip();
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

var day = 0,
	maXp = 40,
	maxCr = 4,
	maxGr = 2,
	maxLtGr = 1,
	maxLtXp = 15,
	maxCrXp = 25,
	maxGrXp = 35,
	maxLtGrXp = 40,
	unit_names = ["Army", "Division", "Brigade", "Regiment"],
	ranks = ["Lieutenant", "Coronel", "General", "Lieutenant General"];
	units = [
			{
				type: 0,
				commander: undefined,
				name: unit_names[0]
			}, 
			{
				type: 1,
				commander: undefined,
				name: "1st " + unit_names[1]
			},
			{
				type: 1,
				commander: undefined,
				name: "2nd " + unit_names[1]
			},
			{
				type: 2,
				commander: undefined,
				name: "1st " + unit_names[2]
			},
			{
				type: 2,
				commander: undefined,
				name: "2nd " + unit_names[2]
			},
			{
				type: 2,
				commander: undefined,
				name: "3rd " + unit_names[2]
			},
			{
				type: 2,
				commander: undefined,
				name: "4th " + unit_names[2]
			},
			{
				type: 3,
				commander: undefined,
				name: "1st " + unit_names[3]
			},
			{
				type: 3,
				commander: undefined,
				name: "2nd " + unit_names[3]
			},
			{
				type: 3,
				commander: undefined,
				name: "3rd " + unit_names[3]
			},
			{
				type: 3,
				commander: undefined,
				name: "4th " + unit_names[3]
			},
			{
				type: 3,
				commander: undefined,
				name: "5th " + unit_names[3]
			},
			{
				type: 3,
				commander: undefined,
				name: "6th " + unit_names[3]
			},
			{
				type: 3,
				commander: undefined,
				name: "7th " + unit_names[3]
			},
			{
				type: 3,
				commander: undefined,
				name: "8th " + unit_names[3]
			}
			],
	officers = [];

function randomNumber (x) {
	return Math.floor(Math.random() * x);
}

function compareRanks(a, b) {
  return b.xp - a.xp;
}

function giveExperience () {
	for (var i=0;i<officers.length;i++) {
		officers[i].xp++;
	}
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

function generateOfficer (rank, xp) {
	var officer = {
		name: chance.first(),
		last: chance.last(),
		xp: xp,
		rank: ranks[rank],
		alignment: randomNumber(100),
		unit: undefined
	}; 
	officers.push(officer);
}

function newOfficers () {
	generateOfficer(3, (randomNumber(4) + maxGrXp));
	for (var i=0; i<2; i++) {
		generateOfficer(2, (randomNumber(4) + maxCrXp));
	}
	for (var i=0; i<4; i++) {
		generateOfficer(1, (randomNumber(4) + maxLtXp));
	}
	for (var i=0; i<8; i++) {
		generateOfficer(0, randomNumber(10));
	}
}

function recruitOfficers () {
	while (officers.length < 15) {
		generateOfficer(0, randomNumber(7));
	}
}

function retireOfficers () {
	for (var i=0; i<officers.length; i++) {
		var xp = officers[i].xp,
			rank = officers[i].rank;
		if (rank == ranks[3] && xp >= maxLtGrXp) {
			officers.splice(i, 1);
		} else if (rank == ranks[2] && xp >= maxGrXp) {
			officers.splice(i, 1);
		} else if (rank == ranks[1] && xp >= maxCrXp) {
			officers.splice(i, 1);
		} else if (rank == ranks[0] && xp >= maxLtXp) {
			officers.splice(i, 1);
		}
	}
}

function promoteOfficers () {
	for (var i=0; i<officers.length; i++) {
		var xp = officers[i].xp,
			name = officers[i].name;
		switch (officers[i].rank) {
			case ranks[0]:
				if (checkRankSlots(ranks[1]) < maxCr) {
					officers[i].rank = ranks[1];
					console.log(ranks[0]+ " " + name + " has been promoted to " + ranks[1]);
				}
			break;
			case ranks[1]:
				if (checkRankSlots(ranks[2]) < maxGr) {
					officers[i].rank = ranks[2];
					console.log(ranks[1]+ " " + name + " has been promoted to " + ranks[2]);
				}
			break;
			case ranks[2]:
				if (checkRankSlots(ranks[3]) < maxLtGr) {
					officers[i].rank = ranks[3];
					console.log(ranks[2]+ " " + name + " has been promoted to " + ranks[3]);
				}
			break;
		}
	}
}

function assignOfficers () {
	for (var i=0; i<units.length; i++) {
		officers[i].unit = units[i];
	}
}

function passTurn () {
	if (day == 0) {
		newOfficers();
	}
	day++;
	officers.sort(compareRanks);
	retireOfficers();
	promoteOfficers();
	recruitOfficers();
	assignOfficers();
	giveExperience();
}

setInterval(function(){
	passTurn();
}, 2000);

