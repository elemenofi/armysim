'use strict';
const config_1 = require("./config");
const traits_1 = require("./traits");
class Officer {
    constructor(spec, HQ, unitName) {
        let traits = new traits_1.default();
        this.id = spec.id;
        this.isPlayer = spec.isPlayer;
        this.unitId = spec.unitId;
        this.rank = config_1.default.ranks[spec.rankName];
        this.experience = config_1.default.ranks[spec.rankName].startxp + config_1.default.random(500);
        this.prestige = config_1.default.ranks[spec.rankName].startpr + config_1.default.random(10);
        this.traits = { base: traits.random() };
        this.intelligence = this.traits.base.intelligence + config_1.default.random(10);
        this.commanding = this.traits.base.commanding + config_1.default.random(10);
        this.diplomacy = this.traits.base.diplomacy + config_1.default.random(10);
        this.alignment = config_1.default.random(1000);
        this.militancy = config_1.default.random(10);
        this.drift = 0;
        this.operations = [];
        this.history = [];
        this.reserved = false;
        this.lname = window.chance.last();
        this.fname = window.chance.first({ gender: 'male' });
        if (this.isPlayer) {
            this.lname = (config_1.default.debug) ? 'Richardson' : prompt('Name?');
            this.fname = 'John';
            this.experience = 0;
        }
        this.graduate({
            date: config_1.default.formatDate(HQ.rawDate),
            unitName: HQ.unitName(this.unitId, unitName)
        });
    }
    name() {
        return (!this.reserved) ?
            this.rank.title + ' ' + this.fname + ' ' + this.lname :
            this.rank.title + ' (R) ' + this.fname + ' ' + this.lname;
    }
    graduate(spec) {
        let graduation = { unit: spec.unitName, date: spec.date };
        this.history.push(config_1.default.graduated(graduation, this));
    }
    update(HQ) {
        this.align();
        this.militate(HQ);
        this.experience++;
        this.prestige += config_1.default.random(config_1.default.ranks[this.rank.alias].startpr);
        if (!this.reserved && this.experience > this.rank.maxxp)
            this.reserve(HQ);
    }
    drifts(officers, units) {
        this.unit = units.filter(unit => {
            return unit.id === this.unitId;
        })[0];
        this.commander = officers.filter(officer => {
            return officer.unitId === this.unit.parentId;
        })[0];
        if (this.commander && this.commander.alignment > 500) {
            this.drift++;
        }
        else {
            this.drift--;
        }
    }
    align() {
        if (this.drift > 0 && this.alignment < 1000) {
            this.alignment += this.drift;
        }
        else if (this.drift < 0 && this.alignment > 0) {
            this.alignment += this.drift;
        }
    }
    militate(HQ) {
        if (this.militancy > 8 && HQ.findCommandingOfficer(this).militancy < 2) {
            let spec = {
                officer: this,
                target: HQ.findCommandingOfficer(this),
                type: this.traits.base.area,
                name: 'Operation ' + this.lname,
            };
            if (spec.target)
                HQ.operations.add(spec);
        }
    }
    reserve(HQ, reason) {
        var lastUnit = HQ.units.filter(unit => {
            return unit.id === this.unitId;
        })[0];
        if (this.rank.hierarchy >= 4)
            lastUnit.reserve.push(this);
        if (lastUnit.reserve.length > 3)
            lastUnit.reserve.pop();
        this.reserved = true;
        this.history.push('Moved to reserve on ' + HQ.realDate);
        if (reason) {
            this.history[this.history.length - 1] = this.history[this.history.length - 1] + ' after succesful operation by ' + reason.officer.name();
            reason.officer.history.push('Moved ' + reason.target.name() + ' to reserve on ' + HQ.realDate + ' after succesful ' + reason.type + ' operation');
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Officer;
