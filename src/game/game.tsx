
import { Game } from './army'

export interface Window { game: Game }

declare const window: Window

window.game = new Game()
