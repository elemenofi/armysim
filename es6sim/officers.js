'use strict';
const config_1 = require("./config");
const officer_1 = require("./officer");
const secretary_1 = require("./secretary");
const player_1 = require("./player");
class Officers {
    constructor() {
        this.pool = [];
        this.active = [];
        this.__officersID = 1;
        this.secretary = new secretary_1.default();
        this.player = undefined;
        this.inspected = undefined;
    }
    update(HQ) {
        this.active.forEach(officer => { officer.update(HQ); });
        this.active = this.active.filter(officer => { return !officer.reserved; });
    }
    recruit(rank, unitId, isPlayer, unitName) {
        let options = {
            date: this.realDate,
            id: this.officers.__officersID,
            unitId: unitId,
            rankName: rank
        };
        let cadet = (isPlayer) ? new player_1.default(options, this, unitName) : new officer_1.default(options, this, unitName);
        if (isPlayer)
            this.player = cadet;
        this.officers.active.push(cadet);
        this.officers.pool.push(cadet);
        this.officers.__officersID++;
        return cadet;
    }
    replace(replacedCommander) {
        let lowerRank = this.officers.secretary.rankLower(replacedCommander.rank);
        let spec = {
            unitId: replacedCommander.unitId,
            rank: replacedCommander.rank.alias,
            rankToPromote: lowerRank,
            HQ: this
        };
        if (replacedCommander.couped && lowerRank) {
            return this.officers.candidate(spec, true);
        }
        else if (lowerRank) {
            return this.officers.candidate(spec);
        }
        else {
            return this.officers.recruit.call(this, spec.rank, replacedCommander.unitId);
        }
    }
    replaceForPlayer(replacedCommander) {
        return this.officers.recruit.call(this, 'lieutenant', replacedCommander.unitId, true);
    }
    candidate(spec, forced) {
        let candidate = this.active
            .filter(officer => { return officer.rank.alias === spec.rankToPromote; })
            .reduce((prev, curr) => (curr.experience > prev.experience) ? curr : prev);
        if (forced) {
            candidate = spec.HQ.findPlayer();
        }
        return this.promote(candidate, spec);
    }
    promote(officer, spec) {
        spec.HQ.deassign(officer.unitId);
        let promotion = this.promotion(officer, spec);
        officer.history.push(config_1.default.promoted(promotion));
        officer.drifts(this.active, spec.HQ.units);
        return officer;
    }
    promotion(officer, spec) {
        officer.unitId = spec.unitId;
        officer.rank = config_1.default.ranks[spec.rank];
        return {
            rank: spec.rank,
            date: spec.HQ.realDate,
            unit: spec.HQ.unitName(officer.unitId)
        };
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Officers;
