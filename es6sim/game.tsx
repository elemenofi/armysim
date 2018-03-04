
import { Game } from './v2/army'

export interface Window { game: Game }

declare const window: Window

window.game = new Game()
