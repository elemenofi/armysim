//start and deps
var express = require('express');
var army = express();			
var Chance = require('chance');
var chance = new Chance();

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
var army = {};
var day = 0;
var	global_officer_id = 1;
var	global_unit_id = 2;
var	global_log_id = 1;
var	rank_names = [
	"Lieutenant", "Major", "Coronel", 
	"General", "Division General", "Lieutenant General"
];
var	division_names = [
	"1st Division", "2nd Division"
];
var	brigade_names = [
	"1st Brigade", "2nd Brigade",
	"3rd Brigade", "4th Brigade"
];
var	regiment_names = [
	"1st Regiment", "2nd Regiment", "3rd Regiment",
	"4th Regiment", "5th Regiment", "6th Regiment",
	"7th Regiment", "8th Regiment"
];
var	company_names = [
	"1st Company", "2nd Company", "3rd Company",
	"4th Company", "5th Company", "6th Company",
	"7th Company", "8th Company", "9th Company",
	"10th Company", "11th Company",	"12th Company", 
	"13th Company", "14th Company",	"15th Company", 
	"16th Company"
];
var	company_names_short = [
	"1stC", "2ndC", "3rdC",
	"4thC", "5thC", "6thC",
	"7thC", "8thC", "9thC",
	"10thC", "11thC",	"12thC", 
	"13thC", "14thC",	"15thC", 
	"16thC"
];

//mechanics	
function generateArmy () {
	//create the army object with the unit structure
	//and and array for each rank of officers
	army = {
		name: "Army",
		unit_id: 1,
		commander_id: 0,
		divisions: [],
		officers: {
			division_generals: [],
			generals: [],
			coronels: [],
			majors: []
		},
		logs: []
	};
	//army structure is divided in two branches
	//each unit has two smaller units inside
	//division > brigade > regiment > company > battalion
	for (var i = 0; i < 2; i++) {
		var division = {
			name: division_names[i],
			unit_id: global_unit_id,
			commander_id: 0,
			brigades: []
		}
		global_unit_id++;
		var brigades = [];
		for (var t = 0; t < 2; t++) {
			var brigade = {
				// name: brigade_names[t],
				name: findUnitName("brigade"),
				unit_id: global_unit_id,
				commander_id: 0,
				regiments: []
			}
			global_unit_id++;
			var regiments = [];
			for (var q = 0; q < 2; q++) {
				var regiment = {
					// name: regiment_names[t],
					name: findUnitName("regiment"),
					unit_id: global_unit_id,
					commander_id: 0,
					companies: []
				}
				global_unit_id++;
				var companies = [];
				for (var r = 0; r < 2; r++) {
					var company = {
						// name: company_names[t],
						name: findUnitName("company"),
						name_short: findUnitName("company_short"),
						unit_id: global_unit_id,
						commander_id: 0
					}
					console.log(company);
					global_unit_id++;
					//next type of unit starts here
					regiment.companies.push(company);
				}
				brigade.regiments.push(regiment);
			}
			division.brigades.push(brigade);
		}
		army.divisions.push(division);
	};
	//helper function to use the name and remove it from the list
	//of available names
	function findUnitName ( type ) {
		var new_name = "";
		switch ( type ) {
			case "brigade":
				new_name = brigade_names[0];
				brigade_names.shift();
			break;
			case "regiment":
				new_name = regiment_names[0];
				regiment_names.shift();
			break;
			case "company":
				new_name = company_names[0];
				company_names.shift();
			break;
			case "company_short":
				new_name = company_names_short[0];
				company_names_short.shift();
			break;
		}
		return new_name;
	}
}

function generateOfficerByType (type, amount) {
	for ( var i = 0; i < amount; i++ ) {
		var officer = {
			id: global_officer_id,
			command_id: 0,
			name: chance.last(),
			first_name: chance.first(),
			retired: false,
			alignment: randomNumber(100),
			bonds: [[0, 0], [0, 0]]
		}
		switch ( type ) {
			case "division_general":
				officer.rank = 4;
				officer.xp = randomNumber(10) + 35;
				officer.title = rank_names[officer.rank];
				army.officers.division_generals.push(officer);
				addLog(
					officer.title +
					" " + 
					officer.name + 
					" has been recruited.", 
					"comission"
				);
			break;
			case "general":
				officer.rank = 3;
				officer.xp = randomNumber(10) + 25;
				officer.title = rank_names[officer.rank];
				army.officers.generals.push(officer);
				addLog(
					officer.title + 
					" " + 
					officer.name + 
					" has been recruited.", 
					"comission"
				);
			break;
			case "coronel":
				officer.rank = 2;
				officer.xp = randomNumber(10) + 15;
				officer.title = rank_names[officer.rank];
				army.officers.coronels.push(officer);
				addLog(
					officer.title + 
					" " + 
					officer.name + 
					" has been recruited.", 
					"comission"
				);
			break;
			case "major":
				officer.rank = 1;
				officer.xp = randomNumber(10) + 5;
				officer.title = rank_names[officer.rank];
				army.officers.majors.push(officer);
				addLog(
					officer.title + 
					" " + 
					officer.name + 
					" has been recruited.", 
					"comission"
				);
			break;
		}
		global_officer_id++;
	}
}

//initialize army staff
function generateStaff () {
	generateOfficerByType("division_general", 2);
	generateOfficerByType("general", 4);
	generateOfficerByType("coronel", 8);
	generateOfficerByType("major", 16);
}

function bondStaff () {
	//helper function to check alignment parity
	function sameAlignment (a, b) {
	  return ( (a.alignment > 50 && b.alignment > 50) ||
	           (a.alignment < 50 && b.alignment < 50) );
	}
	//for each division general
	for ( var i = 0; i < army.officers.division_generals.length; i++ ) { 
		var division_general = army.officers.division_generals[i];
		//loop through the other division_generals
		for ( var d = 0; d < army.officers.division_generals.length; d++ ) { 
			var division_general_b = army.officers.division_generals[d];
			//if same alignment and not self
			if ( sameAlignment(division_general, division_general_b) && 
				(division_general.id != division_general_b.id) ) { 
				var had_bond = false;
				for ( var n = 0; n < division_general.bonds.length; n++ ) {
					var bond = division_general.bonds[n];
					//if they were already bonded, strengthen the bond
					if ( (bond[0] === division_general_b.id) && (bond[1] < 10) ) {
						bond[1]++; 
						had_bond = true;
					}
				};
				if ( !had_bond ) {
					var new_bond = [division_general_b.id, 0];
					division_general.bonds.push(new_bond); //if not create new bond
				}
			}
		}
	}
	//for each general
	for ( var i = 0; i < army.officers.generals.length; i++ ) { 
		var general = army.officers.generals[i];
		//loop through the other generals
		for ( var d = 0; d < army.officers.generals.length; d++ ) { 
			var general_b = army.officers.generals[d];
			//if same alignment and not self
			if ( sameAlignment(general, general_b) && 
				(general.id != general_b.id) ) { 
				var had_bond = false;
				for ( var n = 0; n < general.bonds.length; n++ ) {
					var bond = general.bonds[n];
					//if they were already bonded, strengthen the bond
					if ( (bond[0] === general_b.id) && (bond[1] < 10) ) {
						bond[1]++; 
						had_bond = true;
					}
				};
				if ( !had_bond ) {
					var new_bond = [general_b.id, 0];
					general.bonds.push(new_bond); //if not create new bond
				}
			}
		}
	}
	//for each coronel 
	for ( var i = 0; i < army.officers.coronels.length; i++ ) { 
		var coronel = army.officers.coronels[i];
		//loop through the other coronels
		for ( var d = 0; d < army.officers.coronels.length; d++ ) { 
			var coronel_b = army.officers.coronels[d];
			//if same alignment and not self
			if ( sameAlignment(coronel, coronel_b) && 
				(coronel.id != coronel_b.id) ) { 
				var had_bond = false;
				for ( var n = 0; n < coronel.bonds.length; n++ ) {
					var bond = coronel.bonds[n];
					//if they were already bonded, strengthen the bond
					if ( (bond[0] === coronel_b.id) && (bond[1] < 10) ) {
						bond[1]++; 
						had_bond = true;
					}
				};
				if ( !had_bond ) {
					var new_bond = [coronel_b.id, 0];
					coronel.bonds.push(new_bond); //if not create new bond
				}
			}
		}
	}
	for ( var i = 0; i < army.officers.majors.length; i++ ) { 
		var major = army.officers.majors[i];
		//loop through the other majors
		for ( var d = 0; d < army.officers.majors.length; d++ ) { 
			var major_b = army.officers.majors[d];
			//if same alignment and not self
			if ( sameAlignment(major, major_b) && 
				(major.id != major_b.id) ) { 
				var had_bond = false;
				for ( var n = 0; n < major.bonds.length; n++ ) {
					var bond = major.bonds[n];
					//if they were already bonded, strengthen the bond
					if ( (bond[0] === major_b.id) && (bond[1] < 10) ) {
						bond[1]++; 
						had_bond = true;
					}
				};
				if ( !had_bond ) {
					var new_bond = [major_b.id, 0];
					major.bonds.push(new_bond); //if not create new bond
				}
			}
		}
	}
}

function assignStaff () {
	//find division for division generals
	for ( var i = 0; i < army.officers.division_generals.length; i++ ) {
		var division_general = army.officers.division_generals[i];
		for ( var t = 0; t < army.divisions.length; t++ ) {
			var division = army.divisions[t];
			if ( division.commander_id === 0 && 
				division_general.command_id === 0 && 
				!division_general.retired ) {
				division.commander_id = division_general.id;
				division.commander = division_general;
				division_general.command_id = division.unit_id;
				addLog(
					division_general.title + 
					" " + 
					division_general.name + 
					" has been assigned to " + 
					division.name, 
					"assignment"
				);
			}
		}
	}
	//find brigade for generals
	for ( var o = 0; o < army.officers.generals.length; o++ ) {
		var general = army.officers.generals[o];
		for ( var k = 0; k < army.divisions.length; k++ ) {
			for ( var n = 0; n < army.divisions[k].brigades.length; n++ ) {
				var brigade = army.divisions[k].brigades[n];
				if (brigade.commander_id === 0 &&
					general.command_id === 0 &&
					!general.retired ) {
					brigade.commander_id = general.id;
					brigade.commander = general;
					general.command_id = brigade.unit_id;
					addLog(
						general.title + 
						" " + 
						general.name + 
						" has been assigned to " + 
						brigade.name, 
						"assignment"
					);
				}
			}
		}
	}
	for ( var f = 0; f < army.officers.coronels.length; f++ ) {
		var coronel = army.officers.coronels[f];
		for ( var u = 0; u < army.divisions.length; u++ ) {
			for ( var y = 0; y < army.divisions[u].brigades.length; y++ ) {
				for ( var m = 0; m < army.divisions[u].brigades[y].regiments.length; m++ ) {
					var regiment = army.divisions[u].brigades[y].regiments[m];
					if ((regiment.commander_id === 0) &&
					    (coronel.command_id === 0) && 
					    !coronel.retired ) {
						regiment.commander_id = coronel.id;
						regiment.commander = coronel;
						coronel.command_id = regiment.unit_id;
						addLog(
							coronel.title + 
							" " + 
							coronel.name + 
							" has been assigned to " + 
							regiment.name, 
							"assignment"
						);
					}
				}
			}
		}
	}
	for ( var f = 0; f < army.officers.majors.length; f++ ) {
		var major = army.officers.majors[f];
		for ( var u = 0; u < army.divisions.length; u++ ) {
		for ( var y = 0; y < army.divisions[u].brigades.length; y++ ) {
		for ( var m = 0; m < army.divisions[u].brigades[y].regiments.length; m++ ) {
		for ( var i = 0; i < army.divisions[u].brigades[y].regiments[m].companies.length; i++) {
			var company = army.divisions[u].brigades[y].regiments[m].companies[i];
			if ((company.commander_id === 0) &&
			    (major.command_id === 0) && 
			    !major.retired ) {
				company.commander_id = major.id;
				company.commander = major;
				major.command_id = company.unit_id;
				addLog(
					major.title + 
					" " + 
					major.name + 
					" has been assigned to " + 
					company.name, 
					"assignment"
				);
			}
		}
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
	for ( var o = 0; o < army.officers.coronels.length; o++ ) {
		var coronel = army.officers.coronels[o];
		coronel.xp++;
	}
	for ( var o = 0; o < army.officers.majors.length; o++ ) {
		var major = army.officers.majors[o];
		major.xp++;
	}
}

function alignStaff () {
	for ( var i = 0; i < army.officers.division_generals.length; i++ ) {
		var division_general = army.officers.division_generals[i];
		if ((division_general.alignment > 50) &&
			(division_general.alignment < 100)) {
			division_general.alignment++;
		} else if ((division_general.alignment < 50) && 
			(division_general.alignment > 0)) {
			division_general.alignment--;
		}
	}
	for ( var i = 0; i < army.officers.generals.length; i++ ) {
		var general = army.officers.generals[i];
		if (general.alignment > 50 && general.alignment < 100) {
			general.alignment++;
		} else if (general.alignment < 50 && general.alignment > 0) {
			general.alignment--;
		}
	}
	for ( var i = 0; i < army.officers.coronels.length; i++ ) {
		var coronel = army.officers.coronels[i];
		if (coronel.alignment > 50 && coronel.alignment < 100) {
			coronel.alignment++;
		} else if (coronel.alignment < 50 && coronel.alignment > 0) {
			coronel.alignment--;
		}
	}
	for ( var i = 0; i < army.officers.majors.length; i++ ) {
		var major = army.officers.majors[i];
		if (major.alignment > 50 && major.alignment < 100) {
			major.alignment++;
		} else if (major.alignment < 50 && major.alignment > 0) {
			major.alignment--;
		}
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
			promoteCoronel(brigade);
		}
	}
	for ( var t = 0; t < army.officers.generals.length; t++ ) {
		var general = army.officers.generals[t];
		if (general.id === promoted_general_id) {
			addLog(
				general.title + 
				" " + 
				general.name + 
				" has been promoted to Division General", 
				"promotion"
			);
			general.rank++;
			general.title = rank_names[general.rank];
			general.command_id = 0;
			army.officers.generals.splice(t, 1);
			army.officers.division_generals.push(general);
		}
	}
}
function promoteCoronel (brigade)  {
	var highest_experience = 0;
	var promoted_coronel_id = 0;
	for ( var o = 0; o < brigade.regiments.length; o++ ) {
		var regiment = brigade.regiments[o];
		if (regiment.commander.xp > highest_experience) {
			highest_experience = regiment.commander.xp;
			promoted_coronel_id = regiment.commander.id;
		}
	}
	for ( var e = 0; e < brigade.regiments.length; e++ ) {
		var regiment = brigade.regiments[e];
		if (regiment.commander.id === promoted_coronel_id) {
			regiment.commander = {};
			regiment.commander_id = 0;
			promoteMajor(regiment);
		}
	}
	for ( var t = 0; t < army.officers.coronels.length; t++ ) {
		var coronel = army.officers.coronels[t];
		if (coronel.id === promoted_coronel_id) {
			addLog(
				coronel.title + 
				" " + 
				coronel.name + 
				" has been promoted to General", 
				"promotion"
			);
			coronel.rank++;
			coronel.title = rank_names[coronel.rank];
			coronel.command_id = 0;
			army.officers.coronels.splice(t, 1);
			army.officers.generals.push(coronel);	
		}
	}
}
function promoteMajor (regiment)  {
	var highest_experience = 0;
	var promoted_major_id = 0;
	for ( var o = 0; o < regiment.companies.length; o++ ) {
		var company = regiment.companies[o];
		if (company.commander.xp > highest_experience) {
			highest_experience = company.commander.xp;
			promoted_major_id = company.commander.id;
		}
	}
	for ( var e = 0; e < regiment.companies.length; e++ ) {
		var company = regiment.companies[e];
		if (company.commander.id === promoted_major_id) {
			company.commander = {};
			company.commander_id = 0;
		}
	}
	for ( var t = 0; t < army.officers.majors.length; t++ ) {
		var major = army.officers.majors[t];
		if (major.id === promoted_major_id) {
			addLog(
				major.title + 
				" " + 
				major.name + 
				" has been promoted to General", 
				"promotion"
			);
			major.rank++;
			major.title = rank_names[major.rank];
			major.command_id = 0;
			army.officers.majors.splice(t, 1);
			army.officers.coronels.push(major);	
		}
	}
}

function retireStaff () {
	for ( var t = 0; t < army.divisions.length; t++ ) {
		var division = army.divisions[t];
		if (division.commander.xp > 45) {
			addLog(
				division.commander.title + 
				" " + 
				division.commander.name + 
				" has retired", 
				"retirement"
			);
			division.commander.retired = true;
			division.commander = {};
			division.commander_id = 0;
			generateOfficerByType("major", 1);
			promoteGeneral(division);
		}
	}
	for ( var t = 0; t < army.divisions.length; t++ ) {
		for ( var o = 0; o < army.divisions[t].brigades.length; o++ ) {
			var brigade = army.divisions[t].brigades[o];
			if (brigade.commander.xp > 35) {
				addLog(
					brigade.commander.title + 
					" " + 
					brigade.commander.name + 
					" has retired", 
					"retirement"
				);
				brigade.commander.retired = true;
				brigade.commander = {};
				brigade.commander_id = 0;
				generateOfficerByType("major", 1);
				promoteCoronel(brigade);
			}
		}
	}
	for ( var t = 0; t < army.divisions.length; t++ ) {
		for ( var o = 0; o < army.divisions[t].brigades.length; o++ ) {
			for (var d = 0; 
				d < army.divisions[t].brigades[o].regiments.length;
				d++) {
				var regiment = army.divisions[t].brigades[o].regiments[d];
				if (regiment.commander.xp > 25) {
					addLog(
						regiment.commander.title + 
						" " + 
						regiment.commander.name + 
						" has retired", 
						"retirement"
					);
					regiment.commander.retired = true;
					regiment.commander = {};
					regiment.commander_id = 0;
					generateOfficerByType("major", 1);
					promoteMajor(regiment);
				}
			}
		}
	}
	for ( var t = 0; t < army.divisions.length; t++ ) {
		for ( var o = 0; o < army.divisions[t].brigades.length; o++ ) {
			for (var d = 0; d < army.divisions[t].brigades[o].regiments.length;	d++) {
				for (var b = 0; b < army.divisions[t].brigades[o].regiments[d].companies.length;	b++) {
					var company = army.divisions[t].brigades[o].regiments[d].companies[b];
					if (company.commander.xp > 20) {
						addLog(
							company.commander.title + 
							" " + 
							company.commander.name + 
							" has retired", 
							"retirement"
						);
						company.commander.retired = true;
						company.commander = {};
						company.commander_id = 0;
						generateOfficerByType("major", 1);
					}
				}
			}
		}
	}
}

//logs
function decayLogs () {
	while ( army.logs.length > 10 ) {
		army.logs.shift();
	}
}
//creates log with category for css color display
function addLog (message, category) {
	decayLogs();
	var log = [message, 0, global_log_id, category];
	global_log_id++;
	army.logs.push(log);
}

//turns
function passTurn () {
	if ( day === 0 ) {
		generateArmy();
		generateStaff();
	};
	assignStaff();
	bondStaff();
	rewardStaff();
	alignStaff();
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
