import { Game } from './game'
import { Headquarter } from './army';
import { Officer } from './officer';
import { Operation } from './operations';

export interface Window {
  game: Game
}

export class Logger {
  hq: Headquarter

  constructor (hq: Headquarter){
    this.hq = hq
  }
  
  day (): string {
    const day = new Date()
    day.setDate(day.getDate() + (this.hq.turn) ? this.hq.turn : 0)
    return day.toISOString().slice(0, 10)
  }

  promote (newRank: string): string {
    return this.day() + ' promoted to ' + newRank + '.'
  }

  retire (responsible?: Officer): string {
    let log = this.day() + ' retired'
    if (responsible) {
      log = this.day() + ' forced to retire by ' + responsible.fullName()
    }
    return log
  }

  retired (target: Officer): string {
    return this.day() + ' forced ' + target.fullName() + ' to retire.'
  }

  started (operation: Operation): string {
    return this.day() + ' started plotting against ' + operation.target.fullName()
  }

  resisted (officer: Officer): string {
    return this.day() + ' resisted ' + officer.fullName() + '.'
  }

  failed (target: Officer): string {
    return this.day() + ' failed against ' + target.fullName() + '.'
  }
}
