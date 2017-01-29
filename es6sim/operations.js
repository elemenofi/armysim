'use strict';
const config_1 = require("./config");
class Operations {
    constructor() {
        this.operationsID = 1;
        this.active = [];
    }
    add(spec) {
        if (spec.officer.operations.length >= spec.officer.rank.hierarchy + 1)
            return;
        let operation = new Operation(spec);
        operation.id = this.operationsID;
        this.operationsID++;
        this.active.push(operation);
        if (!spec.byPlayer)
            spec.officer.operations.push(operation);
        return operation;
    }
    update(HQ) {
        this.active = this.active.filter(operation => {
            if (!operation.target.reserved && operation.turns > 0) {
                return true;
            }
            else {
                operation.officer.operations.splice(operation.officer.operations.indexOf(operation), 1);
                return false;
            }
        });
        this.active.forEach(operation => {
            if (!operation.logged && operation.byPlayer) {
                HQ.findPlayer().operations.push(operation);
                operation.logged = true;
            }
            operation.execute(HQ);
        });
    }
}
class Operation {
    constructor(spec) {
        this.officer = spec.officer;
        this.target = spec.target;
        this.type = spec.type;
        this.name = spec.name;
        this.strength = 0;
        this.turns = 1000;
        this.byPlayer = spec.byPlayer;
    }
    execute(HQ) {
        var officerRoll = this.officer[this.type] + config_1.default.random(10);
        var targetRoll = this.target[this.type] + config_1.default.random(10);
        if ((officerRoll) > (targetRoll)) {
            this.strength++;
        }
        else {
        }
        if (this.strength >= 300) {
            this.target.reserve(HQ, this);
            this.officer.operations.splice(this.officer.operations.indexOf(this), 1);
            if (this.byPlayer)
                HQ.findPlayer().operations.splice(HQ.findPlayer().operations.indexOf(this), 1);
        }
        this.turns--;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Operations;
