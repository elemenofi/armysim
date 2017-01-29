'use strict';
import Engine from './engine';
import Army from './army';
import Keyboard from './keyboard';

(<any>window).army

window['army'] = new Army();
window['army'].engine = new Engine(window['army']);
window['army'].keyboard = new Keyboard(window['army'].engine)
