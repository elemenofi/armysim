'use strict';
const engine_1 = require("./engine");
const army_1 = require("./army");
const keyboard_1 = require("./keyboard");
window.army;
window['army'] = new army_1.default();
window['army'].engine = new engine_1.default(window['army']);
window['army'].keyboard = new keyboard_1.default(window['army'].engine);
