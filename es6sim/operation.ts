import config from './config';
import Officer from './officer';
import HQ from './HQ'
import * as moment from 'moment';

export class Operation {
  id: number;
  officer: Officer;
  target: Officer;
  type: string;
  name: string;
  strength: number;
  turns: number;
  logged: boolean;
  byPlayer: boolean;
  completed: string;
  description: string;
  descriptions = {
    intelligence: 'infiltrating',
    commanding: 'assaulting',
    diplomacy: 'negotiating with'
  }

  constructor (spec) {
    this.officer = spec.officer;
    this.target = spec.target;
    this.type = spec.type;
    this.name = 'Operation Lazzarus';
    this.strength = 0;
    this.turns = 1000;
    this.byPlayer = spec.byPlayer;
    this.description = this.descriptions[spec.type]
  }

  roll (officer: Officer): number {
    let o = officer;
    let roll;
    roll =
      o[this.type] +
      o.intelligence +
      o.rank.hierarchy +
      config.random(10);

    roll += (o.commander && o.commander.party === o.party) ? o.commander.rank.hierarchy : 0;

    return roll;
  }

  execute (HQ: HQ): void {
    var targetRoll = this.roll(this.target)
    var officerRoll = this.roll(this.officer)

    if ((officerRoll) > (targetRoll)) {
      this.strength++;
    }

    if (this.strength >= 300) {
      this.target.reserve(HQ, this)
      this.officer.prestige += 10
      this.officer.prestige += this.target.prestige
      this.officer.operations[this.officer.operations.indexOf(this)] = undefined;
      this.officer.completed.push(this)
      if (this.byPlayer) {
        HQ.findPlayer().operations[HQ.findPlayer().operations.indexOf(this)] = undefined;
        HQ.findPlayer().completed.push(this)
      }
    }

    this.turns--;
  }
}

export default Operation;