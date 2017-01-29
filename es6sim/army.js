'use strict';
const hq_1 = require("./hq");
const unit_1 = require("./unit");
const config_1 = require("./config");
class Army {
    constructor() {
        this.HQ = new hq_1.default();
        this._unitsId = 2;
        this.units = {
            corps: []
        };
        this.id = 1;
        this.generate('corp', config_1.default.unitDepth);
    }
    generate(type, quantity, parent) {
        if (quantity === 0) {
            return;
        }
        else {
            let spec = {
                id: this._unitsId,
                type: type,
                parentId: undefined,
                rank: undefined
            };
            let unit = {};
            this._unitsId++;
            spec.parentId = parent ? parent.id : 1;
            switch (type) {
                case 'corp':
                    spec.rank = 'lgeneral';
                    unit = new unit_1.default(spec, this.HQ);
                    this.units.corps.push(unit);
                    this.generate('division', config_1.default.unitDepth, unit);
                    this.generate('corp', quantity - 1, parent);
                    break;
                case 'division':
                    spec.rank = 'dgeneral';
                    unit = new unit_1.default(spec, this.HQ);
                    parent.subunits = [];
                    parent.subunits.push(unit);
                    this.generate('brigade', config_1.default.unitDepth, unit);
                    this.generate('division', quantity - 1, parent);
                    break;
                case 'brigade':
                    spec.rank = 'bgeneral';
                    unit = new unit_1.default(spec, this.HQ);
                    parent.subunits = [];
                    parent.subunits.push(unit);
                    this.generate('regiment', config_1.default.unitDepth, unit);
                    this.generate('brigade', quantity - 1, parent);
                    break;
                case 'regiment':
                    spec.rank = 'coronel';
                    unit = new unit_1.default(spec, this.HQ);
                    parent.subunits = [];
                    parent.subunits.push(unit);
                    this.generate('battalion', config_1.default.unitDepth, unit);
                    this.generate('regiment', quantity - 1, parent);
                    break;
                case 'battalion':
                    spec.rank = 'lcoronel';
                    unit = new unit_1.default(spec, this.HQ);
                    parent.subunits = [];
                    parent.subunits.push(unit);
                    this.generate('company', config_1.default.unitDepth, unit);
                    this.generate('battalion', quantity - 1, parent);
                    break;
                case 'company':
                    spec.rank = 'major';
                    unit = new unit_1.default(spec, this.HQ);
                    parent.subunits = [];
                    parent.subunits.push(unit);
                    this.generate('platoon', config_1.default.unitDepth, unit);
                    this.generate('company', quantity - 1, parent);
                    break;
                case 'platoon':
                    spec.rank = 'captain';
                    unit = new unit_1.default(spec, this.HQ);
                    parent.subunits = [];
                    parent.subunits.push(unit);
                    this.generate('squad', config_1.default.unitDepth, unit);
                    this.generate('platoon', quantity - 1, parent);
                    break;
                case 'squad':
                    spec.rank = 'lieutenant';
                    unit = new unit_1.default(spec, this.HQ);
                    parent.subunits = [];
                    parent.subunits.push(unit);
                    this.generate('squad', quantity - 1, parent);
                    break;
            }
            this.HQ.add(unit);
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Army;
