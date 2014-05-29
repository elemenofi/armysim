//start express app and dependencies
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

//settings, army data structure
var day = 0,
	officer_id = 1,
	log_id = 1,
	rank_names = ["Lieutenant", "General", "Division General", "Lieutenant General"],
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
			division_generals: [],
			generals: []
		},
		logs: []
	};

//mechanics
function generateStaff () {
	generateOfficer("division_general", 2);
	generateOfficer("general", 4);
}

function decayLogs () {
	while (army.logs.length > 10) {
		army.logs.shift();
	}
}

function addLog (message, duration, id, category) {
	decayLogs();
	var log = [message, 0, log_id, category];
	log_id++;
	army.logs.push(log);
}

function generateOfficer (type, amount) {
	for ( var i = 0; i < amount; i++ ) {
		var officer = {
			id: officer_id,
			command_id: 0,
			name: chance.first() + " " + chance.last(),
			retired: false,
			alignment: randomNumber(100),
			bonds: [[0, 0], [0, 0]]
		}
		switch (type) {
			case "division_general":
				officer.rank = 2;
				officer.xp = randomNumber(5) + 30;
				officer.title = rank_names[officer.rank];
				army.officers.division_generals.push(officer);
				addLog(officer.title + " " + officer.name + " has been recruited.", 0, log_id, "comission");
			break;
			case "general":
				officer.rank = 1;
				officer.xp = randomNumber(10) + 10;
				officer.title = rank_names[officer.rank];
				army.officers.generals.push(officer);
				addLog(officer.title + " " + officer.name + " has been recruited.", 0, log_id, "comission");
			break;
		}
		officer_id++;
	}
}

function sameAlignment (a, b) {
	if (a.alignment > 50 && b.alignment > 50) {
		return true;
	} else if (a.alignment < 50 && b.alignment < 50) {
		return true;
	} else {
		return false;
	}
}

function bondStaff () {
	for ( var i = 0; i < army.officers.generals.length; i++ ) {
		var general = army.officers.generals[i];
		for ( var d = 0; d < army.officers.generals.length; d++ ) {
			var general_b = army.officers.generals[d];
			if (sameAlignment(general, general_b) && (general.officer_id != general_b.officer_id)) {
				console.log("hey");
				for (var r = 0; r < general.bonds.length; r++) {
					var previous_bond = general.bonds[r];
					if (previous_bond[0] === general_b.officer_id) {
						previous_bond[1]++;
					} else {
						var bond = [general_b.officer_id, 0];
						addLog(general.title + " " + general.name + " and " + general_b.title + " " + general_b.name + " established relations.", 0, log_id, "bond");
					}
				};
			}
		}
	}
}

function assignStaff () {
	for ( var i = 0; i < army.officers.division_generals.length; i++ ) {
		var division_general = army.officers.division_generals[i];
		for ( var t = 0; t < army.divisions.length; t++ ) {
			var division = army.divisions[t];
			if (division.commander_id === 0 && division_general.command_id === 0 && !division_general.retired) {
				division.commander_id = division_general.id;
				division.commander = division_general;
				division_general.command_id = division.unit_id;
				addLog(division_general.title + " " + division_general.name + " has been assigned to " + division.name, 0, log_id, "assignment");
			}
		}
	}
	for ( var o = 0; o < army.officers.generals.length; o++ ) {
		var general = army.officers.generals[o];
		for ( var t = 0; t < army.divisions.length; t++ ) {
			for ( var i = 0; i < army.divisions[t].brigades.length; i++ ) {
				if (army.divisions[t].brigades[i].commander_id === 0 && general.command_id === 0 && !general.retired) {
					army.divisions[t].brigades[i].commander_id = general.id;
					army.divisions[t].brigades[i].commander = general;
					general.command_id = army.divisions[t].brigades[i].unit_id;
					addLog(general.title + " " + general.name + " has been assigned to " + army.divisions[t].brigades[i].name, 0, log_id, "assignment");
				}
			}
		}
	}
}

function rewardStaff () {
	for ( var i = 0; i < army.officers.division_generals.length; i++ ) {
		var division_general = army.officers.division_generals[i];
		division_general.xp++;
	}
	for ( var o = 0; o < army.officers.generals.length; o++ ) {
		var general = army.officers.generals[o];
		general.xp++;
	}
}

function alignStaff () {
	for ( var i = 0; i < army.officers.division_generals.length; i++ ) {
		var division_general = army.officers.division_generals[i];
		if (division_general.alignment > 50 && division_general.alignment < 100) {
			division_general.alignment++;
		} else if (division_general.alignment < 50 && division_general.alignment > 0) {
			division_general.alignment--;
		}
	}
	for ( var o = 0; o < army.officers.generals.length; o++ ) {
		var general = army.officers.generals[o];
		general.xp++;
	}
}

function promoteGeneral (division)  {
	var highest_experience = 0;
	var promoted_general_id = 0;
	for ( var o = 0; o < division.brigades.length; o++ ) {
		var brigade = division.brigades[o];
		if (brigade.commander.xp > highest_experience) {
			highest_experience = brigade.commander.xp;
			promoted_general_id = brigade.commander.id;
		}
	}
	for ( var o = 0; o < division.brigades.length; o++ ) {
		var brigade = division.brigades[o];
		if (brigade.commander.id === promoted_general_id) {
			brigade.commander = {};
			brigade.commander_id = 0;
		}
	}
	for ( var t = 0; t < army.officers.generals.length; t++ ) {
		var general = army.officers.generals[t];
		if (general.id === promoted_general_id) {
			general.rank++;
			addLog(general.title + " " + general.name + " has been promoted to Division General", 0, log_id, "promotion");
			general.title = rank_names[general.rank];
			general.command_id = 0;
			army.officers.generals.splice(t, 1);
			army.officers.division_generals.push(general);
		}
	}
}



function retireStaff () {
	for ( var t = 0; t < army.divisions.length; t++ ) {
		division = army.divisions[t];
		if (division.commander.xp > 35) {
			addLog(division.commander.title + " " + division.commander.name + " has retired", 0, log_id, "retirement");
			division.commander.retired = true;
			division.commander = {};
			division.commander_id = 0;
			promoteGeneral(division);
			generateOfficer("general", 1);
			
		}
	}
	for ( var t = 0; t < army.divisions.length; t++ ) {
		for ( var o = 0; o < army.divisions[t].brigades.length; o++ ) {
			brigade = army.divisions[t].brigades[o];
			if (brigade.commander.xp > 25) {
				addLog(brigade.commander.title + " " + brigade.commander.name + " has retired", 0, log_id, "retirement");
				brigade.commander.retired = true;
				brigade.commander = {};
				brigade.commander_id = 0;
				generateOfficer("general", 1);

			}
		}
	}
}

//turns
function passTurn () {
	if ( day === 0 ) {
		generateStaff();
	};
	assignStaff();
	bondStaff();
	rewardStaff();
	// alignStaff();
	retireStaff();
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