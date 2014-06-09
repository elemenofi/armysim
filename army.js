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
var senior_officer_xp = 0;
var senior_officer_id = 0;
var working_traits = ["Lazy", "Diligent"];
var intelligence_traits = ["Smart", "Stupid"];
var	rank_names = [
	"Captain", "Major", "Coronel", 
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
var battalion_names = [
  "1st Battalion", "2nd Battalion", "3rd Battalion",
  "4th Battalion", "5th Battalion", "6th Battalion",
  "7th Battalion", "8th Battalion", "9th Battalion",
  "10th Battalion", "11th Battalion", "12th Battalion", 
  "13th Battalion", "14th Battalion", "15th Battalion", 
  "16th Battalion", 
  "17th Battalion", "18th Battalion", "19th Battalion",
  "20th Battalion", "21th Battalion", "22th Battalion",
  "23th Battalion", "24th Battalion", "25th Battalion",
  "26th Battalion", "27th Battalion", "28th Battalion", 
  "29th Battalion", "30th Battalion", "31th Battalion", 
  "32th Battalion"
];
var battalion_names_short = [
  "1stB", "2ndB", "3rdB",
  "4thB", "5thB", "6thB",
  "7thB", "8thB", "9thB",
  "10thB", "11thB", "12thB", 
  "13thB", "14thB", "15thB", 
  "16thB",
  "17thB", "18thB", "19thB",
  "20thB", "21thB", "22thB",
  "23thB", "24thB", "25thB",
  "26thB", "27thB", "28thB", 
  "29thB", "30thB", "31thB", 
  "32thB"
];

//simulation functions
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
			majors: [],
      		captains: []
		},
		logs: []
	};
	//army structure is divided in two branches
	//each unit has two smaller units inside
	//division > brigade > regiment > company > battalion
	for (var i = 0; i < 2; i++) {
		var division = {
			type: 2,
			name: division_names[i],
			unit_id: global_unit_id,
			commander_id: 0,
			brigades: []
		}
		global_unit_id++;
		var brigades = [];
		for (var t = 0; t < 2; t++) {
			var brigade = {
				type: 3,
				name: assignUnitName("brigade"),
				unit_id: global_unit_id,
				commander_id: 0,
				regiments: []
			}
			global_unit_id++;
			var regiments = [];
			for (var q = 0; q < 2; q++) {
				var regiment = {
					type: 4,
					name: assignUnitName("regiment"),
					unit_id: global_unit_id,
					commander_id: 0,
					companies: []
				}
				global_unit_id++;
				var companies = [];
				for (var r = 0; r < 2; r++) {
					var company = {
						type: 5,
						name: assignUnitName("company"),
						name_short: assignUnitName("company_short"),
						unit_id: global_unit_id,
						commander_id: 0,
            			battalions: []
					}
					global_unit_id++;
					var battalions = [];
					for (var n = 0; n < 2; n++) {
						var battalion = {
							type: 6,
							name: assignUnitName("battalion"),
							name_short: assignUnitName("battalion_short"),
							unit_id: global_unit_id,
							commander_id: 0
						}
						//next type of unit starts here
						company.battalions.push(battalion);
					}
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
	function assignUnitName ( type ) {
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
			case "battalion":
				new_name = battalion_names[0];
				battalion_names.shift();
			break;
			case "battalion_short":
				new_name = battalion_names_short[0];
				battalion_names_short.shift();
			break;
		}
		return new_name;
	}
}

function generateOfficerByType (type, amount) {
  // function randomTraits () {
  //   var officer_traits = [];
  //   var trait_number = randomNumber(traits.length);
  //   var new_trait = traits[trait_number];
  //   officer_traits.push(new_trait);
  //   var trait_number_2 = randomTrait2();
  //   function randomTrait2 () {
  //     var result = randomNumber(traits.length);
  //     if (result === trait_number) {
  //       return randomTrait2();
  //     } else {
  //       return result;
  //     }
  //   }
  //   var new_trait_2 = traits[trait_number_2];
  //   officer_traits.push(new_trait_2);
  //   return officer_traits;
  // }
	for ( var i = 0; i < amount; i++ ) {
		var officer = {
			id: global_officer_id,
			command_id: 0,
			name: chance.last(),
			first_name: chance.first(),
			retired: false,
			alignment: randomNumber(100),
			bonds: [[0, 0], [0, 0]],
      traits: randomTraits()
		}
		global_officer_id++;
		switch ( type ) {
			case "division_general":
				officer.rank = 5;
				officer.xp = randomNumber(10) + 45;
				officer.title = rank_names[officer.rank];
				army.officers.division_generals.push(officer);
			break;
			case "general":
				officer.rank = 4;
				officer.xp = randomNumber(10) + 35;
				officer.title = rank_names[officer.rank];
				army.officers.generals.push(officer);
			break;
			case "coronel":
				officer.rank = 3;
				officer.xp = randomNumber(10) + 25;
				officer.title = rank_names[officer.rank];
				army.officers.coronels.push(officer);
			break;
			case "major":
				officer.rank = 2;
				officer.xp = randomNumber(10) + 15;
				officer.title = rank_names[officer.rank];
				army.officers.majors.push(officer);
			break;
			case "captain":
				officer.rank = 1;
				officer.xp = randomNumber(10) + 5;
				officer.title = rank_names[officer.rank];
				army.officers.captains.push(officer);
			break;
		}
    	console.log(officer.traits);
		if (!(type === "major") || !(type === "captain")) {
			addLog(
				officer.title +
				" " + 
				officer.name + 
				" recruited.", 
				"comission"
			);
		}
	}
}

function generateOfficers () {
	generateOfficerByType("division_general", 2);
	generateOfficerByType("general", 4);
	generateOfficerByType("coronel", 8);
	generateOfficerByType("major", 16);
	generateOfficerByType("captain", 32);
}

function rewardOfficers () {
	function rewardOfficersByRank ( rank ) {
		for ( var i = 0; i < rank.length; i++ ) {
			var officer = rank[i];
			officer.xp++;
		}
	}
	rewardOfficersByRank(army.officers.captains);
	rewardOfficersByRank(army.officers.majors);
	rewardOfficersByRank(army.officers.coronels);
	rewardOfficersByRank(army.officers.generals);
	rewardOfficersByRank(army.officers.division_generals);
}

function alignOfficers () {
	function alignOfficersByRank ( rank ) {
		for ( var i = 0; i < rank.length; i++ ) {
			var officer = rank[i];
			if (officer.alignment > 50 && officer.alignment < 100) {
				officer.alignment++;
			} else if (officer.alignment < 50 && officer.alignment > 0) {
				officer.alignment--;
			}
		}
	}
	alignOfficersByRank(army.officers.captains);
	alignOfficersByRank(army.officers.majors);
	alignOfficersByRank(army.officers.coronels);
	alignOfficersByRank(army.officers.generals);
	alignOfficersByRank(army.officers.division_generals);
}

function bondOfficers () {
	//helper function to check alignment parity
	function sameAlignment (a, b) {
		return ( (a.alignment > 50 && b.alignment > 50) ||
	           (a.alignment < 50 && b.alignment < 50) );
	}
	function bondOfficersByRank ( rank ) {
		for ( var i = 0; i < rank.length; i++ ) { 
			var officer = rank[i];
			//loop through the other officers
			//if same alignment and not self
			//if they were already bonded, strengthen the bond, max 10
			//if not create new bond
			for ( var d = 0; d < rank.length; d++ ) { 
				var officer_b = rank[d];
				if ( sameAlignment(officer, officer_b) && 
					(officer.id != officer_b.id) ) { 
					var had_bond = false;
					for ( var n = 0; n < officer.bonds.length; n++ ) {
						var bond = officer.bonds[n];
						if ( (bond[0] === officer_b.id) && (bond[1] < 10) ) {
							bond[1]++; 
							had_bond = true;
						}
					};
					if ( !had_bond ) {
						var new_bond = [officer_b.id, 0];
						officer.bonds.push(new_bond); 
					}
				}
			}
		}
	}
    bondOfficersByRank(army.officers.captains);
	bondOfficersByRank(army.officers.majors);
	bondOfficersByRank(army.officers.coronels);
	bondOfficersByRank(army.officers.generals);
	bondOfficersByRank(army.officers.division_generals);
}

function assignOfficers () {
	function assignOfficerToUnit ( officer, unit ) {
		if ( unit.commander_id === 0 && 
			officer.command_id === 0 && 
			!officer.retired ) {
			unit.commander_id = officer.id;
			unit.commander = officer;
			officer.command_id = unit.unit_id;
		}
	}
	function assignOfficersByType ( type ) {
		switch ( type ) {
			case "division_general":
				for ( var i = 0; i < army.officers.division_generals.length; i++ ) {
				var officer = army.officers.division_generals[i];
				for ( var t = 0; t < army.divisions.length; t++ ) {
					var unit = army.divisions[t];
					assignOfficerToUnit( officer, unit );
				}
				}
			break;
			case "general":
				for ( var i = 0; i < army.officers.generals.length; i++ ) {
				var officer = army.officers.generals[i];
				for ( var t = 0; t < army.divisions.length; t++ ) {
				for ( var n = 0; n < army.divisions[t].brigades.length; n++ ) {
					var unit = army.divisions[t].brigades[n];
					assignOfficerToUnit( officer, unit );
				}
				}
				}
			break;
			case "coronel":
				for ( var i = 0; i < army.officers.coronels.length; i++ ) {
				var officer = army.officers.coronels[i];
				for ( var t = 0; t < army.divisions.length; t++ ) {
				for ( var n = 0; n < army.divisions[t].brigades.length; n++ ) {
				for ( var m = 0; m < army.divisions[t].brigades[n].regiments.length; m++ ) {
					var unit = army.divisions[t].brigades[n].regiments[m];
					assignOfficerToUnit( officer, unit );
				}
				}
				}
				}
			break;
			case "major":
				for ( var i = 0; i < army.officers.majors.length; i++ ) {
				var officer = army.officers.majors[i];
				for ( var t = 0; t < army.divisions.length; t++ ) {
				for ( var n = 0; n < army.divisions[t].brigades.length; n++ ) {
				for ( var m = 0; m < army.divisions[t].brigades[n].regiments.length; m++ ) {
				for ( var o = 0; o < army.divisions[t].brigades[n].regiments[m].companies.length; o++) {
					var unit = army.divisions[t].brigades[n].regiments[m].companies[o];
					assignOfficerToUnit( officer, unit );
				}
				}
				}
				}
				}
			break;
			case "captain":
				for ( var i = 0; i < army.officers.captains.length; i++ ) {
				var officer = army.officers.captains[i];
				for ( var t = 0; t < army.divisions.length; t++ ) {
				for ( var n = 0; n < army.divisions[t].brigades.length; n++ ) {
				for ( var m = 0; m < army.divisions[t].brigades[n].regiments.length; m++ ) {
				for ( var o = 0; o < army.divisions[t].brigades[n].regiments[m].companies.length; o++) {
				for ( var r = 0; r < army.divisions[t].brigades[n].regiments[m].companies[o].battalions.length; r++) {
				  var unit = army.divisions[t].brigades[n].regiments[m].companies[o].battalions[r];
				  assignOfficerToUnit( officer, unit );
				}
				}
				}
				}
				}
				}
			break;
		}
	}
	assignOfficersByType("division_general");
	assignOfficersByType("general");
	assignOfficersByType("coronel");
	assignOfficersByType("major");
    assignOfficersByType("captain");
}

function retireOfficers () {
	function retireCommander ( unit ) {
		if (!(unit.type === 5) || !(unit.type === 6)) {
			addLog(
				unit.commander.title +
				" " + 
				unit.commander.first_name +
				" " + 
				unit.commander.name + 
				" retired", 
				"retirement"
			);
		}
		unit.commander.retired = true;
		unit.commander = {};
		unit.commander_id = 0;
		generateOfficerByType("captain", 1);
	}
    // this function could easily refactored as such 
	/*
	function retireCommanderFromUnit ( unit ) {
		var max_xp = 0;
		switch (unit.type) {
			case 2:
				max_xp = 55;
			break;
			case 3:
				max_xp = 45;
			break;
			case 4:
				max_xp = 35;
			break;
			case 5:
				max_xp = 25;
			break;
			case 6:
				max_xp = 15;
			break;
		}
		if ((unit.commander.xp > max_xp) && (unit.type === 6)) {
			retireCommander(unit);
		} else if (unit.commander.xp > max_xp) {
			retireCommander(unit);
			promoteOfficer(unit);
		}
	}

	*/
	function retireCommanderFromUnit ( unit ) {
    switch (unit.type) {
			case 2:
				if (unit.commander.xp > 55) {
					retireCommander(unit);
					promoteOfficer(unit);
				}
			break;
			case 3:
				if (unit.commander.xp > 45) {
					retireCommander(unit);
					promoteOfficer(unit);
				}
			break;
			case 4:
				if (unit.commander.xp > 35) {
					retireCommander(unit);
					promoteOfficer(unit);
				}
			break;
			case 5:
				if (unit.commander.xp > 25) {
					retireCommander(unit);
          			promoteOfficer(unit);
				}
			break;
			case 6:
				if (unit.commander.xp > 15) {
					retireCommander(unit);
				}
			break;
		}
	}
	for ( var t = 0; t < army.divisions.length; t++ ) {
		var unit = army.divisions[t];
		retireCommanderFromUnit(unit);
	for ( var o = 0; o < army.divisions[t].brigades.length; o++ ) {
		var unit = army.divisions[t].brigades[o];
		retireCommanderFromUnit(unit);
	for ( var d = 0; d < army.divisions[t].brigades[o].regiments.length;	d++) {
		var unit = army.divisions[t].brigades[o].regiments[d];
		retireCommanderFromUnit(unit);
	for ( var b = 0; b < army.divisions[t].brigades[o].regiments[d].companies.length; b++) {
		var unit = army.divisions[t].brigades[o].regiments[d].companies[b];
		retireCommanderFromUnit(unit);
    for ( var a = 0; a < army.divisions[t].brigades[o].regiments[d].companies[b].battalions.length; a++) {
    	var unit = army.divisions[t].brigades[o].regiments[d].companies[b].battalions[a];
    	retireCommanderFromUnit(unit);
    }
    }
	}
	}
	}
}

function findSenior ( unit ) {
	if (unit.commander.xp > senior_officer_xp) {
		senior_officer_xp = unit.commander.xp;
		senior_officer_id = unit.commander.id;
	}
}

function resetCommander ( unit ) {
	if (unit.commander_id === senior_officer_id) {
		unit.commander = {};
		unit.commander_id = 0;
	}
}

function resetCommand ( officer ) {
	officer.rank++;
	officer.title = rank_names[officer.rank];
	officer.command_id = 0;
}

function promoteSenior ( officer, index ) {
	if (officer.id === senior_officer_id) {
		addLog(
			officer.title +
			" " + 
			officer.first_name +
			" " + 
			officer.name + 
			" promoted", 
			"promotion"
		);
		resetCommand(officer);
		switch ( officer.rank ) {
			case 5:
				army.officers.generals.splice(index, 1);
				army.officers.division_generals.push(officer);
			break;
			case 4:
				army.officers.coronels.splice(index, 1);
				army.officers.generals.push(officer);
			break;
			case 3:
				army.officers.majors.splice(index, 1);
				army.officers.coronels.push(officer);
			break;
      		case 2:
        		army.officers.captains.splice(index, 1);
        		army.officers.majors.push(officer);
      		break;
		}
		senior_officer_xp = 0;
		senior_officer_id = 0;
	}
}

function promoteOfficer ( unit ) {
	switch ( unit.type ) {
		case 2:
			for ( var o = 0; o < unit.brigades.length; o++ ) {
				var brigade = unit.brigades[o];
				findSenior(brigade);
			}
			for ( var a = 0; a < unit.brigades.length; a++ ) {
				var brigade = unit.brigades[a];
				resetCommander(brigade);
			}
			for ( var index = 0; index < army.officers.generals.length; index++ ) {
				var general = army.officers.generals[index];
				promoteSenior(general, index);
			}
			promoteOfficer(brigade);
		break;
		case 3:
			for ( var o = 0; o < unit.regiments.length; o++ ) {
				var regiment = unit.regiments[o];
				findSenior(regiment);
			}
			for ( var e = 0; e < unit.regiments.length; e++ ) {
				var regiment = unit.regiments[e];
				resetCommander(regiment);
			}
			for ( var index = 0; index < army.officers.coronels.length; index++ ) {
				var coronel = army.officers.coronels[index];
				promoteSenior(coronel, index);
			}
			promoteOfficer(regiment);
		break;
		case 4:
			for ( var o = 0; o < unit.companies.length; o++ ) {
				var company = unit.companies[o];
				findSenior(company);
			}
			for ( var e = 0; e < unit.companies.length; e++ ) {
				var company = unit.companies[e];
				resetCommander(company);
			}
			for ( var index = 0; index < army.officers.majors.length; index++ ) {
				var major = army.officers.majors[index];
				promoteSenior(major, index);
			}
      		promoteOfficer(company);
		break;
	    case 5:
			for ( var o = 0; o < unit.battalions.length; o++ ) {
				var battalion = unit.battalions[o];
				findSenior(battalion);
			}
			for ( var e = 0; e < unit.battalions.length; e++ ) {
				var battalion = unit.battalions[e];
				resetCommander(battalion);
			}
			for ( var index = 0; index < army.officers.captains.length; index++ ) {
				var captain = army.officers.captains[index];
				promoteSenior(captain, index);
			}
	    break;
	}
}

//logs
function decayLogs ( max_logs ) {
	while ( army.logs.length > max_logs ) {
		army.logs.shift();
	}
}

function addLog (message, category) {
	decayLogs(20);
	var log = [message, 0, global_log_id, category];
	global_log_id++;
	army.logs.push(log);
}

//turns
function passTurn () {
	if ( day === 0 ) {
		generateArmy();
		generateOfficers();
		assignOfficers();
		day++;
	} else {
		alignOfficers();
		bondOfficers();
		rewardOfficers();
		retireOfficers();
		assignOfficers();
		day++;
	}	
}

//tick
setInterval(function () {
	passTurn();
}, 2000);

//helpers
function randomNumber (x) {
	return Math.floor(Math.random() * x);
}
