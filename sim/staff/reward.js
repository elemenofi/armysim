var values = require('../utils/values');
var helpers = require('../utils/helpers');
var engine = require('../engine');
var _ = require('underscore')

function givePrestige (officer, army) {
	var bonusPrestige = 0;

	bonusPrestige += officer.prestige;
	bonusPrestige += helpers.randomNumber(values.prestigeTurn);

	if (officer.valedictorian) {
		bonusPrestige += helpers.randomNumber(values.prestigeValedictorian);
	};

	return bonusPrestige;
};

var calculateBadges = function (officer) {
	var badges = values.badgesPerPrestige(officer);

	if (officer.badges.length === 0) {
		for (var i = 0; i < badges; i++) {
			giveBadges(officer);
		};
	};

	return badges;
};

var giveBadges = function (officer) {
	var badge = helpers.createBadge();
	officer.badges.push(badge);
};

var giveNewBadges = function (officer, badges) {
	var newBadges = calculateBadges(officer);

	for (var i = 0; i < (newBadges - badges); i++) {
		giveBadges(officer);
	};
};

exports.update = function (army) {
	_.each(army.staff, function (officer) {
		var badges = calculateBadges(officer);

		if (officer.retired === false) {
			officer.xp++;

			officer.prestige = givePrestige(officer, army);

			giveNewBadges(officer, badges);
		};
	});
	return army.staff;
};
