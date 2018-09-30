
import { Game } from './game'
import { Operation, OperationStatus } from './operation'
import { Headquarter } from './army';

export interface Window {
  game: Game
}

declare const window: Window

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
    return this.day() + ' promoted to ' + newRank
  }

  retire (): string {
    return this.day() + ' retired'
  }

  forcedRetirement (operation?: Operation): string {
    return (
      this.day() +
      ' forced to retire by ' +
      operation.officer.fullName()
      // ' in ' +
      // operation.name
    )
  }
}
