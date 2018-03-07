
import * as moment from 'moment'
import { Operation, OperationStatus } from './entities/operation'
import { Game } from './game'

export interface Window {
  game: Game
}

declare const window: Window

export class Logger {
  day (): string {
    return moment()
      .add(window.game.turn, 'days')
      .format('YYYY-MM-DD')
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
      operation.officer.fullName() +
      ' in ' +
      operation.name
    )
  }
}
