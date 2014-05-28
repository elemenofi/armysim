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
		},
		logs: []
	};

//mechanics
function generateStaff () {
	generateOfficer("general", 2);
	generateOfficer("colonel", 4);
}

function decayLogs () {
	for (var i = 0; i < army.logs.length; i++) {
		var log = army.logs[i];
		if (log[1] < 5) {
			log[1]++;
		} else {
			army.logs.splice(i, 1);
		}
	};
}

function generateOfficer (type, amount) {
	for ( var i = 0; i < amount; i++ ) {
		var officer = {
			id: officer_id,
			command_id: 0,
			name: chance.first() + " " + chance.last(),
			retired: false,
			alignment: randomNumber(100)
		}
		switch (type) {
			case "general":
				officer.rank = 2;
				officer.xp = randomNumber(5) + 30;
				officer.title = rank_names[officer.rank];
				army.officers.generals.push(officer);
				var log = [officer.title + " " + officer.name + " has been recruited.", 0];
				army.logs.push(log);
			break;
			case "colonel":
				officer.rank = 1;
				officer.xp = randomNumber(10) + 10;
				officer.title = rank_names[officer.rank];
				army.officers.colonels.push(officer);
				var log = [officer.title + " " + officer.name + " has been recruited.", 0];
				army.logs.push(log);
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
			if (division.commander_id === 0 && general.command_id === 0 && !general.retired) {
				division.commander_id = general.id;
				division.commander = general;
				general.command_id = division.unit_id;
				var log = [general.title + " " + general.name + " has been assigned to " + division.name, 0];
				army.logs.push(log);
			}
		}
	}
	for ( var o = 0; o < army.officers.colonels.length; o++ ) {
		var colonel = army.officers.colonels[o];
		for ( var t = 0; t < army.divisions.length; t++ ) {
			for ( var i = 0; i < army.divisions[t].brigades.length; i++ ) {
				if (army.divisions[t].brigades[i].commander_id === 0 && colonel.command_id === 0 && !colonel.retired) {
					army.divisions[t].brigades[i].commander_id = colonel.id;
					army.divisions[t].brigades[i].commander = colonel;
					colonel.command_id = army.divisions[t].brigades[i].unit_id;
					var log = [colonel.title + " " + colonel.name + " has been assigned to " + army.divisions[t].brigades[i].name, 0];
					army.logs.push(log);
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

function alignStaff () {
	for ( var i = 0; i < army.officers.generals.length; i++ ) {
		var general = army.officers.generals[i];
		if (general.alignment > 50 && general.alignment < 100) {
			general.alignment++;
		} else if (general.alignment < 50 && general.alignment > 0) {
			general.alignment--;
		}
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
		if (brigade.commander.id === promoted_colonel_id) {
			brigade.commander = {};
			brigade.commander_id = 0;
		}
	}
	for ( var t = 0; t < army.officers.colonels.length; t++ ) {
		var colonel = army.officers.colonels[t];
		if (colonel.id === promoted_colonel_id) {
			colonel.rank++;
			// log before changing title
			var log = [colonel.title + " " + colonel.name + " has been promoted to General", 0];
			army.logs.push(log);
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
			var log = [division.commander.title + " " + division.commander.name + " has retired", 0];
			army.logs.push(log);
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
				var log = [brigade.commander.title + " " + brigade.commander.name + " has retired", 0];
				army.logs.push(log);
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
	if ( day === 0 ) {
		generateStaff();
	};
	assignStaff();
	rewardStaff();
	// alignStaff();
	console.log(army.logs);
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