'use strict';
var config_1 = require("./config");
var operations_1 = require("./operations");
var officers_1 = require("./officers");
var HQ = (function () {
    function HQ() {
        this.operations = new operations_1.default();
        this.rawDate = new Date();
        this.units = [];
        this.officers = new officers_1.default();
    }
    HQ.prototype.updateDate = function () {
        this.rawDate = this.rawDate.addDays(1);
        this.realDate = config_1.default.formatDate(this.rawDate);
    };
    HQ.prototype.update = function (triggeredByUserAction) {
        if (!triggeredByUserAction)
            this.updateDate();
        this.units.map(this.reserve.bind(this));
        this.operations.update(this);
        this.officers.update(this);
        this.officers.reserve();
    };
    HQ.prototype.makePlayer = function () {
        var squads = this.findUnitsByType('squad');
        var unit = squads[config_1.default.random(squads.length) + 1];
        unit.commander.reserved = true;
        unit.commander = this.officers.replaceForPlayer.call(this, unit.commander);
        this.player = unit.commander;
    };
    HQ.prototype.findPlayer = function () {
        return this.officers.pool.filter(function (officer) {
            return officer.isPlayer;
        })[0];
    };
    HQ.prototype.findOfficersByName = function (name) {
        return this.officers.active.filter(function (officer) {
            return officer.name().toLowerCase().includes(name.toLowerCase());
        });
    };
    HQ.prototype.findUnitsByType = function (type) {
        return this.units.filter(function (unit) { return unit.type === type; });
    };
    HQ.prototype.findUnitById = function (id) {
        return this.units.filter(function (unit) { return unit.id === id; })[0];
    };
    HQ.prototype.findCommandingOfficer = function (officer) {
        if (!officer)
            return { name: function () { return 'No name'; } };
        var officerUnit = this.units.filter(function (unit) { return unit.id === officer.unitId; })[0];
        var superiorUnit = this.units.filter(function (unit) { return officerUnit && unit.id === officerUnit.parentId; })[0];
        if (!superiorUnit)
            return { name: function () { return 'No name'; } };
        return superiorUnit.commander;
    };
    HQ.prototype.findOfficerById = function (officerId) {
        return this.officers.pool.filter(function (officer) { return officer.id === Number(officerId); })[0];
    };
    HQ.prototype.inspectOfficer = function (officerId) {
        var officer = this.findOfficerById(officerId);
        this.officers.inspected = officer;
        return officer;
    };
    HQ.prototype.findStaffById = function (officerId, playerUnitId) {
        if (Number(officerId) === Number(this.findPlayer().id)) {
            return this.findPlayer();
        }
        var unit = this.units.filter(function (unit) { return unit.id === Number(playerUnitId); })[0];
        return unit.reserve.filter(function (officer) { return officer.id === Number(officerId); })[0];
    };
    HQ.prototype.findStaff = function (officer) {
        var staff = [];
        var unit = this.units.filter(function (unit) { return unit.id === officer.unitId; })[0];
        if (unit && unit.reserve)
            unit.reserve.forEach(function (officer) { if (!officer.isPlayer)
                staff.push(officer); });
        return staff;
    };
    HQ.prototype.findOperationalStaff = function (officer) {
        var operationalStaff = [];
        operationalStaff = operationalStaff.concat(this.findStaff(officer));
        operationalStaff = operationalStaff.concat(this.findSubordinates(officer));
        return operationalStaff;
    };
    HQ.prototype.findSubordinates = function (officer) {
        var subordinates = [];
        var unit = this.units.filter(function (unit) { return unit.id === officer.unitId; })[0];
        if (unit && unit.subunits)
            unit.subunits.forEach(function (subunit) {
                subordinates.push(subunit.commander);
            });
        return subordinates;
    };
    HQ.prototype.findInspected = function () {
        return this.officers.inspected;
    };
    HQ.prototype.findOfficersByRank = function (rank) {
        return this.officers.active.filter(function (officer) {
            return officer.rank === rank;
        });
    };
    HQ.prototype.findActiveOfficers = function () {
        return this.officers.active;
    };
    HQ.prototype.add = function (unit) {
        this.units.push(unit);
    };
    HQ.prototype.reserve = function (unit) {
        if (unit.commander.reserved)
            this.replace(unit);
    };
    HQ.prototype.replace = function (unit) {
        unit.commander = this.officers.replace.call(this, unit.commander);
    };
    HQ.prototype.deassign = function (id) {
        this.replace(this.units.filter(function (unit) { return unit.id === id; })[0]);
    };
    HQ.prototype.inspect = function (officer) {
        this.officers.inspected = officer;
    };
    HQ.prototype.unitName = function (unitId, unitName) {
        var result = this.units.filter(function (unit) { return unit.id === unitId; })[0];
        if (!result)
            return unitName;
        return result.name;
    };
    return HQ;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HQ;
