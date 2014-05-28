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
	rank_names = ["Lieutenant", "Colonel", "General", "Lieutenant General"],
	army = {
		name: "Army",
		unit_id: 1,
		commander_id: 0,
		divisions: [
			{
				name: "1st Division",
				unit_id: 2,
				commander_id: 0,
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
					}
				]
			},
			{
				name: "2nd Division",
				unit_id: 3,
				commander_id: 0,
				brigades: [
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
			}
		],
		officers: {
			generals: [],
			colonels: []
		}
	};

//mechanics
function generateStaff () {
	generateOfficer("general", 2);
	generateOfficer("colonel", 4);
}

function generateOfficer (type, amount) {
	for ( var i = 0; i < amount; i++ ) {
		var officer = {
			id: officer_id,
			command_id: 0,
			name: chance.first() + " " + chance.last(),
			retired: false
		}
		switch (type) {
			case "general":
				officer.rank = 2;
				officer.xp = randomNumber(5) + 30;
				officer.title = rank_names[officer.rank];
				army.officers.generals.push(officer);
			break;
			case "colonel":
				officer.rank = 1;
				officer.xp = randomNumber(10) + 10;
				officer.title = rank_names[officer.rank];
				army.officers.colonels.push(officer);
			break;
		}
		officer_id++;
	}
}

function assignStaff () {
	for ( var i = 0; i < army.officers.generals.length; i++ ) {
		var general = army.officers.generals[i];
		for ( var t = 0; t < army.divisions.length; t++ ) {
			var division = army.divisions[t];
			if (division.commander_id == 0 && general.command_id == 0 && !general.retired) {
				division.commander_id = general.id;
				division.commander = general;
				general.command_id = division.unit_id;
			}
		}
	}
	for ( var o = 0; o < army.officers.colonels.length; o++ ) {
		var colonel = army.officers.colonels[o];
		for ( var t = 0; t < army.divisions.length; t++ ) {
			for ( var i = 0; i < army.divisions[t].brigades.length; i++ ) {
				if (army.divisions[t].brigades[i].commander_id == 0 && colonel.command_id == 0 && !colonel.retired) {
					army.divisions[t].brigades[i].commander_id = colonel.id;
					army.divisions[t].brigades[i].commander = colonel;
					colonel.command_id = army.divisions[t].brigades[i].unit_id;
				}
			}
		}
	}
}

function rewardStaff () {
	for ( var i = 0; i < army.officers.generals.length; i++ ) {
		var general = army.officers.generals[i];
		general.xp++;
	}
	for ( var o = 0; o < army.officers.colonels.length; o++ ) {
		var colonel = army.officers.colonels[o];
		colonel.xp++;
	}
}

function promoteColonel (division)  {
	var highest_experience = 0;
	var promoted_colonel_id = 0;
	for ( var o = 0; o < division.brigades.length; o++ ) {
		var brigade = division.brigades[o];
		if (brigade.commander.xp > highest_experience) {
			highest_experience = brigade.commander.xp;
			promoted_colonel_id = brigade.commander.id;
		}
	}
	for ( var o = 0; o < division.brigades.length; o++ ) {
		var brigade = division.brigades[o];
		if (brigade.commander.id == promoted_colonel_id) {
			brigade.commander = {};
			brigade.commander_id = 0;
		}
	}
	for ( var t = 0; t < army.officers.colonels.length; t++ ) {
		var colonel = army.officers.colonels[t];
		if (colonel.id == promoted_colonel_id) {
			colonel.rank++;
			colonel.title = rank_names[colonel.rank];
			colonel.command_id = 0;
			army.officers.colonels.splice(t, 1);
			army.officers.generals.push(colonel);
		}
	}
}

function retireStaff () {
	for ( var t = 0; t < army.divisions.length; t++ ) {
		division = army.divisions[t];
		if (division.commander.xp > 35) {
			division.commander.retired = true;
			division.commander = {};
			division.commander_id = 0;
			promoteColonel(division);
			generateOfficer("colonel", 1);
		}
	}
	for ( var t = 0; t < army.divisions.length; t++ ) {
		for ( var o = 0; o < army.divisions[t].brigades.length; o++ ) {
			brigade = army.divisions[t].brigades[o];
			if (brigade.commander.xp > 25) {
				brigade.commander.retired = true;
				brigade.commander = {};
				brigade.commander_id = 0;
				generateOfficer("colonel", 1);
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
	rewardStaff();
	retireStaff();
	day++;
}

//tick
setInterval(function () {
	passTurn();
	console.log("Turn");
}, 2000);

//helpers
function randomNumber (x) {
	return Math.floor(Math.random() * x);
}