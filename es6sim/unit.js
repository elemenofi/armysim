'use strict';
var names_1 = require("./names");
var Unit = (function () {
    function Unit(spec, HQ) {
        this.id = spec.id;
        this.parentId = spec.parentId;
        this.type = spec.type;
        this.name = names_1.default[spec.type][0];
        names_1.default[spec.type].shift();
        this.reserve = [];
        this.commander = HQ.officers.recruit.call(HQ, spec.rank, this.id, false, this.name);
    }
    return Unit;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Unit;
