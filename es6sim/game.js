'use strict';
import Engine from './engine';
import Ui from './ui.jsx';
import Army from './army';


let engine = new Engine();
let army = new Army();
engine.ui = new Ui(engine);

engine.start(army);
