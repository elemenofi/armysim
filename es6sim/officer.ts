/* global Chance */
import config from './config';
import * as moment from 'moment'
import {Traits, Trait} from './traits';
import * as chance from './lib/chance';
import Operation from './operation';
import Journal from './journal'
import Unit from './unit';
import HQ from './HQ'
interface Window { army: any, command: any }
declare var window: Window;

interface Chance {
  last(): string;
  first(o: Object): string
  word(l: number): string;
}

export interface Rank {
  hierarchy: number;
  title: string;
  alias: string;
  startxp: number;
  maxxp: number;
  startpr: number;
}

export interface Personality {
  base: Trait
  childhood: any
  teenhood: any
  college: any
  company: any
  field: any
  physical: any
  special: any
}

export class Officer implements Officer {
  lname: string;
  fname: string;
  id: number;
  isPlayer: boolean;
  unitId: number;
  reserved: boolean;
  experience: number;
  prestige: number;
  intelligence: number;
  diplomacy: number;
  commanding: number;
  alignment: number;
  militancy: number;
  drift: number;
  history: {events: string[], reason?: Operation};
  rank: Rank;
  rankName: string;
  operations: Operation[];
  completed: Operation[];
  unit: Unit;
  commander: Officer;
  personality: Partial<Personality>;
  chance: any;
  reason: Operation;
  targets: number[];
  party: string;
  militant: boolean;
  badges: any[];
  dead: boolean;
  operationDelay: number = 500;

  constructor (spec: Partial<Officer>, HQ: HQ, unitName: string) {
    let traits = new Traits();
    this.id = spec.id;
    this.isPlayer = spec.isPlayer;
    this.unitId = spec.unitId;
    this.reserved = false;

    this.rank = config.ranks[spec.rankName];
    this.experience = config.ranks[spec.rankName].startxp + config.random(500);
    this.prestige = 0;

    this.personality = {
      base: traits.random()
    }
    
    this.intelligence = this.personality.base.intelligence + config.random(10);
    this.commanding = this.personality.base.commanding + config.random(10);
    this.diplomacy = this.personality.base.diplomacy + config.random(10);

    this.alignment = config.random(10000);
    this.militant = false;
    this.militancy = 0;
    this.drift = Math.floor(Math.random() * 2) == 1 ? 1 : -1; //

    this.operations = [];
    this.completed = [];
    this.history = {
      events: []
    }
    this.targets = []

    this.chance = chance(Math.random);
    this.lname = this.chance.last();
    this.fname = this.chance.first({gender: 'male'});

    if (this.isPlayer) {
      this.lname = (config.debug) ? 'Richardson' : prompt('Name?');
      this.fname = 'John';
    }

    this.graduate({
      date: Journal.formatDate(HQ.rawDate),
      unitName: HQ.unitName(this.unitId, unitName),
      HQ: HQ
    });

    this.badges = [];
  }

  name () {
    if (this.reserved && !this.dead) return this.rank.title + ' (R) ' + this.fname + ' ' + this.lname;
    else if (!this.reserved) return this.rank.title + ' ' + this.fname + ' ' + this.lname;
    else if (this.dead) return this.rank.title + ' (D) ' + this.fname + ' ' + this.lname;
  }

  graduate (spec: { date: string, unitName: string, HQ: HQ}) {
    let graduation = { unit: spec.unitName, date: spec.date };
    let school = { name: this.chance.first({gender: 'male'}), date: Journal.formatDate(spec.HQ.rawDate.clone().subtract(5, 'years')) }
    this.history.events.push(Journal.graduated('school'));
    this.history.events.push(Journal.graduated('academy'));
  }

  update (HQ: HQ) {
    if (this.reserved) HQ.activeOfficers[this.id] = undefined;

    this.drifts(HQ);
    this.militate(HQ);
    this.align();

    this.experience++;

    if (!this.reserved && this.experience > this.rank.maxxp) this.reserve(HQ);
    if (this.experience > 16000) this.death(HQ);
  }

  death (HQ) {
    if (config.random(100) === 1) {
      this.dead = true;
      this.reserve(HQ);
    }
  }

  drifts (HQ: HQ) {
    let parent;
    let unit = HQ.findUnitById(this.unitId);
    if (unit) parent = HQ.findUnitById(unit.parentId);
    if (parent) {
      this.commander = parent.commander;
    } else {
      this.commander = undefined
    }
    this.party = (this.alignment > 5000) ? 'Conservative' : 'Radical';
  }

  align () {
    if (this.drift > 0 && this.alignment < 10000) {
      this.alignment += this.drift;
    } else if (this.drift < 0 && this.alignment > 0) {
      this.alignment += this.drift;
    }
  }

  militate (HQ: HQ) {
    this.militant = (
      this.alignment > 9000 ||
      this.alignment < 1000
    ) ? true : false;

    if (
      this.militant &&
      this.militancy < this.operationDelay
    ) this.militancy ++

    if (this.militancy === this.operationDelay) {
      this.startOperation(HQ);
      this.militancy -= this.operationDelay;
    }
  }

  startOperation (HQ) {
    let targets = this.chooseTarget(HQ);
    if (!targets.length) return;
    targets.forEach((target) => {
      if (
        target &&
        // !this.isPlayer &&
        !this.reserved &&
        this.operations.length <= this.rank.hierarchy &&
        !this.targets[target.id] &&
        this.rank.hierarchy < target.rank.hierarchy + 2
      ) {

        let spec = {
          officer: this,
          target: target,
          type: this.personality.base.area,
          name: '',
        };

        var word = this.chance.word();
        word = word.replace(/\b\w/g, l => l.toUpperCase());
        spec.name = 'Operation ' + word
        HQ.operations.add(spec);
        this.targets[target.id] = target.id;
      }
    })
  }

  chooseTarget (HQ: HQ): Officer[] {
    let targets = [];

    if (this.commander && this.commander.party !== this.party ||
      this.commander &&
      this.commander.rank.maxxp - this.commander.experience > //time to retire if in same position
      this.rank.maxxp - this.experience) { //officers whose boss will retire after them will be enemies
      targets.push(this.commander);
    }

    if (this.commander) {
      // my colleague in rank under my commander will be an enemy if he is
      // from the other party or has more experience than i do
      HQ.units[this.commander.unitId].subunits.forEach((unit) => {
        if (
          unit.commander.id !== this.id &&
          (
            unit.commander.party !== this.party ||
            unit.commander.experience > this.experience
          )
        ) {
          targets.push(unit.commander)
        }
      })
    }

    let allSubordinates = (HQ: HQ, officer: Officer, quantity: number): void => {
      if (quantity === -1) return
      if (HQ.units[officer.unitId]) {
        HQ.units[officer.unitId].subunits.forEach((subunit) => {
          let commander = subunit.commander;
          if (commander.party !== this.party) targets.push(commander)
          allSubordinates(HQ, commander, commander.rank.hierarchy - 1)
        })
      }
    }

    allSubordinates(HQ, this, this.rank.hierarchy - 1);

    return targets;
  }

  isAlly(officer: Officer): boolean {
    return this.party === officer.party
  }

  reserve (HQ, reason?: Operation) {
    var lastUnit = HQ.units[this.unitId]
    if (this.rank.alias === 'general') {
      lastUnit = window.army.command
    }

    if (this.rank.hierarchy >= 4) lastUnit.reserve.unshift(this);
    if (lastUnit.reserve.length > 3) lastUnit.reserve.pop();

    this.reserved = true;

    if (this.dead) {
      this.history.events.push(Journal.formatDate(HQ.rawDate) + ' buried with full Military Honors')
    } else if (!reason) {
      this.history.events.push('Moved to reserve on ' + Journal.formatDate(HQ.rawDate));
    } else if (reason) {
      this.logRetirement(HQ, reason)
    }
  }

  logRetirement (HQ: HQ, reason: Operation) {
    reason.completed = Journal.formatDate(HQ.rawDate)

    this.reason = reason;

    let lastRecord = this.history.events[this.history.events.length - 1];

    lastRecord = HQ.realDate + ', retired by ' + reason.name + ', directed by ' + reason.officer.name()

    reason.target.history.events.push(lastRecord)

    reason.officer.history.events.push(reason.name)

    if (reason.byPlayer && !reason.officer.isPlayer) {
      HQ.findPlayer().history.events.push(reason.name)
    }
  }
}

export default Officer;
