//army web app
var express = require('express'),
	army = express(), 			
	Chance = require('chance'),
    chance = new Chance();
//configuration
army.configure(function() {
	army.use(express.static(__dirname + '/public'));						
	army.use(express.bodyParser()); 							
});

//routes
army.get('/army', function(req, res) {
	res.json(army);
});

army.get('*', function(req, res) {
	res.sendfile('./public/index.html');
});

//port
army.listen(8080);
console.log("Army started on port 8080");

//settings
var day = 0,
	officer_id = 1,
	unit_names = ["Regiment", "Coronel", "General", "Army"],
	rank_names = ["Lieutenant", "Coronel", "General", "Lieutenant General"],
	army = {
		name: "Army",
		unit_id: 1,
		commander_id: 0,
		divisions: [
			{
				name: "1st Division",
				unit_id: 2,
				commander_id: 0
			},
			{
				name: "2nd Division",
				unit_id: 3,
				commander_id: 0
			}
		],
		brigades: [
			{
				name: "1st Brigade",
				unit_id: 4,
				commander_id: 0
			},
			{
				name: "2nd Brigade",
				unit_id: 5,
				commander_id: 0
			},
			{
				name: "3rd Brigade",
				unit_id: 6,
				commander_id: 0
			},
			{
				name: "4th Brigade",
				unit_id: 7,
				commander_id: 0
			}
		]
	},
	officers = {
		generals: [],
		colonels: []
	};
//for ( var i = 0; i < 2; i++ ) {
//mechanics
function generateStaff () {
	for ( var i = 0; i < 2; i++ ) {
		var general = {
			rank: 2,
			id: officer_id,
			command_id: 0
		}
		general.title = rank_names[general.rank];
		officers.generals.push(general);
		officer_id++;
	}
	for ( var i = 0; i < 4; i++ ) {
		var colonel = {
			rank: 2,
			id: officer_id,
			command_id: 0
		}
		colonel.title = rank_names[colonel.rank];
		officers.colonels.push(colonel);
		officer_id++;
	}
}
function assignStaff () {
	for ( var i = 0; i < officers.generals.length; i++ ) {
		var general = officers.generals[i];
		if (general.command_id == 0) {
			for ( var i = 0; i < army.divisions.length; i++ ) {
				var division = army.divisions[i];
				if (division.commander_id == 0) {
					division.commander_id = general.officer_id;
					general.command_id = division.unit_id;
					console.log(general.command_id);
				}
			}
		}
	}
}

//turns
function passTurn () {
	if ( day == 0 ) {
		generateStaff();
	};
	assignStaff();
	day++;
}
//tick
setInterval(function () {
	passTurn();
}, 2000);

//helpers
function randomNumber (x) {
	return Math.floor(Math.random() * x);
}