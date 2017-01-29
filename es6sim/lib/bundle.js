(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//actions must have engine and that is why i cannot be within HQ.
//we want the interface actions to run the engine even thought the date shouldnt
//go forward
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Actions = function Actions(engine) {
    _classCallCheck(this, Actions);

    this.inspect = function (officerId) {
        engine.army.HQ.inspectOfficer(officerId);
        if (!engine.running) {
            //pass true as triggeredByUserAction
            engine.update(true);
            engine.updateUI(true);
        }
    };
};

Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Actions;

},{}],2:[function(require,module,exports){
'use strict';
const hq_1 = require("./hq");
const unit_1 = require("./unit");
const config_1 = require("./config");
class Army {
    constructor() {
        this.HQ = new hq_1.default();
        this._unitsId = 2;
        this.units = {
            corps: []
        };
        this.id = 1;
        this.generate('corp', config_1.default.unitDepth);
    }
    generate(type, quantity, parent) {
        if (quantity === 0) {
            return;
        }
        else {
            let spec = {
                id: this._unitsId,
                type: type,
                parentId: undefined,
                rank: undefined
            };
            let unit = {};
            this._unitsId++;
            spec.parentId = parent ? parent.id : 1;
            switch (type) {
                case 'corp':
                    spec.rank = 'lgeneral';
                    unit = new unit_1.default(spec, this.HQ);
                    this.units.corps.push(unit);
                    this.generate('division', config_1.default.unitDepth, unit);
                    this.generate('corp', quantity - 1, parent);
                    break;
                case 'division':
                    spec.rank = 'dgeneral';
                    unit = new unit_1.default(spec, this.HQ);
                    parent.subunits.push(unit);
                    this.generate('brigade', config_1.default.unitDepth, unit);
                    this.generate('division', quantity - 1, parent);
                    break;
                case 'brigade':
                    spec.rank = 'bgeneral';
                    unit = new unit_1.default(spec, this.HQ);
                    parent.subunits.push(unit);
                    this.generate('regiment', config_1.default.unitDepth, unit);
                    this.generate('brigade', quantity - 1, parent);
                    break;
                case 'regiment':
                    spec.rank = 'coronel';
                    unit = new unit_1.default(spec, this.HQ);
                    parent.subunits.push(unit);
                    this.generate('battalion', config_1.default.unitDepth, unit);
                    this.generate('regiment', quantity - 1, parent);
                    break;
                case 'battalion':
                    spec.rank = 'lcoronel';
                    unit = new unit_1.default(spec, this.HQ);
                    parent.subunits.push(unit);
                    this.generate('company', config_1.default.unitDepth, unit);
                    this.generate('battalion', quantity - 1, parent);
                    break;
                case 'company':
                    spec.rank = 'major';
                    unit = new unit_1.default(spec, this.HQ);
                    parent.subunits.push(unit);
                    this.generate('platoon', config_1.default.unitDepth, unit);
                    this.generate('company', quantity - 1, parent);
                    break;
                case 'platoon':
                    spec.rank = 'captain';
                    unit = new unit_1.default(spec, this.HQ);
                    parent.subunits.push(unit);
                    this.generate('squad', config_1.default.unitDepth, unit);
                    this.generate('platoon', quantity - 1, parent);
                    break;
                case 'squad':
                    spec.rank = 'lieutenant';
                    unit = new unit_1.default(spec, this.HQ);
                    parent.subunits.push(unit);
                    this.generate('squad', quantity - 1, parent);
                    break;
            }
            this.HQ.add(unit);
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Army;

},{"./config":3,"./hq":6,"./unit":19}],3:[function(require,module,exports){
'use strict';
const moment = require("moment");
let gameLength = 30;
let config = {
    promoted(promotion) {
        let message = 'Promoted to ' + this.ranks[promotion.rank].title +
            ' on ' + promotion.date + ', assigned to the ' + promotion.unit;
        return message;
    },
    graduated(graduation, officer) {
        let when = '';
        if (graduation.date && graduation.unit) {
            when = ' on ' + graduation.date + ', assigned to the ' + graduation.unit;
        }
        let message = 'Graduated from ' + officer.traits.base.school + when;
        return message;
    },
    suffix(i) {
        var j = i % 10, k = i % 100;
        if (j == 1 && k != 11) {
            return 'st';
        }
        if (j == 2 && k != 12) {
            return 'nd';
        }
        if (j == 3 && k != 13) {
            return 'rd';
        }
        return 'th';
    },
    formatDate(rawDate) {
        let realDate;
        realDate = moment(rawDate).format('D of MMMM, YYYY');
        // realDate = rawDate.toFormat('DDDD the D of MMMM, YYYY');
        realDate = realDate.split(' ');
        realDate[0] = moment(rawDate).format('D') + config.suffix(moment(rawDate).format('D'));
        realDate = realDate.join(' ');
        return realDate;
    },
    random(n) {
        return Math.round(Math.random() * n);
    },
    speed: 10,
    debug: true,
    // this in 10000 turns makes a better historical start,
    // 100000 makes sure all staff officers are realistically old
    bufferTurns: 10,
    unitDepth: 2,
    staffSize: 20,
    operations: {
        commanding: { action: 'coup', area: 'commanding' },
        diplomacy: { action: 'influence', area: 'diplomacy' },
        intelligence: { action: 'spy', area: 'intelligence' }
    },
    ranks: {
        lieutenant: {
            hierarchy: 0,
            title: 'Lieutenant',
            alias: 'lieutenant',
            startxp: 10 * gameLength,
            maxxp: 80 * gameLength,
            startpr: 100
        },
        captain: {
            hierarchy: 1,
            title: 'Captain',
            alias: 'captain',
            startxp: 40 * gameLength,
            maxxp: 120 * gameLength,
            startpr: 200
        },
        major: {
            hierarchy: 2,
            title: 'Major',
            alias: 'major',
            startxp: 60 * gameLength,
            maxxp: 160 * gameLength,
            startpr: 300
        },
        lcoronel: {
            hierarchy: 3,
            title: 'Lieutenant Coronel',
            alias: 'lcoronel',
            startxp: 80 * gameLength,
            maxxp: 200 * gameLength,
            startpr: 400
        },
        coronel: {
            hierarchy: 4,
            title: 'Coronel',
            alias: 'coronel',
            startxp: 100 * gameLength,
            maxxp: 240 * gameLength,
            startpr: 500
        },
        bgeneral: {
            hierarchy: 5,
            title: 'Brigade General',
            alias: 'bgeneral',
            startxp: 120 * gameLength,
            maxxp: 280 * gameLength,
            startpr: 600
        },
        dgeneral: {
            hierarchy: 6,
            title: 'Division General',
            alias: 'dgeneral',
            startxp: 140 * gameLength,
            maxxp: 320 * gameLength,
            startpr: 700
        },
        lgeneral: {
            hierarchy: 7,
            title: 'Lieutenant General',
            alias: 'lgeneral',
            startxp: 160 * gameLength,
            maxxp: 360 * gameLength,
            startpr: 800
        },
        general: {
            hierarchy: 8,
            title: 'General',
            alias: 'general',
            startxp: 180 * gameLength,
            maxxp: 440 * gameLength,
            startpr: 900
        }
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = config;

},{"moment":21}],4:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ui_game_jsx_1 = require("./ui-game.jsx");
var actions_1 = require("./actions");
var config_1 = require("./config");

var Engine = function () {
    function Engine(army) {
        _classCallCheck(this, Engine);

        this.army = army;
        this.ui = new ui_game_jsx_1.default(this);
        this.actions = new actions_1.default(this);
        this.turn = 0;
        this.running = true;
        this.start(this);
    }

    _createClass(Engine, [{
        key: "getTurns",
        value: function getTurns() {
            return this.turn;
        }
    }, {
        key: "start",
        value: function start() {
            this.update();
            this.army.HQ.makePlayer();
            this.updateUI();
        }
    }, {
        key: "pause",
        value: function pause() {
            this.running = !this.running;
            if (this.running) this.update();
            if (this.running) this.updateUI();
        }
    }, {
        key: "update",
        value: function update(triggeredByUserAction) {
            var _this = this;

            while (this.turn < config_1.default.bufferTurns) {
                this.army.HQ.update();
                this.turn++;
            }
            this.army.HQ.update(triggeredByUserAction);
            this.turn++;
            if (this.running) {
                this.gameLoop = setTimeout(function () {
                    _this.update();
                }, config_1.default.speed);
            }
        }
    }, {
        key: "updateUI",
        value: function updateUI() {
            var _this2 = this;

            this.ui.render(this.army);
            if (this.running) {
                this.UILoop = setTimeout(function () {
                    _this2.updateUI();
                }, config_1.default.speed);
            }
        }
    }]);

    return Engine;
}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Engine;

},{"./actions":1,"./config":3,"./ui-game.jsx":18}],5:[function(require,module,exports){
'use strict';

var engine_1 = require("./engine");
var army_1 = require("./army");
var keyboard_1 = require("./keyboard");
window.army = new army_1.default();
window.army.engine = new engine_1.default(window.army);
window.army.keyboard = new keyboard_1.default(window.army.engine);

},{"./army":2,"./engine":4,"./keyboard":7}],6:[function(require,module,exports){
'use strict';
// import {} from './lib/date.js';
const moment = require("moment");
const config_1 = require("./config");
const operations_1 = require("./operations");
const world_1 = require("./world");
const officers_1 = require("./officers");
class HQ {
    constructor() {
        this.operations = new operations_1.default();
        this.rawDate = new Date();
        this.units = [];
        this.officers = new officers_1.default();
        this.world = new world_1.default(this);
    }
    updateDate() {
        this.rawDate = moment(this.rawDate).add(1, "days");
        this.realDate = config_1.default.formatDate(this.rawDate);
    }
    update(triggeredByUserAction) {
        if (!triggeredByUserAction)
            this.updateDate();
        this.units.map(this.reserve.bind(this));
        this.operations.update(this);
        this.officers.update(this);
        this.officers.reserve();
    }
    makePlayer() {
        let squads = this.findUnitsByType('squad');
        let unit = squads[config_1.default.random(squads.length) + 1];
        unit.commander.reserved = true;
        unit.commander = this.officers.replaceForPlayer.call(this, unit.commander);
        this.player = unit.commander;
    }
    findPlayer() {
        return this.officers.pool.filter(officer => {
            return officer.isPlayer;
        })[0];
    }
    findOfficersByName(name) {
        return this.officers.active.filter(officer => {
            return officer.name().toLowerCase().includes(name.toLowerCase());
        });
    }
    findUnitsByType(type) {
        return this.units.filter(unit => { return unit.type === type; });
    }
    findUnitById(id) {
        return this.units.filter(unit => { return unit.id === id; })[0];
    }
    findCommandingOfficer(officer) {
        if (!officer)
            return { name: () => { return 'No name'; } };
        var officerUnit = this.units.filter(unit => { return unit.id === officer.unitId; })[0];
        var superiorUnit = this.units.filter(unit => { return officerUnit && unit.id === officerUnit.parentId; })[0];
        if (!superiorUnit)
            return { name: () => { return 'No name'; } };
        return superiorUnit.commander;
    }
    findOfficerById(officerId) {
        return this.officers.pool.filter(officer => { return officer.id === Number(officerId); })[0];
    }
    inspectOfficer(officerId) {
        var officer = this.findOfficerById(officerId);
        this.officers.inspected = officer;
        return officer;
    }
    findStaffById(officerId, playerUnitId) {
        if (Number(officerId) === Number(this.findPlayer().id)) {
            return this.findPlayer();
        }
        var unit = this.units.filter(unit => { return unit.id === Number(playerUnitId); })[0];
        return unit.reserve.filter(officer => { return officer.id === Number(officerId); })[0];
    }
    findStaff(officer) {
        var staff = [];
        var unit = this.units.filter(unit => { return unit.id === officer.unitId; })[0];
        if (unit && unit.reserve)
            unit.reserve.forEach(officer => { if (!officer.isPlayer)
                staff.push(officer); });
        return staff;
    }
    findOperationalStaff(officer) {
        var operationalStaff = [];
        operationalStaff = operationalStaff.concat(this.findStaff(officer));
        operationalStaff = operationalStaff.concat(this.findSubordinates(officer));
        return operationalStaff;
    }
    findSubordinates(officer) {
        var subordinates = [];
        var unit = this.units.filter(unit => { return unit.id === officer.unitId; })[0];
        if (unit && unit.subunits)
            unit.subunits.forEach(subunit => {
                subordinates.push(subunit.commander);
            });
        return subordinates;
    }
    findInspected() {
        return this.officers.inspected;
    }
    findOfficersByRank(rank) {
        return this.officers.active.filter(officer => {
            return officer.rank === rank;
        });
    }
    findActiveOfficers() {
        return this.officers.active;
    }
    add(unit) {
        this.units.push(unit);
    }
    reserve(unit) {
        if (unit.commander.reserved)
            this.replace(unit);
    }
    replace(unit) {
        unit.commander = this.officers.replace.call(this, unit.commander);
    }
    deassign(id) {
        this.replace(this.units.filter(unit => { return unit.id === id; })[0]);
    }
    inspect(officer) {
        this.officers.inspected = officer;
    }
    unitName(unitId, unitName) {
        let result = this.units.filter(unit => { return unit.id === unitId; })[0];
        if (!result)
            return unitName;
        return result.name;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HQ;

},{"./config":3,"./officers":12,"./operations":13,"./world":20,"moment":21}],7:[function(require,module,exports){
"use strict";
//keybindings

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Keyboard = function Keyboard(engine) {
    _classCallCheck(this, Keyboard);

    window.addEventListener('keydown', function (e) {
        if (e.keyCode == 32 && e.target == document.body) {
            e.preventDefault();
            engine.pause();
        }
    });
};

Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Keyboard;

},{}],8:[function(require,module,exports){
(function (Buffer){
'use strict';var _typeof=typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"?function(obj){return typeof obj;}:function(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj;};//  Chance.js 1.0.4
//  http://chancejs.com
//  (c) 2013 Victor Quinn
//  Chance may be freely distributed or modified under the MIT license.
(function(){// Constants
var MAX_INT=9007199254740992;var MIN_INT=-MAX_INT;var NUMBERS='0123456789';var CHARS_LOWER='abcdefghijklmnopqrstuvwxyz';var CHARS_UPPER=CHARS_LOWER.toUpperCase();var HEX_POOL=NUMBERS+"abcdef";// Cached array helpers
var slice=Array.prototype.slice;// Constructor
function Chance(seed){if(!(this instanceof Chance)){return seed==null?new Chance():new Chance(seed);}// if user has provided a function, use that as the generator
if(typeof seed==='function'){this.random=seed;return this;}if(arguments.length){// set a starting value of zero so we can add to it
this.seed=0;}// otherwise, leave this.seed blank so that MT will receive a blank
for(var i=0;i<arguments.length;i++){var seedling=0;if(Object.prototype.toString.call(arguments[i])==='[object String]'){for(var j=0;j<arguments[i].length;j++){// create a numeric hash for each argument, add to seedling
var hash=0;for(var k=0;k<arguments[i].length;k++){hash=arguments[i].charCodeAt(k)+(hash<<6)+(hash<<16)-hash;}seedling+=hash;}}else{seedling=arguments[i];}this.seed+=(arguments.length-i)*seedling;}// If no generator function was provided, use our MT
this.mt=this.mersenne_twister(this.seed);this.bimd5=this.blueimp_md5();this.random=function(){return this.mt.random(this.seed);};return this;}Chance.prototype.VERSION="1.0.4";// Random helper functions
function initOptions(options,defaults){options||(options={});if(defaults){for(var i in defaults){if(typeof options[i]==='undefined'){options[i]=defaults[i];}}}return options;}function testRange(test,errorMessage){if(test){throw new RangeError(errorMessage);}}/**
     * Encode the input string with Base64.
     */var base64=function base64(){throw new Error('No Base64 encoder available.');};// Select proper Base64 encoder.
(function determineBase64Encoder(){if(typeof btoa==='function'){base64=btoa;}else if(typeof Buffer==='function'){base64=function base64(input){return new Buffer(input).toString('base64');};}})();// -- Basics --
/**
     *  Return a random bool, either true or false
     *
     *  @param {Object} [options={ likelihood: 50 }] alter the likelihood of
     *    receiving a true or false value back.
     *  @throws {RangeError} if the likelihood is out of bounds
     *  @returns {Bool} either true or false
     */Chance.prototype.bool=function(options){// likelihood of success (true)
options=initOptions(options,{likelihood:50});// Note, we could get some minor perf optimizations by checking range
// prior to initializing defaults, but that makes code a bit messier
// and the check more complicated as we have to check existence of
// the object then existence of the key before checking constraints.
// Since the options initialization should be minor computationally,
// decision made for code cleanliness intentionally. This is mentioned
// here as it's the first occurrence, will not be mentioned again.
testRange(options.likelihood<0||options.likelihood>100,"Chance: Likelihood accepts values from 0 to 100.");return this.random()*100<options.likelihood;};/**
     *  Return a random character.
     *
     *  @param {Object} [options={}] can specify a character pool, only alpha,
     *    only symbols, and casing (lower or upper)
     *  @returns {String} a single random character
     *  @throws {RangeError} Can only specify alpha or symbols, not both
     */Chance.prototype.character=function(options){options=initOptions(options);testRange(options.alpha&&options.symbols,"Chance: Cannot specify both alpha and symbols.");var symbols="!@#$%^&*()[]",letters,pool;if(options.casing==='lower'){letters=CHARS_LOWER;}else if(options.casing==='upper'){letters=CHARS_UPPER;}else{letters=CHARS_LOWER+CHARS_UPPER;}if(options.pool){pool=options.pool;}else if(options.alpha){pool=letters;}else if(options.symbols){pool=symbols;}else{pool=letters+NUMBERS+symbols;}return pool.charAt(this.natural({max:pool.length-1}));};// Note, wanted to use "float" or "double" but those are both JS reserved words.
// Note, fixed means N OR LESS digits after the decimal. This because
// It could be 14.9000 but in JavaScript, when this is cast as a number,
// the trailing zeroes are dropped. Left to the consumer if trailing zeroes are
// needed
/**
     *  Return a random floating point number
     *
     *  @param {Object} [options={}] can specify a fixed precision, min, max
     *  @returns {Number} a single floating point number
     *  @throws {RangeError} Can only specify fixed or precision, not both. Also
     *    min cannot be greater than max
     */Chance.prototype.floating=function(options){options=initOptions(options,{fixed:4});testRange(options.fixed&&options.precision,"Chance: Cannot specify both fixed and precision.");var num;var fixed=Math.pow(10,options.fixed);var max=MAX_INT/fixed;var min=-max;testRange(options.min&&options.fixed&&options.min<min,"Chance: Min specified is out of range with fixed. Min should be, at least, "+min);testRange(options.max&&options.fixed&&options.max>max,"Chance: Max specified is out of range with fixed. Max should be, at most, "+max);options=initOptions(options,{min:min,max:max});// Todo - Make this work!
// options.precision = (typeof options.precision !== "undefined") ? options.precision : false;
num=this.integer({min:options.min*fixed,max:options.max*fixed});var num_fixed=(num/fixed).toFixed(options.fixed);return parseFloat(num_fixed);};/**
     *  Return a random integer
     *
     *  NOTE the max and min are INCLUDED in the range. So:
     *  chance.integer({min: 1, max: 3});
     *  would return either 1, 2, or 3.
     *
     *  @param {Object} [options={}] can specify a min and/or max
     *  @returns {Number} a single random integer number
     *  @throws {RangeError} min cannot be greater than max
     */Chance.prototype.integer=function(options){// 9007199254740992 (2^53) is the max integer number in JavaScript
// See: http://vq.io/132sa2j
options=initOptions(options,{min:MIN_INT,max:MAX_INT});testRange(options.min>options.max,"Chance: Min cannot be greater than Max.");return Math.floor(this.random()*(options.max-options.min+1)+options.min);};/**
     *  Return a random natural
     *
     *  NOTE the max and min are INCLUDED in the range. So:
     *  chance.natural({min: 1, max: 3});
     *  would return either 1, 2, or 3.
     *
     *  @param {Object} [options={}] can specify a min and/or max
     *  @returns {Number} a single random integer number
     *  @throws {RangeError} min cannot be greater than max
     */Chance.prototype.natural=function(options){options=initOptions(options,{min:0,max:MAX_INT});testRange(options.min<0,"Chance: Min cannot be less than zero.");return this.integer(options);};/**
     *  Return a random hex number as string
     *
     *  NOTE the max and min are INCLUDED in the range. So:
     *  chance.hex({min: '9', max: 'B'});
     *  would return either '9', 'A' or 'B'.
     *
     *  @param {Object} [options={}] can specify a min and/or max and/or casing
     *  @returns {String} a single random string hex number
     *  @throws {RangeError} min cannot be greater than max
     */Chance.prototype.hex=function(options){options=initOptions(options,{min:0,max:MAX_INT,casing:'lower'});testRange(options.min<0,"Chance: Min cannot be less than zero.");var integer=chance.natural({min:options.min,max:options.max});if(options.casing==='upper'){return integer.toString(16).toUpperCase();}return integer.toString(16);};/**
     *  Return a random string
     *
     *  @param {Object} [options={}] can specify a length
     *  @returns {String} a string of random length
     *  @throws {RangeError} length cannot be less than zero
     */Chance.prototype.string=function(options){options=initOptions(options,{length:this.natural({min:5,max:20})});testRange(options.length<0,"Chance: Length cannot be less than zero.");var length=options.length,text=this.n(this.character,length,options);return text.join("");};// -- End Basics --
// -- Helpers --
Chance.prototype.capitalize=function(word){return word.charAt(0).toUpperCase()+word.substr(1);};Chance.prototype.mixin=function(obj){for(var func_name in obj){Chance.prototype[func_name]=obj[func_name];}return this;};/**
     *  Given a function that generates something random and a number of items to generate,
     *    return an array of items where none repeat.
     *
     *  @param {Function} fn the function that generates something random
     *  @param {Number} num number of terms to generate
     *  @param {Object} options any options to pass on to the generator function
     *  @returns {Array} an array of length `num` with every item generated by `fn` and unique
     *
     *  There can be more parameters after these. All additional parameters are provided to the given function
     */Chance.prototype.unique=function(fn,num,options){testRange(typeof fn!=="function","Chance: The first argument must be a function.");var comparator=function comparator(arr,val){return arr.indexOf(val)!==-1;};if(options){comparator=options.comparator||comparator;}var arr=[],count=0,result,MAX_DUPLICATES=num*50,params=slice.call(arguments,2);while(arr.length<num){var clonedParams=JSON.parse(JSON.stringify(params));result=fn.apply(this,clonedParams);if(!comparator(arr,result)){arr.push(result);// reset count when unique found
count=0;}if(++count>MAX_DUPLICATES){throw new RangeError("Chance: num is likely too large for sample set");}}return arr;};/**
     *  Gives an array of n random terms
     *
     *  @param {Function} fn the function that generates something random
     *  @param {Number} n number of terms to generate
     *  @returns {Array} an array of length `n` with items generated by `fn`
     *
     *  There can be more parameters after these. All additional parameters are provided to the given function
     */Chance.prototype.n=function(fn,n){testRange(typeof fn!=="function","Chance: The first argument must be a function.");if(typeof n==='undefined'){n=1;}var i=n,arr=[],params=slice.call(arguments,2);// Providing a negative count should result in a noop.
i=Math.max(0,i);for(null;i--;null){arr.push(fn.apply(this,params));}return arr;};// H/T to SO for this one: http://vq.io/OtUrZ5
Chance.prototype.pad=function(number,width,pad){// Default pad to 0 if none provided
pad=pad||'0';// Convert number to a string
number=number+'';return number.length>=width?number:new Array(width-number.length+1).join(pad)+number;};// DEPRECATED on 2015-10-01
Chance.prototype.pick=function(arr,count){if(arr.length===0){throw new RangeError("Chance: Cannot pick() from an empty array");}if(!count||count===1){return arr[this.natural({max:arr.length-1})];}else{return this.shuffle(arr).slice(0,count);}};// Given an array, returns a single random element
Chance.prototype.pickone=function(arr){if(arr.length===0){throw new RangeError("Chance: Cannot pickone() from an empty array");}return arr[this.natural({max:arr.length-1})];};// Given an array, returns a random set with 'count' elements
Chance.prototype.pickset=function(arr,count){if(count===0){return[];}if(arr.length===0){throw new RangeError("Chance: Cannot pickset() from an empty array");}if(count<0){throw new RangeError("Chance: count must be positive number");}if(!count||count===1){return[this.pickone(arr)];}else{return this.shuffle(arr).slice(0,count);}};Chance.prototype.shuffle=function(arr){var old_array=arr.slice(0),new_array=[],j=0,length=Number(old_array.length);for(var i=0;i<length;i++){// Pick a random index from the array
j=this.natural({max:old_array.length-1});// Add it to the new array
new_array[i]=old_array[j];// Remove that element from the original array
old_array.splice(j,1);}return new_array;};// Returns a single item from an array with relative weighting of odds
Chance.prototype.weighted=function(arr,weights,trim){if(arr.length!==weights.length){throw new RangeError("Chance: length of array and weights must match");}// scan weights array and sum valid entries
var sum=0;var val;for(var weightIndex=0;weightIndex<weights.length;++weightIndex){val=weights[weightIndex];if(isNaN(val)){throw new RangeError("all weights must be numbers");}if(val>0){sum+=val;}}if(sum===0){throw new RangeError("Chance: no valid entries in array weights");}// select a value within range
var selected=this.random()*sum;// find array entry corresponding to selected value
var total=0;var lastGoodIdx=-1;var chosenIdx;for(weightIndex=0;weightIndex<weights.length;++weightIndex){val=weights[weightIndex];total+=val;if(val>0){if(selected<=total){chosenIdx=weightIndex;break;}lastGoodIdx=weightIndex;}// handle any possible rounding error comparison to ensure something is picked
if(weightIndex===weights.length-1){chosenIdx=lastGoodIdx;}}var chosen=arr[chosenIdx];trim=typeof trim==='undefined'?false:trim;if(trim){arr.splice(chosenIdx,1);weights.splice(chosenIdx,1);}return chosen;};// -- End Helpers --
// -- Text --
Chance.prototype.paragraph=function(options){options=initOptions(options);var sentences=options.sentences||this.natural({min:3,max:7}),sentence_array=this.n(this.sentence,sentences);return sentence_array.join(' ');};// Could get smarter about this than generating random words and
// chaining them together. Such as: http://vq.io/1a5ceOh
Chance.prototype.sentence=function(options){options=initOptions(options);var words=options.words||this.natural({min:12,max:18}),punctuation=options.punctuation,text,word_array=this.n(this.word,words);text=word_array.join(' ');// Capitalize first letter of sentence
text=this.capitalize(text);// Make sure punctuation has a usable value
if(punctuation!==false&&!/^[\.\?;!:]$/.test(punctuation)){punctuation='.';}// Add punctuation mark
if(punctuation){text+=punctuation;}return text;};Chance.prototype.syllable=function(options){options=initOptions(options);var length=options.length||this.natural({min:2,max:3}),consonants='bcdfghjklmnprstvwz',// consonants except hard to speak ones
vowels='aeiou',// vowels
all=consonants+vowels,// all
text='',chr;// I'm sure there's a more elegant way to do this, but this works
// decently well.
for(var i=0;i<length;i++){if(i===0){// First character can be anything
chr=this.character({pool:all});}else if(consonants.indexOf(chr)===-1){// Last character was a vowel, now we want a consonant
chr=this.character({pool:consonants});}else{// Last character was a consonant, now we want a vowel
chr=this.character({pool:vowels});}text+=chr;}if(options.capitalize){text=this.capitalize(text);}return text;};Chance.prototype.word=function(options){options=initOptions(options);testRange(options.syllables&&options.length,"Chance: Cannot specify both syllables AND length.");var syllables=options.syllables||this.natural({min:1,max:3}),text='';if(options.length){// Either bound word by length
do{text+=this.syllable();}while(text.length<options.length);text=text.substring(0,options.length);}else{// Or by number of syllables
for(var i=0;i<syllables;i++){text+=this.syllable();}}if(options.capitalize){text=this.capitalize(text);}return text;};// -- End Text --
// -- Person --
Chance.prototype.age=function(options){options=initOptions(options);var ageRange;switch(options.type){case'child':ageRange={min:0,max:12};break;case'teen':ageRange={min:13,max:19};break;case'adult':ageRange={min:18,max:65};break;case'senior':ageRange={min:65,max:100};break;case'all':ageRange={min:0,max:100};break;default:ageRange={min:18,max:65};break;}return this.natural(ageRange);};Chance.prototype.birthday=function(options){var age=this.age(options);var currentYear=new Date().getFullYear();if(options&&options.type){var min=new Date();var max=new Date();min.setFullYear(currentYear-age-1);max.setFullYear(currentYear-age);options=initOptions(options,{min:min,max:max});}else{options=initOptions(options,{year:currentYear-age});}return this.date(options);};// CPF; ID to identify taxpayers in Brazil
Chance.prototype.cpf=function(options){options=initOptions(options,{formatted:true});var n=this.n(this.natural,9,{max:9});var d1=n[8]*2+n[7]*3+n[6]*4+n[5]*5+n[4]*6+n[3]*7+n[2]*8+n[1]*9+n[0]*10;d1=11-d1%11;if(d1>=10){d1=0;}var d2=d1*2+n[8]*3+n[7]*4+n[6]*5+n[5]*6+n[4]*7+n[3]*8+n[2]*9+n[1]*10+n[0]*11;d2=11-d2%11;if(d2>=10){d2=0;}var cpf=''+n[0]+n[1]+n[2]+'.'+n[3]+n[4]+n[5]+'.'+n[6]+n[7]+n[8]+'-'+d1+d2;return options.formatted?cpf:cpf.replace(/\D/g,'');};// CNPJ: ID to identify companies in Brazil
Chance.prototype.cnpj=function(options){options=initOptions(options,{formatted:true});var n=this.n(this.natural,12,{max:12});var d1=n[11]*2+n[10]*3+n[9]*4+n[8]*5+n[7]*6+n[6]*7+n[5]*8+n[4]*9+n[3]*2+n[2]*3+n[1]*4+n[0]*5;d1=11-d1%11;if(d1<2){d1=0;}var d2=d1*2+n[11]*3+n[10]*4+n[9]*5+n[8]*6+n[7]*7+n[6]*8+n[5]*9+n[4]*2+n[3]*3+n[2]*4+n[1]*5+n[0]*6;d2=11-d2%11;if(d2<2){d2=0;}var cnpj=''+n[0]+n[1]+'.'+n[2]+n[3]+n[4]+'.'+n[5]+n[6]+n[7]+'/'+n[8]+n[9]+n[10]+n[11]+'-'+d1+d2;return options.formatted?cnpj:cnpj.replace(/\D/g,'');};Chance.prototype.first=function(options){options=initOptions(options,{gender:this.gender(),nationality:'en'});return this.pick(this.get("firstNames")[options.gender.toLowerCase()][options.nationality.toLowerCase()]);};Chance.prototype.gender=function(options){options=initOptions(options,{extraGenders:[]});return this.pick(['Male','Female'].concat(options.extraGenders));};Chance.prototype.last=function(options){options=initOptions(options,{nationality:'en'});return this.pick(this.get("lastNames")[options.nationality.toLowerCase()]);};Chance.prototype.israelId=function(){var x=this.string({pool:'0123456789',length:8});var y=0;for(var i=0;i<x.length;i++){var thisDigit=x[i]*(i/2===parseInt(i/2)?1:2);thisDigit=this.pad(thisDigit,2).toString();thisDigit=parseInt(thisDigit[0])+parseInt(thisDigit[1]);y=y+thisDigit;}x=x+(10-parseInt(y.toString().slice(-1))).toString().slice(-1);return x;};Chance.prototype.mrz=function(options){var checkDigit=function checkDigit(input){var alpha="<ABCDEFGHIJKLMNOPQRSTUVWXYXZ".split(''),multipliers=[7,3,1],runningTotal=0;if(typeof input!=='string'){input=input.toString();}input.split('').forEach(function(character,idx){var pos=alpha.indexOf(character);if(pos!==-1){character=pos===0?0:pos+9;}else{character=parseInt(character,10);}character*=multipliers[idx%multipliers.length];runningTotal+=character;});return runningTotal%10;};var generate=function generate(opts){var pad=function pad(length){return new Array(length+1).join('<');};var number=['P<',opts.issuer,opts.last.toUpperCase(),'<<',opts.first.toUpperCase(),pad(39-(opts.last.length+opts.first.length+2)),opts.passportNumber,checkDigit(opts.passportNumber),opts.nationality,opts.dob,checkDigit(opts.dob),opts.gender,opts.expiry,checkDigit(opts.expiry),pad(14),checkDigit(pad(14))].join('');return number+checkDigit(number.substr(44,10)+number.substr(57,7)+number.substr(65,7));};var that=this;options=initOptions(options,{first:this.first(),last:this.last(),passportNumber:this.integer({min:100000000,max:999999999}),dob:function(){var date=that.birthday({type:'adult'});return[date.getFullYear().toString().substr(2),that.pad(date.getMonth()+1,2),that.pad(date.getDate(),2)].join('');}(),expiry:function(){var date=new Date();return[(date.getFullYear()+5).toString().substr(2),that.pad(date.getMonth()+1,2),that.pad(date.getDate(),2)].join('');}(),gender:this.gender()==='Female'?'F':'M',issuer:'GBR',nationality:'GBR'});return generate(options);};Chance.prototype.name=function(options){options=initOptions(options);var first=this.first(options),last=this.last(options),name;if(options.middle){name=first+' '+this.first(options)+' '+last;}else if(options.middle_initial){name=first+' '+this.character({alpha:true,casing:'upper'})+'. '+last;}else{name=first+' '+last;}if(options.prefix){name=this.prefix(options)+' '+name;}if(options.suffix){name=name+' '+this.suffix(options);}return name;};// Return the list of available name prefixes based on supplied gender.
// @todo introduce internationalization
Chance.prototype.name_prefixes=function(gender){gender=gender||"all";gender=gender.toLowerCase();var prefixes=[{name:'Doctor',abbreviation:'Dr.'}];if(gender==="male"||gender==="all"){prefixes.push({name:'Mister',abbreviation:'Mr.'});}if(gender==="female"||gender==="all"){prefixes.push({name:'Miss',abbreviation:'Miss'});prefixes.push({name:'Misses',abbreviation:'Mrs.'});}return prefixes;};// Alias for name_prefix
Chance.prototype.prefix=function(options){return this.name_prefix(options);};Chance.prototype.name_prefix=function(options){options=initOptions(options,{gender:"all"});return options.full?this.pick(this.name_prefixes(options.gender)).name:this.pick(this.name_prefixes(options.gender)).abbreviation;};//Hungarian ID number
Chance.prototype.HIDN=function(){//Hungarian ID nuber structure: XXXXXXYY (X=number,Y=Capital Latin letter)
var idn_pool="0123456789";var idn_chrs="ABCDEFGHIJKLMNOPQRSTUVWXYXZ";var idn="";idn+=this.string({pool:idn_pool,length:6});idn+=this.string({pool:idn_chrs,length:2});return idn;};Chance.prototype.ssn=function(options){options=initOptions(options,{ssnFour:false,dashes:true});var ssn_pool="1234567890",ssn,dash=options.dashes?'-':'';if(!options.ssnFour){ssn=this.string({pool:ssn_pool,length:3})+dash+this.string({pool:ssn_pool,length:2})+dash+this.string({pool:ssn_pool,length:4});}else{ssn=this.string({pool:ssn_pool,length:4});}return ssn;};// Return the list of available name suffixes
// @todo introduce internationalization
Chance.prototype.name_suffixes=function(){var suffixes=[{name:'Doctor of Osteopathic Medicine',abbreviation:'D.O.'},{name:'Doctor of Philosophy',abbreviation:'Ph.D.'},{name:'Esquire',abbreviation:'Esq.'},{name:'Junior',abbreviation:'Jr.'},{name:'Juris Doctor',abbreviation:'J.D.'},{name:'Master of Arts',abbreviation:'M.A.'},{name:'Master of Business Administration',abbreviation:'M.B.A.'},{name:'Master of Science',abbreviation:'M.S.'},{name:'Medical Doctor',abbreviation:'M.D.'},{name:'Senior',abbreviation:'Sr.'},{name:'The Third',abbreviation:'III'},{name:'The Fourth',abbreviation:'IV'},{name:'Bachelor of Engineering',abbreviation:'B.E'},{name:'Bachelor of Technology',abbreviation:'B.TECH'}];return suffixes;};// Alias for name_suffix
Chance.prototype.suffix=function(options){return this.name_suffix(options);};Chance.prototype.name_suffix=function(options){options=initOptions(options);return options.full?this.pick(this.name_suffixes()).name:this.pick(this.name_suffixes()).abbreviation;};Chance.prototype.nationalities=function(){return this.get("nationalities");};// Generate random nationality based on json list
Chance.prototype.nationality=function(){var nationality=this.pick(this.nationalities());return nationality.name;};// -- End Person --
// -- Mobile --
// Android GCM Registration ID
Chance.prototype.android_id=function(){return"APA91"+this.string({pool:"0123456789abcefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_",length:178});};// Apple Push Token
Chance.prototype.apple_token=function(){return this.string({pool:"abcdef1234567890",length:64});};// Windows Phone 8 ANID2
Chance.prototype.wp8_anid2=function(){return base64(this.hash({length:32}));};// Windows Phone 7 ANID
Chance.prototype.wp7_anid=function(){return'A='+this.guid().replace(/-/g,'').toUpperCase()+'&E='+this.hash({length:3})+'&W='+this.integer({min:0,max:9});};// BlackBerry Device PIN
Chance.prototype.bb_pin=function(){return this.hash({length:8});};// -- End Mobile --
// -- Web --
Chance.prototype.avatar=function(options){var url=null;var URL_BASE='//www.gravatar.com/avatar/';var PROTOCOLS={http:'http',https:'https'};var FILE_TYPES={bmp:'bmp',gif:'gif',jpg:'jpg',png:'png'};var FALLBACKS={'404':'404',mm:'mm',identicon:'identicon',monsterid:'monsterid',wavatar:'wavatar',retro:'retro',blank:'blank'// A transparent png
};var RATINGS={g:'g',pg:'pg',r:'r',x:'x'};var opts={protocol:null,email:null,fileExtension:null,size:null,fallback:null,rating:null};if(!options){// Set to a random email
opts.email=this.email();options={};}else if(typeof options==='string'){opts.email=options;options={};}else if((typeof options==='undefined'?'undefined':_typeof(options))!=='object'){return null;}else if(options.constructor==='Array'){return null;}opts=initOptions(options,opts);if(!opts.email){// Set to a random email
opts.email=this.email();}// Safe checking for params
opts.protocol=PROTOCOLS[opts.protocol]?opts.protocol+':':'';opts.size=parseInt(opts.size,0)?opts.size:'';opts.rating=RATINGS[opts.rating]?opts.rating:'';opts.fallback=FALLBACKS[opts.fallback]?opts.fallback:'';opts.fileExtension=FILE_TYPES[opts.fileExtension]?opts.fileExtension:'';url=opts.protocol+URL_BASE+this.bimd5.md5(opts.email)+(opts.fileExtension?'.'+opts.fileExtension:'')+(opts.size||opts.rating||opts.fallback?'?':'')+(opts.size?'&s='+opts.size.toString():'')+(opts.rating?'&r='+opts.rating:'')+(opts.fallback?'&d='+opts.fallback:'');return url;};/**
     * #Description:
     * ===============================================
     * Generate random color value base on color type:
     * -> hex
     * -> rgb
     * -> rgba
     * -> 0x
     * -> named color
     *
     * #Examples:
     * ===============================================
     * * Geerate random hex color
     * chance.color() => '#79c157' / 'rgb(110,52,164)' / '0x67ae0b' / '#e2e2e2' / '#29CFA7'
     *
     * * Generate Hex based color value
     * chance.color({format: 'hex'})    => '#d67118'
     *
     * * Generate simple rgb value
     * chance.color({format: 'rgb'})    => 'rgb(110,52,164)'
     *
     * * Generate Ox based color value
     * chance.color({format: '0x'})     => '0x67ae0b'
     *
     * * Generate graiscale based value
     * chance.color({grayscale: true})  => '#e2e2e2'
     *
     * * Return valide color name
     * chance.color({format: 'name'})   => 'red'
     *
     * * Make color uppercase
     * chance.color({casing: 'upper'})  => '#29CFA7'

     * * Min Max values for RGBA
     * var light_red = chance.color({format: 'hex', min_red: 200, max_red: 255, max_green: 0, max_blue: 0, min_alpha: .2, max_alpha: .3});
     *
     * @param  [object] options
     * @return [string] color value
     */Chance.prototype.color=function(options){function pad(n,width,z){z=z||'0';n=n+'';return n.length>=width?n:new Array(width-n.length+1).join(z)+n;}function gray(value,delimiter){return[value,value,value].join(delimiter||'');}function rgb(hasAlpha){var rgbValue=hasAlpha?'rgba':'rgb';var alphaChannel=hasAlpha?','+this.floating({min:min_alpha,max:max_alpha}):"";var colorValue=isGrayscale?gray(this.natural({min:min_rgb,max:max_rgb}),','):this.natural({min:min_green,max:max_green})+','+this.natural({min:min_blue,max:max_blue})+','+this.natural({max:255});return rgbValue+'('+colorValue+alphaChannel+')';}function hex(start,end,withHash){var symbol=withHash?"#":"";var hexstring="";if(isGrayscale){hexstring=gray(pad(this.hex({min:min_rgb,max:max_rgb}),2));if(options.format==="shorthex"){hexstring=gray(this.hex({min:0,max:15}));console.log("hex: "+hexstring);}}else{if(options.format==="shorthex"){hexstring=pad(this.hex({min:Math.floor(min_red/16),max:Math.floor(max_red/16)}),1)+pad(this.hex({min:Math.floor(min_green/16),max:Math.floor(max_green/16)}),1)+pad(this.hex({min:Math.floor(min_blue/16),max:Math.floor(max_blue/16)}),1);}else if(min_red!==undefined||max_red!==undefined||min_green!==undefined||max_green!==undefined||min_blue!==undefined||max_blue!==undefined){hexstring=pad(this.hex({min:min_red,max:max_red}),2)+pad(this.hex({min:min_green,max:max_green}),2)+pad(this.hex({min:min_blue,max:max_blue}),2);}else{hexstring=pad(this.hex({min:min_rgb,max:max_rgb}),2)+pad(this.hex({min:min_rgb,max:max_rgb}),2)+pad(this.hex({min:min_rgb,max:max_rgb}),2);}}return symbol+hexstring;}options=initOptions(options,{format:this.pick(['hex','shorthex','rgb','rgba','0x','name']),grayscale:false,casing:'lower',min:0,max:255,min_red:undefined,max_red:undefined,min_green:undefined,max_green:undefined,min_blue:undefined,max_blue:undefined,min_alpha:0,max_alpha:1});var isGrayscale=options.grayscale;var min_rgb=options.min;var max_rgb=options.max;var min_red=options.min_red;var max_red=options.max_red;var min_green=options.min_green;var max_green=options.max_green;var min_blue=options.min_blue;var max_blue=options.max_blue;var min_alpha=options.min_alpha;var max_alpha=options.max_alpha;if(options.min_red===undefined){min_red=min_rgb;}if(options.max_red===undefined){max_red=max_rgb;}if(options.min_green===undefined){min_green=min_rgb;}if(options.max_green===undefined){max_green=max_rgb;}if(options.min_blue===undefined){min_blue=min_rgb;}if(options.max_blue===undefined){max_blue=max_rgb;}if(options.min_alpha===undefined){min_alpha=0;}if(options.max_alpha===undefined){max_alpha=1;}if(isGrayscale&&min_rgb===0&&max_rgb===255&&min_red!==undefined&&max_red!==undefined){min_rgb=(min_red+min_green+min_blue)/3;max_rgb=(max_red+max_green+max_blue)/3;}var colorValue;if(options.format==='hex'){colorValue=hex.call(this,2,6,true);}else if(options.format==='shorthex'){colorValue=hex.call(this,1,3,true);}else if(options.format==='rgb'){colorValue=rgb.call(this,false);}else if(options.format==='rgba'){colorValue=rgb.call(this,true);}else if(options.format==='0x'){colorValue='0x'+hex.call(this,2,6);}else if(options.format==='name'){return this.pick(this.get("colorNames"));}else{throw new RangeError('Invalid format provided. Please provide one of "hex", "shorthex", "rgb", "rgba", "0x" or "name".');}if(options.casing==='upper'){colorValue=colorValue.toUpperCase();}return colorValue;};Chance.prototype.domain=function(options){options=initOptions(options);return this.word()+'.'+(options.tld||this.tld());};Chance.prototype.email=function(options){options=initOptions(options);return this.word({length:options.length})+'@'+(options.domain||this.domain());};Chance.prototype.fbid=function(){return parseInt('10000'+this.natural({max:100000000000}),10);};Chance.prototype.google_analytics=function(){var account=this.pad(this.natural({max:999999}),6);var property=this.pad(this.natural({max:99}),2);return'UA-'+account+'-'+property;};Chance.prototype.hashtag=function(){return'#'+this.word();};Chance.prototype.ip=function(){// Todo: This could return some reserved IPs. See http://vq.io/137dgYy
// this should probably be updated to account for that rare as it may be
return this.natural({min:1,max:254})+'.'+this.natural({max:255})+'.'+this.natural({max:255})+'.'+this.natural({min:1,max:254});};Chance.prototype.ipv6=function(){var ip_addr=this.n(this.hash,8,{length:4});return ip_addr.join(":");};Chance.prototype.klout=function(){return this.natural({min:1,max:99});};Chance.prototype.semver=function(options){options=initOptions(options,{include_prerelease:true});var range=this.pickone(["^","~","<",">","<=",">=","="]);if(options.range){range=options.range;}var prerelease="";if(options.include_prerelease){prerelease=this.weighted(["","-dev","-beta","-alpha"],[50,10,5,1]);}return range+this.rpg('3d10').join('.')+prerelease;};Chance.prototype.tlds=function(){return['com','org','edu','gov','co.uk','net','io','ac','ad','ae','af','ag','ai','al','am','an','ao','aq','ar','as','at','au','aw','ax','az','ba','bb','bd','be','bf','bg','bh','bi','bj','bm','bn','bo','bq','br','bs','bt','bv','bw','by','bz','ca','cc','cd','cf','cg','ch','ci','ck','cl','cm','cn','co','cr','cu','cv','cw','cx','cy','cz','de','dj','dk','dm','do','dz','ec','ee','eg','eh','er','es','et','eu','fi','fj','fk','fm','fo','fr','ga','gb','gd','ge','gf','gg','gh','gi','gl','gm','gn','gp','gq','gr','gs','gt','gu','gw','gy','hk','hm','hn','hr','ht','hu','id','ie','il','im','in','io','iq','ir','is','it','je','jm','jo','jp','ke','kg','kh','ki','km','kn','kp','kr','kw','ky','kz','la','lb','lc','li','lk','lr','ls','lt','lu','lv','ly','ma','mc','md','me','mg','mh','mk','ml','mm','mn','mo','mp','mq','mr','ms','mt','mu','mv','mw','mx','my','mz','na','nc','ne','nf','ng','ni','nl','no','np','nr','nu','nz','om','pa','pe','pf','pg','ph','pk','pl','pm','pn','pr','ps','pt','pw','py','qa','re','ro','rs','ru','rw','sa','sb','sc','sd','se','sg','sh','si','sj','sk','sl','sm','sn','so','sr','ss','st','su','sv','sx','sy','sz','tc','td','tf','tg','th','tj','tk','tl','tm','tn','to','tp','tr','tt','tv','tw','tz','ua','ug','uk','us','uy','uz','va','vc','ve','vg','vi','vn','vu','wf','ws','ye','yt','za','zm','zw'];};Chance.prototype.tld=function(){return this.pick(this.tlds());};Chance.prototype.twitter=function(){return'@'+this.word();};Chance.prototype.url=function(options){options=initOptions(options,{protocol:"http",domain:this.domain(options),domain_prefix:"",path:this.word(),extensions:[]});var extension=options.extensions.length>0?"."+this.pick(options.extensions):"";var domain=options.domain_prefix?options.domain_prefix+"."+options.domain:options.domain;return options.protocol+"://"+domain+"/"+options.path+extension;};Chance.prototype.port=function(){return this.integer({min:0,max:65535});};// -- End Web --
// -- Location --
Chance.prototype.address=function(options){options=initOptions(options);return this.natural({min:5,max:2000})+' '+this.street(options);};Chance.prototype.altitude=function(options){options=initOptions(options,{fixed:5,min:0,max:8848});return this.floating({min:options.min,max:options.max,fixed:options.fixed});};Chance.prototype.areacode=function(options){options=initOptions(options,{parens:true});// Don't want area codes to start with 1, or have a 9 as the second digit
var areacode=this.natural({min:2,max:9}).toString()+this.natural({min:0,max:8}).toString()+this.natural({min:0,max:9}).toString();return options.parens?'('+areacode+')':areacode;};Chance.prototype.city=function(){return this.capitalize(this.word({syllables:3}));};Chance.prototype.coordinates=function(options){return this.latitude(options)+', '+this.longitude(options);};Chance.prototype.countries=function(){return this.get("countries");};Chance.prototype.country=function(options){options=initOptions(options);var country=this.pick(this.countries());return options.full?country.name:country.abbreviation;};Chance.prototype.depth=function(options){options=initOptions(options,{fixed:5,min:-10994,max:0});return this.floating({min:options.min,max:options.max,fixed:options.fixed});};Chance.prototype.geohash=function(options){options=initOptions(options,{length:7});return this.string({length:options.length,pool:'0123456789bcdefghjkmnpqrstuvwxyz'});};Chance.prototype.geojson=function(options){return this.latitude(options)+', '+this.longitude(options)+', '+this.altitude(options);};Chance.prototype.latitude=function(options){options=initOptions(options,{fixed:5,min:-90,max:90});return this.floating({min:options.min,max:options.max,fixed:options.fixed});};Chance.prototype.longitude=function(options){options=initOptions(options,{fixed:5,min:-180,max:180});return this.floating({min:options.min,max:options.max,fixed:options.fixed});};Chance.prototype.phone=function(options){var self=this,numPick,ukNum=function ukNum(parts){var section=[];//fills the section part of the phone number with random numbers.
parts.sections.forEach(function(n){section.push(self.string({pool:'0123456789',length:n}));});return parts.area+section.join(' ');};options=initOptions(options,{formatted:true,country:'us',mobile:false});if(!options.formatted){options.parens=false;}var phone;switch(options.country){case'fr':if(!options.mobile){numPick=this.pick([// Valid zone and département codes.
'01'+this.pick(['30','34','39','40','41','42','43','44','45','46','47','48','49','53','55','56','58','60','64','69','70','72','73','74','75','76','77','78','79','80','81','82','83'])+self.string({pool:'0123456789',length:6}),'02'+this.pick(['14','18','22','23','28','29','30','31','32','33','34','35','36','37','38','40','41','43','44','45','46','47','48','49','50','51','52','53','54','56','57','61','62','69','72','76','77','78','85','90','96','97','98','99'])+self.string({pool:'0123456789',length:6}),'03'+this.pick(['10','20','21','22','23','24','25','26','27','28','29','39','44','45','51','52','54','55','57','58','59','60','61','62','63','64','65','66','67','68','69','70','71','72','73','80','81','82','83','84','85','86','87','88','89','90'])+self.string({pool:'0123456789',length:6}),'04'+this.pick(['11','13','15','20','22','26','27','30','32','34','37','42','43','44','50','56','57','63','66','67','68','69','70','71','72','73','74','75','76','77','78','79','80','81','82','83','84','85','86','88','89','90','91','92','93','94','95','97','98'])+self.string({pool:'0123456789',length:6}),'05'+this.pick(['08','16','17','19','24','31','32','33','34','35','40','45','46','47','49','53','55','56','57','58','59','61','62','63','64','65','67','79','81','82','86','87','90','94'])+self.string({pool:'0123456789',length:6}),'09'+self.string({pool:'0123456789',length:8})]);phone=options.formatted?numPick.match(/../g).join(' '):numPick;}else{numPick=this.pick(['06','07'])+self.string({pool:'0123456789',length:8});phone=options.formatted?numPick.match(/../g).join(' '):numPick;}break;case'uk':if(!options.mobile){numPick=this.pick([//valid area codes of major cities/counties followed by random numbers in required format.
{area:'01'+this.character({pool:'234569'})+'1 ',sections:[3,4]},{area:'020 '+this.character({pool:'378'}),sections:[3,4]},{area:'023 '+this.character({pool:'89'}),sections:[3,4]},{area:'024 7',sections:[3,4]},{area:'028 '+this.pick(['25','28','37','71','82','90','92','95']),sections:[2,4]},{area:'012'+this.pick(['04','08','54','76','97','98'])+' ',sections:[6]},{area:'013'+this.pick(['63','64','84','86'])+' ',sections:[6]},{area:'014'+this.pick(['04','20','60','61','80','88'])+' ',sections:[6]},{area:'015'+this.pick(['24','27','62','66'])+' ',sections:[6]},{area:'016'+this.pick(['06','29','35','47','59','95'])+' ',sections:[6]},{area:'017'+this.pick(['26','44','50','68'])+' ',sections:[6]},{area:'018'+this.pick(['27','37','84','97'])+' ',sections:[6]},{area:'019'+this.pick(['00','05','35','46','49','63','95'])+' ',sections:[6]}]);phone=options.formatted?ukNum(numPick):ukNum(numPick).replace(' ','','g');}else{numPick=this.pick([{area:'07'+this.pick(['4','5','7','8','9']),sections:[2,6]},{area:'07624 ',sections:[6]}]);phone=options.formatted?ukNum(numPick):ukNum(numPick).replace(' ','');}break;case'za':if(!options.mobile){numPick=this.pick(['01'+this.pick(['0','1','2','3','4','5','6','7','8'])+self.string({pool:'0123456789',length:7}),'02'+this.pick(['1','2','3','4','7','8'])+self.string({pool:'0123456789',length:7}),'03'+this.pick(['1','2','3','5','6','9'])+self.string({pool:'0123456789',length:7}),'04'+this.pick(['1','2','3','4','5','6','7','8','9'])+self.string({pool:'0123456789',length:7}),'05'+this.pick(['1','3','4','6','7','8'])+self.string({pool:'0123456789',length:7})]);phone=options.formatted||numPick;}else{numPick=this.pick(['060'+this.pick(['3','4','5','6','7','8','9'])+self.string({pool:'0123456789',length:6}),'061'+this.pick(['0','1','2','3','4','5','8'])+self.string({pool:'0123456789',length:6}),'06'+self.string({pool:'0123456789',length:7}),'071'+this.pick(['0','1','2','3','4','5','6','7','8','9'])+self.string({pool:'0123456789',length:6}),'07'+this.pick(['2','3','4','6','7','8','9'])+self.string({pool:'0123456789',length:7}),'08'+this.pick(['0','1','2','3','4','5'])+self.string({pool:'0123456789',length:7})]);phone=options.formatted||numPick;}break;case'us':var areacode=this.areacode(options).toString();var exchange=this.natural({min:2,max:9}).toString()+this.natural({min:0,max:9}).toString()+this.natural({min:0,max:9}).toString();var subscriber=this.natural({min:1000,max:9999}).toString();// this could be random [0-9]{4}
phone=options.formatted?areacode+' '+exchange+'-'+subscriber:areacode+exchange+subscriber;}return phone;};Chance.prototype.postal=function(){// Postal District
var pd=this.character({pool:"XVTSRPNKLMHJGECBA"});// Forward Sortation Area (FSA)
var fsa=pd+this.natural({max:9})+this.character({alpha:true,casing:"upper"});// Local Delivery Unut (LDU)
var ldu=this.natural({max:9})+this.character({alpha:true,casing:"upper"})+this.natural({max:9});return fsa+" "+ldu;};Chance.prototype.counties=function(options){options=initOptions(options,{country:'uk'});return this.get("counties")[options.country.toLowerCase()];};Chance.prototype.county=function(options){return this.pick(this.counties(options)).name;};Chance.prototype.provinces=function(options){options=initOptions(options,{country:'ca'});return this.get("provinces")[options.country.toLowerCase()];};Chance.prototype.province=function(options){return options&&options.full?this.pick(this.provinces(options)).name:this.pick(this.provinces(options)).abbreviation;};Chance.prototype.state=function(options){return options&&options.full?this.pick(this.states(options)).name:this.pick(this.states(options)).abbreviation;};Chance.prototype.states=function(options){options=initOptions(options,{country:'us',us_states_and_dc:true});var states;switch(options.country.toLowerCase()){case'us':var us_states_and_dc=this.get("us_states_and_dc"),territories=this.get("territories"),armed_forces=this.get("armed_forces");states=[];if(options.us_states_and_dc){states=states.concat(us_states_and_dc);}if(options.territories){states=states.concat(territories);}if(options.armed_forces){states=states.concat(armed_forces);}break;case'it':states=this.get("country_regions")[options.country.toLowerCase()];break;case'uk':states=this.get("counties")[options.country.toLowerCase()];break;}return states;};Chance.prototype.street=function(options){options=initOptions(options,{country:'us',syllables:2});var street;switch(options.country.toLowerCase()){case'us':street=this.word({syllables:options.syllables});street=this.capitalize(street);street+=' ';street+=options.short_suffix?this.street_suffix(options).abbreviation:this.street_suffix(options).name;break;case'it':street=this.word({syllables:options.syllables});street=this.capitalize(street);street=(options.short_suffix?this.street_suffix(options).abbreviation:this.street_suffix(options).name)+" "+street;break;}return street;};Chance.prototype.street_suffix=function(options){options=initOptions(options,{country:'us'});return this.pick(this.street_suffixes(options));};Chance.prototype.street_suffixes=function(options){options=initOptions(options,{country:'us'});// These are the most common suffixes.
return this.get("street_suffixes")[options.country.toLowerCase()];};// Note: only returning US zip codes, internationalization will be a whole
// other beast to tackle at some point.
Chance.prototype.zip=function(options){var zip=this.n(this.natural,5,{max:9});if(options&&options.plusfour===true){zip.push('-');zip=zip.concat(this.n(this.natural,4,{max:9}));}return zip.join("");};// -- End Location --
// -- Time
Chance.prototype.ampm=function(){return this.bool()?'am':'pm';};Chance.prototype.date=function(options){var date_string,date;// If interval is specified we ignore preset
if(options&&(options.min||options.max)){options=initOptions(options,{american:true,string:false});var min=typeof options.min!=="undefined"?options.min.getTime():1;// 100,000,000 days measured relative to midnight at the beginning of 01 January, 1970 UTC. http://es5.github.io/#x15.9.1.1
var max=typeof options.max!=="undefined"?options.max.getTime():8640000000000000;date=new Date(this.integer({min:min,max:max}));}else{var m=this.month({raw:true});var daysInMonth=m.days;if(options&&options.month){// Mod 12 to allow months outside range of 0-11 (not encouraged, but also not prevented).
daysInMonth=this.get('months')[(options.month%12+12)%12].days;}options=initOptions(options,{year:parseInt(this.year(),10),// Necessary to subtract 1 because Date() 0-indexes month but not day or year
// for some reason.
month:m.numeric-1,day:this.natural({min:1,max:daysInMonth}),hour:this.hour({twentyfour:true}),minute:this.minute(),second:this.second(),millisecond:this.millisecond(),american:true,string:false});date=new Date(options.year,options.month,options.day,options.hour,options.minute,options.second,options.millisecond);}if(options.american){// Adding 1 to the month is necessary because Date() 0-indexes
// months but not day for some odd reason.
date_string=date.getMonth()+1+'/'+date.getDate()+'/'+date.getFullYear();}else{date_string=date.getDate()+'/'+(date.getMonth()+1)+'/'+date.getFullYear();}return options.string?date_string:date;};Chance.prototype.hammertime=function(options){return this.date(options).getTime();};Chance.prototype.hour=function(options){options=initOptions(options,{min:options&&options.twentyfour?0:1,max:options&&options.twentyfour?23:12});testRange(options.min<0,"Chance: Min cannot be less than 0.");testRange(options.twentyfour&&options.max>23,"Chance: Max cannot be greater than 23 for twentyfour option.");testRange(!options.twentyfour&&options.max>12,"Chance: Max cannot be greater than 12.");testRange(options.min>options.max,"Chance: Min cannot be greater than Max.");return this.natural({min:options.min,max:options.max});};Chance.prototype.millisecond=function(){return this.natural({max:999});};Chance.prototype.minute=Chance.prototype.second=function(options){options=initOptions(options,{min:0,max:59});testRange(options.min<0,"Chance: Min cannot be less than 0.");testRange(options.max>59,"Chance: Max cannot be greater than 59.");testRange(options.min>options.max,"Chance: Min cannot be greater than Max.");return this.natural({min:options.min,max:options.max});};Chance.prototype.month=function(options){options=initOptions(options,{min:1,max:12});testRange(options.min<1,"Chance: Min cannot be less than 1.");testRange(options.max>12,"Chance: Max cannot be greater than 12.");testRange(options.min>options.max,"Chance: Min cannot be greater than Max.");var month=this.pick(this.months().slice(options.min-1,options.max));return options.raw?month:month.name;};Chance.prototype.months=function(){return this.get("months");};Chance.prototype.second=function(){return this.natural({max:59});};Chance.prototype.timestamp=function(){return this.natural({min:1,max:parseInt(new Date().getTime()/1000,10)});};Chance.prototype.weekday=function(options){options=initOptions(options,{weekday_only:false});var weekdays=["Monday","Tuesday","Wednesday","Thursday","Friday"];if(!options.weekday_only){weekdays.push("Saturday");weekdays.push("Sunday");}return this.pickone(weekdays);};Chance.prototype.year=function(options){// Default to current year as min if none specified
options=initOptions(options,{min:new Date().getFullYear()});// Default to one century after current year as max if none specified
options.max=typeof options.max!=="undefined"?options.max:options.min+100;return this.natural(options).toString();};// -- End Time
// -- Finance --
Chance.prototype.cc=function(options){options=initOptions(options);var type,number,to_generate;type=options.type?this.cc_type({name:options.type,raw:true}):this.cc_type({raw:true});number=type.prefix.split("");to_generate=type.length-type.prefix.length-1;// Generates n - 1 digits
number=number.concat(this.n(this.integer,to_generate,{min:0,max:9}));// Generates the last digit according to Luhn algorithm
number.push(this.luhn_calculate(number.join("")));return number.join("");};Chance.prototype.cc_types=function(){// http://en.wikipedia.org/wiki/Bank_card_number#Issuer_identification_number_.28IIN.29
return this.get("cc_types");};Chance.prototype.cc_type=function(options){options=initOptions(options);var types=this.cc_types(),type=null;if(options.name){for(var i=0;i<types.length;i++){// Accept either name or short_name to specify card type
if(types[i].name===options.name||types[i].short_name===options.name){type=types[i];break;}}if(type===null){throw new RangeError("Credit card type '"+options.name+"'' is not supported");}}else{type=this.pick(types);}return options.raw?type:type.name;};//return all world currency by ISO 4217
Chance.prototype.currency_types=function(){return this.get("currency_types");};//return random world currency by ISO 4217
Chance.prototype.currency=function(){return this.pick(this.currency_types());};//return all timezones availabel
Chance.prototype.timezones=function(){return this.get("timezones");};//return random timezone
Chance.prototype.timezone=function(){return this.pick(this.timezones());};//Return random correct currency exchange pair (e.g. EUR/USD) or array of currency code
Chance.prototype.currency_pair=function(returnAsString){var currencies=this.unique(this.currency,2,{comparator:function comparator(arr,val){return arr.reduce(function(acc,item){// If a match has been found, short circuit check and just return
return acc||item.code===val.code;},false);}});if(returnAsString){return currencies[0].code+'/'+currencies[1].code;}else{return currencies;}};Chance.prototype.dollar=function(options){// By default, a somewhat more sane max for dollar than all available numbers
options=initOptions(options,{max:10000,min:0});var dollar=this.floating({min:options.min,max:options.max,fixed:2}).toString(),cents=dollar.split('.')[1];if(cents===undefined){dollar+='.00';}else if(cents.length<2){dollar=dollar+'0';}if(dollar<0){return'-$'+dollar.replace('-','');}else{return'$'+dollar;}};Chance.prototype.euro=function(options){return Number(this.dollar(options).replace("$","")).toLocaleString()+"€";};Chance.prototype.exp=function(options){options=initOptions(options);var exp={};exp.year=this.exp_year();// If the year is this year, need to ensure month is greater than the
// current month or this expiration will not be valid
if(exp.year===new Date().getFullYear().toString()){exp.month=this.exp_month({future:true});}else{exp.month=this.exp_month();}return options.raw?exp:exp.month+'/'+exp.year;};Chance.prototype.exp_month=function(options){options=initOptions(options);var month,month_int,// Date object months are 0 indexed
curMonth=new Date().getMonth()+1;if(options.future&&curMonth!==12){do{month=this.month({raw:true}).numeric;month_int=parseInt(month,10);}while(month_int<=curMonth);}else{month=this.month({raw:true}).numeric;}return month;};Chance.prototype.exp_year=function(){var curMonth=new Date().getMonth()+1,curYear=new Date().getFullYear();return this.year({min:curMonth===12?curYear+1:curYear,max:curYear+10});};Chance.prototype.vat=function(options){options=initOptions(options,{country:'it'});switch(options.country.toLowerCase()){case'it':return this.it_vat();}};/**
     * Generate a string matching IBAN pattern (https://en.wikipedia.org/wiki/International_Bank_Account_Number).
     * No country-specific formats support (yet)
     */Chance.prototype.iban=function(){var alpha='ABCDEFGHIJKLMNOPQRSTUVWXYZ';var alphanum=alpha+'0123456789';var iban=this.string({length:2,pool:alpha})+this.pad(this.integer({min:0,max:99}),2)+this.string({length:4,pool:alphanum})+this.pad(this.natural(),this.natural({min:6,max:26}));return iban;};// -- End Finance
// -- Regional
Chance.prototype.it_vat=function(){var it_vat=this.natural({min:1,max:1800000});it_vat=this.pad(it_vat,7)+this.pad(this.pick(this.provinces({country:'it'})).code,3);return it_vat+this.luhn_calculate(it_vat);};/*
     * this generator is written following the official algorithm
     * all data can be passed explicitely or randomized by calling chance.cf() without options
     * the code does not check that the input data is valid (it goes beyond the scope of the generator)
     *
     * @param  [Object] options = { first: first name,
     *                              last: last name,
     *                              gender: female|male,
                                    birthday: JavaScript date object,
                                    city: string(4), 1 letter + 3 numbers
                                   }
     * @return [string] codice fiscale
     *
    */Chance.prototype.cf=function(options){options=options||{};var gender=!!options.gender?options.gender:this.gender(),first=!!options.first?options.first:this.first({gender:gender,nationality:'it'}),last=!!options.last?options.last:this.last({nationality:'it'}),birthday=!!options.birthday?options.birthday:this.birthday(),city=!!options.city?options.city:this.pickone(['A','B','C','D','E','F','G','H','I','L','M','Z'])+this.pad(this.natural({max:999}),3),cf=[],name_generator=function name_generator(name,isLast){var temp,return_value=[];if(name.length<3){return_value=name.split("").concat("XXX".split("")).splice(0,3);}else{temp=name.toUpperCase().split('').map(function(c){return"BCDFGHJKLMNPRSTVWZ".indexOf(c)!==-1?c:undefined;}).join('');if(temp.length>3){if(isLast){temp=temp.substr(0,3);}else{temp=temp[0]+temp.substr(2,2);}}if(temp.length<3){return_value=temp;temp=name.toUpperCase().split('').map(function(c){return"AEIOU".indexOf(c)!==-1?c:undefined;}).join('').substr(0,3-return_value.length);}return_value=return_value+temp;}return return_value;},date_generator=function date_generator(birthday,gender,that){var lettermonths=['A','B','C','D','E','H','L','M','P','R','S','T'];return birthday.getFullYear().toString().substr(2)+lettermonths[birthday.getMonth()]+that.pad(birthday.getDate()+(gender.toLowerCase()==="female"?40:0),2);},checkdigit_generator=function checkdigit_generator(cf){var range1="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",range2="ABCDEFGHIJABCDEFGHIJKLMNOPQRSTUVWXYZ",evens="ABCDEFGHIJKLMNOPQRSTUVWXYZ",odds="BAKPLCQDREVOSFTGUHMINJWZYX",digit=0;for(var i=0;i<15;i++){if(i%2!==0){digit+=evens.indexOf(range2[range1.indexOf(cf[i])]);}else{digit+=odds.indexOf(range2[range1.indexOf(cf[i])]);}}return evens[digit%26];};cf=cf.concat(name_generator(last,true),name_generator(first),date_generator(birthday,gender,this),city.toUpperCase().split("")).join("");cf+=checkdigit_generator(cf.toUpperCase(),this);return cf.toUpperCase();};Chance.prototype.pl_pesel=function(){var number=this.natural({min:1,max:9999999999});var arr=this.pad(number,10).split('');for(var i=0;i<arr.length;i++){arr[i]=parseInt(arr[i]);}var controlNumber=(1*arr[0]+3*arr[1]+7*arr[2]+9*arr[3]+1*arr[4]+3*arr[5]+7*arr[6]+9*arr[7]+1*arr[8]+3*arr[9])%10;if(controlNumber!==0){controlNumber=10-controlNumber;}return arr.join('')+controlNumber;};Chance.prototype.pl_nip=function(){var number=this.natural({min:1,max:999999999});var arr=this.pad(number,9).split('');for(var i=0;i<arr.length;i++){arr[i]=parseInt(arr[i]);}var controlNumber=(6*arr[0]+5*arr[1]+7*arr[2]+2*arr[3]+3*arr[4]+4*arr[5]+5*arr[6]+6*arr[7]+7*arr[8])%11;if(controlNumber===10){return this.pl_nip();}return arr.join('')+controlNumber;};Chance.prototype.pl_regon=function(){var number=this.natural({min:1,max:99999999});var arr=this.pad(number,8).split('');for(var i=0;i<arr.length;i++){arr[i]=parseInt(arr[i]);}var controlNumber=(8*arr[0]+9*arr[1]+2*arr[2]+3*arr[3]+4*arr[4]+5*arr[5]+6*arr[6]+7*arr[7])%11;if(controlNumber===10){controlNumber=0;}return arr.join('')+controlNumber;};// -- End Regional
// -- Miscellaneous --
// Dice - For all the board game geeks out there, myself included ;)
function diceFn(range){return function(){return this.natural(range);};}Chance.prototype.d4=diceFn({min:1,max:4});Chance.prototype.d6=diceFn({min:1,max:6});Chance.prototype.d8=diceFn({min:1,max:8});Chance.prototype.d10=diceFn({min:1,max:10});Chance.prototype.d12=diceFn({min:1,max:12});Chance.prototype.d20=diceFn({min:1,max:20});Chance.prototype.d30=diceFn({min:1,max:30});Chance.prototype.d100=diceFn({min:1,max:100});Chance.prototype.rpg=function(thrown,options){options=initOptions(options);if(!thrown){throw new RangeError("A type of die roll must be included");}else{var bits=thrown.toLowerCase().split("d"),rolls=[];if(bits.length!==2||!parseInt(bits[0],10)||!parseInt(bits[1],10)){throw new Error("Invalid format provided. Please provide #d# where the first # is the number of dice to roll, the second # is the max of each die");}for(var i=bits[0];i>0;i--){rolls[i-1]=this.natural({min:1,max:bits[1]});}return typeof options.sum!=='undefined'&&options.sum?rolls.reduce(function(p,c){return p+c;}):rolls;}};// Guid
Chance.prototype.guid=function(options){options=initOptions(options,{version:5});var guid_pool="abcdef1234567890",variant_pool="ab89",guid=this.string({pool:guid_pool,length:8})+'-'+this.string({pool:guid_pool,length:4})+'-'+// The Version
options.version+this.string({pool:guid_pool,length:3})+'-'+// The Variant
this.string({pool:variant_pool,length:1})+this.string({pool:guid_pool,length:3})+'-'+this.string({pool:guid_pool,length:12});return guid;};// Hash
Chance.prototype.hash=function(options){options=initOptions(options,{length:40,casing:'lower'});var pool=options.casing==='upper'?HEX_POOL.toUpperCase():HEX_POOL;return this.string({pool:pool,length:options.length});};Chance.prototype.luhn_check=function(num){var str=num.toString();var checkDigit=+str.substring(str.length-1);return checkDigit===this.luhn_calculate(+str.substring(0,str.length-1));};Chance.prototype.luhn_calculate=function(num){var digits=num.toString().split("").reverse();var sum=0;var digit;for(var i=0,l=digits.length;l>i;++i){digit=+digits[i];if(i%2===0){digit*=2;if(digit>9){digit-=9;}}sum+=digit;}return sum*9%10;};// MD5 Hash
Chance.prototype.md5=function(options){var opts={str:'',key:null,raw:false};if(!options){opts.str=this.string();options={};}else if(typeof options==='string'){opts.str=options;options={};}else if((typeof options==='undefined'?'undefined':_typeof(options))!=='object'){return null;}else if(options.constructor==='Array'){return null;}opts=initOptions(options,opts);if(!opts.str){throw new Error('A parameter is required to return an md5 hash.');}return this.bimd5.md5(opts.str,opts.key,opts.raw);};/**
     * #Description:
     * =====================================================
     * Generate random file name with extention
     *
     * The argument provide extention type
     * -> raster
     * -> vector
     * -> 3d
     * -> document
     *
     * If noting is provided the function return random file name with random
     * extention type of any kind
     *
     * The user can validate the file name length range
     * If noting provided the generated file name is radom
     *
     * #Extention Pool :
     * * Currently the supported extentions are
     *  -> some of the most popular raster image extentions
     *  -> some of the most popular vector image extentions
     *  -> some of the most popular 3d image extentions
     *  -> some of the most popular document extentions
     *
     * #Examples :
     * =====================================================
     *
     * Return random file name with random extention. The file extention
     * is provided by a predifined collection of extentions. More abouth the extention
     * pool can be fond in #Extention Pool section
     *
     * chance.file()
     * => dsfsdhjf.xml
     *
     * In order to generate a file name with sspecific length, specify the
     * length property and integer value. The extention is going to be random
     *
     * chance.file({length : 10})
     * => asrtineqos.pdf
     *
     * In order to geerate file with extention form some of the predifined groups
     * of the extention pool just specify the extenton pool category in fileType property
     *
     * chance.file({fileType : 'raster'})
     * => dshgssds.psd
     *
     * You can provide specific extention for your files
     * chance.file({extention : 'html'})
     * => djfsd.html
     *
     * Or you could pass custom collection of extentons bt array or by object
     * chance.file({extentions : [...]})
     * => dhgsdsd.psd
     *
     * chance.file({extentions : { key : [...], key : [...]}})
     * => djsfksdjsd.xml
     *
     * @param  [collection] options
     * @return [string]
     *
     */Chance.prototype.file=function(options){var fileOptions=options||{};var poolCollectionKey="fileExtension";var typeRange=Object.keys(this.get("fileExtension"));//['raster', 'vector', '3d', 'document'];
var fileName;var fileExtention;// Generate random file name
fileName=this.word({length:fileOptions.length});// Generate file by specific extention provided by the user
if(fileOptions.extention){fileExtention=fileOptions.extention;return fileName+'.'+fileExtention;}// Generate file by specific axtention collection
if(fileOptions.extentions){if(Array.isArray(fileOptions.extentions)){fileExtention=this.pickone(fileOptions.extentions);return fileName+'.'+fileExtention;}else if(fileOptions.extentions.constructor===Object){var extentionObjectCollection=fileOptions.extentions;var keys=Object.keys(extentionObjectCollection);fileExtention=this.pickone(extentionObjectCollection[this.pickone(keys)]);return fileName+'.'+fileExtention;}throw new Error("Expect collection of type Array or Object to be passed as an argument ");}// Generate file extention based on specific file type
if(fileOptions.fileType){var fileType=fileOptions.fileType;if(typeRange.indexOf(fileType)!==-1){fileExtention=this.pickone(this.get(poolCollectionKey)[fileType]);return fileName+'.'+fileExtention;}throw new Error("Expect file type value to be 'raster', 'vector', '3d' or 'document' ");}// Generate random file name if no extenton options are passed
fileExtention=this.pickone(this.get(poolCollectionKey)[this.pickone(typeRange)]);return fileName+'.'+fileExtention;};var data={firstNames:{"male":{"en":["James","John","Robert","Michael","William","David","Richard","Joseph","Charles","Thomas","Christopher","Daniel","Matthew","George","Donald","Anthony","Paul","Mark","Edward","Steven","Kenneth","Andrew","Brian","Joshua","Kevin","Ronald","Timothy","Jason","Jeffrey","Frank","Gary","Ryan","Nicholas","Eric","Stephen","Jacob","Larry","Jonathan","Scott","Raymond","Justin","Brandon","Gregory","Samuel","Benjamin","Patrick","Jack","Henry","Walter","Dennis","Jerry","Alexander","Peter","Tyler","Douglas","Harold","Aaron","Jose","Adam","Arthur","Zachary","Carl","Nathan","Albert","Kyle","Lawrence","Joe","Willie","Gerald","Roger","Keith","Jeremy","Terry","Harry","Ralph","Sean","Jesse","Roy","Louis","Billy","Austin","Bruce","Eugene","Christian","Bryan","Wayne","Russell","Howard","Fred","Ethan","Jordan","Philip","Alan","Juan","Randy","Vincent","Bobby","Dylan","Johnny","Phillip","Victor","Clarence","Ernest","Martin","Craig","Stanley","Shawn","Travis","Bradley","Leonard","Earl","Gabriel","Jimmy","Francis","Todd","Noah","Danny","Dale","Cody","Carlos","Allen","Frederick","Logan","Curtis","Alex","Joel","Luis","Norman","Marvin","Glenn","Tony","Nathaniel","Rodney","Melvin","Alfred","Steve","Cameron","Chad","Edwin","Caleb","Evan","Antonio","Lee","Herbert","Jeffery","Isaac","Derek","Ricky","Marcus","Theodore","Elijah","Luke","Jesus","Eddie","Troy","Mike","Dustin","Ray","Adrian","Bernard","Leroy","Angel","Randall","Wesley","Ian","Jared","Mason","Hunter","Calvin","Oscar","Clifford","Jay","Shane","Ronnie","Barry","Lucas","Corey","Manuel","Leo","Tommy","Warren","Jackson","Isaiah","Connor","Don","Dean","Jon","Julian","Miguel","Bill","Lloyd","Charlie","Mitchell","Leon","Jerome","Darrell","Jeremiah","Alvin","Brett","Seth","Floyd","Jim","Blake","Micheal","Gordon","Trevor","Lewis","Erik","Edgar","Vernon","Devin","Gavin","Jayden","Chris","Clyde","Tom","Derrick","Mario","Brent","Marc","Herman","Chase","Dominic","Ricardo","Franklin","Maurice","Max","Aiden","Owen","Lester","Gilbert","Elmer","Gene","Francisco","Glen","Cory","Garrett","Clayton","Sam","Jorge","Chester","Alejandro","Jeff","Harvey","Milton","Cole","Ivan","Andre","Duane","Landon"],// Data taken from http://www.dati.gov.it/dataset/comune-di-firenze_0163
"it":["Adolfo","Alberto","Aldo","Alessandro","Alessio","Alfredo","Alvaro","Andrea","Angelo","Angiolo","Antonino","Antonio","Attilio","Benito","Bernardo","Bruno","Carlo","Cesare","Christian","Claudio","Corrado","Cosimo","Cristian","Cristiano","Daniele","Dario","David","Davide","Diego","Dino","Domenico","Duccio","Edoardo","Elia","Elio","Emanuele","Emiliano","Emilio","Enrico","Enzo","Ettore","Fabio","Fabrizio","Federico","Ferdinando","Fernando","Filippo","Francesco","Franco","Gabriele","Giacomo","Giampaolo","Giampiero","Giancarlo","Gianfranco","Gianluca","Gianmarco","Gianni","Gino","Giorgio","Giovanni","Giuliano","Giulio","Giuseppe","Graziano","Gregorio","Guido","Iacopo","Jacopo","Lapo","Leonardo","Lorenzo","Luca","Luciano","Luigi","Manuel","Marcello","Marco","Marino","Mario","Massimiliano","Massimo","Matteo","Mattia","Maurizio","Mauro","Michele","Mirko","Mohamed","Nello","Neri","Niccolò","Nicola","Osvaldo","Otello","Paolo","Pier Luigi","Piero","Pietro","Raffaele","Remo","Renato","Renzo","Riccardo","Roberto","Rolando","Romano","Salvatore","Samuele","Sandro","Sergio","Silvano","Simone","Stefano","Thomas","Tommaso","Ubaldo","Ugo","Umberto","Valerio","Valter","Vasco","Vincenzo","Vittorio"]},"female":{"en":["Mary","Emma","Elizabeth","Minnie","Margaret","Ida","Alice","Bertha","Sarah","Annie","Clara","Ella","Florence","Cora","Martha","Laura","Nellie","Grace","Carrie","Maude","Mabel","Bessie","Jennie","Gertrude","Julia","Hattie","Edith","Mattie","Rose","Catherine","Lillian","Ada","Lillie","Helen","Jessie","Louise","Ethel","Lula","Myrtle","Eva","Frances","Lena","Lucy","Edna","Maggie","Pearl","Daisy","Fannie","Josephine","Dora","Rosa","Katherine","Agnes","Marie","Nora","May","Mamie","Blanche","Stella","Ellen","Nancy","Effie","Sallie","Nettie","Della","Lizzie","Flora","Susie","Maud","Mae","Etta","Harriet","Sadie","Caroline","Katie","Lydia","Elsie","Kate","Susan","Mollie","Alma","Addie","Georgia","Eliza","Lulu","Nannie","Lottie","Amanda","Belle","Charlotte","Rebecca","Ruth","Viola","Olive","Amelia","Hannah","Jane","Virginia","Emily","Matilda","Irene","Kathryn","Esther","Willie","Henrietta","Ollie","Amy","Rachel","Sara","Estella","Theresa","Augusta","Ora","Pauline","Josie","Lola","Sophia","Leona","Anne","Mildred","Ann","Beulah","Callie","Lou","Delia","Eleanor","Barbara","Iva","Louisa","Maria","Mayme","Evelyn","Estelle","Nina","Betty","Marion","Bettie","Dorothy","Luella","Inez","Lela","Rosie","Allie","Millie","Janie","Cornelia","Victoria","Ruby","Winifred","Alta","Celia","Christine","Beatrice","Birdie","Harriett","Mable","Myra","Sophie","Tillie","Isabel","Sylvia","Carolyn","Isabelle","Leila","Sally","Ina","Essie","Bertie","Nell","Alberta","Katharine","Lora","Rena","Mina","Rhoda","Mathilda","Abbie","Eula","Dollie","Hettie","Eunice","Fanny","Ola","Lenora","Adelaide","Christina","Lelia","Nelle","Sue","Johanna","Lilly","Lucinda","Minerva","Lettie","Roxie","Cynthia","Helena","Hilda","Hulda","Bernice","Genevieve","Jean","Cordelia","Marian","Francis","Jeanette","Adeline","Gussie","Leah","Lois","Lura","Mittie","Hallie","Isabella","Olga","Phoebe","Teresa","Hester","Lida","Lina","Winnie","Claudia","Marguerite","Vera","Cecelia","Bess","Emilie","Rosetta","Verna","Myrtie","Cecilia","Elva","Olivia","Ophelia","Georgie","Elnora","Violet","Adele","Lily","Linnie","Loretta","Madge","Polly","Virgie","Eugenia","Lucile","Lucille","Mabelle","Rosalie"],// Data taken from http://www.dati.gov.it/dataset/comune-di-firenze_0162
"it":["Ada","Adriana","Alessandra","Alessia","Alice","Angela","Anna","Anna Maria","Annalisa","Annita","Annunziata","Antonella","Arianna","Asia","Assunta","Aurora","Barbara","Beatrice","Benedetta","Bianca","Bruna","Camilla","Carla","Carlotta","Carmela","Carolina","Caterina","Catia","Cecilia","Chiara","Cinzia","Clara","Claudia","Costanza","Cristina","Daniela","Debora","Diletta","Dina","Donatella","Elena","Eleonora","Elisa","Elisabetta","Emanuela","Emma","Eva","Federica","Fernanda","Fiorella","Fiorenza","Flora","Franca","Francesca","Gabriella","Gaia","Gemma","Giada","Gianna","Gina","Ginevra","Giorgia","Giovanna","Giulia","Giuliana","Giuseppa","Giuseppina","Grazia","Graziella","Greta","Ida","Ilaria","Ines","Iolanda","Irene","Irma","Isabella","Jessica","Laura","Leda","Letizia","Licia","Lidia","Liliana","Lina","Linda","Lisa","Livia","Loretta","Luana","Lucia","Luciana","Lucrezia","Luisa","Manuela","Mara","Marcella","Margherita","Maria","Maria Cristina","Maria Grazia","Maria Luisa","Maria Pia","Maria Teresa","Marina","Marisa","Marta","Martina","Marzia","Matilde","Melissa","Michela","Milena","Mirella","Monica","Natalina","Nella","Nicoletta","Noemi","Olga","Paola","Patrizia","Piera","Pierina","Raffaella","Rebecca","Renata","Rina","Rita","Roberta","Rosa","Rosanna","Rossana","Rossella","Sabrina","Sandra","Sara","Serena","Silvana","Silvia","Simona","Simonetta","Sofia","Sonia","Stefania","Susanna","Teresa","Tina","Tiziana","Tosca","Valentina","Valeria","Vanda","Vanessa","Vanna","Vera","Veronica","Vilma","Viola","Virginia","Vittoria"]}},lastNames:{"en":['Smith','Johnson','Williams','Jones','Brown','Davis','Miller','Wilson','Moore','Taylor','Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Garcia','Martinez','Robinson','Clark','Rodriguez','Lewis','Lee','Walker','Hall','Allen','Young','Hernandez','King','Wright','Lopez','Hill','Scott','Green','Adams','Baker','Gonzalez','Nelson','Carter','Mitchell','Perez','Roberts','Turner','Phillips','Campbell','Parker','Evans','Edwards','Collins','Stewart','Sanchez','Morris','Rogers','Reed','Cook','Morgan','Bell','Murphy','Bailey','Rivera','Cooper','Richardson','Cox','Howard','Ward','Torres','Peterson','Gray','Ramirez','James','Watson','Brooks','Kelly','Sanders','Price','Bennett','Wood','Barnes','Ross','Henderson','Coleman','Jenkins','Perry','Powell','Long','Patterson','Hughes','Flores','Washington','Butler','Simmons','Foster','Gonzales','Bryant','Alexander','Russell','Griffin','Diaz','Hayes','Myers','Ford','Hamilton','Graham','Sullivan','Wallace','Woods','Cole','West','Jordan','Owens','Reynolds','Fisher','Ellis','Harrison','Gibson','McDonald','Cruz','Marshall','Ortiz','Gomez','Murray','Freeman','Wells','Webb','Simpson','Stevens','Tucker','Porter','Hunter','Hicks','Crawford','Henry','Boyd','Mason','Morales','Kennedy','Warren','Dixon','Ramos','Reyes','Burns','Gordon','Shaw','Holmes','Rice','Robertson','Hunt','Black','Daniels','Palmer','Mills','Nichols','Grant','Knight','Ferguson','Rose','Stone','Hawkins','Dunn','Perkins','Hudson','Spencer','Gardner','Stephens','Payne','Pierce','Berry','Matthews','Arnold','Wagner','Willis','Ray','Watkins','Olson','Carroll','Duncan','Snyder','Hart','Cunningham','Bradley','Lane','Andrews','Ruiz','Harper','Fox','Riley','Armstrong','Carpenter','Weaver','Greene','Lawrence','Elliott','Chavez','Sims','Austin','Peters','Kelley','Franklin','Lawson','Fields','Gutierrez','Ryan','Schmidt','Carr','Vasquez','Castillo','Wheeler','Chapman','Oliver','Montgomery','Richards','Williamson','Johnston','Banks','Meyer','Bishop','McCoy','Howell','Alvarez','Morrison','Hansen','Fernandez','Garza','Harvey','Little','Burton','Stanley','Nguyen','George','Jacobs','Reid','Kim','Fuller','Lynch','Dean','Gilbert','Garrett','Romero','Welch','Larson','Frazier','Burke','Hanson','Day','Mendoza','Moreno','Bowman','Medina','Fowler','Brewer','Hoffman','Carlson','Silva','Pearson','Holland','Douglas','Fleming','Jensen','Vargas','Byrd','Davidson','Hopkins','May','Terry','Herrera','Wade','Soto','Walters','Curtis','Neal','Caldwell','Lowe','Jennings','Barnett','Graves','Jimenez','Horton','Shelton','Barrett','Obrien','Castro','Sutton','Gregory','McKinney','Lucas','Miles','Craig','Rodriquez','Chambers','Holt','Lambert','Fletcher','Watts','Bates','Hale','Rhodes','Pena','Beck','Newman','Haynes','McDaniel','Mendez','Bush','Vaughn','Parks','Dawson','Santiago','Norris','Hardy','Love','Steele','Curry','Powers','Schultz','Barker','Guzman','Page','Munoz','Ball','Keller','Chandler','Weber','Leonard','Walsh','Lyons','Ramsey','Wolfe','Schneider','Mullins','Benson','Sharp','Bowen','Daniel','Barber','Cummings','Hines','Baldwin','Griffith','Valdez','Hubbard','Salazar','Reeves','Warner','Stevenson','Burgess','Santos','Tate','Cross','Garner','Mann','Mack','Moss','Thornton','Dennis','McGee','Farmer','Delgado','Aguilar','Vega','Glover','Manning','Cohen','Harmon','Rodgers','Robbins','Newton','Todd','Blair','Higgins','Ingram','Reese','Cannon','Strickland','Townsend','Potter','Goodwin','Walton','Rowe','Hampton','Ortega','Patton','Swanson','Joseph','Francis','Goodman','Maldonado','Yates','Becker','Erickson','Hodges','Rios','Conner','Adkins','Webster','Norman','Malone','Hammond','Flowers','Cobb','Moody','Quinn','Blake','Maxwell','Pope','Floyd','Osborne','Paul','McCarthy','Guerrero','Lindsey','Estrada','Sandoval','Gibbs','Tyler','Gross','Fitzgerald','Stokes','Doyle','Sherman','Saunders','Wise','Colon','Gill','Alvarado','Greer','Padilla','Simon','Waters','Nunez','Ballard','Schwartz','McBride','Houston','Christensen','Klein','Pratt','Briggs','Parsons','McLaughlin','Zimmerman','French','Buchanan','Moran','Copeland','Roy','Pittman','Brady','McCormick','Holloway','Brock','Poole','Frank','Logan','Owen','Bass','Marsh','Drake','Wong','Jefferson','Park','Morton','Abbott','Sparks','Patrick','Norton','Huff','Clayton','Massey','Lloyd','Figueroa','Carson','Bowers','Roberson','Barton','Tran','Lamb','Harrington','Casey','Boone','Cortez','Clarke','Mathis','Singleton','Wilkins','Cain','Bryan','Underwood','Hogan','McKenzie','Collier','Luna','Phelps','McGuire','Allison','Bridges','Wilkerson','Nash','Summers','Atkins'],// Data taken from http://www.dati.gov.it/dataset/comune-di-firenze_0164 (first 1000)
"it":["Acciai","Aglietti","Agostini","Agresti","Ahmed","Aiazzi","Albanese","Alberti","Alessi","Alfani","Alinari","Alterini","Amato","Ammannati","Ancillotti","Andrei","Andreini","Andreoni","Angeli","Anichini","Antonelli","Antonini","Arena","Ariani","Arnetoli","Arrighi","Baccani","Baccetti","Bacci","Bacherini","Badii","Baggiani","Baglioni","Bagni","Bagnoli","Baldassini","Baldi","Baldini","Ballerini","Balli","Ballini","Balloni","Bambi","Banchi","Bandinelli","Bandini","Bani","Barbetti","Barbieri","Barchielli","Bardazzi","Bardelli","Bardi","Barducci","Bargellini","Bargiacchi","Barni","Baroncelli","Baroncini","Barone","Baroni","Baronti","Bartalesi","Bartoletti","Bartoli","Bartolini","Bartoloni","Bartolozzi","Basagni","Basile","Bassi","Batacchi","Battaglia","Battaglini","Bausi","Becagli","Becattini","Becchi","Becucci","Bellandi","Bellesi","Belli","Bellini","Bellucci","Bencini","Benedetti","Benelli","Beni","Benini","Bensi","Benucci","Benvenuti","Berlincioni","Bernacchioni","Bernardi","Bernardini","Berni","Bernini","Bertelli","Berti","Bertini","Bessi","Betti","Bettini","Biagi","Biagini","Biagioni","Biagiotti","Biancalani","Bianchi","Bianchini","Bianco","Biffoli","Bigazzi","Bigi","Biliotti","Billi","Binazzi","Bindi","Bini","Biondi","Bizzarri","Bocci","Bogani","Bolognesi","Bonaiuti","Bonanni","Bonciani","Boncinelli","Bondi","Bonechi","Bongini","Boni","Bonini","Borchi","Boretti","Borghi","Borghini","Borgioli","Borri","Borselli","Boschi","Bottai","Bracci","Braccini","Brandi","Braschi","Bravi","Brazzini","Breschi","Brilli","Brizzi","Brogelli","Brogi","Brogioni","Brunelli","Brunetti","Bruni","Bruno","Brunori","Bruschi","Bucci","Bucciarelli","Buccioni","Bucelli","Bulli","Burberi","Burchi","Burgassi","Burroni","Bussotti","Buti","Caciolli","Caiani","Calabrese","Calamai","Calamandrei","Caldini","Calo'","Calonaci","Calosi","Calvelli","Cambi","Camiciottoli","Cammelli","Cammilli","Campolmi","Cantini","Capanni","Capecchi","Caponi","Cappelletti","Cappelli","Cappellini","Cappugi","Capretti","Caputo","Carbone","Carboni","Cardini","Carlesi","Carletti","Carli","Caroti","Carotti","Carrai","Carraresi","Carta","Caruso","Casalini","Casati","Caselli","Casini","Castagnoli","Castellani","Castelli","Castellucci","Catalano","Catarzi","Catelani","Cavaciocchi","Cavallaro","Cavallini","Cavicchi","Cavini","Ceccarelli","Ceccatelli","Ceccherelli","Ceccherini","Cecchi","Cecchini","Cecconi","Cei","Cellai","Celli","Cellini","Cencetti","Ceni","Cenni","Cerbai","Cesari","Ceseri","Checcacci","Checchi","Checcucci","Cheli","Chellini","Chen","Cheng","Cherici","Cherubini","Chiaramonti","Chiarantini","Chiarelli","Chiari","Chiarini","Chiarugi","Chiavacci","Chiesi","Chimenti","Chini","Chirici","Chiti","Ciabatti","Ciampi","Cianchi","Cianfanelli","Cianferoni","Ciani","Ciapetti","Ciappi","Ciardi","Ciatti","Cicali","Ciccone","Cinelli","Cini","Ciobanu","Ciolli","Cioni","Cipriani","Cirillo","Cirri","Ciucchi","Ciuffi","Ciulli","Ciullini","Clemente","Cocchi","Cognome","Coli","Collini","Colombo","Colzi","Comparini","Conforti","Consigli","Conte","Conti","Contini","Coppini","Coppola","Corsi","Corsini","Corti","Cortini","Cosi","Costa","Costantini","Costantino","Cozzi","Cresci","Crescioli","Cresti","Crini","Curradi","D'Agostino","D'Alessandro","D'Amico","D'Angelo","Daddi","Dainelli","Dallai","Danti","Davitti","De Angelis","De Luca","De Marco","De Rosa","De Santis","De Simone","De Vita","Degl'Innocenti","Degli Innocenti","Dei","Del Lungo","Del Re","Di Marco","Di Stefano","Dini","Diop","Dobre","Dolfi","Donati","Dondoli","Dong","Donnini","Ducci","Dumitru","Ermini","Esposito","Evangelisti","Fabbri","Fabbrini","Fabbrizzi","Fabbroni","Fabbrucci","Fabiani","Facchini","Faggi","Fagioli","Failli","Faini","Falciani","Falcini","Falcone","Fallani","Falorni","Falsini","Falugiani","Fancelli","Fanelli","Fanetti","Fanfani","Fani","Fantappie'","Fantechi","Fanti","Fantini","Fantoni","Farina","Fattori","Favilli","Fedi","Fei","Ferrante","Ferrara","Ferrari","Ferraro","Ferretti","Ferri","Ferrini","Ferroni","Fiaschi","Fibbi","Fiesoli","Filippi","Filippini","Fini","Fioravanti","Fiore","Fiorentini","Fiorini","Fissi","Focardi","Foggi","Fontana","Fontanelli","Fontani","Forconi","Formigli","Forte","Forti","Fortini","Fossati","Fossi","Francalanci","Franceschi","Franceschini","Franchi","Franchini","Franci","Francini","Francioni","Franco","Frassineti","Frati","Fratini","Frilli","Frizzi","Frosali","Frosini","Frullini","Fusco","Fusi","Gabbrielli","Gabellini","Gagliardi","Galanti","Galardi","Galeotti","Galletti","Galli","Gallo","Gallori","Gambacciani","Gargani","Garofalo","Garuglieri","Gashi","Gasperini","Gatti","Gelli","Gensini","Gentile","Gentili","Geri","Gerini","Gheri","Ghini","Giachetti","Giachi","Giacomelli","Gianassi","Giani","Giannelli","Giannetti","Gianni","Giannini","Giannoni","Giannotti","Giannozzi","Gigli","Giordano","Giorgetti","Giorgi","Giovacchini","Giovannelli","Giovannetti","Giovannini","Giovannoni","Giuliani","Giunti","Giuntini","Giusti","Gonnelli","Goretti","Gori","Gradi","Gramigni","Grassi","Grasso","Graziani","Grazzini","Greco","Grifoni","Grillo","Grimaldi","Grossi","Gualtieri","Guarducci","Guarino","Guarnieri","Guasti","Guerra","Guerri","Guerrini","Guidi","Guidotti","He","Hoxha","Hu","Huang","Iandelli","Ignesti","Innocenti","Jin","La Rosa","Lai","Landi","Landini","Lanini","Lapi","Lapini","Lari","Lascialfari","Lastrucci","Latini","Lazzeri","Lazzerini","Lelli","Lenzi","Leonardi","Leoncini","Leone","Leoni","Lepri","Li","Liao","Lin","Linari","Lippi","Lisi","Livi","Lombardi","Lombardini","Lombardo","Longo","Lopez","Lorenzi","Lorenzini","Lorini","Lotti","Lu","Lucchesi","Lucherini","Lunghi","Lupi","Madiai","Maestrini","Maffei","Maggi","Maggini","Magherini","Magini","Magnani","Magnelli","Magni","Magnolfi","Magrini","Malavolti","Malevolti","Manca","Mancini","Manetti","Manfredi","Mangani","Mannelli","Manni","Mannini","Mannucci","Manuelli","Manzini","Marcelli","Marchese","Marchetti","Marchi","Marchiani","Marchionni","Marconi","Marcucci","Margheri","Mari","Mariani","Marilli","Marinai","Marinari","Marinelli","Marini","Marino","Mariotti","Marsili","Martelli","Martinelli","Martini","Martino","Marzi","Masi","Masini","Masoni","Massai","Materassi","Mattei","Matteini","Matteucci","Matteuzzi","Mattioli","Mattolini","Matucci","Mauro","Mazzanti","Mazzei","Mazzetti","Mazzi","Mazzini","Mazzocchi","Mazzoli","Mazzoni","Mazzuoli","Meacci","Mecocci","Meini","Melani","Mele","Meli","Mengoni","Menichetti","Meoni","Merlini","Messeri","Messina","Meucci","Miccinesi","Miceli","Micheli","Michelini","Michelozzi","Migliori","Migliorini","Milani","Miniati","Misuri","Monaco","Montagnani","Montagni","Montanari","Montelatici","Monti","Montigiani","Montini","Morandi","Morandini","Morelli","Moretti","Morganti","Mori","Morini","Moroni","Morozzi","Mugnai","Mugnaini","Mustafa","Naldi","Naldini","Nannelli","Nanni","Nannini","Nannucci","Nardi","Nardini","Nardoni","Natali","Ndiaye","Nencetti","Nencini","Nencioni","Neri","Nesi","Nesti","Niccolai","Niccoli","Niccolini","Nigi","Nistri","Nocentini","Noferini","Novelli","Nucci","Nuti","Nutini","Oliva","Olivieri","Olmi","Orlandi","Orlandini","Orlando","Orsini","Ortolani","Ottanelli","Pacciani","Pace","Paci","Pacini","Pagani","Pagano","Paggetti","Pagliai","Pagni","Pagnini","Paladini","Palagi","Palchetti","Palloni","Palmieri","Palumbo","Pampaloni","Pancani","Pandolfi","Pandolfini","Panerai","Panichi","Paoletti","Paoli","Paolini","Papi","Papini","Papucci","Parenti","Parigi","Parisi","Parri","Parrini","Pasquini","Passeri","Pecchioli","Pecorini","Pellegrini","Pepi","Perini","Perrone","Peruzzi","Pesci","Pestelli","Petri","Petrini","Petrucci","Pettini","Pezzati","Pezzatini","Piani","Piazza","Piazzesi","Piazzini","Piccardi","Picchi","Piccini","Piccioli","Pieraccini","Pieraccioni","Pieralli","Pierattini","Pieri","Pierini","Pieroni","Pietrini","Pini","Pinna","Pinto","Pinzani","Pinzauti","Piras","Pisani","Pistolesi","Poggesi","Poggi","Poggiali","Poggiolini","Poli","Pollastri","Porciani","Pozzi","Pratellesi","Pratesi","Prosperi","Pruneti","Pucci","Puccini","Puccioni","Pugi","Pugliese","Puliti","Querci","Quercioli","Raddi","Radu","Raffaelli","Ragazzini","Ranfagni","Ranieri","Rastrelli","Raugei","Raveggi","Renai","Renzi","Rettori","Ricci","Ricciardi","Ridi","Ridolfi","Rigacci","Righi","Righini","Rinaldi","Risaliti","Ristori","Rizzo","Rocchi","Rocchini","Rogai","Romagnoli","Romanelli","Romani","Romano","Romei","Romeo","Romiti","Romoli","Romolini","Rontini","Rosati","Roselli","Rosi","Rossetti","Rossi","Rossini","Rovai","Ruggeri","Ruggiero","Russo","Sabatini","Saccardi","Sacchetti","Sacchi","Sacco","Salerno","Salimbeni","Salucci","Salvadori","Salvestrini","Salvi","Salvini","Sanesi","Sani","Sanna","Santi","Santini","Santoni","Santoro","Santucci","Sardi","Sarri","Sarti","Sassi","Sbolci","Scali","Scarpelli","Scarselli","Scopetani","Secci","Selvi","Senatori","Senesi","Serafini","Sereni","Serra","Sestini","Sguanci","Sieni","Signorini","Silvestri","Simoncini","Simonetti","Simoni","Singh","Sodi","Soldi","Somigli","Sorbi","Sorelli","Sorrentino","Sottili","Spina","Spinelli","Staccioli","Staderini","Stefanelli","Stefani","Stefanini","Stella","Susini","Tacchi","Tacconi","Taddei","Tagliaferri","Tamburini","Tanganelli","Tani","Tanini","Tapinassi","Tarchi","Tarchiani","Targioni","Tassi","Tassini","Tempesti","Terzani","Tesi","Testa","Testi","Tilli","Tinti","Tirinnanzi","Toccafondi","Tofanari","Tofani","Tognaccini","Tonelli","Tonini","Torelli","Torrini","Tosi","Toti","Tozzi","Trambusti","Trapani","Tucci","Turchi","Ugolini","Ulivi","Valente","Valenti","Valentini","Vangelisti","Vanni","Vannini","Vannoni","Vannozzi","Vannucchi","Vannucci","Ventura","Venturi","Venturini","Vestri","Vettori","Vichi","Viciani","Vieri","Vigiani","Vignoli","Vignolini","Vignozzi","Villani","Vinci","Visani","Vitale","Vitali","Viti","Viviani","Vivoli","Volpe","Volpi","Wang","Wu","Xu","Yang","Ye","Zagli","Zani","Zanieri","Zanobini","Zecchi","Zetti","Zhang","Zheng","Zhou","Zhu","Zingoni","Zini","Zoppi"]},// Data taken from https://github.com/umpirsky/country-list/blob/master/data/en_US/country.json
countries:[{"name":"Afghanistan","abbreviation":"AF"},{"name":"Åland Islands","abbreviation":"AX"},{"name":"Albania","abbreviation":"AL"},{"name":"Algeria","abbreviation":"DZ"},{"name":"American Samoa","abbreviation":"AS"},{"name":"Andorra","abbreviation":"AD"},{"name":"Angola","abbreviation":"AO"},{"name":"Anguilla","abbreviation":"AI"},{"name":"Antarctica","abbreviation":"AQ"},{"name":"Antigua & Barbuda","abbreviation":"AG"},{"name":"Argentina","abbreviation":"AR"},{"name":"Armenia","abbreviation":"AM"},{"name":"Aruba","abbreviation":"AW"},{"name":"Ascension Island","abbreviation":"AC"},{"name":"Australia","abbreviation":"AU"},{"name":"Austria","abbreviation":"AT"},{"name":"Azerbaijan","abbreviation":"AZ"},{"name":"Bahamas","abbreviation":"BS"},{"name":"Bahrain","abbreviation":"BH"},{"name":"Bangladesh","abbreviation":"BD"},{"name":"Barbados","abbreviation":"BB"},{"name":"Belarus","abbreviation":"BY"},{"name":"Belgium","abbreviation":"BE"},{"name":"Belize","abbreviation":"BZ"},{"name":"Benin","abbreviation":"BJ"},{"name":"Bermuda","abbreviation":"BM"},{"name":"Bhutan","abbreviation":"BT"},{"name":"Bolivia","abbreviation":"BO"},{"name":"Bosnia & Herzegovina","abbreviation":"BA"},{"name":"Botswana","abbreviation":"BW"},{"name":"Brazil","abbreviation":"BR"},{"name":"British Indian Ocean Territory","abbreviation":"IO"},{"name":"British Virgin Islands","abbreviation":"VG"},{"name":"Brunei","abbreviation":"BN"},{"name":"Bulgaria","abbreviation":"BG"},{"name":"Burkina Faso","abbreviation":"BF"},{"name":"Burundi","abbreviation":"BI"},{"name":"Cambodia","abbreviation":"KH"},{"name":"Cameroon","abbreviation":"CM"},{"name":"Canada","abbreviation":"CA"},{"name":"Canary Islands","abbreviation":"IC"},{"name":"Cape Verde","abbreviation":"CV"},{"name":"Caribbean Netherlands","abbreviation":"BQ"},{"name":"Cayman Islands","abbreviation":"KY"},{"name":"Central African Republic","abbreviation":"CF"},{"name":"Ceuta & Melilla","abbreviation":"EA"},{"name":"Chad","abbreviation":"TD"},{"name":"Chile","abbreviation":"CL"},{"name":"China","abbreviation":"CN"},{"name":"Christmas Island","abbreviation":"CX"},{"name":"Cocos (Keeling) Islands","abbreviation":"CC"},{"name":"Colombia","abbreviation":"CO"},{"name":"Comoros","abbreviation":"KM"},{"name":"Congo - Brazzaville","abbreviation":"CG"},{"name":"Congo - Kinshasa","abbreviation":"CD"},{"name":"Cook Islands","abbreviation":"CK"},{"name":"Costa Rica","abbreviation":"CR"},{"name":"Côte d'Ivoire","abbreviation":"CI"},{"name":"Croatia","abbreviation":"HR"},{"name":"Cuba","abbreviation":"CU"},{"name":"Curaçao","abbreviation":"CW"},{"name":"Cyprus","abbreviation":"CY"},{"name":"Czech Republic","abbreviation":"CZ"},{"name":"Denmark","abbreviation":"DK"},{"name":"Diego Garcia","abbreviation":"DG"},{"name":"Djibouti","abbreviation":"DJ"},{"name":"Dominica","abbreviation":"DM"},{"name":"Dominican Republic","abbreviation":"DO"},{"name":"Ecuador","abbreviation":"EC"},{"name":"Egypt","abbreviation":"EG"},{"name":"El Salvador","abbreviation":"SV"},{"name":"Equatorial Guinea","abbreviation":"GQ"},{"name":"Eritrea","abbreviation":"ER"},{"name":"Estonia","abbreviation":"EE"},{"name":"Ethiopia","abbreviation":"ET"},{"name":"Falkland Islands","abbreviation":"FK"},{"name":"Faroe Islands","abbreviation":"FO"},{"name":"Fiji","abbreviation":"FJ"},{"name":"Finland","abbreviation":"FI"},{"name":"France","abbreviation":"FR"},{"name":"French Guiana","abbreviation":"GF"},{"name":"French Polynesia","abbreviation":"PF"},{"name":"French Southern Territories","abbreviation":"TF"},{"name":"Gabon","abbreviation":"GA"},{"name":"Gambia","abbreviation":"GM"},{"name":"Georgia","abbreviation":"GE"},{"name":"Germany","abbreviation":"DE"},{"name":"Ghana","abbreviation":"GH"},{"name":"Gibraltar","abbreviation":"GI"},{"name":"Greece","abbreviation":"GR"},{"name":"Greenland","abbreviation":"GL"},{"name":"Grenada","abbreviation":"GD"},{"name":"Guadeloupe","abbreviation":"GP"},{"name":"Guam","abbreviation":"GU"},{"name":"Guatemala","abbreviation":"GT"},{"name":"Guernsey","abbreviation":"GG"},{"name":"Guinea","abbreviation":"GN"},{"name":"Guinea-Bissau","abbreviation":"GW"},{"name":"Guyana","abbreviation":"GY"},{"name":"Haiti","abbreviation":"HT"},{"name":"Honduras","abbreviation":"HN"},{"name":"Hong Kong SAR China","abbreviation":"HK"},{"name":"Hungary","abbreviation":"HU"},{"name":"Iceland","abbreviation":"IS"},{"name":"India","abbreviation":"IN"},{"name":"Indonesia","abbreviation":"ID"},{"name":"Iran","abbreviation":"IR"},{"name":"Iraq","abbreviation":"IQ"},{"name":"Ireland","abbreviation":"IE"},{"name":"Isle of Man","abbreviation":"IM"},{"name":"Israel","abbreviation":"IL"},{"name":"Italy","abbreviation":"IT"},{"name":"Jamaica","abbreviation":"JM"},{"name":"Japan","abbreviation":"JP"},{"name":"Jersey","abbreviation":"JE"},{"name":"Jordan","abbreviation":"JO"},{"name":"Kazakhstan","abbreviation":"KZ"},{"name":"Kenya","abbreviation":"KE"},{"name":"Kiribati","abbreviation":"KI"},{"name":"Kosovo","abbreviation":"XK"},{"name":"Kuwait","abbreviation":"KW"},{"name":"Kyrgyzstan","abbreviation":"KG"},{"name":"Laos","abbreviation":"LA"},{"name":"Latvia","abbreviation":"LV"},{"name":"Lebanon","abbreviation":"LB"},{"name":"Lesotho","abbreviation":"LS"},{"name":"Liberia","abbreviation":"LR"},{"name":"Libya","abbreviation":"LY"},{"name":"Liechtenstein","abbreviation":"LI"},{"name":"Lithuania","abbreviation":"LT"},{"name":"Luxembourg","abbreviation":"LU"},{"name":"Macau SAR China","abbreviation":"MO"},{"name":"Macedonia","abbreviation":"MK"},{"name":"Madagascar","abbreviation":"MG"},{"name":"Malawi","abbreviation":"MW"},{"name":"Malaysia","abbreviation":"MY"},{"name":"Maldives","abbreviation":"MV"},{"name":"Mali","abbreviation":"ML"},{"name":"Malta","abbreviation":"MT"},{"name":"Marshall Islands","abbreviation":"MH"},{"name":"Martinique","abbreviation":"MQ"},{"name":"Mauritania","abbreviation":"MR"},{"name":"Mauritius","abbreviation":"MU"},{"name":"Mayotte","abbreviation":"YT"},{"name":"Mexico","abbreviation":"MX"},{"name":"Micronesia","abbreviation":"FM"},{"name":"Moldova","abbreviation":"MD"},{"name":"Monaco","abbreviation":"MC"},{"name":"Mongolia","abbreviation":"MN"},{"name":"Montenegro","abbreviation":"ME"},{"name":"Montserrat","abbreviation":"MS"},{"name":"Morocco","abbreviation":"MA"},{"name":"Mozambique","abbreviation":"MZ"},{"name":"Myanmar (Burma)","abbreviation":"MM"},{"name":"Namibia","abbreviation":"NA"},{"name":"Nauru","abbreviation":"NR"},{"name":"Nepal","abbreviation":"NP"},{"name":"Netherlands","abbreviation":"NL"},{"name":"New Caledonia","abbreviation":"NC"},{"name":"New Zealand","abbreviation":"NZ"},{"name":"Nicaragua","abbreviation":"NI"},{"name":"Niger","abbreviation":"NE"},{"name":"Nigeria","abbreviation":"NG"},{"name":"Niue","abbreviation":"NU"},{"name":"Norfolk Island","abbreviation":"NF"},{"name":"North Korea","abbreviation":"KP"},{"name":"Northern Mariana Islands","abbreviation":"MP"},{"name":"Norway","abbreviation":"NO"},{"name":"Oman","abbreviation":"OM"},{"name":"Pakistan","abbreviation":"PK"},{"name":"Palau","abbreviation":"PW"},{"name":"Palestinian Territories","abbreviation":"PS"},{"name":"Panama","abbreviation":"PA"},{"name":"Papua New Guinea","abbreviation":"PG"},{"name":"Paraguay","abbreviation":"PY"},{"name":"Peru","abbreviation":"PE"},{"name":"Philippines","abbreviation":"PH"},{"name":"Pitcairn Islands","abbreviation":"PN"},{"name":"Poland","abbreviation":"PL"},{"name":"Portugal","abbreviation":"PT"},{"name":"Puerto Rico","abbreviation":"PR"},{"name":"Qatar","abbreviation":"QA"},{"name":"Réunion","abbreviation":"RE"},{"name":"Romania","abbreviation":"RO"},{"name":"Russia","abbreviation":"RU"},{"name":"Rwanda","abbreviation":"RW"},{"name":"Samoa","abbreviation":"WS"},{"name":"San Marino","abbreviation":"SM"},{"name":"São Tomé and Príncipe","abbreviation":"ST"},{"name":"Saudi Arabia","abbreviation":"SA"},{"name":"Senegal","abbreviation":"SN"},{"name":"Serbia","abbreviation":"RS"},{"name":"Seychelles","abbreviation":"SC"},{"name":"Sierra Leone","abbreviation":"SL"},{"name":"Singapore","abbreviation":"SG"},{"name":"Sint Maarten","abbreviation":"SX"},{"name":"Slovakia","abbreviation":"SK"},{"name":"Slovenia","abbreviation":"SI"},{"name":"Solomon Islands","abbreviation":"SB"},{"name":"Somalia","abbreviation":"SO"},{"name":"South Africa","abbreviation":"ZA"},{"name":"South Georgia & South Sandwich Islands","abbreviation":"GS"},{"name":"South Korea","abbreviation":"KR"},{"name":"South Sudan","abbreviation":"SS"},{"name":"Spain","abbreviation":"ES"},{"name":"Sri Lanka","abbreviation":"LK"},{"name":"St. Barthélemy","abbreviation":"BL"},{"name":"St. Helena","abbreviation":"SH"},{"name":"St. Kitts & Nevis","abbreviation":"KN"},{"name":"St. Lucia","abbreviation":"LC"},{"name":"St. Martin","abbreviation":"MF"},{"name":"St. Pierre & Miquelon","abbreviation":"PM"},{"name":"St. Vincent & Grenadines","abbreviation":"VC"},{"name":"Sudan","abbreviation":"SD"},{"name":"Suriname","abbreviation":"SR"},{"name":"Svalbard & Jan Mayen","abbreviation":"SJ"},{"name":"Swaziland","abbreviation":"SZ"},{"name":"Sweden","abbreviation":"SE"},{"name":"Switzerland","abbreviation":"CH"},{"name":"Syria","abbreviation":"SY"},{"name":"Taiwan","abbreviation":"TW"},{"name":"Tajikistan","abbreviation":"TJ"},{"name":"Tanzania","abbreviation":"TZ"},{"name":"Thailand","abbreviation":"TH"},{"name":"Timor-Leste","abbreviation":"TL"},{"name":"Togo","abbreviation":"TG"},{"name":"Tokelau","abbreviation":"TK"},{"name":"Tonga","abbreviation":"TO"},{"name":"Trinidad & Tobago","abbreviation":"TT"},{"name":"Tristan da Cunha","abbreviation":"TA"},{"name":"Tunisia","abbreviation":"TN"},{"name":"Turkey","abbreviation":"TR"},{"name":"Turkmenistan","abbreviation":"TM"},{"name":"Turks & Caicos Islands","abbreviation":"TC"},{"name":"Tuvalu","abbreviation":"TV"},{"name":"U.S. Outlying Islands","abbreviation":"UM"},{"name":"U.S. Virgin Islands","abbreviation":"VI"},{"name":"Uganda","abbreviation":"UG"},{"name":"Ukraine","abbreviation":"UA"},{"name":"United Arab Emirates","abbreviation":"AE"},{"name":"United Kingdom","abbreviation":"GB"},{"name":"United States","abbreviation":"US"},{"name":"Uruguay","abbreviation":"UY"},{"name":"Uzbekistan","abbreviation":"UZ"},{"name":"Vanuatu","abbreviation":"VU"},{"name":"Vatican City","abbreviation":"VA"},{"name":"Venezuela","abbreviation":"VE"},{"name":"Vietnam","abbreviation":"VN"},{"name":"Wallis & Futuna","abbreviation":"WF"},{"name":"Western Sahara","abbreviation":"EH"},{"name":"Yemen","abbreviation":"YE"},{"name":"Zambia","abbreviation":"ZM"},{"name":"Zimbabwe","abbreviation":"ZW"}],counties:{// Data taken from http://www.downloadexcelfiles.com/gb_en/download-excel-file-list-counties-uk
"uk":[{name:'Bath and North East Somerset'},{name:'Aberdeenshire'},{name:'Anglesey'},{name:'Angus'},{name:'Bedford'},{name:'Blackburn with Darwen'},{name:'Blackpool'},{name:'Bournemouth'},{name:'Bracknell Forest'},{name:'Brighton & Hove'},{name:'Bristol'},{name:'Buckinghamshire'},{name:'Cambridgeshire'},{name:'Carmarthenshire'},{name:'Central Bedfordshire'},{name:'Ceredigion'},{name:'Cheshire East'},{name:'Cheshire West and Chester'},{name:'Clackmannanshire'},{name:'Conwy'},{name:'Cornwall'},{name:'County Antrim'},{name:'County Armagh'},{name:'County Down'},{name:'County Durham'},{name:'County Fermanagh'},{name:'County Londonderry'},{name:'County Tyrone'},{name:'Cumbria'},{name:'Darlington'},{name:'Denbighshire'},{name:'Derby'},{name:'Derbyshire'},{name:'Devon'},{name:'Dorset'},{name:'Dumfries and Galloway'},{name:'Dundee'},{name:'East Lothian'},{name:'East Riding of Yorkshire'},{name:'East Sussex'},{name:'Edinburgh?'},{name:'Essex'},{name:'Falkirk'},{name:'Fife'},{name:'Flintshire'},{name:'Gloucestershire'},{name:'Greater London'},{name:'Greater Manchester'},{name:'Gwent'},{name:'Gwynedd'},{name:'Halton'},{name:'Hampshire'},{name:'Hartlepool'},{name:'Herefordshire'},{name:'Hertfordshire'},{name:'Highlands'},{name:'Hull'},{name:'Isle of Wight'},{name:'Isles of Scilly'},{name:'Kent'},{name:'Lancashire'},{name:'Leicester'},{name:'Leicestershire'},{name:'Lincolnshire'},{name:'Lothian'},{name:'Luton'},{name:'Medway'},{name:'Merseyside'},{name:'Mid Glamorgan'},{name:'Middlesbrough'},{name:'Milton Keynes'},{name:'Monmouthshire'},{name:'Moray'},{name:'Norfolk'},{name:'North East Lincolnshire'},{name:'North Lincolnshire'},{name:'North Somerset'},{name:'North Yorkshire'},{name:'Northamptonshire'},{name:'Northumberland'},{name:'Nottingham'},{name:'Nottinghamshire'},{name:'Oxfordshire'},{name:'Pembrokeshire'},{name:'Perth and Kinross'},{name:'Peterborough'},{name:'Plymouth'},{name:'Poole'},{name:'Portsmouth'},{name:'Powys'},{name:'Reading'},{name:'Redcar and Cleveland'},{name:'Rutland'},{name:'Scottish Borders'},{name:'Shropshire'},{name:'Slough'},{name:'Somerset'},{name:'South Glamorgan'},{name:'South Gloucestershire'},{name:'South Yorkshire'},{name:'Southampton'},{name:'Southend-on-Sea'},{name:'Staffordshire'},{name:'Stirlingshire'},{name:'Stockton-on-Tees'},{name:'Stoke-on-Trent'},{name:'Strathclyde'},{name:'Suffolk'},{name:'Surrey'},{name:'Swindon'},{name:'Telford and Wrekin'},{name:'Thurrock'},{name:'Torbay'},{name:'Tyne and Wear'},{name:'Warrington'},{name:'Warwickshire'},{name:'West Berkshire'},{name:'West Glamorgan'},{name:'West Lothian'},{name:'West Midlands'},{name:'West Sussex'},{name:'West Yorkshire'},{name:'Western Isles'},{name:'Wiltshire'},{name:'Windsor and Maidenhead'},{name:'Wokingham'},{name:'Worcestershire'},{name:'Wrexham'},{name:'York'}]},provinces:{"ca":[{name:'Alberta',abbreviation:'AB'},{name:'British Columbia',abbreviation:'BC'},{name:'Manitoba',abbreviation:'MB'},{name:'New Brunswick',abbreviation:'NB'},{name:'Newfoundland and Labrador',abbreviation:'NL'},{name:'Nova Scotia',abbreviation:'NS'},{name:'Ontario',abbreviation:'ON'},{name:'Prince Edward Island',abbreviation:'PE'},{name:'Quebec',abbreviation:'QC'},{name:'Saskatchewan',abbreviation:'SK'},// The case could be made that the following are not actually provinces
// since they are technically considered "territories" however they all
// look the same on an envelope!
{name:'Northwest Territories',abbreviation:'NT'},{name:'Nunavut',abbreviation:'NU'},{name:'Yukon',abbreviation:'YT'}],"it":[{name:"Agrigento",abbreviation:"AG",code:84},{name:"Alessandria",abbreviation:"AL",code:6},{name:"Ancona",abbreviation:"AN",code:42},{name:"Aosta",abbreviation:"AO",code:7},{name:"L'Aquila",abbreviation:"AQ",code:66},{name:"Arezzo",abbreviation:"AR",code:51},{name:"Ascoli-Piceno",abbreviation:"AP",code:44},{name:"Asti",abbreviation:"AT",code:5},{name:"Avellino",abbreviation:"AV",code:64},{name:"Bari",abbreviation:"BA",code:72},{name:"Barletta-Andria-Trani",abbreviation:"BT",code:72},{name:"Belluno",abbreviation:"BL",code:25},{name:"Benevento",abbreviation:"BN",code:62},{name:"Bergamo",abbreviation:"BG",code:16},{name:"Biella",abbreviation:"BI",code:96},{name:"Bologna",abbreviation:"BO",code:37},{name:"Bolzano",abbreviation:"BZ",code:21},{name:"Brescia",abbreviation:"BS",code:17},{name:"Brindisi",abbreviation:"BR",code:74},{name:"Cagliari",abbreviation:"CA",code:92},{name:"Caltanissetta",abbreviation:"CL",code:85},{name:"Campobasso",abbreviation:"CB",code:70},{name:"Carbonia Iglesias",abbreviation:"CI",code:70},{name:"Caserta",abbreviation:"CE",code:61},{name:"Catania",abbreviation:"CT",code:87},{name:"Catanzaro",abbreviation:"CZ",code:79},{name:"Chieti",abbreviation:"CH",code:69},{name:"Como",abbreviation:"CO",code:13},{name:"Cosenza",abbreviation:"CS",code:78},{name:"Cremona",abbreviation:"CR",code:19},{name:"Crotone",abbreviation:"KR",code:101},{name:"Cuneo",abbreviation:"CN",code:4},{name:"Enna",abbreviation:"EN",code:86},{name:"Fermo",abbreviation:"FM",code:86},{name:"Ferrara",abbreviation:"FE",code:38},{name:"Firenze",abbreviation:"FI",code:48},{name:"Foggia",abbreviation:"FG",code:71},{name:"Forli-Cesena",abbreviation:"FC",code:71},{name:"Frosinone",abbreviation:"FR",code:60},{name:"Genova",abbreviation:"GE",code:10},{name:"Gorizia",abbreviation:"GO",code:31},{name:"Grosseto",abbreviation:"GR",code:53},{name:"Imperia",abbreviation:"IM",code:8},{name:"Isernia",abbreviation:"IS",code:94},{name:"La-Spezia",abbreviation:"SP",code:66},{name:"Latina",abbreviation:"LT",code:59},{name:"Lecce",abbreviation:"LE",code:75},{name:"Lecco",abbreviation:"LC",code:97},{name:"Livorno",abbreviation:"LI",code:49},{name:"Lodi",abbreviation:"LO",code:98},{name:"Lucca",abbreviation:"LU",code:46},{name:"Macerata",abbreviation:"MC",code:43},{name:"Mantova",abbreviation:"MN",code:20},{name:"Massa-Carrara",abbreviation:"MS",code:45},{name:"Matera",abbreviation:"MT",code:77},{name:"Medio Campidano",abbreviation:"VS",code:77},{name:"Messina",abbreviation:"ME",code:83},{name:"Milano",abbreviation:"MI",code:15},{name:"Modena",abbreviation:"MO",code:36},{name:"Monza-Brianza",abbreviation:"MB",code:36},{name:"Napoli",abbreviation:"NA",code:63},{name:"Novara",abbreviation:"NO",code:3},{name:"Nuoro",abbreviation:"NU",code:91},{name:"Ogliastra",abbreviation:"OG",code:91},{name:"Olbia Tempio",abbreviation:"OT",code:91},{name:"Oristano",abbreviation:"OR",code:95},{name:"Padova",abbreviation:"PD",code:28},{name:"Palermo",abbreviation:"PA",code:82},{name:"Parma",abbreviation:"PR",code:34},{name:"Pavia",abbreviation:"PV",code:18},{name:"Perugia",abbreviation:"PG",code:54},{name:"Pesaro-Urbino",abbreviation:"PU",code:41},{name:"Pescara",abbreviation:"PE",code:68},{name:"Piacenza",abbreviation:"PC",code:33},{name:"Pisa",abbreviation:"PI",code:50},{name:"Pistoia",abbreviation:"PT",code:47},{name:"Pordenone",abbreviation:"PN",code:93},{name:"Potenza",abbreviation:"PZ",code:76},{name:"Prato",abbreviation:"PO",code:100},{name:"Ragusa",abbreviation:"RG",code:88},{name:"Ravenna",abbreviation:"RA",code:39},{name:"Reggio-Calabria",abbreviation:"RC",code:35},{name:"Reggio-Emilia",abbreviation:"RE",code:35},{name:"Rieti",abbreviation:"RI",code:57},{name:"Rimini",abbreviation:"RN",code:99},{name:"Roma",abbreviation:"Roma",code:58},{name:"Rovigo",abbreviation:"RO",code:29},{name:"Salerno",abbreviation:"SA",code:65},{name:"Sassari",abbreviation:"SS",code:90},{name:"Savona",abbreviation:"SV",code:9},{name:"Siena",abbreviation:"SI",code:52},{name:"Siracusa",abbreviation:"SR",code:89},{name:"Sondrio",abbreviation:"SO",code:14},{name:"Taranto",abbreviation:"TA",code:73},{name:"Teramo",abbreviation:"TE",code:67},{name:"Terni",abbreviation:"TR",code:55},{name:"Torino",abbreviation:"TO",code:1},{name:"Trapani",abbreviation:"TP",code:81},{name:"Trento",abbreviation:"TN",code:22},{name:"Treviso",abbreviation:"TV",code:26},{name:"Trieste",abbreviation:"TS",code:32},{name:"Udine",abbreviation:"UD",code:30},{name:"Varese",abbreviation:"VA",code:12},{name:"Venezia",abbreviation:"VE",code:27},{name:"Verbania",abbreviation:"VB",code:27},{name:"Vercelli",abbreviation:"VC",code:2},{name:"Verona",abbreviation:"VR",code:23},{name:"Vibo-Valentia",abbreviation:"VV",code:102},{name:"Vicenza",abbreviation:"VI",code:24},{name:"Viterbo",abbreviation:"VT",code:56}]},// from: https://github.com/samsargent/Useful-Autocomplete-Data/blob/master/data/nationalities.json
nationalities:[{name:'Afghan'},{name:'Albanian'},{name:'Algerian'},{name:'American'},{name:'Andorran'},{name:'Angolan'},{name:'Antiguans'},{name:'Argentinean'},{name:'Armenian'},{name:'Australian'},{name:'Austrian'},{name:'Azerbaijani'},{name:'Bahami'},{name:'Bahraini'},{name:'Bangladeshi'},{name:'Barbadian'},{name:'Barbudans'},{name:'Batswana'},{name:'Belarusian'},{name:'Belgian'},{name:'Belizean'},{name:'Beninese'},{name:'Bhutanese'},{name:'Bolivian'},{name:'Bosnian'},{name:'Brazilian'},{name:'British'},{name:'Bruneian'},{name:'Bulgarian'},{name:'Burkinabe'},{name:'Burmese'},{name:'Burundian'},{name:'Cambodian'},{name:'Cameroonian'},{name:'Canadian'},{name:'Cape Verdean'},{name:'Central African'},{name:'Chadian'},{name:'Chilean'},{name:'Chinese'},{name:'Colombian'},{name:'Comoran'},{name:'Congolese'},{name:'Costa Rican'},{name:'Croatian'},{name:'Cuban'},{name:'Cypriot'},{name:'Czech'},{name:'Danish'},{name:'Djibouti'},{name:'Dominican'},{name:'Dutch'},{name:'East Timorese'},{name:'Ecuadorean'},{name:'Egyptian'},{name:'Emirian'},{name:'Equatorial Guinean'},{name:'Eritrean'},{name:'Estonian'},{name:'Ethiopian'},{name:'Fijian'},{name:'Filipino'},{name:'Finnish'},{name:'French'},{name:'Gabonese'},{name:'Gambian'},{name:'Georgian'},{name:'German'},{name:'Ghanaian'},{name:'Greek'},{name:'Grenadian'},{name:'Guatemalan'},{name:'Guinea-Bissauan'},{name:'Guinean'},{name:'Guyanese'},{name:'Haitian'},{name:'Herzegovinian'},{name:'Honduran'},{name:'Hungarian'},{name:'I-Kiribati'},{name:'Icelander'},{name:'Indian'},{name:'Indonesian'},{name:'Iranian'},{name:'Iraqi'},{name:'Irish'},{name:'Israeli'},{name:'Italian'},{name:'Ivorian'},{name:'Jamaican'},{name:'Japanese'},{name:'Jordanian'},{name:'Kazakhstani'},{name:'Kenyan'},{name:'Kittian and Nevisian'},{name:'Kuwaiti'},{name:'Kyrgyz'},{name:'Laotian'},{name:'Latvian'},{name:'Lebanese'},{name:'Liberian'},{name:'Libyan'},{name:'Liechtensteiner'},{name:'Lithuanian'},{name:'Luxembourger'},{name:'Macedonian'},{name:'Malagasy'},{name:'Malawian'},{name:'Malaysian'},{name:'Maldivan'},{name:'Malian'},{name:'Maltese'},{name:'Marshallese'},{name:'Mauritanian'},{name:'Mauritian'},{name:'Mexican'},{name:'Micronesian'},{name:'Moldovan'},{name:'Monacan'},{name:'Mongolian'},{name:'Moroccan'},{name:'Mosotho'},{name:'Motswana'},{name:'Mozambican'},{name:'Namibian'},{name:'Nauruan'},{name:'Nepalese'},{name:'New Zealander'},{name:'Nicaraguan'},{name:'Nigerian'},{name:'Nigerien'},{name:'North Korean'},{name:'Northern Irish'},{name:'Norwegian'},{name:'Omani'},{name:'Pakistani'},{name:'Palauan'},{name:'Panamanian'},{name:'Papua New Guinean'},{name:'Paraguayan'},{name:'Peruvian'},{name:'Polish'},{name:'Portuguese'},{name:'Qatari'},{name:'Romani'},{name:'Russian'},{name:'Rwandan'},{name:'Saint Lucian'},{name:'Salvadoran'},{name:'Samoan'},{name:'San Marinese'},{name:'Sao Tomean'},{name:'Saudi'},{name:'Scottish'},{name:'Senegalese'},{name:'Serbian'},{name:'Seychellois'},{name:'Sierra Leonean'},{name:'Singaporean'},{name:'Slovakian'},{name:'Slovenian'},{name:'Solomon Islander'},{name:'Somali'},{name:'South African'},{name:'South Korean'},{name:'Spanish'},{name:'Sri Lankan'},{name:'Sudanese'},{name:'Surinamer'},{name:'Swazi'},{name:'Swedish'},{name:'Swiss'},{name:'Syrian'},{name:'Taiwanese'},{name:'Tajik'},{name:'Tanzanian'},{name:'Thai'},{name:'Togolese'},{name:'Tongan'},{name:'Trinidadian or Tobagonian'},{name:'Tunisian'},{name:'Turkish'},{name:'Tuvaluan'},{name:'Ugandan'},{name:'Ukrainian'},{name:'Uruguaya'},{name:'Uzbekistani'},{name:'Venezuela'},{name:'Vietnamese'},{name:'Wels'},{name:'Yemenit'},{name:'Zambia'},{name:'Zimbabwe'}],us_states_and_dc:[{name:'Alabama',abbreviation:'AL'},{name:'Alaska',abbreviation:'AK'},{name:'Arizona',abbreviation:'AZ'},{name:'Arkansas',abbreviation:'AR'},{name:'California',abbreviation:'CA'},{name:'Colorado',abbreviation:'CO'},{name:'Connecticut',abbreviation:'CT'},{name:'Delaware',abbreviation:'DE'},{name:'District of Columbia',abbreviation:'DC'},{name:'Florida',abbreviation:'FL'},{name:'Georgia',abbreviation:'GA'},{name:'Hawaii',abbreviation:'HI'},{name:'Idaho',abbreviation:'ID'},{name:'Illinois',abbreviation:'IL'},{name:'Indiana',abbreviation:'IN'},{name:'Iowa',abbreviation:'IA'},{name:'Kansas',abbreviation:'KS'},{name:'Kentucky',abbreviation:'KY'},{name:'Louisiana',abbreviation:'LA'},{name:'Maine',abbreviation:'ME'},{name:'Maryland',abbreviation:'MD'},{name:'Massachusetts',abbreviation:'MA'},{name:'Michigan',abbreviation:'MI'},{name:'Minnesota',abbreviation:'MN'},{name:'Mississippi',abbreviation:'MS'},{name:'Missouri',abbreviation:'MO'},{name:'Montana',abbreviation:'MT'},{name:'Nebraska',abbreviation:'NE'},{name:'Nevada',abbreviation:'NV'},{name:'New Hampshire',abbreviation:'NH'},{name:'New Jersey',abbreviation:'NJ'},{name:'New Mexico',abbreviation:'NM'},{name:'New York',abbreviation:'NY'},{name:'North Carolina',abbreviation:'NC'},{name:'North Dakota',abbreviation:'ND'},{name:'Ohio',abbreviation:'OH'},{name:'Oklahoma',abbreviation:'OK'},{name:'Oregon',abbreviation:'OR'},{name:'Pennsylvania',abbreviation:'PA'},{name:'Rhode Island',abbreviation:'RI'},{name:'South Carolina',abbreviation:'SC'},{name:'South Dakota',abbreviation:'SD'},{name:'Tennessee',abbreviation:'TN'},{name:'Texas',abbreviation:'TX'},{name:'Utah',abbreviation:'UT'},{name:'Vermont',abbreviation:'VT'},{name:'Virginia',abbreviation:'VA'},{name:'Washington',abbreviation:'WA'},{name:'West Virginia',abbreviation:'WV'},{name:'Wisconsin',abbreviation:'WI'},{name:'Wyoming',abbreviation:'WY'}],territories:[{name:'American Samoa',abbreviation:'AS'},{name:'Federated States of Micronesia',abbreviation:'FM'},{name:'Guam',abbreviation:'GU'},{name:'Marshall Islands',abbreviation:'MH'},{name:'Northern Mariana Islands',abbreviation:'MP'},{name:'Puerto Rico',abbreviation:'PR'},{name:'Virgin Islands, U.S.',abbreviation:'VI'}],armed_forces:[{name:'Armed Forces Europe',abbreviation:'AE'},{name:'Armed Forces Pacific',abbreviation:'AP'},{name:'Armed Forces the Americas',abbreviation:'AA'}],country_regions:{it:[{name:"Valle d'Aosta",abbreviation:"VDA"},{name:"Piemonte",abbreviation:"PIE"},{name:"Lombardia",abbreviation:"LOM"},{name:"Veneto",abbreviation:"VEN"},{name:"Trentino Alto Adige",abbreviation:"TAA"},{name:"Friuli Venezia Giulia",abbreviation:"FVG"},{name:"Liguria",abbreviation:"LIG"},{name:"Emilia Romagna",abbreviation:"EMR"},{name:"Toscana",abbreviation:"TOS"},{name:"Umbria",abbreviation:"UMB"},{name:"Marche",abbreviation:"MAR"},{name:"Abruzzo",abbreviation:"ABR"},{name:"Lazio",abbreviation:"LAZ"},{name:"Campania",abbreviation:"CAM"},{name:"Puglia",abbreviation:"PUG"},{name:"Basilicata",abbreviation:"BAS"},{name:"Molise",abbreviation:"MOL"},{name:"Calabria",abbreviation:"CAL"},{name:"Sicilia",abbreviation:"SIC"},{name:"Sardegna",abbreviation:"SAR"}]},street_suffixes:{'us':[{name:'Avenue',abbreviation:'Ave'},{name:'Boulevard',abbreviation:'Blvd'},{name:'Center',abbreviation:'Ctr'},{name:'Circle',abbreviation:'Cir'},{name:'Court',abbreviation:'Ct'},{name:'Drive',abbreviation:'Dr'},{name:'Extension',abbreviation:'Ext'},{name:'Glen',abbreviation:'Gln'},{name:'Grove',abbreviation:'Grv'},{name:'Heights',abbreviation:'Hts'},{name:'Highway',abbreviation:'Hwy'},{name:'Junction',abbreviation:'Jct'},{name:'Key',abbreviation:'Key'},{name:'Lane',abbreviation:'Ln'},{name:'Loop',abbreviation:'Loop'},{name:'Manor',abbreviation:'Mnr'},{name:'Mill',abbreviation:'Mill'},{name:'Park',abbreviation:'Park'},{name:'Parkway',abbreviation:'Pkwy'},{name:'Pass',abbreviation:'Pass'},{name:'Path',abbreviation:'Path'},{name:'Pike',abbreviation:'Pike'},{name:'Place',abbreviation:'Pl'},{name:'Plaza',abbreviation:'Plz'},{name:'Point',abbreviation:'Pt'},{name:'Ridge',abbreviation:'Rdg'},{name:'River',abbreviation:'Riv'},{name:'Road',abbreviation:'Rd'},{name:'Square',abbreviation:'Sq'},{name:'Street',abbreviation:'St'},{name:'Terrace',abbreviation:'Ter'},{name:'Trail',abbreviation:'Trl'},{name:'Turnpike',abbreviation:'Tpke'},{name:'View',abbreviation:'Vw'},{name:'Way',abbreviation:'Way'}],'it':[{name:'Accesso',abbreviation:'Acc.'},{name:'Alzaia',abbreviation:'Alz.'},{name:'Arco',abbreviation:'Arco'},{name:'Archivolto',abbreviation:'Acv.'},{name:'Arena',abbreviation:'Arena'},{name:'Argine',abbreviation:'Argine'},{name:'Bacino',abbreviation:'Bacino'},{name:'Banchi',abbreviation:'Banchi'},{name:'Banchina',abbreviation:'Ban.'},{name:'Bastioni',abbreviation:'Bas.'},{name:'Belvedere',abbreviation:'Belv.'},{name:'Borgata',abbreviation:'B.ta'},{name:'Borgo',abbreviation:'B.go'},{name:'Calata',abbreviation:'Cal.'},{name:'Calle',abbreviation:'Calle'},{name:'Campiello',abbreviation:'Cam.'},{name:'Campo',abbreviation:'Cam.'},{name:'Canale',abbreviation:'Can.'},{name:'Carraia',abbreviation:'Carr.'},{name:'Cascina',abbreviation:'Cascina'},{name:'Case sparse',abbreviation:'c.s.'},{name:'Cavalcavia',abbreviation:'Cv.'},{name:'Circonvallazione',abbreviation:'Cv.'},{name:'Complanare',abbreviation:'C.re'},{name:'Contrada',abbreviation:'C.da'},{name:'Corso',abbreviation:'C.so'},{name:'Corte',abbreviation:'C.te'},{name:'Cortile',abbreviation:'C.le'},{name:'Diramazione',abbreviation:'Dir.'},{name:'Fondaco',abbreviation:'F.co'},{name:'Fondamenta',abbreviation:'F.ta'},{name:'Fondo',abbreviation:'F.do'},{name:'Frazione',abbreviation:'Fr.'},{name:'Isola',abbreviation:'Is.'},{name:'Largo',abbreviation:'L.go'},{name:'Litoranea',abbreviation:'Lit.'},{name:'Lungolago',abbreviation:'L.go lago'},{name:'Lungo Po',abbreviation:'l.go Po'},{name:'Molo',abbreviation:'Molo'},{name:'Mura',abbreviation:'Mura'},{name:'Passaggio privato',abbreviation:'pass. priv.'},{name:'Passeggiata',abbreviation:'Pass.'},{name:'Piazza',abbreviation:'P.zza'},{name:'Piazzale',abbreviation:'P.le'},{name:'Ponte',abbreviation:'P.te'},{name:'Portico',abbreviation:'P.co'},{name:'Rampa',abbreviation:'Rampa'},{name:'Regione',abbreviation:'Reg.'},{name:'Rione',abbreviation:'R.ne'},{name:'Rio',abbreviation:'Rio'},{name:'Ripa',abbreviation:'Ripa'},{name:'Riva',abbreviation:'Riva'},{name:'Rondò',abbreviation:'Rondò'},{name:'Rotonda',abbreviation:'Rot.'},{name:'Sagrato',abbreviation:'Sagr.'},{name:'Salita',abbreviation:'Sal.'},{name:'Scalinata',abbreviation:'Scal.'},{name:'Scalone',abbreviation:'Scal.'},{name:'Slargo',abbreviation:'Sl.'},{name:'Sottoportico',abbreviation:'Sott.'},{name:'Strada',abbreviation:'Str.'},{name:'Stradale',abbreviation:'Str.le'},{name:'Strettoia',abbreviation:'Strett.'},{name:'Traversa',abbreviation:'Trav.'},{name:'Via',abbreviation:'V.'},{name:'Viale',abbreviation:'V.le'},{name:'Vicinale',abbreviation:'Vic.le'},{name:'Vicolo',abbreviation:'Vic.'}],'uk':[{name:'Avenue',abbreviation:'Ave'},{name:'Close',abbreviation:'Cl'},{name:'Court',abbreviation:'Ct'},{name:'Crescent',abbreviation:'Cr'},{name:'Drive',abbreviation:'Dr'},{name:'Garden',abbreviation:'Gdn'},{name:'Gardens',abbreviation:'Gdns'},{name:'Green',abbreviation:'Gn'},{name:'Grove',abbreviation:'Gr'},{name:'Lane',abbreviation:'Ln'},{name:'Mount',abbreviation:'Mt'},{name:'Place',abbreviation:'Pl'},{name:'Park',abbreviation:'Pk'},{name:'Ridge',abbreviation:'Rdg'},{name:'Road',abbreviation:'Rd'},{name:'Square',abbreviation:'Sq'},{name:'Street',abbreviation:'St'},{name:'Terrace',abbreviation:'Ter'},{name:'Valley',abbreviation:'Val'}]},months:[{name:'January',short_name:'Jan',numeric:'01',days:31},// Not messing with leap years...
{name:'February',short_name:'Feb',numeric:'02',days:28},{name:'March',short_name:'Mar',numeric:'03',days:31},{name:'April',short_name:'Apr',numeric:'04',days:30},{name:'May',short_name:'May',numeric:'05',days:31},{name:'June',short_name:'Jun',numeric:'06',days:30},{name:'July',short_name:'Jul',numeric:'07',days:31},{name:'August',short_name:'Aug',numeric:'08',days:31},{name:'September',short_name:'Sep',numeric:'09',days:30},{name:'October',short_name:'Oct',numeric:'10',days:31},{name:'November',short_name:'Nov',numeric:'11',days:30},{name:'December',short_name:'Dec',numeric:'12',days:31}],// http://en.wikipedia.org/wiki/Bank_card_number#Issuer_identification_number_.28IIN.29
cc_types:[{name:"American Express",short_name:'amex',prefix:'34',length:15},{name:"Bankcard",short_name:'bankcard',prefix:'5610',length:16},{name:"China UnionPay",short_name:'chinaunion',prefix:'62',length:16},{name:"Diners Club Carte Blanche",short_name:'dccarte',prefix:'300',length:14},{name:"Diners Club enRoute",short_name:'dcenroute',prefix:'2014',length:15},{name:"Diners Club International",short_name:'dcintl',prefix:'36',length:14},{name:"Diners Club United States & Canada",short_name:'dcusc',prefix:'54',length:16},{name:"Discover Card",short_name:'discover',prefix:'6011',length:16},{name:"InstaPayment",short_name:'instapay',prefix:'637',length:16},{name:"JCB",short_name:'jcb',prefix:'3528',length:16},{name:"Laser",short_name:'laser',prefix:'6304',length:16},{name:"Maestro",short_name:'maestro',prefix:'5018',length:16},{name:"Mastercard",short_name:'mc',prefix:'51',length:16},{name:"Solo",short_name:'solo',prefix:'6334',length:16},{name:"Switch",short_name:'switch',prefix:'4903',length:16},{name:"Visa",short_name:'visa',prefix:'4',length:16},{name:"Visa Electron",short_name:'electron',prefix:'4026',length:16}],//return all world currency by ISO 4217
currency_types:[{'code':'AED','name':'United Arab Emirates Dirham'},{'code':'AFN','name':'Afghanistan Afghani'},{'code':'ALL','name':'Albania Lek'},{'code':'AMD','name':'Armenia Dram'},{'code':'ANG','name':'Netherlands Antilles Guilder'},{'code':'AOA','name':'Angola Kwanza'},{'code':'ARS','name':'Argentina Peso'},{'code':'AUD','name':'Australia Dollar'},{'code':'AWG','name':'Aruba Guilder'},{'code':'AZN','name':'Azerbaijan New Manat'},{'code':'BAM','name':'Bosnia and Herzegovina Convertible Marka'},{'code':'BBD','name':'Barbados Dollar'},{'code':'BDT','name':'Bangladesh Taka'},{'code':'BGN','name':'Bulgaria Lev'},{'code':'BHD','name':'Bahrain Dinar'},{'code':'BIF','name':'Burundi Franc'},{'code':'BMD','name':'Bermuda Dollar'},{'code':'BND','name':'Brunei Darussalam Dollar'},{'code':'BOB','name':'Bolivia Boliviano'},{'code':'BRL','name':'Brazil Real'},{'code':'BSD','name':'Bahamas Dollar'},{'code':'BTN','name':'Bhutan Ngultrum'},{'code':'BWP','name':'Botswana Pula'},{'code':'BYR','name':'Belarus Ruble'},{'code':'BZD','name':'Belize Dollar'},{'code':'CAD','name':'Canada Dollar'},{'code':'CDF','name':'Congo/Kinshasa Franc'},{'code':'CHF','name':'Switzerland Franc'},{'code':'CLP','name':'Chile Peso'},{'code':'CNY','name':'China Yuan Renminbi'},{'code':'COP','name':'Colombia Peso'},{'code':'CRC','name':'Costa Rica Colon'},{'code':'CUC','name':'Cuba Convertible Peso'},{'code':'CUP','name':'Cuba Peso'},{'code':'CVE','name':'Cape Verde Escudo'},{'code':'CZK','name':'Czech Republic Koruna'},{'code':'DJF','name':'Djibouti Franc'},{'code':'DKK','name':'Denmark Krone'},{'code':'DOP','name':'Dominican Republic Peso'},{'code':'DZD','name':'Algeria Dinar'},{'code':'EGP','name':'Egypt Pound'},{'code':'ERN','name':'Eritrea Nakfa'},{'code':'ETB','name':'Ethiopia Birr'},{'code':'EUR','name':'Euro Member Countries'},{'code':'FJD','name':'Fiji Dollar'},{'code':'FKP','name':'Falkland Islands (Malvinas) Pound'},{'code':'GBP','name':'United Kingdom Pound'},{'code':'GEL','name':'Georgia Lari'},{'code':'GGP','name':'Guernsey Pound'},{'code':'GHS','name':'Ghana Cedi'},{'code':'GIP','name':'Gibraltar Pound'},{'code':'GMD','name':'Gambia Dalasi'},{'code':'GNF','name':'Guinea Franc'},{'code':'GTQ','name':'Guatemala Quetzal'},{'code':'GYD','name':'Guyana Dollar'},{'code':'HKD','name':'Hong Kong Dollar'},{'code':'HNL','name':'Honduras Lempira'},{'code':'HRK','name':'Croatia Kuna'},{'code':'HTG','name':'Haiti Gourde'},{'code':'HUF','name':'Hungary Forint'},{'code':'IDR','name':'Indonesia Rupiah'},{'code':'ILS','name':'Israel Shekel'},{'code':'IMP','name':'Isle of Man Pound'},{'code':'INR','name':'India Rupee'},{'code':'IQD','name':'Iraq Dinar'},{'code':'IRR','name':'Iran Rial'},{'code':'ISK','name':'Iceland Krona'},{'code':'JEP','name':'Jersey Pound'},{'code':'JMD','name':'Jamaica Dollar'},{'code':'JOD','name':'Jordan Dinar'},{'code':'JPY','name':'Japan Yen'},{'code':'KES','name':'Kenya Shilling'},{'code':'KGS','name':'Kyrgyzstan Som'},{'code':'KHR','name':'Cambodia Riel'},{'code':'KMF','name':'Comoros Franc'},{'code':'KPW','name':'Korea (North) Won'},{'code':'KRW','name':'Korea (South) Won'},{'code':'KWD','name':'Kuwait Dinar'},{'code':'KYD','name':'Cayman Islands Dollar'},{'code':'KZT','name':'Kazakhstan Tenge'},{'code':'LAK','name':'Laos Kip'},{'code':'LBP','name':'Lebanon Pound'},{'code':'LKR','name':'Sri Lanka Rupee'},{'code':'LRD','name':'Liberia Dollar'},{'code':'LSL','name':'Lesotho Loti'},{'code':'LTL','name':'Lithuania Litas'},{'code':'LYD','name':'Libya Dinar'},{'code':'MAD','name':'Morocco Dirham'},{'code':'MDL','name':'Moldova Leu'},{'code':'MGA','name':'Madagascar Ariary'},{'code':'MKD','name':'Macedonia Denar'},{'code':'MMK','name':'Myanmar (Burma) Kyat'},{'code':'MNT','name':'Mongolia Tughrik'},{'code':'MOP','name':'Macau Pataca'},{'code':'MRO','name':'Mauritania Ouguiya'},{'code':'MUR','name':'Mauritius Rupee'},{'code':'MVR','name':'Maldives (Maldive Islands) Rufiyaa'},{'code':'MWK','name':'Malawi Kwacha'},{'code':'MXN','name':'Mexico Peso'},{'code':'MYR','name':'Malaysia Ringgit'},{'code':'MZN','name':'Mozambique Metical'},{'code':'NAD','name':'Namibia Dollar'},{'code':'NGN','name':'Nigeria Naira'},{'code':'NIO','name':'Nicaragua Cordoba'},{'code':'NOK','name':'Norway Krone'},{'code':'NPR','name':'Nepal Rupee'},{'code':'NZD','name':'New Zealand Dollar'},{'code':'OMR','name':'Oman Rial'},{'code':'PAB','name':'Panama Balboa'},{'code':'PEN','name':'Peru Nuevo Sol'},{'code':'PGK','name':'Papua New Guinea Kina'},{'code':'PHP','name':'Philippines Peso'},{'code':'PKR','name':'Pakistan Rupee'},{'code':'PLN','name':'Poland Zloty'},{'code':'PYG','name':'Paraguay Guarani'},{'code':'QAR','name':'Qatar Riyal'},{'code':'RON','name':'Romania New Leu'},{'code':'RSD','name':'Serbia Dinar'},{'code':'RUB','name':'Russia Ruble'},{'code':'RWF','name':'Rwanda Franc'},{'code':'SAR','name':'Saudi Arabia Riyal'},{'code':'SBD','name':'Solomon Islands Dollar'},{'code':'SCR','name':'Seychelles Rupee'},{'code':'SDG','name':'Sudan Pound'},{'code':'SEK','name':'Sweden Krona'},{'code':'SGD','name':'Singapore Dollar'},{'code':'SHP','name':'Saint Helena Pound'},{'code':'SLL','name':'Sierra Leone Leone'},{'code':'SOS','name':'Somalia Shilling'},{'code':'SPL','name':'Seborga Luigino'},{'code':'SRD','name':'Suriname Dollar'},{'code':'STD','name':'São Tomé and Príncipe Dobra'},{'code':'SVC','name':'El Salvador Colon'},{'code':'SYP','name':'Syria Pound'},{'code':'SZL','name':'Swaziland Lilangeni'},{'code':'THB','name':'Thailand Baht'},{'code':'TJS','name':'Tajikistan Somoni'},{'code':'TMT','name':'Turkmenistan Manat'},{'code':'TND','name':'Tunisia Dinar'},{'code':'TOP','name':'Tonga Pa\'anga'},{'code':'TRY','name':'Turkey Lira'},{'code':'TTD','name':'Trinidad and Tobago Dollar'},{'code':'TVD','name':'Tuvalu Dollar'},{'code':'TWD','name':'Taiwan New Dollar'},{'code':'TZS','name':'Tanzania Shilling'},{'code':'UAH','name':'Ukraine Hryvnia'},{'code':'UGX','name':'Uganda Shilling'},{'code':'USD','name':'United States Dollar'},{'code':'UYU','name':'Uruguay Peso'},{'code':'UZS','name':'Uzbekistan Som'},{'code':'VEF','name':'Venezuela Bolivar'},{'code':'VND','name':'Viet Nam Dong'},{'code':'VUV','name':'Vanuatu Vatu'},{'code':'WST','name':'Samoa Tala'},{'code':'XAF','name':'Communauté Financière Africaine (BEAC) CFA Franc BEAC'},{'code':'XCD','name':'East Caribbean Dollar'},{'code':'XDR','name':'International Monetary Fund (IMF) Special Drawing Rights'},{'code':'XOF','name':'Communauté Financière Africaine (BCEAO) Franc'},{'code':'XPF','name':'Comptoirs Français du Pacifique (CFP) Franc'},{'code':'YER','name':'Yemen Rial'},{'code':'ZAR','name':'South Africa Rand'},{'code':'ZMW','name':'Zambia Kwacha'},{'code':'ZWD','name':'Zimbabwe Dollar'}],// return the names of all valide colors
colorNames:["AliceBlue","Black","Navy","DarkBlue","MediumBlue","Blue","DarkGreen","Green","Teal","DarkCyan","DeepSkyBlue","DarkTurquoise","MediumSpringGreen","Lime","SpringGreen","Aqua","Cyan","MidnightBlue","DodgerBlue","LightSeaGreen","ForestGreen","SeaGreen","DarkSlateGray","LimeGreen","MediumSeaGreen","Turquoise","RoyalBlue","SteelBlue","DarkSlateBlue","MediumTurquoise","Indigo","DarkOliveGreen","CadetBlue","CornflowerBlue","RebeccaPurple","MediumAquaMarine","DimGray","SlateBlue","OliveDrab","SlateGray","LightSlateGray","MediumSlateBlue","LawnGreen","Chartreuse","Aquamarine","Maroon","Purple","Olive","Gray","SkyBlue","LightSkyBlue","BlueViolet","DarkRed","DarkMagenta","SaddleBrown","Ivory","White","DarkSeaGreen","LightGreen","MediumPurple","DarkViolet","PaleGreen","DarkOrchid","YellowGreen","Sienna","Brown","DarkGray","LightBlue","GreenYellow","PaleTurquoise","LightSteelBlue","PowderBlue","FireBrick","DarkGoldenRod","MediumOrchid","RosyBrown","DarkKhaki","Silver","MediumVioletRed","IndianRed","Peru","Chocolate","Tan","LightGray","Thistle","Orchid","GoldenRod","PaleVioletRed","Crimson","Gainsboro","Plum","BurlyWood","LightCyan","Lavender","DarkSalmon","Violet","PaleGoldenRod","LightCoral","Khaki","AliceBlue","HoneyDew","Azure","SandyBrown","Wheat","Beige","WhiteSmoke","MintCream","GhostWhite","Salmon","AntiqueWhite","Linen","LightGoldenRodYellow","OldLace","Red","Fuchsia","Magenta","DeepPink","OrangeRed","Tomato","HotPink","Coral","DarkOrange","LightSalmon","Orange","LightPink","Pink","Gold","PeachPuff","NavajoWhite","Moccasin","Bisque","MistyRose","BlanchedAlmond","PapayaWhip","LavenderBlush","SeaShell","Cornsilk","LemonChiffon","FloralWhite","Snow","Yellow","LightYellow"],fileExtension:{"raster":["bmp","gif","gpl","ico","jpeg","psd","png","psp","raw","tiff"],"vector":["3dv","amf","awg","ai","cgm","cdr","cmx","dxf","e2d","egt","eps","fs","odg","svg","xar"],"3d":["3dmf","3dm","3mf","3ds","an8","aoi","blend","cal3d","cob","ctm","iob","jas","max","mb","mdx","obj","x","x3d"],"document":["doc","docx","dot","html","xml","odt","odm","ott","csv","rtf","tex","xhtml","xps"]},// Data taken from https://github.com/dmfilipenko/timezones.json/blob/master/timezones.json
timezones:[{"name":"Dateline Standard Time","abbr":"DST","offset":-12,"isdst":false,"text":"(UTC-12:00) International Date Line West","utc":["Etc/GMT+12"]},{"name":"UTC-11","abbr":"U","offset":-11,"isdst":false,"text":"(UTC-11:00) Coordinated Universal Time-11","utc":["Etc/GMT+11","Pacific/Midway","Pacific/Niue","Pacific/Pago_Pago"]},{"name":"Hawaiian Standard Time","abbr":"HST","offset":-10,"isdst":false,"text":"(UTC-10:00) Hawaii","utc":["Etc/GMT+10","Pacific/Honolulu","Pacific/Johnston","Pacific/Rarotonga","Pacific/Tahiti"]},{"name":"Alaskan Standard Time","abbr":"AKDT","offset":-8,"isdst":true,"text":"(UTC-09:00) Alaska","utc":["America/Anchorage","America/Juneau","America/Nome","America/Sitka","America/Yakutat"]},{"name":"Pacific Standard Time (Mexico)","abbr":"PDT","offset":-7,"isdst":true,"text":"(UTC-08:00) Baja California","utc":["America/Santa_Isabel"]},{"name":"Pacific Standard Time","abbr":"PDT","offset":-7,"isdst":true,"text":"(UTC-08:00) Pacific Time (US & Canada)","utc":["America/Dawson","America/Los_Angeles","America/Tijuana","America/Vancouver","America/Whitehorse","PST8PDT"]},{"name":"US Mountain Standard Time","abbr":"UMST","offset":-7,"isdst":false,"text":"(UTC-07:00) Arizona","utc":["America/Creston","America/Dawson_Creek","America/Hermosillo","America/Phoenix","Etc/GMT+7"]},{"name":"Mountain Standard Time (Mexico)","abbr":"MDT","offset":-6,"isdst":true,"text":"(UTC-07:00) Chihuahua, La Paz, Mazatlan","utc":["America/Chihuahua","America/Mazatlan"]},{"name":"Mountain Standard Time","abbr":"MDT","offset":-6,"isdst":true,"text":"(UTC-07:00) Mountain Time (US & Canada)","utc":["America/Boise","America/Cambridge_Bay","America/Denver","America/Edmonton","America/Inuvik","America/Ojinaga","America/Yellowknife","MST7MDT"]},{"name":"Central America Standard Time","abbr":"CAST","offset":-6,"isdst":false,"text":"(UTC-06:00) Central America","utc":["America/Belize","America/Costa_Rica","America/El_Salvador","America/Guatemala","America/Managua","America/Tegucigalpa","Etc/GMT+6","Pacific/Galapagos"]},{"name":"Central Standard Time","abbr":"CDT","offset":-5,"isdst":true,"text":"(UTC-06:00) Central Time (US & Canada)","utc":["America/Chicago","America/Indiana/Knox","America/Indiana/Tell_City","America/Matamoros","America/Menominee","America/North_Dakota/Beulah","America/North_Dakota/Center","America/North_Dakota/New_Salem","America/Rainy_River","America/Rankin_Inlet","America/Resolute","America/Winnipeg","CST6CDT"]},{"name":"Central Standard Time (Mexico)","abbr":"CDT","offset":-5,"isdst":true,"text":"(UTC-06:00) Guadalajara, Mexico City, Monterrey","utc":["America/Bahia_Banderas","America/Cancun","America/Merida","America/Mexico_City","America/Monterrey"]},{"name":"Canada Central Standard Time","abbr":"CCST","offset":-6,"isdst":false,"text":"(UTC-06:00) Saskatchewan","utc":["America/Regina","America/Swift_Current"]},{"name":"SA Pacific Standard Time","abbr":"SPST","offset":-5,"isdst":false,"text":"(UTC-05:00) Bogota, Lima, Quito","utc":["America/Bogota","America/Cayman","America/Coral_Harbour","America/Eirunepe","America/Guayaquil","America/Jamaica","America/Lima","America/Panama","America/Rio_Branco","Etc/GMT+5"]},{"name":"Eastern Standard Time","abbr":"EDT","offset":-4,"isdst":true,"text":"(UTC-05:00) Eastern Time (US & Canada)","utc":["America/Detroit","America/Havana","America/Indiana/Petersburg","America/Indiana/Vincennes","America/Indiana/Winamac","America/Iqaluit","America/Kentucky/Monticello","America/Louisville","America/Montreal","America/Nassau","America/New_York","America/Nipigon","America/Pangnirtung","America/Port-au-Prince","America/Thunder_Bay","America/Toronto","EST5EDT"]},{"name":"US Eastern Standard Time","abbr":"UEDT","offset":-4,"isdst":true,"text":"(UTC-05:00) Indiana (East)","utc":["America/Indiana/Marengo","America/Indiana/Vevay","America/Indianapolis"]},{"name":"Venezuela Standard Time","abbr":"VST","offset":-4.5,"isdst":false,"text":"(UTC-04:30) Caracas","utc":["America/Caracas"]},{"name":"Paraguay Standard Time","abbr":"PST","offset":-4,"isdst":false,"text":"(UTC-04:00) Asuncion","utc":["America/Asuncion"]},{"name":"Atlantic Standard Time","abbr":"ADT","offset":-3,"isdst":true,"text":"(UTC-04:00) Atlantic Time (Canada)","utc":["America/Glace_Bay","America/Goose_Bay","America/Halifax","America/Moncton","America/Thule","Atlantic/Bermuda"]},{"name":"Central Brazilian Standard Time","abbr":"CBST","offset":-4,"isdst":false,"text":"(UTC-04:00) Cuiaba","utc":["America/Campo_Grande","America/Cuiaba"]},{"name":"SA Western Standard Time","abbr":"SWST","offset":-4,"isdst":false,"text":"(UTC-04:00) Georgetown, La Paz, Manaus, San Juan","utc":["America/Anguilla","America/Antigua","America/Aruba","America/Barbados","America/Blanc-Sablon","America/Boa_Vista","America/Curacao","America/Dominica","America/Grand_Turk","America/Grenada","America/Guadeloupe","America/Guyana","America/Kralendijk","America/La_Paz","America/Lower_Princes","America/Manaus","America/Marigot","America/Martinique","America/Montserrat","America/Port_of_Spain","America/Porto_Velho","America/Puerto_Rico","America/Santo_Domingo","America/St_Barthelemy","America/St_Kitts","America/St_Lucia","America/St_Thomas","America/St_Vincent","America/Tortola","Etc/GMT+4"]},{"name":"Pacific SA Standard Time","abbr":"PSST","offset":-4,"isdst":false,"text":"(UTC-04:00) Santiago","utc":["America/Santiago","Antarctica/Palmer"]},{"name":"Newfoundland Standard Time","abbr":"NDT","offset":-2.5,"isdst":true,"text":"(UTC-03:30) Newfoundland","utc":["America/St_Johns"]},{"name":"E. South America Standard Time","abbr":"ESAST","offset":-3,"isdst":false,"text":"(UTC-03:00) Brasilia","utc":["America/Sao_Paulo"]},{"name":"Argentina Standard Time","abbr":"AST","offset":-3,"isdst":false,"text":"(UTC-03:00) Buenos Aires","utc":["America/Argentina/La_Rioja","America/Argentina/Rio_Gallegos","America/Argentina/Salta","America/Argentina/San_Juan","America/Argentina/San_Luis","America/Argentina/Tucuman","America/Argentina/Ushuaia","America/Buenos_Aires","America/Catamarca","America/Cordoba","America/Jujuy","America/Mendoza"]},{"name":"SA Eastern Standard Time","abbr":"SEST","offset":-3,"isdst":false,"text":"(UTC-03:00) Cayenne, Fortaleza","utc":["America/Araguaina","America/Belem","America/Cayenne","America/Fortaleza","America/Maceio","America/Paramaribo","America/Recife","America/Santarem","Antarctica/Rothera","Atlantic/Stanley","Etc/GMT+3"]},{"name":"Greenland Standard Time","abbr":"GDT","offset":-2,"isdst":true,"text":"(UTC-03:00) Greenland","utc":["America/Godthab"]},{"name":"Montevideo Standard Time","abbr":"MST","offset":-3,"isdst":false,"text":"(UTC-03:00) Montevideo","utc":["America/Montevideo"]},{"name":"Bahia Standard Time","abbr":"BST","offset":-3,"isdst":false,"text":"(UTC-03:00) Salvador","utc":["America/Bahia"]},{"name":"UTC-02","abbr":"U","offset":-2,"isdst":false,"text":"(UTC-02:00) Coordinated Universal Time-02","utc":["America/Noronha","Atlantic/South_Georgia","Etc/GMT+2"]},{"name":"Mid-Atlantic Standard Time","abbr":"MDT","offset":-1,"isdst":true,"text":"(UTC-02:00) Mid-Atlantic - Old"},{"name":"Azores Standard Time","abbr":"ADT","offset":0,"isdst":true,"text":"(UTC-01:00) Azores","utc":["America/Scoresbysund","Atlantic/Azores"]},{"name":"Cape Verde Standard Time","abbr":"CVST","offset":-1,"isdst":false,"text":"(UTC-01:00) Cape Verde Is.","utc":["Atlantic/Cape_Verde","Etc/GMT+1"]},{"name":"Morocco Standard Time","abbr":"MDT","offset":1,"isdst":true,"text":"(UTC) Casablanca","utc":["Africa/Casablanca","Africa/El_Aaiun"]},{"name":"UTC","abbr":"CUT","offset":0,"isdst":false,"text":"(UTC) Coordinated Universal Time","utc":["America/Danmarkshavn","Etc/GMT"]},{"name":"GMT Standard Time","abbr":"GDT","offset":1,"isdst":true,"text":"(UTC) Dublin, Edinburgh, Lisbon, London","utc":["Atlantic/Canary","Atlantic/Faeroe","Atlantic/Madeira","Europe/Dublin","Europe/Guernsey","Europe/Isle_of_Man","Europe/Jersey","Europe/Lisbon","Europe/London"]},{"name":"Greenwich Standard Time","abbr":"GST","offset":0,"isdst":false,"text":"(UTC) Monrovia, Reykjavik","utc":["Africa/Abidjan","Africa/Accra","Africa/Bamako","Africa/Banjul","Africa/Bissau","Africa/Conakry","Africa/Dakar","Africa/Freetown","Africa/Lome","Africa/Monrovia","Africa/Nouakchott","Africa/Ouagadougou","Africa/Sao_Tome","Atlantic/Reykjavik","Atlantic/St_Helena"]},{"name":"W. Europe Standard Time","abbr":"WEDT","offset":2,"isdst":true,"text":"(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna","utc":["Arctic/Longyearbyen","Europe/Amsterdam","Europe/Andorra","Europe/Berlin","Europe/Busingen","Europe/Gibraltar","Europe/Luxembourg","Europe/Malta","Europe/Monaco","Europe/Oslo","Europe/Rome","Europe/San_Marino","Europe/Stockholm","Europe/Vaduz","Europe/Vatican","Europe/Vienna","Europe/Zurich"]},{"name":"Central Europe Standard Time","abbr":"CEDT","offset":2,"isdst":true,"text":"(UTC+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague","utc":["Europe/Belgrade","Europe/Bratislava","Europe/Budapest","Europe/Ljubljana","Europe/Podgorica","Europe/Prague","Europe/Tirane"]},{"name":"Romance Standard Time","abbr":"RDT","offset":2,"isdst":true,"text":"(UTC+01:00) Brussels, Copenhagen, Madrid, Paris","utc":["Africa/Ceuta","Europe/Brussels","Europe/Copenhagen","Europe/Madrid","Europe/Paris"]},{"name":"Central European Standard Time","abbr":"CEDT","offset":2,"isdst":true,"text":"(UTC+01:00) Sarajevo, Skopje, Warsaw, Zagreb","utc":["Europe/Sarajevo","Europe/Skopje","Europe/Warsaw","Europe/Zagreb"]},{"name":"W. Central Africa Standard Time","abbr":"WCAST","offset":1,"isdst":false,"text":"(UTC+01:00) West Central Africa","utc":["Africa/Algiers","Africa/Bangui","Africa/Brazzaville","Africa/Douala","Africa/Kinshasa","Africa/Lagos","Africa/Libreville","Africa/Luanda","Africa/Malabo","Africa/Ndjamena","Africa/Niamey","Africa/Porto-Novo","Africa/Tunis","Etc/GMT-1"]},{"name":"Namibia Standard Time","abbr":"NST","offset":1,"isdst":false,"text":"(UTC+01:00) Windhoek","utc":["Africa/Windhoek"]},{"name":"GTB Standard Time","abbr":"GDT","offset":3,"isdst":true,"text":"(UTC+02:00) Athens, Bucharest","utc":["Asia/Nicosia","Europe/Athens","Europe/Bucharest","Europe/Chisinau"]},{"name":"Middle East Standard Time","abbr":"MEDT","offset":3,"isdst":true,"text":"(UTC+02:00) Beirut","utc":["Asia/Beirut"]},{"name":"Egypt Standard Time","abbr":"EST","offset":2,"isdst":false,"text":"(UTC+02:00) Cairo","utc":["Africa/Cairo"]},{"name":"Syria Standard Time","abbr":"SDT","offset":3,"isdst":true,"text":"(UTC+02:00) Damascus","utc":["Asia/Damascus"]},{"name":"E. Europe Standard Time","abbr":"EEDT","offset":3,"isdst":true,"text":"(UTC+02:00) E. Europe"},{"name":"South Africa Standard Time","abbr":"SAST","offset":2,"isdst":false,"text":"(UTC+02:00) Harare, Pretoria","utc":["Africa/Blantyre","Africa/Bujumbura","Africa/Gaborone","Africa/Harare","Africa/Johannesburg","Africa/Kigali","Africa/Lubumbashi","Africa/Lusaka","Africa/Maputo","Africa/Maseru","Africa/Mbabane","Etc/GMT-2"]},{"name":"FLE Standard Time","abbr":"FDT","offset":3,"isdst":true,"text":"(UTC+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius","utc":["Europe/Helsinki","Europe/Kiev","Europe/Mariehamn","Europe/Riga","Europe/Sofia","Europe/Tallinn","Europe/Uzhgorod","Europe/Vilnius","Europe/Zaporozhye"]},{"name":"Turkey Standard Time","abbr":"TDT","offset":3,"isdst":true,"text":"(UTC+02:00) Istanbul","utc":["Europe/Istanbul"]},{"name":"Israel Standard Time","abbr":"JDT","offset":3,"isdst":true,"text":"(UTC+02:00) Jerusalem","utc":["Asia/Jerusalem"]},{"name":"Libya Standard Time","abbr":"LST","offset":2,"isdst":false,"text":"(UTC+02:00) Tripoli","utc":["Africa/Tripoli"]},{"name":"Jordan Standard Time","abbr":"JST","offset":3,"isdst":false,"text":"(UTC+03:00) Amman","utc":["Asia/Amman"]},{"name":"Arabic Standard Time","abbr":"AST","offset":3,"isdst":false,"text":"(UTC+03:00) Baghdad","utc":["Asia/Baghdad"]},{"name":"Kaliningrad Standard Time","abbr":"KST","offset":3,"isdst":false,"text":"(UTC+03:00) Kaliningrad, Minsk","utc":["Europe/Kaliningrad","Europe/Minsk"]},{"name":"Arab Standard Time","abbr":"AST","offset":3,"isdst":false,"text":"(UTC+03:00) Kuwait, Riyadh","utc":["Asia/Aden","Asia/Bahrain","Asia/Kuwait","Asia/Qatar","Asia/Riyadh"]},{"name":"E. Africa Standard Time","abbr":"EAST","offset":3,"isdst":false,"text":"(UTC+03:00) Nairobi","utc":["Africa/Addis_Ababa","Africa/Asmera","Africa/Dar_es_Salaam","Africa/Djibouti","Africa/Juba","Africa/Kampala","Africa/Khartoum","Africa/Mogadishu","Africa/Nairobi","Antarctica/Syowa","Etc/GMT-3","Indian/Antananarivo","Indian/Comoro","Indian/Mayotte"]},{"name":"Iran Standard Time","abbr":"IDT","offset":4.5,"isdst":true,"text":"(UTC+03:30) Tehran","utc":["Asia/Tehran"]},{"name":"Arabian Standard Time","abbr":"AST","offset":4,"isdst":false,"text":"(UTC+04:00) Abu Dhabi, Muscat","utc":["Asia/Dubai","Asia/Muscat","Etc/GMT-4"]},{"name":"Azerbaijan Standard Time","abbr":"ADT","offset":5,"isdst":true,"text":"(UTC+04:00) Baku","utc":["Asia/Baku"]},{"name":"Russian Standard Time","abbr":"RST","offset":4,"isdst":false,"text":"(UTC+04:00) Moscow, St. Petersburg, Volgograd","utc":["Europe/Moscow","Europe/Samara","Europe/Simferopol","Europe/Volgograd"]},{"name":"Mauritius Standard Time","abbr":"MST","offset":4,"isdst":false,"text":"(UTC+04:00) Port Louis","utc":["Indian/Mahe","Indian/Mauritius","Indian/Reunion"]},{"name":"Georgian Standard Time","abbr":"GST","offset":4,"isdst":false,"text":"(UTC+04:00) Tbilisi","utc":["Asia/Tbilisi"]},{"name":"Caucasus Standard Time","abbr":"CST","offset":4,"isdst":false,"text":"(UTC+04:00) Yerevan","utc":["Asia/Yerevan"]},{"name":"Afghanistan Standard Time","abbr":"AST","offset":4.5,"isdst":false,"text":"(UTC+04:30) Kabul","utc":["Asia/Kabul"]},{"name":"West Asia Standard Time","abbr":"WAST","offset":5,"isdst":false,"text":"(UTC+05:00) Ashgabat, Tashkent","utc":["Antarctica/Mawson","Asia/Aqtau","Asia/Aqtobe","Asia/Ashgabat","Asia/Dushanbe","Asia/Oral","Asia/Samarkand","Asia/Tashkent","Etc/GMT-5","Indian/Kerguelen","Indian/Maldives"]},{"name":"Pakistan Standard Time","abbr":"PST","offset":5,"isdst":false,"text":"(UTC+05:00) Islamabad, Karachi","utc":["Asia/Karachi"]},{"name":"India Standard Time","abbr":"IST","offset":5.5,"isdst":false,"text":"(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi","utc":["Asia/Calcutta"]},{"name":"Sri Lanka Standard Time","abbr":"SLST","offset":5.5,"isdst":false,"text":"(UTC+05:30) Sri Jayawardenepura","utc":["Asia/Colombo"]},{"name":"Nepal Standard Time","abbr":"NST","offset":5.75,"isdst":false,"text":"(UTC+05:45) Kathmandu","utc":["Asia/Katmandu"]},{"name":"Central Asia Standard Time","abbr":"CAST","offset":6,"isdst":false,"text":"(UTC+06:00) Astana","utc":["Antarctica/Vostok","Asia/Almaty","Asia/Bishkek","Asia/Qyzylorda","Asia/Urumqi","Etc/GMT-6","Indian/Chagos"]},{"name":"Bangladesh Standard Time","abbr":"BST","offset":6,"isdst":false,"text":"(UTC+06:00) Dhaka","utc":["Asia/Dhaka","Asia/Thimphu"]},{"name":"Ekaterinburg Standard Time","abbr":"EST","offset":6,"isdst":false,"text":"(UTC+06:00) Ekaterinburg","utc":["Asia/Yekaterinburg"]},{"name":"Myanmar Standard Time","abbr":"MST","offset":6.5,"isdst":false,"text":"(UTC+06:30) Yangon (Rangoon)","utc":["Asia/Rangoon","Indian/Cocos"]},{"name":"SE Asia Standard Time","abbr":"SAST","offset":7,"isdst":false,"text":"(UTC+07:00) Bangkok, Hanoi, Jakarta","utc":["Antarctica/Davis","Asia/Bangkok","Asia/Hovd","Asia/Jakarta","Asia/Phnom_Penh","Asia/Pontianak","Asia/Saigon","Asia/Vientiane","Etc/GMT-7","Indian/Christmas"]},{"name":"N. Central Asia Standard Time","abbr":"NCAST","offset":7,"isdst":false,"text":"(UTC+07:00) Novosibirsk","utc":["Asia/Novokuznetsk","Asia/Novosibirsk","Asia/Omsk"]},{"name":"China Standard Time","abbr":"CST","offset":8,"isdst":false,"text":"(UTC+08:00) Beijing, Chongqing, Hong Kong, Urumqi","utc":["Asia/Hong_Kong","Asia/Macau","Asia/Shanghai"]},{"name":"North Asia Standard Time","abbr":"NAST","offset":8,"isdst":false,"text":"(UTC+08:00) Krasnoyarsk","utc":["Asia/Krasnoyarsk"]},{"name":"Singapore Standard Time","abbr":"MPST","offset":8,"isdst":false,"text":"(UTC+08:00) Kuala Lumpur, Singapore","utc":["Asia/Brunei","Asia/Kuala_Lumpur","Asia/Kuching","Asia/Makassar","Asia/Manila","Asia/Singapore","Etc/GMT-8"]},{"name":"W. Australia Standard Time","abbr":"WAST","offset":8,"isdst":false,"text":"(UTC+08:00) Perth","utc":["Antarctica/Casey","Australia/Perth"]},{"name":"Taipei Standard Time","abbr":"TST","offset":8,"isdst":false,"text":"(UTC+08:00) Taipei","utc":["Asia/Taipei"]},{"name":"Ulaanbaatar Standard Time","abbr":"UST","offset":8,"isdst":false,"text":"(UTC+08:00) Ulaanbaatar","utc":["Asia/Choibalsan","Asia/Ulaanbaatar"]},{"name":"North Asia East Standard Time","abbr":"NAEST","offset":9,"isdst":false,"text":"(UTC+09:00) Irkutsk","utc":["Asia/Irkutsk"]},{"name":"Tokyo Standard Time","abbr":"TST","offset":9,"isdst":false,"text":"(UTC+09:00) Osaka, Sapporo, Tokyo","utc":["Asia/Dili","Asia/Jayapura","Asia/Tokyo","Etc/GMT-9","Pacific/Palau"]},{"name":"Korea Standard Time","abbr":"KST","offset":9,"isdst":false,"text":"(UTC+09:00) Seoul","utc":["Asia/Pyongyang","Asia/Seoul"]},{"name":"Cen. Australia Standard Time","abbr":"CAST","offset":9.5,"isdst":false,"text":"(UTC+09:30) Adelaide","utc":["Australia/Adelaide","Australia/Broken_Hill"]},{"name":"AUS Central Standard Time","abbr":"ACST","offset":9.5,"isdst":false,"text":"(UTC+09:30) Darwin","utc":["Australia/Darwin"]},{"name":"E. Australia Standard Time","abbr":"EAST","offset":10,"isdst":false,"text":"(UTC+10:00) Brisbane","utc":["Australia/Brisbane","Australia/Lindeman"]},{"name":"AUS Eastern Standard Time","abbr":"AEST","offset":10,"isdst":false,"text":"(UTC+10:00) Canberra, Melbourne, Sydney","utc":["Australia/Melbourne","Australia/Sydney"]},{"name":"West Pacific Standard Time","abbr":"WPST","offset":10,"isdst":false,"text":"(UTC+10:00) Guam, Port Moresby","utc":["Antarctica/DumontDUrville","Etc/GMT-10","Pacific/Guam","Pacific/Port_Moresby","Pacific/Saipan","Pacific/Truk"]},{"name":"Tasmania Standard Time","abbr":"TST","offset":10,"isdst":false,"text":"(UTC+10:00) Hobart","utc":["Australia/Currie","Australia/Hobart"]},{"name":"Yakutsk Standard Time","abbr":"YST","offset":10,"isdst":false,"text":"(UTC+10:00) Yakutsk","utc":["Asia/Chita","Asia/Khandyga","Asia/Yakutsk"]},{"name":"Central Pacific Standard Time","abbr":"CPST","offset":11,"isdst":false,"text":"(UTC+11:00) Solomon Is., New Caledonia","utc":["Antarctica/Macquarie","Etc/GMT-11","Pacific/Efate","Pacific/Guadalcanal","Pacific/Kosrae","Pacific/Noumea","Pacific/Ponape"]},{"name":"Vladivostok Standard Time","abbr":"VST","offset":11,"isdst":false,"text":"(UTC+11:00) Vladivostok","utc":["Asia/Sakhalin","Asia/Ust-Nera","Asia/Vladivostok"]},{"name":"New Zealand Standard Time","abbr":"NZST","offset":12,"isdst":false,"text":"(UTC+12:00) Auckland, Wellington","utc":["Antarctica/McMurdo","Pacific/Auckland"]},{"name":"UTC+12","abbr":"U","offset":12,"isdst":false,"text":"(UTC+12:00) Coordinated Universal Time+12","utc":["Etc/GMT-12","Pacific/Funafuti","Pacific/Kwajalein","Pacific/Majuro","Pacific/Nauru","Pacific/Tarawa","Pacific/Wake","Pacific/Wallis"]},{"name":"Fiji Standard Time","abbr":"FST","offset":12,"isdst":false,"text":"(UTC+12:00) Fiji","utc":["Pacific/Fiji"]},{"name":"Magadan Standard Time","abbr":"MST","offset":12,"isdst":false,"text":"(UTC+12:00) Magadan","utc":["Asia/Anadyr","Asia/Kamchatka","Asia/Magadan","Asia/Srednekolymsk"]},{"name":"Kamchatka Standard Time","abbr":"KDT","offset":13,"isdst":true,"text":"(UTC+12:00) Petropavlovsk-Kamchatsky - Old"},{"name":"Tonga Standard Time","abbr":"TST","offset":13,"isdst":false,"text":"(UTC+13:00) Nuku'alofa","utc":["Etc/GMT-13","Pacific/Enderbury","Pacific/Fakaofo","Pacific/Tongatapu"]},{"name":"Samoa Standard Time","abbr":"SST","offset":13,"isdst":false,"text":"(UTC+13:00) Samoa","utc":["Pacific/Apia"]}]};var o_hasOwnProperty=Object.prototype.hasOwnProperty;var o_keys=Object.keys||function(obj){var result=[];for(var key in obj){if(o_hasOwnProperty.call(obj,key)){result.push(key);}}return result;};function _copyObject(source,target){var keys=o_keys(source);var key;for(var i=0,l=keys.length;i<l;i++){key=keys[i];target[key]=source[key]||target[key];}}function _copyArray(source,target){for(var i=0,l=source.length;i<l;i++){target[i]=source[i];}}function copyObject(source,_target){var isArray=Array.isArray(source);var target=_target||(isArray?new Array(source.length):{});if(isArray){_copyArray(source,target);}else{_copyObject(source,target);}return target;}/** Get the data based on key**/Chance.prototype.get=function(name){return copyObject(data[name]);};// Mac Address
Chance.prototype.mac_address=function(options){// typically mac addresses are separated by ":"
// however they can also be separated by "-"
// the network variant uses a dot every fourth byte
options=initOptions(options);if(!options.separator){options.separator=options.networkVersion?".":":";}var mac_pool="ABCDEF1234567890",mac="";if(!options.networkVersion){mac=this.n(this.string,6,{pool:mac_pool,length:2}).join(options.separator);}else{mac=this.n(this.string,3,{pool:mac_pool,length:4}).join(options.separator);}return mac;};Chance.prototype.normal=function(options){options=initOptions(options,{mean:0,dev:1,pool:[]});testRange(options.pool.constructor!==Array,"Chance: The pool option must be a valid array.");// If a pool has been passed, then we are returning an item from that pool,
// using the normal distribution settings that were passed in
if(options.pool.length>0){return this.normal_pool(options);}// The Marsaglia Polar method
var s,u,v,norm,mean=options.mean,dev=options.dev;do{// U and V are from the uniform distribution on (-1, 1)
u=this.random()*2-1;v=this.random()*2-1;s=u*u+v*v;}while(s>=1);// Compute the standard normal variate
norm=u*Math.sqrt(-2*Math.log(s)/s);// Shape and scale
return dev*norm+mean;};Chance.prototype.normal_pool=function(options){var performanceCounter=0;do{var idx=Math.round(this.normal({mean:options.mean,dev:options.dev}));if(idx<options.pool.length&&idx>=0){return options.pool[idx];}else{performanceCounter++;}}while(performanceCounter<100);throw new RangeError("Chance: Your pool is too small for the given mean and standard deviation. Please adjust.");};Chance.prototype.radio=function(options){// Initial Letter (Typically Designated by Side of Mississippi River)
options=initOptions(options,{side:"?"});var fl="";switch(options.side.toLowerCase()){case"east":case"e":fl="W";break;case"west":case"w":fl="K";break;default:fl=this.character({pool:"KW"});break;}return fl+this.character({alpha:true,casing:"upper"})+this.character({alpha:true,casing:"upper"})+this.character({alpha:true,casing:"upper"});};// Set the data as key and data or the data map
Chance.prototype.set=function(name,values){if(typeof name==="string"){data[name]=values;}else{data=copyObject(name,data);}};Chance.prototype.tv=function(options){return this.radio(options);};// ID number for Brazil companies
Chance.prototype.cnpj=function(){var n=this.n(this.natural,8,{max:9});var d1=2+n[7]*6+n[6]*7+n[5]*8+n[4]*9+n[3]*2+n[2]*3+n[1]*4+n[0]*5;d1=11-d1%11;if(d1>=10){d1=0;}var d2=d1*2+3+n[7]*7+n[6]*8+n[5]*9+n[4]*2+n[3]*3+n[2]*4+n[1]*5+n[0]*6;d2=11-d2%11;if(d2>=10){d2=0;}return''+n[0]+n[1]+'.'+n[2]+n[3]+n[4]+'.'+n[5]+n[6]+n[7]+'/0001-'+d1+d2;};// -- End Miscellaneous --
Chance.prototype.mersenne_twister=function(seed){return new MersenneTwister(seed);};Chance.prototype.blueimp_md5=function(){return new BlueImpMD5();};// Mersenne Twister from https://gist.github.com/banksean/300494
var MersenneTwister=function MersenneTwister(seed){if(seed===undefined){// kept random number same size as time used previously to ensure no unexpected results downstream
seed=Math.floor(Math.random()*Math.pow(10,13));}/* Period parameters */this.N=624;this.M=397;this.MATRIX_A=0x9908b0df;/* constant vector a */this.UPPER_MASK=0x80000000;/* most significant w-r bits */this.LOWER_MASK=0x7fffffff;/* least significant r bits */this.mt=new Array(this.N);/* the array for the state vector */this.mti=this.N+1;/* mti==N + 1 means mt[N] is not initialized */this.init_genrand(seed);};/* initializes mt[N] with a seed */MersenneTwister.prototype.init_genrand=function(s){this.mt[0]=s>>>0;for(this.mti=1;this.mti<this.N;this.mti++){s=this.mt[this.mti-1]^this.mt[this.mti-1]>>>30;this.mt[this.mti]=(((s&0xffff0000)>>>16)*1812433253<<16)+(s&0x0000ffff)*1812433253+this.mti;/* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. *//* In the previous versions, MSBs of the seed affect   *//* only MSBs of the array mt[].                        *//* 2002/01/09 modified by Makoto Matsumoto             */this.mt[this.mti]>>>=0;}};/* initialize by an array with array-length *//* init_key is the array for initializing keys *//* key_length is its length *//* slight change for C++, 2004/2/26 */MersenneTwister.prototype.init_by_array=function(init_key,key_length){var i=1,j=0,k,s;this.init_genrand(19650218);k=this.N>key_length?this.N:key_length;for(;k;k--){s=this.mt[i-1]^this.mt[i-1]>>>30;this.mt[i]=(this.mt[i]^(((s&0xffff0000)>>>16)*1664525<<16)+(s&0x0000ffff)*1664525)+init_key[j]+j;/* non linear */this.mt[i]>>>=0;/* for WORDSIZE > 32 machines */i++;j++;if(i>=this.N){this.mt[0]=this.mt[this.N-1];i=1;}if(j>=key_length){j=0;}}for(k=this.N-1;k;k--){s=this.mt[i-1]^this.mt[i-1]>>>30;this.mt[i]=(this.mt[i]^(((s&0xffff0000)>>>16)*1566083941<<16)+(s&0x0000ffff)*1566083941)-i;/* non linear */this.mt[i]>>>=0;/* for WORDSIZE > 32 machines */i++;if(i>=this.N){this.mt[0]=this.mt[this.N-1];i=1;}}this.mt[0]=0x80000000;/* MSB is 1; assuring non-zero initial array */};/* generates a random number on [0,0xffffffff]-interval */MersenneTwister.prototype.genrand_int32=function(){var y;var mag01=new Array(0x0,this.MATRIX_A);/* mag01[x] = x * MATRIX_A  for x=0,1 */if(this.mti>=this.N){var kk;if(this.mti===this.N+1){this.init_genrand(5489);/* a default initial seed is used */}for(kk=0;kk<this.N-this.M;kk++){y=this.mt[kk]&this.UPPER_MASK|this.mt[kk+1]&this.LOWER_MASK;this.mt[kk]=this.mt[kk+this.M]^y>>>1^mag01[y&0x1];}for(;kk<this.N-1;kk++){y=this.mt[kk]&this.UPPER_MASK|this.mt[kk+1]&this.LOWER_MASK;this.mt[kk]=this.mt[kk+(this.M-this.N)]^y>>>1^mag01[y&0x1];}y=this.mt[this.N-1]&this.UPPER_MASK|this.mt[0]&this.LOWER_MASK;this.mt[this.N-1]=this.mt[this.M-1]^y>>>1^mag01[y&0x1];this.mti=0;}y=this.mt[this.mti++];/* Tempering */y^=y>>>11;y^=y<<7&0x9d2c5680;y^=y<<15&0xefc60000;y^=y>>>18;return y>>>0;};/* generates a random number on [0,0x7fffffff]-interval */MersenneTwister.prototype.genrand_int31=function(){return this.genrand_int32()>>>1;};/* generates a random number on [0,1]-real-interval */MersenneTwister.prototype.genrand_real1=function(){return this.genrand_int32()*(1.0/4294967295.0);/* divided by 2^32-1 */};/* generates a random number on [0,1)-real-interval */MersenneTwister.prototype.random=function(){return this.genrand_int32()*(1.0/4294967296.0);/* divided by 2^32 */};/* generates a random number on (0,1)-real-interval */MersenneTwister.prototype.genrand_real3=function(){return(this.genrand_int32()+0.5)*(1.0/4294967296.0);/* divided by 2^32 */};/* generates a random number on [0,1) with 53-bit resolution*/MersenneTwister.prototype.genrand_res53=function(){var a=this.genrand_int32()>>>5,b=this.genrand_int32()>>>6;return(a*67108864.0+b)*(1.0/9007199254740992.0);};// BlueImp MD5 hashing algorithm from https://github.com/blueimp/JavaScript-MD5
var BlueImpMD5=function BlueImpMD5(){};BlueImpMD5.prototype.VERSION='1.0.1';/*
    * Add integers, wrapping at 2^32. This uses 16-bit operations internally
    * to work around bugs in some JS interpreters.
    */BlueImpMD5.prototype.safe_add=function safe_add(x,y){var lsw=(x&0xFFFF)+(y&0xFFFF),msw=(x>>16)+(y>>16)+(lsw>>16);return msw<<16|lsw&0xFFFF;};/*
    * Bitwise rotate a 32-bit number to the left.
    */BlueImpMD5.prototype.bit_roll=function(num,cnt){return num<<cnt|num>>>32-cnt;};/*
    * These functions implement the five basic operations the algorithm uses.
    */BlueImpMD5.prototype.md5_cmn=function(q,a,b,x,s,t){return this.safe_add(this.bit_roll(this.safe_add(this.safe_add(a,q),this.safe_add(x,t)),s),b);};BlueImpMD5.prototype.md5_ff=function(a,b,c,d,x,s,t){return this.md5_cmn(b&c|~b&d,a,b,x,s,t);};BlueImpMD5.prototype.md5_gg=function(a,b,c,d,x,s,t){return this.md5_cmn(b&d|c&~d,a,b,x,s,t);};BlueImpMD5.prototype.md5_hh=function(a,b,c,d,x,s,t){return this.md5_cmn(b^c^d,a,b,x,s,t);};BlueImpMD5.prototype.md5_ii=function(a,b,c,d,x,s,t){return this.md5_cmn(c^(b|~d),a,b,x,s,t);};/*
    * Calculate the MD5 of an array of little-endian words, and a bit length.
    */BlueImpMD5.prototype.binl_md5=function(x,len){/* append padding */x[len>>5]|=0x80<<len%32;x[(len+64>>>9<<4)+14]=len;var i,olda,oldb,oldc,oldd,a=1732584193,b=-271733879,c=-1732584194,d=271733878;for(i=0;i<x.length;i+=16){olda=a;oldb=b;oldc=c;oldd=d;a=this.md5_ff(a,b,c,d,x[i],7,-680876936);d=this.md5_ff(d,a,b,c,x[i+1],12,-389564586);c=this.md5_ff(c,d,a,b,x[i+2],17,606105819);b=this.md5_ff(b,c,d,a,x[i+3],22,-1044525330);a=this.md5_ff(a,b,c,d,x[i+4],7,-176418897);d=this.md5_ff(d,a,b,c,x[i+5],12,1200080426);c=this.md5_ff(c,d,a,b,x[i+6],17,-1473231341);b=this.md5_ff(b,c,d,a,x[i+7],22,-45705983);a=this.md5_ff(a,b,c,d,x[i+8],7,1770035416);d=this.md5_ff(d,a,b,c,x[i+9],12,-1958414417);c=this.md5_ff(c,d,a,b,x[i+10],17,-42063);b=this.md5_ff(b,c,d,a,x[i+11],22,-1990404162);a=this.md5_ff(a,b,c,d,x[i+12],7,1804603682);d=this.md5_ff(d,a,b,c,x[i+13],12,-40341101);c=this.md5_ff(c,d,a,b,x[i+14],17,-1502002290);b=this.md5_ff(b,c,d,a,x[i+15],22,1236535329);a=this.md5_gg(a,b,c,d,x[i+1],5,-165796510);d=this.md5_gg(d,a,b,c,x[i+6],9,-1069501632);c=this.md5_gg(c,d,a,b,x[i+11],14,643717713);b=this.md5_gg(b,c,d,a,x[i],20,-373897302);a=this.md5_gg(a,b,c,d,x[i+5],5,-701558691);d=this.md5_gg(d,a,b,c,x[i+10],9,38016083);c=this.md5_gg(c,d,a,b,x[i+15],14,-660478335);b=this.md5_gg(b,c,d,a,x[i+4],20,-405537848);a=this.md5_gg(a,b,c,d,x[i+9],5,568446438);d=this.md5_gg(d,a,b,c,x[i+14],9,-1019803690);c=this.md5_gg(c,d,a,b,x[i+3],14,-187363961);b=this.md5_gg(b,c,d,a,x[i+8],20,1163531501);a=this.md5_gg(a,b,c,d,x[i+13],5,-1444681467);d=this.md5_gg(d,a,b,c,x[i+2],9,-51403784);c=this.md5_gg(c,d,a,b,x[i+7],14,1735328473);b=this.md5_gg(b,c,d,a,x[i+12],20,-1926607734);a=this.md5_hh(a,b,c,d,x[i+5],4,-378558);d=this.md5_hh(d,a,b,c,x[i+8],11,-2022574463);c=this.md5_hh(c,d,a,b,x[i+11],16,1839030562);b=this.md5_hh(b,c,d,a,x[i+14],23,-35309556);a=this.md5_hh(a,b,c,d,x[i+1],4,-1530992060);d=this.md5_hh(d,a,b,c,x[i+4],11,1272893353);c=this.md5_hh(c,d,a,b,x[i+7],16,-155497632);b=this.md5_hh(b,c,d,a,x[i+10],23,-1094730640);a=this.md5_hh(a,b,c,d,x[i+13],4,681279174);d=this.md5_hh(d,a,b,c,x[i],11,-358537222);c=this.md5_hh(c,d,a,b,x[i+3],16,-722521979);b=this.md5_hh(b,c,d,a,x[i+6],23,76029189);a=this.md5_hh(a,b,c,d,x[i+9],4,-640364487);d=this.md5_hh(d,a,b,c,x[i+12],11,-421815835);c=this.md5_hh(c,d,a,b,x[i+15],16,530742520);b=this.md5_hh(b,c,d,a,x[i+2],23,-995338651);a=this.md5_ii(a,b,c,d,x[i],6,-198630844);d=this.md5_ii(d,a,b,c,x[i+7],10,1126891415);c=this.md5_ii(c,d,a,b,x[i+14],15,-1416354905);b=this.md5_ii(b,c,d,a,x[i+5],21,-57434055);a=this.md5_ii(a,b,c,d,x[i+12],6,1700485571);d=this.md5_ii(d,a,b,c,x[i+3],10,-1894986606);c=this.md5_ii(c,d,a,b,x[i+10],15,-1051523);b=this.md5_ii(b,c,d,a,x[i+1],21,-2054922799);a=this.md5_ii(a,b,c,d,x[i+8],6,1873313359);d=this.md5_ii(d,a,b,c,x[i+15],10,-30611744);c=this.md5_ii(c,d,a,b,x[i+6],15,-1560198380);b=this.md5_ii(b,c,d,a,x[i+13],21,1309151649);a=this.md5_ii(a,b,c,d,x[i+4],6,-145523070);d=this.md5_ii(d,a,b,c,x[i+11],10,-1120210379);c=this.md5_ii(c,d,a,b,x[i+2],15,718787259);b=this.md5_ii(b,c,d,a,x[i+9],21,-343485551);a=this.safe_add(a,olda);b=this.safe_add(b,oldb);c=this.safe_add(c,oldc);d=this.safe_add(d,oldd);}return[a,b,c,d];};/*
    * Convert an array of little-endian words to a string
    */BlueImpMD5.prototype.binl2rstr=function(input){var i,output='';for(i=0;i<input.length*32;i+=8){output+=String.fromCharCode(input[i>>5]>>>i%32&0xFF);}return output;};/*
    * Convert a raw string to an array of little-endian words
    * Characters >255 have their high-byte silently ignored.
    */BlueImpMD5.prototype.rstr2binl=function(input){var i,output=[];output[(input.length>>2)-1]=undefined;for(i=0;i<output.length;i+=1){output[i]=0;}for(i=0;i<input.length*8;i+=8){output[i>>5]|=(input.charCodeAt(i/8)&0xFF)<<i%32;}return output;};/*
    * Calculate the MD5 of a raw string
    */BlueImpMD5.prototype.rstr_md5=function(s){return this.binl2rstr(this.binl_md5(this.rstr2binl(s),s.length*8));};/*
    * Calculate the HMAC-MD5, of a key and some data (raw strings)
    */BlueImpMD5.prototype.rstr_hmac_md5=function(key,data){var i,bkey=this.rstr2binl(key),ipad=[],opad=[],hash;ipad[15]=opad[15]=undefined;if(bkey.length>16){bkey=this.binl_md5(bkey,key.length*8);}for(i=0;i<16;i+=1){ipad[i]=bkey[i]^0x36363636;opad[i]=bkey[i]^0x5C5C5C5C;}hash=this.binl_md5(ipad.concat(this.rstr2binl(data)),512+data.length*8);return this.binl2rstr(this.binl_md5(opad.concat(hash),512+128));};/*
    * Convert a raw string to a hex string
    */BlueImpMD5.prototype.rstr2hex=function(input){var hex_tab='0123456789abcdef',output='',x,i;for(i=0;i<input.length;i+=1){x=input.charCodeAt(i);output+=hex_tab.charAt(x>>>4&0x0F)+hex_tab.charAt(x&0x0F);}return output;};/*
    * Encode a string as utf-8
    */BlueImpMD5.prototype.str2rstr_utf8=function(input){return unescape(encodeURIComponent(input));};/*
    * Take string arguments and return either raw or hex encoded strings
    */BlueImpMD5.prototype.raw_md5=function(s){return this.rstr_md5(this.str2rstr_utf8(s));};BlueImpMD5.prototype.hex_md5=function(s){return this.rstr2hex(this.raw_md5(s));};BlueImpMD5.prototype.raw_hmac_md5=function(k,d){return this.rstr_hmac_md5(this.str2rstr_utf8(k),this.str2rstr_utf8(d));};BlueImpMD5.prototype.hex_hmac_md5=function(k,d){return this.rstr2hex(this.raw_hmac_md5(k,d));};BlueImpMD5.prototype.md5=function(string,key,raw){if(!key){if(!raw){return this.hex_md5(string);}return this.raw_md5(string);}if(!raw){return this.hex_hmac_md5(key,string);}return this.raw_hmac_md5(key,string);};// CommonJS module
if(typeof exports!=='undefined'){if(typeof module!=='undefined'&&module.exports){exports=module.exports=Chance;}exports.Chance=Chance;}// Register as an anonymous AMD module
if(typeof define==='function'&&define.amd){define([],function(){return Chance;});}// if there is a importsScrips object define chance for worker
if(typeof importScripts!=='undefined'){chance=new Chance();}// If there is a window object, that at least has a document property,
// instantiate and define chance on the window
if((typeof window==='undefined'?'undefined':_typeof(window))==="object"&&_typeof(window.document)==="object"){window.Chance=Chance;window.chance=new Chance();}})();

}).call(this,require("buffer").Buffer)
},{"buffer":23}],9:[function(require,module,exports){
(function (global){
"use strict";var _typeof=typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"?function(obj){return typeof obj;}:function(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj;};/**
 * React v0.13.3
 *
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */!function(e){if("object"==(typeof exports==="undefined"?"undefined":_typeof(exports))&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var t;t="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,t.React=e();}}(function(){return function e(t,n,r){function o(a,u){if(!n[a]){if(!t[a]){var s="function"==typeof require&&require;if(!u&&s)return s(a,!0);if(i)return i(a,!0);var l=new Error("Cannot find module '"+a+"'");throw l.code="MODULE_NOT_FOUND",l;}var c=n[a]={exports:{}};t[a][0].call(c.exports,function(e){var n=t[a][1][e];return o(n?n:e);},c,c.exports,e,t,n,r);}return n[a].exports;}for(var i="function"==typeof require&&require,a=0;a<r.length;a++){o(r[a]);}return o;}({1:[function(e,t,n){"use strict";var r=e(19),o=e(32),i=e(34),a=e(33),u=e(38),s=e(39),l=e(55),c=(e(56),e(40)),p=e(51),d=e(54),f=e(64),h=e(68),m=e(73),v=e(76),g=e(79),y=e(82),C=e(27),E=e(115),b=e(142);d.inject();var _=l.createElement,x=l.createFactory,D=l.cloneElement,M=m.measure("React","render",h.render),N={Children:{map:o.map,forEach:o.forEach,count:o.count,only:b},Component:i,DOM:c,PropTypes:v,initializeTouchEvents:function initializeTouchEvents(e){r.useTouchEvents=e;},createClass:a.createClass,createElement:_,cloneElement:D,createFactory:x,createMixin:function createMixin(e){return e;},constructAndRenderComponent:h.constructAndRenderComponent,constructAndRenderComponentByID:h.constructAndRenderComponentByID,findDOMNode:E,render:M,renderToString:y.renderToString,renderToStaticMarkup:y.renderToStaticMarkup,unmountComponentAtNode:h.unmountComponentAtNode,isValidElement:l.isValidElement,withContext:u.withContext,__spread:C};"undefined"!=typeof __REACT_DEVTOOLS_GLOBAL_HOOK__&&"function"==typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.inject&&__REACT_DEVTOOLS_GLOBAL_HOOK__.inject({CurrentOwner:s,InstanceHandles:f,Mount:h,Reconciler:g,TextComponent:p});N.version="0.13.3",t.exports=N;},{115:115,142:142,19:19,27:27,32:32,33:33,34:34,38:38,39:39,40:40,51:51,54:54,55:55,56:56,64:64,68:68,73:73,76:76,79:79,82:82}],2:[function(e,t,n){"use strict";var r=e(117),o={componentDidMount:function componentDidMount(){this.props.autoFocus&&r(this.getDOMNode());}};t.exports=o;},{117:117}],3:[function(e,t,n){"use strict";function r(){var e=window.opera;return"object"==(typeof e==="undefined"?"undefined":_typeof(e))&&"function"==typeof e.version&&parseInt(e.version(),10)<=12;}function o(e){return(e.ctrlKey||e.altKey||e.metaKey)&&!(e.ctrlKey&&e.altKey);}function i(e){switch(e){case T.topCompositionStart:return P.compositionStart;case T.topCompositionEnd:return P.compositionEnd;case T.topCompositionUpdate:return P.compositionUpdate;}}function a(e,t){return e===T.topKeyDown&&t.keyCode===b;}function u(e,t){switch(e){case T.topKeyUp:return-1!==E.indexOf(t.keyCode);case T.topKeyDown:return t.keyCode!==b;case T.topKeyPress:case T.topMouseDown:case T.topBlur:return!0;default:return!1;}}function s(e){var t=e.detail;return"object"==(typeof t==="undefined"?"undefined":_typeof(t))&&"data"in t?t.data:null;}function l(e,t,n,r){var o,l;if(_?o=i(e):w?u(e,r)&&(o=P.compositionEnd):a(e,r)&&(o=P.compositionStart),!o)return null;M&&(w||o!==P.compositionStart?o===P.compositionEnd&&w&&(l=w.getData()):w=v.getPooled(t));var c=g.getPooled(o,n,r);if(l)c.data=l;else{var p=s(r);null!==p&&(c.data=p);}return h.accumulateTwoPhaseDispatches(c),c;}function c(e,t){switch(e){case T.topCompositionEnd:return s(t);case T.topKeyPress:var n=t.which;return n!==N?null:(R=!0,I);case T.topTextInput:var r=t.data;return r===I&&R?null:r;default:return null;}}function p(e,t){if(w){if(e===T.topCompositionEnd||u(e,t)){var n=w.getData();return v.release(w),w=null,n;}return null;}switch(e){case T.topPaste:return null;case T.topKeyPress:return t.which&&!o(t)?String.fromCharCode(t.which):null;case T.topCompositionEnd:return M?null:t.data;default:return null;}}function d(e,t,n,r){var o;if(o=D?c(e,r):p(e,r),!o)return null;var i=y.getPooled(P.beforeInput,n,r);return i.data=o,h.accumulateTwoPhaseDispatches(i),i;}var f=e(15),h=e(20),m=e(21),v=e(22),g=e(91),y=e(95),C=e(139),E=[9,13,27,32],b=229,_=m.canUseDOM&&"CompositionEvent"in window,x=null;m.canUseDOM&&"documentMode"in document&&(x=document.documentMode);var D=m.canUseDOM&&"TextEvent"in window&&!x&&!r(),M=m.canUseDOM&&(!_||x&&x>8&&11>=x),N=32,I=String.fromCharCode(N),T=f.topLevelTypes,P={beforeInput:{phasedRegistrationNames:{bubbled:C({onBeforeInput:null}),captured:C({onBeforeInputCapture:null})},dependencies:[T.topCompositionEnd,T.topKeyPress,T.topTextInput,T.topPaste]},compositionEnd:{phasedRegistrationNames:{bubbled:C({onCompositionEnd:null}),captured:C({onCompositionEndCapture:null})},dependencies:[T.topBlur,T.topCompositionEnd,T.topKeyDown,T.topKeyPress,T.topKeyUp,T.topMouseDown]},compositionStart:{phasedRegistrationNames:{bubbled:C({onCompositionStart:null}),captured:C({onCompositionStartCapture:null})},dependencies:[T.topBlur,T.topCompositionStart,T.topKeyDown,T.topKeyPress,T.topKeyUp,T.topMouseDown]},compositionUpdate:{phasedRegistrationNames:{bubbled:C({onCompositionUpdate:null}),captured:C({onCompositionUpdateCapture:null})},dependencies:[T.topBlur,T.topCompositionUpdate,T.topKeyDown,T.topKeyPress,T.topKeyUp,T.topMouseDown]}},R=!1,w=null,O={eventTypes:P,extractEvents:function extractEvents(e,t,n,r){return[l(e,t,n,r),d(e,t,n,r)];}};t.exports=O;},{139:139,15:15,20:20,21:21,22:22,91:91,95:95}],4:[function(e,t,n){"use strict";function r(e,t){return e+t.charAt(0).toUpperCase()+t.substring(1);}var o={boxFlex:!0,boxFlexGroup:!0,columnCount:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,strokeDashoffset:!0,strokeOpacity:!0,strokeWidth:!0},i=["Webkit","ms","Moz","O"];Object.keys(o).forEach(function(e){i.forEach(function(t){o[r(t,e)]=o[e];});});var a={background:{backgroundImage:!0,backgroundPosition:!0,backgroundRepeat:!0,backgroundColor:!0},border:{borderWidth:!0,borderStyle:!0,borderColor:!0},borderBottom:{borderBottomWidth:!0,borderBottomStyle:!0,borderBottomColor:!0},borderLeft:{borderLeftWidth:!0,borderLeftStyle:!0,borderLeftColor:!0},borderRight:{borderRightWidth:!0,borderRightStyle:!0,borderRightColor:!0},borderTop:{borderTopWidth:!0,borderTopStyle:!0,borderTopColor:!0},font:{fontStyle:!0,fontVariant:!0,fontWeight:!0,fontSize:!0,lineHeight:!0,fontFamily:!0}},u={isUnitlessNumber:o,shorthandPropertyExpansions:a};t.exports=u;},{}],5:[function(e,t,n){"use strict";var r=e(4),o=e(21),i=(e(106),e(111)),a=e(131),u=e(141),s=(e(150),u(function(e){return a(e);})),l="cssFloat";o.canUseDOM&&void 0===document.documentElement.style.cssFloat&&(l="styleFloat");var c={createMarkupForStyles:function createMarkupForStyles(e){var t="";for(var n in e){if(e.hasOwnProperty(n)){var r=e[n];null!=r&&(t+=s(n)+":",t+=i(n,r)+";");}}return t||null;},setValueForStyles:function setValueForStyles(e,t){var n=e.style;for(var o in t){if(t.hasOwnProperty(o)){var a=i(o,t[o]);if("float"===o&&(o=l),a)n[o]=a;else{var u=r.shorthandPropertyExpansions[o];if(u)for(var s in u){n[s]="";}else n[o]="";}}}}};t.exports=c;},{106:106,111:111,131:131,141:141,150:150,21:21,4:4}],6:[function(e,t,n){"use strict";function r(){this._callbacks=null,this._contexts=null;}var o=e(28),i=e(27),a=e(133);i(r.prototype,{enqueue:function enqueue(e,t){this._callbacks=this._callbacks||[],this._contexts=this._contexts||[],this._callbacks.push(e),this._contexts.push(t);},notifyAll:function notifyAll(){var e=this._callbacks,t=this._contexts;if(e){a(e.length===t.length),this._callbacks=null,this._contexts=null;for(var n=0,r=e.length;r>n;n++){e[n].call(t[n]);}e.length=0,t.length=0;}},reset:function reset(){this._callbacks=null,this._contexts=null;},destructor:function destructor(){this.reset();}}),o.addPoolingTo(r),t.exports=r;},{133:133,27:27,28:28}],7:[function(e,t,n){"use strict";function r(e){return"SELECT"===e.nodeName||"INPUT"===e.nodeName&&"file"===e.type;}function o(e){var t=x.getPooled(T.change,R,e);E.accumulateTwoPhaseDispatches(t),_.batchedUpdates(i,t);}function i(e){C.enqueueEvents(e),C.processEventQueue();}function a(e,t){P=e,R=t,P.attachEvent("onchange",o);}function u(){P&&(P.detachEvent("onchange",o),P=null,R=null);}function s(e,t,n){return e===I.topChange?n:void 0;}function l(e,t,n){e===I.topFocus?(u(),a(t,n)):e===I.topBlur&&u();}function c(e,t){P=e,R=t,w=e.value,O=Object.getOwnPropertyDescriptor(e.constructor.prototype,"value"),Object.defineProperty(P,"value",k),P.attachEvent("onpropertychange",d);}function p(){P&&(delete P.value,P.detachEvent("onpropertychange",d),P=null,R=null,w=null,O=null);}function d(e){if("value"===e.propertyName){var t=e.srcElement.value;t!==w&&(w=t,o(e));}}function f(e,t,n){return e===I.topInput?n:void 0;}function h(e,t,n){e===I.topFocus?(p(),c(t,n)):e===I.topBlur&&p();}function m(e,t,n){return e!==I.topSelectionChange&&e!==I.topKeyUp&&e!==I.topKeyDown||!P||P.value===w?void 0:(w=P.value,R);}function v(e){return"INPUT"===e.nodeName&&("checkbox"===e.type||"radio"===e.type);}function g(e,t,n){return e===I.topClick?n:void 0;}var y=e(15),C=e(17),E=e(20),b=e(21),_=e(85),x=e(93),D=e(134),M=e(136),N=e(139),I=y.topLevelTypes,T={change:{phasedRegistrationNames:{bubbled:N({onChange:null}),captured:N({onChangeCapture:null})},dependencies:[I.topBlur,I.topChange,I.topClick,I.topFocus,I.topInput,I.topKeyDown,I.topKeyUp,I.topSelectionChange]}},P=null,R=null,w=null,O=null,S=!1;b.canUseDOM&&(S=D("change")&&(!("documentMode"in document)||document.documentMode>8));var A=!1;b.canUseDOM&&(A=D("input")&&(!("documentMode"in document)||document.documentMode>9));var k={get:function get(){return O.get.call(this);},set:function set(e){w=""+e,O.set.call(this,e);}},L={eventTypes:T,extractEvents:function extractEvents(e,t,n,o){var i,a;if(r(t)?S?i=s:a=l:M(t)?A?i=f:(i=m,a=h):v(t)&&(i=g),i){var u=i(e,t,n);if(u){var c=x.getPooled(T.change,u,o);return E.accumulateTwoPhaseDispatches(c),c;}}a&&a(e,t,n);}};t.exports=L;},{134:134,136:136,139:139,15:15,17:17,20:20,21:21,85:85,93:93}],8:[function(e,t,n){"use strict";var r=0,o={createReactRootIndex:function createReactRootIndex(){return r++;}};t.exports=o;},{}],9:[function(e,t,n){"use strict";function r(e,t,n){e.insertBefore(t,e.childNodes[n]||null);}var o=e(12),i=e(70),a=e(145),u=e(133),s={dangerouslyReplaceNodeWithMarkup:o.dangerouslyReplaceNodeWithMarkup,updateTextContent:a,processUpdates:function processUpdates(e,t){for(var n,s=null,l=null,c=0;c<e.length;c++){if(n=e[c],n.type===i.MOVE_EXISTING||n.type===i.REMOVE_NODE){var p=n.fromIndex,d=n.parentNode.childNodes[p],f=n.parentID;u(d),s=s||{},s[f]=s[f]||[],s[f][p]=d,l=l||[],l.push(d);}}var h=o.dangerouslyRenderMarkup(t);if(l)for(var m=0;m<l.length;m++){l[m].parentNode.removeChild(l[m]);}for(var v=0;v<e.length;v++){switch(n=e[v],n.type){case i.INSERT_MARKUP:r(n.parentNode,h[n.markupIndex],n.toIndex);break;case i.MOVE_EXISTING:r(n.parentNode,s[n.parentID][n.fromIndex],n.toIndex);break;case i.TEXT_CONTENT:a(n.parentNode,n.textContent);break;case i.REMOVE_NODE:}}}};t.exports=s;},{12:12,133:133,145:145,70:70}],10:[function(e,t,n){"use strict";function r(e,t){return(e&t)===t;}var o=e(133),i={MUST_USE_ATTRIBUTE:1,MUST_USE_PROPERTY:2,HAS_SIDE_EFFECTS:4,HAS_BOOLEAN_VALUE:8,HAS_NUMERIC_VALUE:16,HAS_POSITIVE_NUMERIC_VALUE:48,HAS_OVERLOADED_BOOLEAN_VALUE:64,injectDOMPropertyConfig:function injectDOMPropertyConfig(e){var t=e.Properties||{},n=e.DOMAttributeNames||{},a=e.DOMPropertyNames||{},s=e.DOMMutationMethods||{};e.isCustomAttribute&&u._isCustomAttributeFunctions.push(e.isCustomAttribute);for(var l in t){o(!u.isStandardName.hasOwnProperty(l)),u.isStandardName[l]=!0;var c=l.toLowerCase();if(u.getPossibleStandardName[c]=l,n.hasOwnProperty(l)){var p=n[l];u.getPossibleStandardName[p]=l,u.getAttributeName[l]=p;}else u.getAttributeName[l]=c;u.getPropertyName[l]=a.hasOwnProperty(l)?a[l]:l,s.hasOwnProperty(l)?u.getMutationMethod[l]=s[l]:u.getMutationMethod[l]=null;var d=t[l];u.mustUseAttribute[l]=r(d,i.MUST_USE_ATTRIBUTE),u.mustUseProperty[l]=r(d,i.MUST_USE_PROPERTY),u.hasSideEffects[l]=r(d,i.HAS_SIDE_EFFECTS),u.hasBooleanValue[l]=r(d,i.HAS_BOOLEAN_VALUE),u.hasNumericValue[l]=r(d,i.HAS_NUMERIC_VALUE),u.hasPositiveNumericValue[l]=r(d,i.HAS_POSITIVE_NUMERIC_VALUE),u.hasOverloadedBooleanValue[l]=r(d,i.HAS_OVERLOADED_BOOLEAN_VALUE),o(!u.mustUseAttribute[l]||!u.mustUseProperty[l]),o(u.mustUseProperty[l]||!u.hasSideEffects[l]),o(!!u.hasBooleanValue[l]+!!u.hasNumericValue[l]+!!u.hasOverloadedBooleanValue[l]<=1);}}},a={},u={ID_ATTRIBUTE_NAME:"data-reactid",isStandardName:{},getPossibleStandardName:{},getAttributeName:{},getPropertyName:{},getMutationMethod:{},mustUseAttribute:{},mustUseProperty:{},hasSideEffects:{},hasBooleanValue:{},hasNumericValue:{},hasPositiveNumericValue:{},hasOverloadedBooleanValue:{},_isCustomAttributeFunctions:[],isCustomAttribute:function isCustomAttribute(e){for(var t=0;t<u._isCustomAttributeFunctions.length;t++){var n=u._isCustomAttributeFunctions[t];if(n(e))return!0;}return!1;},getDefaultValueForProperty:function getDefaultValueForProperty(e,t){var n,r=a[e];return r||(a[e]=r={}),t in r||(n=document.createElement(e),r[t]=n[t]),r[t];},injection:i};t.exports=u;},{133:133}],11:[function(e,t,n){"use strict";function r(e,t){return null==t||o.hasBooleanValue[e]&&!t||o.hasNumericValue[e]&&isNaN(t)||o.hasPositiveNumericValue[e]&&1>t||o.hasOverloadedBooleanValue[e]&&t===!1;}var o=e(10),i=e(143),a=(e(150),{createMarkupForID:function createMarkupForID(e){return o.ID_ATTRIBUTE_NAME+"="+i(e);},createMarkupForProperty:function createMarkupForProperty(e,t){if(o.isStandardName.hasOwnProperty(e)&&o.isStandardName[e]){if(r(e,t))return"";var n=o.getAttributeName[e];return o.hasBooleanValue[e]||o.hasOverloadedBooleanValue[e]&&t===!0?n:n+"="+i(t);}return o.isCustomAttribute(e)?null==t?"":e+"="+i(t):null;},setValueForProperty:function setValueForProperty(e,t,n){if(o.isStandardName.hasOwnProperty(t)&&o.isStandardName[t]){var i=o.getMutationMethod[t];if(i)i(e,n);else if(r(t,n))this.deleteValueForProperty(e,t);else if(o.mustUseAttribute[t])e.setAttribute(o.getAttributeName[t],""+n);else{var a=o.getPropertyName[t];o.hasSideEffects[t]&&""+e[a]==""+n||(e[a]=n);}}else o.isCustomAttribute(t)&&(null==n?e.removeAttribute(t):e.setAttribute(t,""+n));},deleteValueForProperty:function deleteValueForProperty(e,t){if(o.isStandardName.hasOwnProperty(t)&&o.isStandardName[t]){var n=o.getMutationMethod[t];if(n)n(e,void 0);else if(o.mustUseAttribute[t])e.removeAttribute(o.getAttributeName[t]);else{var r=o.getPropertyName[t],i=o.getDefaultValueForProperty(e.nodeName,r);o.hasSideEffects[t]&&""+e[r]===i||(e[r]=i);}}else o.isCustomAttribute(t)&&e.removeAttribute(t);}});t.exports=a;},{10:10,143:143,150:150}],12:[function(e,t,n){"use strict";function r(e){return e.substring(1,e.indexOf(" "));}var o=e(21),i=e(110),a=e(112),u=e(125),s=e(133),l=/^(<[^ \/>]+)/,c="data-danger-index",p={dangerouslyRenderMarkup:function dangerouslyRenderMarkup(e){s(o.canUseDOM);for(var t,n={},p=0;p<e.length;p++){s(e[p]),t=r(e[p]),t=u(t)?t:"*",n[t]=n[t]||[],n[t][p]=e[p];}var d=[],f=0;for(t in n){if(n.hasOwnProperty(t)){var h,m=n[t];for(h in m){if(m.hasOwnProperty(h)){var v=m[h];m[h]=v.replace(l,"$1 "+c+'="'+h+'" ');}}for(var g=i(m.join(""),a),y=0;y<g.length;++y){var C=g[y];C.hasAttribute&&C.hasAttribute(c)&&(h=+C.getAttribute(c),C.removeAttribute(c),s(!d.hasOwnProperty(h)),d[h]=C,f+=1);}}}return s(f===d.length),s(d.length===e.length),d;},dangerouslyReplaceNodeWithMarkup:function dangerouslyReplaceNodeWithMarkup(e,t){s(o.canUseDOM),s(t),s("html"!==e.tagName.toLowerCase());var n=i(t,a)[0];e.parentNode.replaceChild(n,e);}};t.exports=p;},{110:110,112:112,125:125,133:133,21:21}],13:[function(e,t,n){"use strict";var r=e(139),o=[r({ResponderEventPlugin:null}),r({SimpleEventPlugin:null}),r({TapEventPlugin:null}),r({EnterLeaveEventPlugin:null}),r({ChangeEventPlugin:null}),r({SelectEventPlugin:null}),r({BeforeInputEventPlugin:null}),r({AnalyticsEventPlugin:null}),r({MobileSafariClickEventPlugin:null})];t.exports=o;},{139:139}],14:[function(e,t,n){"use strict";var r=e(15),o=e(20),i=e(97),a=e(68),u=e(139),s=r.topLevelTypes,l=a.getFirstReactDOM,c={mouseEnter:{registrationName:u({onMouseEnter:null}),dependencies:[s.topMouseOut,s.topMouseOver]},mouseLeave:{registrationName:u({onMouseLeave:null}),dependencies:[s.topMouseOut,s.topMouseOver]}},p=[null,null],d={eventTypes:c,extractEvents:function extractEvents(e,t,n,r){if(e===s.topMouseOver&&(r.relatedTarget||r.fromElement))return null;if(e!==s.topMouseOut&&e!==s.topMouseOver)return null;var u;if(t.window===t)u=t;else{var d=t.ownerDocument;u=d?d.defaultView||d.parentWindow:window;}var f,h;if(e===s.topMouseOut?(f=t,h=l(r.relatedTarget||r.toElement)||u):(f=u,h=t),f===h)return null;var m=f?a.getID(f):"",v=h?a.getID(h):"",g=i.getPooled(c.mouseLeave,m,r);g.type="mouseleave",g.target=f,g.relatedTarget=h;var y=i.getPooled(c.mouseEnter,v,r);return y.type="mouseenter",y.target=h,y.relatedTarget=f,o.accumulateEnterLeaveDispatches(g,y,m,v),p[0]=g,p[1]=y,p;}};t.exports=d;},{139:139,15:15,20:20,68:68,97:97}],15:[function(e,t,n){"use strict";var r=e(138),o=r({bubbled:null,captured:null}),i=r({topBlur:null,topChange:null,topClick:null,topCompositionEnd:null,topCompositionStart:null,topCompositionUpdate:null,topContextMenu:null,topCopy:null,topCut:null,topDoubleClick:null,topDrag:null,topDragEnd:null,topDragEnter:null,topDragExit:null,topDragLeave:null,topDragOver:null,topDragStart:null,topDrop:null,topError:null,topFocus:null,topInput:null,topKeyDown:null,topKeyPress:null,topKeyUp:null,topLoad:null,topMouseDown:null,topMouseMove:null,topMouseOut:null,topMouseOver:null,topMouseUp:null,topPaste:null,topReset:null,topScroll:null,topSelectionChange:null,topSubmit:null,topTextInput:null,topTouchCancel:null,topTouchEnd:null,topTouchMove:null,topTouchStart:null,topWheel:null}),a={topLevelTypes:i,PropagationPhases:o};t.exports=a;},{138:138}],16:[function(e,t,n){var r=e(112),o={listen:function listen(e,t,n){return e.addEventListener?(e.addEventListener(t,n,!1),{remove:function remove(){e.removeEventListener(t,n,!1);}}):e.attachEvent?(e.attachEvent("on"+t,n),{remove:function remove(){e.detachEvent("on"+t,n);}}):void 0;},capture:function capture(e,t,n){return e.addEventListener?(e.addEventListener(t,n,!0),{remove:function remove(){e.removeEventListener(t,n,!0);}}):{remove:r};},registerDefault:function registerDefault(){}};t.exports=o;},{112:112}],17:[function(e,t,n){"use strict";var r=e(18),o=e(19),i=e(103),a=e(118),u=e(133),s={},l=null,c=function c(e){if(e){var t=o.executeDispatch,n=r.getPluginModuleForEvent(e);n&&n.executeDispatch&&(t=n.executeDispatch),o.executeDispatchesInOrder(e,t),e.isPersistent()||e.constructor.release(e);}},p=null,d={injection:{injectMount:o.injection.injectMount,injectInstanceHandle:function injectInstanceHandle(e){p=e;},getInstanceHandle:function getInstanceHandle(){return p;},injectEventPluginOrder:r.injectEventPluginOrder,injectEventPluginsByName:r.injectEventPluginsByName},eventNameDispatchConfigs:r.eventNameDispatchConfigs,registrationNameModules:r.registrationNameModules,putListener:function putListener(e,t,n){u(!n||"function"==typeof n);var r=s[t]||(s[t]={});r[e]=n;},getListener:function getListener(e,t){var n=s[t];return n&&n[e];},deleteListener:function deleteListener(e,t){var n=s[t];n&&delete n[e];},deleteAllListeners:function deleteAllListeners(e){for(var t in s){delete s[t][e];}},extractEvents:function extractEvents(e,t,n,o){for(var a,u=r.plugins,s=0,l=u.length;l>s;s++){var c=u[s];if(c){var p=c.extractEvents(e,t,n,o);p&&(a=i(a,p));}}return a;},enqueueEvents:function enqueueEvents(e){e&&(l=i(l,e));},processEventQueue:function processEventQueue(){var e=l;l=null,a(e,c),u(!l);},__purge:function __purge(){s={};},__getListenerBank:function __getListenerBank(){return s;}};t.exports=d;},{103:103,118:118,133:133,18:18,19:19}],18:[function(e,t,n){"use strict";function r(){if(u)for(var e in s){var t=s[e],n=u.indexOf(e);if(a(n>-1),!l.plugins[n]){a(t.extractEvents),l.plugins[n]=t;var r=t.eventTypes;for(var i in r){a(o(r[i],t,i));}}}}function o(e,t,n){a(!l.eventNameDispatchConfigs.hasOwnProperty(n)),l.eventNameDispatchConfigs[n]=e;var r=e.phasedRegistrationNames;if(r){for(var o in r){if(r.hasOwnProperty(o)){var u=r[o];i(u,t,n);}}return!0;}return e.registrationName?(i(e.registrationName,t,n),!0):!1;}function i(e,t,n){a(!l.registrationNameModules[e]),l.registrationNameModules[e]=t,l.registrationNameDependencies[e]=t.eventTypes[n].dependencies;}var a=e(133),u=null,s={},l={plugins:[],eventNameDispatchConfigs:{},registrationNameModules:{},registrationNameDependencies:{},injectEventPluginOrder:function injectEventPluginOrder(e){a(!u),u=Array.prototype.slice.call(e),r();},injectEventPluginsByName:function injectEventPluginsByName(e){var t=!1;for(var n in e){if(e.hasOwnProperty(n)){var o=e[n];s.hasOwnProperty(n)&&s[n]===o||(a(!s[n]),s[n]=o,t=!0);}}t&&r();},getPluginModuleForEvent:function getPluginModuleForEvent(e){var t=e.dispatchConfig;if(t.registrationName)return l.registrationNameModules[t.registrationName]||null;for(var n in t.phasedRegistrationNames){if(t.phasedRegistrationNames.hasOwnProperty(n)){var r=l.registrationNameModules[t.phasedRegistrationNames[n]];if(r)return r;}}return null;},_resetEventPlugins:function _resetEventPlugins(){u=null;for(var e in s){s.hasOwnProperty(e)&&delete s[e];}l.plugins.length=0;var t=l.eventNameDispatchConfigs;for(var n in t){t.hasOwnProperty(n)&&delete t[n];}var r=l.registrationNameModules;for(var o in r){r.hasOwnProperty(o)&&delete r[o];}}};t.exports=l;},{133:133}],19:[function(e,t,n){"use strict";function r(e){return e===v.topMouseUp||e===v.topTouchEnd||e===v.topTouchCancel;}function o(e){return e===v.topMouseMove||e===v.topTouchMove;}function i(e){return e===v.topMouseDown||e===v.topTouchStart;}function a(e,t){var n=e._dispatchListeners,r=e._dispatchIDs;if(Array.isArray(n))for(var o=0;o<n.length&&!e.isPropagationStopped();o++){t(e,n[o],r[o]);}else n&&t(e,n,r);}function u(e,t,n){e.currentTarget=m.Mount.getNode(n);var r=t(e,n);return e.currentTarget=null,r;}function s(e,t){a(e,t),e._dispatchListeners=null,e._dispatchIDs=null;}function l(e){var t=e._dispatchListeners,n=e._dispatchIDs;if(Array.isArray(t)){for(var r=0;r<t.length&&!e.isPropagationStopped();r++){if(t[r](e,n[r]))return n[r];}}else if(t&&t(e,n))return n;return null;}function c(e){var t=l(e);return e._dispatchIDs=null,e._dispatchListeners=null,t;}function p(e){var t=e._dispatchListeners,n=e._dispatchIDs;h(!Array.isArray(t));var r=t?t(e,n):null;return e._dispatchListeners=null,e._dispatchIDs=null,r;}function d(e){return!!e._dispatchListeners;}var f=e(15),h=e(133),m={Mount:null,injectMount:function injectMount(e){m.Mount=e;}},v=f.topLevelTypes,g={isEndish:r,isMoveish:o,isStartish:i,executeDirectDispatch:p,executeDispatch:u,executeDispatchesInOrder:s,executeDispatchesInOrderStopAtTrue:c,hasDispatches:d,injection:m,useTouchEvents:!1};t.exports=g;},{133:133,15:15}],20:[function(e,t,n){"use strict";function r(e,t,n){var r=t.dispatchConfig.phasedRegistrationNames[n];return v(e,r);}function o(e,t,n){var o=t?m.bubbled:m.captured,i=r(e,n,o);i&&(n._dispatchListeners=f(n._dispatchListeners,i),n._dispatchIDs=f(n._dispatchIDs,e));}function i(e){e&&e.dispatchConfig.phasedRegistrationNames&&d.injection.getInstanceHandle().traverseTwoPhase(e.dispatchMarker,o,e);}function a(e,t,n){if(n&&n.dispatchConfig.registrationName){var r=n.dispatchConfig.registrationName,o=v(e,r);o&&(n._dispatchListeners=f(n._dispatchListeners,o),n._dispatchIDs=f(n._dispatchIDs,e));}}function u(e){e&&e.dispatchConfig.registrationName&&a(e.dispatchMarker,null,e);}function s(e){h(e,i);}function l(e,t,n,r){d.injection.getInstanceHandle().traverseEnterLeave(n,r,a,e,t);}function c(e){h(e,u);}var p=e(15),d=e(17),f=e(103),h=e(118),m=p.PropagationPhases,v=d.getListener,g={accumulateTwoPhaseDispatches:s,accumulateDirectDispatches:c,accumulateEnterLeaveDispatches:l};t.exports=g;},{103:103,118:118,15:15,17:17}],21:[function(e,t,n){"use strict";var r=!("undefined"==typeof window||!window.document||!window.document.createElement),o={canUseDOM:r,canUseWorkers:"undefined"!=typeof Worker,canUseEventListeners:r&&!(!window.addEventListener&&!window.attachEvent),canUseViewport:r&&!!window.screen,isInWorker:!r};t.exports=o;},{}],22:[function(e,t,n){"use strict";function r(e){this._root=e,this._startText=this.getText(),this._fallbackText=null;}var o=e(28),i=e(27),a=e(128);i(r.prototype,{getText:function getText(){return"value"in this._root?this._root.value:this._root[a()];},getData:function getData(){if(this._fallbackText)return this._fallbackText;var e,t,n=this._startText,r=n.length,o=this.getText(),i=o.length;for(e=0;r>e&&n[e]===o[e];e++){}var a=r-e;for(t=1;a>=t&&n[r-t]===o[i-t];t++){}var u=t>1?1-t:void 0;return this._fallbackText=o.slice(e,u),this._fallbackText;}}),o.addPoolingTo(r),t.exports=r;},{128:128,27:27,28:28}],23:[function(e,t,n){"use strict";var r,o=e(10),i=e(21),a=o.injection.MUST_USE_ATTRIBUTE,u=o.injection.MUST_USE_PROPERTY,s=o.injection.HAS_BOOLEAN_VALUE,l=o.injection.HAS_SIDE_EFFECTS,c=o.injection.HAS_NUMERIC_VALUE,p=o.injection.HAS_POSITIVE_NUMERIC_VALUE,d=o.injection.HAS_OVERLOADED_BOOLEAN_VALUE;if(i.canUseDOM){var f=document.implementation;r=f&&f.hasFeature&&f.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure","1.1");}var h={isCustomAttribute:RegExp.prototype.test.bind(/^(data|aria)-[a-z_][a-z\d_.\-]*$/),Properties:{accept:null,acceptCharset:null,accessKey:null,action:null,allowFullScreen:a|s,allowTransparency:a,alt:null,async:s,autoComplete:null,autoPlay:s,cellPadding:null,cellSpacing:null,charSet:a,checked:u|s,classID:a,className:r?a:u,cols:a|p,colSpan:null,content:null,contentEditable:null,contextMenu:a,controls:u|s,coords:null,crossOrigin:null,data:null,dateTime:a,defer:s,dir:null,disabled:a|s,download:d,draggable:null,encType:null,form:a,formAction:a,formEncType:a,formMethod:a,formNoValidate:s,formTarget:a,frameBorder:a,headers:null,height:a,hidden:a|s,high:null,href:null,hrefLang:null,htmlFor:null,httpEquiv:null,icon:null,id:u,label:null,lang:null,list:a,loop:u|s,low:null,manifest:a,marginHeight:null,marginWidth:null,max:null,maxLength:a,media:a,mediaGroup:null,method:null,min:null,multiple:u|s,muted:u|s,name:null,noValidate:s,open:s,optimum:null,pattern:null,placeholder:null,poster:null,preload:null,radioGroup:null,readOnly:u|s,rel:null,required:s,role:a,rows:a|p,rowSpan:null,sandbox:null,scope:null,scoped:s,scrolling:null,seamless:a|s,selected:u|s,shape:null,size:a|p,sizes:a,span:p,spellCheck:null,src:null,srcDoc:u,srcSet:a,start:c,step:null,style:null,tabIndex:null,target:null,title:null,type:null,useMap:null,value:u|l,width:a,wmode:a,autoCapitalize:null,autoCorrect:null,itemProp:a,itemScope:a|s,itemType:a,itemID:a,itemRef:a,property:null,unselectable:a},DOMAttributeNames:{acceptCharset:"accept-charset",className:"class",htmlFor:"for",httpEquiv:"http-equiv"},DOMPropertyNames:{autoCapitalize:"autocapitalize",autoComplete:"autocomplete",autoCorrect:"autocorrect",autoFocus:"autofocus",autoPlay:"autoplay",encType:"encoding",hrefLang:"hreflang",radioGroup:"radiogroup",spellCheck:"spellcheck",srcDoc:"srcdoc",srcSet:"srcset"}};t.exports=h;},{10:10,21:21}],24:[function(e,t,n){"use strict";function r(e){l(null==e.props.checkedLink||null==e.props.valueLink);}function o(e){r(e),l(null==e.props.value&&null==e.props.onChange);}function i(e){r(e),l(null==e.props.checked&&null==e.props.onChange);}function a(e){this.props.valueLink.requestChange(e.target.value);}function u(e){this.props.checkedLink.requestChange(e.target.checked);}var s=e(76),l=e(133),c={button:!0,checkbox:!0,image:!0,hidden:!0,radio:!0,reset:!0,submit:!0},p={Mixin:{propTypes:{value:function value(e,t,n){return!e[t]||c[e.type]||e.onChange||e.readOnly||e.disabled?null:new Error("You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.");},checked:function checked(e,t,n){return!e[t]||e.onChange||e.readOnly||e.disabled?null:new Error("You provided a `checked` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultChecked`. Otherwise, set either `onChange` or `readOnly`.");},onChange:s.func}},getValue:function getValue(e){return e.props.valueLink?(o(e),e.props.valueLink.value):e.props.value;},getChecked:function getChecked(e){return e.props.checkedLink?(i(e),e.props.checkedLink.value):e.props.checked;},getOnChange:function getOnChange(e){return e.props.valueLink?(o(e),a):e.props.checkedLink?(i(e),u):e.props.onChange;}};t.exports=p;},{133:133,76:76}],25:[function(e,t,n){"use strict";function r(e){e.remove();}var o=e(30),i=e(103),a=e(118),u=e(133),s={trapBubbledEvent:function trapBubbledEvent(e,t){u(this.isMounted());var n=this.getDOMNode();u(n);var r=o.trapBubbledEvent(e,t,n);this._localEventListeners=i(this._localEventListeners,r);},componentWillUnmount:function componentWillUnmount(){this._localEventListeners&&a(this._localEventListeners,r);}};t.exports=s;},{103:103,118:118,133:133,30:30}],26:[function(e,t,n){"use strict";var r=e(15),o=e(112),i=r.topLevelTypes,a={eventTypes:null,extractEvents:function extractEvents(e,t,n,r){if(e===i.topTouchStart){var a=r.target;a&&!a.onclick&&(a.onclick=o);}}};t.exports=a;},{112:112,15:15}],27:[function(e,t,n){"use strict";function r(e,t){if(null==e)throw new TypeError("Object.assign target cannot be null or undefined");for(var n=Object(e),r=Object.prototype.hasOwnProperty,o=1;o<arguments.length;o++){var i=arguments[o];if(null!=i){var a=Object(i);for(var u in a){r.call(a,u)&&(n[u]=a[u]);}}}return n;}t.exports=r;},{}],28:[function(e,t,n){"use strict";var r=e(133),o=function o(e){var t=this;if(t.instancePool.length){var n=t.instancePool.pop();return t.call(n,e),n;}return new t(e);},i=function i(e,t){var n=this;if(n.instancePool.length){var r=n.instancePool.pop();return n.call(r,e,t),r;}return new n(e,t);},a=function a(e,t,n){var r=this;if(r.instancePool.length){var o=r.instancePool.pop();return r.call(o,e,t,n),o;}return new r(e,t,n);},u=function u(e,t,n,r,o){var i=this;if(i.instancePool.length){var a=i.instancePool.pop();return i.call(a,e,t,n,r,o),a;}return new i(e,t,n,r,o);},s=function s(e){var t=this;r(e instanceof t),e.destructor&&e.destructor(),t.instancePool.length<t.poolSize&&t.instancePool.push(e);},l=10,c=o,p=function p(e,t){var n=e;return n.instancePool=[],n.getPooled=t||c,n.poolSize||(n.poolSize=l),n.release=s,n;},d={addPoolingTo:p,oneArgumentPooler:o,twoArgumentPooler:i,threeArgumentPooler:a,fiveArgumentPooler:u};t.exports=d;},{133:133}],29:[function(e,t,n){"use strict";var r=e(115),o={getDOMNode:function getDOMNode(){return r(this);}};t.exports=o;},{115:115}],30:[function(e,t,n){"use strict";function r(e){return Object.prototype.hasOwnProperty.call(e,m)||(e[m]=f++,p[e[m]]={}),p[e[m]];}var o=e(15),i=e(17),a=e(18),u=e(59),s=e(102),l=e(27),c=e(134),p={},d=!1,f=0,h={topBlur:"blur",topChange:"change",topClick:"click",topCompositionEnd:"compositionend",topCompositionStart:"compositionstart",topCompositionUpdate:"compositionupdate",topContextMenu:"contextmenu",topCopy:"copy",topCut:"cut",topDoubleClick:"dblclick",topDrag:"drag",topDragEnd:"dragend",topDragEnter:"dragenter",topDragExit:"dragexit",topDragLeave:"dragleave",topDragOver:"dragover",topDragStart:"dragstart",topDrop:"drop",topFocus:"focus",topInput:"input",topKeyDown:"keydown",topKeyPress:"keypress",topKeyUp:"keyup",topMouseDown:"mousedown",topMouseMove:"mousemove",topMouseOut:"mouseout",topMouseOver:"mouseover",topMouseUp:"mouseup",topPaste:"paste",topScroll:"scroll",topSelectionChange:"selectionchange",topTextInput:"textInput",topTouchCancel:"touchcancel",topTouchEnd:"touchend",topTouchMove:"touchmove",topTouchStart:"touchstart",topWheel:"wheel"},m="_reactListenersID"+String(Math.random()).slice(2),v=l({},u,{ReactEventListener:null,injection:{injectReactEventListener:function injectReactEventListener(e){e.setHandleTopLevel(v.handleTopLevel),v.ReactEventListener=e;}},setEnabled:function setEnabled(e){v.ReactEventListener&&v.ReactEventListener.setEnabled(e);},isEnabled:function isEnabled(){return!(!v.ReactEventListener||!v.ReactEventListener.isEnabled());},listenTo:function listenTo(e,t){for(var n=t,i=r(n),u=a.registrationNameDependencies[e],s=o.topLevelTypes,l=0,p=u.length;p>l;l++){var d=u[l];i.hasOwnProperty(d)&&i[d]||(d===s.topWheel?c("wheel")?v.ReactEventListener.trapBubbledEvent(s.topWheel,"wheel",n):c("mousewheel")?v.ReactEventListener.trapBubbledEvent(s.topWheel,"mousewheel",n):v.ReactEventListener.trapBubbledEvent(s.topWheel,"DOMMouseScroll",n):d===s.topScroll?c("scroll",!0)?v.ReactEventListener.trapCapturedEvent(s.topScroll,"scroll",n):v.ReactEventListener.trapBubbledEvent(s.topScroll,"scroll",v.ReactEventListener.WINDOW_HANDLE):d===s.topFocus||d===s.topBlur?(c("focus",!0)?(v.ReactEventListener.trapCapturedEvent(s.topFocus,"focus",n),v.ReactEventListener.trapCapturedEvent(s.topBlur,"blur",n)):c("focusin")&&(v.ReactEventListener.trapBubbledEvent(s.topFocus,"focusin",n),v.ReactEventListener.trapBubbledEvent(s.topBlur,"focusout",n)),i[s.topBlur]=!0,i[s.topFocus]=!0):h.hasOwnProperty(d)&&v.ReactEventListener.trapBubbledEvent(d,h[d],n),i[d]=!0);}},trapBubbledEvent:function trapBubbledEvent(e,t,n){return v.ReactEventListener.trapBubbledEvent(e,t,n);},trapCapturedEvent:function trapCapturedEvent(e,t,n){return v.ReactEventListener.trapCapturedEvent(e,t,n);},ensureScrollValueMonitoring:function ensureScrollValueMonitoring(){if(!d){var e=s.refreshScrollValues;v.ReactEventListener.monitorScrollValue(e),d=!0;}},eventNameDispatchConfigs:i.eventNameDispatchConfigs,registrationNameModules:i.registrationNameModules,putListener:i.putListener,getListener:i.getListener,deleteListener:i.deleteListener,deleteAllListeners:i.deleteAllListeners});t.exports=v;},{102:102,134:134,15:15,17:17,18:18,27:27,59:59}],31:[function(e,t,n){"use strict";var r=e(79),o=e(116),i=e(132),a=e(147),u={instantiateChildren:function instantiateChildren(e,t,n){var r=o(e);for(var a in r){if(r.hasOwnProperty(a)){var u=r[a],s=i(u,null);r[a]=s;}}return r;},updateChildren:function updateChildren(e,t,n,u){var s=o(t);if(!s&&!e)return null;var l;for(l in s){if(s.hasOwnProperty(l)){var c=e&&e[l],p=c&&c._currentElement,d=s[l];if(a(p,d))r.receiveComponent(c,d,n,u),s[l]=c;else{c&&r.unmountComponent(c,l);var f=i(d,null);s[l]=f;}}}for(l in e){!e.hasOwnProperty(l)||s&&s.hasOwnProperty(l)||r.unmountComponent(e[l]);}return s;},unmountChildren:function unmountChildren(e){for(var t in e){var n=e[t];r.unmountComponent(n);}}};t.exports=u;},{116:116,132:132,147:147,79:79}],32:[function(e,t,n){"use strict";function r(e,t){this.forEachFunction=e,this.forEachContext=t;}function o(e,t,n,r){var o=e;o.forEachFunction.call(o.forEachContext,t,r);}function i(e,t,n){if(null==e)return e;var i=r.getPooled(t,n);f(e,o,i),r.release(i);}function a(e,t,n){this.mapResult=e,this.mapFunction=t,this.mapContext=n;}function u(e,t,n,r){var o=e,i=o.mapResult,a=!i.hasOwnProperty(n);if(a){var u=o.mapFunction.call(o.mapContext,t,r);i[n]=u;}}function s(e,t,n){if(null==e)return e;var r={},o=a.getPooled(r,t,n);return f(e,u,o),a.release(o),d.create(r);}function l(e,t,n,r){return null;}function c(e,t){return f(e,l,null);}var p=e(28),d=e(61),f=e(149),h=(e(150),p.twoArgumentPooler),m=p.threeArgumentPooler;p.addPoolingTo(r,h),p.addPoolingTo(a,m);var v={forEach:i,map:s,count:c};t.exports=v;},{149:149,150:150,28:28,61:61}],33:[function(e,t,n){"use strict";function r(e,t){var n=D.hasOwnProperty(t)?D[t]:null;N.hasOwnProperty(t)&&y(n===_.OVERRIDE_BASE),e.hasOwnProperty(t)&&y(n===_.DEFINE_MANY||n===_.DEFINE_MANY_MERGED);}function o(e,t){if(t){y("function"!=typeof t),y(!d.isValidElement(t));var n=e.prototype;t.hasOwnProperty(b)&&M.mixins(e,t.mixins);for(var o in t){if(t.hasOwnProperty(o)&&o!==b){var i=t[o];if(r(n,o),M.hasOwnProperty(o))M[o](e,i);else{var a=D.hasOwnProperty(o),l=n.hasOwnProperty(o),c=i&&i.__reactDontBind,p="function"==typeof i,f=p&&!a&&!l&&!c;if(f)n.__reactAutoBindMap||(n.__reactAutoBindMap={}),n.__reactAutoBindMap[o]=i,n[o]=i;else if(l){var h=D[o];y(a&&(h===_.DEFINE_MANY_MERGED||h===_.DEFINE_MANY)),h===_.DEFINE_MANY_MERGED?n[o]=u(n[o],i):h===_.DEFINE_MANY&&(n[o]=s(n[o],i));}else n[o]=i;}}}}}function i(e,t){if(t)for(var n in t){var r=t[n];if(t.hasOwnProperty(n)){var o=n in M;y(!o);var i=n in e;y(!i),e[n]=r;}}}function a(e,t){y(e&&t&&"object"==(typeof e==="undefined"?"undefined":_typeof(e))&&"object"==(typeof t==="undefined"?"undefined":_typeof(t)));for(var n in t){t.hasOwnProperty(n)&&(y(void 0===e[n]),e[n]=t[n]);}return e;}function u(e,t){return function(){var n=e.apply(this,arguments),r=t.apply(this,arguments);if(null==n)return r;if(null==r)return n;var o={};return a(o,n),a(o,r),o;};}function s(e,t){return function(){e.apply(this,arguments),t.apply(this,arguments);};}function l(e,t){var n=t.bind(e);return n;}function c(e){for(var t in e.__reactAutoBindMap){if(e.__reactAutoBindMap.hasOwnProperty(t)){var n=e.__reactAutoBindMap[t];e[t]=l(e,f.guard(n,e.constructor.displayName+"."+t));}}}var p=e(34),d=(e(39),e(55)),f=e(58),h=e(65),m=e(66),v=(e(75),e(74),e(84)),g=e(27),y=e(133),C=e(138),E=e(139),b=(e(150),E({mixins:null})),_=C({DEFINE_ONCE:null,DEFINE_MANY:null,OVERRIDE_BASE:null,DEFINE_MANY_MERGED:null}),x=[],D={mixins:_.DEFINE_MANY,statics:_.DEFINE_MANY,propTypes:_.DEFINE_MANY,contextTypes:_.DEFINE_MANY,childContextTypes:_.DEFINE_MANY,getDefaultProps:_.DEFINE_MANY_MERGED,getInitialState:_.DEFINE_MANY_MERGED,getChildContext:_.DEFINE_MANY_MERGED,render:_.DEFINE_ONCE,componentWillMount:_.DEFINE_MANY,componentDidMount:_.DEFINE_MANY,componentWillReceiveProps:_.DEFINE_MANY,shouldComponentUpdate:_.DEFINE_ONCE,componentWillUpdate:_.DEFINE_MANY,componentDidUpdate:_.DEFINE_MANY,componentWillUnmount:_.DEFINE_MANY,updateComponent:_.OVERRIDE_BASE},M={displayName:function displayName(e,t){e.displayName=t;},mixins:function mixins(e,t){if(t)for(var n=0;n<t.length;n++){o(e,t[n]);}},childContextTypes:function childContextTypes(e,t){e.childContextTypes=g({},e.childContextTypes,t);},contextTypes:function contextTypes(e,t){e.contextTypes=g({},e.contextTypes,t);},getDefaultProps:function getDefaultProps(e,t){e.getDefaultProps?e.getDefaultProps=u(e.getDefaultProps,t):e.getDefaultProps=t;},propTypes:function propTypes(e,t){e.propTypes=g({},e.propTypes,t);},statics:function statics(e,t){i(e,t);}},N={replaceState:function replaceState(e,t){v.enqueueReplaceState(this,e),t&&v.enqueueCallback(this,t);},isMounted:function isMounted(){var e=h.get(this);return e&&e!==m.currentlyMountingInstance;},setProps:function setProps(e,t){v.enqueueSetProps(this,e),t&&v.enqueueCallback(this,t);},replaceProps:function replaceProps(e,t){v.enqueueReplaceProps(this,e),t&&v.enqueueCallback(this,t);}},I=function I(){};g(I.prototype,p.prototype,N);var T={createClass:function createClass(e){var t=function t(e,_t){this.__reactAutoBindMap&&c(this),this.props=e,this.context=_t,this.state=null;var n=this.getInitialState?this.getInitialState():null;y("object"==(typeof n==="undefined"?"undefined":_typeof(n))&&!Array.isArray(n)),this.state=n;};t.prototype=new I(),t.prototype.constructor=t,x.forEach(o.bind(null,t)),o(t,e),t.getDefaultProps&&(t.defaultProps=t.getDefaultProps()),y(t.prototype.render);for(var n in D){t.prototype[n]||(t.prototype[n]=null);}return t.type=t,t;},injection:{injectMixin:function injectMixin(e){x.push(e);}}};t.exports=T;},{133:133,138:138,139:139,150:150,27:27,34:34,39:39,55:55,58:58,65:65,66:66,74:74,75:75,84:84}],34:[function(e,t,n){"use strict";function r(e,t){this.props=e,this.context=t;}{var o=e(84),i=e(133);e(150);}r.prototype.setState=function(e,t){i("object"==(typeof e==="undefined"?"undefined":_typeof(e))||"function"==typeof e||null==e),o.enqueueSetState(this,e),t&&o.enqueueCallback(this,t);},r.prototype.forceUpdate=function(e){o.enqueueForceUpdate(this),e&&o.enqueueCallback(this,e);};t.exports=r;},{133:133,150:150,84:84}],35:[function(e,t,n){"use strict";var r=e(44),o=e(68),i={processChildrenUpdates:r.dangerouslyProcessChildrenUpdates,replaceNodeWithMarkupByID:r.dangerouslyReplaceNodeWithMarkupByID,unmountIDFromEnvironment:function unmountIDFromEnvironment(e){o.purgeID(e);}};t.exports=i;},{44:44,68:68}],36:[function(e,t,n){"use strict";var r=e(133),o=!1,i={unmountIDFromEnvironment:null,replaceNodeWithMarkupByID:null,processChildrenUpdates:null,injection:{injectEnvironment:function injectEnvironment(e){r(!o),i.unmountIDFromEnvironment=e.unmountIDFromEnvironment,i.replaceNodeWithMarkupByID=e.replaceNodeWithMarkupByID,i.processChildrenUpdates=e.processChildrenUpdates,o=!0;}}};t.exports=i;},{133:133}],37:[function(e,t,n){"use strict";function r(e){var t=e._currentElement._owner||null;if(t){var n=t.getName();if(n)return" Check the render method of `"+n+"`.";}return"";}var o=e(36),i=e(38),a=e(39),u=e(55),s=(e(56),e(65)),l=e(66),c=e(71),p=e(73),d=e(75),f=(e(74),e(79)),h=e(85),m=e(27),v=e(113),g=e(133),y=e(147),C=(e(150),1),E={construct:function construct(e){this._currentElement=e,this._rootNodeID=null,this._instance=null,this._pendingElement=null,this._pendingStateQueue=null,this._pendingReplaceState=!1,this._pendingForceUpdate=!1,this._renderedComponent=null,this._context=null,this._mountOrder=0,this._isTopLevel=!1,this._pendingCallbacks=null;},mountComponent:function mountComponent(e,t,n){this._context=n,this._mountOrder=C++,this._rootNodeID=e;var r=this._processProps(this._currentElement.props),o=this._processContext(this._currentElement._context),i=c.getComponentClassForElement(this._currentElement),a=new i(r,o);a.props=r,a.context=o,a.refs=v,this._instance=a,s.set(a,this);var u=a.state;void 0===u&&(a.state=u=null),g("object"==(typeof u==="undefined"?"undefined":_typeof(u))&&!Array.isArray(u)),this._pendingStateQueue=null,this._pendingReplaceState=!1,this._pendingForceUpdate=!1;var p,d,h=l.currentlyMountingInstance;l.currentlyMountingInstance=this;try{a.componentWillMount&&(a.componentWillMount(),this._pendingStateQueue&&(a.state=this._processPendingState(a.props,a.context))),p=this._getValidatedChildContext(n),d=this._renderValidatedComponent(p);}finally{l.currentlyMountingInstance=h;}this._renderedComponent=this._instantiateReactComponent(d,this._currentElement.type);var m=f.mountComponent(this._renderedComponent,e,t,this._mergeChildContext(n,p));return a.componentDidMount&&t.getReactMountReady().enqueue(a.componentDidMount,a),m;},unmountComponent:function unmountComponent(){var e=this._instance;if(e.componentWillUnmount){var t=l.currentlyUnmountingInstance;l.currentlyUnmountingInstance=this;try{e.componentWillUnmount();}finally{l.currentlyUnmountingInstance=t;}}f.unmountComponent(this._renderedComponent),this._renderedComponent=null,this._pendingStateQueue=null,this._pendingReplaceState=!1,this._pendingForceUpdate=!1,this._pendingCallbacks=null,this._pendingElement=null,this._context=null,this._rootNodeID=null,s.remove(e);},_setPropsInternal:function _setPropsInternal(e,t){var n=this._pendingElement||this._currentElement;this._pendingElement=u.cloneAndReplaceProps(n,m({},n.props,e)),h.enqueueUpdate(this,t);},_maskContext:function _maskContext(e){var t=null;if("string"==typeof this._currentElement.type)return v;var n=this._currentElement.type.contextTypes;if(!n)return v;t={};for(var r in n){t[r]=e[r];}return t;},_processContext:function _processContext(e){var t=this._maskContext(e);return t;},_getValidatedChildContext:function _getValidatedChildContext(e){var t=this._instance,n=t.getChildContext&&t.getChildContext();if(n){g("object"==_typeof(t.constructor.childContextTypes));for(var r in n){g(r in t.constructor.childContextTypes);}return n;}return null;},_mergeChildContext:function _mergeChildContext(e,t){return t?m({},e,t):e;},_processProps:function _processProps(e){return e;},_checkPropTypes:function _checkPropTypes(e,t,n){var o=this.getName();for(var i in e){if(e.hasOwnProperty(i)){var a;try{g("function"==typeof e[i]),a=e[i](t,i,o,n);}catch(u){a=u;}a instanceof Error&&(r(this),n===d.prop);}}},receiveComponent:function receiveComponent(e,t,n){var r=this._currentElement,o=this._context;this._pendingElement=null,this.updateComponent(t,r,e,o,n);},performUpdateIfNecessary:function performUpdateIfNecessary(e){null!=this._pendingElement&&f.receiveComponent(this,this._pendingElement||this._currentElement,e,this._context),(null!==this._pendingStateQueue||this._pendingForceUpdate)&&this.updateComponent(e,this._currentElement,this._currentElement,this._context,this._context);},_warnIfContextsDiffer:function _warnIfContextsDiffer(e,t){e=this._maskContext(e),t=this._maskContext(t);for(var n=Object.keys(t).sort(),r=(this.getName()||"ReactCompositeComponent",0);r<n.length;r++){n[r];}},updateComponent:function updateComponent(e,t,n,r,o){var i=this._instance,a=i.context,u=i.props;t!==n&&(a=this._processContext(n._context),u=this._processProps(n.props),i.componentWillReceiveProps&&i.componentWillReceiveProps(u,a));var s=this._processPendingState(u,a),l=this._pendingForceUpdate||!i.shouldComponentUpdate||i.shouldComponentUpdate(u,s,a);l?(this._pendingForceUpdate=!1,this._performComponentUpdate(n,u,s,a,e,o)):(this._currentElement=n,this._context=o,i.props=u,i.state=s,i.context=a);},_processPendingState:function _processPendingState(e,t){var n=this._instance,r=this._pendingStateQueue,o=this._pendingReplaceState;if(this._pendingReplaceState=!1,this._pendingStateQueue=null,!r)return n.state;if(o&&1===r.length)return r[0];for(var i=m({},o?r[0]:n.state),a=o?1:0;a<r.length;a++){var u=r[a];m(i,"function"==typeof u?u.call(n,i,e,t):u);}return i;},_performComponentUpdate:function _performComponentUpdate(e,t,n,r,o,i){var a=this._instance,u=a.props,s=a.state,l=a.context;a.componentWillUpdate&&a.componentWillUpdate(t,n,r),this._currentElement=e,this._context=i,a.props=t,a.state=n,a.context=r,this._updateRenderedComponent(o,i),a.componentDidUpdate&&o.getReactMountReady().enqueue(a.componentDidUpdate.bind(a,u,s,l),a);},_updateRenderedComponent:function _updateRenderedComponent(e,t){var n=this._renderedComponent,r=n._currentElement,o=this._getValidatedChildContext(),i=this._renderValidatedComponent(o);if(y(r,i))f.receiveComponent(n,i,e,this._mergeChildContext(t,o));else{var a=this._rootNodeID,u=n._rootNodeID;f.unmountComponent(n),this._renderedComponent=this._instantiateReactComponent(i,this._currentElement.type);var s=f.mountComponent(this._renderedComponent,a,e,this._mergeChildContext(t,o));this._replaceNodeWithMarkupByID(u,s);}},_replaceNodeWithMarkupByID:function _replaceNodeWithMarkupByID(e,t){o.replaceNodeWithMarkupByID(e,t);},_renderValidatedComponentWithoutOwnerOrContext:function _renderValidatedComponentWithoutOwnerOrContext(){var e=this._instance,t=e.render();return t;},_renderValidatedComponent:function _renderValidatedComponent(e){var t,n=i.current;i.current=this._mergeChildContext(this._currentElement._context,e),a.current=this;try{t=this._renderValidatedComponentWithoutOwnerOrContext();}finally{i.current=n,a.current=null;}return g(null===t||t===!1||u.isValidElement(t)),t;},attachRef:function attachRef(e,t){var n=this.getPublicInstance(),r=n.refs===v?n.refs={}:n.refs;r[e]=t.getPublicInstance();},detachRef:function detachRef(e){var t=this.getPublicInstance().refs;delete t[e];},getName:function getName(){var e=this._currentElement.type,t=this._instance&&this._instance.constructor;return e.displayName||t&&t.displayName||e.name||t&&t.name||null;},getPublicInstance:function getPublicInstance(){return this._instance;},_instantiateReactComponent:null};p.measureMethods(E,"ReactCompositeComponent",{mountComponent:"mountComponent",updateComponent:"updateComponent",_renderValidatedComponent:"_renderValidatedComponent"});var b={Mixin:E};t.exports=b;},{113:113,133:133,147:147,150:150,27:27,36:36,38:38,39:39,55:55,56:56,65:65,66:66,71:71,73:73,74:74,75:75,79:79,85:85}],38:[function(e,t,n){"use strict";var r=e(27),o=e(113),i=(e(150),{current:o,withContext:function withContext(e,t){var n,o=i.current;i.current=r({},o,e);try{n=t();}finally{i.current=o;}return n;}});t.exports=i;},{113:113,150:150,27:27}],39:[function(e,t,n){"use strict";var r={current:null};t.exports=r;},{}],40:[function(e,t,n){"use strict";function r(e){return o.createFactory(e);}var o=e(55),i=(e(56),e(140)),a=i({a:"a",abbr:"abbr",address:"address",area:"area",article:"article",aside:"aside",audio:"audio",b:"b",base:"base",bdi:"bdi",bdo:"bdo",big:"big",blockquote:"blockquote",body:"body",br:"br",button:"button",canvas:"canvas",caption:"caption",cite:"cite",code:"code",col:"col",colgroup:"colgroup",data:"data",datalist:"datalist",dd:"dd",del:"del",details:"details",dfn:"dfn",dialog:"dialog",div:"div",dl:"dl",dt:"dt",em:"em",embed:"embed",fieldset:"fieldset",figcaption:"figcaption",figure:"figure",footer:"footer",form:"form",h1:"h1",h2:"h2",h3:"h3",h4:"h4",h5:"h5",h6:"h6",head:"head",header:"header",hr:"hr",html:"html",i:"i",iframe:"iframe",img:"img",input:"input",ins:"ins",kbd:"kbd",keygen:"keygen",label:"label",legend:"legend",li:"li",link:"link",main:"main",map:"map",mark:"mark",menu:"menu",menuitem:"menuitem",meta:"meta",meter:"meter",nav:"nav",noscript:"noscript",object:"object",ol:"ol",optgroup:"optgroup",option:"option",output:"output",p:"p",param:"param",picture:"picture",pre:"pre",progress:"progress",q:"q",rp:"rp",rt:"rt",ruby:"ruby",s:"s",samp:"samp",script:"script",section:"section",select:"select",small:"small",source:"source",span:"span",strong:"strong",style:"style",sub:"sub",summary:"summary",sup:"sup",table:"table",tbody:"tbody",td:"td",textarea:"textarea",tfoot:"tfoot",th:"th",thead:"thead",time:"time",title:"title",tr:"tr",track:"track",u:"u",ul:"ul","var":"var",video:"video",wbr:"wbr",circle:"circle",clipPath:"clipPath",defs:"defs",ellipse:"ellipse",g:"g",line:"line",linearGradient:"linearGradient",mask:"mask",path:"path",pattern:"pattern",polygon:"polygon",polyline:"polyline",radialGradient:"radialGradient",rect:"rect",stop:"stop",svg:"svg",text:"text",tspan:"tspan"},r);t.exports=a;},{140:140,55:55,56:56}],41:[function(e,t,n){"use strict";var r=e(2),o=e(29),i=e(33),a=e(55),u=e(138),s=a.createFactory("button"),l=u({onClick:!0,onDoubleClick:!0,onMouseDown:!0,onMouseMove:!0,onMouseUp:!0,onClickCapture:!0,onDoubleClickCapture:!0,onMouseDownCapture:!0,onMouseMoveCapture:!0,onMouseUpCapture:!0}),c=i.createClass({displayName:"ReactDOMButton",tagName:"BUTTON",mixins:[r,o],render:function render(){var e={};for(var t in this.props){!this.props.hasOwnProperty(t)||this.props.disabled&&l[t]||(e[t]=this.props[t]);}return s(e,this.props.children);}});t.exports=c;},{138:138,2:2,29:29,33:33,55:55}],42:[function(e,t,n){"use strict";function r(e){e&&(null!=e.dangerouslySetInnerHTML&&(g(null==e.children),g("object"==_typeof(e.dangerouslySetInnerHTML)&&"__html"in e.dangerouslySetInnerHTML)),g(null==e.style||"object"==_typeof(e.style)));}function o(e,t,n,r){var o=d.findReactContainerForID(e);if(o){var i=o.nodeType===D?o.ownerDocument:o;E(t,i);}r.getPutListenerQueue().enqueuePutListener(e,t,n);}function i(e){P.call(T,e)||(g(I.test(e)),T[e]=!0);}function a(e){i(e),this._tag=e,this._renderedChildren=null,this._previousStyleCopy=null,this._rootNodeID=null;}var u=e(5),s=e(10),l=e(11),c=e(30),p=e(35),d=e(68),f=e(69),h=e(73),m=e(27),v=e(114),g=e(133),y=(e(134),e(139)),C=(e(150),c.deleteListener),E=c.listenTo,b=c.registrationNameModules,_={string:!0,number:!0},x=y({style:null}),D=1,M=null,N={area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0},I=/^[a-zA-Z][a-zA-Z:_\.\-\d]*$/,T={},P={}.hasOwnProperty;a.displayName="ReactDOMComponent",a.Mixin={construct:function construct(e){this._currentElement=e;},mountComponent:function mountComponent(e,t,n){this._rootNodeID=e,r(this._currentElement.props);var o=N[this._tag]?"":"</"+this._tag+">";return this._createOpenTagMarkupAndPutListeners(t)+this._createContentMarkup(t,n)+o;},_createOpenTagMarkupAndPutListeners:function _createOpenTagMarkupAndPutListeners(e){var t=this._currentElement.props,n="<"+this._tag;for(var r in t){if(t.hasOwnProperty(r)){var i=t[r];if(null!=i)if(b.hasOwnProperty(r))o(this._rootNodeID,r,i,e);else{r===x&&(i&&(i=this._previousStyleCopy=m({},t.style)),i=u.createMarkupForStyles(i));var a=l.createMarkupForProperty(r,i);a&&(n+=" "+a);}}}if(e.renderToStaticMarkup)return n+">";var s=l.createMarkupForID(this._rootNodeID);return n+" "+s+">";},_createContentMarkup:function _createContentMarkup(e,t){var n="";("listing"===this._tag||"pre"===this._tag||"textarea"===this._tag)&&(n="\n");var r=this._currentElement.props,o=r.dangerouslySetInnerHTML;if(null!=o){if(null!=o.__html)return n+o.__html;}else{var i=_[_typeof(r.children)]?r.children:null,a=null!=i?null:r.children;if(null!=i)return n+v(i);if(null!=a){var u=this.mountChildren(a,e,t);return n+u.join("");}}return n;},receiveComponent:function receiveComponent(e,t,n){var r=this._currentElement;this._currentElement=e,this.updateComponent(t,r,e,n);},updateComponent:function updateComponent(e,t,n,o){r(this._currentElement.props),this._updateDOMProperties(t.props,e),this._updateDOMChildren(t.props,e,o);},_updateDOMProperties:function _updateDOMProperties(e,t){var n,r,i,a=this._currentElement.props;for(n in e){if(!a.hasOwnProperty(n)&&e.hasOwnProperty(n))if(n===x){var u=this._previousStyleCopy;for(r in u){u.hasOwnProperty(r)&&(i=i||{},i[r]="");}this._previousStyleCopy=null;}else b.hasOwnProperty(n)?C(this._rootNodeID,n):(s.isStandardName[n]||s.isCustomAttribute(n))&&M.deletePropertyByID(this._rootNodeID,n);}for(n in a){var l=a[n],c=n===x?this._previousStyleCopy:e[n];if(a.hasOwnProperty(n)&&l!==c)if(n===x){if(l?l=this._previousStyleCopy=m({},l):this._previousStyleCopy=null,c){for(r in c){!c.hasOwnProperty(r)||l&&l.hasOwnProperty(r)||(i=i||{},i[r]="");}for(r in l){l.hasOwnProperty(r)&&c[r]!==l[r]&&(i=i||{},i[r]=l[r]);}}else i=l;}else b.hasOwnProperty(n)?o(this._rootNodeID,n,l,t):(s.isStandardName[n]||s.isCustomAttribute(n))&&M.updatePropertyByID(this._rootNodeID,n,l);}i&&M.updateStylesByID(this._rootNodeID,i);},_updateDOMChildren:function _updateDOMChildren(e,t,n){var r=this._currentElement.props,o=_[_typeof(e.children)]?e.children:null,i=_[_typeof(r.children)]?r.children:null,a=e.dangerouslySetInnerHTML&&e.dangerouslySetInnerHTML.__html,u=r.dangerouslySetInnerHTML&&r.dangerouslySetInnerHTML.__html,s=null!=o?null:e.children,l=null!=i?null:r.children,c=null!=o||null!=a,p=null!=i||null!=u;null!=s&&null==l?this.updateChildren(null,t,n):c&&!p&&this.updateTextContent(""),null!=i?o!==i&&this.updateTextContent(""+i):null!=u?a!==u&&M.updateInnerHTMLByID(this._rootNodeID,u):null!=l&&this.updateChildren(l,t,n);},unmountComponent:function unmountComponent(){this.unmountChildren(),c.deleteAllListeners(this._rootNodeID),p.unmountIDFromEnvironment(this._rootNodeID),this._rootNodeID=null;}},h.measureMethods(a,"ReactDOMComponent",{mountComponent:"mountComponent",updateComponent:"updateComponent"}),m(a.prototype,a.Mixin,f.Mixin),a.injection={injectIDOperations:function injectIDOperations(e){a.BackendIDOperations=M=e;}},t.exports=a;},{10:10,11:11,114:114,133:133,134:134,139:139,150:150,27:27,30:30,35:35,5:5,68:68,69:69,73:73}],43:[function(e,t,n){"use strict";var r=e(15),o=e(25),i=e(29),a=e(33),u=e(55),s=u.createFactory("form"),l=a.createClass({displayName:"ReactDOMForm",tagName:"FORM",mixins:[i,o],render:function render(){return s(this.props);},componentDidMount:function componentDidMount(){this.trapBubbledEvent(r.topLevelTypes.topReset,"reset"),this.trapBubbledEvent(r.topLevelTypes.topSubmit,"submit");}});t.exports=l;},{15:15,25:25,29:29,33:33,55:55}],44:[function(e,t,n){"use strict";var r=e(5),o=e(9),i=e(11),a=e(68),u=e(73),s=e(133),l=e(144),c={dangerouslySetInnerHTML:"`dangerouslySetInnerHTML` must be set using `updateInnerHTMLByID()`.",style:"`style` must be set using `updateStylesByID()`."},p={updatePropertyByID:function updatePropertyByID(e,t,n){var r=a.getNode(e);s(!c.hasOwnProperty(t)),null!=n?i.setValueForProperty(r,t,n):i.deleteValueForProperty(r,t);},deletePropertyByID:function deletePropertyByID(e,t,n){var r=a.getNode(e);s(!c.hasOwnProperty(t)),i.deleteValueForProperty(r,t,n);},updateStylesByID:function updateStylesByID(e,t){var n=a.getNode(e);r.setValueForStyles(n,t);},updateInnerHTMLByID:function updateInnerHTMLByID(e,t){var n=a.getNode(e);l(n,t);},updateTextContentByID:function updateTextContentByID(e,t){var n=a.getNode(e);o.updateTextContent(n,t);},dangerouslyReplaceNodeWithMarkupByID:function dangerouslyReplaceNodeWithMarkupByID(e,t){var n=a.getNode(e);o.dangerouslyReplaceNodeWithMarkup(n,t);},dangerouslyProcessChildrenUpdates:function dangerouslyProcessChildrenUpdates(e,t){for(var n=0;n<e.length;n++){e[n].parentNode=a.getNode(e[n].parentID);}o.processUpdates(e,t);}};u.measureMethods(p,"ReactDOMIDOperations",{updatePropertyByID:"updatePropertyByID",deletePropertyByID:"deletePropertyByID",updateStylesByID:"updateStylesByID",updateInnerHTMLByID:"updateInnerHTMLByID",updateTextContentByID:"updateTextContentByID",dangerouslyReplaceNodeWithMarkupByID:"dangerouslyReplaceNodeWithMarkupByID",dangerouslyProcessChildrenUpdates:"dangerouslyProcessChildrenUpdates"}),t.exports=p;},{11:11,133:133,144:144,5:5,68:68,73:73,9:9}],45:[function(e,t,n){"use strict";var r=e(15),o=e(25),i=e(29),a=e(33),u=e(55),s=u.createFactory("iframe"),l=a.createClass({displayName:"ReactDOMIframe",tagName:"IFRAME",mixins:[i,o],render:function render(){return s(this.props);},componentDidMount:function componentDidMount(){this.trapBubbledEvent(r.topLevelTypes.topLoad,"load");}});t.exports=l;},{15:15,25:25,29:29,33:33,55:55}],46:[function(e,t,n){"use strict";var r=e(15),o=e(25),i=e(29),a=e(33),u=e(55),s=u.createFactory("img"),l=a.createClass({displayName:"ReactDOMImg",tagName:"IMG",mixins:[i,o],render:function render(){return s(this.props);},componentDidMount:function componentDidMount(){this.trapBubbledEvent(r.topLevelTypes.topLoad,"load"),this.trapBubbledEvent(r.topLevelTypes.topError,"error");}});t.exports=l;},{15:15,25:25,29:29,33:33,55:55}],47:[function(e,t,n){"use strict";function r(){this.isMounted()&&this.forceUpdate();}var o=e(2),i=e(11),a=e(24),u=e(29),s=e(33),l=e(55),c=e(68),p=e(85),d=e(27),f=e(133),h=l.createFactory("input"),m={},v=s.createClass({displayName:"ReactDOMInput",tagName:"INPUT",mixins:[o,a.Mixin,u],getInitialState:function getInitialState(){var e=this.props.defaultValue;return{initialChecked:this.props.defaultChecked||!1,initialValue:null!=e?e:null};},render:function render(){var e=d({},this.props);e.defaultChecked=null,e.defaultValue=null;var t=a.getValue(this);e.value=null!=t?t:this.state.initialValue;var n=a.getChecked(this);return e.checked=null!=n?n:this.state.initialChecked,e.onChange=this._handleChange,h(e,this.props.children);},componentDidMount:function componentDidMount(){var e=c.getID(this.getDOMNode());m[e]=this;},componentWillUnmount:function componentWillUnmount(){var e=this.getDOMNode(),t=c.getID(e);delete m[t];},componentDidUpdate:function componentDidUpdate(e,t,n){var r=this.getDOMNode();null!=this.props.checked&&i.setValueForProperty(r,"checked",this.props.checked||!1);var o=a.getValue(this);null!=o&&i.setValueForProperty(r,"value",""+o);},_handleChange:function _handleChange(e){var t,n=a.getOnChange(this);n&&(t=n.call(this,e)),p.asap(r,this);var o=this.props.name;if("radio"===this.props.type&&null!=o){for(var i=this.getDOMNode(),u=i;u.parentNode;){u=u.parentNode;}for(var s=u.querySelectorAll("input[name="+JSON.stringify(""+o)+'][type="radio"]'),l=0,d=s.length;d>l;l++){var h=s[l];if(h!==i&&h.form===i.form){var v=c.getID(h);f(v);var g=m[v];f(g),p.asap(r,g);}}}return t;}});t.exports=v;},{11:11,133:133,2:2,24:24,27:27,29:29,33:33,55:55,68:68,85:85}],48:[function(e,t,n){"use strict";var r=e(29),o=e(33),i=e(55),a=(e(150),i.createFactory("option")),u=o.createClass({displayName:"ReactDOMOption",tagName:"OPTION",mixins:[r],componentWillMount:function componentWillMount(){},render:function render(){return a(this.props,this.props.children);}});t.exports=u;},{150:150,29:29,33:33,55:55}],49:[function(e,t,n){"use strict";function r(){if(this._pendingUpdate){this._pendingUpdate=!1;var e=u.getValue(this);null!=e&&this.isMounted()&&i(this,e);}}function o(e,t,n){if(null==e[t])return null;if(e.multiple){if(!Array.isArray(e[t]))return new Error("The `"+t+"` prop supplied to <select> must be an array if `multiple` is true.");}else if(Array.isArray(e[t]))return new Error("The `"+t+"` prop supplied to <select> must be a scalar value if `multiple` is false.");}function i(e,t){var n,r,o,i=e.getDOMNode().options;if(e.props.multiple){for(n={},r=0,o=t.length;o>r;r++){n[""+t[r]]=!0;}for(r=0,o=i.length;o>r;r++){var a=n.hasOwnProperty(i[r].value);i[r].selected!==a&&(i[r].selected=a);}}else{for(n=""+t,r=0,o=i.length;o>r;r++){if(i[r].value===n)return void(i[r].selected=!0);}i.length&&(i[0].selected=!0);}}var a=e(2),u=e(24),s=e(29),l=e(33),c=e(55),p=e(85),d=e(27),f=c.createFactory("select"),h=l.createClass({displayName:"ReactDOMSelect",tagName:"SELECT",mixins:[a,u.Mixin,s],propTypes:{defaultValue:o,value:o},render:function render(){var e=d({},this.props);return e.onChange=this._handleChange,e.value=null,f(e,this.props.children);},componentWillMount:function componentWillMount(){this._pendingUpdate=!1;},componentDidMount:function componentDidMount(){var e=u.getValue(this);null!=e?i(this,e):null!=this.props.defaultValue&&i(this,this.props.defaultValue);},componentDidUpdate:function componentDidUpdate(e){var t=u.getValue(this);null!=t?(this._pendingUpdate=!1,i(this,t)):!e.multiple!=!this.props.multiple&&(null!=this.props.defaultValue?i(this,this.props.defaultValue):i(this,this.props.multiple?[]:""));},_handleChange:function _handleChange(e){var t,n=u.getOnChange(this);return n&&(t=n.call(this,e)),this._pendingUpdate=!0,p.asap(r,this),t;}});t.exports=h;},{2:2,24:24,27:27,29:29,33:33,55:55,85:85}],50:[function(e,t,n){"use strict";function r(e,t,n,r){return e===n&&t===r;}function o(e){var t=document.selection,n=t.createRange(),r=n.text.length,o=n.duplicate();o.moveToElementText(e),o.setEndPoint("EndToStart",n);var i=o.text.length,a=i+r;return{start:i,end:a};}function i(e){var t=window.getSelection&&window.getSelection();if(!t||0===t.rangeCount)return null;var n=t.anchorNode,o=t.anchorOffset,i=t.focusNode,a=t.focusOffset,u=t.getRangeAt(0),s=r(t.anchorNode,t.anchorOffset,t.focusNode,t.focusOffset),l=s?0:u.toString().length,c=u.cloneRange();c.selectNodeContents(e),c.setEnd(u.startContainer,u.startOffset);var p=r(c.startContainer,c.startOffset,c.endContainer,c.endOffset),d=p?0:c.toString().length,f=d+l,h=document.createRange();h.setStart(n,o),h.setEnd(i,a);var m=h.collapsed;return{start:m?f:d,end:m?d:f};}function a(e,t){var n,r,o=document.selection.createRange().duplicate();"undefined"==typeof t.end?(n=t.start,r=n):t.start>t.end?(n=t.end,r=t.start):(n=t.start,r=t.end),o.moveToElementText(e),o.moveStart("character",n),o.setEndPoint("EndToStart",o),o.moveEnd("character",r-n),o.select();}function u(e,t){if(window.getSelection){var n=window.getSelection(),r=e[c()].length,o=Math.min(t.start,r),i="undefined"==typeof t.end?o:Math.min(t.end,r);if(!n.extend&&o>i){var a=i;i=o,o=a;}var u=l(e,o),s=l(e,i);if(u&&s){var p=document.createRange();p.setStart(u.node,u.offset),n.removeAllRanges(),o>i?(n.addRange(p),n.extend(s.node,s.offset)):(p.setEnd(s.node,s.offset),n.addRange(p));}}}var s=e(21),l=e(126),c=e(128),p=s.canUseDOM&&"selection"in document&&!("getSelection"in window),d={getOffsets:p?o:i,setOffsets:p?a:u};t.exports=d;},{126:126,128:128,21:21}],51:[function(e,t,n){"use strict";var r=e(11),o=e(35),i=e(42),a=e(27),u=e(114),s=function s(e){};a(s.prototype,{construct:function construct(e){this._currentElement=e,this._stringText=""+e,this._rootNodeID=null,this._mountIndex=0;},mountComponent:function mountComponent(e,t,n){this._rootNodeID=e;var o=u(this._stringText);return t.renderToStaticMarkup?o:"<span "+r.createMarkupForID(e)+">"+o+"</span>";},receiveComponent:function receiveComponent(e,t){if(e!==this._currentElement){this._currentElement=e;var n=""+e;n!==this._stringText&&(this._stringText=n,i.BackendIDOperations.updateTextContentByID(this._rootNodeID,n));}},unmountComponent:function unmountComponent(){o.unmountIDFromEnvironment(this._rootNodeID);}}),t.exports=s;},{11:11,114:114,27:27,35:35,42:42}],52:[function(e,t,n){"use strict";function r(){this.isMounted()&&this.forceUpdate();}var o=e(2),i=e(11),a=e(24),u=e(29),s=e(33),l=e(55),c=e(85),p=e(27),d=e(133),f=(e(150),l.createFactory("textarea")),h=s.createClass({displayName:"ReactDOMTextarea",tagName:"TEXTAREA",mixins:[o,a.Mixin,u],getInitialState:function getInitialState(){var e=this.props.defaultValue,t=this.props.children;null!=t&&(d(null==e),Array.isArray(t)&&(d(t.length<=1),t=t[0]),e=""+t),null==e&&(e="");var n=a.getValue(this);return{initialValue:""+(null!=n?n:e)};},render:function render(){var e=p({},this.props);return d(null==e.dangerouslySetInnerHTML),e.defaultValue=null,e.value=null,e.onChange=this._handleChange,f(e,this.state.initialValue);},componentDidUpdate:function componentDidUpdate(e,t,n){var r=a.getValue(this);if(null!=r){var o=this.getDOMNode();i.setValueForProperty(o,"value",""+r);}},_handleChange:function _handleChange(e){var t,n=a.getOnChange(this);return n&&(t=n.call(this,e)),c.asap(r,this),t;}});t.exports=h;},{11:11,133:133,150:150,2:2,24:24,27:27,29:29,33:33,55:55,85:85}],53:[function(e,t,n){"use strict";function r(){this.reinitializeTransaction();}var o=e(85),i=e(101),a=e(27),u=e(112),s={initialize:u,close:function close(){d.isBatchingUpdates=!1;}},l={initialize:u,close:o.flushBatchedUpdates.bind(o)},c=[l,s];a(r.prototype,i.Mixin,{getTransactionWrappers:function getTransactionWrappers(){return c;}});var p=new r(),d={isBatchingUpdates:!1,batchedUpdates:function batchedUpdates(e,t,n,r,o){var i=d.isBatchingUpdates;d.isBatchingUpdates=!0,i?e(t,n,r,o):p.perform(e,null,t,n,r,o);}};t.exports=d;},{101:101,112:112,27:27,85:85}],54:[function(e,t,n){"use strict";function r(e){return h.createClass({tagName:e.toUpperCase(),render:function render(){return new T(e,null,null,null,null,this.props);}});}function o(){R.EventEmitter.injectReactEventListener(P),R.EventPluginHub.injectEventPluginOrder(s),R.EventPluginHub.injectInstanceHandle(w),R.EventPluginHub.injectMount(O),R.EventPluginHub.injectEventPluginsByName({SimpleEventPlugin:L,EnterLeaveEventPlugin:l,ChangeEventPlugin:a,MobileSafariClickEventPlugin:d,SelectEventPlugin:A,BeforeInputEventPlugin:i}),R.NativeComponent.injectGenericComponentClass(g),R.NativeComponent.injectTextComponentClass(I),R.NativeComponent.injectAutoWrapper(r),R.Class.injectMixin(f),R.NativeComponent.injectComponentClasses({button:y,form:C,iframe:_,img:E,input:x,option:D,select:M,textarea:N,html:F("html"),head:F("head"),body:F("body")}),R.DOMProperty.injectDOMPropertyConfig(p),R.DOMProperty.injectDOMPropertyConfig(U),R.EmptyComponent.injectEmptyComponent("noscript"),R.Updates.injectReconcileTransaction(S),R.Updates.injectBatchingStrategy(v),R.RootIndex.injectCreateReactRootIndex(c.canUseDOM?u.createReactRootIndex:k.createReactRootIndex),R.Component.injectEnvironment(m),R.DOMComponent.injectIDOperations(b);}var i=e(3),a=e(7),u=e(8),s=e(13),l=e(14),c=e(21),p=e(23),d=e(26),f=e(29),h=e(33),m=e(35),v=e(53),g=e(42),y=e(41),C=e(43),E=e(46),b=e(44),_=e(45),x=e(47),D=e(48),M=e(49),N=e(52),I=e(51),T=e(55),P=e(60),R=e(62),w=e(64),O=e(68),S=e(78),A=e(87),k=e(88),L=e(89),U=e(86),F=e(109);t.exports={inject:o};},{109:109,13:13,14:14,21:21,23:23,26:26,29:29,3:3,33:33,35:35,41:41,42:42,43:43,44:44,45:45,46:46,47:47,48:48,49:49,51:51,52:52,53:53,55:55,60:60,62:62,64:64,68:68,7:7,78:78,8:8,86:86,87:87,88:88,89:89}],55:[function(e,t,n){"use strict";var r=e(38),o=e(39),i=e(27),a=(e(150),{key:!0,ref:!0}),u=function u(e,t,n,r,o,i){this.type=e,this.key=t,this.ref=n,this._owner=r,this._context=o,this.props=i;};u.prototype={_isReactElement:!0},u.createElement=function(e,t,n){var i,s={},l=null,c=null;if(null!=t){c=void 0===t.ref?null:t.ref,l=void 0===t.key?null:""+t.key;for(i in t){t.hasOwnProperty(i)&&!a.hasOwnProperty(i)&&(s[i]=t[i]);}}var p=arguments.length-2;if(1===p)s.children=n;else if(p>1){for(var d=Array(p),f=0;p>f;f++){d[f]=arguments[f+2];}s.children=d;}if(e&&e.defaultProps){var h=e.defaultProps;for(i in h){"undefined"==typeof s[i]&&(s[i]=h[i]);}}return new u(e,l,c,o.current,r.current,s);},u.createFactory=function(e){var t=u.createElement.bind(null,e);return t.type=e,t;},u.cloneAndReplaceProps=function(e,t){var n=new u(e.type,e.key,e.ref,e._owner,e._context,t);return n;},u.cloneElement=function(e,t,n){var r,s=i({},e.props),l=e.key,c=e.ref,p=e._owner;if(null!=t){void 0!==t.ref&&(c=t.ref,p=o.current),void 0!==t.key&&(l=""+t.key);for(r in t){t.hasOwnProperty(r)&&!a.hasOwnProperty(r)&&(s[r]=t[r]);}}var d=arguments.length-2;if(1===d)s.children=n;else if(d>1){for(var f=Array(d),h=0;d>h;h++){f[h]=arguments[h+2];}s.children=f;}return new u(e.type,l,c,p,e._context,s);},u.isValidElement=function(e){var t=!(!e||!e._isReactElement);return t;},t.exports=u;},{150:150,27:27,38:38,39:39}],56:[function(e,t,n){"use strict";function r(){if(y.current){var e=y.current.getName();if(e)return" Check the render method of `"+e+"`.";}return"";}function o(e){var t=e&&e.getPublicInstance();if(!t)return void 0;var n=t.constructor;return n?n.displayName||n.name||void 0:void 0;}function i(){var e=y.current;return e&&o(e)||void 0;}function a(e,t){e._store.validated||null!=e.key||(e._store.validated=!0,s('Each child in an array or iterator should have a unique "key" prop.',e,t));}function u(e,t,n){D.test(e)&&s("Child objects should have non-numeric keys so ordering is preserved.",t,n);}function s(e,t,n){var r=i(),a="string"==typeof n?n:n.displayName||n.name,u=r||a,s=_[e]||(_[e]={});if(!s.hasOwnProperty(u)){s[u]=!0;var l="";if(t&&t._owner&&t._owner!==y.current){var c=o(t._owner);l=" It was passed a child from "+c+".";}}}function l(e,t){if(Array.isArray(e))for(var n=0;n<e.length;n++){var r=e[n];m.isValidElement(r)&&a(r,t);}else if(m.isValidElement(e))e._store.validated=!0;else if(e){var o=E(e);if(o){if(o!==e.entries)for(var i,s=o.call(e);!(i=s.next()).done;){m.isValidElement(i.value)&&a(i.value,t);}}else if("object"==(typeof e==="undefined"?"undefined":_typeof(e))){var l=v.extractIfFragment(e);for(var c in l){l.hasOwnProperty(c)&&u(c,l[c],t);}}}}function c(e,t,n,o){for(var i in t){if(t.hasOwnProperty(i)){var a;try{b("function"==typeof t[i]),a=t[i](n,i,e,o);}catch(u){a=u;}a instanceof Error&&!(a.message in x)&&(x[a.message]=!0,r(this));}}}function p(e,t){var n=t.type,r="string"==typeof n?n:n.displayName,o=t._owner?t._owner.getPublicInstance().constructor.displayName:null,i=e+"|"+r+"|"+o;if(!M.hasOwnProperty(i)){M[i]=!0;var a="";r&&(a=" <"+r+" />");var u="";o&&(u=" The element was created by "+o+".");}}function d(e,t){return e!==e?t!==t:0===e&&0===t?1/e===1/t:e===t;}function f(e){if(e._store){var t=e._store.originalProps,n=e.props;for(var r in n){n.hasOwnProperty(r)&&(t.hasOwnProperty(r)&&d(t[r],n[r])||(p(r,e),t[r]=n[r]));}}}function h(e){if(null!=e.type){var t=C.getComponentClassForElement(e),n=t.displayName||t.name;t.propTypes&&c(n,t.propTypes,e.props,g.prop),"function"==typeof t.getDefaultProps;}}var m=e(55),v=e(61),g=e(75),y=(e(74),e(39)),C=e(71),E=e(124),b=e(133),_=(e(150),{}),x={},D=/^\d+$/,M={},N={checkAndWarnForMutatedProps:f,createElement:function createElement(e,t,n){var r=m.createElement.apply(this,arguments);if(null==r)return r;for(var o=2;o<arguments.length;o++){l(arguments[o],e);}return h(r),r;},createFactory:function createFactory(e){var t=N.createElement.bind(null,e);return t.type=e,t;},cloneElement:function cloneElement(e,t,n){for(var r=m.cloneElement.apply(this,arguments),o=2;o<arguments.length;o++){l(arguments[o],r.type);}return h(r),r;}};t.exports=N;},{124:124,133:133,150:150,39:39,55:55,61:61,71:71,74:74,75:75}],57:[function(e,t,n){"use strict";function r(e){c[e]=!0;}function o(e){delete c[e];}function i(e){return!!c[e];}var a,u=e(55),s=e(65),l=e(133),c={},p={injectEmptyComponent:function injectEmptyComponent(e){a=u.createFactory(e);}},d=function d(){};d.prototype.componentDidMount=function(){var e=s.get(this);e&&r(e._rootNodeID);},d.prototype.componentWillUnmount=function(){var e=s.get(this);e&&o(e._rootNodeID);},d.prototype.render=function(){return l(a),a();};var f=u.createElement(d),h={emptyElement:f,injection:p,isNullComponentID:i};t.exports=h;},{133:133,55:55,65:65}],58:[function(e,t,n){"use strict";var r={guard:function guard(e,t){return e;}};t.exports=r;},{}],59:[function(e,t,n){"use strict";function r(e){o.enqueueEvents(e),o.processEventQueue();}var o=e(17),i={handleTopLevel:function handleTopLevel(e,t,n,i){var a=o.extractEvents(e,t,n,i);r(a);}};t.exports=i;},{17:17}],60:[function(e,t,n){"use strict";function r(e){var t=p.getID(e),n=c.getReactRootIDFromNodeID(t),r=p.findReactContainerForID(n),o=p.getFirstReactDOM(r);return o;}function o(e,t){this.topLevelType=e,this.nativeEvent=t,this.ancestors=[];}function i(e){for(var t=p.getFirstReactDOM(h(e.nativeEvent))||window,n=t;n;){e.ancestors.push(n),n=r(n);}for(var o=0,i=e.ancestors.length;i>o;o++){t=e.ancestors[o];var a=p.getID(t)||"";v._handleTopLevel(e.topLevelType,t,a,e.nativeEvent);}}function a(e){var t=m(window);e(t);}var u=e(16),s=e(21),l=e(28),c=e(64),p=e(68),d=e(85),f=e(27),h=e(123),m=e(129);f(o.prototype,{destructor:function destructor(){this.topLevelType=null,this.nativeEvent=null,this.ancestors.length=0;}}),l.addPoolingTo(o,l.twoArgumentPooler);var v={_enabled:!0,_handleTopLevel:null,WINDOW_HANDLE:s.canUseDOM?window:null,setHandleTopLevel:function setHandleTopLevel(e){v._handleTopLevel=e;},setEnabled:function setEnabled(e){v._enabled=!!e;},isEnabled:function isEnabled(){return v._enabled;},trapBubbledEvent:function trapBubbledEvent(e,t,n){var r=n;return r?u.listen(r,t,v.dispatchEvent.bind(null,e)):null;},trapCapturedEvent:function trapCapturedEvent(e,t,n){var r=n;return r?u.capture(r,t,v.dispatchEvent.bind(null,e)):null;},monitorScrollValue:function monitorScrollValue(e){var t=a.bind(null,e);u.listen(window,"scroll",t);},dispatchEvent:function dispatchEvent(e,t){if(v._enabled){var n=o.getPooled(e,t);try{d.batchedUpdates(i,n);}finally{o.release(n);}}}};t.exports=v;},{123:123,129:129,16:16,21:21,27:27,28:28,64:64,68:68,85:85}],61:[function(e,t,n){"use strict";var r=(e(55),e(150),{create:function create(e){return e;},extract:function extract(e){return e;},extractIfFragment:function extractIfFragment(e){return e;}});t.exports=r;},{150:150,55:55}],62:[function(e,t,n){"use strict";var r=e(10),o=e(17),i=e(36),a=e(33),u=e(57),s=e(30),l=e(71),c=e(42),p=e(73),d=e(81),f=e(85),h={Component:i.injection,Class:a.injection,DOMComponent:c.injection,DOMProperty:r.injection,EmptyComponent:u.injection,EventPluginHub:o.injection,EventEmitter:s.injection,NativeComponent:l.injection,Perf:p.injection,RootIndex:d.injection,Updates:f.injection};t.exports=h;},{10:10,17:17,30:30,33:33,36:36,42:42,57:57,71:71,73:73,81:81,85:85}],63:[function(e,t,n){"use strict";function r(e){return i(document.documentElement,e);}var o=e(50),i=e(107),a=e(117),u=e(119),s={hasSelectionCapabilities:function hasSelectionCapabilities(e){return e&&("INPUT"===e.nodeName&&"text"===e.type||"TEXTAREA"===e.nodeName||"true"===e.contentEditable);},getSelectionInformation:function getSelectionInformation(){var e=u();return{focusedElem:e,selectionRange:s.hasSelectionCapabilities(e)?s.getSelection(e):null};},restoreSelection:function restoreSelection(e){var t=u(),n=e.focusedElem,o=e.selectionRange;t!==n&&r(n)&&(s.hasSelectionCapabilities(n)&&s.setSelection(n,o),a(n));},getSelection:function getSelection(e){var t;if("selectionStart"in e)t={start:e.selectionStart,end:e.selectionEnd};else if(document.selection&&"INPUT"===e.nodeName){var n=document.selection.createRange();n.parentElement()===e&&(t={start:-n.moveStart("character",-e.value.length),end:-n.moveEnd("character",-e.value.length)});}else t=o.getOffsets(e);return t||{start:0,end:0};},setSelection:function setSelection(e,t){var n=t.start,r=t.end;if("undefined"==typeof r&&(r=n),"selectionStart"in e)e.selectionStart=n,e.selectionEnd=Math.min(r,e.value.length);else if(document.selection&&"INPUT"===e.nodeName){var i=e.createTextRange();i.collapse(!0),i.moveStart("character",n),i.moveEnd("character",r-n),i.select();}else o.setOffsets(e,t);}};t.exports=s;},{107:107,117:117,119:119,50:50}],64:[function(e,t,n){"use strict";function r(e){return f+e.toString(36);}function o(e,t){return e.charAt(t)===f||t===e.length;}function i(e){return""===e||e.charAt(0)===f&&e.charAt(e.length-1)!==f;}function a(e,t){return 0===t.indexOf(e)&&o(t,e.length);}function u(e){return e?e.substr(0,e.lastIndexOf(f)):"";}function s(e,t){if(d(i(e)&&i(t)),d(a(e,t)),e===t)return e;var n,r=e.length+h;for(n=r;n<t.length&&!o(t,n);n++){}return t.substr(0,n);}function l(e,t){var n=Math.min(e.length,t.length);if(0===n)return"";for(var r=0,a=0;n>=a;a++){if(o(e,a)&&o(t,a))r=a;else if(e.charAt(a)!==t.charAt(a))break;}var u=e.substr(0,r);return d(i(u)),u;}function c(e,t,n,r,o,i){e=e||"",t=t||"",d(e!==t);var l=a(t,e);d(l||a(e,t));for(var c=0,p=l?u:s,f=e;;f=p(f,t)){var h;if(o&&f===e||i&&f===t||(h=n(f,l,r)),h===!1||f===t)break;d(c++<m);}}var p=e(81),d=e(133),f=".",h=f.length,m=100,v={createReactRootID:function createReactRootID(){return r(p.createReactRootIndex());},createReactID:function createReactID(e,t){return e+t;},getReactRootIDFromNodeID:function getReactRootIDFromNodeID(e){if(e&&e.charAt(0)===f&&e.length>1){var t=e.indexOf(f,1);return t>-1?e.substr(0,t):e;}return null;},traverseEnterLeave:function traverseEnterLeave(e,t,n,r,o){var i=l(e,t);i!==e&&c(e,i,n,r,!1,!0),i!==t&&c(i,t,n,o,!0,!1);},traverseTwoPhase:function traverseTwoPhase(e,t,n){e&&(c("",e,t,n,!0,!1),c(e,"",t,n,!1,!0));},traverseAncestors:function traverseAncestors(e,t,n){c("",e,t,n,!0,!1);},_getFirstCommonAncestorID:l,_getNextDescendantID:s,isAncestorIDOf:a,SEPARATOR:f};t.exports=v;},{133:133,81:81}],65:[function(e,t,n){"use strict";var r={remove:function remove(e){e._reactInternalInstance=void 0;},get:function get(e){return e._reactInternalInstance;},has:function has(e){return void 0!==e._reactInternalInstance;},set:function set(e,t){e._reactInternalInstance=t;}};t.exports=r;},{}],66:[function(e,t,n){"use strict";var r={currentlyMountingInstance:null,currentlyUnmountingInstance:null};t.exports=r;},{}],67:[function(e,t,n){"use strict";var r=e(104),o={CHECKSUM_ATTR_NAME:"data-react-checksum",addChecksumToMarkup:function addChecksumToMarkup(e){var t=r(e);return e.replace(">"," "+o.CHECKSUM_ATTR_NAME+'="'+t+'">');},canReuseMarkup:function canReuseMarkup(e,t){var n=t.getAttribute(o.CHECKSUM_ATTR_NAME);n=n&&parseInt(n,10);var i=r(e);return i===n;}};t.exports=o;},{104:104}],68:[function(e,t,n){"use strict";function r(e,t){for(var n=Math.min(e.length,t.length),r=0;n>r;r++){if(e.charAt(r)!==t.charAt(r))return r;}return e.length===t.length?-1:n;}function o(e){var t=P(e);return t&&K.getID(t);}function i(e){var t=a(e);if(t)if(L.hasOwnProperty(t)){var n=L[t];n!==e&&(w(!c(n,t)),L[t]=e);}else L[t]=e;return t;}function a(e){return e&&e.getAttribute&&e.getAttribute(k)||"";}function u(e,t){var n=a(e);n!==t&&delete L[n],e.setAttribute(k,t),L[t]=e;}function s(e){return L.hasOwnProperty(e)&&c(L[e],e)||(L[e]=K.findReactNodeByID(e)),L[e];}function l(e){var t=b.get(e)._rootNodeID;return C.isNullComponentID(t)?null:(L.hasOwnProperty(t)&&c(L[t],t)||(L[t]=K.findReactNodeByID(t)),L[t]);}function c(e,t){if(e){w(a(e)===t);var n=K.findReactContainerForID(t);if(n&&T(n,e))return!0;}return!1;}function p(e){delete L[e];}function d(e){var t=L[e];return t&&c(t,e)?void(W=t):!1;}function f(e){W=null,E.traverseAncestors(e,d);var t=W;return W=null,t;}function h(e,t,n,r,o){var i=D.mountComponent(e,t,r,I);e._isTopLevel=!0,K._mountImageIntoNode(i,n,o);}function m(e,t,n,r){var o=N.ReactReconcileTransaction.getPooled();o.perform(h,null,e,t,n,o,r),N.ReactReconcileTransaction.release(o);}var v=e(10),g=e(30),y=(e(39),e(55)),C=(e(56),e(57)),E=e(64),b=e(65),_=e(67),x=e(73),D=e(79),M=e(84),N=e(85),I=e(113),T=e(107),P=e(127),R=e(132),w=e(133),O=e(144),S=e(147),A=(e(150),E.SEPARATOR),k=v.ID_ATTRIBUTE_NAME,L={},U=1,F=9,B={},V={},j=[],W=null,K={_instancesByReactRootID:B,scrollMonitor:function scrollMonitor(e,t){t();},_updateRootComponent:function _updateRootComponent(e,t,n,r){return K.scrollMonitor(n,function(){M.enqueueElementInternal(e,t),r&&M.enqueueCallbackInternal(e,r);}),e;},_registerComponent:function _registerComponent(e,t){w(t&&(t.nodeType===U||t.nodeType===F)),g.ensureScrollValueMonitoring();var n=K.registerContainer(t);return B[n]=e,n;},_renderNewRootComponent:function _renderNewRootComponent(e,t,n){var r=R(e,null),o=K._registerComponent(r,t);return N.batchedUpdates(m,r,o,t,n),r;},render:function render(e,t,n){w(y.isValidElement(e));var r=B[o(t)];if(r){var i=r._currentElement;if(S(i,e))return K._updateRootComponent(r,e,t,n).getPublicInstance();K.unmountComponentAtNode(t);}var a=P(t),u=a&&K.isRenderedByReact(a),s=u&&!r,l=K._renderNewRootComponent(e,t,s).getPublicInstance();return n&&n.call(l),l;},constructAndRenderComponent:function constructAndRenderComponent(e,t,n){var r=y.createElement(e,t);return K.render(r,n);},constructAndRenderComponentByID:function constructAndRenderComponentByID(e,t,n){var r=document.getElementById(n);return w(r),K.constructAndRenderComponent(e,t,r);},registerContainer:function registerContainer(e){var t=o(e);return t&&(t=E.getReactRootIDFromNodeID(t)),t||(t=E.createReactRootID()),V[t]=e,t;},unmountComponentAtNode:function unmountComponentAtNode(e){w(e&&(e.nodeType===U||e.nodeType===F));var t=o(e),n=B[t];return n?(K.unmountComponentFromNode(n,e),delete B[t],delete V[t],!0):!1;},unmountComponentFromNode:function unmountComponentFromNode(e,t){for(D.unmountComponent(e),t.nodeType===F&&(t=t.documentElement);t.lastChild;){t.removeChild(t.lastChild);}},findReactContainerForID:function findReactContainerForID(e){var t=E.getReactRootIDFromNodeID(e),n=V[t];return n;},findReactNodeByID:function findReactNodeByID(e){var t=K.findReactContainerForID(e);return K.findComponentRoot(t,e);},isRenderedByReact:function isRenderedByReact(e){if(1!==e.nodeType)return!1;var t=K.getID(e);return t?t.charAt(0)===A:!1;},getFirstReactDOM:function getFirstReactDOM(e){for(var t=e;t&&t.parentNode!==t;){if(K.isRenderedByReact(t))return t;t=t.parentNode;}return null;},findComponentRoot:function findComponentRoot(e,t){var n=j,r=0,o=f(t)||e;for(n[0]=o.firstChild,n.length=1;r<n.length;){for(var i,a=n[r++];a;){var u=K.getID(a);u?t===u?i=a:E.isAncestorIDOf(u,t)&&(n.length=r=0,n.push(a.firstChild)):n.push(a.firstChild),a=a.nextSibling;}if(i)return n.length=0,i;}n.length=0,w(!1);},_mountImageIntoNode:function _mountImageIntoNode(e,t,n){if(w(t&&(t.nodeType===U||t.nodeType===F)),n){var o=P(t);if(_.canReuseMarkup(e,o))return;var i=o.getAttribute(_.CHECKSUM_ATTR_NAME);o.removeAttribute(_.CHECKSUM_ATTR_NAME);var a=o.outerHTML;o.setAttribute(_.CHECKSUM_ATTR_NAME,i);var u=r(e,a);" (client) "+e.substring(u-20,u+20)+"\n (server) "+a.substring(u-20,u+20),w(t.nodeType!==F);}w(t.nodeType!==F),O(t,e);},getReactRootID:o,getID:i,setID:u,getNode:s,getNodeFromInstance:l,purgeID:p};x.measureMethods(K,"ReactMount",{_renderNewRootComponent:"_renderNewRootComponent",_mountImageIntoNode:"_mountImageIntoNode"}),t.exports=K;},{10:10,107:107,113:113,127:127,132:132,133:133,144:144,147:147,150:150,30:30,39:39,55:55,56:56,57:57,64:64,65:65,67:67,73:73,79:79,84:84,85:85}],69:[function(e,t,n){"use strict";function r(e,t,n){h.push({parentID:e,parentNode:null,type:c.INSERT_MARKUP,markupIndex:m.push(t)-1,textContent:null,fromIndex:null,toIndex:n});}function o(e,t,n){h.push({parentID:e,parentNode:null,type:c.MOVE_EXISTING,markupIndex:null,textContent:null,fromIndex:t,toIndex:n});}function i(e,t){h.push({parentID:e,parentNode:null,type:c.REMOVE_NODE,markupIndex:null,textContent:null,fromIndex:t,toIndex:null});}function a(e,t){h.push({parentID:e,parentNode:null,type:c.TEXT_CONTENT,markupIndex:null,textContent:t,fromIndex:null,toIndex:null});}function u(){h.length&&(l.processChildrenUpdates(h,m),s());}function s(){h.length=0,m.length=0;}var l=e(36),c=e(70),p=e(79),d=e(31),f=0,h=[],m=[],v={Mixin:{mountChildren:function mountChildren(e,t,n){var r=d.instantiateChildren(e,t,n);this._renderedChildren=r;var o=[],i=0;for(var a in r){if(r.hasOwnProperty(a)){var u=r[a],s=this._rootNodeID+a,l=p.mountComponent(u,s,t,n);u._mountIndex=i,o.push(l),i++;}}return o;},updateTextContent:function updateTextContent(e){f++;var t=!0;try{var n=this._renderedChildren;d.unmountChildren(n);for(var r in n){n.hasOwnProperty(r)&&this._unmountChildByName(n[r],r);}this.setTextContent(e),t=!1;}finally{f--,f||(t?s():u());}},updateChildren:function updateChildren(e,t,n){f++;var r=!0;try{this._updateChildren(e,t,n),r=!1;}finally{f--,f||(r?s():u());}},_updateChildren:function _updateChildren(e,t,n){var r=this._renderedChildren,o=d.updateChildren(r,e,t,n);if(this._renderedChildren=o,o||r){var i,a=0,u=0;for(i in o){if(o.hasOwnProperty(i)){var s=r&&r[i],l=o[i];s===l?(this.moveChild(s,u,a),a=Math.max(s._mountIndex,a),s._mountIndex=u):(s&&(a=Math.max(s._mountIndex,a),this._unmountChildByName(s,i)),this._mountChildByNameAtIndex(l,i,u,t,n)),u++;}}for(i in r){!r.hasOwnProperty(i)||o&&o.hasOwnProperty(i)||this._unmountChildByName(r[i],i);}}},unmountChildren:function unmountChildren(){var e=this._renderedChildren;d.unmountChildren(e),this._renderedChildren=null;},moveChild:function moveChild(e,t,n){e._mountIndex<n&&o(this._rootNodeID,e._mountIndex,t);},createChild:function createChild(e,t){r(this._rootNodeID,t,e._mountIndex);},removeChild:function removeChild(e){i(this._rootNodeID,e._mountIndex);},setTextContent:function setTextContent(e){a(this._rootNodeID,e);},_mountChildByNameAtIndex:function _mountChildByNameAtIndex(e,t,n,r,o){var i=this._rootNodeID+t,a=p.mountComponent(e,i,r,o);e._mountIndex=n,this.createChild(e,a);},_unmountChildByName:function _unmountChildByName(e,t){this.removeChild(e),e._mountIndex=null;}}};t.exports=v;},{31:31,36:36,70:70,79:79}],70:[function(e,t,n){"use strict";var r=e(138),o=r({INSERT_MARKUP:null,MOVE_EXISTING:null,REMOVE_NODE:null,TEXT_CONTENT:null});t.exports=o;},{138:138}],71:[function(e,t,n){"use strict";function r(e){if("function"==typeof e.type)return e.type;var t=e.type,n=p[t];return null==n&&(p[t]=n=l(t)),n;}function o(e){return s(c),new c(e.type,e.props);}function i(e){return new d(e);}function a(e){return e instanceof d;}var u=e(27),s=e(133),l=null,c=null,p={},d=null,f={injectGenericComponentClass:function injectGenericComponentClass(e){c=e;},injectTextComponentClass:function injectTextComponentClass(e){d=e;},injectComponentClasses:function injectComponentClasses(e){u(p,e);},injectAutoWrapper:function injectAutoWrapper(e){l=e;}},h={getComponentClassForElement:r,createInternalComponent:o,createInstanceForText:i,isTextComponent:a,injection:f};t.exports=h;},{133:133,27:27}],72:[function(e,t,n){"use strict";var r=e(133),o={isValidOwner:function isValidOwner(e){return!(!e||"function"!=typeof e.attachRef||"function"!=typeof e.detachRef);},addComponentAsRefTo:function addComponentAsRefTo(e,t,n){r(o.isValidOwner(n)),n.attachRef(t,e);},removeComponentAsRefFrom:function removeComponentAsRefFrom(e,t,n){r(o.isValidOwner(n)),n.getPublicInstance().refs[t]===e.getPublicInstance()&&n.detachRef(t);}};t.exports=o;},{133:133}],73:[function(e,t,n){"use strict";function r(e,t,n){return n;}var o={enableMeasure:!1,storedMeasure:r,measureMethods:function measureMethods(e,t,n){},measure:function measure(e,t,n){return n;},injection:{injectMeasure:function injectMeasure(e){o.storedMeasure=e;}}};t.exports=o;},{}],74:[function(e,t,n){"use strict";var r={};t.exports=r;},{}],75:[function(e,t,n){"use strict";var r=e(138),o=r({prop:null,context:null,childContext:null});t.exports=o;},{138:138}],76:[function(e,t,n){"use strict";function r(e){function t(t,n,r,o,i){if(o=o||b,null==n[r]){var a=C[i];return t?new Error("Required "+a+" `"+r+"` was not specified in "+("`"+o+"`.")):null;}return e(n,r,o,i);}var n=t.bind(null,!1);return n.isRequired=t.bind(null,!0),n;}function o(e){function t(t,n,r,o){var i=t[n],a=m(i);if(a!==e){var u=C[o],s=v(i);return new Error("Invalid "+u+" `"+n+"` of type `"+s+"` "+("supplied to `"+r+"`, expected `"+e+"`."));}return null;}return r(t);}function i(){return r(E.thatReturns(null));}function a(e){function t(t,n,r,o){var i=t[n];if(!Array.isArray(i)){var a=C[o],u=m(i);return new Error("Invalid "+a+" `"+n+"` of type "+("`"+u+"` supplied to `"+r+"`, expected an array."));}for(var s=0;s<i.length;s++){var l=e(i,s,r,o);if(l instanceof Error)return l;}return null;}return r(t);}function u(){function e(e,t,n,r){if(!g.isValidElement(e[t])){var o=C[r];return new Error("Invalid "+o+" `"+t+"` supplied to "+("`"+n+"`, expected a ReactElement."));}return null;}return r(e);}function s(e){function t(t,n,r,o){if(!(t[n]instanceof e)){var i=C[o],a=e.name||b;return new Error("Invalid "+i+" `"+n+"` supplied to "+("`"+r+"`, expected instance of `"+a+"`."));}return null;}return r(t);}function l(e){function t(t,n,r,o){for(var i=t[n],a=0;a<e.length;a++){if(i===e[a])return null;}var u=C[o],s=JSON.stringify(e);return new Error("Invalid "+u+" `"+n+"` of value `"+i+"` "+("supplied to `"+r+"`, expected one of "+s+"."));}return r(t);}function c(e){function t(t,n,r,o){var i=t[n],a=m(i);if("object"!==a){var u=C[o];return new Error("Invalid "+u+" `"+n+"` of type "+("`"+a+"` supplied to `"+r+"`, expected an object."));}for(var s in i){if(i.hasOwnProperty(s)){var l=e(i,s,r,o);if(l instanceof Error)return l;}}return null;}return r(t);}function p(e){function t(t,n,r,o){for(var i=0;i<e.length;i++){var a=e[i];if(null==a(t,n,r,o))return null;}var u=C[o];return new Error("Invalid "+u+" `"+n+"` supplied to "+("`"+r+"`."));}return r(t);}function d(){function e(e,t,n,r){if(!h(e[t])){var o=C[r];return new Error("Invalid "+o+" `"+t+"` supplied to "+("`"+n+"`, expected a ReactNode."));}return null;}return r(e);}function f(e){function t(t,n,r,o){var i=t[n],a=m(i);if("object"!==a){var u=C[o];return new Error("Invalid "+u+" `"+n+"` of type `"+a+"` "+("supplied to `"+r+"`, expected `object`."));}for(var s in e){var l=e[s];if(l){var c=l(i,s,r,o);if(c)return c;}}return null;}return r(t);}function h(e){switch(typeof e==="undefined"?"undefined":_typeof(e)){case"number":case"string":case"undefined":return!0;case"boolean":return!e;case"object":if(Array.isArray(e))return e.every(h);if(null===e||g.isValidElement(e))return!0;e=y.extractIfFragment(e);for(var t in e){if(!h(e[t]))return!1;}return!0;default:return!1;}}function m(e){var t=typeof e==="undefined"?"undefined":_typeof(e);return Array.isArray(e)?"array":e instanceof RegExp?"object":t;}function v(e){var t=m(e);if("object"===t){if(e instanceof Date)return"date";if(e instanceof RegExp)return"regexp";}return t;}var g=e(55),y=e(61),C=e(74),E=e(112),b="<<anonymous>>",_=u(),x=d(),D={array:o("array"),bool:o("boolean"),func:o("function"),number:o("number"),object:o("object"),string:o("string"),any:i(),arrayOf:a,element:_,instanceOf:s,node:x,objectOf:c,oneOf:l,oneOfType:p,shape:f};t.exports=D;},{112:112,55:55,61:61,74:74}],77:[function(e,t,n){"use strict";function r(){this.listenersToPut=[];}var o=e(28),i=e(30),a=e(27);a(r.prototype,{enqueuePutListener:function enqueuePutListener(e,t,n){this.listenersToPut.push({rootNodeID:e,propKey:t,propValue:n});},putListeners:function putListeners(){for(var e=0;e<this.listenersToPut.length;e++){var t=this.listenersToPut[e];i.putListener(t.rootNodeID,t.propKey,t.propValue);}},reset:function reset(){this.listenersToPut.length=0;},destructor:function destructor(){this.reset();}}),o.addPoolingTo(r),t.exports=r;},{27:27,28:28,30:30}],78:[function(e,t,n){"use strict";function r(){this.reinitializeTransaction(),this.renderToStaticMarkup=!1,this.reactMountReady=o.getPooled(null),this.putListenerQueue=s.getPooled();}var o=e(6),i=e(28),a=e(30),u=e(63),s=e(77),l=e(101),c=e(27),p={initialize:u.getSelectionInformation,close:u.restoreSelection},d={initialize:function initialize(){var e=a.isEnabled();return a.setEnabled(!1),e;},close:function close(e){a.setEnabled(e);}},f={initialize:function initialize(){this.reactMountReady.reset();},close:function close(){this.reactMountReady.notifyAll();}},h={initialize:function initialize(){this.putListenerQueue.reset();},close:function close(){this.putListenerQueue.putListeners();}},m=[h,p,d,f],v={getTransactionWrappers:function getTransactionWrappers(){return m;},getReactMountReady:function getReactMountReady(){return this.reactMountReady;},getPutListenerQueue:function getPutListenerQueue(){return this.putListenerQueue;},destructor:function destructor(){o.release(this.reactMountReady),this.reactMountReady=null,s.release(this.putListenerQueue),this.putListenerQueue=null;}};c(r.prototype,l.Mixin,v),i.addPoolingTo(r),t.exports=r;},{101:101,27:27,28:28,30:30,6:6,63:63,77:77}],79:[function(e,t,n){"use strict";function r(){o.attachRefs(this,this._currentElement);}var o=e(80),i=(e(56),{mountComponent:function mountComponent(e,t,n,o){var i=e.mountComponent(t,n,o);return n.getReactMountReady().enqueue(r,e),i;},unmountComponent:function unmountComponent(e){o.detachRefs(e,e._currentElement),e.unmountComponent();},receiveComponent:function receiveComponent(e,t,n,i){var a=e._currentElement;if(t!==a||null==t._owner){var u=o.shouldUpdateRefs(a,t);u&&o.detachRefs(e,a),e.receiveComponent(t,n,i),u&&n.getReactMountReady().enqueue(r,e);}},performUpdateIfNecessary:function performUpdateIfNecessary(e,t){e.performUpdateIfNecessary(t);}});t.exports=i;},{56:56,80:80}],80:[function(e,t,n){"use strict";function r(e,t,n){"function"==typeof e?e(t.getPublicInstance()):i.addComponentAsRefTo(t,e,n);}function o(e,t,n){"function"==typeof e?e(null):i.removeComponentAsRefFrom(t,e,n);}var i=e(72),a={};a.attachRefs=function(e,t){var n=t.ref;null!=n&&r(n,e,t._owner);},a.shouldUpdateRefs=function(e,t){return t._owner!==e._owner||t.ref!==e.ref;},a.detachRefs=function(e,t){var n=t.ref;null!=n&&o(n,e,t._owner);},t.exports=a;},{72:72}],81:[function(e,t,n){"use strict";var r={injectCreateReactRootIndex:function injectCreateReactRootIndex(e){o.createReactRootIndex=e;}},o={createReactRootIndex:null,injection:r};t.exports=o;},{}],82:[function(e,t,n){"use strict";function r(e){p(i.isValidElement(e));var t;try{var n=a.createReactRootID();return t=s.getPooled(!1),t.perform(function(){var r=c(e,null),o=r.mountComponent(n,t,l);return u.addChecksumToMarkup(o);},null);}finally{s.release(t);}}function o(e){p(i.isValidElement(e));var t;try{var n=a.createReactRootID();return t=s.getPooled(!0),t.perform(function(){var r=c(e,null);return r.mountComponent(n,t,l);},null);}finally{s.release(t);}}var i=e(55),a=e(64),u=e(67),s=e(83),l=e(113),c=e(132),p=e(133);t.exports={renderToString:r,renderToStaticMarkup:o};},{113:113,132:132,133:133,55:55,64:64,67:67,83:83}],83:[function(e,t,n){"use strict";function r(e){this.reinitializeTransaction(),this.renderToStaticMarkup=e,this.reactMountReady=i.getPooled(null),this.putListenerQueue=a.getPooled();}var o=e(28),i=e(6),a=e(77),u=e(101),s=e(27),l=e(112),c={initialize:function initialize(){this.reactMountReady.reset();},close:l},p={initialize:function initialize(){this.putListenerQueue.reset();},close:l},d=[p,c],f={getTransactionWrappers:function getTransactionWrappers(){return d;},getReactMountReady:function getReactMountReady(){return this.reactMountReady;},getPutListenerQueue:function getPutListenerQueue(){return this.putListenerQueue;},destructor:function destructor(){i.release(this.reactMountReady),this.reactMountReady=null,a.release(this.putListenerQueue),this.putListenerQueue=null;}};s(r.prototype,u.Mixin,f),o.addPoolingTo(r),t.exports=r;},{101:101,112:112,27:27,28:28,6:6,77:77}],84:[function(e,t,n){"use strict";function r(e){e!==i.currentlyMountingInstance&&l.enqueueUpdate(e);}function o(e,t){p(null==a.current);var n=s.get(e);return n?n===i.currentlyUnmountingInstance?null:n:null;}var i=e(66),a=e(39),u=e(55),s=e(65),l=e(85),c=e(27),p=e(133),d=(e(150),{enqueueCallback:function enqueueCallback(e,t){p("function"==typeof t);var n=o(e);return n&&n!==i.currentlyMountingInstance?(n._pendingCallbacks?n._pendingCallbacks.push(t):n._pendingCallbacks=[t],void r(n)):null;},enqueueCallbackInternal:function enqueueCallbackInternal(e,t){p("function"==typeof t),e._pendingCallbacks?e._pendingCallbacks.push(t):e._pendingCallbacks=[t],r(e);},enqueueForceUpdate:function enqueueForceUpdate(e){var t=o(e,"forceUpdate");t&&(t._pendingForceUpdate=!0,r(t));},enqueueReplaceState:function enqueueReplaceState(e,t){var n=o(e,"replaceState");n&&(n._pendingStateQueue=[t],n._pendingReplaceState=!0,r(n));},enqueueSetState:function enqueueSetState(e,t){var n=o(e,"setState");if(n){var i=n._pendingStateQueue||(n._pendingStateQueue=[]);i.push(t),r(n);}},enqueueSetProps:function enqueueSetProps(e,t){var n=o(e,"setProps");if(n){p(n._isTopLevel);var i=n._pendingElement||n._currentElement,a=c({},i.props,t);n._pendingElement=u.cloneAndReplaceProps(i,a),r(n);}},enqueueReplaceProps:function enqueueReplaceProps(e,t){var n=o(e,"replaceProps");if(n){p(n._isTopLevel);var i=n._pendingElement||n._currentElement;n._pendingElement=u.cloneAndReplaceProps(i,t),r(n);}},enqueueElementInternal:function enqueueElementInternal(e,t){e._pendingElement=t,r(e);}});t.exports=d;},{133:133,150:150,27:27,39:39,55:55,65:65,66:66,85:85}],85:[function(e,t,n){"use strict";function r(){v(N.ReactReconcileTransaction&&E);}function o(){this.reinitializeTransaction(),this.dirtyComponentsLength=null,this.callbackQueue=c.getPooled(),this.reconcileTransaction=N.ReactReconcileTransaction.getPooled();}function i(e,t,n,o,i){r(),E.batchedUpdates(e,t,n,o,i);}function a(e,t){return e._mountOrder-t._mountOrder;}function u(e){var t=e.dirtyComponentsLength;v(t===g.length),g.sort(a);for(var n=0;t>n;n++){var r=g[n],o=r._pendingCallbacks;if(r._pendingCallbacks=null,f.performUpdateIfNecessary(r,e.reconcileTransaction),o)for(var i=0;i<o.length;i++){e.callbackQueue.enqueue(o[i],r.getPublicInstance());}}}function s(e){return r(),E.isBatchingUpdates?void g.push(e):void E.batchedUpdates(s,e);}function l(e,t){v(E.isBatchingUpdates),y.enqueue(e,t),C=!0;}var c=e(6),p=e(28),d=(e(39),e(73)),f=e(79),h=e(101),m=e(27),v=e(133),g=(e(150),[]),y=c.getPooled(),C=!1,E=null,b={initialize:function initialize(){this.dirtyComponentsLength=g.length;},close:function close(){this.dirtyComponentsLength!==g.length?(g.splice(0,this.dirtyComponentsLength),D()):g.length=0;}},_={initialize:function initialize(){this.callbackQueue.reset();},close:function close(){this.callbackQueue.notifyAll();}},x=[b,_];m(o.prototype,h.Mixin,{getTransactionWrappers:function getTransactionWrappers(){return x;},destructor:function destructor(){this.dirtyComponentsLength=null,c.release(this.callbackQueue),this.callbackQueue=null,N.ReactReconcileTransaction.release(this.reconcileTransaction),this.reconcileTransaction=null;},perform:function perform(e,t,n){return h.Mixin.perform.call(this,this.reconcileTransaction.perform,this.reconcileTransaction,e,t,n);}}),p.addPoolingTo(o);var D=function D(){for(;g.length||C;){if(g.length){var e=o.getPooled();e.perform(u,null,e),o.release(e);}if(C){C=!1;var t=y;y=c.getPooled(),t.notifyAll(),c.release(t);}}};D=d.measure("ReactUpdates","flushBatchedUpdates",D);var M={injectReconcileTransaction:function injectReconcileTransaction(e){v(e),N.ReactReconcileTransaction=e;},injectBatchingStrategy:function injectBatchingStrategy(e){v(e),v("function"==typeof e.batchedUpdates),v("boolean"==typeof e.isBatchingUpdates),E=e;}},N={ReactReconcileTransaction:null,batchedUpdates:i,enqueueUpdate:s,flushBatchedUpdates:D,injection:M,asap:l};t.exports=N;},{101:101,133:133,150:150,27:27,28:28,39:39,6:6,73:73,79:79}],86:[function(e,t,n){"use strict";var r=e(10),o=r.injection.MUST_USE_ATTRIBUTE,i={Properties:{clipPath:o,cx:o,cy:o,d:o,dx:o,dy:o,fill:o,fillOpacity:o,fontFamily:o,fontSize:o,fx:o,fy:o,gradientTransform:o,gradientUnits:o,markerEnd:o,markerMid:o,markerStart:o,offset:o,opacity:o,patternContentUnits:o,patternUnits:o,points:o,preserveAspectRatio:o,r:o,rx:o,ry:o,spreadMethod:o,stopColor:o,stopOpacity:o,stroke:o,strokeDasharray:o,strokeLinecap:o,strokeOpacity:o,strokeWidth:o,textAnchor:o,transform:o,version:o,viewBox:o,x1:o,x2:o,x:o,y1:o,y2:o,y:o},DOMAttributeNames:{clipPath:"clip-path",fillOpacity:"fill-opacity",fontFamily:"font-family",fontSize:"font-size",gradientTransform:"gradientTransform",gradientUnits:"gradientUnits",markerEnd:"marker-end",markerMid:"marker-mid",markerStart:"marker-start",patternContentUnits:"patternContentUnits",patternUnits:"patternUnits",preserveAspectRatio:"preserveAspectRatio",spreadMethod:"spreadMethod",stopColor:"stop-color",stopOpacity:"stop-opacity",strokeDasharray:"stroke-dasharray",strokeLinecap:"stroke-linecap",strokeOpacity:"stroke-opacity",strokeWidth:"stroke-width",textAnchor:"text-anchor",viewBox:"viewBox"}};t.exports=i;},{10:10}],87:[function(e,t,n){"use strict";function r(e){if("selectionStart"in e&&u.hasSelectionCapabilities(e))return{start:e.selectionStart,end:e.selectionEnd};if(window.getSelection){var t=window.getSelection();return{anchorNode:t.anchorNode,anchorOffset:t.anchorOffset,focusNode:t.focusNode,focusOffset:t.focusOffset};}if(document.selection){var n=document.selection.createRange();return{parentElement:n.parentElement(),text:n.text,top:n.boundingTop,left:n.boundingLeft};}}function o(e){if(y||null==m||m!==l())return null;var t=r(m);if(!g||!d(g,t)){g=t;var n=s.getPooled(h.select,v,e);return n.type="select",n.target=m,a.accumulateTwoPhaseDispatches(n),n;}}var i=e(15),a=e(20),u=e(63),s=e(93),l=e(119),c=e(136),p=e(139),d=e(146),f=i.topLevelTypes,h={select:{phasedRegistrationNames:{bubbled:p({onSelect:null}),captured:p({onSelectCapture:null})},dependencies:[f.topBlur,f.topContextMenu,f.topFocus,f.topKeyDown,f.topMouseDown,f.topMouseUp,f.topSelectionChange]}},m=null,v=null,g=null,y=!1,C={eventTypes:h,extractEvents:function extractEvents(e,t,n,r){switch(e){case f.topFocus:(c(t)||"true"===t.contentEditable)&&(m=t,v=n,g=null);break;case f.topBlur:m=null,v=null,g=null;break;case f.topMouseDown:y=!0;break;case f.topContextMenu:case f.topMouseUp:return y=!1,o(r);case f.topSelectionChange:case f.topKeyDown:case f.topKeyUp:return o(r);}}};t.exports=C;},{119:119,136:136,139:139,146:146,15:15,20:20,63:63,93:93}],88:[function(e,t,n){"use strict";var r=Math.pow(2,53),o={createReactRootIndex:function createReactRootIndex(){return Math.ceil(Math.random()*r);}};t.exports=o;},{}],89:[function(e,t,n){"use strict";var r=e(15),o=e(19),i=e(20),a=e(90),u=e(93),s=e(94),l=e(96),c=e(97),p=e(92),d=e(98),f=e(99),h=e(100),m=e(120),v=e(133),g=e(139),y=(e(150),r.topLevelTypes),C={blur:{phasedRegistrationNames:{bubbled:g({onBlur:!0}),captured:g({onBlurCapture:!0})}},click:{phasedRegistrationNames:{bubbled:g({onClick:!0}),captured:g({onClickCapture:!0})}},contextMenu:{phasedRegistrationNames:{bubbled:g({onContextMenu:!0}),captured:g({onContextMenuCapture:!0})}},copy:{phasedRegistrationNames:{bubbled:g({onCopy:!0}),captured:g({onCopyCapture:!0})}},cut:{phasedRegistrationNames:{bubbled:g({onCut:!0}),captured:g({onCutCapture:!0})}},doubleClick:{phasedRegistrationNames:{bubbled:g({onDoubleClick:!0}),captured:g({onDoubleClickCapture:!0})}},drag:{phasedRegistrationNames:{bubbled:g({onDrag:!0}),captured:g({onDragCapture:!0})}},dragEnd:{phasedRegistrationNames:{bubbled:g({onDragEnd:!0}),captured:g({onDragEndCapture:!0})}},dragEnter:{phasedRegistrationNames:{bubbled:g({onDragEnter:!0}),captured:g({onDragEnterCapture:!0})}},dragExit:{phasedRegistrationNames:{bubbled:g({onDragExit:!0}),captured:g({onDragExitCapture:!0})}},dragLeave:{phasedRegistrationNames:{bubbled:g({onDragLeave:!0}),captured:g({onDragLeaveCapture:!0})}},dragOver:{phasedRegistrationNames:{bubbled:g({onDragOver:!0}),captured:g({onDragOverCapture:!0})}},dragStart:{phasedRegistrationNames:{bubbled:g({onDragStart:!0}),captured:g({onDragStartCapture:!0})}},drop:{phasedRegistrationNames:{bubbled:g({onDrop:!0}),captured:g({onDropCapture:!0})}},focus:{phasedRegistrationNames:{bubbled:g({onFocus:!0}),captured:g({onFocusCapture:!0})}},input:{phasedRegistrationNames:{bubbled:g({onInput:!0}),captured:g({onInputCapture:!0})}},keyDown:{phasedRegistrationNames:{bubbled:g({onKeyDown:!0}),captured:g({onKeyDownCapture:!0})}},keyPress:{phasedRegistrationNames:{bubbled:g({onKeyPress:!0}),captured:g({onKeyPressCapture:!0})}},keyUp:{phasedRegistrationNames:{bubbled:g({onKeyUp:!0}),captured:g({onKeyUpCapture:!0})}},load:{phasedRegistrationNames:{bubbled:g({onLoad:!0}),captured:g({onLoadCapture:!0})}},error:{phasedRegistrationNames:{bubbled:g({onError:!0}),captured:g({onErrorCapture:!0})}},mouseDown:{phasedRegistrationNames:{bubbled:g({onMouseDown:!0}),captured:g({onMouseDownCapture:!0})}},mouseMove:{phasedRegistrationNames:{bubbled:g({onMouseMove:!0}),captured:g({onMouseMoveCapture:!0})}},mouseOut:{phasedRegistrationNames:{bubbled:g({onMouseOut:!0}),captured:g({onMouseOutCapture:!0})}},mouseOver:{phasedRegistrationNames:{bubbled:g({onMouseOver:!0}),captured:g({onMouseOverCapture:!0})}},mouseUp:{phasedRegistrationNames:{bubbled:g({onMouseUp:!0}),captured:g({onMouseUpCapture:!0})}},paste:{phasedRegistrationNames:{bubbled:g({onPaste:!0}),captured:g({onPasteCapture:!0})}},reset:{phasedRegistrationNames:{bubbled:g({onReset:!0}),captured:g({onResetCapture:!0})}},scroll:{phasedRegistrationNames:{bubbled:g({onScroll:!0}),captured:g({onScrollCapture:!0})}},submit:{phasedRegistrationNames:{bubbled:g({onSubmit:!0}),captured:g({onSubmitCapture:!0})}},touchCancel:{phasedRegistrationNames:{bubbled:g({onTouchCancel:!0}),captured:g({onTouchCancelCapture:!0})}},touchEnd:{phasedRegistrationNames:{bubbled:g({onTouchEnd:!0}),captured:g({onTouchEndCapture:!0})}},touchMove:{phasedRegistrationNames:{bubbled:g({onTouchMove:!0}),captured:g({onTouchMoveCapture:!0})}},touchStart:{phasedRegistrationNames:{bubbled:g({onTouchStart:!0}),captured:g({onTouchStartCapture:!0})}},wheel:{phasedRegistrationNames:{bubbled:g({onWheel:!0}),captured:g({onWheelCapture:!0})}}},E={topBlur:C.blur,topClick:C.click,topContextMenu:C.contextMenu,topCopy:C.copy,topCut:C.cut,topDoubleClick:C.doubleClick,topDrag:C.drag,topDragEnd:C.dragEnd,topDragEnter:C.dragEnter,topDragExit:C.dragExit,topDragLeave:C.dragLeave,topDragOver:C.dragOver,topDragStart:C.dragStart,topDrop:C.drop,topError:C.error,topFocus:C.focus,topInput:C.input,topKeyDown:C.keyDown,topKeyPress:C.keyPress,topKeyUp:C.keyUp,topLoad:C.load,topMouseDown:C.mouseDown,topMouseMove:C.mouseMove,topMouseOut:C.mouseOut,topMouseOver:C.mouseOver,topMouseUp:C.mouseUp,topPaste:C.paste,topReset:C.reset,topScroll:C.scroll,topSubmit:C.submit,topTouchCancel:C.touchCancel,topTouchEnd:C.touchEnd,topTouchMove:C.touchMove,topTouchStart:C.touchStart,topWheel:C.wheel};for(var b in E){E[b].dependencies=[b];}var _={eventTypes:C,executeDispatch:function executeDispatch(e,t,n){var r=o.executeDispatch(e,t,n);r===!1&&(e.stopPropagation(),e.preventDefault());},extractEvents:function extractEvents(e,t,n,r){var o=E[e];if(!o)return null;var g;switch(e){case y.topInput:case y.topLoad:case y.topError:case y.topReset:case y.topSubmit:g=u;break;case y.topKeyPress:if(0===m(r))return null;case y.topKeyDown:case y.topKeyUp:g=l;break;case y.topBlur:case y.topFocus:g=s;break;case y.topClick:if(2===r.button)return null;case y.topContextMenu:case y.topDoubleClick:case y.topMouseDown:case y.topMouseMove:case y.topMouseOut:case y.topMouseOver:case y.topMouseUp:g=c;break;case y.topDrag:case y.topDragEnd:case y.topDragEnter:case y.topDragExit:case y.topDragLeave:case y.topDragOver:case y.topDragStart:case y.topDrop:g=p;break;case y.topTouchCancel:case y.topTouchEnd:case y.topTouchMove:case y.topTouchStart:g=d;break;case y.topScroll:g=f;break;case y.topWheel:g=h;break;case y.topCopy:case y.topCut:case y.topPaste:g=a;}v(g);var C=g.getPooled(o,n,r);return i.accumulateTwoPhaseDispatches(C),C;}};t.exports=_;},{100:100,120:120,133:133,139:139,15:15,150:150,19:19,20:20,90:90,92:92,93:93,94:94,96:96,97:97,98:98,99:99}],90:[function(e,t,n){"use strict";function r(e,t,n){o.call(this,e,t,n);}var o=e(93),i={clipboardData:function clipboardData(e){return"clipboardData"in e?e.clipboardData:window.clipboardData;}};o.augmentClass(r,i),t.exports=r;},{93:93}],91:[function(e,t,n){"use strict";function r(e,t,n){o.call(this,e,t,n);}var o=e(93),i={data:null};o.augmentClass(r,i),t.exports=r;},{93:93}],92:[function(e,t,n){"use strict";function r(e,t,n){o.call(this,e,t,n);}var o=e(97),i={dataTransfer:null};o.augmentClass(r,i),t.exports=r;},{97:97}],93:[function(e,t,n){"use strict";function r(e,t,n){this.dispatchConfig=e,this.dispatchMarker=t,this.nativeEvent=n;var r=this.constructor.Interface;for(var o in r){if(r.hasOwnProperty(o)){var i=r[o];i?this[o]=i(n):this[o]=n[o];}}var u=null!=n.defaultPrevented?n.defaultPrevented:n.returnValue===!1;u?this.isDefaultPrevented=a.thatReturnsTrue:this.isDefaultPrevented=a.thatReturnsFalse,this.isPropagationStopped=a.thatReturnsFalse;}var o=e(28),i=e(27),a=e(112),u=e(123),s={type:null,target:u,currentTarget:a.thatReturnsNull,eventPhase:null,bubbles:null,cancelable:null,timeStamp:function timeStamp(e){return e.timeStamp||Date.now();},defaultPrevented:null,isTrusted:null};i(r.prototype,{preventDefault:function preventDefault(){this.defaultPrevented=!0;var e=this.nativeEvent;e.preventDefault?e.preventDefault():e.returnValue=!1,this.isDefaultPrevented=a.thatReturnsTrue;},stopPropagation:function stopPropagation(){var e=this.nativeEvent;e.stopPropagation?e.stopPropagation():e.cancelBubble=!0,this.isPropagationStopped=a.thatReturnsTrue;},persist:function persist(){this.isPersistent=a.thatReturnsTrue;},isPersistent:a.thatReturnsFalse,destructor:function destructor(){var e=this.constructor.Interface;for(var t in e){this[t]=null;}this.dispatchConfig=null,this.dispatchMarker=null,this.nativeEvent=null;}}),r.Interface=s,r.augmentClass=function(e,t){var n=this,r=Object.create(n.prototype);i(r,e.prototype),e.prototype=r,e.prototype.constructor=e,e.Interface=i({},n.Interface,t),e.augmentClass=n.augmentClass,o.addPoolingTo(e,o.threeArgumentPooler);},o.addPoolingTo(r,o.threeArgumentPooler),t.exports=r;},{112:112,123:123,27:27,28:28}],94:[function(e,t,n){"use strict";function r(e,t,n){o.call(this,e,t,n);}var o=e(99),i={relatedTarget:null};o.augmentClass(r,i),t.exports=r;},{99:99}],95:[function(e,t,n){"use strict";function r(e,t,n){o.call(this,e,t,n);}var o=e(93),i={data:null};o.augmentClass(r,i),t.exports=r;},{93:93}],96:[function(e,t,n){"use strict";function r(e,t,n){o.call(this,e,t,n);}var o=e(99),i=e(120),a=e(121),u=e(122),s={key:a,location:null,ctrlKey:null,shiftKey:null,altKey:null,metaKey:null,repeat:null,locale:null,getModifierState:u,charCode:function charCode(e){return"keypress"===e.type?i(e):0;},keyCode:function keyCode(e){return"keydown"===e.type||"keyup"===e.type?e.keyCode:0;},which:function which(e){return"keypress"===e.type?i(e):"keydown"===e.type||"keyup"===e.type?e.keyCode:0;}};o.augmentClass(r,s),t.exports=r;},{120:120,121:121,122:122,99:99}],97:[function(e,t,n){"use strict";function r(e,t,n){o.call(this,e,t,n);}var o=e(99),i=e(102),a=e(122),u={screenX:null,screenY:null,clientX:null,clientY:null,ctrlKey:null,shiftKey:null,altKey:null,metaKey:null,getModifierState:a,button:function button(e){var t=e.button;return"which"in e?t:2===t?2:4===t?1:0;},buttons:null,relatedTarget:function relatedTarget(e){return e.relatedTarget||(e.fromElement===e.srcElement?e.toElement:e.fromElement);},pageX:function pageX(e){return"pageX"in e?e.pageX:e.clientX+i.currentScrollLeft;},pageY:function pageY(e){return"pageY"in e?e.pageY:e.clientY+i.currentScrollTop;}};o.augmentClass(r,u),t.exports=r;},{102:102,122:122,99:99}],98:[function(e,t,n){"use strict";function r(e,t,n){o.call(this,e,t,n);}var o=e(99),i=e(122),a={touches:null,targetTouches:null,changedTouches:null,altKey:null,metaKey:null,ctrlKey:null,shiftKey:null,getModifierState:i};o.augmentClass(r,a),t.exports=r;},{122:122,99:99}],99:[function(e,t,n){"use strict";function r(e,t,n){o.call(this,e,t,n);}var o=e(93),i=e(123),a={view:function view(e){if(e.view)return e.view;var t=i(e);if(null!=t&&t.window===t)return t;var n=t.ownerDocument;return n?n.defaultView||n.parentWindow:window;},detail:function detail(e){return e.detail||0;}};o.augmentClass(r,a),t.exports=r;},{123:123,93:93}],100:[function(e,t,n){"use strict";function r(e,t,n){o.call(this,e,t,n);}var o=e(97),i={deltaX:function deltaX(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0;},deltaY:function deltaY(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0;},deltaZ:null,deltaMode:null};o.augmentClass(r,i),t.exports=r;},{97:97}],101:[function(e,t,n){"use strict";var r=e(133),o={reinitializeTransaction:function reinitializeTransaction(){this.transactionWrappers=this.getTransactionWrappers(),this.wrapperInitData?this.wrapperInitData.length=0:this.wrapperInitData=[],this._isInTransaction=!1;},_isInTransaction:!1,getTransactionWrappers:null,isInTransaction:function isInTransaction(){return!!this._isInTransaction;},perform:function perform(e,t,n,o,i,a,u,s){r(!this.isInTransaction());var l,c;try{this._isInTransaction=!0,l=!0,this.initializeAll(0),c=e.call(t,n,o,i,a,u,s),l=!1;}finally{try{if(l)try{this.closeAll(0);}catch(p){}else this.closeAll(0);}finally{this._isInTransaction=!1;}}return c;},initializeAll:function initializeAll(e){for(var t=this.transactionWrappers,n=e;n<t.length;n++){var r=t[n];try{this.wrapperInitData[n]=i.OBSERVED_ERROR,this.wrapperInitData[n]=r.initialize?r.initialize.call(this):null;}finally{if(this.wrapperInitData[n]===i.OBSERVED_ERROR)try{this.initializeAll(n+1);}catch(o){}}}},closeAll:function closeAll(e){r(this.isInTransaction());for(var t=this.transactionWrappers,n=e;n<t.length;n++){var o,a=t[n],u=this.wrapperInitData[n];try{o=!0,u!==i.OBSERVED_ERROR&&a.close&&a.close.call(this,u),o=!1;}finally{if(o)try{this.closeAll(n+1);}catch(s){}}}this.wrapperInitData.length=0;}},i={Mixin:o,OBSERVED_ERROR:{}};t.exports=i;},{133:133}],102:[function(e,t,n){"use strict";var r={currentScrollLeft:0,currentScrollTop:0,refreshScrollValues:function refreshScrollValues(e){r.currentScrollLeft=e.x,r.currentScrollTop=e.y;}};t.exports=r;},{}],103:[function(e,t,n){"use strict";function r(e,t){if(o(null!=t),null==e)return t;var n=Array.isArray(e),r=Array.isArray(t);return n&&r?(e.push.apply(e,t),e):n?(e.push(t),e):r?[e].concat(t):[e,t];}var o=e(133);t.exports=r;},{133:133}],104:[function(e,t,n){"use strict";function r(e){for(var t=1,n=0,r=0;r<e.length;r++){t=(t+e.charCodeAt(r))%o,n=(n+t)%o;}return t|n<<16;}var o=65521;t.exports=r;},{}],105:[function(e,t,n){function r(e){return e.replace(o,function(e,t){return t.toUpperCase();});}var o=/-(.)/g;t.exports=r;},{}],106:[function(e,t,n){"use strict";function r(e){return o(e.replace(i,"ms-"));}var o=e(105),i=/^-ms-/;t.exports=r;},{105:105}],107:[function(e,t,n){function r(e,t){return e&&t?e===t?!0:o(e)?!1:o(t)?r(e,t.parentNode):e.contains?e.contains(t):e.compareDocumentPosition?!!(16&e.compareDocumentPosition(t)):!1:!1;}var o=e(137);t.exports=r;},{137:137}],108:[function(e,t,n){function r(e){return!!e&&("object"==(typeof e==="undefined"?"undefined":_typeof(e))||"function"==typeof e)&&"length"in e&&!("setInterval"in e)&&"number"!=typeof e.nodeType&&(Array.isArray(e)||"callee"in e||"item"in e);}function o(e){return r(e)?Array.isArray(e)?e.slice():i(e):[e];}var i=e(148);t.exports=o;},{148:148}],109:[function(e,t,n){"use strict";function r(e){var t=i.createFactory(e),n=o.createClass({tagName:e.toUpperCase(),displayName:"ReactFullPageComponent"+e,componentWillUnmount:function componentWillUnmount(){a(!1);},render:function render(){return t(this.props);}});return n;}var o=e(33),i=e(55),a=e(133);t.exports=r;},{133:133,33:33,55:55}],110:[function(e,t,n){function r(e){var t=e.match(c);return t&&t[1].toLowerCase();}function o(e,t){var n=l;s(!!l);var o=r(e),i=o&&u(o);if(i){n.innerHTML=i[1]+e+i[2];for(var c=i[0];c--;){n=n.lastChild;}}else n.innerHTML=e;var p=n.getElementsByTagName("script");p.length&&(s(t),a(p).forEach(t));for(var d=a(n.childNodes);n.lastChild;){n.removeChild(n.lastChild);}return d;}var i=e(21),a=e(108),u=e(125),s=e(133),l=i.canUseDOM?document.createElement("div"):null,c=/^\s*<(\w+)/;t.exports=o;},{108:108,125:125,133:133,21:21}],111:[function(e,t,n){"use strict";function r(e,t){var n=null==t||"boolean"==typeof t||""===t;if(n)return"";var r=isNaN(t);return r||0===t||i.hasOwnProperty(e)&&i[e]?""+t:("string"==typeof t&&(t=t.trim()),t+"px");}var o=e(4),i=o.isUnitlessNumber;t.exports=r;},{4:4}],112:[function(e,t,n){function r(e){return function(){return e;};}function o(){}o.thatReturns=r,o.thatReturnsFalse=r(!1),o.thatReturnsTrue=r(!0),o.thatReturnsNull=r(null),o.thatReturnsThis=function(){return this;},o.thatReturnsArgument=function(e){return e;},t.exports=o;},{}],113:[function(e,t,n){"use strict";var r={};t.exports=r;},{}],114:[function(e,t,n){"use strict";function r(e){return i[e];}function o(e){return(""+e).replace(a,r);}var i={"&":"&amp;",">":"&gt;","<":"&lt;",'"':"&quot;","'":"&#x27;"},a=/[&><"']/g;t.exports=o;},{}],115:[function(e,t,n){"use strict";function r(e){return null==e?null:u(e)?e:o.has(e)?i.getNodeFromInstance(e):(a(null==e.render||"function"!=typeof e.render),void a(!1));}{var o=(e(39),e(65)),i=e(68),a=e(133),u=e(135);e(150);}t.exports=r;},{133:133,135:135,150:150,39:39,65:65,68:68}],116:[function(e,t,n){"use strict";function r(e,t,n){var r=e,o=!r.hasOwnProperty(n);o&&null!=t&&(r[n]=t);}function o(e){if(null==e)return e;var t={};return i(e,r,t),t;}{var i=e(149);e(150);}t.exports=o;},{149:149,150:150}],117:[function(e,t,n){"use strict";function r(e){try{e.focus();}catch(t){}}t.exports=r;},{}],118:[function(e,t,n){"use strict";var r=function r(e,t,n){Array.isArray(e)?e.forEach(t,n):e&&t.call(n,e);};t.exports=r;},{}],119:[function(e,t,n){function r(){try{return document.activeElement||document.body;}catch(e){return document.body;}}t.exports=r;},{}],120:[function(e,t,n){"use strict";function r(e){var t,n=e.keyCode;return"charCode"in e?(t=e.charCode,0===t&&13===n&&(t=13)):t=n,t>=32||13===t?t:0;}t.exports=r;},{}],121:[function(e,t,n){"use strict";function r(e){if(e.key){var t=i[e.key]||e.key;if("Unidentified"!==t)return t;}if("keypress"===e.type){var n=o(e);return 13===n?"Enter":String.fromCharCode(n);}return"keydown"===e.type||"keyup"===e.type?a[e.keyCode]||"Unidentified":"";}var o=e(120),i={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},a={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"};t.exports=r;},{120:120}],122:[function(e,t,n){"use strict";function r(e){var t=this,n=t.nativeEvent;if(n.getModifierState)return n.getModifierState(e);var r=i[e];return r?!!n[r]:!1;}function o(e){return r;}var i={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};t.exports=o;},{}],123:[function(e,t,n){"use strict";function r(e){var t=e.target||e.srcElement||window;return 3===t.nodeType?t.parentNode:t;}t.exports=r;},{}],124:[function(e,t,n){"use strict";function r(e){var t=e&&(o&&e[o]||e[i]);return"function"==typeof t?t:void 0;}var o="function"==typeof Symbol&&Symbol.iterator,i="@@iterator";t.exports=r;},{}],125:[function(e,t,n){function r(e){return i(!!a),d.hasOwnProperty(e)||(e="*"),u.hasOwnProperty(e)||("*"===e?a.innerHTML="<link />":a.innerHTML="<"+e+"></"+e+">",u[e]=!a.firstChild),u[e]?d[e]:null;}var o=e(21),i=e(133),a=o.canUseDOM?document.createElement("div"):null,u={circle:!0,clipPath:!0,defs:!0,ellipse:!0,g:!0,line:!0,linearGradient:!0,path:!0,polygon:!0,polyline:!0,radialGradient:!0,rect:!0,stop:!0,text:!0},s=[1,'<select multiple="true">',"</select>"],l=[1,"<table>","</table>"],c=[3,"<table><tbody><tr>","</tr></tbody></table>"],p=[1,"<svg>","</svg>"],d={"*":[1,"?<div>","</div>"],area:[1,"<map>","</map>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],legend:[1,"<fieldset>","</fieldset>"],param:[1,"<object>","</object>"],tr:[2,"<table><tbody>","</tbody></table>"],optgroup:s,option:s,caption:l,colgroup:l,tbody:l,tfoot:l,thead:l,td:c,th:c,circle:p,clipPath:p,defs:p,ellipse:p,g:p,line:p,linearGradient:p,path:p,polygon:p,polyline:p,radialGradient:p,rect:p,stop:p,text:p};t.exports=r;},{133:133,21:21}],126:[function(e,t,n){"use strict";function r(e){for(;e&&e.firstChild;){e=e.firstChild;}return e;}function o(e){for(;e;){if(e.nextSibling)return e.nextSibling;e=e.parentNode;}}function i(e,t){for(var n=r(e),i=0,a=0;n;){if(3===n.nodeType){if(a=i+n.textContent.length,t>=i&&a>=t)return{node:n,offset:t-i};i=a;}n=r(o(n));}}t.exports=i;},{}],127:[function(e,t,n){"use strict";function r(e){return e?e.nodeType===o?e.documentElement:e.firstChild:null;}var o=9;t.exports=r;},{}],128:[function(e,t,n){"use strict";function r(){return!i&&o.canUseDOM&&(i="textContent"in document.documentElement?"textContent":"innerText"),i;}var o=e(21),i=null;t.exports=r;},{21:21}],129:[function(e,t,n){"use strict";function r(e){return e===window?{x:window.pageXOffset||document.documentElement.scrollLeft,y:window.pageYOffset||document.documentElement.scrollTop}:{x:e.scrollLeft,y:e.scrollTop};}t.exports=r;},{}],130:[function(e,t,n){function r(e){return e.replace(o,"-$1").toLowerCase();}var o=/([A-Z])/g;t.exports=r;},{}],131:[function(e,t,n){"use strict";function r(e){return o(e).replace(i,"-ms-");}var o=e(130),i=/^ms-/;t.exports=r;},{130:130}],132:[function(e,t,n){"use strict";function r(e){return"function"==typeof e&&"undefined"!=typeof e.prototype&&"function"==typeof e.prototype.mountComponent&&"function"==typeof e.prototype.receiveComponent;}function o(e,t){var n;if((null===e||e===!1)&&(e=a.emptyElement),"object"==(typeof e==="undefined"?"undefined":_typeof(e))){var o=e;n=t===o.type&&"string"==typeof o.type?u.createInternalComponent(o):r(o.type)?new o.type(o):new c();}else"string"==typeof e||"number"==typeof e?n=u.createInstanceForText(e):l(!1);return n.construct(e),n._mountIndex=0,n._mountImage=null,n;}var i=e(37),a=e(57),u=e(71),s=e(27),l=e(133),c=(e(150),function(){});s(c.prototype,i.Mixin,{_instantiateReactComponent:o}),t.exports=o;},{133:133,150:150,27:27,37:37,57:57,71:71}],133:[function(e,t,n){"use strict";var r=function r(e,t,n,_r,o,i,a,u){if(!e){var s;if(void 0===t)s=new Error("Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.");else{var l=[n,_r,o,i,a,u],c=0;s=new Error("Invariant Violation: "+t.replace(/%s/g,function(){return l[c++];}));}throw s.framesToPop=1,s;}};t.exports=r;},{}],134:[function(e,t,n){"use strict";function r(e,t){if(!i.canUseDOM||t&&!("addEventListener"in document))return!1;var n="on"+e,r=n in document;if(!r){var a=document.createElement("div");a.setAttribute(n,"return;"),r="function"==typeof a[n];}return!r&&o&&"wheel"===e&&(r=document.implementation.hasFeature("Events.wheel","3.0")),r;}var o,i=e(21);i.canUseDOM&&(o=document.implementation&&document.implementation.hasFeature&&document.implementation.hasFeature("","")!==!0),t.exports=r;},{21:21}],135:[function(e,t,n){function r(e){return!(!e||!("function"==typeof Node?e instanceof Node:"object"==(typeof e==="undefined"?"undefined":_typeof(e))&&"number"==typeof e.nodeType&&"string"==typeof e.nodeName));}t.exports=r;},{}],136:[function(e,t,n){"use strict";function r(e){return e&&("INPUT"===e.nodeName&&o[e.type]||"TEXTAREA"===e.nodeName);}var o={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};t.exports=r;},{}],137:[function(e,t,n){function r(e){return o(e)&&3==e.nodeType;}var o=e(135);t.exports=r;},{135:135}],138:[function(e,t,n){"use strict";var r=e(133),o=function o(e){var t,n={};r(e instanceof Object&&!Array.isArray(e));for(t in e){e.hasOwnProperty(t)&&(n[t]=t);}return n;};t.exports=o;},{133:133}],139:[function(e,t,n){var r=function r(e){var t;for(t in e){if(e.hasOwnProperty(t))return t;}return null;};t.exports=r;},{}],140:[function(e,t,n){"use strict";function r(e,t,n){if(!e)return null;var r={};for(var i in e){o.call(e,i)&&(r[i]=t.call(n,e[i],i,e));}return r;}var o=Object.prototype.hasOwnProperty;t.exports=r;},{}],141:[function(e,t,n){"use strict";function r(e){var t={};return function(n){return t.hasOwnProperty(n)||(t[n]=e.call(this,n)),t[n];};}t.exports=r;},{}],142:[function(e,t,n){"use strict";function r(e){return i(o.isValidElement(e)),e;}var o=e(55),i=e(133);t.exports=r;},{133:133,55:55}],143:[function(e,t,n){"use strict";function r(e){return'"'+o(e)+'"';}var o=e(114);t.exports=r;},{114:114}],144:[function(e,t,n){"use strict";var r=e(21),o=/^[ \r\n\t\f]/,i=/<(!--|link|noscript|meta|script|style)[ \r\n\t\f\/>]/,a=function a(e,t){e.innerHTML=t;};if("undefined"!=typeof MSApp&&MSApp.execUnsafeLocalFunction&&(a=function a(e,t){MSApp.execUnsafeLocalFunction(function(){e.innerHTML=t;});}),r.canUseDOM){var u=document.createElement("div");u.innerHTML=" ",""===u.innerHTML&&(a=function a(e,t){if(e.parentNode&&e.parentNode.replaceChild(e,e),o.test(t)||"<"===t[0]&&i.test(t)){e.innerHTML="\uFEFF"+t;var n=e.firstChild;1===n.data.length?e.removeChild(n):n.deleteData(0,1);}else e.innerHTML=t;});}t.exports=a;},{21:21}],145:[function(e,t,n){"use strict";var r=e(21),o=e(114),i=e(144),a=function a(e,t){e.textContent=t;};r.canUseDOM&&("textContent"in document.documentElement||(a=function a(e,t){i(e,o(t));})),t.exports=a;},{114:114,144:144,21:21}],146:[function(e,t,n){"use strict";function r(e,t){if(e===t)return!0;var n;for(n in e){if(e.hasOwnProperty(n)&&(!t.hasOwnProperty(n)||e[n]!==t[n]))return!1;}for(n in t){if(t.hasOwnProperty(n)&&!e.hasOwnProperty(n))return!1;}return!0;}t.exports=r;},{}],147:[function(e,t,n){"use strict";function r(e,t){if(null!=e&&null!=t){var n=typeof e==="undefined"?"undefined":_typeof(e),r=typeof t==="undefined"?"undefined":_typeof(t);if("string"===n||"number"===n)return"string"===r||"number"===r;if("object"===r&&e.type===t.type&&e.key===t.key){var o=e._owner===t._owner;return o;}}return!1;}e(150);t.exports=r;},{150:150}],148:[function(e,t,n){function r(e){var t=e.length;if(o(!Array.isArray(e)&&("object"==(typeof e==="undefined"?"undefined":_typeof(e))||"function"==typeof e)),o("number"==typeof t),o(0===t||t-1 in e),e.hasOwnProperty)try{return Array.prototype.slice.call(e);}catch(n){}for(var r=Array(t),i=0;t>i;i++){r[i]=e[i];}return r;}var o=e(133);t.exports=r;},{133:133}],149:[function(e,t,n){"use strict";function r(e){return v[e];}function o(e,t){return e&&null!=e.key?a(e.key):t.toString(36);}function i(e){return(""+e).replace(g,r);}function a(e){return"$"+i(e);}function u(e,t,n,r,i){var s=typeof e==="undefined"?"undefined":_typeof(e);if(("undefined"===s||"boolean"===s)&&(e=null),null===e||"string"===s||"number"===s||l.isValidElement(e))return r(i,e,""===t?h+o(e,0):t,n),1;var p,v,g,y=0;if(Array.isArray(e))for(var C=0;C<e.length;C++){p=e[C],v=(""!==t?t+m:h)+o(p,C),g=n+y,y+=u(p,v,g,r,i);}else{var E=d(e);if(E){var b,_=E.call(e);if(E!==e.entries)for(var x=0;!(b=_.next()).done;){p=b.value,v=(""!==t?t+m:h)+o(p,x++),g=n+y,y+=u(p,v,g,r,i);}else for(;!(b=_.next()).done;){var D=b.value;D&&(p=D[1],v=(""!==t?t+m:h)+a(D[0])+m+o(p,0),g=n+y,y+=u(p,v,g,r,i));}}else if("object"===s){f(1!==e.nodeType);var M=c.extract(e);for(var N in M){M.hasOwnProperty(N)&&(p=M[N],v=(""!==t?t+m:h)+a(N)+m+o(p,0),g=n+y,y+=u(p,v,g,r,i));}}}return y;}function s(e,t,n){return null==e?0:u(e,"",0,t,n);}var l=e(55),c=e(61),p=e(64),d=e(124),f=e(133),h=(e(150),p.SEPARATOR),m=":",v={"=":"=0",".":"=1",":":"=2"},g=/[=.:]/g;t.exports=s;},{124:124,133:133,150:150,55:55,61:61,64:64}],150:[function(e,t,n){"use strict";var r=e(112),o=r;t.exports=o;},{112:112}]},{},[1])(1);});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],10:[function(require,module,exports){
'use strict';

var names = {};
names.corp = ['1st Corp', '2nd Corp'];
names.division = ['1st Division', '2nd Division', '3rd Division', '4th Division'];
names.brigade = ['1st Brigade', '2nd Brigade', '3rd Brigade', '4th Brigade', '5th Brigade', '6th Brigade', '7th Brigade', '8th Brigade'];
names.regiment = ['1st Regiment', '2nd Regiment', '3rd Regiment', '4th Regiment', '5th Regiment', '6th Regiment', '7th Regiment', '8th Regiment', '9th Regiment', '10th Regiment', '11th Regiment', '12th Regiment', '13th Regiment', '14th Regiment', '15th Regiment', '16th Regiment'];
names.company = ['1st A Company', '2nd A Company', '3rd A Company', '4th A Company', '5th A Company', '6th A Company', '7th A Company', '8th A Company', '9th A Company', '10th A Company', '11th A Company', '12th A Company', '13th A Company', '14th A Company', '15th A Company', '16th A Company', '17th A Company', '18th A Company', '19th A Company', '20th A Company', '21th A Company', '22th A Company', '23th A Company', '24th A Company', '25th A Company', '26th A Company', '27th A Company', '28th A Company', '29th A Company', '30th A Company', '31th A Company', '32th A Company', '1st B Company', '2nd B Company', '3rd B Company', '4th B Company', '5th B Company', '6th B Company', '7th B Company', '8th B Company', '9th B Company', '10th B Company', '11th B Company', '12th B Company', '13th B Company', '14th B Company', '15th B Company', '16th B Company', '17th B Company', '18th B Company', '19th B Company', '20th B Company', '21th B Company', '22th B Company', '23th B Company', '24th B Company', '25th B Company', '26th B Company', '27th B Company', '28th B Company', '29th B Company', '30th B Company', '31th B Company', '32th B Company'];
names.battalion = ['1st Battalion', '2nd Battalion', '3rd Battalion', '4th Battalion', '5th Battalion', '6th Battalion', '7th Battalion', '8th Battalion', '9th Battalion', '10th Battalion', '11th Battalion', '12th Battalion', '13th Battalion', '14th Battalion', '15th Battalion', '16th Battalion', '17th Battalion', '18th Battalion', '19th Battalion', '20th Battalion', '21th Battalion', '22th Battalion', '23th Battalion', '24th Battalion', '25th Battalion', '26th Battalion', '27th Battalion', '28th Battalion', '29th Battalion', '30th Battalion', '31th Battalion', '32th Battalion', '33th Battalion', '34th Battalion', '35th Battalion', '36th Battalion', '37th Battalion', '38th Battalion', '39th Battalion', '40th Battalion', '41th Battalion', '42th Battalion', '43th Battalion', '44th Battalion', '45th Battalion', '46th Battalion', '47th Battalion', '48th Battalion', '49th Battalion', '50th Battalion', '51th Battalion', '52th Battalion', '53th Battalion', '54th Battalion', '55th Battalion', '56th Battalion', '57th Battalion', '58th Battalion', '59th Battalion', '60th Battalion', '61th Battalion', '62th Battalion', '63th Battalion', '64th Battalion'];
names.platoon = ['1st Platoon', '2nd Platoon', '3rd Platoon', '4th Platoon', '5th Platoon', '6th Platoon', '7th Platoon', '8th Platoon', '9th Platoon', '10th Platoon', '11th Platoon', '12th Platoon', '13th Platoon', '14th Platoon', '15th Platoon', '16th Platoon', '17th Platoon', '18th Platoon', '19th Platoon', '20th Platoon', '21th Platoon', '22th Platoon', '23th Platoon', '24th Platoon', '25th Platoon', '26th Platoon', '27th Platoon', '28th Platoon', '29th Platoon', '30th Platoon', '31th Platoon', '32th Platoon', '33th Platoon', '34th Platoon', '35th Platoon', '36th Platoon', '37th Platoon', '38th Platoon', '39th Platoon', '40th Platoon', '41th Platoon', '42th Platoon', '43th Platoon', '44th Platoon', '45th Platoon', '46th Platoon', '47th Platoon', '48th Platoon', '49th Platoon', '50th Platoon', '51th Platoon', '52th Platoon', '53th Platoon', '54th Platoon', '55th Platoon', '56th Platoon', '57th Platoon', '58th Platoon', '59th Platoon', '60th Platoon', '61th Platoon', '62th Platoon', '63th Platoon', '64th Platoon', '65th Platoon', '66th Platoon', '67th Platoon', '68th Platoon', '69th Platoon', '70th Platoon', '71th Platoon', '72th Platoon', '73th Platoon', '74th Platoon', '75th Platoon', '76th Platoon', '77th Platoon', '78th Platoon', '79th Platoon', '80th Platton', '81th Platoon', '82th Platoon', '83th Platoon', '84th Platoon', '85th Platoon', '86th Platoon', '87th Platoon', '88th Platoon', '89th Platoon', '90th Platoon', '91th Platoon', '92th Platoon', '93th Platoon', '94th Platoon', '95th Platoon', '96th Platoon', '97th Platoon', '98th Platoon', '99th Platoon', '100th Platoon', '101th Platoon', '102th Platoon', '103th Platoon', '104th Platoon', '105th Platoon', '106th Platoon', '107th Platoon', '108th Platoon', '109th Platoon', '110th Platoon', '111th Platoon', '112th Platoon', '113th Platoon', '114th Platoon', '115th Platoon', '116th Platoon', '117th Platoon', '118th Platoon', '119th Platoon', '120th Platoon', '121th Platoon', '122th Platoon', '123th Platoon', '124th Platoon', '125th Platoon', '126th Platoon', '127th Platoon', '128th Platoon', '129th Platoon'];
names.squad = ['1st A Squad', '2nd A Squad', '3rd A Squad', '4th A Squad', '5th A Squad', '6th A Squad', '7th A Squad', '8th A Squad', '9th A Squad', '10th A Squad', '11th A Squad', '12th A Squad', '13th A Squad', '14th A Squad', '15th A Squad', '16th A Squad', '17th A Squad', '18th A Squad', '19th A Squad', '20th A Squad', '21th A Squad', '22th A Squad', '23th A Squad', '24th A Squad', '25th A Squad', '26th A Squad', '27th A Squad', '28th A Squad', '29th A Squad', '30th A Squad', '31th A Squad', '32th A Squad', '33th A Squad', '34th A Squad', '35th A Squad', '36th A Squad', '37th A Squad', '38th A Squad', '39th A Squad', '40th A Squad', '41th A Squad', '42th A Squad', '43th A Squad', '44th A Squad', '45th A Squad', '46th A Squad', '47th A Squad', '48th A Squad', '49th A Squad', '50th A Squad', '51th A Squad', '52th A Squad', '53th A Squad', '54th A Squad', '55th A Squad', '56th A Squad', '57th A Squad', '58th A Squad', '59th A Squad', '60th A Squad', '61th A Squad', '62th A Squad', '63th A Squad', '64th A Squad', '65th A Squad', '66th A Squad', '67th A Squad', '68th A Squad', '69th A Squad', '70th A Squad', '71th A Squad', '72th A Squad', '73th A Squad', '74th A Squad', '75th A Squad', '76th A Squad', '77th A Squad', '78th A Squad', '79th A Squad', '80th Platton', '81th A Squad', '82th A Squad', '83th A Squad', '84th A Squad', '85th A Squad', '86th A Squad', '87th A Squad', '88th A Squad', '89th A Squad', '90th A Squad', '91th A Squad', '92th A Squad', '93th A Squad', '94th A Squad', '95th A Squad', '96th A Squad', '97th A Squad', '98th A Squad', '99th A Squad', '100th A Squad', '101th A Squad', '102th A Squad', '103th A Squad', '104th A Squad', '105th A Squad', '106th A Squad', '107th A Squad', '108th A Squad', '109th A Squad', '110th A Squad', '111th A Squad', '112th A Squad', '113th A Squad', '114th A Squad', '115th A Squad', '116th A Squad', '117th A Squad', '118th A Squad', '119th A Squad', '120th A Squad', '121th A Squad', '122th A Squad', '123th A Squad', '124th A Squad', '125th A Squad', '126th A Squad', '127th A Squad', '128th A Squad', '129th A Squad', '1st B Squad', '2nd B Squad', '3rd B Squad', '4th B Squad', '5th B Squad', '6th B Squad', '7th B Squad', '8th B Squad', '9th B Squad', '10th B Squad', '11th B Squad', '12th B Squad', '13th B Squad', '14th B Squad', '15th B Squad', '16th B Squad', '17th B Squad', '18th B Squad', '19th B Squad', '20th B Squad', '21th B Squad', '22th B Squad', '23th B Squad', '24th B Squad', '25th B Squad', '26th B Squad', '27th B Squad', '28th B Squad', '29th B Squad', '30th B Squad', '31th B Squad', '32th B Squad', '33th B Squad', '34th B Squad', '35th B Squad', '36th B Squad', '37th B Squad', '38th B Squad', '39th B Squad', '40th B Squad', '41th B Squad', '42th B Squad', '43th B Squad', '44th B Squad', '45th B Squad', '46th B Squad', '47th B Squad', '48th B Squad', '49th B Squad', '50th B Squad', '51th B Squad', '52th B Squad', '53th B Squad', '54th B Squad', '55th B Squad', '56th B Squad', '57th B Squad', '58th B Squad', '59th B Squad', '60th B Squad', '61th B Squad', '62th B Squad', '63th B Squad', '64th B Squad', '65th B Squad', '66th B Squad', '67th B Squad', '68th B Squad', '69th B Squad', '70th B Squad', '71th B Squad', '72th B Squad', '73th B Squad', '74th B Squad', '75th B Squad', '76th B Squad', '77th B Squad', '78th B Squad', '79th B Squad', '80th Platton', '81th B Squad', '82th B Squad', '83th B Squad', '84th B Squad', '85th B Squad', '86th B Squad', '87th B Squad', '88th B Squad', '89th B Squad', '90th B Squad', '91th B Squad', '92th B Squad', '93th B Squad', '94th B Squad', '95th B Squad', '96th B Squad', '97th B Squad', '98th B Squad', '99th B Squad', '100th B Squad', '101th B Squad', '102th B Squad', '103th B Squad', '104th B Squad', '105th B Squad', '106th B Squad', '107th B Squad', '108th B Squad', '109th B Squad', '110th B Squad', '111th B Squad', '112th B Squad', '113th B Squad', '114th B Squad', '115th B Squad', '116th B Squad', '117th B Squad', '118th B Squad', '119th B Squad', '120th B Squad', '121th B Squad', '122th B Squad', '123th B Squad', '124th B Squad', '125th B Squad', '126th B Squad', '127th B Squad', '128th B Squad', '129th B Squad'];
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = names;

},{}],11:[function(require,module,exports){
/* global Chance */
'use strict';
const config_1 = require("./config");
const traits_1 = require("./traits");
const chance = require("./lib/chance");
class Officer {
    constructor(spec, HQ, unitName) {
        let traits = new traits_1.default();
        this.id = spec.id;
        this.isPlayer = spec.isPlayer;
        this.unitId = spec.unitId;
        this.rank = config_1.default.ranks[spec.rankName];
        this.experience = config_1.default.ranks[spec.rankName].startxp + config_1.default.random(500);
        this.prestige = config_1.default.ranks[spec.rankName].startpr + config_1.default.random(10);
        this.traits = { base: traits.random() };
        this.intelligence = this.traits.base.intelligence + config_1.default.random(10);
        this.commanding = this.traits.base.commanding + config_1.default.random(10);
        this.diplomacy = this.traits.base.diplomacy + config_1.default.random(10);
        this.alignment = config_1.default.random(1000);
        this.militancy = config_1.default.random(10);
        this.drift = 0;
        this.operations = [];
        this.history = [];
        this.reserved = false;
        this.chance = chance(Math.random);
        this.lname = this.chance.last();
        // this.lname = 'aaaa';
        this.fname = this.chance.first({ gender: 'male' });
        // this.fname = 'vvvvv';
        if (this.isPlayer) {
            this.lname = (config_1.default.debug) ? 'Richardson' : prompt('Name?');
            this.fname = 'John';
            this.experience = 0;
        }
        this.graduate({
            date: config_1.default.formatDate(HQ.rawDate),
            unitName: HQ.unitName(this.unitId, unitName)
        });
    }
    name() {
        return (!this.reserved) ?
            this.rank.title + ' ' + this.fname + ' ' + this.lname :
            this.rank.title + ' (R) ' + this.fname + ' ' + this.lname;
    }
    graduate(spec) {
        let graduation = { unit: spec.unitName, date: spec.date };
        this.history.push(config_1.default.graduated(graduation, this));
    }
    update(HQ) {
        this.align();
        this.militate(HQ);
        this.experience++;
        this.prestige += config_1.default.random(config_1.default.ranks[this.rank.alias].startpr);
        // if (this.isPlayer) {
        //     console.log(this.experience, this.rank.maxxp)
        // }
        if (!this.reserved && this.experience > this.rank.maxxp)
            this.reserve(HQ);
    }
    drifts(officers, units) {
        this.unit = units.filter(unit => {
            return unit.id === this.unitId;
        })[0];
        this.commander = officers.filter(officer => {
            return officer.unitId === this.unit.parentId;
        })[0];
        if (this.commander && this.commander.alignment > 500) {
            this.drift++;
        }
        else {
            this.drift--;
        }
    }
    align() {
        if (this.drift > 0 && this.alignment < 1000) {
            this.alignment += this.drift;
        }
        else if (this.drift < 0 && this.alignment > 0) {
            this.alignment += this.drift;
        }
    }
    militate(HQ) {
        if (this.militancy > 8 && HQ.findCommandingOfficer(this).militancy < 2) {
            let spec = {
                officer: this,
                target: HQ.findCommandingOfficer(this),
                type: this.traits.base.area,
                name: 'Operation ' + this.lname,
            };
            if (spec.target)
                HQ.operations.add(spec);
        }
    }
    reserve(HQ, reason) {
        var lastUnit = HQ.units.filter(unit => {
            return unit.id === this.unitId;
        })[0];
        if (this.rank.hierarchy >= 4)
            lastUnit.reserve.push(this);
        if (lastUnit.reserve.length > 3)
            lastUnit.reserve.pop();
        this.reserved = true;
        this.history.push('Moved to reserve on ' + HQ.realDate);
        if (reason) {
            this.history[this.history.length - 1] = this.history[this.history.length - 1] + ' after succesful operation by ' + reason.officer.name();
            reason.officer.history.push('Moved ' + reason.target.name() + ' to reserve on ' + HQ.realDate + ' after succesful ' + reason.type + ' operation');
        }
        // if (this.isPlayer || reason) console.log(this.history[this.history.length - 1]);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Officer;

},{"./config":3,"./lib/chance":8,"./traits":17}],12:[function(require,module,exports){
'use strict';
const config_1 = require("./config");
const officer_1 = require("./officer");
const secretary_1 = require("./secretary");
const player_1 = require("./player");
class Officers {
    constructor() {
        this.pool = [];
        this.active = [];
        this.__officersID = 1;
        this.secretary = new secretary_1.default();
        this.player = undefined;
        this.inspected = undefined;
    }
    update(HQ) {
        this.active.forEach(officer => { officer.update(HQ); });
    }
    recruit(rank, unitId, isPlayer, unitName) {
        let options = {
            date: this.realDate,
            id: this.officers.__officersID,
            unitId: unitId,
            rankName: rank
        };
        let cadet = (isPlayer) ? new player_1.default(options, this, unitName) : new officer_1.default(options, this, unitName);
        if (isPlayer)
            this.player = cadet;
        this.officers.active.push(cadet);
        this.officers.pool.push(cadet);
        this.officers.__officersID++;
        return cadet;
    }
    reserve() {
        this.active = this.active.filter(officer => { return !officer.reserved; });
    }
    replace(replacedCommander) {
        let lowerRank = this.officers.secretary.rankLower(replacedCommander.rank);
        let spec = {
            unitId: replacedCommander.unitId,
            rank: replacedCommander.rank.alias,
            rankToPromote: lowerRank,
            HQ: this
        };
        if (lowerRank) {
            return this.officers.candidate(spec);
        }
        else {
            return this.officers.recruit.call(this, spec.rank, replacedCommander.unitId);
        }
    }
    replaceForPlayer(replacedCommander) {
        return this.officers.recruit.call(this, 'lieutenant', replacedCommander.unitId, true);
    }
    candidate(spec) {
        let candidate = this.active
            .filter(officer => { return officer.rank.alias === spec.rankToPromote; })
            .reduce((prev, curr) => (curr.experience > prev.experience) ? curr : prev);
        return this.promote(candidate, spec);
    }
    promote(officer, spec) {
        spec.HQ.deassign(officer.unitId);
        let promotion = this.promotion(officer, spec);
        officer.history.push(config_1.default.promoted(promotion));
        officer.drifts(this.active, spec.HQ.units);
        return officer;
    }
    promotion(officer, spec) {
        officer.unitId = spec.unitId;
        officer.rank = config_1.default.ranks[spec.rank];
        return {
            rank: spec.rank,
            date: spec.HQ.realDate,
            unit: spec.HQ.unitName(officer.unitId)
        };
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Officers;

},{"./config":3,"./officer":11,"./player":14,"./secretary":16}],13:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var config_1 = require("./config");

var Operations = function () {
    function Operations() {
        _classCallCheck(this, Operations);

        this.operationsID = 1;
        this.active = [];
    }

    _createClass(Operations, [{
        key: "add",
        value: function add(spec) {
            var operation = new Operation(spec);
            operation.id = this.operationsID;
            this.operationsID++;
            this.active.push(operation);
            return operation;
        }
    }, {
        key: "update",
        value: function update(HQ) {
            this.active = this.active.filter(function (operation) {
                if (!operation.target.reserved && operation.turns > 0) {
                    return true;
                } else {
                    return false;
                }
            });
            this.active.forEach(function (operation) {
                operation.execute(HQ);
            });
        }
    }]);

    return Operations;
}();

var Operation = function () {
    function Operation(spec) {
        _classCallCheck(this, Operation);

        this.officer = spec.officer;
        this.target = spec.target;
        this.type = spec.type;
        this.name = spec.name;
        this.strength = 0;
        this.turns = 10;
    }

    _createClass(Operation, [{
        key: "execute",
        value: function execute(HQ) {
            var officerRoll = this.officer[this.type] + config_1.default.random(10);
            var targetRoll = this.target[this.type] + config_1.default.random(10);
            if (officerRoll > targetRoll) {
                this.strength++;
            }
            if (this.strength >= 3) {
                this.target.reserve(HQ, this);
            }
            this.turns--;
        }
    }]);

    return Operation;
}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Operations;

},{"./config":3}],14:[function(require,module,exports){
'use strict';
const officer_1 = require("./officer");
class Player extends officer_1.default {
    constructor(spec, HQ, unitName) {
        spec.isPlayer = true;
        super(spec, HQ, unitName);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Player;

},{"./officer":11}],15:[function(require,module,exports){
'use strict';
// import {} from './lib/chance';
// let chance = new Chance();
const chance = require("./lib/chance");
class Region {
    constructor(id) {
        this.chance = chance(Math.random);
        this.id = id;
        this.chance = chance(Math.random);
        this.name = this.chance.city();
        this.units = [];
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Region;

},{"./lib/chance":8}],16:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Secretary = function () {
    function Secretary() {
        _classCallCheck(this, Secretary);
    }

    _createClass(Secretary, [{
        key: 'rankLower',
        value: function rankLower(rank) {
            var lowerRank = null;
            switch (rank.alias) {
                case 'lieutenant':
                    return lowerRank;
                case 'captain':
                    lowerRank = 'lieutenant';
                    break;
                case 'major':
                    lowerRank = 'captain';
                    break;
                case 'lcoronel':
                    lowerRank = 'major';
                    break;
                case 'coronel':
                    lowerRank = 'lcoronel';
                    break;
                case 'bgeneral':
                    lowerRank = 'coronel';
                    break;
                case 'dgeneral':
                    lowerRank = 'bgeneral';
                    break;
                case 'lgeneral':
                    lowerRank = 'dgeneral';
                    break;
            }
            return lowerRank;
        }
    }]);

    return Secretary;
}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Secretary;

},{}],17:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Traits = function () {
    function Traits() {
        _classCallCheck(this, Traits);

        this.base = [{
            name: 'Diplomat',
            area: 'diplomacy',
            school: 'the National Officer Candidate School',
            intelligence: 3,
            commanding: 2,
            diplomacy: 4
        }, {
            name: 'Warrior',
            area: 'commanding',
            school: 'the National Military Academy',
            intelligence: 2,
            commanding: 4,
            diplomacy: 1
        }, {
            name: 'Spy',
            area: 'intelligence',
            school: 'the Institute of Military Intelligence',
            intelligence: 4,
            commanding: 1,
            diplomacy: 3
        }];
    }

    _createClass(Traits, [{
        key: 'random',
        value: function random() {
            var rnd = Math.round(Math.random() * 2);
            return this.base[rnd];
        }
    }]);

    return Traits;
}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Traits;

},{}],18:[function(require,module,exports){
"use strict";
/* jshint ignore:start */
// import React from './lib/react';
// import React from './lib/react';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require("./lib/react");

var VUi = function (_React$Component) {
    _inherits(VUi, _React$Component);

    function VUi(spec) {
        _classCallCheck(this, VUi);

        var _this = _possibleConstructorReturn(this, (VUi.__proto__ || Object.getPrototypeOf(VUi)).call(this, spec));

        _this.engine = spec;
        return _this;
    }

    _createClass(VUi, [{
        key: "render",
        value: function render(army) {
            React.render(React.createElement(VArmy, { engine: this.engine }), document.body);
        }
    }]);

    return VUi;
}(React.Component);

var VArmy = function (_React$Component2) {
    _inherits(VArmy, _React$Component2);

    function VArmy(props) {
        _classCallCheck(this, VArmy);

        var _this2 = _possibleConstructorReturn(this, (VArmy.__proto__ || Object.getPrototypeOf(VArmy)).call(this, props));

        _this2.state = {
            army: props.engine.army,
            engine: props.engine
        };
        return _this2;
    }

    _createClass(VArmy, [{
        key: "render",
        value: function render() {
            var army = this.state.army;
            var engine = this.state.engine;
            return React.createElement(
                "div",
                { className: "army" },
                React.createElement(
                    "p",
                    { className: "date" },
                    army.HQ.realDate
                ),
                React.createElement(
                    "div",
                    null,
                    React.createElement(VPlayer, { player: army.HQ.player, engine: engine }),
                    React.createElement(VInspected, { officer: army.HQ.findInspected(), engine: engine })
                ),
                React.createElement(VUnit, { officer: army.HQ.player, engine: engine }),
                React.createElement(VStructure, { units: army.units.corps, engine: engine })
            );
        }
    }]);

    return VArmy;
}(React.Component);

var VStructure = function (_React$Component3) {
    _inherits(VStructure, _React$Component3);

    function VStructure(props) {
        _classCallCheck(this, VStructure);

        var _this3 = _possibleConstructorReturn(this, (VStructure.__proto__ || Object.getPrototypeOf(VStructure)).call(this, props));

        _this3.state = {
            units: _this3.props.units,
            engine: _this3.props.engine
        };
        return _this3;
    }

    _createClass(VStructure, [{
        key: "inspect",
        value: function inspect(commander) {
            if (this.props.engine) this.props.engine.actions.inspect(commander[0].id);
        }
    }, {
        key: "render",
        value: function render() {
            var _this4 = this;

            var units = this.state.units;
            if (units.length < 2) return React.createElement("div", null);
            var names = [];
            units.forEach(function (unit) {
                unit.isRed = _this4.state.engine.army.HQ.officers.inspected && unit.commander.id === _this4.state.engine.army.HQ.officers.inspected.id || unit.commander.isPlayer ? 'isRed' : '';
            });
            debugger;
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "div",
                    { className: units[0].type + ' ' + units[0].isRed },
                    React.createElement(
                        "div",
                        { onClick: this.inspect.bind(this, [units[0].commander]) },
                        units[0].name
                    ),
                    React.createElement(VStructure, { units: units[0].subunits, engine: this.state.engine })
                ),
                React.createElement(
                    "div",
                    { className: units[1].type + ' ' + units[1].isRed },
                    React.createElement(
                        "div",
                        { onClick: this.inspect.bind(this, [units[1].commander]) },
                        units[1].name
                    ),
                    React.createElement(VStructure, { units: units[1].subunits, engine: this.state.engine })
                )
            );
        }
    }]);

    return VStructure;
}(React.Component);

var VPlayer = function (_React$Component4) {
    _inherits(VPlayer, _React$Component4);

    function VPlayer(props) {
        _classCallCheck(this, VPlayer);

        var _this5 = _possibleConstructorReturn(this, (VPlayer.__proto__ || Object.getPrototypeOf(VPlayer)).call(this, props));

        _this5.state = {
            player: _this5.props.player,
            engine: _this5.props.engine
        };
        return _this5;
    }

    _createClass(VPlayer, [{
        key: "inspect",
        value: function inspect() {
            if (this.props.engine) this.props.engine.actions.inspect(this.props.player.id);
        }
    }, {
        key: "render",
        value: function render() {
            if (!this.state.player) return;
            var army = this.state.engine.army;
            var player = this.state.player;
            return React.createElement(
                "div",
                { className: "player" },
                React.createElement(
                    "div",
                    { onClick: this.inspect.bind(this) },
                    player.name()
                ),
                React.createElement(
                    "div",
                    null,
                    this.state.engine.army.HQ.findUnitById(player.unitId).name
                ),
                React.createElement(VStats, { officer: player, engine: this.state.engine }),
                React.createElement(VStaff, { officer: player, engine: this.state.engine })
            );
        }
    }]);

    return VPlayer;
}(React.Component);

var VInspected = function (_React$Component5) {
    _inherits(VInspected, _React$Component5);

    function VInspected(props) {
        _classCallCheck(this, VInspected);

        var _this6 = _possibleConstructorReturn(this, (VInspected.__proto__ || Object.getPrototypeOf(VInspected)).call(this, props));

        _this6.state = {
            officer: _this6.props.officer,
            engine: _this6.props.engine
        };
        return _this6;
    }

    _createClass(VInspected, [{
        key: "render",
        value: function render() {
            if (!this.props.officer) return React.createElement("div", null);
            var army = this.state.engine.army;
            var officer = this.props.officer;
            var engine = this.state.engine;
            var superior = army.HQ.findCommandingOfficer(officer);
            var superiorHTML = !this.props.officer.reserved && !this.props.officer.isPlayer && this.props.officer.rank.hierarchy < 7 ? React.createElement(
                "div",
                { className: "superior" },
                React.createElement(
                    "div",
                    null,
                    "Commanding Officer"
                ),
                React.createElement(VOfficer, { officer: superior, engine: this.state.engine })
            ) : React.createElement("div", null);
            var headerHTML = !this.props.officer.isPlayer ? React.createElement(
                "div",
                null,
                React.createElement(
                    "h1",
                    null,
                    "Officer"
                ),
                React.createElement(VOfficer, { officer: officer, engine: this.state.engine }),
                React.createElement(VStats, { officer: officer, engine: this.state.engine })
            ) : React.createElement("div", null);
            return React.createElement(
                "div",
                { className: "inspected" },
                headerHTML,
                superiorHTML,
                React.createElement(VHistory, { officer: officer, engine: this.state.engine })
            );
        }
    }]);

    return VInspected;
}(React.Component);

var VStaff = function (_React$Component6) {
    _inherits(VStaff, _React$Component6);

    function VStaff(props) {
        _classCallCheck(this, VStaff);

        var _this7 = _possibleConstructorReturn(this, (VStaff.__proto__ || Object.getPrototypeOf(VStaff)).call(this, props));

        _this7.state = {
            officer: _this7.props.officer,
            engine: _this7.props.engine
        };
        return _this7;
    }

    _createClass(VStaff, [{
        key: "render",
        value: function render() {
            var _this8 = this;

            var staff = [];
            var subordinates = [];
            var army = this.state.engine.army;
            var unit = army.HQ.findUnitById(this.state.officer.unitId);
            var superior = army.HQ.findCommandingOfficer(this.state.officer);
            if (!unit) unit = { name: 'No unit' };
            army.HQ.findOperationalStaff(this.state.officer).forEach(function (officer) {
                staff.push(React.createElement(
                    "li",
                    null,
                    React.createElement(Officer, { officer: officer, engine: _this8.state.engine })
                ));
            });
            var superiorHTML = !this.state.officer.reserved ? React.createElement(
                "div",
                null,
                React.createElement(
                    "div",
                    null,
                    "Commanding Officer"
                ),
                React.createElement(VOfficer, { officer: superior, engine: this.state.engine })
            ) : React.createElement("div", null);
            var staffHTML = staff.length && !this.state.officer.reserved ? React.createElement(
                "div",
                null,
                superiorHTML,
                React.createElement(
                    "h2",
                    null,
                    "Staff"
                ),
                React.createElement(
                    "ul",
                    { className: "staff" },
                    staff
                )
            ) : React.createElement(
                "div",
                null,
                superiorHTML
            );
            return staffHTML;
        }
    }]);

    return VStaff;
}(React.Component);

var VOfficer = function (_React$Component7) {
    _inherits(VOfficer, _React$Component7);

    function VOfficer(props) {
        _classCallCheck(this, VOfficer);

        var _this9 = _possibleConstructorReturn(this, (VOfficer.__proto__ || Object.getPrototypeOf(VOfficer)).call(this, props));

        _this9.state = {
            engine: _this9.props.engine,
            officer: _this9.props.officer
        };
        return _this9;
    }

    _createClass(VOfficer, [{
        key: "inspect",
        value: function inspect() {
            if (this.props.engine) this.props.engine.actions.inspect(this.props.officer.id);
        }
    }, {
        key: "render",
        value: function render() {
            var html = this.props.officer ? React.createElement(
                "div",
                null,
                React.createElement(
                    "div",
                    { onClick: this.inspect.bind(this) },
                    this.props.officer.name()
                )
            ) : React.createElement("div", null);
            return html;
        }
    }]);

    return VOfficer;
}(React.Component);

var VStats = function (_React$Component8) {
    _inherits(VStats, _React$Component8);

    function VStats(props) {
        _classCallCheck(this, VStats);

        var _this10 = _possibleConstructorReturn(this, (VStats.__proto__ || Object.getPrototypeOf(VStats)).call(this, props));

        _this10.state = {
            engine: _this10.props.engine,
            officer: _this10.props.officer
        };
        return _this10;
    }

    _createClass(VStats, [{
        key: "render",
        value: function render() {
            var html = this.props.officer ? React.createElement(
                "div",
                { className: "stats" },
                React.createElement(
                    "div",
                    null,
                    "INT ",
                    this.props.officer.intelligence
                ),
                React.createElement(
                    "div",
                    null,
                    "MIL ",
                    this.props.officer.commanding
                ),
                React.createElement(
                    "div",
                    null,
                    "DIP ",
                    this.props.officer.diplomacy
                )
            ) : React.createElement("div", { className: "stats" });
            return html;
        }
    }]);

    return VStats;
}(React.Component);

var VHistory = function (_React$Component9) {
    _inherits(VHistory, _React$Component9);

    function VHistory(props) {
        _classCallCheck(this, VHistory);

        var _this11 = _possibleConstructorReturn(this, (VHistory.__proto__ || Object.getPrototypeOf(VHistory)).call(this, props));

        _this11.state = {
            engine: _this11.props.engine,
            officer: _this11.props.officer
        };
        return _this11;
    }

    _createClass(VHistory, [{
        key: "render",
        value: function render() {
            var history = [];
            if (this.props.officer) {
                this.props.officer.history.forEach(function (event) {
                    history.push(React.createElement(
                        "li",
                        { className: "log" },
                        event
                    ));
                });
            }
            var html = this.props.officer ? React.createElement(
                "div",
                { className: "history" },
                React.createElement(
                    "div",
                    null,
                    "Record"
                ),
                React.createElement(
                    "ul",
                    null,
                    history
                )
            ) : React.createElement("div", null);
            return html;
        }
    }]);

    return VHistory;
}(React.Component);

var VUnit = function (_React$Component10) {
    _inherits(VUnit, _React$Component10);

    function VUnit(props) {
        _classCallCheck(this, VUnit);

        var _this12 = _possibleConstructorReturn(this, (VUnit.__proto__ || Object.getPrototypeOf(VUnit)).call(this, props));

        _this12.state = {
            player: _this12.props.officer,
            engine: _this12.props.engine,
            name: undefined,
            type: undefined,
            officer: undefined,
            target: undefined,
            targets: undefined
        };
        return _this12;
    }

    _createClass(VUnit, [{
        key: "startOperation",
        value: function startOperation() {
            if (!this.state.type || !this.state.officer || !this.state.target) {
                alert('Complete operation details first.');
                return;
            }
            var army = this.state.engine.army;
            var staffOfficerId = this.state.officer.split(',')[0];
            var playerUnitId = this.state.officer.split(',')[1];
            var targetId = this.state.target;
            var spec = {
                name: this.state.name,
                type: this.state.type,
                officer: army.HQ.findStaffById(staffOfficerId, playerUnitId),
                target: army.HQ.findOfficerById(targetId)
            };
            army.HQ.operations.add(spec);
            document.getElementById('operationType').selectedIndex = '0';
            document.getElementById('operationOfficer').selectedIndex = '0';
            document.getElementById('operationTarget').selectedIndex = '0';
        }
    }, {
        key: "handleName",
        value: function handleName(event) {
            this.setState({ name: event.target.value });
        }
    }, {
        key: "handleType",
        value: function handleType(event) {
            this.setState({ type: event.target.value });
        }
    }, {
        key: "handleOfficer",
        value: function handleOfficer(event) {
            this.setState({ officer: event.target.value });
        }
    }, {
        key: "handleTarget",
        value: function handleTarget(event) {
            this.setState({ target: event.target.value });
        }
    }, {
        key: "handleSearch",
        value: function handleSearch(event) {
            this.setState({ targets: this.state.engine.army.HQ.findOfficersByName(event.target.value) });
        }
    }, {
        key: "render",
        value: function render() {
            var army = this.state.engine.army;
            var player = this.state.player;
            var targets = this.state.targets ? this.state.targets : army.HQ.findActiveOfficers();
            var types = ['commanding', 'intelligence', 'diplomacy'];
            var staff = army.HQ.findOperationalStaff(player);
            var operationTypes = [];
            var officers = [];
            var staffOfficers = [];
            types.forEach(function (type) {
                operationTypes.push(React.createElement(
                    "option",
                    null,
                    type
                ));
            });
            staff.forEach(function (officer) {
                staffOfficers.push(React.createElement(
                    "option",
                    { value: [officer.id, player.unitId] },
                    officer.name()
                ));
            });
            targets.forEach(function (target) {
                officers.push(React.createElement(
                    "option",
                    { value: target.id },
                    target.name()
                ));
            });
            operationTypes.unshift(React.createElement("option", null));
            officers.unshift(React.createElement("option", null));
            staffOfficers.unshift(React.createElement("option", null));
            return React.createElement(
                "div",
                { className: "unit" },
                React.createElement(
                    "h1",
                    null,
                    "Headquarters"
                ),
                React.createElement(
                    "div",
                    null,
                    "Operation name"
                ),
                React.createElement("input", { onChange: this.handleName.bind(this) }),
                React.createElement(
                    "div",
                    null,
                    "Type"
                ),
                React.createElement(
                    "select",
                    { id: "operationType", onChange: this.handleType.bind(this) },
                    operationTypes
                ),
                React.createElement(
                    "div",
                    null,
                    "Commander"
                ),
                React.createElement(
                    "select",
                    { id: "operationOfficer", onChange: this.handleOfficer.bind(this) },
                    staffOfficers
                ),
                React.createElement(
                    "div",
                    null,
                    "Target"
                ),
                React.createElement("input", { type: "text", onChange: this.handleSearch.bind(this) }),
                React.createElement(
                    "select",
                    { id: "operationTarget", onChange: this.handleTarget.bind(this) },
                    officers
                ),
                React.createElement(
                    "button",
                    { onClick: this.startOperation.bind(this) },
                    "Start Operation"
                )
            );
        }
    }]);

    return VUnit;
}(React.Component);

Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VUi;

},{"./lib/react":9}],19:[function(require,module,exports){
'use strict';
const names_1 = require("./names");
class Unit {
    constructor(spec, HQ) {
        this.id = spec.id;
        this.parentId = spec.parentId;
        this.type = spec.type;
        this.name = names_1.default[spec.type][0];
        names_1.default[spec.type].shift();
        this.reserve = [];
        this.subunits = [];
        this.commander = HQ.officers.recruit.call(HQ, spec.rank, this.id, false, this.name);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Unit;

},{"./names":10}],20:[function(require,module,exports){
'use strict';
const config_1 = require("./config");
const region_1 = require("./region");
class World {
    constructor(HQ) {
        this.regions = [];
        this.generate(HQ);
    }
    addRegion() {
        let regionId = this.regions.length;
        this.regions.push(new region_1.default(regionId));
    }
    generate(HQ) {
        let amount = config_1.default.random(10) + 5;
        for (var i = 0; i < amount; i++) {
            this.addRegion();
        }
        this.mapUnitsAndRegions(HQ);
    }
    mapUnitsAndRegions(HQ) {
        let unitsPerRegion = Math.ceil(HQ.units.length / this.regions.length) + 1;
        let unitIndex = 0;
        this.regions.map(region => {
            let count = 0;
            while (count < unitsPerRegion) {
                let unit = HQ.units[unitIndex];
                if (unit) {
                    region.units.push(unit);
                    unit.regionId = region.id;
                    unitIndex++;
                    count++;
                }
                else {
                    return;
                }
            }
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = World;

},{"./config":3,"./region":15}],21:[function(require,module,exports){
//! moment.js
//! version : 2.17.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, (function () { 'use strict';

var hookCallback;

function hooks () {
    return hookCallback.apply(null, arguments);
}

// This is done to register the method called with moment()
// without creating circular dependencies.
function setHookCallback (callback) {
    hookCallback = callback;
}

function isArray(input) {
    return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
}

function isObject(input) {
    // IE8 will treat undefined and null as object if it wasn't for
    // input != null
    return input != null && Object.prototype.toString.call(input) === '[object Object]';
}

function isObjectEmpty(obj) {
    var k;
    for (k in obj) {
        // even if its not own property I'd still call it non-empty
        return false;
    }
    return true;
}

function isNumber(input) {
    return typeof input === 'number' || Object.prototype.toString.call(input) === '[object Number]';
}

function isDate(input) {
    return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
}

function map(arr, fn) {
    var res = [], i;
    for (i = 0; i < arr.length; ++i) {
        res.push(fn(arr[i], i));
    }
    return res;
}

function hasOwnProp(a, b) {
    return Object.prototype.hasOwnProperty.call(a, b);
}

function extend(a, b) {
    for (var i in b) {
        if (hasOwnProp(b, i)) {
            a[i] = b[i];
        }
    }

    if (hasOwnProp(b, 'toString')) {
        a.toString = b.toString;
    }

    if (hasOwnProp(b, 'valueOf')) {
        a.valueOf = b.valueOf;
    }

    return a;
}

function createUTC (input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, true).utc();
}

function defaultParsingFlags() {
    // We need to deep clone this object.
    return {
        empty           : false,
        unusedTokens    : [],
        unusedInput     : [],
        overflow        : -2,
        charsLeftOver   : 0,
        nullInput       : false,
        invalidMonth    : null,
        invalidFormat   : false,
        userInvalidated : false,
        iso             : false,
        parsedDateParts : [],
        meridiem        : null
    };
}

function getParsingFlags(m) {
    if (m._pf == null) {
        m._pf = defaultParsingFlags();
    }
    return m._pf;
}

var some;
if (Array.prototype.some) {
    some = Array.prototype.some;
} else {
    some = function (fun) {
        var t = Object(this);
        var len = t.length >>> 0;

        for (var i = 0; i < len; i++) {
            if (i in t && fun.call(this, t[i], i, t)) {
                return true;
            }
        }

        return false;
    };
}

var some$1 = some;

function isValid(m) {
    if (m._isValid == null) {
        var flags = getParsingFlags(m);
        var parsedParts = some$1.call(flags.parsedDateParts, function (i) {
            return i != null;
        });
        var isNowValid = !isNaN(m._d.getTime()) &&
            flags.overflow < 0 &&
            !flags.empty &&
            !flags.invalidMonth &&
            !flags.invalidWeekday &&
            !flags.nullInput &&
            !flags.invalidFormat &&
            !flags.userInvalidated &&
            (!flags.meridiem || (flags.meridiem && parsedParts));

        if (m._strict) {
            isNowValid = isNowValid &&
                flags.charsLeftOver === 0 &&
                flags.unusedTokens.length === 0 &&
                flags.bigHour === undefined;
        }

        if (Object.isFrozen == null || !Object.isFrozen(m)) {
            m._isValid = isNowValid;
        }
        else {
            return isNowValid;
        }
    }
    return m._isValid;
}

function createInvalid (flags) {
    var m = createUTC(NaN);
    if (flags != null) {
        extend(getParsingFlags(m), flags);
    }
    else {
        getParsingFlags(m).userInvalidated = true;
    }

    return m;
}

function isUndefined(input) {
    return input === void 0;
}

// Plugins that add properties should also add the key here (null value),
// so we can properly clone ourselves.
var momentProperties = hooks.momentProperties = [];

function copyConfig(to, from) {
    var i, prop, val;

    if (!isUndefined(from._isAMomentObject)) {
        to._isAMomentObject = from._isAMomentObject;
    }
    if (!isUndefined(from._i)) {
        to._i = from._i;
    }
    if (!isUndefined(from._f)) {
        to._f = from._f;
    }
    if (!isUndefined(from._l)) {
        to._l = from._l;
    }
    if (!isUndefined(from._strict)) {
        to._strict = from._strict;
    }
    if (!isUndefined(from._tzm)) {
        to._tzm = from._tzm;
    }
    if (!isUndefined(from._isUTC)) {
        to._isUTC = from._isUTC;
    }
    if (!isUndefined(from._offset)) {
        to._offset = from._offset;
    }
    if (!isUndefined(from._pf)) {
        to._pf = getParsingFlags(from);
    }
    if (!isUndefined(from._locale)) {
        to._locale = from._locale;
    }

    if (momentProperties.length > 0) {
        for (i in momentProperties) {
            prop = momentProperties[i];
            val = from[prop];
            if (!isUndefined(val)) {
                to[prop] = val;
            }
        }
    }

    return to;
}

var updateInProgress = false;

// Moment prototype object
function Moment(config) {
    copyConfig(this, config);
    this._d = new Date(config._d != null ? config._d.getTime() : NaN);
    if (!this.isValid()) {
        this._d = new Date(NaN);
    }
    // Prevent infinite loop in case updateOffset creates new moment
    // objects.
    if (updateInProgress === false) {
        updateInProgress = true;
        hooks.updateOffset(this);
        updateInProgress = false;
    }
}

function isMoment (obj) {
    return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
}

function absFloor (number) {
    if (number < 0) {
        // -0 -> 0
        return Math.ceil(number) || 0;
    } else {
        return Math.floor(number);
    }
}

function toInt(argumentForCoercion) {
    var coercedNumber = +argumentForCoercion,
        value = 0;

    if (coercedNumber !== 0 && isFinite(coercedNumber)) {
        value = absFloor(coercedNumber);
    }

    return value;
}

// compare two arrays, return the number of differences
function compareArrays(array1, array2, dontConvert) {
    var len = Math.min(array1.length, array2.length),
        lengthDiff = Math.abs(array1.length - array2.length),
        diffs = 0,
        i;
    for (i = 0; i < len; i++) {
        if ((dontConvert && array1[i] !== array2[i]) ||
            (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
            diffs++;
        }
    }
    return diffs + lengthDiff;
}

function warn(msg) {
    if (hooks.suppressDeprecationWarnings === false &&
            (typeof console !==  'undefined') && console.warn) {
        console.warn('Deprecation warning: ' + msg);
    }
}

function deprecate(msg, fn) {
    var firstTime = true;

    return extend(function () {
        if (hooks.deprecationHandler != null) {
            hooks.deprecationHandler(null, msg);
        }
        if (firstTime) {
            var args = [];
            var arg;
            for (var i = 0; i < arguments.length; i++) {
                arg = '';
                if (typeof arguments[i] === 'object') {
                    arg += '\n[' + i + '] ';
                    for (var key in arguments[0]) {
                        arg += key + ': ' + arguments[0][key] + ', ';
                    }
                    arg = arg.slice(0, -2); // Remove trailing comma and space
                } else {
                    arg = arguments[i];
                }
                args.push(arg);
            }
            warn(msg + '\nArguments: ' + Array.prototype.slice.call(args).join('') + '\n' + (new Error()).stack);
            firstTime = false;
        }
        return fn.apply(this, arguments);
    }, fn);
}

var deprecations = {};

function deprecateSimple(name, msg) {
    if (hooks.deprecationHandler != null) {
        hooks.deprecationHandler(name, msg);
    }
    if (!deprecations[name]) {
        warn(msg);
        deprecations[name] = true;
    }
}

hooks.suppressDeprecationWarnings = false;
hooks.deprecationHandler = null;

function isFunction(input) {
    return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
}

function set (config) {
    var prop, i;
    for (i in config) {
        prop = config[i];
        if (isFunction(prop)) {
            this[i] = prop;
        } else {
            this['_' + i] = prop;
        }
    }
    this._config = config;
    // Lenient ordinal parsing accepts just a number in addition to
    // number + (possibly) stuff coming from _ordinalParseLenient.
    this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + (/\d{1,2}/).source);
}

function mergeConfigs(parentConfig, childConfig) {
    var res = extend({}, parentConfig), prop;
    for (prop in childConfig) {
        if (hasOwnProp(childConfig, prop)) {
            if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                res[prop] = {};
                extend(res[prop], parentConfig[prop]);
                extend(res[prop], childConfig[prop]);
            } else if (childConfig[prop] != null) {
                res[prop] = childConfig[prop];
            } else {
                delete res[prop];
            }
        }
    }
    for (prop in parentConfig) {
        if (hasOwnProp(parentConfig, prop) &&
                !hasOwnProp(childConfig, prop) &&
                isObject(parentConfig[prop])) {
            // make sure changes to properties don't modify parent config
            res[prop] = extend({}, res[prop]);
        }
    }
    return res;
}

function Locale(config) {
    if (config != null) {
        this.set(config);
    }
}

var keys;

if (Object.keys) {
    keys = Object.keys;
} else {
    keys = function (obj) {
        var i, res = [];
        for (i in obj) {
            if (hasOwnProp(obj, i)) {
                res.push(i);
            }
        }
        return res;
    };
}

var keys$1 = keys;

var defaultCalendar = {
    sameDay : '[Today at] LT',
    nextDay : '[Tomorrow at] LT',
    nextWeek : 'dddd [at] LT',
    lastDay : '[Yesterday at] LT',
    lastWeek : '[Last] dddd [at] LT',
    sameElse : 'L'
};

function calendar (key, mom, now) {
    var output = this._calendar[key] || this._calendar['sameElse'];
    return isFunction(output) ? output.call(mom, now) : output;
}

var defaultLongDateFormat = {
    LTS  : 'h:mm:ss A',
    LT   : 'h:mm A',
    L    : 'MM/DD/YYYY',
    LL   : 'MMMM D, YYYY',
    LLL  : 'MMMM D, YYYY h:mm A',
    LLLL : 'dddd, MMMM D, YYYY h:mm A'
};

function longDateFormat (key) {
    var format = this._longDateFormat[key],
        formatUpper = this._longDateFormat[key.toUpperCase()];

    if (format || !formatUpper) {
        return format;
    }

    this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
        return val.slice(1);
    });

    return this._longDateFormat[key];
}

var defaultInvalidDate = 'Invalid date';

function invalidDate () {
    return this._invalidDate;
}

var defaultOrdinal = '%d';
var defaultOrdinalParse = /\d{1,2}/;

function ordinal (number) {
    return this._ordinal.replace('%d', number);
}

var defaultRelativeTime = {
    future : 'in %s',
    past   : '%s ago',
    s  : 'a few seconds',
    m  : 'a minute',
    mm : '%d minutes',
    h  : 'an hour',
    hh : '%d hours',
    d  : 'a day',
    dd : '%d days',
    M  : 'a month',
    MM : '%d months',
    y  : 'a year',
    yy : '%d years'
};

function relativeTime (number, withoutSuffix, string, isFuture) {
    var output = this._relativeTime[string];
    return (isFunction(output)) ?
        output(number, withoutSuffix, string, isFuture) :
        output.replace(/%d/i, number);
}

function pastFuture (diff, output) {
    var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
    return isFunction(format) ? format(output) : format.replace(/%s/i, output);
}

var aliases = {};

function addUnitAlias (unit, shorthand) {
    var lowerCase = unit.toLowerCase();
    aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
}

function normalizeUnits(units) {
    return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
}

function normalizeObjectUnits(inputObject) {
    var normalizedInput = {},
        normalizedProp,
        prop;

    for (prop in inputObject) {
        if (hasOwnProp(inputObject, prop)) {
            normalizedProp = normalizeUnits(prop);
            if (normalizedProp) {
                normalizedInput[normalizedProp] = inputObject[prop];
            }
        }
    }

    return normalizedInput;
}

var priorities = {};

function addUnitPriority(unit, priority) {
    priorities[unit] = priority;
}

function getPrioritizedUnits(unitsObj) {
    var units = [];
    for (var u in unitsObj) {
        units.push({unit: u, priority: priorities[u]});
    }
    units.sort(function (a, b) {
        return a.priority - b.priority;
    });
    return units;
}

function makeGetSet (unit, keepTime) {
    return function (value) {
        if (value != null) {
            set$1(this, unit, value);
            hooks.updateOffset(this, keepTime);
            return this;
        } else {
            return get(this, unit);
        }
    };
}

function get (mom, unit) {
    return mom.isValid() ?
        mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
}

function set$1 (mom, unit, value) {
    if (mom.isValid()) {
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
    }
}

// MOMENTS

function stringGet (units) {
    units = normalizeUnits(units);
    if (isFunction(this[units])) {
        return this[units]();
    }
    return this;
}


function stringSet (units, value) {
    if (typeof units === 'object') {
        units = normalizeObjectUnits(units);
        var prioritized = getPrioritizedUnits(units);
        for (var i = 0; i < prioritized.length; i++) {
            this[prioritized[i].unit](units[prioritized[i].unit]);
        }
    } else {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
            return this[units](value);
        }
    }
    return this;
}

function zeroFill(number, targetLength, forceSign) {
    var absNumber = '' + Math.abs(number),
        zerosToFill = targetLength - absNumber.length,
        sign = number >= 0;
    return (sign ? (forceSign ? '+' : '') : '-') +
        Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
}

var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

var formatFunctions = {};

var formatTokenFunctions = {};

// token:    'M'
// padded:   ['MM', 2]
// ordinal:  'Mo'
// callback: function () { this.month() + 1 }
function addFormatToken (token, padded, ordinal, callback) {
    var func = callback;
    if (typeof callback === 'string') {
        func = function () {
            return this[callback]();
        };
    }
    if (token) {
        formatTokenFunctions[token] = func;
    }
    if (padded) {
        formatTokenFunctions[padded[0]] = function () {
            return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
        };
    }
    if (ordinal) {
        formatTokenFunctions[ordinal] = function () {
            return this.localeData().ordinal(func.apply(this, arguments), token);
        };
    }
}

function removeFormattingTokens(input) {
    if (input.match(/\[[\s\S]/)) {
        return input.replace(/^\[|\]$/g, '');
    }
    return input.replace(/\\/g, '');
}

function makeFormatFunction(format) {
    var array = format.match(formattingTokens), i, length;

    for (i = 0, length = array.length; i < length; i++) {
        if (formatTokenFunctions[array[i]]) {
            array[i] = formatTokenFunctions[array[i]];
        } else {
            array[i] = removeFormattingTokens(array[i]);
        }
    }

    return function (mom) {
        var output = '', i;
        for (i = 0; i < length; i++) {
            output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
        }
        return output;
    };
}

// format date using native date object
function formatMoment(m, format) {
    if (!m.isValid()) {
        return m.localeData().invalidDate();
    }

    format = expandFormat(format, m.localeData());
    formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

    return formatFunctions[format](m);
}

function expandFormat(format, locale) {
    var i = 5;

    function replaceLongDateFormatTokens(input) {
        return locale.longDateFormat(input) || input;
    }

    localFormattingTokens.lastIndex = 0;
    while (i >= 0 && localFormattingTokens.test(format)) {
        format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
        localFormattingTokens.lastIndex = 0;
        i -= 1;
    }

    return format;
}

var match1         = /\d/;            //       0 - 9
var match2         = /\d\d/;          //      00 - 99
var match3         = /\d{3}/;         //     000 - 999
var match4         = /\d{4}/;         //    0000 - 9999
var match6         = /[+-]?\d{6}/;    // -999999 - 999999
var match1to2      = /\d\d?/;         //       0 - 99
var match3to4      = /\d\d\d\d?/;     //     999 - 9999
var match5to6      = /\d\d\d\d\d\d?/; //   99999 - 999999
var match1to3      = /\d{1,3}/;       //       0 - 999
var match1to4      = /\d{1,4}/;       //       0 - 9999
var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

var matchUnsigned  = /\d+/;           //       0 - inf
var matchSigned    = /[+-]?\d+/;      //    -inf - inf

var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

// any word (or two) characters or numbers including two/three word month in arabic.
// includes scottish gaelic two word and hyphenated months
var matchWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;


var regexes = {};

function addRegexToken (token, regex, strictRegex) {
    regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
        return (isStrict && strictRegex) ? strictRegex : regex;
    };
}

function getParseRegexForToken (token, config) {
    if (!hasOwnProp(regexes, token)) {
        return new RegExp(unescapeFormat(token));
    }

    return regexes[token](config._strict, config._locale);
}

// Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
function unescapeFormat(s) {
    return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
        return p1 || p2 || p3 || p4;
    }));
}

function regexEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

var tokens = {};

function addParseToken (token, callback) {
    var i, func = callback;
    if (typeof token === 'string') {
        token = [token];
    }
    if (isNumber(callback)) {
        func = function (input, array) {
            array[callback] = toInt(input);
        };
    }
    for (i = 0; i < token.length; i++) {
        tokens[token[i]] = func;
    }
}

function addWeekParseToken (token, callback) {
    addParseToken(token, function (input, array, config, token) {
        config._w = config._w || {};
        callback(input, config._w, config, token);
    });
}

function addTimeToArrayFromToken(token, input, config) {
    if (input != null && hasOwnProp(tokens, token)) {
        tokens[token](input, config._a, config, token);
    }
}

var YEAR = 0;
var MONTH = 1;
var DATE = 2;
var HOUR = 3;
var MINUTE = 4;
var SECOND = 5;
var MILLISECOND = 6;
var WEEK = 7;
var WEEKDAY = 8;

var indexOf;

if (Array.prototype.indexOf) {
    indexOf = Array.prototype.indexOf;
} else {
    indexOf = function (o) {
        // I know
        var i;
        for (i = 0; i < this.length; ++i) {
            if (this[i] === o) {
                return i;
            }
        }
        return -1;
    };
}

var indexOf$1 = indexOf;

function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

// FORMATTING

addFormatToken('M', ['MM', 2], 'Mo', function () {
    return this.month() + 1;
});

addFormatToken('MMM', 0, 0, function (format) {
    return this.localeData().monthsShort(this, format);
});

addFormatToken('MMMM', 0, 0, function (format) {
    return this.localeData().months(this, format);
});

// ALIASES

addUnitAlias('month', 'M');

// PRIORITY

addUnitPriority('month', 8);

// PARSING

addRegexToken('M',    match1to2);
addRegexToken('MM',   match1to2, match2);
addRegexToken('MMM',  function (isStrict, locale) {
    return locale.monthsShortRegex(isStrict);
});
addRegexToken('MMMM', function (isStrict, locale) {
    return locale.monthsRegex(isStrict);
});

addParseToken(['M', 'MM'], function (input, array) {
    array[MONTH] = toInt(input) - 1;
});

addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
    var month = config._locale.monthsParse(input, token, config._strict);
    // if we didn't find a month name, mark the date as invalid.
    if (month != null) {
        array[MONTH] = month;
    } else {
        getParsingFlags(config).invalidMonth = input;
    }
});

// LOCALES

var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/;
var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
function localeMonths (m, format) {
    if (!m) {
        return this._months;
    }
    return isArray(this._months) ? this._months[m.month()] :
        this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
}

var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
function localeMonthsShort (m, format) {
    if (!m) {
        return this._monthsShort;
    }
    return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
        this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
}

function handleStrictParse(monthName, format, strict) {
    var i, ii, mom, llc = monthName.toLocaleLowerCase();
    if (!this._monthsParse) {
        // this is not used
        this._monthsParse = [];
        this._longMonthsParse = [];
        this._shortMonthsParse = [];
        for (i = 0; i < 12; ++i) {
            mom = createUTC([2000, i]);
            this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
            this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
        }
    }

    if (strict) {
        if (format === 'MMM') {
            ii = indexOf$1.call(this._shortMonthsParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf$1.call(this._longMonthsParse, llc);
            return ii !== -1 ? ii : null;
        }
    } else {
        if (format === 'MMM') {
            ii = indexOf$1.call(this._shortMonthsParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._longMonthsParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf$1.call(this._longMonthsParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._shortMonthsParse, llc);
            return ii !== -1 ? ii : null;
        }
    }
}

function localeMonthsParse (monthName, format, strict) {
    var i, mom, regex;

    if (this._monthsParseExact) {
        return handleStrictParse.call(this, monthName, format, strict);
    }

    if (!this._monthsParse) {
        this._monthsParse = [];
        this._longMonthsParse = [];
        this._shortMonthsParse = [];
    }

    // TODO: add sorting
    // Sorting makes sure if one month (or abbr) is a prefix of another
    // see sorting in computeMonthsParse
    for (i = 0; i < 12; i++) {
        // make the regex if we don't have it already
        mom = createUTC([2000, i]);
        if (strict && !this._longMonthsParse[i]) {
            this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
            this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
        }
        if (!strict && !this._monthsParse[i]) {
            regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
            this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        // test the regex
        if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
            return i;
        } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
            return i;
        } else if (!strict && this._monthsParse[i].test(monthName)) {
            return i;
        }
    }
}

// MOMENTS

function setMonth (mom, value) {
    var dayOfMonth;

    if (!mom.isValid()) {
        // No op
        return mom;
    }

    if (typeof value === 'string') {
        if (/^\d+$/.test(value)) {
            value = toInt(value);
        } else {
            value = mom.localeData().monthsParse(value);
            // TODO: Another silent failure?
            if (!isNumber(value)) {
                return mom;
            }
        }
    }

    dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
    mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
    return mom;
}

function getSetMonth (value) {
    if (value != null) {
        setMonth(this, value);
        hooks.updateOffset(this, true);
        return this;
    } else {
        return get(this, 'Month');
    }
}

function getDaysInMonth () {
    return daysInMonth(this.year(), this.month());
}

var defaultMonthsShortRegex = matchWord;
function monthsShortRegex (isStrict) {
    if (this._monthsParseExact) {
        if (!hasOwnProp(this, '_monthsRegex')) {
            computeMonthsParse.call(this);
        }
        if (isStrict) {
            return this._monthsShortStrictRegex;
        } else {
            return this._monthsShortRegex;
        }
    } else {
        if (!hasOwnProp(this, '_monthsShortRegex')) {
            this._monthsShortRegex = defaultMonthsShortRegex;
        }
        return this._monthsShortStrictRegex && isStrict ?
            this._monthsShortStrictRegex : this._monthsShortRegex;
    }
}

var defaultMonthsRegex = matchWord;
function monthsRegex (isStrict) {
    if (this._monthsParseExact) {
        if (!hasOwnProp(this, '_monthsRegex')) {
            computeMonthsParse.call(this);
        }
        if (isStrict) {
            return this._monthsStrictRegex;
        } else {
            return this._monthsRegex;
        }
    } else {
        if (!hasOwnProp(this, '_monthsRegex')) {
            this._monthsRegex = defaultMonthsRegex;
        }
        return this._monthsStrictRegex && isStrict ?
            this._monthsStrictRegex : this._monthsRegex;
    }
}

function computeMonthsParse () {
    function cmpLenRev(a, b) {
        return b.length - a.length;
    }

    var shortPieces = [], longPieces = [], mixedPieces = [],
        i, mom;
    for (i = 0; i < 12; i++) {
        // make the regex if we don't have it already
        mom = createUTC([2000, i]);
        shortPieces.push(this.monthsShort(mom, ''));
        longPieces.push(this.months(mom, ''));
        mixedPieces.push(this.months(mom, ''));
        mixedPieces.push(this.monthsShort(mom, ''));
    }
    // Sorting makes sure if one month (or abbr) is a prefix of another it
    // will match the longer piece.
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);
    for (i = 0; i < 12; i++) {
        shortPieces[i] = regexEscape(shortPieces[i]);
        longPieces[i] = regexEscape(longPieces[i]);
    }
    for (i = 0; i < 24; i++) {
        mixedPieces[i] = regexEscape(mixedPieces[i]);
    }

    this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._monthsShortRegex = this._monthsRegex;
    this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
    this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
}

// FORMATTING

addFormatToken('Y', 0, 0, function () {
    var y = this.year();
    return y <= 9999 ? '' + y : '+' + y;
});

addFormatToken(0, ['YY', 2], 0, function () {
    return this.year() % 100;
});

addFormatToken(0, ['YYYY',   4],       0, 'year');
addFormatToken(0, ['YYYYY',  5],       0, 'year');
addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

// ALIASES

addUnitAlias('year', 'y');

// PRIORITIES

addUnitPriority('year', 1);

// PARSING

addRegexToken('Y',      matchSigned);
addRegexToken('YY',     match1to2, match2);
addRegexToken('YYYY',   match1to4, match4);
addRegexToken('YYYYY',  match1to6, match6);
addRegexToken('YYYYYY', match1to6, match6);

addParseToken(['YYYYY', 'YYYYYY'], YEAR);
addParseToken('YYYY', function (input, array) {
    array[YEAR] = input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
});
addParseToken('YY', function (input, array) {
    array[YEAR] = hooks.parseTwoDigitYear(input);
});
addParseToken('Y', function (input, array) {
    array[YEAR] = parseInt(input, 10);
});

// HELPERS

function daysInYear(year) {
    return isLeapYear(year) ? 366 : 365;
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// HOOKS

hooks.parseTwoDigitYear = function (input) {
    return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
};

// MOMENTS

var getSetYear = makeGetSet('FullYear', true);

function getIsLeapYear () {
    return isLeapYear(this.year());
}

function createDate (y, m, d, h, M, s, ms) {
    //can't just apply() to create a date:
    //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
    var date = new Date(y, m, d, h, M, s, ms);

    //the date constructor remaps years 0-99 to 1900-1999
    if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
        date.setFullYear(y);
    }
    return date;
}

function createUTCDate (y) {
    var date = new Date(Date.UTC.apply(null, arguments));

    //the Date.UTC function remaps years 0-99 to 1900-1999
    if (y < 100 && y >= 0 && isFinite(date.getUTCFullYear())) {
        date.setUTCFullYear(y);
    }
    return date;
}

// start-of-first-week - start-of-year
function firstWeekOffset(year, dow, doy) {
    var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
        fwd = 7 + dow - doy,
        // first-week day local weekday -- which local weekday is fwd
        fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

    return -fwdlw + fwd - 1;
}

//http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
    var localWeekday = (7 + weekday - dow) % 7,
        weekOffset = firstWeekOffset(year, dow, doy),
        dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
        resYear, resDayOfYear;

    if (dayOfYear <= 0) {
        resYear = year - 1;
        resDayOfYear = daysInYear(resYear) + dayOfYear;
    } else if (dayOfYear > daysInYear(year)) {
        resYear = year + 1;
        resDayOfYear = dayOfYear - daysInYear(year);
    } else {
        resYear = year;
        resDayOfYear = dayOfYear;
    }

    return {
        year: resYear,
        dayOfYear: resDayOfYear
    };
}

function weekOfYear(mom, dow, doy) {
    var weekOffset = firstWeekOffset(mom.year(), dow, doy),
        week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
        resWeek, resYear;

    if (week < 1) {
        resYear = mom.year() - 1;
        resWeek = week + weeksInYear(resYear, dow, doy);
    } else if (week > weeksInYear(mom.year(), dow, doy)) {
        resWeek = week - weeksInYear(mom.year(), dow, doy);
        resYear = mom.year() + 1;
    } else {
        resYear = mom.year();
        resWeek = week;
    }

    return {
        week: resWeek,
        year: resYear
    };
}

function weeksInYear(year, dow, doy) {
    var weekOffset = firstWeekOffset(year, dow, doy),
        weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
    return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
}

// FORMATTING

addFormatToken('w', ['ww', 2], 'wo', 'week');
addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

// ALIASES

addUnitAlias('week', 'w');
addUnitAlias('isoWeek', 'W');

// PRIORITIES

addUnitPriority('week', 5);
addUnitPriority('isoWeek', 5);

// PARSING

addRegexToken('w',  match1to2);
addRegexToken('ww', match1to2, match2);
addRegexToken('W',  match1to2);
addRegexToken('WW', match1to2, match2);

addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
    week[token.substr(0, 1)] = toInt(input);
});

// HELPERS

// LOCALES

function localeWeek (mom) {
    return weekOfYear(mom, this._week.dow, this._week.doy).week;
}

var defaultLocaleWeek = {
    dow : 0, // Sunday is the first day of the week.
    doy : 6  // The week that contains Jan 1st is the first week of the year.
};

function localeFirstDayOfWeek () {
    return this._week.dow;
}

function localeFirstDayOfYear () {
    return this._week.doy;
}

// MOMENTS

function getSetWeek (input) {
    var week = this.localeData().week(this);
    return input == null ? week : this.add((input - week) * 7, 'd');
}

function getSetISOWeek (input) {
    var week = weekOfYear(this, 1, 4).week;
    return input == null ? week : this.add((input - week) * 7, 'd');
}

// FORMATTING

addFormatToken('d', 0, 'do', 'day');

addFormatToken('dd', 0, 0, function (format) {
    return this.localeData().weekdaysMin(this, format);
});

addFormatToken('ddd', 0, 0, function (format) {
    return this.localeData().weekdaysShort(this, format);
});

addFormatToken('dddd', 0, 0, function (format) {
    return this.localeData().weekdays(this, format);
});

addFormatToken('e', 0, 0, 'weekday');
addFormatToken('E', 0, 0, 'isoWeekday');

// ALIASES

addUnitAlias('day', 'd');
addUnitAlias('weekday', 'e');
addUnitAlias('isoWeekday', 'E');

// PRIORITY
addUnitPriority('day', 11);
addUnitPriority('weekday', 11);
addUnitPriority('isoWeekday', 11);

// PARSING

addRegexToken('d',    match1to2);
addRegexToken('e',    match1to2);
addRegexToken('E',    match1to2);
addRegexToken('dd',   function (isStrict, locale) {
    return locale.weekdaysMinRegex(isStrict);
});
addRegexToken('ddd',   function (isStrict, locale) {
    return locale.weekdaysShortRegex(isStrict);
});
addRegexToken('dddd',   function (isStrict, locale) {
    return locale.weekdaysRegex(isStrict);
});

addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
    var weekday = config._locale.weekdaysParse(input, token, config._strict);
    // if we didn't get a weekday name, mark the date as invalid
    if (weekday != null) {
        week.d = weekday;
    } else {
        getParsingFlags(config).invalidWeekday = input;
    }
});

addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
    week[token] = toInt(input);
});

// HELPERS

function parseWeekday(input, locale) {
    if (typeof input !== 'string') {
        return input;
    }

    if (!isNaN(input)) {
        return parseInt(input, 10);
    }

    input = locale.weekdaysParse(input);
    if (typeof input === 'number') {
        return input;
    }

    return null;
}

function parseIsoWeekday(input, locale) {
    if (typeof input === 'string') {
        return locale.weekdaysParse(input) % 7 || 7;
    }
    return isNaN(input) ? null : input;
}

// LOCALES

var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
function localeWeekdays (m, format) {
    if (!m) {
        return this._weekdays;
    }
    return isArray(this._weekdays) ? this._weekdays[m.day()] :
        this._weekdays[this._weekdays.isFormat.test(format) ? 'format' : 'standalone'][m.day()];
}

var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
function localeWeekdaysShort (m) {
    return (m) ? this._weekdaysShort[m.day()] : this._weekdaysShort;
}

var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
function localeWeekdaysMin (m) {
    return (m) ? this._weekdaysMin[m.day()] : this._weekdaysMin;
}

function handleStrictParse$1(weekdayName, format, strict) {
    var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
    if (!this._weekdaysParse) {
        this._weekdaysParse = [];
        this._shortWeekdaysParse = [];
        this._minWeekdaysParse = [];

        for (i = 0; i < 7; ++i) {
            mom = createUTC([2000, 1]).day(i);
            this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
            this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
            this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
        }
    }

    if (strict) {
        if (format === 'dddd') {
            ii = indexOf$1.call(this._weekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else if (format === 'ddd') {
            ii = indexOf$1.call(this._shortWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf$1.call(this._minWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        }
    } else {
        if (format === 'dddd') {
            ii = indexOf$1.call(this._weekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._shortWeekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._minWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else if (format === 'ddd') {
            ii = indexOf$1.call(this._shortWeekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._weekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._minWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf$1.call(this._minWeekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._weekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._shortWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        }
    }
}

function localeWeekdaysParse (weekdayName, format, strict) {
    var i, mom, regex;

    if (this._weekdaysParseExact) {
        return handleStrictParse$1.call(this, weekdayName, format, strict);
    }

    if (!this._weekdaysParse) {
        this._weekdaysParse = [];
        this._minWeekdaysParse = [];
        this._shortWeekdaysParse = [];
        this._fullWeekdaysParse = [];
    }

    for (i = 0; i < 7; i++) {
        // make the regex if we don't have it already

        mom = createUTC([2000, 1]).day(i);
        if (strict && !this._fullWeekdaysParse[i]) {
            this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\.?') + '$', 'i');
            this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\.?') + '$', 'i');
            this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\.?') + '$', 'i');
        }
        if (!this._weekdaysParse[i]) {
            regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
            this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        // test the regex
        if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
            return i;
        } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
            return i;
        } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
            return i;
        } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
            return i;
        }
    }
}

// MOMENTS

function getSetDayOfWeek (input) {
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }
    var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
    if (input != null) {
        input = parseWeekday(input, this.localeData());
        return this.add(input - day, 'd');
    } else {
        return day;
    }
}

function getSetLocaleDayOfWeek (input) {
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }
    var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
    return input == null ? weekday : this.add(input - weekday, 'd');
}

function getSetISODayOfWeek (input) {
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }

    // behaves the same as moment#day except
    // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
    // as a setter, sunday should belong to the previous week.

    if (input != null) {
        var weekday = parseIsoWeekday(input, this.localeData());
        return this.day(this.day() % 7 ? weekday : weekday - 7);
    } else {
        return this.day() || 7;
    }
}

var defaultWeekdaysRegex = matchWord;
function weekdaysRegex (isStrict) {
    if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            computeWeekdaysParse.call(this);
        }
        if (isStrict) {
            return this._weekdaysStrictRegex;
        } else {
            return this._weekdaysRegex;
        }
    } else {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            this._weekdaysRegex = defaultWeekdaysRegex;
        }
        return this._weekdaysStrictRegex && isStrict ?
            this._weekdaysStrictRegex : this._weekdaysRegex;
    }
}

var defaultWeekdaysShortRegex = matchWord;
function weekdaysShortRegex (isStrict) {
    if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            computeWeekdaysParse.call(this);
        }
        if (isStrict) {
            return this._weekdaysShortStrictRegex;
        } else {
            return this._weekdaysShortRegex;
        }
    } else {
        if (!hasOwnProp(this, '_weekdaysShortRegex')) {
            this._weekdaysShortRegex = defaultWeekdaysShortRegex;
        }
        return this._weekdaysShortStrictRegex && isStrict ?
            this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
    }
}

var defaultWeekdaysMinRegex = matchWord;
function weekdaysMinRegex (isStrict) {
    if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            computeWeekdaysParse.call(this);
        }
        if (isStrict) {
            return this._weekdaysMinStrictRegex;
        } else {
            return this._weekdaysMinRegex;
        }
    } else {
        if (!hasOwnProp(this, '_weekdaysMinRegex')) {
            this._weekdaysMinRegex = defaultWeekdaysMinRegex;
        }
        return this._weekdaysMinStrictRegex && isStrict ?
            this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
    }
}


function computeWeekdaysParse () {
    function cmpLenRev(a, b) {
        return b.length - a.length;
    }

    var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [],
        i, mom, minp, shortp, longp;
    for (i = 0; i < 7; i++) {
        // make the regex if we don't have it already
        mom = createUTC([2000, 1]).day(i);
        minp = this.weekdaysMin(mom, '');
        shortp = this.weekdaysShort(mom, '');
        longp = this.weekdays(mom, '');
        minPieces.push(minp);
        shortPieces.push(shortp);
        longPieces.push(longp);
        mixedPieces.push(minp);
        mixedPieces.push(shortp);
        mixedPieces.push(longp);
    }
    // Sorting makes sure if one weekday (or abbr) is a prefix of another it
    // will match the longer piece.
    minPieces.sort(cmpLenRev);
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);
    for (i = 0; i < 7; i++) {
        shortPieces[i] = regexEscape(shortPieces[i]);
        longPieces[i] = regexEscape(longPieces[i]);
        mixedPieces[i] = regexEscape(mixedPieces[i]);
    }

    this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._weekdaysShortRegex = this._weekdaysRegex;
    this._weekdaysMinRegex = this._weekdaysRegex;

    this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
    this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
    this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
}

// FORMATTING

function hFormat() {
    return this.hours() % 12 || 12;
}

function kFormat() {
    return this.hours() || 24;
}

addFormatToken('H', ['HH', 2], 0, 'hour');
addFormatToken('h', ['hh', 2], 0, hFormat);
addFormatToken('k', ['kk', 2], 0, kFormat);

addFormatToken('hmm', 0, 0, function () {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
});

addFormatToken('hmmss', 0, 0, function () {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
        zeroFill(this.seconds(), 2);
});

addFormatToken('Hmm', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2);
});

addFormatToken('Hmmss', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2) +
        zeroFill(this.seconds(), 2);
});

function meridiem (token, lowercase) {
    addFormatToken(token, 0, 0, function () {
        return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
    });
}

meridiem('a', true);
meridiem('A', false);

// ALIASES

addUnitAlias('hour', 'h');

// PRIORITY
addUnitPriority('hour', 13);

// PARSING

function matchMeridiem (isStrict, locale) {
    return locale._meridiemParse;
}

addRegexToken('a',  matchMeridiem);
addRegexToken('A',  matchMeridiem);
addRegexToken('H',  match1to2);
addRegexToken('h',  match1to2);
addRegexToken('HH', match1to2, match2);
addRegexToken('hh', match1to2, match2);

addRegexToken('hmm', match3to4);
addRegexToken('hmmss', match5to6);
addRegexToken('Hmm', match3to4);
addRegexToken('Hmmss', match5to6);

addParseToken(['H', 'HH'], HOUR);
addParseToken(['a', 'A'], function (input, array, config) {
    config._isPm = config._locale.isPM(input);
    config._meridiem = input;
});
addParseToken(['h', 'hh'], function (input, array, config) {
    array[HOUR] = toInt(input);
    getParsingFlags(config).bigHour = true;
});
addParseToken('hmm', function (input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
    getParsingFlags(config).bigHour = true;
});
addParseToken('hmmss', function (input, array, config) {
    var pos1 = input.length - 4;
    var pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
    getParsingFlags(config).bigHour = true;
});
addParseToken('Hmm', function (input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
});
addParseToken('Hmmss', function (input, array, config) {
    var pos1 = input.length - 4;
    var pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
});

// LOCALES

function localeIsPM (input) {
    // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
    // Using charAt should be more compatible.
    return ((input + '').toLowerCase().charAt(0) === 'p');
}

var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
function localeMeridiem (hours, minutes, isLower) {
    if (hours > 11) {
        return isLower ? 'pm' : 'PM';
    } else {
        return isLower ? 'am' : 'AM';
    }
}


// MOMENTS

// Setting the hour should keep the time, because the user explicitly
// specified which hour he wants. So trying to maintain the same hour (in
// a new timezone) makes sense. Adding/subtracting hours does not follow
// this rule.
var getSetHour = makeGetSet('Hours', true);

// months
// week
// weekdays
// meridiem
var baseConfig = {
    calendar: defaultCalendar,
    longDateFormat: defaultLongDateFormat,
    invalidDate: defaultInvalidDate,
    ordinal: defaultOrdinal,
    ordinalParse: defaultOrdinalParse,
    relativeTime: defaultRelativeTime,

    months: defaultLocaleMonths,
    monthsShort: defaultLocaleMonthsShort,

    week: defaultLocaleWeek,

    weekdays: defaultLocaleWeekdays,
    weekdaysMin: defaultLocaleWeekdaysMin,
    weekdaysShort: defaultLocaleWeekdaysShort,

    meridiemParse: defaultLocaleMeridiemParse
};

// internal storage for locale config files
var locales = {};
var localeFamilies = {};
var globalLocale;

function normalizeLocale(key) {
    return key ? key.toLowerCase().replace('_', '-') : key;
}

// pick the locale from the array
// try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
// substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
function chooseLocale(names) {
    var i = 0, j, next, locale, split;

    while (i < names.length) {
        split = normalizeLocale(names[i]).split('-');
        j = split.length;
        next = normalizeLocale(names[i + 1]);
        next = next ? next.split('-') : null;
        while (j > 0) {
            locale = loadLocale(split.slice(0, j).join('-'));
            if (locale) {
                return locale;
            }
            if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                //the next array item is better than a shallower substring of this one
                break;
            }
            j--;
        }
        i++;
    }
    return null;
}

function loadLocale(name) {
    var oldLocale = null;
    // TODO: Find a better way to register and load all the locales in Node
    if (!locales[name] && (typeof module !== 'undefined') &&
            module && module.exports) {
        try {
            oldLocale = globalLocale._abbr;
            require('./locale/' + name);
            // because defineLocale currently also sets the global locale, we
            // want to undo that for lazy loaded locales
            getSetGlobalLocale(oldLocale);
        } catch (e) { }
    }
    return locales[name];
}

// This function will load locale and then set the global locale.  If
// no arguments are passed in, it will simply return the current global
// locale key.
function getSetGlobalLocale (key, values) {
    var data;
    if (key) {
        if (isUndefined(values)) {
            data = getLocale(key);
        }
        else {
            data = defineLocale(key, values);
        }

        if (data) {
            // moment.duration._locale = moment._locale = data;
            globalLocale = data;
        }
    }

    return globalLocale._abbr;
}

function defineLocale (name, config) {
    if (config !== null) {
        var parentConfig = baseConfig;
        config.abbr = name;
        if (locales[name] != null) {
            deprecateSimple('defineLocaleOverride',
                    'use moment.updateLocale(localeName, config) to change ' +
                    'an existing locale. moment.defineLocale(localeName, ' +
                    'config) should only be used for creating a new locale ' +
                    'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
            parentConfig = locales[name]._config;
        } else if (config.parentLocale != null) {
            if (locales[config.parentLocale] != null) {
                parentConfig = locales[config.parentLocale]._config;
            } else {
                if (!localeFamilies[config.parentLocale]) {
                    localeFamilies[config.parentLocale] = [];
                }
                localeFamilies[config.parentLocale].push({
                    name: name,
                    config: config
                });
                return null;
            }
        }
        locales[name] = new Locale(mergeConfigs(parentConfig, config));

        if (localeFamilies[name]) {
            localeFamilies[name].forEach(function (x) {
                defineLocale(x.name, x.config);
            });
        }

        // backwards compat for now: also set the locale
        // make sure we set the locale AFTER all child locales have been
        // created, so we won't end up with the child locale set.
        getSetGlobalLocale(name);


        return locales[name];
    } else {
        // useful for testing
        delete locales[name];
        return null;
    }
}

function updateLocale(name, config) {
    if (config != null) {
        var locale, parentConfig = baseConfig;
        // MERGE
        if (locales[name] != null) {
            parentConfig = locales[name]._config;
        }
        config = mergeConfigs(parentConfig, config);
        locale = new Locale(config);
        locale.parentLocale = locales[name];
        locales[name] = locale;

        // backwards compat for now: also set the locale
        getSetGlobalLocale(name);
    } else {
        // pass null for config to unupdate, useful for tests
        if (locales[name] != null) {
            if (locales[name].parentLocale != null) {
                locales[name] = locales[name].parentLocale;
            } else if (locales[name] != null) {
                delete locales[name];
            }
        }
    }
    return locales[name];
}

// returns locale data
function getLocale (key) {
    var locale;

    if (key && key._locale && key._locale._abbr) {
        key = key._locale._abbr;
    }

    if (!key) {
        return globalLocale;
    }

    if (!isArray(key)) {
        //short-circuit everything else
        locale = loadLocale(key);
        if (locale) {
            return locale;
        }
        key = [key];
    }

    return chooseLocale(key);
}

function listLocales() {
    return keys$1(locales);
}

function checkOverflow (m) {
    var overflow;
    var a = m._a;

    if (a && getParsingFlags(m).overflow === -2) {
        overflow =
            a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
            a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
            a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
            a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
            a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
            a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
            -1;

        if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
            overflow = DATE;
        }
        if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
            overflow = WEEK;
        }
        if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
            overflow = WEEKDAY;
        }

        getParsingFlags(m).overflow = overflow;
    }

    return m;
}

// iso 8601 regex
// 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;

var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

var isoDates = [
    ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
    ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
    ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
    ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
    ['YYYY-DDD', /\d{4}-\d{3}/],
    ['YYYY-MM', /\d{4}-\d\d/, false],
    ['YYYYYYMMDD', /[+-]\d{10}/],
    ['YYYYMMDD', /\d{8}/],
    // YYYYMM is NOT allowed by the standard
    ['GGGG[W]WWE', /\d{4}W\d{3}/],
    ['GGGG[W]WW', /\d{4}W\d{2}/, false],
    ['YYYYDDD', /\d{7}/]
];

// iso time formats and regexes
var isoTimes = [
    ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
    ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
    ['HH:mm:ss', /\d\d:\d\d:\d\d/],
    ['HH:mm', /\d\d:\d\d/],
    ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
    ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
    ['HHmmss', /\d\d\d\d\d\d/],
    ['HHmm', /\d\d\d\d/],
    ['HH', /\d\d/]
];

var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

// date from iso format
function configFromISO(config) {
    var i, l,
        string = config._i,
        match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
        allowTime, dateFormat, timeFormat, tzFormat;

    if (match) {
        getParsingFlags(config).iso = true;

        for (i = 0, l = isoDates.length; i < l; i++) {
            if (isoDates[i][1].exec(match[1])) {
                dateFormat = isoDates[i][0];
                allowTime = isoDates[i][2] !== false;
                break;
            }
        }
        if (dateFormat == null) {
            config._isValid = false;
            return;
        }
        if (match[3]) {
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(match[3])) {
                    // match[2] should be 'T' or space
                    timeFormat = (match[2] || ' ') + isoTimes[i][0];
                    break;
                }
            }
            if (timeFormat == null) {
                config._isValid = false;
                return;
            }
        }
        if (!allowTime && timeFormat != null) {
            config._isValid = false;
            return;
        }
        if (match[4]) {
            if (tzRegex.exec(match[4])) {
                tzFormat = 'Z';
            } else {
                config._isValid = false;
                return;
            }
        }
        config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
        configFromStringAndFormat(config);
    } else {
        config._isValid = false;
    }
}

// date from iso format or fallback
function configFromString(config) {
    var matched = aspNetJsonRegex.exec(config._i);

    if (matched !== null) {
        config._d = new Date(+matched[1]);
        return;
    }

    configFromISO(config);
    if (config._isValid === false) {
        delete config._isValid;
        hooks.createFromInputFallback(config);
    }
}

hooks.createFromInputFallback = deprecate(
    'value provided is not in a recognized ISO format. moment construction falls back to js Date(), ' +
    'which is not reliable across all browsers and versions. Non ISO date formats are ' +
    'discouraged and will be removed in an upcoming major release. Please refer to ' +
    'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
    function (config) {
        config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
    }
);

// Pick the first defined of two or three arguments.
function defaults(a, b, c) {
    if (a != null) {
        return a;
    }
    if (b != null) {
        return b;
    }
    return c;
}

function currentDateArray(config) {
    // hooks is actually the exported moment object
    var nowValue = new Date(hooks.now());
    if (config._useUTC) {
        return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
    }
    return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
}

// convert an array to a date.
// the array should mirror the parameters below
// note: all values past the year are optional and will default to the lowest possible value.
// [year, month, day , hour, minute, second, millisecond]
function configFromArray (config) {
    var i, date, input = [], currentDate, yearToUse;

    if (config._d) {
        return;
    }

    currentDate = currentDateArray(config);

    //compute day of the year from weeks and weekdays
    if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
        dayOfYearFromWeekInfo(config);
    }

    //if the day of the year is set, figure out what it is
    if (config._dayOfYear) {
        yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

        if (config._dayOfYear > daysInYear(yearToUse)) {
            getParsingFlags(config)._overflowDayOfYear = true;
        }

        date = createUTCDate(yearToUse, 0, config._dayOfYear);
        config._a[MONTH] = date.getUTCMonth();
        config._a[DATE] = date.getUTCDate();
    }

    // Default to current date.
    // * if no year, month, day of month are given, default to today
    // * if day of month is given, default month and year
    // * if month is given, default only year
    // * if year is given, don't default anything
    for (i = 0; i < 3 && config._a[i] == null; ++i) {
        config._a[i] = input[i] = currentDate[i];
    }

    // Zero out whatever was not defaulted, including time
    for (; i < 7; i++) {
        config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
    }

    // Check for 24:00:00.000
    if (config._a[HOUR] === 24 &&
            config._a[MINUTE] === 0 &&
            config._a[SECOND] === 0 &&
            config._a[MILLISECOND] === 0) {
        config._nextDay = true;
        config._a[HOUR] = 0;
    }

    config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
    // Apply timezone offset from input. The actual utcOffset can be changed
    // with parseZone.
    if (config._tzm != null) {
        config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
    }

    if (config._nextDay) {
        config._a[HOUR] = 24;
    }
}

function dayOfYearFromWeekInfo(config) {
    var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

    w = config._w;
    if (w.GG != null || w.W != null || w.E != null) {
        dow = 1;
        doy = 4;

        // TODO: We need to take the current isoWeekYear, but that depends on
        // how we interpret now (local, utc, fixed offset). So create
        // a now version of current config (take local/utc/offset flags, and
        // create now).
        weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(createLocal(), 1, 4).year);
        week = defaults(w.W, 1);
        weekday = defaults(w.E, 1);
        if (weekday < 1 || weekday > 7) {
            weekdayOverflow = true;
        }
    } else {
        dow = config._locale._week.dow;
        doy = config._locale._week.doy;

        var curWeek = weekOfYear(createLocal(), dow, doy);

        weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

        // Default to current week.
        week = defaults(w.w, curWeek.week);

        if (w.d != null) {
            // weekday -- low day numbers are considered next week
            weekday = w.d;
            if (weekday < 0 || weekday > 6) {
                weekdayOverflow = true;
            }
        } else if (w.e != null) {
            // local weekday -- counting starts from begining of week
            weekday = w.e + dow;
            if (w.e < 0 || w.e > 6) {
                weekdayOverflow = true;
            }
        } else {
            // default to begining of week
            weekday = dow;
        }
    }
    if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
        getParsingFlags(config)._overflowWeeks = true;
    } else if (weekdayOverflow != null) {
        getParsingFlags(config)._overflowWeekday = true;
    } else {
        temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
    }
}

// constant that refers to the ISO standard
hooks.ISO_8601 = function () {};

// date from string and format string
function configFromStringAndFormat(config) {
    // TODO: Move this to another part of the creation flow to prevent circular deps
    if (config._f === hooks.ISO_8601) {
        configFromISO(config);
        return;
    }

    config._a = [];
    getParsingFlags(config).empty = true;

    // This array is used to make a Date, either with `new Date` or `Date.UTC`
    var string = '' + config._i,
        i, parsedInput, tokens, token, skipped,
        stringLength = string.length,
        totalParsedInputLength = 0;

    tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

    for (i = 0; i < tokens.length; i++) {
        token = tokens[i];
        parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
        // console.log('token', token, 'parsedInput', parsedInput,
        //         'regex', getParseRegexForToken(token, config));
        if (parsedInput) {
            skipped = string.substr(0, string.indexOf(parsedInput));
            if (skipped.length > 0) {
                getParsingFlags(config).unusedInput.push(skipped);
            }
            string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
            totalParsedInputLength += parsedInput.length;
        }
        // don't parse if it's not a known token
        if (formatTokenFunctions[token]) {
            if (parsedInput) {
                getParsingFlags(config).empty = false;
            }
            else {
                getParsingFlags(config).unusedTokens.push(token);
            }
            addTimeToArrayFromToken(token, parsedInput, config);
        }
        else if (config._strict && !parsedInput) {
            getParsingFlags(config).unusedTokens.push(token);
        }
    }

    // add remaining unparsed input length to the string
    getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
    if (string.length > 0) {
        getParsingFlags(config).unusedInput.push(string);
    }

    // clear _12h flag if hour is <= 12
    if (config._a[HOUR] <= 12 &&
        getParsingFlags(config).bigHour === true &&
        config._a[HOUR] > 0) {
        getParsingFlags(config).bigHour = undefined;
    }

    getParsingFlags(config).parsedDateParts = config._a.slice(0);
    getParsingFlags(config).meridiem = config._meridiem;
    // handle meridiem
    config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

    configFromArray(config);
    checkOverflow(config);
}


function meridiemFixWrap (locale, hour, meridiem) {
    var isPm;

    if (meridiem == null) {
        // nothing to do
        return hour;
    }
    if (locale.meridiemHour != null) {
        return locale.meridiemHour(hour, meridiem);
    } else if (locale.isPM != null) {
        // Fallback
        isPm = locale.isPM(meridiem);
        if (isPm && hour < 12) {
            hour += 12;
        }
        if (!isPm && hour === 12) {
            hour = 0;
        }
        return hour;
    } else {
        // this is not supposed to happen
        return hour;
    }
}

// date from string and array of format strings
function configFromStringAndArray(config) {
    var tempConfig,
        bestMoment,

        scoreToBeat,
        i,
        currentScore;

    if (config._f.length === 0) {
        getParsingFlags(config).invalidFormat = true;
        config._d = new Date(NaN);
        return;
    }

    for (i = 0; i < config._f.length; i++) {
        currentScore = 0;
        tempConfig = copyConfig({}, config);
        if (config._useUTC != null) {
            tempConfig._useUTC = config._useUTC;
        }
        tempConfig._f = config._f[i];
        configFromStringAndFormat(tempConfig);

        if (!isValid(tempConfig)) {
            continue;
        }

        // if there is any input that was not parsed add a penalty for that format
        currentScore += getParsingFlags(tempConfig).charsLeftOver;

        //or tokens
        currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

        getParsingFlags(tempConfig).score = currentScore;

        if (scoreToBeat == null || currentScore < scoreToBeat) {
            scoreToBeat = currentScore;
            bestMoment = tempConfig;
        }
    }

    extend(config, bestMoment || tempConfig);
}

function configFromObject(config) {
    if (config._d) {
        return;
    }

    var i = normalizeObjectUnits(config._i);
    config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
        return obj && parseInt(obj, 10);
    });

    configFromArray(config);
}

function createFromConfig (config) {
    var res = new Moment(checkOverflow(prepareConfig(config)));
    if (res._nextDay) {
        // Adding is smart enough around DST
        res.add(1, 'd');
        res._nextDay = undefined;
    }

    return res;
}

function prepareConfig (config) {
    var input = config._i,
        format = config._f;

    config._locale = config._locale || getLocale(config._l);

    if (input === null || (format === undefined && input === '')) {
        return createInvalid({nullInput: true});
    }

    if (typeof input === 'string') {
        config._i = input = config._locale.preparse(input);
    }

    if (isMoment(input)) {
        return new Moment(checkOverflow(input));
    } else if (isDate(input)) {
        config._d = input;
    } else if (isArray(format)) {
        configFromStringAndArray(config);
    } else if (format) {
        configFromStringAndFormat(config);
    }  else {
        configFromInput(config);
    }

    if (!isValid(config)) {
        config._d = null;
    }

    return config;
}

function configFromInput(config) {
    var input = config._i;
    if (input === undefined) {
        config._d = new Date(hooks.now());
    } else if (isDate(input)) {
        config._d = new Date(input.valueOf());
    } else if (typeof input === 'string') {
        configFromString(config);
    } else if (isArray(input)) {
        config._a = map(input.slice(0), function (obj) {
            return parseInt(obj, 10);
        });
        configFromArray(config);
    } else if (typeof(input) === 'object') {
        configFromObject(config);
    } else if (isNumber(input)) {
        // from milliseconds
        config._d = new Date(input);
    } else {
        hooks.createFromInputFallback(config);
    }
}

function createLocalOrUTC (input, format, locale, strict, isUTC) {
    var c = {};

    if (locale === true || locale === false) {
        strict = locale;
        locale = undefined;
    }

    if ((isObject(input) && isObjectEmpty(input)) ||
            (isArray(input) && input.length === 0)) {
        input = undefined;
    }
    // object construction must be done this way.
    // https://github.com/moment/moment/issues/1423
    c._isAMomentObject = true;
    c._useUTC = c._isUTC = isUTC;
    c._l = locale;
    c._i = input;
    c._f = format;
    c._strict = strict;

    return createFromConfig(c);
}

function createLocal (input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, false);
}

var prototypeMin = deprecate(
    'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
    function () {
        var other = createLocal.apply(null, arguments);
        if (this.isValid() && other.isValid()) {
            return other < this ? this : other;
        } else {
            return createInvalid();
        }
    }
);

var prototypeMax = deprecate(
    'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
    function () {
        var other = createLocal.apply(null, arguments);
        if (this.isValid() && other.isValid()) {
            return other > this ? this : other;
        } else {
            return createInvalid();
        }
    }
);

// Pick a moment m from moments so that m[fn](other) is true for all
// other. This relies on the function fn to be transitive.
//
// moments should either be an array of moment objects or an array, whose
// first element is an array of moment objects.
function pickBy(fn, moments) {
    var res, i;
    if (moments.length === 1 && isArray(moments[0])) {
        moments = moments[0];
    }
    if (!moments.length) {
        return createLocal();
    }
    res = moments[0];
    for (i = 1; i < moments.length; ++i) {
        if (!moments[i].isValid() || moments[i][fn](res)) {
            res = moments[i];
        }
    }
    return res;
}

// TODO: Use [].sort instead?
function min () {
    var args = [].slice.call(arguments, 0);

    return pickBy('isBefore', args);
}

function max () {
    var args = [].slice.call(arguments, 0);

    return pickBy('isAfter', args);
}

var now = function () {
    return Date.now ? Date.now() : +(new Date());
};

function Duration (duration) {
    var normalizedInput = normalizeObjectUnits(duration),
        years = normalizedInput.year || 0,
        quarters = normalizedInput.quarter || 0,
        months = normalizedInput.month || 0,
        weeks = normalizedInput.week || 0,
        days = normalizedInput.day || 0,
        hours = normalizedInput.hour || 0,
        minutes = normalizedInput.minute || 0,
        seconds = normalizedInput.second || 0,
        milliseconds = normalizedInput.millisecond || 0;

    // representation for dateAddRemove
    this._milliseconds = +milliseconds +
        seconds * 1e3 + // 1000
        minutes * 6e4 + // 1000 * 60
        hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
    // Because of dateAddRemove treats 24 hours as different from a
    // day when working around DST, we need to store them separately
    this._days = +days +
        weeks * 7;
    // It is impossible translate months into days without knowing
    // which months you are are talking about, so we have to store
    // it separately.
    this._months = +months +
        quarters * 3 +
        years * 12;

    this._data = {};

    this._locale = getLocale();

    this._bubble();
}

function isDuration (obj) {
    return obj instanceof Duration;
}

function absRound (number) {
    if (number < 0) {
        return Math.round(-1 * number) * -1;
    } else {
        return Math.round(number);
    }
}

// FORMATTING

function offset (token, separator) {
    addFormatToken(token, 0, 0, function () {
        var offset = this.utcOffset();
        var sign = '+';
        if (offset < 0) {
            offset = -offset;
            sign = '-';
        }
        return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
    });
}

offset('Z', ':');
offset('ZZ', '');

// PARSING

addRegexToken('Z',  matchShortOffset);
addRegexToken('ZZ', matchShortOffset);
addParseToken(['Z', 'ZZ'], function (input, array, config) {
    config._useUTC = true;
    config._tzm = offsetFromString(matchShortOffset, input);
});

// HELPERS

// timezone chunker
// '+10:00' > ['10',  '00']
// '-1530'  > ['-15', '30']
var chunkOffset = /([\+\-]|\d\d)/gi;

function offsetFromString(matcher, string) {
    var matches = (string || '').match(matcher);

    if (matches === null) {
        return null;
    }

    var chunk   = matches[matches.length - 1] || [];
    var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
    var minutes = +(parts[1] * 60) + toInt(parts[2]);

    return minutes === 0 ?
      0 :
      parts[0] === '+' ? minutes : -minutes;
}

// Return a moment from input, that is local/utc/zone equivalent to model.
function cloneWithOffset(input, model) {
    var res, diff;
    if (model._isUTC) {
        res = model.clone();
        diff = (isMoment(input) || isDate(input) ? input.valueOf() : createLocal(input).valueOf()) - res.valueOf();
        // Use low-level api, because this fn is low-level api.
        res._d.setTime(res._d.valueOf() + diff);
        hooks.updateOffset(res, false);
        return res;
    } else {
        return createLocal(input).local();
    }
}

function getDateOffset (m) {
    // On Firefox.24 Date#getTimezoneOffset returns a floating point.
    // https://github.com/moment/moment/pull/1871
    return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
}

// HOOKS

// This function will be called whenever a moment is mutated.
// It is intended to keep the offset in sync with the timezone.
hooks.updateOffset = function () {};

// MOMENTS

// keepLocalTime = true means only change the timezone, without
// affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
// 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
// +0200, so we adjust the time as needed, to be valid.
//
// Keeping the time actually adds/subtracts (one hour)
// from the actual represented time. That is why we call updateOffset
// a second time. In case it wants us to change the offset again
// _changeInProgress == true case, then we have to adjust, because
// there is no such time in the given timezone.
function getSetOffset (input, keepLocalTime) {
    var offset = this._offset || 0,
        localAdjust;
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }
    if (input != null) {
        if (typeof input === 'string') {
            input = offsetFromString(matchShortOffset, input);
            if (input === null) {
                return this;
            }
        } else if (Math.abs(input) < 16) {
            input = input * 60;
        }
        if (!this._isUTC && keepLocalTime) {
            localAdjust = getDateOffset(this);
        }
        this._offset = input;
        this._isUTC = true;
        if (localAdjust != null) {
            this.add(localAdjust, 'm');
        }
        if (offset !== input) {
            if (!keepLocalTime || this._changeInProgress) {
                addSubtract(this, createDuration(input - offset, 'm'), 1, false);
            } else if (!this._changeInProgress) {
                this._changeInProgress = true;
                hooks.updateOffset(this, true);
                this._changeInProgress = null;
            }
        }
        return this;
    } else {
        return this._isUTC ? offset : getDateOffset(this);
    }
}

function getSetZone (input, keepLocalTime) {
    if (input != null) {
        if (typeof input !== 'string') {
            input = -input;
        }

        this.utcOffset(input, keepLocalTime);

        return this;
    } else {
        return -this.utcOffset();
    }
}

function setOffsetToUTC (keepLocalTime) {
    return this.utcOffset(0, keepLocalTime);
}

function setOffsetToLocal (keepLocalTime) {
    if (this._isUTC) {
        this.utcOffset(0, keepLocalTime);
        this._isUTC = false;

        if (keepLocalTime) {
            this.subtract(getDateOffset(this), 'm');
        }
    }
    return this;
}

function setOffsetToParsedOffset () {
    if (this._tzm != null) {
        this.utcOffset(this._tzm);
    } else if (typeof this._i === 'string') {
        var tZone = offsetFromString(matchOffset, this._i);
        if (tZone != null) {
            this.utcOffset(tZone);
        }
        else {
            this.utcOffset(0, true);
        }
    }
    return this;
}

function hasAlignedHourOffset (input) {
    if (!this.isValid()) {
        return false;
    }
    input = input ? createLocal(input).utcOffset() : 0;

    return (this.utcOffset() - input) % 60 === 0;
}

function isDaylightSavingTime () {
    return (
        this.utcOffset() > this.clone().month(0).utcOffset() ||
        this.utcOffset() > this.clone().month(5).utcOffset()
    );
}

function isDaylightSavingTimeShifted () {
    if (!isUndefined(this._isDSTShifted)) {
        return this._isDSTShifted;
    }

    var c = {};

    copyConfig(c, this);
    c = prepareConfig(c);

    if (c._a) {
        var other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
        this._isDSTShifted = this.isValid() &&
            compareArrays(c._a, other.toArray()) > 0;
    } else {
        this._isDSTShifted = false;
    }

    return this._isDSTShifted;
}

function isLocal () {
    return this.isValid() ? !this._isUTC : false;
}

function isUtcOffset () {
    return this.isValid() ? this._isUTC : false;
}

function isUtc () {
    return this.isValid() ? this._isUTC && this._offset === 0 : false;
}

// ASP.NET json date format regex
var aspNetRegex = /^(\-)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/;

// from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
// somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
// and further modified to allow for strings containing both week and day
var isoRegex = /^(-)?P(?:(-?[0-9,.]*)Y)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)W)?(?:(-?[0-9,.]*)D)?(?:T(?:(-?[0-9,.]*)H)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)S)?)?$/;

function createDuration (input, key) {
    var duration = input,
        // matching against regexp is expensive, do it on demand
        match = null,
        sign,
        ret,
        diffRes;

    if (isDuration(input)) {
        duration = {
            ms : input._milliseconds,
            d  : input._days,
            M  : input._months
        };
    } else if (isNumber(input)) {
        duration = {};
        if (key) {
            duration[key] = input;
        } else {
            duration.milliseconds = input;
        }
    } else if (!!(match = aspNetRegex.exec(input))) {
        sign = (match[1] === '-') ? -1 : 1;
        duration = {
            y  : 0,
            d  : toInt(match[DATE])                         * sign,
            h  : toInt(match[HOUR])                         * sign,
            m  : toInt(match[MINUTE])                       * sign,
            s  : toInt(match[SECOND])                       * sign,
            ms : toInt(absRound(match[MILLISECOND] * 1000)) * sign // the millisecond decimal point is included in the match
        };
    } else if (!!(match = isoRegex.exec(input))) {
        sign = (match[1] === '-') ? -1 : 1;
        duration = {
            y : parseIso(match[2], sign),
            M : parseIso(match[3], sign),
            w : parseIso(match[4], sign),
            d : parseIso(match[5], sign),
            h : parseIso(match[6], sign),
            m : parseIso(match[7], sign),
            s : parseIso(match[8], sign)
        };
    } else if (duration == null) {// checks for null or undefined
        duration = {};
    } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
        diffRes = momentsDifference(createLocal(duration.from), createLocal(duration.to));

        duration = {};
        duration.ms = diffRes.milliseconds;
        duration.M = diffRes.months;
    }

    ret = new Duration(duration);

    if (isDuration(input) && hasOwnProp(input, '_locale')) {
        ret._locale = input._locale;
    }

    return ret;
}

createDuration.fn = Duration.prototype;

function parseIso (inp, sign) {
    // We'd normally use ~~inp for this, but unfortunately it also
    // converts floats to ints.
    // inp may be undefined, so careful calling replace on it.
    var res = inp && parseFloat(inp.replace(',', '.'));
    // apply sign while we're at it
    return (isNaN(res) ? 0 : res) * sign;
}

function positiveMomentsDifference(base, other) {
    var res = {milliseconds: 0, months: 0};

    res.months = other.month() - base.month() +
        (other.year() - base.year()) * 12;
    if (base.clone().add(res.months, 'M').isAfter(other)) {
        --res.months;
    }

    res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

    return res;
}

function momentsDifference(base, other) {
    var res;
    if (!(base.isValid() && other.isValid())) {
        return {milliseconds: 0, months: 0};
    }

    other = cloneWithOffset(other, base);
    if (base.isBefore(other)) {
        res = positiveMomentsDifference(base, other);
    } else {
        res = positiveMomentsDifference(other, base);
        res.milliseconds = -res.milliseconds;
        res.months = -res.months;
    }

    return res;
}

// TODO: remove 'name' arg after deprecation is removed
function createAdder(direction, name) {
    return function (val, period) {
        var dur, tmp;
        //invert the arguments, but complain about it
        if (period !== null && !isNaN(+period)) {
            deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' +
            'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
            tmp = val; val = period; period = tmp;
        }

        val = typeof val === 'string' ? +val : val;
        dur = createDuration(val, period);
        addSubtract(this, dur, direction);
        return this;
    };
}

function addSubtract (mom, duration, isAdding, updateOffset) {
    var milliseconds = duration._milliseconds,
        days = absRound(duration._days),
        months = absRound(duration._months);

    if (!mom.isValid()) {
        // No op
        return;
    }

    updateOffset = updateOffset == null ? true : updateOffset;

    if (milliseconds) {
        mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
    }
    if (days) {
        set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
    }
    if (months) {
        setMonth(mom, get(mom, 'Month') + months * isAdding);
    }
    if (updateOffset) {
        hooks.updateOffset(mom, days || months);
    }
}

var add      = createAdder(1, 'add');
var subtract = createAdder(-1, 'subtract');

function getCalendarFormat(myMoment, now) {
    var diff = myMoment.diff(now, 'days', true);
    return diff < -6 ? 'sameElse' :
            diff < -1 ? 'lastWeek' :
            diff < 0 ? 'lastDay' :
            diff < 1 ? 'sameDay' :
            diff < 2 ? 'nextDay' :
            diff < 7 ? 'nextWeek' : 'sameElse';
}

function calendar$1 (time, formats) {
    // We want to compare the start of today, vs this.
    // Getting start-of-today depends on whether we're local/utc/offset or not.
    var now = time || createLocal(),
        sod = cloneWithOffset(now, this).startOf('day'),
        format = hooks.calendarFormat(this, sod) || 'sameElse';

    var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

    return this.format(output || this.localeData().calendar(format, this, createLocal(now)));
}

function clone () {
    return new Moment(this);
}

function isAfter (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
        return false;
    }
    units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
    if (units === 'millisecond') {
        return this.valueOf() > localInput.valueOf();
    } else {
        return localInput.valueOf() < this.clone().startOf(units).valueOf();
    }
}

function isBefore (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
        return false;
    }
    units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
    if (units === 'millisecond') {
        return this.valueOf() < localInput.valueOf();
    } else {
        return this.clone().endOf(units).valueOf() < localInput.valueOf();
    }
}

function isBetween (from, to, units, inclusivity) {
    inclusivity = inclusivity || '()';
    return (inclusivity[0] === '(' ? this.isAfter(from, units) : !this.isBefore(from, units)) &&
        (inclusivity[1] === ')' ? this.isBefore(to, units) : !this.isAfter(to, units));
}

function isSame (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input),
        inputMs;
    if (!(this.isValid() && localInput.isValid())) {
        return false;
    }
    units = normalizeUnits(units || 'millisecond');
    if (units === 'millisecond') {
        return this.valueOf() === localInput.valueOf();
    } else {
        inputMs = localInput.valueOf();
        return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
    }
}

function isSameOrAfter (input, units) {
    return this.isSame(input, units) || this.isAfter(input,units);
}

function isSameOrBefore (input, units) {
    return this.isSame(input, units) || this.isBefore(input,units);
}

function diff (input, units, asFloat) {
    var that,
        zoneDelta,
        delta, output;

    if (!this.isValid()) {
        return NaN;
    }

    that = cloneWithOffset(input, this);

    if (!that.isValid()) {
        return NaN;
    }

    zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

    units = normalizeUnits(units);

    if (units === 'year' || units === 'month' || units === 'quarter') {
        output = monthDiff(this, that);
        if (units === 'quarter') {
            output = output / 3;
        } else if (units === 'year') {
            output = output / 12;
        }
    } else {
        delta = this - that;
        output = units === 'second' ? delta / 1e3 : // 1000
            units === 'minute' ? delta / 6e4 : // 1000 * 60
            units === 'hour' ? delta / 36e5 : // 1000 * 60 * 60
            units === 'day' ? (delta - zoneDelta) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
            units === 'week' ? (delta - zoneDelta) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
            delta;
    }
    return asFloat ? output : absFloor(output);
}

function monthDiff (a, b) {
    // difference in months
    var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
        // b is in (anchor - 1 month, anchor + 1 month)
        anchor = a.clone().add(wholeMonthDiff, 'months'),
        anchor2, adjust;

    if (b - anchor < 0) {
        anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
        // linear across the month
        adjust = (b - anchor) / (anchor - anchor2);
    } else {
        anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
        // linear across the month
        adjust = (b - anchor) / (anchor2 - anchor);
    }

    //check for negative zero, return zero if negative zero
    return -(wholeMonthDiff + adjust) || 0;
}

hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

function toString () {
    return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
}

function toISOString () {
    var m = this.clone().utc();
    if (0 < m.year() && m.year() <= 9999) {
        if (isFunction(Date.prototype.toISOString)) {
            // native implementation is ~50x faster, use it when we can
            return this.toDate().toISOString();
        } else {
            return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        }
    } else {
        return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
    }
}

/**
 * Return a human readable representation of a moment that can
 * also be evaluated to get a new moment which is the same
 *
 * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
 */
function inspect () {
    if (!this.isValid()) {
        return 'moment.invalid(/* ' + this._i + ' */)';
    }
    var func = 'moment';
    var zone = '';
    if (!this.isLocal()) {
        func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
        zone = 'Z';
    }
    var prefix = '[' + func + '("]';
    var year = (0 < this.year() && this.year() <= 9999) ? 'YYYY' : 'YYYYYY';
    var datetime = '-MM-DD[T]HH:mm:ss.SSS';
    var suffix = zone + '[")]';

    return this.format(prefix + year + datetime + suffix);
}

function format (inputString) {
    if (!inputString) {
        inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat;
    }
    var output = formatMoment(this, inputString);
    return this.localeData().postformat(output);
}

function from (time, withoutSuffix) {
    if (this.isValid() &&
            ((isMoment(time) && time.isValid()) ||
             createLocal(time).isValid())) {
        return createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
    } else {
        return this.localeData().invalidDate();
    }
}

function fromNow (withoutSuffix) {
    return this.from(createLocal(), withoutSuffix);
}

function to (time, withoutSuffix) {
    if (this.isValid() &&
            ((isMoment(time) && time.isValid()) ||
             createLocal(time).isValid())) {
        return createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
    } else {
        return this.localeData().invalidDate();
    }
}

function toNow (withoutSuffix) {
    return this.to(createLocal(), withoutSuffix);
}

// If passed a locale key, it will set the locale for this
// instance.  Otherwise, it will return the locale configuration
// variables for this instance.
function locale (key) {
    var newLocaleData;

    if (key === undefined) {
        return this._locale._abbr;
    } else {
        newLocaleData = getLocale(key);
        if (newLocaleData != null) {
            this._locale = newLocaleData;
        }
        return this;
    }
}

var lang = deprecate(
    'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
    function (key) {
        if (key === undefined) {
            return this.localeData();
        } else {
            return this.locale(key);
        }
    }
);

function localeData () {
    return this._locale;
}

function startOf (units) {
    units = normalizeUnits(units);
    // the following switch intentionally omits break keywords
    // to utilize falling through the cases.
    switch (units) {
        case 'year':
            this.month(0);
            /* falls through */
        case 'quarter':
        case 'month':
            this.date(1);
            /* falls through */
        case 'week':
        case 'isoWeek':
        case 'day':
        case 'date':
            this.hours(0);
            /* falls through */
        case 'hour':
            this.minutes(0);
            /* falls through */
        case 'minute':
            this.seconds(0);
            /* falls through */
        case 'second':
            this.milliseconds(0);
    }

    // weeks are a special case
    if (units === 'week') {
        this.weekday(0);
    }
    if (units === 'isoWeek') {
        this.isoWeekday(1);
    }

    // quarters are also special
    if (units === 'quarter') {
        this.month(Math.floor(this.month() / 3) * 3);
    }

    return this;
}

function endOf (units) {
    units = normalizeUnits(units);
    if (units === undefined || units === 'millisecond') {
        return this;
    }

    // 'date' is an alias for 'day', so it should be considered as such.
    if (units === 'date') {
        units = 'day';
    }

    return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
}

function valueOf () {
    return this._d.valueOf() - ((this._offset || 0) * 60000);
}

function unix () {
    return Math.floor(this.valueOf() / 1000);
}

function toDate () {
    return new Date(this.valueOf());
}

function toArray () {
    var m = this;
    return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
}

function toObject () {
    var m = this;
    return {
        years: m.year(),
        months: m.month(),
        date: m.date(),
        hours: m.hours(),
        minutes: m.minutes(),
        seconds: m.seconds(),
        milliseconds: m.milliseconds()
    };
}

function toJSON () {
    // new Date(NaN).toJSON() === null
    return this.isValid() ? this.toISOString() : null;
}

function isValid$1 () {
    return isValid(this);
}

function parsingFlags () {
    return extend({}, getParsingFlags(this));
}

function invalidAt () {
    return getParsingFlags(this).overflow;
}

function creationData() {
    return {
        input: this._i,
        format: this._f,
        locale: this._locale,
        isUTC: this._isUTC,
        strict: this._strict
    };
}

// FORMATTING

addFormatToken(0, ['gg', 2], 0, function () {
    return this.weekYear() % 100;
});

addFormatToken(0, ['GG', 2], 0, function () {
    return this.isoWeekYear() % 100;
});

function addWeekYearFormatToken (token, getter) {
    addFormatToken(0, [token, token.length], 0, getter);
}

addWeekYearFormatToken('gggg',     'weekYear');
addWeekYearFormatToken('ggggg',    'weekYear');
addWeekYearFormatToken('GGGG',  'isoWeekYear');
addWeekYearFormatToken('GGGGG', 'isoWeekYear');

// ALIASES

addUnitAlias('weekYear', 'gg');
addUnitAlias('isoWeekYear', 'GG');

// PRIORITY

addUnitPriority('weekYear', 1);
addUnitPriority('isoWeekYear', 1);


// PARSING

addRegexToken('G',      matchSigned);
addRegexToken('g',      matchSigned);
addRegexToken('GG',     match1to2, match2);
addRegexToken('gg',     match1to2, match2);
addRegexToken('GGGG',   match1to4, match4);
addRegexToken('gggg',   match1to4, match4);
addRegexToken('GGGGG',  match1to6, match6);
addRegexToken('ggggg',  match1to6, match6);

addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
    week[token.substr(0, 2)] = toInt(input);
});

addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
    week[token] = hooks.parseTwoDigitYear(input);
});

// MOMENTS

function getSetWeekYear (input) {
    return getSetWeekYearHelper.call(this,
            input,
            this.week(),
            this.weekday(),
            this.localeData()._week.dow,
            this.localeData()._week.doy);
}

function getSetISOWeekYear (input) {
    return getSetWeekYearHelper.call(this,
            input, this.isoWeek(), this.isoWeekday(), 1, 4);
}

function getISOWeeksInYear () {
    return weeksInYear(this.year(), 1, 4);
}

function getWeeksInYear () {
    var weekInfo = this.localeData()._week;
    return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
}

function getSetWeekYearHelper(input, week, weekday, dow, doy) {
    var weeksTarget;
    if (input == null) {
        return weekOfYear(this, dow, doy).year;
    } else {
        weeksTarget = weeksInYear(input, dow, doy);
        if (week > weeksTarget) {
            week = weeksTarget;
        }
        return setWeekAll.call(this, input, week, weekday, dow, doy);
    }
}

function setWeekAll(weekYear, week, weekday, dow, doy) {
    var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
        date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

    this.year(date.getUTCFullYear());
    this.month(date.getUTCMonth());
    this.date(date.getUTCDate());
    return this;
}

// FORMATTING

addFormatToken('Q', 0, 'Qo', 'quarter');

// ALIASES

addUnitAlias('quarter', 'Q');

// PRIORITY

addUnitPriority('quarter', 7);

// PARSING

addRegexToken('Q', match1);
addParseToken('Q', function (input, array) {
    array[MONTH] = (toInt(input) - 1) * 3;
});

// MOMENTS

function getSetQuarter (input) {
    return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
}

// FORMATTING

addFormatToken('D', ['DD', 2], 'Do', 'date');

// ALIASES

addUnitAlias('date', 'D');

// PRIOROITY
addUnitPriority('date', 9);

// PARSING

addRegexToken('D',  match1to2);
addRegexToken('DD', match1to2, match2);
addRegexToken('Do', function (isStrict, locale) {
    return isStrict ? locale._ordinalParse : locale._ordinalParseLenient;
});

addParseToken(['D', 'DD'], DATE);
addParseToken('Do', function (input, array) {
    array[DATE] = toInt(input.match(match1to2)[0], 10);
});

// MOMENTS

var getSetDayOfMonth = makeGetSet('Date', true);

// FORMATTING

addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

// ALIASES

addUnitAlias('dayOfYear', 'DDD');

// PRIORITY
addUnitPriority('dayOfYear', 4);

// PARSING

addRegexToken('DDD',  match1to3);
addRegexToken('DDDD', match3);
addParseToken(['DDD', 'DDDD'], function (input, array, config) {
    config._dayOfYear = toInt(input);
});

// HELPERS

// MOMENTS

function getSetDayOfYear (input) {
    var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
    return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
}

// FORMATTING

addFormatToken('m', ['mm', 2], 0, 'minute');

// ALIASES

addUnitAlias('minute', 'm');

// PRIORITY

addUnitPriority('minute', 14);

// PARSING

addRegexToken('m',  match1to2);
addRegexToken('mm', match1to2, match2);
addParseToken(['m', 'mm'], MINUTE);

// MOMENTS

var getSetMinute = makeGetSet('Minutes', false);

// FORMATTING

addFormatToken('s', ['ss', 2], 0, 'second');

// ALIASES

addUnitAlias('second', 's');

// PRIORITY

addUnitPriority('second', 15);

// PARSING

addRegexToken('s',  match1to2);
addRegexToken('ss', match1to2, match2);
addParseToken(['s', 'ss'], SECOND);

// MOMENTS

var getSetSecond = makeGetSet('Seconds', false);

// FORMATTING

addFormatToken('S', 0, 0, function () {
    return ~~(this.millisecond() / 100);
});

addFormatToken(0, ['SS', 2], 0, function () {
    return ~~(this.millisecond() / 10);
});

addFormatToken(0, ['SSS', 3], 0, 'millisecond');
addFormatToken(0, ['SSSS', 4], 0, function () {
    return this.millisecond() * 10;
});
addFormatToken(0, ['SSSSS', 5], 0, function () {
    return this.millisecond() * 100;
});
addFormatToken(0, ['SSSSSS', 6], 0, function () {
    return this.millisecond() * 1000;
});
addFormatToken(0, ['SSSSSSS', 7], 0, function () {
    return this.millisecond() * 10000;
});
addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
    return this.millisecond() * 100000;
});
addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
    return this.millisecond() * 1000000;
});


// ALIASES

addUnitAlias('millisecond', 'ms');

// PRIORITY

addUnitPriority('millisecond', 16);

// PARSING

addRegexToken('S',    match1to3, match1);
addRegexToken('SS',   match1to3, match2);
addRegexToken('SSS',  match1to3, match3);

var token;
for (token = 'SSSS'; token.length <= 9; token += 'S') {
    addRegexToken(token, matchUnsigned);
}

function parseMs(input, array) {
    array[MILLISECOND] = toInt(('0.' + input) * 1000);
}

for (token = 'S'; token.length <= 9; token += 'S') {
    addParseToken(token, parseMs);
}
// MOMENTS

var getSetMillisecond = makeGetSet('Milliseconds', false);

// FORMATTING

addFormatToken('z',  0, 0, 'zoneAbbr');
addFormatToken('zz', 0, 0, 'zoneName');

// MOMENTS

function getZoneAbbr () {
    return this._isUTC ? 'UTC' : '';
}

function getZoneName () {
    return this._isUTC ? 'Coordinated Universal Time' : '';
}

var proto = Moment.prototype;

proto.add               = add;
proto.calendar          = calendar$1;
proto.clone             = clone;
proto.diff              = diff;
proto.endOf             = endOf;
proto.format            = format;
proto.from              = from;
proto.fromNow           = fromNow;
proto.to                = to;
proto.toNow             = toNow;
proto.get               = stringGet;
proto.invalidAt         = invalidAt;
proto.isAfter           = isAfter;
proto.isBefore          = isBefore;
proto.isBetween         = isBetween;
proto.isSame            = isSame;
proto.isSameOrAfter     = isSameOrAfter;
proto.isSameOrBefore    = isSameOrBefore;
proto.isValid           = isValid$1;
proto.lang              = lang;
proto.locale            = locale;
proto.localeData        = localeData;
proto.max               = prototypeMax;
proto.min               = prototypeMin;
proto.parsingFlags      = parsingFlags;
proto.set               = stringSet;
proto.startOf           = startOf;
proto.subtract          = subtract;
proto.toArray           = toArray;
proto.toObject          = toObject;
proto.toDate            = toDate;
proto.toISOString       = toISOString;
proto.inspect           = inspect;
proto.toJSON            = toJSON;
proto.toString          = toString;
proto.unix              = unix;
proto.valueOf           = valueOf;
proto.creationData      = creationData;

// Year
proto.year       = getSetYear;
proto.isLeapYear = getIsLeapYear;

// Week Year
proto.weekYear    = getSetWeekYear;
proto.isoWeekYear = getSetISOWeekYear;

// Quarter
proto.quarter = proto.quarters = getSetQuarter;

// Month
proto.month       = getSetMonth;
proto.daysInMonth = getDaysInMonth;

// Week
proto.week           = proto.weeks        = getSetWeek;
proto.isoWeek        = proto.isoWeeks     = getSetISOWeek;
proto.weeksInYear    = getWeeksInYear;
proto.isoWeeksInYear = getISOWeeksInYear;

// Day
proto.date       = getSetDayOfMonth;
proto.day        = proto.days             = getSetDayOfWeek;
proto.weekday    = getSetLocaleDayOfWeek;
proto.isoWeekday = getSetISODayOfWeek;
proto.dayOfYear  = getSetDayOfYear;

// Hour
proto.hour = proto.hours = getSetHour;

// Minute
proto.minute = proto.minutes = getSetMinute;

// Second
proto.second = proto.seconds = getSetSecond;

// Millisecond
proto.millisecond = proto.milliseconds = getSetMillisecond;

// Offset
proto.utcOffset            = getSetOffset;
proto.utc                  = setOffsetToUTC;
proto.local                = setOffsetToLocal;
proto.parseZone            = setOffsetToParsedOffset;
proto.hasAlignedHourOffset = hasAlignedHourOffset;
proto.isDST                = isDaylightSavingTime;
proto.isLocal              = isLocal;
proto.isUtcOffset          = isUtcOffset;
proto.isUtc                = isUtc;
proto.isUTC                = isUtc;

// Timezone
proto.zoneAbbr = getZoneAbbr;
proto.zoneName = getZoneName;

// Deprecations
proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

function createUnix (input) {
    return createLocal(input * 1000);
}

function createInZone () {
    return createLocal.apply(null, arguments).parseZone();
}

function preParsePostFormat (string) {
    return string;
}

var proto$1 = Locale.prototype;

proto$1.calendar        = calendar;
proto$1.longDateFormat  = longDateFormat;
proto$1.invalidDate     = invalidDate;
proto$1.ordinal         = ordinal;
proto$1.preparse        = preParsePostFormat;
proto$1.postformat      = preParsePostFormat;
proto$1.relativeTime    = relativeTime;
proto$1.pastFuture      = pastFuture;
proto$1.set             = set;

// Month
proto$1.months            =        localeMonths;
proto$1.monthsShort       =        localeMonthsShort;
proto$1.monthsParse       =        localeMonthsParse;
proto$1.monthsRegex       = monthsRegex;
proto$1.monthsShortRegex  = monthsShortRegex;

// Week
proto$1.week = localeWeek;
proto$1.firstDayOfYear = localeFirstDayOfYear;
proto$1.firstDayOfWeek = localeFirstDayOfWeek;

// Day of Week
proto$1.weekdays       =        localeWeekdays;
proto$1.weekdaysMin    =        localeWeekdaysMin;
proto$1.weekdaysShort  =        localeWeekdaysShort;
proto$1.weekdaysParse  =        localeWeekdaysParse;

proto$1.weekdaysRegex       =        weekdaysRegex;
proto$1.weekdaysShortRegex  =        weekdaysShortRegex;
proto$1.weekdaysMinRegex    =        weekdaysMinRegex;

// Hours
proto$1.isPM = localeIsPM;
proto$1.meridiem = localeMeridiem;

function get$1 (format, index, field, setter) {
    var locale = getLocale();
    var utc = createUTC().set(setter, index);
    return locale[field](utc, format);
}

function listMonthsImpl (format, index, field) {
    if (isNumber(format)) {
        index = format;
        format = undefined;
    }

    format = format || '';

    if (index != null) {
        return get$1(format, index, field, 'month');
    }

    var i;
    var out = [];
    for (i = 0; i < 12; i++) {
        out[i] = get$1(format, i, field, 'month');
    }
    return out;
}

// ()
// (5)
// (fmt, 5)
// (fmt)
// (true)
// (true, 5)
// (true, fmt, 5)
// (true, fmt)
function listWeekdaysImpl (localeSorted, format, index, field) {
    if (typeof localeSorted === 'boolean') {
        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';
    } else {
        format = localeSorted;
        index = format;
        localeSorted = false;

        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';
    }

    var locale = getLocale(),
        shift = localeSorted ? locale._week.dow : 0;

    if (index != null) {
        return get$1(format, (index + shift) % 7, field, 'day');
    }

    var i;
    var out = [];
    for (i = 0; i < 7; i++) {
        out[i] = get$1(format, (i + shift) % 7, field, 'day');
    }
    return out;
}

function listMonths (format, index) {
    return listMonthsImpl(format, index, 'months');
}

function listMonthsShort (format, index) {
    return listMonthsImpl(format, index, 'monthsShort');
}

function listWeekdays (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
}

function listWeekdaysShort (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
}

function listWeekdaysMin (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
}

getSetGlobalLocale('en', {
    ordinalParse: /\d{1,2}(th|st|nd|rd)/,
    ordinal : function (number) {
        var b = number % 10,
            output = (toInt(number % 100 / 10) === 1) ? 'th' :
            (b === 1) ? 'st' :
            (b === 2) ? 'nd' :
            (b === 3) ? 'rd' : 'th';
        return number + output;
    }
});

// Side effect imports
hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', getSetGlobalLocale);
hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', getLocale);

var mathAbs = Math.abs;

function abs () {
    var data           = this._data;

    this._milliseconds = mathAbs(this._milliseconds);
    this._days         = mathAbs(this._days);
    this._months       = mathAbs(this._months);

    data.milliseconds  = mathAbs(data.milliseconds);
    data.seconds       = mathAbs(data.seconds);
    data.minutes       = mathAbs(data.minutes);
    data.hours         = mathAbs(data.hours);
    data.months        = mathAbs(data.months);
    data.years         = mathAbs(data.years);

    return this;
}

function addSubtract$1 (duration, input, value, direction) {
    var other = createDuration(input, value);

    duration._milliseconds += direction * other._milliseconds;
    duration._days         += direction * other._days;
    duration._months       += direction * other._months;

    return duration._bubble();
}

// supports only 2.0-style add(1, 's') or add(duration)
function add$1 (input, value) {
    return addSubtract$1(this, input, value, 1);
}

// supports only 2.0-style subtract(1, 's') or subtract(duration)
function subtract$1 (input, value) {
    return addSubtract$1(this, input, value, -1);
}

function absCeil (number) {
    if (number < 0) {
        return Math.floor(number);
    } else {
        return Math.ceil(number);
    }
}

function bubble () {
    var milliseconds = this._milliseconds;
    var days         = this._days;
    var months       = this._months;
    var data         = this._data;
    var seconds, minutes, hours, years, monthsFromDays;

    // if we have a mix of positive and negative values, bubble down first
    // check: https://github.com/moment/moment/issues/2166
    if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
            (milliseconds <= 0 && days <= 0 && months <= 0))) {
        milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
        days = 0;
        months = 0;
    }

    // The following code bubbles up values, see the tests for
    // examples of what that means.
    data.milliseconds = milliseconds % 1000;

    seconds           = absFloor(milliseconds / 1000);
    data.seconds      = seconds % 60;

    minutes           = absFloor(seconds / 60);
    data.minutes      = minutes % 60;

    hours             = absFloor(minutes / 60);
    data.hours        = hours % 24;

    days += absFloor(hours / 24);

    // convert days to months
    monthsFromDays = absFloor(daysToMonths(days));
    months += monthsFromDays;
    days -= absCeil(monthsToDays(monthsFromDays));

    // 12 months -> 1 year
    years = absFloor(months / 12);
    months %= 12;

    data.days   = days;
    data.months = months;
    data.years  = years;

    return this;
}

function daysToMonths (days) {
    // 400 years have 146097 days (taking into account leap year rules)
    // 400 years have 12 months === 4800
    return days * 4800 / 146097;
}

function monthsToDays (months) {
    // the reverse of daysToMonths
    return months * 146097 / 4800;
}

function as (units) {
    var days;
    var months;
    var milliseconds = this._milliseconds;

    units = normalizeUnits(units);

    if (units === 'month' || units === 'year') {
        days   = this._days   + milliseconds / 864e5;
        months = this._months + daysToMonths(days);
        return units === 'month' ? months : months / 12;
    } else {
        // handle milliseconds separately because of floating point math errors (issue #1867)
        days = this._days + Math.round(monthsToDays(this._months));
        switch (units) {
            case 'week'   : return days / 7     + milliseconds / 6048e5;
            case 'day'    : return days         + milliseconds / 864e5;
            case 'hour'   : return days * 24    + milliseconds / 36e5;
            case 'minute' : return days * 1440  + milliseconds / 6e4;
            case 'second' : return days * 86400 + milliseconds / 1000;
            // Math.floor prevents floating point math errors here
            case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
            default: throw new Error('Unknown unit ' + units);
        }
    }
}

// TODO: Use this.as('ms')?
function valueOf$1 () {
    return (
        this._milliseconds +
        this._days * 864e5 +
        (this._months % 12) * 2592e6 +
        toInt(this._months / 12) * 31536e6
    );
}

function makeAs (alias) {
    return function () {
        return this.as(alias);
    };
}

var asMilliseconds = makeAs('ms');
var asSeconds      = makeAs('s');
var asMinutes      = makeAs('m');
var asHours        = makeAs('h');
var asDays         = makeAs('d');
var asWeeks        = makeAs('w');
var asMonths       = makeAs('M');
var asYears        = makeAs('y');

function get$2 (units) {
    units = normalizeUnits(units);
    return this[units + 's']();
}

function makeGetter(name) {
    return function () {
        return this._data[name];
    };
}

var milliseconds = makeGetter('milliseconds');
var seconds      = makeGetter('seconds');
var minutes      = makeGetter('minutes');
var hours        = makeGetter('hours');
var days         = makeGetter('days');
var months       = makeGetter('months');
var years        = makeGetter('years');

function weeks () {
    return absFloor(this.days() / 7);
}

var round = Math.round;
var thresholds = {
    s: 45,  // seconds to minute
    m: 45,  // minutes to hour
    h: 22,  // hours to day
    d: 26,  // days to month
    M: 11   // months to year
};

// helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
    return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
}

function relativeTime$1 (posNegDuration, withoutSuffix, locale) {
    var duration = createDuration(posNegDuration).abs();
    var seconds  = round(duration.as('s'));
    var minutes  = round(duration.as('m'));
    var hours    = round(duration.as('h'));
    var days     = round(duration.as('d'));
    var months   = round(duration.as('M'));
    var years    = round(duration.as('y'));

    var a = seconds < thresholds.s && ['s', seconds]  ||
            minutes <= 1           && ['m']           ||
            minutes < thresholds.m && ['mm', minutes] ||
            hours   <= 1           && ['h']           ||
            hours   < thresholds.h && ['hh', hours]   ||
            days    <= 1           && ['d']           ||
            days    < thresholds.d && ['dd', days]    ||
            months  <= 1           && ['M']           ||
            months  < thresholds.M && ['MM', months]  ||
            years   <= 1           && ['y']           || ['yy', years];

    a[2] = withoutSuffix;
    a[3] = +posNegDuration > 0;
    a[4] = locale;
    return substituteTimeAgo.apply(null, a);
}

// This function allows you to set the rounding function for relative time strings
function getSetRelativeTimeRounding (roundingFunction) {
    if (roundingFunction === undefined) {
        return round;
    }
    if (typeof(roundingFunction) === 'function') {
        round = roundingFunction;
        return true;
    }
    return false;
}

// This function allows you to set a threshold for relative time strings
function getSetRelativeTimeThreshold (threshold, limit) {
    if (thresholds[threshold] === undefined) {
        return false;
    }
    if (limit === undefined) {
        return thresholds[threshold];
    }
    thresholds[threshold] = limit;
    return true;
}

function humanize (withSuffix) {
    var locale = this.localeData();
    var output = relativeTime$1(this, !withSuffix, locale);

    if (withSuffix) {
        output = locale.pastFuture(+this, output);
    }

    return locale.postformat(output);
}

var abs$1 = Math.abs;

function toISOString$1() {
    // for ISO strings we do not use the normal bubbling rules:
    //  * milliseconds bubble up until they become hours
    //  * days do not bubble at all
    //  * months bubble up until they become years
    // This is because there is no context-free conversion between hours and days
    // (think of clock changes)
    // and also not between days and months (28-31 days per month)
    var seconds = abs$1(this._milliseconds) / 1000;
    var days         = abs$1(this._days);
    var months       = abs$1(this._months);
    var minutes, hours, years;

    // 3600 seconds -> 60 minutes -> 1 hour
    minutes           = absFloor(seconds / 60);
    hours             = absFloor(minutes / 60);
    seconds %= 60;
    minutes %= 60;

    // 12 months -> 1 year
    years  = absFloor(months / 12);
    months %= 12;


    // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
    var Y = years;
    var M = months;
    var D = days;
    var h = hours;
    var m = minutes;
    var s = seconds;
    var total = this.asSeconds();

    if (!total) {
        // this is the same as C#'s (Noda) and python (isodate)...
        // but not other JS (goog.date)
        return 'P0D';
    }

    return (total < 0 ? '-' : '') +
        'P' +
        (Y ? Y + 'Y' : '') +
        (M ? M + 'M' : '') +
        (D ? D + 'D' : '') +
        ((h || m || s) ? 'T' : '') +
        (h ? h + 'H' : '') +
        (m ? m + 'M' : '') +
        (s ? s + 'S' : '');
}

var proto$2 = Duration.prototype;

proto$2.abs            = abs;
proto$2.add            = add$1;
proto$2.subtract       = subtract$1;
proto$2.as             = as;
proto$2.asMilliseconds = asMilliseconds;
proto$2.asSeconds      = asSeconds;
proto$2.asMinutes      = asMinutes;
proto$2.asHours        = asHours;
proto$2.asDays         = asDays;
proto$2.asWeeks        = asWeeks;
proto$2.asMonths       = asMonths;
proto$2.asYears        = asYears;
proto$2.valueOf        = valueOf$1;
proto$2._bubble        = bubble;
proto$2.get            = get$2;
proto$2.milliseconds   = milliseconds;
proto$2.seconds        = seconds;
proto$2.minutes        = minutes;
proto$2.hours          = hours;
proto$2.days           = days;
proto$2.weeks          = weeks;
proto$2.months         = months;
proto$2.years          = years;
proto$2.humanize       = humanize;
proto$2.toISOString    = toISOString$1;
proto$2.toString       = toISOString$1;
proto$2.toJSON         = toISOString$1;
proto$2.locale         = locale;
proto$2.localeData     = localeData;

// Deprecations
proto$2.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', toISOString$1);
proto$2.lang = lang;

// Side effect imports

// FORMATTING

addFormatToken('X', 0, 0, 'unix');
addFormatToken('x', 0, 0, 'valueOf');

// PARSING

addRegexToken('x', matchSigned);
addRegexToken('X', matchTimestamp);
addParseToken('X', function (input, array, config) {
    config._d = new Date(parseFloat(input, 10) * 1000);
});
addParseToken('x', function (input, array, config) {
    config._d = new Date(toInt(input));
});

// Side effect imports


hooks.version = '2.17.1';

setHookCallback(createLocal);

hooks.fn                    = proto;
hooks.min                   = min;
hooks.max                   = max;
hooks.now                   = now;
hooks.utc                   = createUTC;
hooks.unix                  = createUnix;
hooks.months                = listMonths;
hooks.isDate                = isDate;
hooks.locale                = getSetGlobalLocale;
hooks.invalid               = createInvalid;
hooks.duration              = createDuration;
hooks.isMoment              = isMoment;
hooks.weekdays              = listWeekdays;
hooks.parseZone             = createInZone;
hooks.localeData            = getLocale;
hooks.isDuration            = isDuration;
hooks.monthsShort           = listMonthsShort;
hooks.weekdaysMin           = listWeekdaysMin;
hooks.defineLocale          = defineLocale;
hooks.updateLocale          = updateLocale;
hooks.locales               = listLocales;
hooks.weekdaysShort         = listWeekdaysShort;
hooks.normalizeUnits        = normalizeUnits;
hooks.relativeTimeRounding = getSetRelativeTimeRounding;
hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
hooks.calendarFormat        = getCalendarFormat;
hooks.prototype             = proto;

return hooks;

})));

},{}],22:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return b64.length * 3 / 4 - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],23:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":22,"ieee754":24,"isarray":25}],24:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],25:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}]},{},[5]);
