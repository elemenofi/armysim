
import Army from './army'

interface Window { army: any }

declare var window: Window

window.army = new Army()
