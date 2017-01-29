'use strict';
import Engine from './engine';
import Army from './army';
import Keyboard from './keyboard';

interface MyWindow extends Window {
    army: any;
}

declare var window: MyWindow;

window.army = new Army();
window.army.engine = new Engine(window.army);
window.army.keyboard = new Keyboard(window.army.engine)
