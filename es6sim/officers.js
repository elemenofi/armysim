'use strict';
var config_1 = require('./config');
var officer_1 = require('./officer');
var secretary_1 = require('./secretary');
var player_1 = require('./player');
var Officers = (function () {
    function Officers() {
        this.pool = [];
        this.active = [];
        this.__officersID = 1;
        this.secretary = new secretary_1["default"]();
        this.player = undefined;
        this.inspected = undefined;
    }
    Officers.prototype.update = function (HQ) {
        this.active.forEach(function (officer) { officer.update(HQ); });
    };
    Officers.prototype.recruit = function (rank, unitId, isPlayer, unitName) {
        var options = {
            date: this.realDate,
            id: this.officers.__officersID,
            unitId: unitId,
            rankName: rank
        };
        var cadet = (isPlayer) ? new player_1["default"](options, this, unitName) : new officer_1["default"](options, this, unitName);
        if (isPlayer)
            this.player = cadet;
        this.officers.active.push(cadet);
        this.officers.pool.push(cadet);
        this.officers.__officersID++;
        return cadet;
    };
    Officers.prototype.reserve = function () {
        this.active = this.active.filter(function (officer) { return !officer.reserved; });
    };
    Officers.prototype.replace = function (replacedCommander) {
        var lowerRank = this.officers.secretary.rankLower(replacedCommander.rank);
        var spec = {
            unitId: replacedCommander.unitId,
            rank: replacedCommander.rank.alias,
            rankToPromote: lowerRank,
            HQ: this
        };
        if (lowerRank) {
            return this.officers.candidate(spec);
        }
        else {
            return this.officers.recruit.call(this, spec.rank, replacedCommander.unitId);
        }
    };
    Officers.prototype.replaceForPlayer = function (replacedCommander) {
        return this.officers.recruit.call(this, 'lieutenant', replacedCommander.unitId, true);
    };
    Officers.prototype.candidate = function (spec) {
        var candidate = this.active
            .filter(function (officer) { return officer.rank.alias === spec.rankToPromote; })
            .reduce(function (prev, curr) { return (curr.experience > prev.experience) ? curr : prev; });
        return this.promote(candidate, spec);
    };
    Officers.prototype.promote = function (officer, spec) {
        spec.HQ.deassign(officer.unitId);
        var promotion = this.promotion(officer, spec);
        officer.history.push(config_1["default"].promoted(promotion));
        officer.drifts(this.active, spec.HQ.units);
        return officer;
    };
    Officers.prototype.promotion = function (officer, spec) {
        officer.unitId = spec.unitId;
        officer.rank = config_1["default"].ranks[spec.rank];
        return {
            rank: spec.rank,
            date: spec.HQ.realDate,
            unit: spec.HQ.unitName(officer.unitId)
        };
    };
    return Officers;
})();
exports["default"] = Officers;
