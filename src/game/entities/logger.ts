
import { Game } from './game'
import { Operation, OperationStatus } from './operation'

export interface Window {
  game: Game
}

declare const window: Window

export class Logger {
  day (): string {
    const day = new Date()
    day.setDate(day.getDate() + window.game.turn)
    return day.toDateString()
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
