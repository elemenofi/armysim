'use strict';
import Engine from './engine';
import Ui from './ui.jsx';

const engine = new Engine();
const ui = new Ui();

engine.start();
ui.start();