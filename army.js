//army web app
var express = require('express'),
	army = express(), 			
	Chance = require('chance'),
    chance = new Chance();
// configuration
army.configure(function() {
	army.use(express.static(__dirname + '/public'));						
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

//helpers
function randomNumber (x) {
	return Math.floor(Math.random() * x);
}

//settings
var day = 0,
	unit_names = ["Regiment", "Coronel", "General", "Army"],
	rank_names = ["Lieutenant", "Coronel", "General", "Lieutenant General"],
	army = {
		commander: null,
		divisions: [
			{
				name: "1st Division",
				commander: null
			},
			{
				name: "2nd Division",
				commander: null
			}
		]
	}
	officers = [];

function assignCommand (officer) {
	switch (officer.rank) {
		case 3:
			army.commander = officer;
			officer.commands = true;
		break;
		case 2:
			for (var i = 0; i < army.divisions.length; i++) {
				if (army.divisions[i].commander == null && !officer.commands) {
					army.divisions[i].commander = officer;
					officer.commands = true;
					officer.unit = divisions[i];
				}
			}
		break;	
	}
}

function generateOfficer (rank, xp) {
	var officer = {
		first_name: chance.first(),
		last_name: chance.last(),
		xp: xp,
		rank: rank,
		commands: false,
		unit: null
	};
	assignCommand(officer);
	officers.push(officer);
}
function passTurn () {
	if ( day == 0 ) {
		generateOfficer(3, 1);
		generateOfficer(2, 1);
		generateOfficer(2, 1);
		console.log(army.commander.last_name);
		console.log(army.divisions[0].commander.last_name);
		console.log(army.divisions[1].commander.last_name);
	};
	day++;
}

setInterval(function () {
	passTurn();
}, 2000);

