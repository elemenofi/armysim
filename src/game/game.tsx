
import { Game } from './entities/army'

export interface Window { game: Game }

declare const window: Window

window.game = new Game()
