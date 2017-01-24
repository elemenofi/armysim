'use strict';
import Engine from './engine';
import Army from './army';

window.army = new Army();
window.engine = new Engine(army);
