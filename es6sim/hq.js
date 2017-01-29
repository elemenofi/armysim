'use strict';
import * as moment from 'moment';
import config from './config';
import Operations from './operations';
import World from './world';
import Officers from './officers';
class HQ {
    constructor() {
        this.operations = new Operations();
        this.rawDate = new Date();
        this.units = [];
        this.officers = new Officers();
        this.world = new World(this);
    }
    updateDate() {
        this.rawDate = moment(this.rawDate).add(1, "days");
        this.realDate = config.formatDate(this.rawDate);
    }
    update(triggeredByUserAction) {
        if (!triggeredByUserAction)
            this.updateDate();
        this.units.map(this.reserve.bind(this));
        this.operations.update(this);
        this.officers.update(this);
        this.officers.reserve();
    }
    makePlayer() {
        let squads = this.findUnitsByType('squad');
        let unit = squads[config.random(squads.length) + 1];
        unit.commander.reserved = true;
        unit.commander = this.officers.replaceForPlayer.call(this, unit.commander);
        this.player = unit.commander;
    }
    findPlayer() {
        return this.officers.pool.filter(officer => {
            return officer.isPlayer;
        })[0];
    }
    findOfficersByName(name) {
        return this.officers.active.filter(officer => {
            return officer.name().toLowerCase().includes(name.toLowerCase());
        });
    }
    findUnitsByType(type) {
        return this.units.filter(unit => { return unit.type === type; });
    }
    findUnitById(id) {
        return this.units.filter(unit => { return unit.id === id; })[0];
    }
    findCommandingOfficer(officer) {
        if (!officer)
            return { name: () => { return 'No name'; } };
        var officerUnit = this.units.filter(unit => { return unit.id === officer.unitId; })[0];
        var superiorUnit = this.units.filter(unit => { return officerUnit && unit.id === officerUnit.parentId; })[0];
        if (!superiorUnit)
            return { name: () => { return 'No name'; } };
        return superiorUnit.commander;
    }
    findOfficerById(officerId) {
        return this.officers.pool.filter(officer => { return officer.id === Number(officerId); })[0];
    }
    inspectOfficer(officerId) {
        var officer = this.findOfficerById(officerId);
        this.officers.inspected = officer;
        return officer;
    }
    findStaffById(officerId, playerUnitId) {
        if (Number(officerId) === Number(this.findPlayer().id)) {
            return this.findPlayer();
        }
        var unit = this.units.filter(unit => { return unit.id === Number(playerUnitId); })[0];
        return unit.reserve.filter(officer => { return officer.id === Number(officerId); })[0];
    }
    findStaff(officer) {
        var staff = [];
        var unit = this.units.filter(unit => { return unit.id === officer.unitId; })[0];
        if (unit && unit.reserve)
            unit.reserve.forEach(officer => { if (!officer.isPlayer)
                staff.push(officer); });
        return staff;
    }
    findOperationalStaff(officer) {
        var operationalStaff = [];
        operationalStaff = operationalStaff.concat(this.findStaff(officer));
        operationalStaff = operationalStaff.concat(this.findSubordinates(officer));
        return operationalStaff;
    }
    findSubordinates(officer) {
        var subordinates = [];
        var unit = this.units.filter(unit => { return unit.id === officer.unitId; })[0];
        if (unit && unit.subunits)
            unit.subunits.forEach(subunit => {
                subordinates.push(subunit.commander);
            });
        return subordinates;
    }
    findInspected() {
        return this.officers.inspected;
    }
    findOfficersByRank(rank) {
        return this.officers.active.filter(officer => {
            return officer.rank === rank;
        });
    }
    findActiveOfficers() {
        return this.officers.active;
    }
    add(unit) {
        this.units.push(unit);
    }
    reserve(unit) {
        if (unit.commander.reserved)
            this.replace(unit);
    }
    replace(unit) {
        unit.commander = this.officers.replace.call(this, unit.commander);
    }
    deassign(id) {
        this.replace(this.units.filter(unit => { return unit.id === id; })[0]);
    }
    inspect(officer) {
        this.officers.inspected = officer;
    }
    unitName(unitId, unitName) {
        let result = this.units.filter(unit => { return unit.id === unitId; })[0];
        if (!result)
            return unitName;
        return result.name;
    }
}
export default HQ;
