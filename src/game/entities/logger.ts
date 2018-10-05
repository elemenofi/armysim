import { Game } from './game'
import { Headquarter } from './army';

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
    return this.day() + ' promoted to ' + newRank
  }

  retire (): string {
    return this.day() + ' retired'
  }
}
