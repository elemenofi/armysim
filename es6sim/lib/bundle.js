(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Actions = function Actions(engine) {
    _classCallCheck(this, Actions);

    this.inspect = function (officerId) {
        engine.army.HQ.inspectOfficer(officerId);
        if (!engine.running) {
            engine.update(true);
            engine.updateUI(true);
        }
    };
    this.target = function (officerId) {
        var target = engine.army.HQ.targetOfficer(officerId);
        if (!engine.running) {
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
    targetOfficer(officerId) {
        var officer = this.findOfficerById(officerId);
        this.target = officer;
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
    findOperationalStaff(officer, self) {
        var operationalStaff = [];
        operationalStaff = operationalStaff.concat(this.findStaff(officer));
        operationalStaff = operationalStaff.concat(this.findSubordinates(officer));
        if (this.findPlayer() && self)
            operationalStaff.push(this.findPlayer());
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
'use strict';var _typeof=typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"?function(obj){return typeof obj;}:function(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj;};(function(){var MAX_INT=9007199254740992;var MIN_INT=-MAX_INT;var NUMBERS='0123456789';var CHARS_LOWER='abcdefghijklmnopqrstuvwxyz';var CHARS_UPPER=CHARS_LOWER.toUpperCase();var HEX_POOL=NUMBERS+"abcdef";var slice=Array.prototype.slice;function Chance(seed){if(!(this instanceof Chance)){return seed==null?new Chance():new Chance(seed);}if(typeof seed==='function'){this.random=seed;return this;}if(arguments.length){this.seed=0;}for(var i=0;i<arguments.length;i++){var seedling=0;if(Object.prototype.toString.call(arguments[i])==='[object String]'){for(var j=0;j<arguments[i].length;j++){var hash=0;for(var k=0;k<arguments[i].length;k++){hash=arguments[i].charCodeAt(k)+(hash<<6)+(hash<<16)-hash;}seedling+=hash;}}else{seedling=arguments[i];}this.seed+=(arguments.length-i)*seedling;}this.mt=this.mersenne_twister(this.seed);this.bimd5=this.blueimp_md5();this.random=function(){return this.mt.random(this.seed);};return this;}Chance.prototype.VERSION="1.0.4";function initOptions(options,defaults){options||(options={});if(defaults){for(var i in defaults){if(typeof options[i]==='undefined'){options[i]=defaults[i];}}}return options;}function testRange(test,errorMessage){if(test){throw new RangeError(errorMessage);}}var base64=function base64(){throw new Error('No Base64 encoder available.');};(function determineBase64Encoder(){if(typeof btoa==='function'){base64=btoa;}else if(typeof Buffer==='function'){base64=function base64(input){return new Buffer(input).toString('base64');};}})();Chance.prototype.bool=function(options){options=initOptions(options,{likelihood:50});testRange(options.likelihood<0||options.likelihood>100,"Chance: Likelihood accepts values from 0 to 100.");return this.random()*100<options.likelihood;};Chance.prototype.character=function(options){options=initOptions(options);testRange(options.alpha&&options.symbols,"Chance: Cannot specify both alpha and symbols.");var symbols="!@#$%^&*()[]",letters,pool;if(options.casing==='lower'){letters=CHARS_LOWER;}else if(options.casing==='upper'){letters=CHARS_UPPER;}else{letters=CHARS_LOWER+CHARS_UPPER;}if(options.pool){pool=options.pool;}else if(options.alpha){pool=letters;}else if(options.symbols){pool=symbols;}else{pool=letters+NUMBERS+symbols;}return pool.charAt(this.natural({max:pool.length-1}));};Chance.prototype.floating=function(options){options=initOptions(options,{fixed:4});testRange(options.fixed&&options.precision,"Chance: Cannot specify both fixed and precision.");var num;var fixed=Math.pow(10,options.fixed);var max=MAX_INT/fixed;var min=-max;testRange(options.min&&options.fixed&&options.min<min,"Chance: Min specified is out of range with fixed. Min should be, at least, "+min);testRange(options.max&&options.fixed&&options.max>max,"Chance: Max specified is out of range with fixed. Max should be, at most, "+max);options=initOptions(options,{min:min,max:max});num=this.integer({min:options.min*fixed,max:options.max*fixed});var num_fixed=(num/fixed).toFixed(options.fixed);return parseFloat(num_fixed);};Chance.prototype.integer=function(options){options=initOptions(options,{min:MIN_INT,max:MAX_INT});testRange(options.min>options.max,"Chance: Min cannot be greater than Max.");return Math.floor(this.random()*(options.max-options.min+1)+options.min);};Chance.prototype.natural=function(options){options=initOptions(options,{min:0,max:MAX_INT});testRange(options.min<0,"Chance: Min cannot be less than zero.");return this.integer(options);};Chance.prototype.hex=function(options){options=initOptions(options,{min:0,max:MAX_INT,casing:'lower'});testRange(options.min<0,"Chance: Min cannot be less than zero.");var integer=chance.natural({min:options.min,max:options.max});if(options.casing==='upper'){return integer.toString(16).toUpperCase();}return integer.toString(16);};Chance.prototype.string=function(options){options=initOptions(options,{length:this.natural({min:5,max:20})});testRange(options.length<0,"Chance: Length cannot be less than zero.");var length=options.length,text=this.n(this.character,length,options);return text.join("");};Chance.prototype.capitalize=function(word){return word.charAt(0).toUpperCase()+word.substr(1);};Chance.prototype.mixin=function(obj){for(var func_name in obj){Chance.prototype[func_name]=obj[func_name];}return this;};Chance.prototype.unique=function(fn,num,options){testRange(typeof fn!=="function","Chance: The first argument must be a function.");var comparator=function comparator(arr,val){return arr.indexOf(val)!==-1;};if(options){comparator=options.comparator||comparator;}var arr=[],count=0,result,MAX_DUPLICATES=num*50,params=slice.call(arguments,2);while(arr.length<num){var clonedParams=JSON.parse(JSON.stringify(params));result=fn.apply(this,clonedParams);if(!comparator(arr,result)){arr.push(result);count=0;}if(++count>MAX_DUPLICATES){throw new RangeError("Chance: num is likely too large for sample set");}}return arr;};Chance.prototype.n=function(fn,n){testRange(typeof fn!=="function","Chance: The first argument must be a function.");if(typeof n==='undefined'){n=1;}var i=n,arr=[],params=slice.call(arguments,2);i=Math.max(0,i);for(null;i--;null){arr.push(fn.apply(this,params));}return arr;};Chance.prototype.pad=function(number,width,pad){pad=pad||'0';number=number+'';return number.length>=width?number:new Array(width-number.length+1).join(pad)+number;};Chance.prototype.pick=function(arr,count){if(arr.length===0){throw new RangeError("Chance: Cannot pick() from an empty array");}if(!count||count===1){return arr[this.natural({max:arr.length-1})];}else{return this.shuffle(arr).slice(0,count);}};Chance.prototype.pickone=function(arr){if(arr.length===0){throw new RangeError("Chance: Cannot pickone() from an empty array");}return arr[this.natural({max:arr.length-1})];};Chance.prototype.pickset=function(arr,count){if(count===0){return[];}if(arr.length===0){throw new RangeError("Chance: Cannot pickset() from an empty array");}if(count<0){throw new RangeError("Chance: count must be positive number");}if(!count||count===1){return[this.pickone(arr)];}else{return this.shuffle(arr).slice(0,count);}};Chance.prototype.shuffle=function(arr){var old_array=arr.slice(0),new_array=[],j=0,length=Number(old_array.length);for(var i=0;i<length;i++){j=this.natural({max:old_array.length-1});new_array[i]=old_array[j];old_array.splice(j,1);}return new_array;};Chance.prototype.weighted=function(arr,weights,trim){if(arr.length!==weights.length){throw new RangeError("Chance: length of array and weights must match");}var sum=0;var val;for(var weightIndex=0;weightIndex<weights.length;++weightIndex){val=weights[weightIndex];if(isNaN(val)){throw new RangeError("all weights must be numbers");}if(val>0){sum+=val;}}if(sum===0){throw new RangeError("Chance: no valid entries in array weights");}var selected=this.random()*sum;var total=0;var lastGoodIdx=-1;var chosenIdx;for(weightIndex=0;weightIndex<weights.length;++weightIndex){val=weights[weightIndex];total+=val;if(val>0){if(selected<=total){chosenIdx=weightIndex;break;}lastGoodIdx=weightIndex;}if(weightIndex===weights.length-1){chosenIdx=lastGoodIdx;}}var chosen=arr[chosenIdx];trim=typeof trim==='undefined'?false:trim;if(trim){arr.splice(chosenIdx,1);weights.splice(chosenIdx,1);}return chosen;};Chance.prototype.paragraph=function(options){options=initOptions(options);var sentences=options.sentences||this.natural({min:3,max:7}),sentence_array=this.n(this.sentence,sentences);return sentence_array.join(' ');};Chance.prototype.sentence=function(options){options=initOptions(options);var words=options.words||this.natural({min:12,max:18}),punctuation=options.punctuation,text,word_array=this.n(this.word,words);text=word_array.join(' ');text=this.capitalize(text);if(punctuation!==false&&!/^[\.\?;!:]$/.test(punctuation)){punctuation='.';}if(punctuation){text+=punctuation;}return text;};Chance.prototype.syllable=function(options){options=initOptions(options);var length=options.length||this.natural({min:2,max:3}),consonants='bcdfghjklmnprstvwz',vowels='aeiou',all=consonants+vowels,text='',chr;for(var i=0;i<length;i++){if(i===0){chr=this.character({pool:all});}else if(consonants.indexOf(chr)===-1){chr=this.character({pool:consonants});}else{chr=this.character({pool:vowels});}text+=chr;}if(options.capitalize){text=this.capitalize(text);}return text;};Chance.prototype.word=function(options){options=initOptions(options);testRange(options.syllables&&options.length,"Chance: Cannot specify both syllables AND length.");var syllables=options.syllables||this.natural({min:1,max:3}),text='';if(options.length){do{text+=this.syllable();}while(text.length<options.length);text=text.substring(0,options.length);}else{for(var i=0;i<syllables;i++){text+=this.syllable();}}if(options.capitalize){text=this.capitalize(text);}return text;};Chance.prototype.age=function(options){options=initOptions(options);var ageRange;switch(options.type){case'child':ageRange={min:0,max:12};break;case'teen':ageRange={min:13,max:19};break;case'adult':ageRange={min:18,max:65};break;case'senior':ageRange={min:65,max:100};break;case'all':ageRange={min:0,max:100};break;default:ageRange={min:18,max:65};break;}return this.natural(ageRange);};Chance.prototype.birthday=function(options){var age=this.age(options);var currentYear=new Date().getFullYear();if(options&&options.type){var min=new Date();var max=new Date();min.setFullYear(currentYear-age-1);max.setFullYear(currentYear-age);options=initOptions(options,{min:min,max:max});}else{options=initOptions(options,{year:currentYear-age});}return this.date(options);};Chance.prototype.cpf=function(options){options=initOptions(options,{formatted:true});var n=this.n(this.natural,9,{max:9});var d1=n[8]*2+n[7]*3+n[6]*4+n[5]*5+n[4]*6+n[3]*7+n[2]*8+n[1]*9+n[0]*10;d1=11-d1%11;if(d1>=10){d1=0;}var d2=d1*2+n[8]*3+n[7]*4+n[6]*5+n[5]*6+n[4]*7+n[3]*8+n[2]*9+n[1]*10+n[0]*11;d2=11-d2%11;if(d2>=10){d2=0;}var cpf=''+n[0]+n[1]+n[2]+'.'+n[3]+n[4]+n[5]+'.'+n[6]+n[7]+n[8]+'-'+d1+d2;return options.formatted?cpf:cpf.replace(/\D/g,'');};Chance.prototype.cnpj=function(options){options=initOptions(options,{formatted:true});var n=this.n(this.natural,12,{max:12});var d1=n[11]*2+n[10]*3+n[9]*4+n[8]*5+n[7]*6+n[6]*7+n[5]*8+n[4]*9+n[3]*2+n[2]*3+n[1]*4+n[0]*5;d1=11-d1%11;if(d1<2){d1=0;}var d2=d1*2+n[11]*3+n[10]*4+n[9]*5+n[8]*6+n[7]*7+n[6]*8+n[5]*9+n[4]*2+n[3]*3+n[2]*4+n[1]*5+n[0]*6;d2=11-d2%11;if(d2<2){d2=0;}var cnpj=''+n[0]+n[1]+'.'+n[2]+n[3]+n[4]+'.'+n[5]+n[6]+n[7]+'/'+n[8]+n[9]+n[10]+n[11]+'-'+d1+d2;return options.formatted?cnpj:cnpj.replace(/\D/g,'');};Chance.prototype.first=function(options){options=initOptions(options,{gender:this.gender(),nationality:'en'});return this.pick(this.get("firstNames")[options.gender.toLowerCase()][options.nationality.toLowerCase()]);};Chance.prototype.gender=function(options){options=initOptions(options,{extraGenders:[]});return this.pick(['Male','Female'].concat(options.extraGenders));};Chance.prototype.last=function(options){options=initOptions(options,{nationality:'en'});return this.pick(this.get("lastNames")[options.nationality.toLowerCase()]);};Chance.prototype.israelId=function(){var x=this.string({pool:'0123456789',length:8});var y=0;for(var i=0;i<x.length;i++){var thisDigit=x[i]*(i/2===parseInt(i/2)?1:2);thisDigit=this.pad(thisDigit,2).toString();thisDigit=parseInt(thisDigit[0])+parseInt(thisDigit[1]);y=y+thisDigit;}x=x+(10-parseInt(y.toString().slice(-1))).toString().slice(-1);return x;};Chance.prototype.mrz=function(options){var checkDigit=function checkDigit(input){var alpha="<ABCDEFGHIJKLMNOPQRSTUVWXYXZ".split(''),multipliers=[7,3,1],runningTotal=0;if(typeof input!=='string'){input=input.toString();}input.split('').forEach(function(character,idx){var pos=alpha.indexOf(character);if(pos!==-1){character=pos===0?0:pos+9;}else{character=parseInt(character,10);}character*=multipliers[idx%multipliers.length];runningTotal+=character;});return runningTotal%10;};var generate=function generate(opts){var pad=function pad(length){return new Array(length+1).join('<');};var number=['P<',opts.issuer,opts.last.toUpperCase(),'<<',opts.first.toUpperCase(),pad(39-(opts.last.length+opts.first.length+2)),opts.passportNumber,checkDigit(opts.passportNumber),opts.nationality,opts.dob,checkDigit(opts.dob),opts.gender,opts.expiry,checkDigit(opts.expiry),pad(14),checkDigit(pad(14))].join('');return number+checkDigit(number.substr(44,10)+number.substr(57,7)+number.substr(65,7));};var that=this;options=initOptions(options,{first:this.first(),last:this.last(),passportNumber:this.integer({min:100000000,max:999999999}),dob:function(){var date=that.birthday({type:'adult'});return[date.getFullYear().toString().substr(2),that.pad(date.getMonth()+1,2),that.pad(date.getDate(),2)].join('');}(),expiry:function(){var date=new Date();return[(date.getFullYear()+5).toString().substr(2),that.pad(date.getMonth()+1,2),that.pad(date.getDate(),2)].join('');}(),gender:this.gender()==='Female'?'F':'M',issuer:'GBR',nationality:'GBR'});return generate(options);};Chance.prototype.name=function(options){options=initOptions(options);var first=this.first(options),last=this.last(options),name;if(options.middle){name=first+' '+this.first(options)+' '+last;}else if(options.middle_initial){name=first+' '+this.character({alpha:true,casing:'upper'})+'. '+last;}else{name=first+' '+last;}if(options.prefix){name=this.prefix(options)+' '+name;}if(options.suffix){name=name+' '+this.suffix(options);}return name;};Chance.prototype.name_prefixes=function(gender){gender=gender||"all";gender=gender.toLowerCase();var prefixes=[{name:'Doctor',abbreviation:'Dr.'}];if(gender==="male"||gender==="all"){prefixes.push({name:'Mister',abbreviation:'Mr.'});}if(gender==="female"||gender==="all"){prefixes.push({name:'Miss',abbreviation:'Miss'});prefixes.push({name:'Misses',abbreviation:'Mrs.'});}return prefixes;};Chance.prototype.prefix=function(options){return this.name_prefix(options);};Chance.prototype.name_prefix=function(options){options=initOptions(options,{gender:"all"});return options.full?this.pick(this.name_prefixes(options.gender)).name:this.pick(this.name_prefixes(options.gender)).abbreviation;};Chance.prototype.HIDN=function(){var idn_pool="0123456789";var idn_chrs="ABCDEFGHIJKLMNOPQRSTUVWXYXZ";var idn="";idn+=this.string({pool:idn_pool,length:6});idn+=this.string({pool:idn_chrs,length:2});return idn;};Chance.prototype.ssn=function(options){options=initOptions(options,{ssnFour:false,dashes:true});var ssn_pool="1234567890",ssn,dash=options.dashes?'-':'';if(!options.ssnFour){ssn=this.string({pool:ssn_pool,length:3})+dash+this.string({pool:ssn_pool,length:2})+dash+this.string({pool:ssn_pool,length:4});}else{ssn=this.string({pool:ssn_pool,length:4});}return ssn;};Chance.prototype.name_suffixes=function(){var suffixes=[{name:'Doctor of Osteopathic Medicine',abbreviation:'D.O.'},{name:'Doctor of Philosophy',abbreviation:'Ph.D.'},{name:'Esquire',abbreviation:'Esq.'},{name:'Junior',abbreviation:'Jr.'},{name:'Juris Doctor',abbreviation:'J.D.'},{name:'Master of Arts',abbreviation:'M.A.'},{name:'Master of Business Administration',abbreviation:'M.B.A.'},{name:'Master of Science',abbreviation:'M.S.'},{name:'Medical Doctor',abbreviation:'M.D.'},{name:'Senior',abbreviation:'Sr.'},{name:'The Third',abbreviation:'III'},{name:'The Fourth',abbreviation:'IV'},{name:'Bachelor of Engineering',abbreviation:'B.E'},{name:'Bachelor of Technology',abbreviation:'B.TECH'}];return suffixes;};Chance.prototype.suffix=function(options){return this.name_suffix(options);};Chance.prototype.name_suffix=function(options){options=initOptions(options);return options.full?this.pick(this.name_suffixes()).name:this.pick(this.name_suffixes()).abbreviation;};Chance.prototype.nationalities=function(){return this.get("nationalities");};Chance.prototype.nationality=function(){var nationality=this.pick(this.nationalities());return nationality.name;};Chance.prototype.android_id=function(){return"APA91"+this.string({pool:"0123456789abcefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_",length:178});};Chance.prototype.apple_token=function(){return this.string({pool:"abcdef1234567890",length:64});};Chance.prototype.wp8_anid2=function(){return base64(this.hash({length:32}));};Chance.prototype.wp7_anid=function(){return'A='+this.guid().replace(/-/g,'').toUpperCase()+'&E='+this.hash({length:3})+'&W='+this.integer({min:0,max:9});};Chance.prototype.bb_pin=function(){return this.hash({length:8});};Chance.prototype.avatar=function(options){var url=null;var URL_BASE='//www.gravatar.com/avatar/';var PROTOCOLS={http:'http',https:'https'};var FILE_TYPES={bmp:'bmp',gif:'gif',jpg:'jpg',png:'png'};var FALLBACKS={'404':'404',mm:'mm',identicon:'identicon',monsterid:'monsterid',wavatar:'wavatar',retro:'retro',blank:'blank'};var RATINGS={g:'g',pg:'pg',r:'r',x:'x'};var opts={protocol:null,email:null,fileExtension:null,size:null,fallback:null,rating:null};if(!options){opts.email=this.email();options={};}else if(typeof options==='string'){opts.email=options;options={};}else if((typeof options==='undefined'?'undefined':_typeof(options))!=='object'){return null;}else if(options.constructor==='Array'){return null;}opts=initOptions(options,opts);if(!opts.email){opts.email=this.email();}opts.protocol=PROTOCOLS[opts.protocol]?opts.protocol+':':'';opts.size=parseInt(opts.size,0)?opts.size:'';opts.rating=RATINGS[opts.rating]?opts.rating:'';opts.fallback=FALLBACKS[opts.fallback]?opts.fallback:'';opts.fileExtension=FILE_TYPES[opts.fileExtension]?opts.fileExtension:'';url=opts.protocol+URL_BASE+this.bimd5.md5(opts.email)+(opts.fileExtension?'.'+opts.fileExtension:'')+(opts.size||opts.rating||opts.fallback?'?':'')+(opts.size?'&s='+opts.size.toString():'')+(opts.rating?'&r='+opts.rating:'')+(opts.fallback?'&d='+opts.fallback:'');return url;};Chance.prototype.color=function(options){function pad(n,width,z){z=z||'0';n=n+'';return n.length>=width?n:new Array(width-n.length+1).join(z)+n;}function gray(value,delimiter){return[value,value,value].join(delimiter||'');}function rgb(hasAlpha){var rgbValue=hasAlpha?'rgba':'rgb';var alphaChannel=hasAlpha?','+this.floating({min:min_alpha,max:max_alpha}):"";var colorValue=isGrayscale?gray(this.natural({min:min_rgb,max:max_rgb}),','):this.natural({min:min_green,max:max_green})+','+this.natural({min:min_blue,max:max_blue})+','+this.natural({max:255});return rgbValue+'('+colorValue+alphaChannel+')';}function hex(start,end,withHash){var symbol=withHash?"#":"";var hexstring="";if(isGrayscale){hexstring=gray(pad(this.hex({min:min_rgb,max:max_rgb}),2));if(options.format==="shorthex"){hexstring=gray(this.hex({min:0,max:15}));console.log("hex: "+hexstring);}}else{if(options.format==="shorthex"){hexstring=pad(this.hex({min:Math.floor(min_red/16),max:Math.floor(max_red/16)}),1)+pad(this.hex({min:Math.floor(min_green/16),max:Math.floor(max_green/16)}),1)+pad(this.hex({min:Math.floor(min_blue/16),max:Math.floor(max_blue/16)}),1);}else if(min_red!==undefined||max_red!==undefined||min_green!==undefined||max_green!==undefined||min_blue!==undefined||max_blue!==undefined){hexstring=pad(this.hex({min:min_red,max:max_red}),2)+pad(this.hex({min:min_green,max:max_green}),2)+pad(this.hex({min:min_blue,max:max_blue}),2);}else{hexstring=pad(this.hex({min:min_rgb,max:max_rgb}),2)+pad(this.hex({min:min_rgb,max:max_rgb}),2)+pad(this.hex({min:min_rgb,max:max_rgb}),2);}}return symbol+hexstring;}options=initOptions(options,{format:this.pick(['hex','shorthex','rgb','rgba','0x','name']),grayscale:false,casing:'lower',min:0,max:255,min_red:undefined,max_red:undefined,min_green:undefined,max_green:undefined,min_blue:undefined,max_blue:undefined,min_alpha:0,max_alpha:1});var isGrayscale=options.grayscale;var min_rgb=options.min;var max_rgb=options.max;var min_red=options.min_red;var max_red=options.max_red;var min_green=options.min_green;var max_green=options.max_green;var min_blue=options.min_blue;var max_blue=options.max_blue;var min_alpha=options.min_alpha;var max_alpha=options.max_alpha;if(options.min_red===undefined){min_red=min_rgb;}if(options.max_red===undefined){max_red=max_rgb;}if(options.min_green===undefined){min_green=min_rgb;}if(options.max_green===undefined){max_green=max_rgb;}if(options.min_blue===undefined){min_blue=min_rgb;}if(options.max_blue===undefined){max_blue=max_rgb;}if(options.min_alpha===undefined){min_alpha=0;}if(options.max_alpha===undefined){max_alpha=1;}if(isGrayscale&&min_rgb===0&&max_rgb===255&&min_red!==undefined&&max_red!==undefined){min_rgb=(min_red+min_green+min_blue)/3;max_rgb=(max_red+max_green+max_blue)/3;}var colorValue;if(options.format==='hex'){colorValue=hex.call(this,2,6,true);}else if(options.format==='shorthex'){colorValue=hex.call(this,1,3,true);}else if(options.format==='rgb'){colorValue=rgb.call(this,false);}else if(options.format==='rgba'){colorValue=rgb.call(this,true);}else if(options.format==='0x'){colorValue='0x'+hex.call(this,2,6);}else if(options.format==='name'){return this.pick(this.get("colorNames"));}else{throw new RangeError('Invalid format provided. Please provide one of "hex", "shorthex", "rgb", "rgba", "0x" or "name".');}if(options.casing==='upper'){colorValue=colorValue.toUpperCase();}return colorValue;};Chance.prototype.domain=function(options){options=initOptions(options);return this.word()+'.'+(options.tld||this.tld());};Chance.prototype.email=function(options){options=initOptions(options);return this.word({length:options.length})+'@'+(options.domain||this.domain());};Chance.prototype.fbid=function(){return parseInt('10000'+this.natural({max:100000000000}),10);};Chance.prototype.google_analytics=function(){var account=this.pad(this.natural({max:999999}),6);var property=this.pad(this.natural({max:99}),2);return'UA-'+account+'-'+property;};Chance.prototype.hashtag=function(){return'#'+this.word();};Chance.prototype.ip=function(){return this.natural({min:1,max:254})+'.'+this.natural({max:255})+'.'+this.natural({max:255})+'.'+this.natural({min:1,max:254});};Chance.prototype.ipv6=function(){var ip_addr=this.n(this.hash,8,{length:4});return ip_addr.join(":");};Chance.prototype.klout=function(){return this.natural({min:1,max:99});};Chance.prototype.semver=function(options){options=initOptions(options,{include_prerelease:true});var range=this.pickone(["^","~","<",">","<=",">=","="]);if(options.range){range=options.range;}var prerelease="";if(options.include_prerelease){prerelease=this.weighted(["","-dev","-beta","-alpha"],[50,10,5,1]);}return range+this.rpg('3d10').join('.')+prerelease;};Chance.prototype.tlds=function(){return['com','org','edu','gov','co.uk','net','io','ac','ad','ae','af','ag','ai','al','am','an','ao','aq','ar','as','at','au','aw','ax','az','ba','bb','bd','be','bf','bg','bh','bi','bj','bm','bn','bo','bq','br','bs','bt','bv','bw','by','bz','ca','cc','cd','cf','cg','ch','ci','ck','cl','cm','cn','co','cr','cu','cv','cw','cx','cy','cz','de','dj','dk','dm','do','dz','ec','ee','eg','eh','er','es','et','eu','fi','fj','fk','fm','fo','fr','ga','gb','gd','ge','gf','gg','gh','gi','gl','gm','gn','gp','gq','gr','gs','gt','gu','gw','gy','hk','hm','hn','hr','ht','hu','id','ie','il','im','in','io','iq','ir','is','it','je','jm','jo','jp','ke','kg','kh','ki','km','kn','kp','kr','kw','ky','kz','la','lb','lc','li','lk','lr','ls','lt','lu','lv','ly','ma','mc','md','me','mg','mh','mk','ml','mm','mn','mo','mp','mq','mr','ms','mt','mu','mv','mw','mx','my','mz','na','nc','ne','nf','ng','ni','nl','no','np','nr','nu','nz','om','pa','pe','pf','pg','ph','pk','pl','pm','pn','pr','ps','pt','pw','py','qa','re','ro','rs','ru','rw','sa','sb','sc','sd','se','sg','sh','si','sj','sk','sl','sm','sn','so','sr','ss','st','su','sv','sx','sy','sz','tc','td','tf','tg','th','tj','tk','tl','tm','tn','to','tp','tr','tt','tv','tw','tz','ua','ug','uk','us','uy','uz','va','vc','ve','vg','vi','vn','vu','wf','ws','ye','yt','za','zm','zw'];};Chance.prototype.tld=function(){return this.pick(this.tlds());};Chance.prototype.twitter=function(){return'@'+this.word();};Chance.prototype.url=function(options){options=initOptions(options,{protocol:"http",domain:this.domain(options),domain_prefix:"",path:this.word(),extensions:[]});var extension=options.extensions.length>0?"."+this.pick(options.extensions):"";var domain=options.domain_prefix?options.domain_prefix+"."+options.domain:options.domain;return options.protocol+"://"+domain+"/"+options.path+extension;};Chance.prototype.port=function(){return this.integer({min:0,max:65535});};Chance.prototype.address=function(options){options=initOptions(options);return this.natural({min:5,max:2000})+' '+this.street(options);};Chance.prototype.altitude=function(options){options=initOptions(options,{fixed:5,min:0,max:8848});return this.floating({min:options.min,max:options.max,fixed:options.fixed});};Chance.prototype.areacode=function(options){options=initOptions(options,{parens:true});var areacode=this.natural({min:2,max:9}).toString()+this.natural({min:0,max:8}).toString()+this.natural({min:0,max:9}).toString();return options.parens?'('+areacode+')':areacode;};Chance.prototype.city=function(){return this.capitalize(this.word({syllables:3}));};Chance.prototype.coordinates=function(options){return this.latitude(options)+', '+this.longitude(options);};Chance.prototype.countries=function(){return this.get("countries");};Chance.prototype.country=function(options){options=initOptions(options);var country=this.pick(this.countries());return options.full?country.name:country.abbreviation;};Chance.prototype.depth=function(options){options=initOptions(options,{fixed:5,min:-10994,max:0});return this.floating({min:options.min,max:options.max,fixed:options.fixed});};Chance.prototype.geohash=function(options){options=initOptions(options,{length:7});return this.string({length:options.length,pool:'0123456789bcdefghjkmnpqrstuvwxyz'});};Chance.prototype.geojson=function(options){return this.latitude(options)+', '+this.longitude(options)+', '+this.altitude(options);};Chance.prototype.latitude=function(options){options=initOptions(options,{fixed:5,min:-90,max:90});return this.floating({min:options.min,max:options.max,fixed:options.fixed});};Chance.prototype.longitude=function(options){options=initOptions(options,{fixed:5,min:-180,max:180});return this.floating({min:options.min,max:options.max,fixed:options.fixed});};Chance.prototype.phone=function(options){var self=this,numPick,ukNum=function ukNum(parts){var section=[];parts.sections.forEach(function(n){section.push(self.string({pool:'0123456789',length:n}));});return parts.area+section.join(' ');};options=initOptions(options,{formatted:true,country:'us',mobile:false});if(!options.formatted){options.parens=false;}var phone;switch(options.country){case'fr':if(!options.mobile){numPick=this.pick(['01'+this.pick(['30','34','39','40','41','42','43','44','45','46','47','48','49','53','55','56','58','60','64','69','70','72','73','74','75','76','77','78','79','80','81','82','83'])+self.string({pool:'0123456789',length:6}),'02'+this.pick(['14','18','22','23','28','29','30','31','32','33','34','35','36','37','38','40','41','43','44','45','46','47','48','49','50','51','52','53','54','56','57','61','62','69','72','76','77','78','85','90','96','97','98','99'])+self.string({pool:'0123456789',length:6}),'03'+this.pick(['10','20','21','22','23','24','25','26','27','28','29','39','44','45','51','52','54','55','57','58','59','60','61','62','63','64','65','66','67','68','69','70','71','72','73','80','81','82','83','84','85','86','87','88','89','90'])+self.string({pool:'0123456789',length:6}),'04'+this.pick(['11','13','15','20','22','26','27','30','32','34','37','42','43','44','50','56','57','63','66','67','68','69','70','71','72','73','74','75','76','77','78','79','80','81','82','83','84','85','86','88','89','90','91','92','93','94','95','97','98'])+self.string({pool:'0123456789',length:6}),'05'+this.pick(['08','16','17','19','24','31','32','33','34','35','40','45','46','47','49','53','55','56','57','58','59','61','62','63','64','65','67','79','81','82','86','87','90','94'])+self.string({pool:'0123456789',length:6}),'09'+self.string({pool:'0123456789',length:8})]);phone=options.formatted?numPick.match(/../g).join(' '):numPick;}else{numPick=this.pick(['06','07'])+self.string({pool:'0123456789',length:8});phone=options.formatted?numPick.match(/../g).join(' '):numPick;}break;case'uk':if(!options.mobile){numPick=this.pick([{area:'01'+this.character({pool:'234569'})+'1 ',sections:[3,4]},{area:'020 '+this.character({pool:'378'}),sections:[3,4]},{area:'023 '+this.character({pool:'89'}),sections:[3,4]},{area:'024 7',sections:[3,4]},{area:'028 '+this.pick(['25','28','37','71','82','90','92','95']),sections:[2,4]},{area:'012'+this.pick(['04','08','54','76','97','98'])+' ',sections:[6]},{area:'013'+this.pick(['63','64','84','86'])+' ',sections:[6]},{area:'014'+this.pick(['04','20','60','61','80','88'])+' ',sections:[6]},{area:'015'+this.pick(['24','27','62','66'])+' ',sections:[6]},{area:'016'+this.pick(['06','29','35','47','59','95'])+' ',sections:[6]},{area:'017'+this.pick(['26','44','50','68'])+' ',sections:[6]},{area:'018'+this.pick(['27','37','84','97'])+' ',sections:[6]},{area:'019'+this.pick(['00','05','35','46','49','63','95'])+' ',sections:[6]}]);phone=options.formatted?ukNum(numPick):ukNum(numPick).replace(' ','','g');}else{numPick=this.pick([{area:'07'+this.pick(['4','5','7','8','9']),sections:[2,6]},{area:'07624 ',sections:[6]}]);phone=options.formatted?ukNum(numPick):ukNum(numPick).replace(' ','');}break;case'za':if(!options.mobile){numPick=this.pick(['01'+this.pick(['0','1','2','3','4','5','6','7','8'])+self.string({pool:'0123456789',length:7}),'02'+this.pick(['1','2','3','4','7','8'])+self.string({pool:'0123456789',length:7}),'03'+this.pick(['1','2','3','5','6','9'])+self.string({pool:'0123456789',length:7}),'04'+this.pick(['1','2','3','4','5','6','7','8','9'])+self.string({pool:'0123456789',length:7}),'05'+this.pick(['1','3','4','6','7','8'])+self.string({pool:'0123456789',length:7})]);phone=options.formatted||numPick;}else{numPick=this.pick(['060'+this.pick(['3','4','5','6','7','8','9'])+self.string({pool:'0123456789',length:6}),'061'+this.pick(['0','1','2','3','4','5','8'])+self.string({pool:'0123456789',length:6}),'06'+self.string({pool:'0123456789',length:7}),'071'+this.pick(['0','1','2','3','4','5','6','7','8','9'])+self.string({pool:'0123456789',length:6}),'07'+this.pick(['2','3','4','6','7','8','9'])+self.string({pool:'0123456789',length:7}),'08'+this.pick(['0','1','2','3','4','5'])+self.string({pool:'0123456789',length:7})]);phone=options.formatted||numPick;}break;case'us':var areacode=this.areacode(options).toString();var exchange=this.natural({min:2,max:9}).toString()+this.natural({min:0,max:9}).toString()+this.natural({min:0,max:9}).toString();var subscriber=this.natural({min:1000,max:9999}).toString();phone=options.formatted?areacode+' '+exchange+'-'+subscriber:areacode+exchange+subscriber;}return phone;};Chance.prototype.postal=function(){var pd=this.character({pool:"XVTSRPNKLMHJGECBA"});var fsa=pd+this.natural({max:9})+this.character({alpha:true,casing:"upper"});var ldu=this.natural({max:9})+this.character({alpha:true,casing:"upper"})+this.natural({max:9});return fsa+" "+ldu;};Chance.prototype.counties=function(options){options=initOptions(options,{country:'uk'});return this.get("counties")[options.country.toLowerCase()];};Chance.prototype.county=function(options){return this.pick(this.counties(options)).name;};Chance.prototype.provinces=function(options){options=initOptions(options,{country:'ca'});return this.get("provinces")[options.country.toLowerCase()];};Chance.prototype.province=function(options){return options&&options.full?this.pick(this.provinces(options)).name:this.pick(this.provinces(options)).abbreviation;};Chance.prototype.state=function(options){return options&&options.full?this.pick(this.states(options)).name:this.pick(this.states(options)).abbreviation;};Chance.prototype.states=function(options){options=initOptions(options,{country:'us',us_states_and_dc:true});var states;switch(options.country.toLowerCase()){case'us':var us_states_and_dc=this.get("us_states_and_dc"),territories=this.get("territories"),armed_forces=this.get("armed_forces");states=[];if(options.us_states_and_dc){states=states.concat(us_states_and_dc);}if(options.territories){states=states.concat(territories);}if(options.armed_forces){states=states.concat(armed_forces);}break;case'it':states=this.get("country_regions")[options.country.toLowerCase()];break;case'uk':states=this.get("counties")[options.country.toLowerCase()];break;}return states;};Chance.prototype.street=function(options){options=initOptions(options,{country:'us',syllables:2});var street;switch(options.country.toLowerCase()){case'us':street=this.word({syllables:options.syllables});street=this.capitalize(street);street+=' ';street+=options.short_suffix?this.street_suffix(options).abbreviation:this.street_suffix(options).name;break;case'it':street=this.word({syllables:options.syllables});street=this.capitalize(street);street=(options.short_suffix?this.street_suffix(options).abbreviation:this.street_suffix(options).name)+" "+street;break;}return street;};Chance.prototype.street_suffix=function(options){options=initOptions(options,{country:'us'});return this.pick(this.street_suffixes(options));};Chance.prototype.street_suffixes=function(options){options=initOptions(options,{country:'us'});return this.get("street_suffixes")[options.country.toLowerCase()];};Chance.prototype.zip=function(options){var zip=this.n(this.natural,5,{max:9});if(options&&options.plusfour===true){zip.push('-');zip=zip.concat(this.n(this.natural,4,{max:9}));}return zip.join("");};Chance.prototype.ampm=function(){return this.bool()?'am':'pm';};Chance.prototype.date=function(options){var date_string,date;if(options&&(options.min||options.max)){options=initOptions(options,{american:true,string:false});var min=typeof options.min!=="undefined"?options.min.getTime():1;var max=typeof options.max!=="undefined"?options.max.getTime():8640000000000000;date=new Date(this.integer({min:min,max:max}));}else{var m=this.month({raw:true});var daysInMonth=m.days;if(options&&options.month){daysInMonth=this.get('months')[(options.month%12+12)%12].days;}options=initOptions(options,{year:parseInt(this.year(),10),month:m.numeric-1,day:this.natural({min:1,max:daysInMonth}),hour:this.hour({twentyfour:true}),minute:this.minute(),second:this.second(),millisecond:this.millisecond(),american:true,string:false});date=new Date(options.year,options.month,options.day,options.hour,options.minute,options.second,options.millisecond);}if(options.american){date_string=date.getMonth()+1+'/'+date.getDate()+'/'+date.getFullYear();}else{date_string=date.getDate()+'/'+(date.getMonth()+1)+'/'+date.getFullYear();}return options.string?date_string:date;};Chance.prototype.hammertime=function(options){return this.date(options).getTime();};Chance.prototype.hour=function(options){options=initOptions(options,{min:options&&options.twentyfour?0:1,max:options&&options.twentyfour?23:12});testRange(options.min<0,"Chance: Min cannot be less than 0.");testRange(options.twentyfour&&options.max>23,"Chance: Max cannot be greater than 23 for twentyfour option.");testRange(!options.twentyfour&&options.max>12,"Chance: Max cannot be greater than 12.");testRange(options.min>options.max,"Chance: Min cannot be greater than Max.");return this.natural({min:options.min,max:options.max});};Chance.prototype.millisecond=function(){return this.natural({max:999});};Chance.prototype.minute=Chance.prototype.second=function(options){options=initOptions(options,{min:0,max:59});testRange(options.min<0,"Chance: Min cannot be less than 0.");testRange(options.max>59,"Chance: Max cannot be greater than 59.");testRange(options.min>options.max,"Chance: Min cannot be greater than Max.");return this.natural({min:options.min,max:options.max});};Chance.prototype.month=function(options){options=initOptions(options,{min:1,max:12});testRange(options.min<1,"Chance: Min cannot be less than 1.");testRange(options.max>12,"Chance: Max cannot be greater than 12.");testRange(options.min>options.max,"Chance: Min cannot be greater than Max.");var month=this.pick(this.months().slice(options.min-1,options.max));return options.raw?month:month.name;};Chance.prototype.months=function(){return this.get("months");};Chance.prototype.second=function(){return this.natural({max:59});};Chance.prototype.timestamp=function(){return this.natural({min:1,max:parseInt(new Date().getTime()/1000,10)});};Chance.prototype.weekday=function(options){options=initOptions(options,{weekday_only:false});var weekdays=["Monday","Tuesday","Wednesday","Thursday","Friday"];if(!options.weekday_only){weekdays.push("Saturday");weekdays.push("Sunday");}return this.pickone(weekdays);};Chance.prototype.year=function(options){options=initOptions(options,{min:new Date().getFullYear()});options.max=typeof options.max!=="undefined"?options.max:options.min+100;return this.natural(options).toString();};Chance.prototype.cc=function(options){options=initOptions(options);var type,number,to_generate;type=options.type?this.cc_type({name:options.type,raw:true}):this.cc_type({raw:true});number=type.prefix.split("");to_generate=type.length-type.prefix.length-1;number=number.concat(this.n(this.integer,to_generate,{min:0,max:9}));number.push(this.luhn_calculate(number.join("")));return number.join("");};Chance.prototype.cc_types=function(){return this.get("cc_types");};Chance.prototype.cc_type=function(options){options=initOptions(options);var types=this.cc_types(),type=null;if(options.name){for(var i=0;i<types.length;i++){if(types[i].name===options.name||types[i].short_name===options.name){type=types[i];break;}}if(type===null){throw new RangeError("Credit card type '"+options.name+"'' is not supported");}}else{type=this.pick(types);}return options.raw?type:type.name;};Chance.prototype.currency_types=function(){return this.get("currency_types");};Chance.prototype.currency=function(){return this.pick(this.currency_types());};Chance.prototype.timezones=function(){return this.get("timezones");};Chance.prototype.timezone=function(){return this.pick(this.timezones());};Chance.prototype.currency_pair=function(returnAsString){var currencies=this.unique(this.currency,2,{comparator:function comparator(arr,val){return arr.reduce(function(acc,item){return acc||item.code===val.code;},false);}});if(returnAsString){return currencies[0].code+'/'+currencies[1].code;}else{return currencies;}};Chance.prototype.dollar=function(options){options=initOptions(options,{max:10000,min:0});var dollar=this.floating({min:options.min,max:options.max,fixed:2}).toString(),cents=dollar.split('.')[1];if(cents===undefined){dollar+='.00';}else if(cents.length<2){dollar=dollar+'0';}if(dollar<0){return'-$'+dollar.replace('-','');}else{return'$'+dollar;}};Chance.prototype.euro=function(options){return Number(this.dollar(options).replace("$","")).toLocaleString()+"€";};Chance.prototype.exp=function(options){options=initOptions(options);var exp={};exp.year=this.exp_year();if(exp.year===new Date().getFullYear().toString()){exp.month=this.exp_month({future:true});}else{exp.month=this.exp_month();}return options.raw?exp:exp.month+'/'+exp.year;};Chance.prototype.exp_month=function(options){options=initOptions(options);var month,month_int,curMonth=new Date().getMonth()+1;if(options.future&&curMonth!==12){do{month=this.month({raw:true}).numeric;month_int=parseInt(month,10);}while(month_int<=curMonth);}else{month=this.month({raw:true}).numeric;}return month;};Chance.prototype.exp_year=function(){var curMonth=new Date().getMonth()+1,curYear=new Date().getFullYear();return this.year({min:curMonth===12?curYear+1:curYear,max:curYear+10});};Chance.prototype.vat=function(options){options=initOptions(options,{country:'it'});switch(options.country.toLowerCase()){case'it':return this.it_vat();}};Chance.prototype.iban=function(){var alpha='ABCDEFGHIJKLMNOPQRSTUVWXYZ';var alphanum=alpha+'0123456789';var iban=this.string({length:2,pool:alpha})+this.pad(this.integer({min:0,max:99}),2)+this.string({length:4,pool:alphanum})+this.pad(this.natural(),this.natural({min:6,max:26}));return iban;};Chance.prototype.it_vat=function(){var it_vat=this.natural({min:1,max:1800000});it_vat=this.pad(it_vat,7)+this.pad(this.pick(this.provinces({country:'it'})).code,3);return it_vat+this.luhn_calculate(it_vat);};Chance.prototype.cf=function(options){options=options||{};var gender=!!options.gender?options.gender:this.gender(),first=!!options.first?options.first:this.first({gender:gender,nationality:'it'}),last=!!options.last?options.last:this.last({nationality:'it'}),birthday=!!options.birthday?options.birthday:this.birthday(),city=!!options.city?options.city:this.pickone(['A','B','C','D','E','F','G','H','I','L','M','Z'])+this.pad(this.natural({max:999}),3),cf=[],name_generator=function name_generator(name,isLast){var temp,return_value=[];if(name.length<3){return_value=name.split("").concat("XXX".split("")).splice(0,3);}else{temp=name.toUpperCase().split('').map(function(c){return"BCDFGHJKLMNPRSTVWZ".indexOf(c)!==-1?c:undefined;}).join('');if(temp.length>3){if(isLast){temp=temp.substr(0,3);}else{temp=temp[0]+temp.substr(2,2);}}if(temp.length<3){return_value=temp;temp=name.toUpperCase().split('').map(function(c){return"AEIOU".indexOf(c)!==-1?c:undefined;}).join('').substr(0,3-return_value.length);}return_value=return_value+temp;}return return_value;},date_generator=function date_generator(birthday,gender,that){var lettermonths=['A','B','C','D','E','H','L','M','P','R','S','T'];return birthday.getFullYear().toString().substr(2)+lettermonths[birthday.getMonth()]+that.pad(birthday.getDate()+(gender.toLowerCase()==="female"?40:0),2);},checkdigit_generator=function checkdigit_generator(cf){var range1="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",range2="ABCDEFGHIJABCDEFGHIJKLMNOPQRSTUVWXYZ",evens="ABCDEFGHIJKLMNOPQRSTUVWXYZ",odds="BAKPLCQDREVOSFTGUHMINJWZYX",digit=0;for(var i=0;i<15;i++){if(i%2!==0){digit+=evens.indexOf(range2[range1.indexOf(cf[i])]);}else{digit+=odds.indexOf(range2[range1.indexOf(cf[i])]);}}return evens[digit%26];};cf=cf.concat(name_generator(last,true),name_generator(first),date_generator(birthday,gender,this),city.toUpperCase().split("")).join("");cf+=checkdigit_generator(cf.toUpperCase(),this);return cf.toUpperCase();};Chance.prototype.pl_pesel=function(){var number=this.natural({min:1,max:9999999999});var arr=this.pad(number,10).split('');for(var i=0;i<arr.length;i++){arr[i]=parseInt(arr[i]);}var controlNumber=(1*arr[0]+3*arr[1]+7*arr[2]+9*arr[3]+1*arr[4]+3*arr[5]+7*arr[6]+9*arr[7]+1*arr[8]+3*arr[9])%10;if(controlNumber!==0){controlNumber=10-controlNumber;}return arr.join('')+controlNumber;};Chance.prototype.pl_nip=function(){var number=this.natural({min:1,max:999999999});var arr=this.pad(number,9).split('');for(var i=0;i<arr.length;i++){arr[i]=parseInt(arr[i]);}var controlNumber=(6*arr[0]+5*arr[1]+7*arr[2]+2*arr[3]+3*arr[4]+4*arr[5]+5*arr[6]+6*arr[7]+7*arr[8])%11;if(controlNumber===10){return this.pl_nip();}return arr.join('')+controlNumber;};Chance.prototype.pl_regon=function(){var number=this.natural({min:1,max:99999999});var arr=this.pad(number,8).split('');for(var i=0;i<arr.length;i++){arr[i]=parseInt(arr[i]);}var controlNumber=(8*arr[0]+9*arr[1]+2*arr[2]+3*arr[3]+4*arr[4]+5*arr[5]+6*arr[6]+7*arr[7])%11;if(controlNumber===10){controlNumber=0;}return arr.join('')+controlNumber;};function diceFn(range){return function(){return this.natural(range);};}Chance.prototype.d4=diceFn({min:1,max:4});Chance.prototype.d6=diceFn({min:1,max:6});Chance.prototype.d8=diceFn({min:1,max:8});Chance.prototype.d10=diceFn({min:1,max:10});Chance.prototype.d12=diceFn({min:1,max:12});Chance.prototype.d20=diceFn({min:1,max:20});Chance.prototype.d30=diceFn({min:1,max:30});Chance.prototype.d100=diceFn({min:1,max:100});Chance.prototype.rpg=function(thrown,options){options=initOptions(options);if(!thrown){throw new RangeError("A type of die roll must be included");}else{var bits=thrown.toLowerCase().split("d"),rolls=[];if(bits.length!==2||!parseInt(bits[0],10)||!parseInt(bits[1],10)){throw new Error("Invalid format provided. Please provide #d# where the first # is the number of dice to roll, the second # is the max of each die");}for(var i=bits[0];i>0;i--){rolls[i-1]=this.natural({min:1,max:bits[1]});}return typeof options.sum!=='undefined'&&options.sum?rolls.reduce(function(p,c){return p+c;}):rolls;}};Chance.prototype.guid=function(options){options=initOptions(options,{version:5});var guid_pool="abcdef1234567890",variant_pool="ab89",guid=this.string({pool:guid_pool,length:8})+'-'+this.string({pool:guid_pool,length:4})+'-'+options.version+this.string({pool:guid_pool,length:3})+'-'+this.string({pool:variant_pool,length:1})+this.string({pool:guid_pool,length:3})+'-'+this.string({pool:guid_pool,length:12});return guid;};Chance.prototype.hash=function(options){options=initOptions(options,{length:40,casing:'lower'});var pool=options.casing==='upper'?HEX_POOL.toUpperCase():HEX_POOL;return this.string({pool:pool,length:options.length});};Chance.prototype.luhn_check=function(num){var str=num.toString();var checkDigit=+str.substring(str.length-1);return checkDigit===this.luhn_calculate(+str.substring(0,str.length-1));};Chance.prototype.luhn_calculate=function(num){var digits=num.toString().split("").reverse();var sum=0;var digit;for(var i=0,l=digits.length;l>i;++i){digit=+digits[i];if(i%2===0){digit*=2;if(digit>9){digit-=9;}}sum+=digit;}return sum*9%10;};Chance.prototype.md5=function(options){var opts={str:'',key:null,raw:false};if(!options){opts.str=this.string();options={};}else if(typeof options==='string'){opts.str=options;options={};}else if((typeof options==='undefined'?'undefined':_typeof(options))!=='object'){return null;}else if(options.constructor==='Array'){return null;}opts=initOptions(options,opts);if(!opts.str){throw new Error('A parameter is required to return an md5 hash.');}return this.bimd5.md5(opts.str,opts.key,opts.raw);};Chance.prototype.file=function(options){var fileOptions=options||{};var poolCollectionKey="fileExtension";var typeRange=Object.keys(this.get("fileExtension"));var fileName;var fileExtention;fileName=this.word({length:fileOptions.length});if(fileOptions.extention){fileExtention=fileOptions.extention;return fileName+'.'+fileExtention;}if(fileOptions.extentions){if(Array.isArray(fileOptions.extentions)){fileExtention=this.pickone(fileOptions.extentions);return fileName+'.'+fileExtention;}else if(fileOptions.extentions.constructor===Object){var extentionObjectCollection=fileOptions.extentions;var keys=Object.keys(extentionObjectCollection);fileExtention=this.pickone(extentionObjectCollection[this.pickone(keys)]);return fileName+'.'+fileExtention;}throw new Error("Expect collection of type Array or Object to be passed as an argument ");}if(fileOptions.fileType){var fileType=fileOptions.fileType;if(typeRange.indexOf(fileType)!==-1){fileExtention=this.pickone(this.get(poolCollectionKey)[fileType]);return fileName+'.'+fileExtention;}throw new Error("Expect file type value to be 'raster', 'vector', '3d' or 'document' ");}fileExtention=this.pickone(this.get(poolCollectionKey)[this.pickone(typeRange)]);return fileName+'.'+fileExtention;};var data={firstNames:{"male":{"en":["James","John","Robert","Michael","William","David","Richard","Joseph","Charles","Thomas","Christopher","Daniel","Matthew","George","Donald","Anthony","Paul","Mark","Edward","Steven","Kenneth","Andrew","Brian","Joshua","Kevin","Ronald","Timothy","Jason","Jeffrey","Frank","Gary","Ryan","Nicholas","Eric","Stephen","Jacob","Larry","Jonathan","Scott","Raymond","Justin","Brandon","Gregory","Samuel","Benjamin","Patrick","Jack","Henry","Walter","Dennis","Jerry","Alexander","Peter","Tyler","Douglas","Harold","Aaron","Jose","Adam","Arthur","Zachary","Carl","Nathan","Albert","Kyle","Lawrence","Joe","Willie","Gerald","Roger","Keith","Jeremy","Terry","Harry","Ralph","Sean","Jesse","Roy","Louis","Billy","Austin","Bruce","Eugene","Christian","Bryan","Wayne","Russell","Howard","Fred","Ethan","Jordan","Philip","Alan","Juan","Randy","Vincent","Bobby","Dylan","Johnny","Phillip","Victor","Clarence","Ernest","Martin","Craig","Stanley","Shawn","Travis","Bradley","Leonard","Earl","Gabriel","Jimmy","Francis","Todd","Noah","Danny","Dale","Cody","Carlos","Allen","Frederick","Logan","Curtis","Alex","Joel","Luis","Norman","Marvin","Glenn","Tony","Nathaniel","Rodney","Melvin","Alfred","Steve","Cameron","Chad","Edwin","Caleb","Evan","Antonio","Lee","Herbert","Jeffery","Isaac","Derek","Ricky","Marcus","Theodore","Elijah","Luke","Jesus","Eddie","Troy","Mike","Dustin","Ray","Adrian","Bernard","Leroy","Angel","Randall","Wesley","Ian","Jared","Mason","Hunter","Calvin","Oscar","Clifford","Jay","Shane","Ronnie","Barry","Lucas","Corey","Manuel","Leo","Tommy","Warren","Jackson","Isaiah","Connor","Don","Dean","Jon","Julian","Miguel","Bill","Lloyd","Charlie","Mitchell","Leon","Jerome","Darrell","Jeremiah","Alvin","Brett","Seth","Floyd","Jim","Blake","Micheal","Gordon","Trevor","Lewis","Erik","Edgar","Vernon","Devin","Gavin","Jayden","Chris","Clyde","Tom","Derrick","Mario","Brent","Marc","Herman","Chase","Dominic","Ricardo","Franklin","Maurice","Max","Aiden","Owen","Lester","Gilbert","Elmer","Gene","Francisco","Glen","Cory","Garrett","Clayton","Sam","Jorge","Chester","Alejandro","Jeff","Harvey","Milton","Cole","Ivan","Andre","Duane","Landon"],"it":["Adolfo","Alberto","Aldo","Alessandro","Alessio","Alfredo","Alvaro","Andrea","Angelo","Angiolo","Antonino","Antonio","Attilio","Benito","Bernardo","Bruno","Carlo","Cesare","Christian","Claudio","Corrado","Cosimo","Cristian","Cristiano","Daniele","Dario","David","Davide","Diego","Dino","Domenico","Duccio","Edoardo","Elia","Elio","Emanuele","Emiliano","Emilio","Enrico","Enzo","Ettore","Fabio","Fabrizio","Federico","Ferdinando","Fernando","Filippo","Francesco","Franco","Gabriele","Giacomo","Giampaolo","Giampiero","Giancarlo","Gianfranco","Gianluca","Gianmarco","Gianni","Gino","Giorgio","Giovanni","Giuliano","Giulio","Giuseppe","Graziano","Gregorio","Guido","Iacopo","Jacopo","Lapo","Leonardo","Lorenzo","Luca","Luciano","Luigi","Manuel","Marcello","Marco","Marino","Mario","Massimiliano","Massimo","Matteo","Mattia","Maurizio","Mauro","Michele","Mirko","Mohamed","Nello","Neri","Niccolò","Nicola","Osvaldo","Otello","Paolo","Pier Luigi","Piero","Pietro","Raffaele","Remo","Renato","Renzo","Riccardo","Roberto","Rolando","Romano","Salvatore","Samuele","Sandro","Sergio","Silvano","Simone","Stefano","Thomas","Tommaso","Ubaldo","Ugo","Umberto","Valerio","Valter","Vasco","Vincenzo","Vittorio"]},"female":{"en":["Mary","Emma","Elizabeth","Minnie","Margaret","Ida","Alice","Bertha","Sarah","Annie","Clara","Ella","Florence","Cora","Martha","Laura","Nellie","Grace","Carrie","Maude","Mabel","Bessie","Jennie","Gertrude","Julia","Hattie","Edith","Mattie","Rose","Catherine","Lillian","Ada","Lillie","Helen","Jessie","Louise","Ethel","Lula","Myrtle","Eva","Frances","Lena","Lucy","Edna","Maggie","Pearl","Daisy","Fannie","Josephine","Dora","Rosa","Katherine","Agnes","Marie","Nora","May","Mamie","Blanche","Stella","Ellen","Nancy","Effie","Sallie","Nettie","Della","Lizzie","Flora","Susie","Maud","Mae","Etta","Harriet","Sadie","Caroline","Katie","Lydia","Elsie","Kate","Susan","Mollie","Alma","Addie","Georgia","Eliza","Lulu","Nannie","Lottie","Amanda","Belle","Charlotte","Rebecca","Ruth","Viola","Olive","Amelia","Hannah","Jane","Virginia","Emily","Matilda","Irene","Kathryn","Esther","Willie","Henrietta","Ollie","Amy","Rachel","Sara","Estella","Theresa","Augusta","Ora","Pauline","Josie","Lola","Sophia","Leona","Anne","Mildred","Ann","Beulah","Callie","Lou","Delia","Eleanor","Barbara","Iva","Louisa","Maria","Mayme","Evelyn","Estelle","Nina","Betty","Marion","Bettie","Dorothy","Luella","Inez","Lela","Rosie","Allie","Millie","Janie","Cornelia","Victoria","Ruby","Winifred","Alta","Celia","Christine","Beatrice","Birdie","Harriett","Mable","Myra","Sophie","Tillie","Isabel","Sylvia","Carolyn","Isabelle","Leila","Sally","Ina","Essie","Bertie","Nell","Alberta","Katharine","Lora","Rena","Mina","Rhoda","Mathilda","Abbie","Eula","Dollie","Hettie","Eunice","Fanny","Ola","Lenora","Adelaide","Christina","Lelia","Nelle","Sue","Johanna","Lilly","Lucinda","Minerva","Lettie","Roxie","Cynthia","Helena","Hilda","Hulda","Bernice","Genevieve","Jean","Cordelia","Marian","Francis","Jeanette","Adeline","Gussie","Leah","Lois","Lura","Mittie","Hallie","Isabella","Olga","Phoebe","Teresa","Hester","Lida","Lina","Winnie","Claudia","Marguerite","Vera","Cecelia","Bess","Emilie","Rosetta","Verna","Myrtie","Cecilia","Elva","Olivia","Ophelia","Georgie","Elnora","Violet","Adele","Lily","Linnie","Loretta","Madge","Polly","Virgie","Eugenia","Lucile","Lucille","Mabelle","Rosalie"],"it":["Ada","Adriana","Alessandra","Alessia","Alice","Angela","Anna","Anna Maria","Annalisa","Annita","Annunziata","Antonella","Arianna","Asia","Assunta","Aurora","Barbara","Beatrice","Benedetta","Bianca","Bruna","Camilla","Carla","Carlotta","Carmela","Carolina","Caterina","Catia","Cecilia","Chiara","Cinzia","Clara","Claudia","Costanza","Cristina","Daniela","Debora","Diletta","Dina","Donatella","Elena","Eleonora","Elisa","Elisabetta","Emanuela","Emma","Eva","Federica","Fernanda","Fiorella","Fiorenza","Flora","Franca","Francesca","Gabriella","Gaia","Gemma","Giada","Gianna","Gina","Ginevra","Giorgia","Giovanna","Giulia","Giuliana","Giuseppa","Giuseppina","Grazia","Graziella","Greta","Ida","Ilaria","Ines","Iolanda","Irene","Irma","Isabella","Jessica","Laura","Leda","Letizia","Licia","Lidia","Liliana","Lina","Linda","Lisa","Livia","Loretta","Luana","Lucia","Luciana","Lucrezia","Luisa","Manuela","Mara","Marcella","Margherita","Maria","Maria Cristina","Maria Grazia","Maria Luisa","Maria Pia","Maria Teresa","Marina","Marisa","Marta","Martina","Marzia","Matilde","Melissa","Michela","Milena","Mirella","Monica","Natalina","Nella","Nicoletta","Noemi","Olga","Paola","Patrizia","Piera","Pierina","Raffaella","Rebecca","Renata","Rina","Rita","Roberta","Rosa","Rosanna","Rossana","Rossella","Sabrina","Sandra","Sara","Serena","Silvana","Silvia","Simona","Simonetta","Sofia","Sonia","Stefania","Susanna","Teresa","Tina","Tiziana","Tosca","Valentina","Valeria","Vanda","Vanessa","Vanna","Vera","Veronica","Vilma","Viola","Virginia","Vittoria"]}},lastNames:{"en":['Smith','Johnson','Williams','Jones','Brown','Davis','Miller','Wilson','Moore','Taylor','Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Garcia','Martinez','Robinson','Clark','Rodriguez','Lewis','Lee','Walker','Hall','Allen','Young','Hernandez','King','Wright','Lopez','Hill','Scott','Green','Adams','Baker','Gonzalez','Nelson','Carter','Mitchell','Perez','Roberts','Turner','Phillips','Campbell','Parker','Evans','Edwards','Collins','Stewart','Sanchez','Morris','Rogers','Reed','Cook','Morgan','Bell','Murphy','Bailey','Rivera','Cooper','Richardson','Cox','Howard','Ward','Torres','Peterson','Gray','Ramirez','James','Watson','Brooks','Kelly','Sanders','Price','Bennett','Wood','Barnes','Ross','Henderson','Coleman','Jenkins','Perry','Powell','Long','Patterson','Hughes','Flores','Washington','Butler','Simmons','Foster','Gonzales','Bryant','Alexander','Russell','Griffin','Diaz','Hayes','Myers','Ford','Hamilton','Graham','Sullivan','Wallace','Woods','Cole','West','Jordan','Owens','Reynolds','Fisher','Ellis','Harrison','Gibson','McDonald','Cruz','Marshall','Ortiz','Gomez','Murray','Freeman','Wells','Webb','Simpson','Stevens','Tucker','Porter','Hunter','Hicks','Crawford','Henry','Boyd','Mason','Morales','Kennedy','Warren','Dixon','Ramos','Reyes','Burns','Gordon','Shaw','Holmes','Rice','Robertson','Hunt','Black','Daniels','Palmer','Mills','Nichols','Grant','Knight','Ferguson','Rose','Stone','Hawkins','Dunn','Perkins','Hudson','Spencer','Gardner','Stephens','Payne','Pierce','Berry','Matthews','Arnold','Wagner','Willis','Ray','Watkins','Olson','Carroll','Duncan','Snyder','Hart','Cunningham','Bradley','Lane','Andrews','Ruiz','Harper','Fox','Riley','Armstrong','Carpenter','Weaver','Greene','Lawrence','Elliott','Chavez','Sims','Austin','Peters','Kelley','Franklin','Lawson','Fields','Gutierrez','Ryan','Schmidt','Carr','Vasquez','Castillo','Wheeler','Chapman','Oliver','Montgomery','Richards','Williamson','Johnston','Banks','Meyer','Bishop','McCoy','Howell','Alvarez','Morrison','Hansen','Fernandez','Garza','Harvey','Little','Burton','Stanley','Nguyen','George','Jacobs','Reid','Kim','Fuller','Lynch','Dean','Gilbert','Garrett','Romero','Welch','Larson','Frazier','Burke','Hanson','Day','Mendoza','Moreno','Bowman','Medina','Fowler','Brewer','Hoffman','Carlson','Silva','Pearson','Holland','Douglas','Fleming','Jensen','Vargas','Byrd','Davidson','Hopkins','May','Terry','Herrera','Wade','Soto','Walters','Curtis','Neal','Caldwell','Lowe','Jennings','Barnett','Graves','Jimenez','Horton','Shelton','Barrett','Obrien','Castro','Sutton','Gregory','McKinney','Lucas','Miles','Craig','Rodriquez','Chambers','Holt','Lambert','Fletcher','Watts','Bates','Hale','Rhodes','Pena','Beck','Newman','Haynes','McDaniel','Mendez','Bush','Vaughn','Parks','Dawson','Santiago','Norris','Hardy','Love','Steele','Curry','Powers','Schultz','Barker','Guzman','Page','Munoz','Ball','Keller','Chandler','Weber','Leonard','Walsh','Lyons','Ramsey','Wolfe','Schneider','Mullins','Benson','Sharp','Bowen','Daniel','Barber','Cummings','Hines','Baldwin','Griffith','Valdez','Hubbard','Salazar','Reeves','Warner','Stevenson','Burgess','Santos','Tate','Cross','Garner','Mann','Mack','Moss','Thornton','Dennis','McGee','Farmer','Delgado','Aguilar','Vega','Glover','Manning','Cohen','Harmon','Rodgers','Robbins','Newton','Todd','Blair','Higgins','Ingram','Reese','Cannon','Strickland','Townsend','Potter','Goodwin','Walton','Rowe','Hampton','Ortega','Patton','Swanson','Joseph','Francis','Goodman','Maldonado','Yates','Becker','Erickson','Hodges','Rios','Conner','Adkins','Webster','Norman','Malone','Hammond','Flowers','Cobb','Moody','Quinn','Blake','Maxwell','Pope','Floyd','Osborne','Paul','McCarthy','Guerrero','Lindsey','Estrada','Sandoval','Gibbs','Tyler','Gross','Fitzgerald','Stokes','Doyle','Sherman','Saunders','Wise','Colon','Gill','Alvarado','Greer','Padilla','Simon','Waters','Nunez','Ballard','Schwartz','McBride','Houston','Christensen','Klein','Pratt','Briggs','Parsons','McLaughlin','Zimmerman','French','Buchanan','Moran','Copeland','Roy','Pittman','Brady','McCormick','Holloway','Brock','Poole','Frank','Logan','Owen','Bass','Marsh','Drake','Wong','Jefferson','Park','Morton','Abbott','Sparks','Patrick','Norton','Huff','Clayton','Massey','Lloyd','Figueroa','Carson','Bowers','Roberson','Barton','Tran','Lamb','Harrington','Casey','Boone','Cortez','Clarke','Mathis','Singleton','Wilkins','Cain','Bryan','Underwood','Hogan','McKenzie','Collier','Luna','Phelps','McGuire','Allison','Bridges','Wilkerson','Nash','Summers','Atkins'],"it":["Acciai","Aglietti","Agostini","Agresti","Ahmed","Aiazzi","Albanese","Alberti","Alessi","Alfani","Alinari","Alterini","Amato","Ammannati","Ancillotti","Andrei","Andreini","Andreoni","Angeli","Anichini","Antonelli","Antonini","Arena","Ariani","Arnetoli","Arrighi","Baccani","Baccetti","Bacci","Bacherini","Badii","Baggiani","Baglioni","Bagni","Bagnoli","Baldassini","Baldi","Baldini","Ballerini","Balli","Ballini","Balloni","Bambi","Banchi","Bandinelli","Bandini","Bani","Barbetti","Barbieri","Barchielli","Bardazzi","Bardelli","Bardi","Barducci","Bargellini","Bargiacchi","Barni","Baroncelli","Baroncini","Barone","Baroni","Baronti","Bartalesi","Bartoletti","Bartoli","Bartolini","Bartoloni","Bartolozzi","Basagni","Basile","Bassi","Batacchi","Battaglia","Battaglini","Bausi","Becagli","Becattini","Becchi","Becucci","Bellandi","Bellesi","Belli","Bellini","Bellucci","Bencini","Benedetti","Benelli","Beni","Benini","Bensi","Benucci","Benvenuti","Berlincioni","Bernacchioni","Bernardi","Bernardini","Berni","Bernini","Bertelli","Berti","Bertini","Bessi","Betti","Bettini","Biagi","Biagini","Biagioni","Biagiotti","Biancalani","Bianchi","Bianchini","Bianco","Biffoli","Bigazzi","Bigi","Biliotti","Billi","Binazzi","Bindi","Bini","Biondi","Bizzarri","Bocci","Bogani","Bolognesi","Bonaiuti","Bonanni","Bonciani","Boncinelli","Bondi","Bonechi","Bongini","Boni","Bonini","Borchi","Boretti","Borghi","Borghini","Borgioli","Borri","Borselli","Boschi","Bottai","Bracci","Braccini","Brandi","Braschi","Bravi","Brazzini","Breschi","Brilli","Brizzi","Brogelli","Brogi","Brogioni","Brunelli","Brunetti","Bruni","Bruno","Brunori","Bruschi","Bucci","Bucciarelli","Buccioni","Bucelli","Bulli","Burberi","Burchi","Burgassi","Burroni","Bussotti","Buti","Caciolli","Caiani","Calabrese","Calamai","Calamandrei","Caldini","Calo'","Calonaci","Calosi","Calvelli","Cambi","Camiciottoli","Cammelli","Cammilli","Campolmi","Cantini","Capanni","Capecchi","Caponi","Cappelletti","Cappelli","Cappellini","Cappugi","Capretti","Caputo","Carbone","Carboni","Cardini","Carlesi","Carletti","Carli","Caroti","Carotti","Carrai","Carraresi","Carta","Caruso","Casalini","Casati","Caselli","Casini","Castagnoli","Castellani","Castelli","Castellucci","Catalano","Catarzi","Catelani","Cavaciocchi","Cavallaro","Cavallini","Cavicchi","Cavini","Ceccarelli","Ceccatelli","Ceccherelli","Ceccherini","Cecchi","Cecchini","Cecconi","Cei","Cellai","Celli","Cellini","Cencetti","Ceni","Cenni","Cerbai","Cesari","Ceseri","Checcacci","Checchi","Checcucci","Cheli","Chellini","Chen","Cheng","Cherici","Cherubini","Chiaramonti","Chiarantini","Chiarelli","Chiari","Chiarini","Chiarugi","Chiavacci","Chiesi","Chimenti","Chini","Chirici","Chiti","Ciabatti","Ciampi","Cianchi","Cianfanelli","Cianferoni","Ciani","Ciapetti","Ciappi","Ciardi","Ciatti","Cicali","Ciccone","Cinelli","Cini","Ciobanu","Ciolli","Cioni","Cipriani","Cirillo","Cirri","Ciucchi","Ciuffi","Ciulli","Ciullini","Clemente","Cocchi","Cognome","Coli","Collini","Colombo","Colzi","Comparini","Conforti","Consigli","Conte","Conti","Contini","Coppini","Coppola","Corsi","Corsini","Corti","Cortini","Cosi","Costa","Costantini","Costantino","Cozzi","Cresci","Crescioli","Cresti","Crini","Curradi","D'Agostino","D'Alessandro","D'Amico","D'Angelo","Daddi","Dainelli","Dallai","Danti","Davitti","De Angelis","De Luca","De Marco","De Rosa","De Santis","De Simone","De Vita","Degl'Innocenti","Degli Innocenti","Dei","Del Lungo","Del Re","Di Marco","Di Stefano","Dini","Diop","Dobre","Dolfi","Donati","Dondoli","Dong","Donnini","Ducci","Dumitru","Ermini","Esposito","Evangelisti","Fabbri","Fabbrini","Fabbrizzi","Fabbroni","Fabbrucci","Fabiani","Facchini","Faggi","Fagioli","Failli","Faini","Falciani","Falcini","Falcone","Fallani","Falorni","Falsini","Falugiani","Fancelli","Fanelli","Fanetti","Fanfani","Fani","Fantappie'","Fantechi","Fanti","Fantini","Fantoni","Farina","Fattori","Favilli","Fedi","Fei","Ferrante","Ferrara","Ferrari","Ferraro","Ferretti","Ferri","Ferrini","Ferroni","Fiaschi","Fibbi","Fiesoli","Filippi","Filippini","Fini","Fioravanti","Fiore","Fiorentini","Fiorini","Fissi","Focardi","Foggi","Fontana","Fontanelli","Fontani","Forconi","Formigli","Forte","Forti","Fortini","Fossati","Fossi","Francalanci","Franceschi","Franceschini","Franchi","Franchini","Franci","Francini","Francioni","Franco","Frassineti","Frati","Fratini","Frilli","Frizzi","Frosali","Frosini","Frullini","Fusco","Fusi","Gabbrielli","Gabellini","Gagliardi","Galanti","Galardi","Galeotti","Galletti","Galli","Gallo","Gallori","Gambacciani","Gargani","Garofalo","Garuglieri","Gashi","Gasperini","Gatti","Gelli","Gensini","Gentile","Gentili","Geri","Gerini","Gheri","Ghini","Giachetti","Giachi","Giacomelli","Gianassi","Giani","Giannelli","Giannetti","Gianni","Giannini","Giannoni","Giannotti","Giannozzi","Gigli","Giordano","Giorgetti","Giorgi","Giovacchini","Giovannelli","Giovannetti","Giovannini","Giovannoni","Giuliani","Giunti","Giuntini","Giusti","Gonnelli","Goretti","Gori","Gradi","Gramigni","Grassi","Grasso","Graziani","Grazzini","Greco","Grifoni","Grillo","Grimaldi","Grossi","Gualtieri","Guarducci","Guarino","Guarnieri","Guasti","Guerra","Guerri","Guerrini","Guidi","Guidotti","He","Hoxha","Hu","Huang","Iandelli","Ignesti","Innocenti","Jin","La Rosa","Lai","Landi","Landini","Lanini","Lapi","Lapini","Lari","Lascialfari","Lastrucci","Latini","Lazzeri","Lazzerini","Lelli","Lenzi","Leonardi","Leoncini","Leone","Leoni","Lepri","Li","Liao","Lin","Linari","Lippi","Lisi","Livi","Lombardi","Lombardini","Lombardo","Longo","Lopez","Lorenzi","Lorenzini","Lorini","Lotti","Lu","Lucchesi","Lucherini","Lunghi","Lupi","Madiai","Maestrini","Maffei","Maggi","Maggini","Magherini","Magini","Magnani","Magnelli","Magni","Magnolfi","Magrini","Malavolti","Malevolti","Manca","Mancini","Manetti","Manfredi","Mangani","Mannelli","Manni","Mannini","Mannucci","Manuelli","Manzini","Marcelli","Marchese","Marchetti","Marchi","Marchiani","Marchionni","Marconi","Marcucci","Margheri","Mari","Mariani","Marilli","Marinai","Marinari","Marinelli","Marini","Marino","Mariotti","Marsili","Martelli","Martinelli","Martini","Martino","Marzi","Masi","Masini","Masoni","Massai","Materassi","Mattei","Matteini","Matteucci","Matteuzzi","Mattioli","Mattolini","Matucci","Mauro","Mazzanti","Mazzei","Mazzetti","Mazzi","Mazzini","Mazzocchi","Mazzoli","Mazzoni","Mazzuoli","Meacci","Mecocci","Meini","Melani","Mele","Meli","Mengoni","Menichetti","Meoni","Merlini","Messeri","Messina","Meucci","Miccinesi","Miceli","Micheli","Michelini","Michelozzi","Migliori","Migliorini","Milani","Miniati","Misuri","Monaco","Montagnani","Montagni","Montanari","Montelatici","Monti","Montigiani","Montini","Morandi","Morandini","Morelli","Moretti","Morganti","Mori","Morini","Moroni","Morozzi","Mugnai","Mugnaini","Mustafa","Naldi","Naldini","Nannelli","Nanni","Nannini","Nannucci","Nardi","Nardini","Nardoni","Natali","Ndiaye","Nencetti","Nencini","Nencioni","Neri","Nesi","Nesti","Niccolai","Niccoli","Niccolini","Nigi","Nistri","Nocentini","Noferini","Novelli","Nucci","Nuti","Nutini","Oliva","Olivieri","Olmi","Orlandi","Orlandini","Orlando","Orsini","Ortolani","Ottanelli","Pacciani","Pace","Paci","Pacini","Pagani","Pagano","Paggetti","Pagliai","Pagni","Pagnini","Paladini","Palagi","Palchetti","Palloni","Palmieri","Palumbo","Pampaloni","Pancani","Pandolfi","Pandolfini","Panerai","Panichi","Paoletti","Paoli","Paolini","Papi","Papini","Papucci","Parenti","Parigi","Parisi","Parri","Parrini","Pasquini","Passeri","Pecchioli","Pecorini","Pellegrini","Pepi","Perini","Perrone","Peruzzi","Pesci","Pestelli","Petri","Petrini","Petrucci","Pettini","Pezzati","Pezzatini","Piani","Piazza","Piazzesi","Piazzini","Piccardi","Picchi","Piccini","Piccioli","Pieraccini","Pieraccioni","Pieralli","Pierattini","Pieri","Pierini","Pieroni","Pietrini","Pini","Pinna","Pinto","Pinzani","Pinzauti","Piras","Pisani","Pistolesi","Poggesi","Poggi","Poggiali","Poggiolini","Poli","Pollastri","Porciani","Pozzi","Pratellesi","Pratesi","Prosperi","Pruneti","Pucci","Puccini","Puccioni","Pugi","Pugliese","Puliti","Querci","Quercioli","Raddi","Radu","Raffaelli","Ragazzini","Ranfagni","Ranieri","Rastrelli","Raugei","Raveggi","Renai","Renzi","Rettori","Ricci","Ricciardi","Ridi","Ridolfi","Rigacci","Righi","Righini","Rinaldi","Risaliti","Ristori","Rizzo","Rocchi","Rocchini","Rogai","Romagnoli","Romanelli","Romani","Romano","Romei","Romeo","Romiti","Romoli","Romolini","Rontini","Rosati","Roselli","Rosi","Rossetti","Rossi","Rossini","Rovai","Ruggeri","Ruggiero","Russo","Sabatini","Saccardi","Sacchetti","Sacchi","Sacco","Salerno","Salimbeni","Salucci","Salvadori","Salvestrini","Salvi","Salvini","Sanesi","Sani","Sanna","Santi","Santini","Santoni","Santoro","Santucci","Sardi","Sarri","Sarti","Sassi","Sbolci","Scali","Scarpelli","Scarselli","Scopetani","Secci","Selvi","Senatori","Senesi","Serafini","Sereni","Serra","Sestini","Sguanci","Sieni","Signorini","Silvestri","Simoncini","Simonetti","Simoni","Singh","Sodi","Soldi","Somigli","Sorbi","Sorelli","Sorrentino","Sottili","Spina","Spinelli","Staccioli","Staderini","Stefanelli","Stefani","Stefanini","Stella","Susini","Tacchi","Tacconi","Taddei","Tagliaferri","Tamburini","Tanganelli","Tani","Tanini","Tapinassi","Tarchi","Tarchiani","Targioni","Tassi","Tassini","Tempesti","Terzani","Tesi","Testa","Testi","Tilli","Tinti","Tirinnanzi","Toccafondi","Tofanari","Tofani","Tognaccini","Tonelli","Tonini","Torelli","Torrini","Tosi","Toti","Tozzi","Trambusti","Trapani","Tucci","Turchi","Ugolini","Ulivi","Valente","Valenti","Valentini","Vangelisti","Vanni","Vannini","Vannoni","Vannozzi","Vannucchi","Vannucci","Ventura","Venturi","Venturini","Vestri","Vettori","Vichi","Viciani","Vieri","Vigiani","Vignoli","Vignolini","Vignozzi","Villani","Vinci","Visani","Vitale","Vitali","Viti","Viviani","Vivoli","Volpe","Volpi","Wang","Wu","Xu","Yang","Ye","Zagli","Zani","Zanieri","Zanobini","Zecchi","Zetti","Zhang","Zheng","Zhou","Zhu","Zingoni","Zini","Zoppi"]},countries:[{"name":"Afghanistan","abbreviation":"AF"},{"name":"Åland Islands","abbreviation":"AX"},{"name":"Albania","abbreviation":"AL"},{"name":"Algeria","abbreviation":"DZ"},{"name":"American Samoa","abbreviation":"AS"},{"name":"Andorra","abbreviation":"AD"},{"name":"Angola","abbreviation":"AO"},{"name":"Anguilla","abbreviation":"AI"},{"name":"Antarctica","abbreviation":"AQ"},{"name":"Antigua & Barbuda","abbreviation":"AG"},{"name":"Argentina","abbreviation":"AR"},{"name":"Armenia","abbreviation":"AM"},{"name":"Aruba","abbreviation":"AW"},{"name":"Ascension Island","abbreviation":"AC"},{"name":"Australia","abbreviation":"AU"},{"name":"Austria","abbreviation":"AT"},{"name":"Azerbaijan","abbreviation":"AZ"},{"name":"Bahamas","abbreviation":"BS"},{"name":"Bahrain","abbreviation":"BH"},{"name":"Bangladesh","abbreviation":"BD"},{"name":"Barbados","abbreviation":"BB"},{"name":"Belarus","abbreviation":"BY"},{"name":"Belgium","abbreviation":"BE"},{"name":"Belize","abbreviation":"BZ"},{"name":"Benin","abbreviation":"BJ"},{"name":"Bermuda","abbreviation":"BM"},{"name":"Bhutan","abbreviation":"BT"},{"name":"Bolivia","abbreviation":"BO"},{"name":"Bosnia & Herzegovina","abbreviation":"BA"},{"name":"Botswana","abbreviation":"BW"},{"name":"Brazil","abbreviation":"BR"},{"name":"British Indian Ocean Territory","abbreviation":"IO"},{"name":"British Virgin Islands","abbreviation":"VG"},{"name":"Brunei","abbreviation":"BN"},{"name":"Bulgaria","abbreviation":"BG"},{"name":"Burkina Faso","abbreviation":"BF"},{"name":"Burundi","abbreviation":"BI"},{"name":"Cambodia","abbreviation":"KH"},{"name":"Cameroon","abbreviation":"CM"},{"name":"Canada","abbreviation":"CA"},{"name":"Canary Islands","abbreviation":"IC"},{"name":"Cape Verde","abbreviation":"CV"},{"name":"Caribbean Netherlands","abbreviation":"BQ"},{"name":"Cayman Islands","abbreviation":"KY"},{"name":"Central African Republic","abbreviation":"CF"},{"name":"Ceuta & Melilla","abbreviation":"EA"},{"name":"Chad","abbreviation":"TD"},{"name":"Chile","abbreviation":"CL"},{"name":"China","abbreviation":"CN"},{"name":"Christmas Island","abbreviation":"CX"},{"name":"Cocos (Keeling) Islands","abbreviation":"CC"},{"name":"Colombia","abbreviation":"CO"},{"name":"Comoros","abbreviation":"KM"},{"name":"Congo - Brazzaville","abbreviation":"CG"},{"name":"Congo - Kinshasa","abbreviation":"CD"},{"name":"Cook Islands","abbreviation":"CK"},{"name":"Costa Rica","abbreviation":"CR"},{"name":"Côte d'Ivoire","abbreviation":"CI"},{"name":"Croatia","abbreviation":"HR"},{"name":"Cuba","abbreviation":"CU"},{"name":"Curaçao","abbreviation":"CW"},{"name":"Cyprus","abbreviation":"CY"},{"name":"Czech Republic","abbreviation":"CZ"},{"name":"Denmark","abbreviation":"DK"},{"name":"Diego Garcia","abbreviation":"DG"},{"name":"Djibouti","abbreviation":"DJ"},{"name":"Dominica","abbreviation":"DM"},{"name":"Dominican Republic","abbreviation":"DO"},{"name":"Ecuador","abbreviation":"EC"},{"name":"Egypt","abbreviation":"EG"},{"name":"El Salvador","abbreviation":"SV"},{"name":"Equatorial Guinea","abbreviation":"GQ"},{"name":"Eritrea","abbreviation":"ER"},{"name":"Estonia","abbreviation":"EE"},{"name":"Ethiopia","abbreviation":"ET"},{"name":"Falkland Islands","abbreviation":"FK"},{"name":"Faroe Islands","abbreviation":"FO"},{"name":"Fiji","abbreviation":"FJ"},{"name":"Finland","abbreviation":"FI"},{"name":"France","abbreviation":"FR"},{"name":"French Guiana","abbreviation":"GF"},{"name":"French Polynesia","abbreviation":"PF"},{"name":"French Southern Territories","abbreviation":"TF"},{"name":"Gabon","abbreviation":"GA"},{"name":"Gambia","abbreviation":"GM"},{"name":"Georgia","abbreviation":"GE"},{"name":"Germany","abbreviation":"DE"},{"name":"Ghana","abbreviation":"GH"},{"name":"Gibraltar","abbreviation":"GI"},{"name":"Greece","abbreviation":"GR"},{"name":"Greenland","abbreviation":"GL"},{"name":"Grenada","abbreviation":"GD"},{"name":"Guadeloupe","abbreviation":"GP"},{"name":"Guam","abbreviation":"GU"},{"name":"Guatemala","abbreviation":"GT"},{"name":"Guernsey","abbreviation":"GG"},{"name":"Guinea","abbreviation":"GN"},{"name":"Guinea-Bissau","abbreviation":"GW"},{"name":"Guyana","abbreviation":"GY"},{"name":"Haiti","abbreviation":"HT"},{"name":"Honduras","abbreviation":"HN"},{"name":"Hong Kong SAR China","abbreviation":"HK"},{"name":"Hungary","abbreviation":"HU"},{"name":"Iceland","abbreviation":"IS"},{"name":"India","abbreviation":"IN"},{"name":"Indonesia","abbreviation":"ID"},{"name":"Iran","abbreviation":"IR"},{"name":"Iraq","abbreviation":"IQ"},{"name":"Ireland","abbreviation":"IE"},{"name":"Isle of Man","abbreviation":"IM"},{"name":"Israel","abbreviation":"IL"},{"name":"Italy","abbreviation":"IT"},{"name":"Jamaica","abbreviation":"JM"},{"name":"Japan","abbreviation":"JP"},{"name":"Jersey","abbreviation":"JE"},{"name":"Jordan","abbreviation":"JO"},{"name":"Kazakhstan","abbreviation":"KZ"},{"name":"Kenya","abbreviation":"KE"},{"name":"Kiribati","abbreviation":"KI"},{"name":"Kosovo","abbreviation":"XK"},{"name":"Kuwait","abbreviation":"KW"},{"name":"Kyrgyzstan","abbreviation":"KG"},{"name":"Laos","abbreviation":"LA"},{"name":"Latvia","abbreviation":"LV"},{"name":"Lebanon","abbreviation":"LB"},{"name":"Lesotho","abbreviation":"LS"},{"name":"Liberia","abbreviation":"LR"},{"name":"Libya","abbreviation":"LY"},{"name":"Liechtenstein","abbreviation":"LI"},{"name":"Lithuania","abbreviation":"LT"},{"name":"Luxembourg","abbreviation":"LU"},{"name":"Macau SAR China","abbreviation":"MO"},{"name":"Macedonia","abbreviation":"MK"},{"name":"Madagascar","abbreviation":"MG"},{"name":"Malawi","abbreviation":"MW"},{"name":"Malaysia","abbreviation":"MY"},{"name":"Maldives","abbreviation":"MV"},{"name":"Mali","abbreviation":"ML"},{"name":"Malta","abbreviation":"MT"},{"name":"Marshall Islands","abbreviation":"MH"},{"name":"Martinique","abbreviation":"MQ"},{"name":"Mauritania","abbreviation":"MR"},{"name":"Mauritius","abbreviation":"MU"},{"name":"Mayotte","abbreviation":"YT"},{"name":"Mexico","abbreviation":"MX"},{"name":"Micronesia","abbreviation":"FM"},{"name":"Moldova","abbreviation":"MD"},{"name":"Monaco","abbreviation":"MC"},{"name":"Mongolia","abbreviation":"MN"},{"name":"Montenegro","abbreviation":"ME"},{"name":"Montserrat","abbreviation":"MS"},{"name":"Morocco","abbreviation":"MA"},{"name":"Mozambique","abbreviation":"MZ"},{"name":"Myanmar (Burma)","abbreviation":"MM"},{"name":"Namibia","abbreviation":"NA"},{"name":"Nauru","abbreviation":"NR"},{"name":"Nepal","abbreviation":"NP"},{"name":"Netherlands","abbreviation":"NL"},{"name":"New Caledonia","abbreviation":"NC"},{"name":"New Zealand","abbreviation":"NZ"},{"name":"Nicaragua","abbreviation":"NI"},{"name":"Niger","abbreviation":"NE"},{"name":"Nigeria","abbreviation":"NG"},{"name":"Niue","abbreviation":"NU"},{"name":"Norfolk Island","abbreviation":"NF"},{"name":"North Korea","abbreviation":"KP"},{"name":"Northern Mariana Islands","abbreviation":"MP"},{"name":"Norway","abbreviation":"NO"},{"name":"Oman","abbreviation":"OM"},{"name":"Pakistan","abbreviation":"PK"},{"name":"Palau","abbreviation":"PW"},{"name":"Palestinian Territories","abbreviation":"PS"},{"name":"Panama","abbreviation":"PA"},{"name":"Papua New Guinea","abbreviation":"PG"},{"name":"Paraguay","abbreviation":"PY"},{"name":"Peru","abbreviation":"PE"},{"name":"Philippines","abbreviation":"PH"},{"name":"Pitcairn Islands","abbreviation":"PN"},{"name":"Poland","abbreviation":"PL"},{"name":"Portugal","abbreviation":"PT"},{"name":"Puerto Rico","abbreviation":"PR"},{"name":"Qatar","abbreviation":"QA"},{"name":"Réunion","abbreviation":"RE"},{"name":"Romania","abbreviation":"RO"},{"name":"Russia","abbreviation":"RU"},{"name":"Rwanda","abbreviation":"RW"},{"name":"Samoa","abbreviation":"WS"},{"name":"San Marino","abbreviation":"SM"},{"name":"São Tomé and Príncipe","abbreviation":"ST"},{"name":"Saudi Arabia","abbreviation":"SA"},{"name":"Senegal","abbreviation":"SN"},{"name":"Serbia","abbreviation":"RS"},{"name":"Seychelles","abbreviation":"SC"},{"name":"Sierra Leone","abbreviation":"SL"},{"name":"Singapore","abbreviation":"SG"},{"name":"Sint Maarten","abbreviation":"SX"},{"name":"Slovakia","abbreviation":"SK"},{"name":"Slovenia","abbreviation":"SI"},{"name":"Solomon Islands","abbreviation":"SB"},{"name":"Somalia","abbreviation":"SO"},{"name":"South Africa","abbreviation":"ZA"},{"name":"South Georgia & South Sandwich Islands","abbreviation":"GS"},{"name":"South Korea","abbreviation":"KR"},{"name":"South Sudan","abbreviation":"SS"},{"name":"Spain","abbreviation":"ES"},{"name":"Sri Lanka","abbreviation":"LK"},{"name":"St. Barthélemy","abbreviation":"BL"},{"name":"St. Helena","abbreviation":"SH"},{"name":"St. Kitts & Nevis","abbreviation":"KN"},{"name":"St. Lucia","abbreviation":"LC"},{"name":"St. Martin","abbreviation":"MF"},{"name":"St. Pierre & Miquelon","abbreviation":"PM"},{"name":"St. Vincent & Grenadines","abbreviation":"VC"},{"name":"Sudan","abbreviation":"SD"},{"name":"Suriname","abbreviation":"SR"},{"name":"Svalbard & Jan Mayen","abbreviation":"SJ"},{"name":"Swaziland","abbreviation":"SZ"},{"name":"Sweden","abbreviation":"SE"},{"name":"Switzerland","abbreviation":"CH"},{"name":"Syria","abbreviation":"SY"},{"name":"Taiwan","abbreviation":"TW"},{"name":"Tajikistan","abbreviation":"TJ"},{"name":"Tanzania","abbreviation":"TZ"},{"name":"Thailand","abbreviation":"TH"},{"name":"Timor-Leste","abbreviation":"TL"},{"name":"Togo","abbreviation":"TG"},{"name":"Tokelau","abbreviation":"TK"},{"name":"Tonga","abbreviation":"TO"},{"name":"Trinidad & Tobago","abbreviation":"TT"},{"name":"Tristan da Cunha","abbreviation":"TA"},{"name":"Tunisia","abbreviation":"TN"},{"name":"Turkey","abbreviation":"TR"},{"name":"Turkmenistan","abbreviation":"TM"},{"name":"Turks & Caicos Islands","abbreviation":"TC"},{"name":"Tuvalu","abbreviation":"TV"},{"name":"U.S. Outlying Islands","abbreviation":"UM"},{"name":"U.S. Virgin Islands","abbreviation":"VI"},{"name":"Uganda","abbreviation":"UG"},{"name":"Ukraine","abbreviation":"UA"},{"name":"United Arab Emirates","abbreviation":"AE"},{"name":"United Kingdom","abbreviation":"GB"},{"name":"United States","abbreviation":"US"},{"name":"Uruguay","abbreviation":"UY"},{"name":"Uzbekistan","abbreviation":"UZ"},{"name":"Vanuatu","abbreviation":"VU"},{"name":"Vatican City","abbreviation":"VA"},{"name":"Venezuela","abbreviation":"VE"},{"name":"Vietnam","abbreviation":"VN"},{"name":"Wallis & Futuna","abbreviation":"WF"},{"name":"Western Sahara","abbreviation":"EH"},{"name":"Yemen","abbreviation":"YE"},{"name":"Zambia","abbreviation":"ZM"},{"name":"Zimbabwe","abbreviation":"ZW"}],counties:{"uk":[{name:'Bath and North East Somerset'},{name:'Aberdeenshire'},{name:'Anglesey'},{name:'Angus'},{name:'Bedford'},{name:'Blackburn with Darwen'},{name:'Blackpool'},{name:'Bournemouth'},{name:'Bracknell Forest'},{name:'Brighton & Hove'},{name:'Bristol'},{name:'Buckinghamshire'},{name:'Cambridgeshire'},{name:'Carmarthenshire'},{name:'Central Bedfordshire'},{name:'Ceredigion'},{name:'Cheshire East'},{name:'Cheshire West and Chester'},{name:'Clackmannanshire'},{name:'Conwy'},{name:'Cornwall'},{name:'County Antrim'},{name:'County Armagh'},{name:'County Down'},{name:'County Durham'},{name:'County Fermanagh'},{name:'County Londonderry'},{name:'County Tyrone'},{name:'Cumbria'},{name:'Darlington'},{name:'Denbighshire'},{name:'Derby'},{name:'Derbyshire'},{name:'Devon'},{name:'Dorset'},{name:'Dumfries and Galloway'},{name:'Dundee'},{name:'East Lothian'},{name:'East Riding of Yorkshire'},{name:'East Sussex'},{name:'Edinburgh?'},{name:'Essex'},{name:'Falkirk'},{name:'Fife'},{name:'Flintshire'},{name:'Gloucestershire'},{name:'Greater London'},{name:'Greater Manchester'},{name:'Gwent'},{name:'Gwynedd'},{name:'Halton'},{name:'Hampshire'},{name:'Hartlepool'},{name:'Herefordshire'},{name:'Hertfordshire'},{name:'Highlands'},{name:'Hull'},{name:'Isle of Wight'},{name:'Isles of Scilly'},{name:'Kent'},{name:'Lancashire'},{name:'Leicester'},{name:'Leicestershire'},{name:'Lincolnshire'},{name:'Lothian'},{name:'Luton'},{name:'Medway'},{name:'Merseyside'},{name:'Mid Glamorgan'},{name:'Middlesbrough'},{name:'Milton Keynes'},{name:'Monmouthshire'},{name:'Moray'},{name:'Norfolk'},{name:'North East Lincolnshire'},{name:'North Lincolnshire'},{name:'North Somerset'},{name:'North Yorkshire'},{name:'Northamptonshire'},{name:'Northumberland'},{name:'Nottingham'},{name:'Nottinghamshire'},{name:'Oxfordshire'},{name:'Pembrokeshire'},{name:'Perth and Kinross'},{name:'Peterborough'},{name:'Plymouth'},{name:'Poole'},{name:'Portsmouth'},{name:'Powys'},{name:'Reading'},{name:'Redcar and Cleveland'},{name:'Rutland'},{name:'Scottish Borders'},{name:'Shropshire'},{name:'Slough'},{name:'Somerset'},{name:'South Glamorgan'},{name:'South Gloucestershire'},{name:'South Yorkshire'},{name:'Southampton'},{name:'Southend-on-Sea'},{name:'Staffordshire'},{name:'Stirlingshire'},{name:'Stockton-on-Tees'},{name:'Stoke-on-Trent'},{name:'Strathclyde'},{name:'Suffolk'},{name:'Surrey'},{name:'Swindon'},{name:'Telford and Wrekin'},{name:'Thurrock'},{name:'Torbay'},{name:'Tyne and Wear'},{name:'Warrington'},{name:'Warwickshire'},{name:'West Berkshire'},{name:'West Glamorgan'},{name:'West Lothian'},{name:'West Midlands'},{name:'West Sussex'},{name:'West Yorkshire'},{name:'Western Isles'},{name:'Wiltshire'},{name:'Windsor and Maidenhead'},{name:'Wokingham'},{name:'Worcestershire'},{name:'Wrexham'},{name:'York'}]},provinces:{"ca":[{name:'Alberta',abbreviation:'AB'},{name:'British Columbia',abbreviation:'BC'},{name:'Manitoba',abbreviation:'MB'},{name:'New Brunswick',abbreviation:'NB'},{name:'Newfoundland and Labrador',abbreviation:'NL'},{name:'Nova Scotia',abbreviation:'NS'},{name:'Ontario',abbreviation:'ON'},{name:'Prince Edward Island',abbreviation:'PE'},{name:'Quebec',abbreviation:'QC'},{name:'Saskatchewan',abbreviation:'SK'},{name:'Northwest Territories',abbreviation:'NT'},{name:'Nunavut',abbreviation:'NU'},{name:'Yukon',abbreviation:'YT'}],"it":[{name:"Agrigento",abbreviation:"AG",code:84},{name:"Alessandria",abbreviation:"AL",code:6},{name:"Ancona",abbreviation:"AN",code:42},{name:"Aosta",abbreviation:"AO",code:7},{name:"L'Aquila",abbreviation:"AQ",code:66},{name:"Arezzo",abbreviation:"AR",code:51},{name:"Ascoli-Piceno",abbreviation:"AP",code:44},{name:"Asti",abbreviation:"AT",code:5},{name:"Avellino",abbreviation:"AV",code:64},{name:"Bari",abbreviation:"BA",code:72},{name:"Barletta-Andria-Trani",abbreviation:"BT",code:72},{name:"Belluno",abbreviation:"BL",code:25},{name:"Benevento",abbreviation:"BN",code:62},{name:"Bergamo",abbreviation:"BG",code:16},{name:"Biella",abbreviation:"BI",code:96},{name:"Bologna",abbreviation:"BO",code:37},{name:"Bolzano",abbreviation:"BZ",code:21},{name:"Brescia",abbreviation:"BS",code:17},{name:"Brindisi",abbreviation:"BR",code:74},{name:"Cagliari",abbreviation:"CA",code:92},{name:"Caltanissetta",abbreviation:"CL",code:85},{name:"Campobasso",abbreviation:"CB",code:70},{name:"Carbonia Iglesias",abbreviation:"CI",code:70},{name:"Caserta",abbreviation:"CE",code:61},{name:"Catania",abbreviation:"CT",code:87},{name:"Catanzaro",abbreviation:"CZ",code:79},{name:"Chieti",abbreviation:"CH",code:69},{name:"Como",abbreviation:"CO",code:13},{name:"Cosenza",abbreviation:"CS",code:78},{name:"Cremona",abbreviation:"CR",code:19},{name:"Crotone",abbreviation:"KR",code:101},{name:"Cuneo",abbreviation:"CN",code:4},{name:"Enna",abbreviation:"EN",code:86},{name:"Fermo",abbreviation:"FM",code:86},{name:"Ferrara",abbreviation:"FE",code:38},{name:"Firenze",abbreviation:"FI",code:48},{name:"Foggia",abbreviation:"FG",code:71},{name:"Forli-Cesena",abbreviation:"FC",code:71},{name:"Frosinone",abbreviation:"FR",code:60},{name:"Genova",abbreviation:"GE",code:10},{name:"Gorizia",abbreviation:"GO",code:31},{name:"Grosseto",abbreviation:"GR",code:53},{name:"Imperia",abbreviation:"IM",code:8},{name:"Isernia",abbreviation:"IS",code:94},{name:"La-Spezia",abbreviation:"SP",code:66},{name:"Latina",abbreviation:"LT",code:59},{name:"Lecce",abbreviation:"LE",code:75},{name:"Lecco",abbreviation:"LC",code:97},{name:"Livorno",abbreviation:"LI",code:49},{name:"Lodi",abbreviation:"LO",code:98},{name:"Lucca",abbreviation:"LU",code:46},{name:"Macerata",abbreviation:"MC",code:43},{name:"Mantova",abbreviation:"MN",code:20},{name:"Massa-Carrara",abbreviation:"MS",code:45},{name:"Matera",abbreviation:"MT",code:77},{name:"Medio Campidano",abbreviation:"VS",code:77},{name:"Messina",abbreviation:"ME",code:83},{name:"Milano",abbreviation:"MI",code:15},{name:"Modena",abbreviation:"MO",code:36},{name:"Monza-Brianza",abbreviation:"MB",code:36},{name:"Napoli",abbreviation:"NA",code:63},{name:"Novara",abbreviation:"NO",code:3},{name:"Nuoro",abbreviation:"NU",code:91},{name:"Ogliastra",abbreviation:"OG",code:91},{name:"Olbia Tempio",abbreviation:"OT",code:91},{name:"Oristano",abbreviation:"OR",code:95},{name:"Padova",abbreviation:"PD",code:28},{name:"Palermo",abbreviation:"PA",code:82},{name:"Parma",abbreviation:"PR",code:34},{name:"Pavia",abbreviation:"PV",code:18},{name:"Perugia",abbreviation:"PG",code:54},{name:"Pesaro-Urbino",abbreviation:"PU",code:41},{name:"Pescara",abbreviation:"PE",code:68},{name:"Piacenza",abbreviation:"PC",code:33},{name:"Pisa",abbreviation:"PI",code:50},{name:"Pistoia",abbreviation:"PT",code:47},{name:"Pordenone",abbreviation:"PN",code:93},{name:"Potenza",abbreviation:"PZ",code:76},{name:"Prato",abbreviation:"PO",code:100},{name:"Ragusa",abbreviation:"RG",code:88},{name:"Ravenna",abbreviation:"RA",code:39},{name:"Reggio-Calabria",abbreviation:"RC",code:35},{name:"Reggio-Emilia",abbreviation:"RE",code:35},{name:"Rieti",abbreviation:"RI",code:57},{name:"Rimini",abbreviation:"RN",code:99},{name:"Roma",abbreviation:"Roma",code:58},{name:"Rovigo",abbreviation:"RO",code:29},{name:"Salerno",abbreviation:"SA",code:65},{name:"Sassari",abbreviation:"SS",code:90},{name:"Savona",abbreviation:"SV",code:9},{name:"Siena",abbreviation:"SI",code:52},{name:"Siracusa",abbreviation:"SR",code:89},{name:"Sondrio",abbreviation:"SO",code:14},{name:"Taranto",abbreviation:"TA",code:73},{name:"Teramo",abbreviation:"TE",code:67},{name:"Terni",abbreviation:"TR",code:55},{name:"Torino",abbreviation:"TO",code:1},{name:"Trapani",abbreviation:"TP",code:81},{name:"Trento",abbreviation:"TN",code:22},{name:"Treviso",abbreviation:"TV",code:26},{name:"Trieste",abbreviation:"TS",code:32},{name:"Udine",abbreviation:"UD",code:30},{name:"Varese",abbreviation:"VA",code:12},{name:"Venezia",abbreviation:"VE",code:27},{name:"Verbania",abbreviation:"VB",code:27},{name:"Vercelli",abbreviation:"VC",code:2},{name:"Verona",abbreviation:"VR",code:23},{name:"Vibo-Valentia",abbreviation:"VV",code:102},{name:"Vicenza",abbreviation:"VI",code:24},{name:"Viterbo",abbreviation:"VT",code:56}]},nationalities:[{name:'Afghan'},{name:'Albanian'},{name:'Algerian'},{name:'American'},{name:'Andorran'},{name:'Angolan'},{name:'Antiguans'},{name:'Argentinean'},{name:'Armenian'},{name:'Australian'},{name:'Austrian'},{name:'Azerbaijani'},{name:'Bahami'},{name:'Bahraini'},{name:'Bangladeshi'},{name:'Barbadian'},{name:'Barbudans'},{name:'Batswana'},{name:'Belarusian'},{name:'Belgian'},{name:'Belizean'},{name:'Beninese'},{name:'Bhutanese'},{name:'Bolivian'},{name:'Bosnian'},{name:'Brazilian'},{name:'British'},{name:'Bruneian'},{name:'Bulgarian'},{name:'Burkinabe'},{name:'Burmese'},{name:'Burundian'},{name:'Cambodian'},{name:'Cameroonian'},{name:'Canadian'},{name:'Cape Verdean'},{name:'Central African'},{name:'Chadian'},{name:'Chilean'},{name:'Chinese'},{name:'Colombian'},{name:'Comoran'},{name:'Congolese'},{name:'Costa Rican'},{name:'Croatian'},{name:'Cuban'},{name:'Cypriot'},{name:'Czech'},{name:'Danish'},{name:'Djibouti'},{name:'Dominican'},{name:'Dutch'},{name:'East Timorese'},{name:'Ecuadorean'},{name:'Egyptian'},{name:'Emirian'},{name:'Equatorial Guinean'},{name:'Eritrean'},{name:'Estonian'},{name:'Ethiopian'},{name:'Fijian'},{name:'Filipino'},{name:'Finnish'},{name:'French'},{name:'Gabonese'},{name:'Gambian'},{name:'Georgian'},{name:'German'},{name:'Ghanaian'},{name:'Greek'},{name:'Grenadian'},{name:'Guatemalan'},{name:'Guinea-Bissauan'},{name:'Guinean'},{name:'Guyanese'},{name:'Haitian'},{name:'Herzegovinian'},{name:'Honduran'},{name:'Hungarian'},{name:'I-Kiribati'},{name:'Icelander'},{name:'Indian'},{name:'Indonesian'},{name:'Iranian'},{name:'Iraqi'},{name:'Irish'},{name:'Israeli'},{name:'Italian'},{name:'Ivorian'},{name:'Jamaican'},{name:'Japanese'},{name:'Jordanian'},{name:'Kazakhstani'},{name:'Kenyan'},{name:'Kittian and Nevisian'},{name:'Kuwaiti'},{name:'Kyrgyz'},{name:'Laotian'},{name:'Latvian'},{name:'Lebanese'},{name:'Liberian'},{name:'Libyan'},{name:'Liechtensteiner'},{name:'Lithuanian'},{name:'Luxembourger'},{name:'Macedonian'},{name:'Malagasy'},{name:'Malawian'},{name:'Malaysian'},{name:'Maldivan'},{name:'Malian'},{name:'Maltese'},{name:'Marshallese'},{name:'Mauritanian'},{name:'Mauritian'},{name:'Mexican'},{name:'Micronesian'},{name:'Moldovan'},{name:'Monacan'},{name:'Mongolian'},{name:'Moroccan'},{name:'Mosotho'},{name:'Motswana'},{name:'Mozambican'},{name:'Namibian'},{name:'Nauruan'},{name:'Nepalese'},{name:'New Zealander'},{name:'Nicaraguan'},{name:'Nigerian'},{name:'Nigerien'},{name:'North Korean'},{name:'Northern Irish'},{name:'Norwegian'},{name:'Omani'},{name:'Pakistani'},{name:'Palauan'},{name:'Panamanian'},{name:'Papua New Guinean'},{name:'Paraguayan'},{name:'Peruvian'},{name:'Polish'},{name:'Portuguese'},{name:'Qatari'},{name:'Romani'},{name:'Russian'},{name:'Rwandan'},{name:'Saint Lucian'},{name:'Salvadoran'},{name:'Samoan'},{name:'San Marinese'},{name:'Sao Tomean'},{name:'Saudi'},{name:'Scottish'},{name:'Senegalese'},{name:'Serbian'},{name:'Seychellois'},{name:'Sierra Leonean'},{name:'Singaporean'},{name:'Slovakian'},{name:'Slovenian'},{name:'Solomon Islander'},{name:'Somali'},{name:'South African'},{name:'South Korean'},{name:'Spanish'},{name:'Sri Lankan'},{name:'Sudanese'},{name:'Surinamer'},{name:'Swazi'},{name:'Swedish'},{name:'Swiss'},{name:'Syrian'},{name:'Taiwanese'},{name:'Tajik'},{name:'Tanzanian'},{name:'Thai'},{name:'Togolese'},{name:'Tongan'},{name:'Trinidadian or Tobagonian'},{name:'Tunisian'},{name:'Turkish'},{name:'Tuvaluan'},{name:'Ugandan'},{name:'Ukrainian'},{name:'Uruguaya'},{name:'Uzbekistani'},{name:'Venezuela'},{name:'Vietnamese'},{name:'Wels'},{name:'Yemenit'},{name:'Zambia'},{name:'Zimbabwe'}],us_states_and_dc:[{name:'Alabama',abbreviation:'AL'},{name:'Alaska',abbreviation:'AK'},{name:'Arizona',abbreviation:'AZ'},{name:'Arkansas',abbreviation:'AR'},{name:'California',abbreviation:'CA'},{name:'Colorado',abbreviation:'CO'},{name:'Connecticut',abbreviation:'CT'},{name:'Delaware',abbreviation:'DE'},{name:'District of Columbia',abbreviation:'DC'},{name:'Florida',abbreviation:'FL'},{name:'Georgia',abbreviation:'GA'},{name:'Hawaii',abbreviation:'HI'},{name:'Idaho',abbreviation:'ID'},{name:'Illinois',abbreviation:'IL'},{name:'Indiana',abbreviation:'IN'},{name:'Iowa',abbreviation:'IA'},{name:'Kansas',abbreviation:'KS'},{name:'Kentucky',abbreviation:'KY'},{name:'Louisiana',abbreviation:'LA'},{name:'Maine',abbreviation:'ME'},{name:'Maryland',abbreviation:'MD'},{name:'Massachusetts',abbreviation:'MA'},{name:'Michigan',abbreviation:'MI'},{name:'Minnesota',abbreviation:'MN'},{name:'Mississippi',abbreviation:'MS'},{name:'Missouri',abbreviation:'MO'},{name:'Montana',abbreviation:'MT'},{name:'Nebraska',abbreviation:'NE'},{name:'Nevada',abbreviation:'NV'},{name:'New Hampshire',abbreviation:'NH'},{name:'New Jersey',abbreviation:'NJ'},{name:'New Mexico',abbreviation:'NM'},{name:'New York',abbreviation:'NY'},{name:'North Carolina',abbreviation:'NC'},{name:'North Dakota',abbreviation:'ND'},{name:'Ohio',abbreviation:'OH'},{name:'Oklahoma',abbreviation:'OK'},{name:'Oregon',abbreviation:'OR'},{name:'Pennsylvania',abbreviation:'PA'},{name:'Rhode Island',abbreviation:'RI'},{name:'South Carolina',abbreviation:'SC'},{name:'South Dakota',abbreviation:'SD'},{name:'Tennessee',abbreviation:'TN'},{name:'Texas',abbreviation:'TX'},{name:'Utah',abbreviation:'UT'},{name:'Vermont',abbreviation:'VT'},{name:'Virginia',abbreviation:'VA'},{name:'Washington',abbreviation:'WA'},{name:'West Virginia',abbreviation:'WV'},{name:'Wisconsin',abbreviation:'WI'},{name:'Wyoming',abbreviation:'WY'}],territories:[{name:'American Samoa',abbreviation:'AS'},{name:'Federated States of Micronesia',abbreviation:'FM'},{name:'Guam',abbreviation:'GU'},{name:'Marshall Islands',abbreviation:'MH'},{name:'Northern Mariana Islands',abbreviation:'MP'},{name:'Puerto Rico',abbreviation:'PR'},{name:'Virgin Islands, U.S.',abbreviation:'VI'}],armed_forces:[{name:'Armed Forces Europe',abbreviation:'AE'},{name:'Armed Forces Pacific',abbreviation:'AP'},{name:'Armed Forces the Americas',abbreviation:'AA'}],country_regions:{it:[{name:"Valle d'Aosta",abbreviation:"VDA"},{name:"Piemonte",abbreviation:"PIE"},{name:"Lombardia",abbreviation:"LOM"},{name:"Veneto",abbreviation:"VEN"},{name:"Trentino Alto Adige",abbreviation:"TAA"},{name:"Friuli Venezia Giulia",abbreviation:"FVG"},{name:"Liguria",abbreviation:"LIG"},{name:"Emilia Romagna",abbreviation:"EMR"},{name:"Toscana",abbreviation:"TOS"},{name:"Umbria",abbreviation:"UMB"},{name:"Marche",abbreviation:"MAR"},{name:"Abruzzo",abbreviation:"ABR"},{name:"Lazio",abbreviation:"LAZ"},{name:"Campania",abbreviation:"CAM"},{name:"Puglia",abbreviation:"PUG"},{name:"Basilicata",abbreviation:"BAS"},{name:"Molise",abbreviation:"MOL"},{name:"Calabria",abbreviation:"CAL"},{name:"Sicilia",abbreviation:"SIC"},{name:"Sardegna",abbreviation:"SAR"}]},street_suffixes:{'us':[{name:'Avenue',abbreviation:'Ave'},{name:'Boulevard',abbreviation:'Blvd'},{name:'Center',abbreviation:'Ctr'},{name:'Circle',abbreviation:'Cir'},{name:'Court',abbreviation:'Ct'},{name:'Drive',abbreviation:'Dr'},{name:'Extension',abbreviation:'Ext'},{name:'Glen',abbreviation:'Gln'},{name:'Grove',abbreviation:'Grv'},{name:'Heights',abbreviation:'Hts'},{name:'Highway',abbreviation:'Hwy'},{name:'Junction',abbreviation:'Jct'},{name:'Key',abbreviation:'Key'},{name:'Lane',abbreviation:'Ln'},{name:'Loop',abbreviation:'Loop'},{name:'Manor',abbreviation:'Mnr'},{name:'Mill',abbreviation:'Mill'},{name:'Park',abbreviation:'Park'},{name:'Parkway',abbreviation:'Pkwy'},{name:'Pass',abbreviation:'Pass'},{name:'Path',abbreviation:'Path'},{name:'Pike',abbreviation:'Pike'},{name:'Place',abbreviation:'Pl'},{name:'Plaza',abbreviation:'Plz'},{name:'Point',abbreviation:'Pt'},{name:'Ridge',abbreviation:'Rdg'},{name:'River',abbreviation:'Riv'},{name:'Road',abbreviation:'Rd'},{name:'Square',abbreviation:'Sq'},{name:'Street',abbreviation:'St'},{name:'Terrace',abbreviation:'Ter'},{name:'Trail',abbreviation:'Trl'},{name:'Turnpike',abbreviation:'Tpke'},{name:'View',abbreviation:'Vw'},{name:'Way',abbreviation:'Way'}],'it':[{name:'Accesso',abbreviation:'Acc.'},{name:'Alzaia',abbreviation:'Alz.'},{name:'Arco',abbreviation:'Arco'},{name:'Archivolto',abbreviation:'Acv.'},{name:'Arena',abbreviation:'Arena'},{name:'Argine',abbreviation:'Argine'},{name:'Bacino',abbreviation:'Bacino'},{name:'Banchi',abbreviation:'Banchi'},{name:'Banchina',abbreviation:'Ban.'},{name:'Bastioni',abbreviation:'Bas.'},{name:'Belvedere',abbreviation:'Belv.'},{name:'Borgata',abbreviation:'B.ta'},{name:'Borgo',abbreviation:'B.go'},{name:'Calata',abbreviation:'Cal.'},{name:'Calle',abbreviation:'Calle'},{name:'Campiello',abbreviation:'Cam.'},{name:'Campo',abbreviation:'Cam.'},{name:'Canale',abbreviation:'Can.'},{name:'Carraia',abbreviation:'Carr.'},{name:'Cascina',abbreviation:'Cascina'},{name:'Case sparse',abbreviation:'c.s.'},{name:'Cavalcavia',abbreviation:'Cv.'},{name:'Circonvallazione',abbreviation:'Cv.'},{name:'Complanare',abbreviation:'C.re'},{name:'Contrada',abbreviation:'C.da'},{name:'Corso',abbreviation:'C.so'},{name:'Corte',abbreviation:'C.te'},{name:'Cortile',abbreviation:'C.le'},{name:'Diramazione',abbreviation:'Dir.'},{name:'Fondaco',abbreviation:'F.co'},{name:'Fondamenta',abbreviation:'F.ta'},{name:'Fondo',abbreviation:'F.do'},{name:'Frazione',abbreviation:'Fr.'},{name:'Isola',abbreviation:'Is.'},{name:'Largo',abbreviation:'L.go'},{name:'Litoranea',abbreviation:'Lit.'},{name:'Lungolago',abbreviation:'L.go lago'},{name:'Lungo Po',abbreviation:'l.go Po'},{name:'Molo',abbreviation:'Molo'},{name:'Mura',abbreviation:'Mura'},{name:'Passaggio privato',abbreviation:'pass. priv.'},{name:'Passeggiata',abbreviation:'Pass.'},{name:'Piazza',abbreviation:'P.zza'},{name:'Piazzale',abbreviation:'P.le'},{name:'Ponte',abbreviation:'P.te'},{name:'Portico',abbreviation:'P.co'},{name:'Rampa',abbreviation:'Rampa'},{name:'Regione',abbreviation:'Reg.'},{name:'Rione',abbreviation:'R.ne'},{name:'Rio',abbreviation:'Rio'},{name:'Ripa',abbreviation:'Ripa'},{name:'Riva',abbreviation:'Riva'},{name:'Rondò',abbreviation:'Rondò'},{name:'Rotonda',abbreviation:'Rot.'},{name:'Sagrato',abbreviation:'Sagr.'},{name:'Salita',abbreviation:'Sal.'},{name:'Scalinata',abbreviation:'Scal.'},{name:'Scalone',abbreviation:'Scal.'},{name:'Slargo',abbreviation:'Sl.'},{name:'Sottoportico',abbreviation:'Sott.'},{name:'Strada',abbreviation:'Str.'},{name:'Stradale',abbreviation:'Str.le'},{name:'Strettoia',abbreviation:'Strett.'},{name:'Traversa',abbreviation:'Trav.'},{name:'Via',abbreviation:'V.'},{name:'Viale',abbreviation:'V.le'},{name:'Vicinale',abbreviation:'Vic.le'},{name:'Vicolo',abbreviation:'Vic.'}],'uk':[{name:'Avenue',abbreviation:'Ave'},{name:'Close',abbreviation:'Cl'},{name:'Court',abbreviation:'Ct'},{name:'Crescent',abbreviation:'Cr'},{name:'Drive',abbreviation:'Dr'},{name:'Garden',abbreviation:'Gdn'},{name:'Gardens',abbreviation:'Gdns'},{name:'Green',abbreviation:'Gn'},{name:'Grove',abbreviation:'Gr'},{name:'Lane',abbreviation:'Ln'},{name:'Mount',abbreviation:'Mt'},{name:'Place',abbreviation:'Pl'},{name:'Park',abbreviation:'Pk'},{name:'Ridge',abbreviation:'Rdg'},{name:'Road',abbreviation:'Rd'},{name:'Square',abbreviation:'Sq'},{name:'Street',abbreviation:'St'},{name:'Terrace',abbreviation:'Ter'},{name:'Valley',abbreviation:'Val'}]},months:[{name:'January',short_name:'Jan',numeric:'01',days:31},{name:'February',short_name:'Feb',numeric:'02',days:28},{name:'March',short_name:'Mar',numeric:'03',days:31},{name:'April',short_name:'Apr',numeric:'04',days:30},{name:'May',short_name:'May',numeric:'05',days:31},{name:'June',short_name:'Jun',numeric:'06',days:30},{name:'July',short_name:'Jul',numeric:'07',days:31},{name:'August',short_name:'Aug',numeric:'08',days:31},{name:'September',short_name:'Sep',numeric:'09',days:30},{name:'October',short_name:'Oct',numeric:'10',days:31},{name:'November',short_name:'Nov',numeric:'11',days:30},{name:'December',short_name:'Dec',numeric:'12',days:31}],cc_types:[{name:"American Express",short_name:'amex',prefix:'34',length:15},{name:"Bankcard",short_name:'bankcard',prefix:'5610',length:16},{name:"China UnionPay",short_name:'chinaunion',prefix:'62',length:16},{name:"Diners Club Carte Blanche",short_name:'dccarte',prefix:'300',length:14},{name:"Diners Club enRoute",short_name:'dcenroute',prefix:'2014',length:15},{name:"Diners Club International",short_name:'dcintl',prefix:'36',length:14},{name:"Diners Club United States & Canada",short_name:'dcusc',prefix:'54',length:16},{name:"Discover Card",short_name:'discover',prefix:'6011',length:16},{name:"InstaPayment",short_name:'instapay',prefix:'637',length:16},{name:"JCB",short_name:'jcb',prefix:'3528',length:16},{name:"Laser",short_name:'laser',prefix:'6304',length:16},{name:"Maestro",short_name:'maestro',prefix:'5018',length:16},{name:"Mastercard",short_name:'mc',prefix:'51',length:16},{name:"Solo",short_name:'solo',prefix:'6334',length:16},{name:"Switch",short_name:'switch',prefix:'4903',length:16},{name:"Visa",short_name:'visa',prefix:'4',length:16},{name:"Visa Electron",short_name:'electron',prefix:'4026',length:16}],currency_types:[{'code':'AED','name':'United Arab Emirates Dirham'},{'code':'AFN','name':'Afghanistan Afghani'},{'code':'ALL','name':'Albania Lek'},{'code':'AMD','name':'Armenia Dram'},{'code':'ANG','name':'Netherlands Antilles Guilder'},{'code':'AOA','name':'Angola Kwanza'},{'code':'ARS','name':'Argentina Peso'},{'code':'AUD','name':'Australia Dollar'},{'code':'AWG','name':'Aruba Guilder'},{'code':'AZN','name':'Azerbaijan New Manat'},{'code':'BAM','name':'Bosnia and Herzegovina Convertible Marka'},{'code':'BBD','name':'Barbados Dollar'},{'code':'BDT','name':'Bangladesh Taka'},{'code':'BGN','name':'Bulgaria Lev'},{'code':'BHD','name':'Bahrain Dinar'},{'code':'BIF','name':'Burundi Franc'},{'code':'BMD','name':'Bermuda Dollar'},{'code':'BND','name':'Brunei Darussalam Dollar'},{'code':'BOB','name':'Bolivia Boliviano'},{'code':'BRL','name':'Brazil Real'},{'code':'BSD','name':'Bahamas Dollar'},{'code':'BTN','name':'Bhutan Ngultrum'},{'code':'BWP','name':'Botswana Pula'},{'code':'BYR','name':'Belarus Ruble'},{'code':'BZD','name':'Belize Dollar'},{'code':'CAD','name':'Canada Dollar'},{'code':'CDF','name':'Congo/Kinshasa Franc'},{'code':'CHF','name':'Switzerland Franc'},{'code':'CLP','name':'Chile Peso'},{'code':'CNY','name':'China Yuan Renminbi'},{'code':'COP','name':'Colombia Peso'},{'code':'CRC','name':'Costa Rica Colon'},{'code':'CUC','name':'Cuba Convertible Peso'},{'code':'CUP','name':'Cuba Peso'},{'code':'CVE','name':'Cape Verde Escudo'},{'code':'CZK','name':'Czech Republic Koruna'},{'code':'DJF','name':'Djibouti Franc'},{'code':'DKK','name':'Denmark Krone'},{'code':'DOP','name':'Dominican Republic Peso'},{'code':'DZD','name':'Algeria Dinar'},{'code':'EGP','name':'Egypt Pound'},{'code':'ERN','name':'Eritrea Nakfa'},{'code':'ETB','name':'Ethiopia Birr'},{'code':'EUR','name':'Euro Member Countries'},{'code':'FJD','name':'Fiji Dollar'},{'code':'FKP','name':'Falkland Islands (Malvinas) Pound'},{'code':'GBP','name':'United Kingdom Pound'},{'code':'GEL','name':'Georgia Lari'},{'code':'GGP','name':'Guernsey Pound'},{'code':'GHS','name':'Ghana Cedi'},{'code':'GIP','name':'Gibraltar Pound'},{'code':'GMD','name':'Gambia Dalasi'},{'code':'GNF','name':'Guinea Franc'},{'code':'GTQ','name':'Guatemala Quetzal'},{'code':'GYD','name':'Guyana Dollar'},{'code':'HKD','name':'Hong Kong Dollar'},{'code':'HNL','name':'Honduras Lempira'},{'code':'HRK','name':'Croatia Kuna'},{'code':'HTG','name':'Haiti Gourde'},{'code':'HUF','name':'Hungary Forint'},{'code':'IDR','name':'Indonesia Rupiah'},{'code':'ILS','name':'Israel Shekel'},{'code':'IMP','name':'Isle of Man Pound'},{'code':'INR','name':'India Rupee'},{'code':'IQD','name':'Iraq Dinar'},{'code':'IRR','name':'Iran Rial'},{'code':'ISK','name':'Iceland Krona'},{'code':'JEP','name':'Jersey Pound'},{'code':'JMD','name':'Jamaica Dollar'},{'code':'JOD','name':'Jordan Dinar'},{'code':'JPY','name':'Japan Yen'},{'code':'KES','name':'Kenya Shilling'},{'code':'KGS','name':'Kyrgyzstan Som'},{'code':'KHR','name':'Cambodia Riel'},{'code':'KMF','name':'Comoros Franc'},{'code':'KPW','name':'Korea (North) Won'},{'code':'KRW','name':'Korea (South) Won'},{'code':'KWD','name':'Kuwait Dinar'},{'code':'KYD','name':'Cayman Islands Dollar'},{'code':'KZT','name':'Kazakhstan Tenge'},{'code':'LAK','name':'Laos Kip'},{'code':'LBP','name':'Lebanon Pound'},{'code':'LKR','name':'Sri Lanka Rupee'},{'code':'LRD','name':'Liberia Dollar'},{'code':'LSL','name':'Lesotho Loti'},{'code':'LTL','name':'Lithuania Litas'},{'code':'LYD','name':'Libya Dinar'},{'code':'MAD','name':'Morocco Dirham'},{'code':'MDL','name':'Moldova Leu'},{'code':'MGA','name':'Madagascar Ariary'},{'code':'MKD','name':'Macedonia Denar'},{'code':'MMK','name':'Myanmar (Burma) Kyat'},{'code':'MNT','name':'Mongolia Tughrik'},{'code':'MOP','name':'Macau Pataca'},{'code':'MRO','name':'Mauritania Ouguiya'},{'code':'MUR','name':'Mauritius Rupee'},{'code':'MVR','name':'Maldives (Maldive Islands) Rufiyaa'},{'code':'MWK','name':'Malawi Kwacha'},{'code':'MXN','name':'Mexico Peso'},{'code':'MYR','name':'Malaysia Ringgit'},{'code':'MZN','name':'Mozambique Metical'},{'code':'NAD','name':'Namibia Dollar'},{'code':'NGN','name':'Nigeria Naira'},{'code':'NIO','name':'Nicaragua Cordoba'},{'code':'NOK','name':'Norway Krone'},{'code':'NPR','name':'Nepal Rupee'},{'code':'NZD','name':'New Zealand Dollar'},{'code':'OMR','name':'Oman Rial'},{'code':'PAB','name':'Panama Balboa'},{'code':'PEN','name':'Peru Nuevo Sol'},{'code':'PGK','name':'Papua New Guinea Kina'},{'code':'PHP','name':'Philippines Peso'},{'code':'PKR','name':'Pakistan Rupee'},{'code':'PLN','name':'Poland Zloty'},{'code':'PYG','name':'Paraguay Guarani'},{'code':'QAR','name':'Qatar Riyal'},{'code':'RON','name':'Romania New Leu'},{'code':'RSD','name':'Serbia Dinar'},{'code':'RUB','name':'Russia Ruble'},{'code':'RWF','name':'Rwanda Franc'},{'code':'SAR','name':'Saudi Arabia Riyal'},{'code':'SBD','name':'Solomon Islands Dollar'},{'code':'SCR','name':'Seychelles Rupee'},{'code':'SDG','name':'Sudan Pound'},{'code':'SEK','name':'Sweden Krona'},{'code':'SGD','name':'Singapore Dollar'},{'code':'SHP','name':'Saint Helena Pound'},{'code':'SLL','name':'Sierra Leone Leone'},{'code':'SOS','name':'Somalia Shilling'},{'code':'SPL','name':'Seborga Luigino'},{'code':'SRD','name':'Suriname Dollar'},{'code':'STD','name':'São Tomé and Príncipe Dobra'},{'code':'SVC','name':'El Salvador Colon'},{'code':'SYP','name':'Syria Pound'},{'code':'SZL','name':'Swaziland Lilangeni'},{'code':'THB','name':'Thailand Baht'},{'code':'TJS','name':'Tajikistan Somoni'},{'code':'TMT','name':'Turkmenistan Manat'},{'code':'TND','name':'Tunisia Dinar'},{'code':'TOP','name':'Tonga Pa\'anga'},{'code':'TRY','name':'Turkey Lira'},{'code':'TTD','name':'Trinidad and Tobago Dollar'},{'code':'TVD','name':'Tuvalu Dollar'},{'code':'TWD','name':'Taiwan New Dollar'},{'code':'TZS','name':'Tanzania Shilling'},{'code':'UAH','name':'Ukraine Hryvnia'},{'code':'UGX','name':'Uganda Shilling'},{'code':'USD','name':'United States Dollar'},{'code':'UYU','name':'Uruguay Peso'},{'code':'UZS','name':'Uzbekistan Som'},{'code':'VEF','name':'Venezuela Bolivar'},{'code':'VND','name':'Viet Nam Dong'},{'code':'VUV','name':'Vanuatu Vatu'},{'code':'WST','name':'Samoa Tala'},{'code':'XAF','name':'Communauté Financière Africaine (BEAC) CFA Franc BEAC'},{'code':'XCD','name':'East Caribbean Dollar'},{'code':'XDR','name':'International Monetary Fund (IMF) Special Drawing Rights'},{'code':'XOF','name':'Communauté Financière Africaine (BCEAO) Franc'},{'code':'XPF','name':'Comptoirs Français du Pacifique (CFP) Franc'},{'code':'YER','name':'Yemen Rial'},{'code':'ZAR','name':'South Africa Rand'},{'code':'ZMW','name':'Zambia Kwacha'},{'code':'ZWD','name':'Zimbabwe Dollar'}],colorNames:["AliceBlue","Black","Navy","DarkBlue","MediumBlue","Blue","DarkGreen","Green","Teal","DarkCyan","DeepSkyBlue","DarkTurquoise","MediumSpringGreen","Lime","SpringGreen","Aqua","Cyan","MidnightBlue","DodgerBlue","LightSeaGreen","ForestGreen","SeaGreen","DarkSlateGray","LimeGreen","MediumSeaGreen","Turquoise","RoyalBlue","SteelBlue","DarkSlateBlue","MediumTurquoise","Indigo","DarkOliveGreen","CadetBlue","CornflowerBlue","RebeccaPurple","MediumAquaMarine","DimGray","SlateBlue","OliveDrab","SlateGray","LightSlateGray","MediumSlateBlue","LawnGreen","Chartreuse","Aquamarine","Maroon","Purple","Olive","Gray","SkyBlue","LightSkyBlue","BlueViolet","DarkRed","DarkMagenta","SaddleBrown","Ivory","White","DarkSeaGreen","LightGreen","MediumPurple","DarkViolet","PaleGreen","DarkOrchid","YellowGreen","Sienna","Brown","DarkGray","LightBlue","GreenYellow","PaleTurquoise","LightSteelBlue","PowderBlue","FireBrick","DarkGoldenRod","MediumOrchid","RosyBrown","DarkKhaki","Silver","MediumVioletRed","IndianRed","Peru","Chocolate","Tan","LightGray","Thistle","Orchid","GoldenRod","PaleVioletRed","Crimson","Gainsboro","Plum","BurlyWood","LightCyan","Lavender","DarkSalmon","Violet","PaleGoldenRod","LightCoral","Khaki","AliceBlue","HoneyDew","Azure","SandyBrown","Wheat","Beige","WhiteSmoke","MintCream","GhostWhite","Salmon","AntiqueWhite","Linen","LightGoldenRodYellow","OldLace","Red","Fuchsia","Magenta","DeepPink","OrangeRed","Tomato","HotPink","Coral","DarkOrange","LightSalmon","Orange","LightPink","Pink","Gold","PeachPuff","NavajoWhite","Moccasin","Bisque","MistyRose","BlanchedAlmond","PapayaWhip","LavenderBlush","SeaShell","Cornsilk","LemonChiffon","FloralWhite","Snow","Yellow","LightYellow"],fileExtension:{"raster":["bmp","gif","gpl","ico","jpeg","psd","png","psp","raw","tiff"],"vector":["3dv","amf","awg","ai","cgm","cdr","cmx","dxf","e2d","egt","eps","fs","odg","svg","xar"],"3d":["3dmf","3dm","3mf","3ds","an8","aoi","blend","cal3d","cob","ctm","iob","jas","max","mb","mdx","obj","x","x3d"],"document":["doc","docx","dot","html","xml","odt","odm","ott","csv","rtf","tex","xhtml","xps"]},timezones:[{"name":"Dateline Standard Time","abbr":"DST","offset":-12,"isdst":false,"text":"(UTC-12:00) International Date Line West","utc":["Etc/GMT+12"]},{"name":"UTC-11","abbr":"U","offset":-11,"isdst":false,"text":"(UTC-11:00) Coordinated Universal Time-11","utc":["Etc/GMT+11","Pacific/Midway","Pacific/Niue","Pacific/Pago_Pago"]},{"name":"Hawaiian Standard Time","abbr":"HST","offset":-10,"isdst":false,"text":"(UTC-10:00) Hawaii","utc":["Etc/GMT+10","Pacific/Honolulu","Pacific/Johnston","Pacific/Rarotonga","Pacific/Tahiti"]},{"name":"Alaskan Standard Time","abbr":"AKDT","offset":-8,"isdst":true,"text":"(UTC-09:00) Alaska","utc":["America/Anchorage","America/Juneau","America/Nome","America/Sitka","America/Yakutat"]},{"name":"Pacific Standard Time (Mexico)","abbr":"PDT","offset":-7,"isdst":true,"text":"(UTC-08:00) Baja California","utc":["America/Santa_Isabel"]},{"name":"Pacific Standard Time","abbr":"PDT","offset":-7,"isdst":true,"text":"(UTC-08:00) Pacific Time (US & Canada)","utc":["America/Dawson","America/Los_Angeles","America/Tijuana","America/Vancouver","America/Whitehorse","PST8PDT"]},{"name":"US Mountain Standard Time","abbr":"UMST","offset":-7,"isdst":false,"text":"(UTC-07:00) Arizona","utc":["America/Creston","America/Dawson_Creek","America/Hermosillo","America/Phoenix","Etc/GMT+7"]},{"name":"Mountain Standard Time (Mexico)","abbr":"MDT","offset":-6,"isdst":true,"text":"(UTC-07:00) Chihuahua, La Paz, Mazatlan","utc":["America/Chihuahua","America/Mazatlan"]},{"name":"Mountain Standard Time","abbr":"MDT","offset":-6,"isdst":true,"text":"(UTC-07:00) Mountain Time (US & Canada)","utc":["America/Boise","America/Cambridge_Bay","America/Denver","America/Edmonton","America/Inuvik","America/Ojinaga","America/Yellowknife","MST7MDT"]},{"name":"Central America Standard Time","abbr":"CAST","offset":-6,"isdst":false,"text":"(UTC-06:00) Central America","utc":["America/Belize","America/Costa_Rica","America/El_Salvador","America/Guatemala","America/Managua","America/Tegucigalpa","Etc/GMT+6","Pacific/Galapagos"]},{"name":"Central Standard Time","abbr":"CDT","offset":-5,"isdst":true,"text":"(UTC-06:00) Central Time (US & Canada)","utc":["America/Chicago","America/Indiana/Knox","America/Indiana/Tell_City","America/Matamoros","America/Menominee","America/North_Dakota/Beulah","America/North_Dakota/Center","America/North_Dakota/New_Salem","America/Rainy_River","America/Rankin_Inlet","America/Resolute","America/Winnipeg","CST6CDT"]},{"name":"Central Standard Time (Mexico)","abbr":"CDT","offset":-5,"isdst":true,"text":"(UTC-06:00) Guadalajara, Mexico City, Monterrey","utc":["America/Bahia_Banderas","America/Cancun","America/Merida","America/Mexico_City","America/Monterrey"]},{"name":"Canada Central Standard Time","abbr":"CCST","offset":-6,"isdst":false,"text":"(UTC-06:00) Saskatchewan","utc":["America/Regina","America/Swift_Current"]},{"name":"SA Pacific Standard Time","abbr":"SPST","offset":-5,"isdst":false,"text":"(UTC-05:00) Bogota, Lima, Quito","utc":["America/Bogota","America/Cayman","America/Coral_Harbour","America/Eirunepe","America/Guayaquil","America/Jamaica","America/Lima","America/Panama","America/Rio_Branco","Etc/GMT+5"]},{"name":"Eastern Standard Time","abbr":"EDT","offset":-4,"isdst":true,"text":"(UTC-05:00) Eastern Time (US & Canada)","utc":["America/Detroit","America/Havana","America/Indiana/Petersburg","America/Indiana/Vincennes","America/Indiana/Winamac","America/Iqaluit","America/Kentucky/Monticello","America/Louisville","America/Montreal","America/Nassau","America/New_York","America/Nipigon","America/Pangnirtung","America/Port-au-Prince","America/Thunder_Bay","America/Toronto","EST5EDT"]},{"name":"US Eastern Standard Time","abbr":"UEDT","offset":-4,"isdst":true,"text":"(UTC-05:00) Indiana (East)","utc":["America/Indiana/Marengo","America/Indiana/Vevay","America/Indianapolis"]},{"name":"Venezuela Standard Time","abbr":"VST","offset":-4.5,"isdst":false,"text":"(UTC-04:30) Caracas","utc":["America/Caracas"]},{"name":"Paraguay Standard Time","abbr":"PST","offset":-4,"isdst":false,"text":"(UTC-04:00) Asuncion","utc":["America/Asuncion"]},{"name":"Atlantic Standard Time","abbr":"ADT","offset":-3,"isdst":true,"text":"(UTC-04:00) Atlantic Time (Canada)","utc":["America/Glace_Bay","America/Goose_Bay","America/Halifax","America/Moncton","America/Thule","Atlantic/Bermuda"]},{"name":"Central Brazilian Standard Time","abbr":"CBST","offset":-4,"isdst":false,"text":"(UTC-04:00) Cuiaba","utc":["America/Campo_Grande","America/Cuiaba"]},{"name":"SA Western Standard Time","abbr":"SWST","offset":-4,"isdst":false,"text":"(UTC-04:00) Georgetown, La Paz, Manaus, San Juan","utc":["America/Anguilla","America/Antigua","America/Aruba","America/Barbados","America/Blanc-Sablon","America/Boa_Vista","America/Curacao","America/Dominica","America/Grand_Turk","America/Grenada","America/Guadeloupe","America/Guyana","America/Kralendijk","America/La_Paz","America/Lower_Princes","America/Manaus","America/Marigot","America/Martinique","America/Montserrat","America/Port_of_Spain","America/Porto_Velho","America/Puerto_Rico","America/Santo_Domingo","America/St_Barthelemy","America/St_Kitts","America/St_Lucia","America/St_Thomas","America/St_Vincent","America/Tortola","Etc/GMT+4"]},{"name":"Pacific SA Standard Time","abbr":"PSST","offset":-4,"isdst":false,"text":"(UTC-04:00) Santiago","utc":["America/Santiago","Antarctica/Palmer"]},{"name":"Newfoundland Standard Time","abbr":"NDT","offset":-2.5,"isdst":true,"text":"(UTC-03:30) Newfoundland","utc":["America/St_Johns"]},{"name":"E. South America Standard Time","abbr":"ESAST","offset":-3,"isdst":false,"text":"(UTC-03:00) Brasilia","utc":["America/Sao_Paulo"]},{"name":"Argentina Standard Time","abbr":"AST","offset":-3,"isdst":false,"text":"(UTC-03:00) Buenos Aires","utc":["America/Argentina/La_Rioja","America/Argentina/Rio_Gallegos","America/Argentina/Salta","America/Argentina/San_Juan","America/Argentina/San_Luis","America/Argentina/Tucuman","America/Argentina/Ushuaia","America/Buenos_Aires","America/Catamarca","America/Cordoba","America/Jujuy","America/Mendoza"]},{"name":"SA Eastern Standard Time","abbr":"SEST","offset":-3,"isdst":false,"text":"(UTC-03:00) Cayenne, Fortaleza","utc":["America/Araguaina","America/Belem","America/Cayenne","America/Fortaleza","America/Maceio","America/Paramaribo","America/Recife","America/Santarem","Antarctica/Rothera","Atlantic/Stanley","Etc/GMT+3"]},{"name":"Greenland Standard Time","abbr":"GDT","offset":-2,"isdst":true,"text":"(UTC-03:00) Greenland","utc":["America/Godthab"]},{"name":"Montevideo Standard Time","abbr":"MST","offset":-3,"isdst":false,"text":"(UTC-03:00) Montevideo","utc":["America/Montevideo"]},{"name":"Bahia Standard Time","abbr":"BST","offset":-3,"isdst":false,"text":"(UTC-03:00) Salvador","utc":["America/Bahia"]},{"name":"UTC-02","abbr":"U","offset":-2,"isdst":false,"text":"(UTC-02:00) Coordinated Universal Time-02","utc":["America/Noronha","Atlantic/South_Georgia","Etc/GMT+2"]},{"name":"Mid-Atlantic Standard Time","abbr":"MDT","offset":-1,"isdst":true,"text":"(UTC-02:00) Mid-Atlantic - Old"},{"name":"Azores Standard Time","abbr":"ADT","offset":0,"isdst":true,"text":"(UTC-01:00) Azores","utc":["America/Scoresbysund","Atlantic/Azores"]},{"name":"Cape Verde Standard Time","abbr":"CVST","offset":-1,"isdst":false,"text":"(UTC-01:00) Cape Verde Is.","utc":["Atlantic/Cape_Verde","Etc/GMT+1"]},{"name":"Morocco Standard Time","abbr":"MDT","offset":1,"isdst":true,"text":"(UTC) Casablanca","utc":["Africa/Casablanca","Africa/El_Aaiun"]},{"name":"UTC","abbr":"CUT","offset":0,"isdst":false,"text":"(UTC) Coordinated Universal Time","utc":["America/Danmarkshavn","Etc/GMT"]},{"name":"GMT Standard Time","abbr":"GDT","offset":1,"isdst":true,"text":"(UTC) Dublin, Edinburgh, Lisbon, London","utc":["Atlantic/Canary","Atlantic/Faeroe","Atlantic/Madeira","Europe/Dublin","Europe/Guernsey","Europe/Isle_of_Man","Europe/Jersey","Europe/Lisbon","Europe/London"]},{"name":"Greenwich Standard Time","abbr":"GST","offset":0,"isdst":false,"text":"(UTC) Monrovia, Reykjavik","utc":["Africa/Abidjan","Africa/Accra","Africa/Bamako","Africa/Banjul","Africa/Bissau","Africa/Conakry","Africa/Dakar","Africa/Freetown","Africa/Lome","Africa/Monrovia","Africa/Nouakchott","Africa/Ouagadougou","Africa/Sao_Tome","Atlantic/Reykjavik","Atlantic/St_Helena"]},{"name":"W. Europe Standard Time","abbr":"WEDT","offset":2,"isdst":true,"text":"(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna","utc":["Arctic/Longyearbyen","Europe/Amsterdam","Europe/Andorra","Europe/Berlin","Europe/Busingen","Europe/Gibraltar","Europe/Luxembourg","Europe/Malta","Europe/Monaco","Europe/Oslo","Europe/Rome","Europe/San_Marino","Europe/Stockholm","Europe/Vaduz","Europe/Vatican","Europe/Vienna","Europe/Zurich"]},{"name":"Central Europe Standard Time","abbr":"CEDT","offset":2,"isdst":true,"text":"(UTC+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague","utc":["Europe/Belgrade","Europe/Bratislava","Europe/Budapest","Europe/Ljubljana","Europe/Podgorica","Europe/Prague","Europe/Tirane"]},{"name":"Romance Standard Time","abbr":"RDT","offset":2,"isdst":true,"text":"(UTC+01:00) Brussels, Copenhagen, Madrid, Paris","utc":["Africa/Ceuta","Europe/Brussels","Europe/Copenhagen","Europe/Madrid","Europe/Paris"]},{"name":"Central European Standard Time","abbr":"CEDT","offset":2,"isdst":true,"text":"(UTC+01:00) Sarajevo, Skopje, Warsaw, Zagreb","utc":["Europe/Sarajevo","Europe/Skopje","Europe/Warsaw","Europe/Zagreb"]},{"name":"W. Central Africa Standard Time","abbr":"WCAST","offset":1,"isdst":false,"text":"(UTC+01:00) West Central Africa","utc":["Africa/Algiers","Africa/Bangui","Africa/Brazzaville","Africa/Douala","Africa/Kinshasa","Africa/Lagos","Africa/Libreville","Africa/Luanda","Africa/Malabo","Africa/Ndjamena","Africa/Niamey","Africa/Porto-Novo","Africa/Tunis","Etc/GMT-1"]},{"name":"Namibia Standard Time","abbr":"NST","offset":1,"isdst":false,"text":"(UTC+01:00) Windhoek","utc":["Africa/Windhoek"]},{"name":"GTB Standard Time","abbr":"GDT","offset":3,"isdst":true,"text":"(UTC+02:00) Athens, Bucharest","utc":["Asia/Nicosia","Europe/Athens","Europe/Bucharest","Europe/Chisinau"]},{"name":"Middle East Standard Time","abbr":"MEDT","offset":3,"isdst":true,"text":"(UTC+02:00) Beirut","utc":["Asia/Beirut"]},{"name":"Egypt Standard Time","abbr":"EST","offset":2,"isdst":false,"text":"(UTC+02:00) Cairo","utc":["Africa/Cairo"]},{"name":"Syria Standard Time","abbr":"SDT","offset":3,"isdst":true,"text":"(UTC+02:00) Damascus","utc":["Asia/Damascus"]},{"name":"E. Europe Standard Time","abbr":"EEDT","offset":3,"isdst":true,"text":"(UTC+02:00) E. Europe"},{"name":"South Africa Standard Time","abbr":"SAST","offset":2,"isdst":false,"text":"(UTC+02:00) Harare, Pretoria","utc":["Africa/Blantyre","Africa/Bujumbura","Africa/Gaborone","Africa/Harare","Africa/Johannesburg","Africa/Kigali","Africa/Lubumbashi","Africa/Lusaka","Africa/Maputo","Africa/Maseru","Africa/Mbabane","Etc/GMT-2"]},{"name":"FLE Standard Time","abbr":"FDT","offset":3,"isdst":true,"text":"(UTC+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius","utc":["Europe/Helsinki","Europe/Kiev","Europe/Mariehamn","Europe/Riga","Europe/Sofia","Europe/Tallinn","Europe/Uzhgorod","Europe/Vilnius","Europe/Zaporozhye"]},{"name":"Turkey Standard Time","abbr":"TDT","offset":3,"isdst":true,"text":"(UTC+02:00) Istanbul","utc":["Europe/Istanbul"]},{"name":"Israel Standard Time","abbr":"JDT","offset":3,"isdst":true,"text":"(UTC+02:00) Jerusalem","utc":["Asia/Jerusalem"]},{"name":"Libya Standard Time","abbr":"LST","offset":2,"isdst":false,"text":"(UTC+02:00) Tripoli","utc":["Africa/Tripoli"]},{"name":"Jordan Standard Time","abbr":"JST","offset":3,"isdst":false,"text":"(UTC+03:00) Amman","utc":["Asia/Amman"]},{"name":"Arabic Standard Time","abbr":"AST","offset":3,"isdst":false,"text":"(UTC+03:00) Baghdad","utc":["Asia/Baghdad"]},{"name":"Kaliningrad Standard Time","abbr":"KST","offset":3,"isdst":false,"text":"(UTC+03:00) Kaliningrad, Minsk","utc":["Europe/Kaliningrad","Europe/Minsk"]},{"name":"Arab Standard Time","abbr":"AST","offset":3,"isdst":false,"text":"(UTC+03:00) Kuwait, Riyadh","utc":["Asia/Aden","Asia/Bahrain","Asia/Kuwait","Asia/Qatar","Asia/Riyadh"]},{"name":"E. Africa Standard Time","abbr":"EAST","offset":3,"isdst":false,"text":"(UTC+03:00) Nairobi","utc":["Africa/Addis_Ababa","Africa/Asmera","Africa/Dar_es_Salaam","Africa/Djibouti","Africa/Juba","Africa/Kampala","Africa/Khartoum","Africa/Mogadishu","Africa/Nairobi","Antarctica/Syowa","Etc/GMT-3","Indian/Antananarivo","Indian/Comoro","Indian/Mayotte"]},{"name":"Iran Standard Time","abbr":"IDT","offset":4.5,"isdst":true,"text":"(UTC+03:30) Tehran","utc":["Asia/Tehran"]},{"name":"Arabian Standard Time","abbr":"AST","offset":4,"isdst":false,"text":"(UTC+04:00) Abu Dhabi, Muscat","utc":["Asia/Dubai","Asia/Muscat","Etc/GMT-4"]},{"name":"Azerbaijan Standard Time","abbr":"ADT","offset":5,"isdst":true,"text":"(UTC+04:00) Baku","utc":["Asia/Baku"]},{"name":"Russian Standard Time","abbr":"RST","offset":4,"isdst":false,"text":"(UTC+04:00) Moscow, St. Petersburg, Volgograd","utc":["Europe/Moscow","Europe/Samara","Europe/Simferopol","Europe/Volgograd"]},{"name":"Mauritius Standard Time","abbr":"MST","offset":4,"isdst":false,"text":"(UTC+04:00) Port Louis","utc":["Indian/Mahe","Indian/Mauritius","Indian/Reunion"]},{"name":"Georgian Standard Time","abbr":"GST","offset":4,"isdst":false,"text":"(UTC+04:00) Tbilisi","utc":["Asia/Tbilisi"]},{"name":"Caucasus Standard Time","abbr":"CST","offset":4,"isdst":false,"text":"(UTC+04:00) Yerevan","utc":["Asia/Yerevan"]},{"name":"Afghanistan Standard Time","abbr":"AST","offset":4.5,"isdst":false,"text":"(UTC+04:30) Kabul","utc":["Asia/Kabul"]},{"name":"West Asia Standard Time","abbr":"WAST","offset":5,"isdst":false,"text":"(UTC+05:00) Ashgabat, Tashkent","utc":["Antarctica/Mawson","Asia/Aqtau","Asia/Aqtobe","Asia/Ashgabat","Asia/Dushanbe","Asia/Oral","Asia/Samarkand","Asia/Tashkent","Etc/GMT-5","Indian/Kerguelen","Indian/Maldives"]},{"name":"Pakistan Standard Time","abbr":"PST","offset":5,"isdst":false,"text":"(UTC+05:00) Islamabad, Karachi","utc":["Asia/Karachi"]},{"name":"India Standard Time","abbr":"IST","offset":5.5,"isdst":false,"text":"(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi","utc":["Asia/Calcutta"]},{"name":"Sri Lanka Standard Time","abbr":"SLST","offset":5.5,"isdst":false,"text":"(UTC+05:30) Sri Jayawardenepura","utc":["Asia/Colombo"]},{"name":"Nepal Standard Time","abbr":"NST","offset":5.75,"isdst":false,"text":"(UTC+05:45) Kathmandu","utc":["Asia/Katmandu"]},{"name":"Central Asia Standard Time","abbr":"CAST","offset":6,"isdst":false,"text":"(UTC+06:00) Astana","utc":["Antarctica/Vostok","Asia/Almaty","Asia/Bishkek","Asia/Qyzylorda","Asia/Urumqi","Etc/GMT-6","Indian/Chagos"]},{"name":"Bangladesh Standard Time","abbr":"BST","offset":6,"isdst":false,"text":"(UTC+06:00) Dhaka","utc":["Asia/Dhaka","Asia/Thimphu"]},{"name":"Ekaterinburg Standard Time","abbr":"EST","offset":6,"isdst":false,"text":"(UTC+06:00) Ekaterinburg","utc":["Asia/Yekaterinburg"]},{"name":"Myanmar Standard Time","abbr":"MST","offset":6.5,"isdst":false,"text":"(UTC+06:30) Yangon (Rangoon)","utc":["Asia/Rangoon","Indian/Cocos"]},{"name":"SE Asia Standard Time","abbr":"SAST","offset":7,"isdst":false,"text":"(UTC+07:00) Bangkok, Hanoi, Jakarta","utc":["Antarctica/Davis","Asia/Bangkok","Asia/Hovd","Asia/Jakarta","Asia/Phnom_Penh","Asia/Pontianak","Asia/Saigon","Asia/Vientiane","Etc/GMT-7","Indian/Christmas"]},{"name":"N. Central Asia Standard Time","abbr":"NCAST","offset":7,"isdst":false,"text":"(UTC+07:00) Novosibirsk","utc":["Asia/Novokuznetsk","Asia/Novosibirsk","Asia/Omsk"]},{"name":"China Standard Time","abbr":"CST","offset":8,"isdst":false,"text":"(UTC+08:00) Beijing, Chongqing, Hong Kong, Urumqi","utc":["Asia/Hong_Kong","Asia/Macau","Asia/Shanghai"]},{"name":"North Asia Standard Time","abbr":"NAST","offset":8,"isdst":false,"text":"(UTC+08:00) Krasnoyarsk","utc":["Asia/Krasnoyarsk"]},{"name":"Singapore Standard Time","abbr":"MPST","offset":8,"isdst":false,"text":"(UTC+08:00) Kuala Lumpur, Singapore","utc":["Asia/Brunei","Asia/Kuala_Lumpur","Asia/Kuching","Asia/Makassar","Asia/Manila","Asia/Singapore","Etc/GMT-8"]},{"name":"W. Australia Standard Time","abbr":"WAST","offset":8,"isdst":false,"text":"(UTC+08:00) Perth","utc":["Antarctica/Casey","Australia/Perth"]},{"name":"Taipei Standard Time","abbr":"TST","offset":8,"isdst":false,"text":"(UTC+08:00) Taipei","utc":["Asia/Taipei"]},{"name":"Ulaanbaatar Standard Time","abbr":"UST","offset":8,"isdst":false,"text":"(UTC+08:00) Ulaanbaatar","utc":["Asia/Choibalsan","Asia/Ulaanbaatar"]},{"name":"North Asia East Standard Time","abbr":"NAEST","offset":9,"isdst":false,"text":"(UTC+09:00) Irkutsk","utc":["Asia/Irkutsk"]},{"name":"Tokyo Standard Time","abbr":"TST","offset":9,"isdst":false,"text":"(UTC+09:00) Osaka, Sapporo, Tokyo","utc":["Asia/Dili","Asia/Jayapura","Asia/Tokyo","Etc/GMT-9","Pacific/Palau"]},{"name":"Korea Standard Time","abbr":"KST","offset":9,"isdst":false,"text":"(UTC+09:00) Seoul","utc":["Asia/Pyongyang","Asia/Seoul"]},{"name":"Cen. Australia Standard Time","abbr":"CAST","offset":9.5,"isdst":false,"text":"(UTC+09:30) Adelaide","utc":["Australia/Adelaide","Australia/Broken_Hill"]},{"name":"AUS Central Standard Time","abbr":"ACST","offset":9.5,"isdst":false,"text":"(UTC+09:30) Darwin","utc":["Australia/Darwin"]},{"name":"E. Australia Standard Time","abbr":"EAST","offset":10,"isdst":false,"text":"(UTC+10:00) Brisbane","utc":["Australia/Brisbane","Australia/Lindeman"]},{"name":"AUS Eastern Standard Time","abbr":"AEST","offset":10,"isdst":false,"text":"(UTC+10:00) Canberra, Melbourne, Sydney","utc":["Australia/Melbourne","Australia/Sydney"]},{"name":"West Pacific Standard Time","abbr":"WPST","offset":10,"isdst":false,"text":"(UTC+10:00) Guam, Port Moresby","utc":["Antarctica/DumontDUrville","Etc/GMT-10","Pacific/Guam","Pacific/Port_Moresby","Pacific/Saipan","Pacific/Truk"]},{"name":"Tasmania Standard Time","abbr":"TST","offset":10,"isdst":false,"text":"(UTC+10:00) Hobart","utc":["Australia/Currie","Australia/Hobart"]},{"name":"Yakutsk Standard Time","abbr":"YST","offset":10,"isdst":false,"text":"(UTC+10:00) Yakutsk","utc":["Asia/Chita","Asia/Khandyga","Asia/Yakutsk"]},{"name":"Central Pacific Standard Time","abbr":"CPST","offset":11,"isdst":false,"text":"(UTC+11:00) Solomon Is., New Caledonia","utc":["Antarctica/Macquarie","Etc/GMT-11","Pacific/Efate","Pacific/Guadalcanal","Pacific/Kosrae","Pacific/Noumea","Pacific/Ponape"]},{"name":"Vladivostok Standard Time","abbr":"VST","offset":11,"isdst":false,"text":"(UTC+11:00) Vladivostok","utc":["Asia/Sakhalin","Asia/Ust-Nera","Asia/Vladivostok"]},{"name":"New Zealand Standard Time","abbr":"NZST","offset":12,"isdst":false,"text":"(UTC+12:00) Auckland, Wellington","utc":["Antarctica/McMurdo","Pacific/Auckland"]},{"name":"UTC+12","abbr":"U","offset":12,"isdst":false,"text":"(UTC+12:00) Coordinated Universal Time+12","utc":["Etc/GMT-12","Pacific/Funafuti","Pacific/Kwajalein","Pacific/Majuro","Pacific/Nauru","Pacific/Tarawa","Pacific/Wake","Pacific/Wallis"]},{"name":"Fiji Standard Time","abbr":"FST","offset":12,"isdst":false,"text":"(UTC+12:00) Fiji","utc":["Pacific/Fiji"]},{"name":"Magadan Standard Time","abbr":"MST","offset":12,"isdst":false,"text":"(UTC+12:00) Magadan","utc":["Asia/Anadyr","Asia/Kamchatka","Asia/Magadan","Asia/Srednekolymsk"]},{"name":"Kamchatka Standard Time","abbr":"KDT","offset":13,"isdst":true,"text":"(UTC+12:00) Petropavlovsk-Kamchatsky - Old"},{"name":"Tonga Standard Time","abbr":"TST","offset":13,"isdst":false,"text":"(UTC+13:00) Nuku'alofa","utc":["Etc/GMT-13","Pacific/Enderbury","Pacific/Fakaofo","Pacific/Tongatapu"]},{"name":"Samoa Standard Time","abbr":"SST","offset":13,"isdst":false,"text":"(UTC+13:00) Samoa","utc":["Pacific/Apia"]}]};var o_hasOwnProperty=Object.prototype.hasOwnProperty;var o_keys=Object.keys||function(obj){var result=[];for(var key in obj){if(o_hasOwnProperty.call(obj,key)){result.push(key);}}return result;};function _copyObject(source,target){var keys=o_keys(source);var key;for(var i=0,l=keys.length;i<l;i++){key=keys[i];target[key]=source[key]||target[key];}}function _copyArray(source,target){for(var i=0,l=source.length;i<l;i++){target[i]=source[i];}}function copyObject(source,_target){var isArray=Array.isArray(source);var target=_target||(isArray?new Array(source.length):{});if(isArray){_copyArray(source,target);}else{_copyObject(source,target);}return target;}Chance.prototype.get=function(name){return copyObject(data[name]);};Chance.prototype.mac_address=function(options){options=initOptions(options);if(!options.separator){options.separator=options.networkVersion?".":":";}var mac_pool="ABCDEF1234567890",mac="";if(!options.networkVersion){mac=this.n(this.string,6,{pool:mac_pool,length:2}).join(options.separator);}else{mac=this.n(this.string,3,{pool:mac_pool,length:4}).join(options.separator);}return mac;};Chance.prototype.normal=function(options){options=initOptions(options,{mean:0,dev:1,pool:[]});testRange(options.pool.constructor!==Array,"Chance: The pool option must be a valid array.");if(options.pool.length>0){return this.normal_pool(options);}var s,u,v,norm,mean=options.mean,dev=options.dev;do{u=this.random()*2-1;v=this.random()*2-1;s=u*u+v*v;}while(s>=1);norm=u*Math.sqrt(-2*Math.log(s)/s);return dev*norm+mean;};Chance.prototype.normal_pool=function(options){var performanceCounter=0;do{var idx=Math.round(this.normal({mean:options.mean,dev:options.dev}));if(idx<options.pool.length&&idx>=0){return options.pool[idx];}else{performanceCounter++;}}while(performanceCounter<100);throw new RangeError("Chance: Your pool is too small for the given mean and standard deviation. Please adjust.");};Chance.prototype.radio=function(options){options=initOptions(options,{side:"?"});var fl="";switch(options.side.toLowerCase()){case"east":case"e":fl="W";break;case"west":case"w":fl="K";break;default:fl=this.character({pool:"KW"});break;}return fl+this.character({alpha:true,casing:"upper"})+this.character({alpha:true,casing:"upper"})+this.character({alpha:true,casing:"upper"});};Chance.prototype.set=function(name,values){if(typeof name==="string"){data[name]=values;}else{data=copyObject(name,data);}};Chance.prototype.tv=function(options){return this.radio(options);};Chance.prototype.cnpj=function(){var n=this.n(this.natural,8,{max:9});var d1=2+n[7]*6+n[6]*7+n[5]*8+n[4]*9+n[3]*2+n[2]*3+n[1]*4+n[0]*5;d1=11-d1%11;if(d1>=10){d1=0;}var d2=d1*2+3+n[7]*7+n[6]*8+n[5]*9+n[4]*2+n[3]*3+n[2]*4+n[1]*5+n[0]*6;d2=11-d2%11;if(d2>=10){d2=0;}return''+n[0]+n[1]+'.'+n[2]+n[3]+n[4]+'.'+n[5]+n[6]+n[7]+'/0001-'+d1+d2;};Chance.prototype.mersenne_twister=function(seed){return new MersenneTwister(seed);};Chance.prototype.blueimp_md5=function(){return new BlueImpMD5();};var MersenneTwister=function MersenneTwister(seed){if(seed===undefined){seed=Math.floor(Math.random()*Math.pow(10,13));}this.N=624;this.M=397;this.MATRIX_A=0x9908b0df;this.UPPER_MASK=0x80000000;this.LOWER_MASK=0x7fffffff;this.mt=new Array(this.N);this.mti=this.N+1;this.init_genrand(seed);};MersenneTwister.prototype.init_genrand=function(s){this.mt[0]=s>>>0;for(this.mti=1;this.mti<this.N;this.mti++){s=this.mt[this.mti-1]^this.mt[this.mti-1]>>>30;this.mt[this.mti]=(((s&0xffff0000)>>>16)*1812433253<<16)+(s&0x0000ffff)*1812433253+this.mti;this.mt[this.mti]>>>=0;}};MersenneTwister.prototype.init_by_array=function(init_key,key_length){var i=1,j=0,k,s;this.init_genrand(19650218);k=this.N>key_length?this.N:key_length;for(;k;k--){s=this.mt[i-1]^this.mt[i-1]>>>30;this.mt[i]=(this.mt[i]^(((s&0xffff0000)>>>16)*1664525<<16)+(s&0x0000ffff)*1664525)+init_key[j]+j;this.mt[i]>>>=0;i++;j++;if(i>=this.N){this.mt[0]=this.mt[this.N-1];i=1;}if(j>=key_length){j=0;}}for(k=this.N-1;k;k--){s=this.mt[i-1]^this.mt[i-1]>>>30;this.mt[i]=(this.mt[i]^(((s&0xffff0000)>>>16)*1566083941<<16)+(s&0x0000ffff)*1566083941)-i;this.mt[i]>>>=0;i++;if(i>=this.N){this.mt[0]=this.mt[this.N-1];i=1;}}this.mt[0]=0x80000000;};MersenneTwister.prototype.genrand_int32=function(){var y;var mag01=new Array(0x0,this.MATRIX_A);if(this.mti>=this.N){var kk;if(this.mti===this.N+1){this.init_genrand(5489);}for(kk=0;kk<this.N-this.M;kk++){y=this.mt[kk]&this.UPPER_MASK|this.mt[kk+1]&this.LOWER_MASK;this.mt[kk]=this.mt[kk+this.M]^y>>>1^mag01[y&0x1];}for(;kk<this.N-1;kk++){y=this.mt[kk]&this.UPPER_MASK|this.mt[kk+1]&this.LOWER_MASK;this.mt[kk]=this.mt[kk+(this.M-this.N)]^y>>>1^mag01[y&0x1];}y=this.mt[this.N-1]&this.UPPER_MASK|this.mt[0]&this.LOWER_MASK;this.mt[this.N-1]=this.mt[this.M-1]^y>>>1^mag01[y&0x1];this.mti=0;}y=this.mt[this.mti++];y^=y>>>11;y^=y<<7&0x9d2c5680;y^=y<<15&0xefc60000;y^=y>>>18;return y>>>0;};MersenneTwister.prototype.genrand_int31=function(){return this.genrand_int32()>>>1;};MersenneTwister.prototype.genrand_real1=function(){return this.genrand_int32()*(1.0/4294967295.0);};MersenneTwister.prototype.random=function(){return this.genrand_int32()*(1.0/4294967296.0);};MersenneTwister.prototype.genrand_real3=function(){return(this.genrand_int32()+0.5)*(1.0/4294967296.0);};MersenneTwister.prototype.genrand_res53=function(){var a=this.genrand_int32()>>>5,b=this.genrand_int32()>>>6;return(a*67108864.0+b)*(1.0/9007199254740992.0);};var BlueImpMD5=function BlueImpMD5(){};BlueImpMD5.prototype.VERSION='1.0.1';BlueImpMD5.prototype.safe_add=function safe_add(x,y){var lsw=(x&0xFFFF)+(y&0xFFFF),msw=(x>>16)+(y>>16)+(lsw>>16);return msw<<16|lsw&0xFFFF;};BlueImpMD5.prototype.bit_roll=function(num,cnt){return num<<cnt|num>>>32-cnt;};BlueImpMD5.prototype.md5_cmn=function(q,a,b,x,s,t){return this.safe_add(this.bit_roll(this.safe_add(this.safe_add(a,q),this.safe_add(x,t)),s),b);};BlueImpMD5.prototype.md5_ff=function(a,b,c,d,x,s,t){return this.md5_cmn(b&c|~b&d,a,b,x,s,t);};BlueImpMD5.prototype.md5_gg=function(a,b,c,d,x,s,t){return this.md5_cmn(b&d|c&~d,a,b,x,s,t);};BlueImpMD5.prototype.md5_hh=function(a,b,c,d,x,s,t){return this.md5_cmn(b^c^d,a,b,x,s,t);};BlueImpMD5.prototype.md5_ii=function(a,b,c,d,x,s,t){return this.md5_cmn(c^(b|~d),a,b,x,s,t);};BlueImpMD5.prototype.binl_md5=function(x,len){x[len>>5]|=0x80<<len%32;x[(len+64>>>9<<4)+14]=len;var i,olda,oldb,oldc,oldd,a=1732584193,b=-271733879,c=-1732584194,d=271733878;for(i=0;i<x.length;i+=16){olda=a;oldb=b;oldc=c;oldd=d;a=this.md5_ff(a,b,c,d,x[i],7,-680876936);d=this.md5_ff(d,a,b,c,x[i+1],12,-389564586);c=this.md5_ff(c,d,a,b,x[i+2],17,606105819);b=this.md5_ff(b,c,d,a,x[i+3],22,-1044525330);a=this.md5_ff(a,b,c,d,x[i+4],7,-176418897);d=this.md5_ff(d,a,b,c,x[i+5],12,1200080426);c=this.md5_ff(c,d,a,b,x[i+6],17,-1473231341);b=this.md5_ff(b,c,d,a,x[i+7],22,-45705983);a=this.md5_ff(a,b,c,d,x[i+8],7,1770035416);d=this.md5_ff(d,a,b,c,x[i+9],12,-1958414417);c=this.md5_ff(c,d,a,b,x[i+10],17,-42063);b=this.md5_ff(b,c,d,a,x[i+11],22,-1990404162);a=this.md5_ff(a,b,c,d,x[i+12],7,1804603682);d=this.md5_ff(d,a,b,c,x[i+13],12,-40341101);c=this.md5_ff(c,d,a,b,x[i+14],17,-1502002290);b=this.md5_ff(b,c,d,a,x[i+15],22,1236535329);a=this.md5_gg(a,b,c,d,x[i+1],5,-165796510);d=this.md5_gg(d,a,b,c,x[i+6],9,-1069501632);c=this.md5_gg(c,d,a,b,x[i+11],14,643717713);b=this.md5_gg(b,c,d,a,x[i],20,-373897302);a=this.md5_gg(a,b,c,d,x[i+5],5,-701558691);d=this.md5_gg(d,a,b,c,x[i+10],9,38016083);c=this.md5_gg(c,d,a,b,x[i+15],14,-660478335);b=this.md5_gg(b,c,d,a,x[i+4],20,-405537848);a=this.md5_gg(a,b,c,d,x[i+9],5,568446438);d=this.md5_gg(d,a,b,c,x[i+14],9,-1019803690);c=this.md5_gg(c,d,a,b,x[i+3],14,-187363961);b=this.md5_gg(b,c,d,a,x[i+8],20,1163531501);a=this.md5_gg(a,b,c,d,x[i+13],5,-1444681467);d=this.md5_gg(d,a,b,c,x[i+2],9,-51403784);c=this.md5_gg(c,d,a,b,x[i+7],14,1735328473);b=this.md5_gg(b,c,d,a,x[i+12],20,-1926607734);a=this.md5_hh(a,b,c,d,x[i+5],4,-378558);d=this.md5_hh(d,a,b,c,x[i+8],11,-2022574463);c=this.md5_hh(c,d,a,b,x[i+11],16,1839030562);b=this.md5_hh(b,c,d,a,x[i+14],23,-35309556);a=this.md5_hh(a,b,c,d,x[i+1],4,-1530992060);d=this.md5_hh(d,a,b,c,x[i+4],11,1272893353);c=this.md5_hh(c,d,a,b,x[i+7],16,-155497632);b=this.md5_hh(b,c,d,a,x[i+10],23,-1094730640);a=this.md5_hh(a,b,c,d,x[i+13],4,681279174);d=this.md5_hh(d,a,b,c,x[i],11,-358537222);c=this.md5_hh(c,d,a,b,x[i+3],16,-722521979);b=this.md5_hh(b,c,d,a,x[i+6],23,76029189);a=this.md5_hh(a,b,c,d,x[i+9],4,-640364487);d=this.md5_hh(d,a,b,c,x[i+12],11,-421815835);c=this.md5_hh(c,d,a,b,x[i+15],16,530742520);b=this.md5_hh(b,c,d,a,x[i+2],23,-995338651);a=this.md5_ii(a,b,c,d,x[i],6,-198630844);d=this.md5_ii(d,a,b,c,x[i+7],10,1126891415);c=this.md5_ii(c,d,a,b,x[i+14],15,-1416354905);b=this.md5_ii(b,c,d,a,x[i+5],21,-57434055);a=this.md5_ii(a,b,c,d,x[i+12],6,1700485571);d=this.md5_ii(d,a,b,c,x[i+3],10,-1894986606);c=this.md5_ii(c,d,a,b,x[i+10],15,-1051523);b=this.md5_ii(b,c,d,a,x[i+1],21,-2054922799);a=this.md5_ii(a,b,c,d,x[i+8],6,1873313359);d=this.md5_ii(d,a,b,c,x[i+15],10,-30611744);c=this.md5_ii(c,d,a,b,x[i+6],15,-1560198380);b=this.md5_ii(b,c,d,a,x[i+13],21,1309151649);a=this.md5_ii(a,b,c,d,x[i+4],6,-145523070);d=this.md5_ii(d,a,b,c,x[i+11],10,-1120210379);c=this.md5_ii(c,d,a,b,x[i+2],15,718787259);b=this.md5_ii(b,c,d,a,x[i+9],21,-343485551);a=this.safe_add(a,olda);b=this.safe_add(b,oldb);c=this.safe_add(c,oldc);d=this.safe_add(d,oldd);}return[a,b,c,d];};BlueImpMD5.prototype.binl2rstr=function(input){var i,output='';for(i=0;i<input.length*32;i+=8){output+=String.fromCharCode(input[i>>5]>>>i%32&0xFF);}return output;};BlueImpMD5.prototype.rstr2binl=function(input){var i,output=[];output[(input.length>>2)-1]=undefined;for(i=0;i<output.length;i+=1){output[i]=0;}for(i=0;i<input.length*8;i+=8){output[i>>5]|=(input.charCodeAt(i/8)&0xFF)<<i%32;}return output;};BlueImpMD5.prototype.rstr_md5=function(s){return this.binl2rstr(this.binl_md5(this.rstr2binl(s),s.length*8));};BlueImpMD5.prototype.rstr_hmac_md5=function(key,data){var i,bkey=this.rstr2binl(key),ipad=[],opad=[],hash;ipad[15]=opad[15]=undefined;if(bkey.length>16){bkey=this.binl_md5(bkey,key.length*8);}for(i=0;i<16;i+=1){ipad[i]=bkey[i]^0x36363636;opad[i]=bkey[i]^0x5C5C5C5C;}hash=this.binl_md5(ipad.concat(this.rstr2binl(data)),512+data.length*8);return this.binl2rstr(this.binl_md5(opad.concat(hash),512+128));};BlueImpMD5.prototype.rstr2hex=function(input){var hex_tab='0123456789abcdef',output='',x,i;for(i=0;i<input.length;i+=1){x=input.charCodeAt(i);output+=hex_tab.charAt(x>>>4&0x0F)+hex_tab.charAt(x&0x0F);}return output;};BlueImpMD5.prototype.str2rstr_utf8=function(input){return unescape(encodeURIComponent(input));};BlueImpMD5.prototype.raw_md5=function(s){return this.rstr_md5(this.str2rstr_utf8(s));};BlueImpMD5.prototype.hex_md5=function(s){return this.rstr2hex(this.raw_md5(s));};BlueImpMD5.prototype.raw_hmac_md5=function(k,d){return this.rstr_hmac_md5(this.str2rstr_utf8(k),this.str2rstr_utf8(d));};BlueImpMD5.prototype.hex_hmac_md5=function(k,d){return this.rstr2hex(this.raw_hmac_md5(k,d));};BlueImpMD5.prototype.md5=function(string,key,raw){if(!key){if(!raw){return this.hex_md5(string);}return this.raw_md5(string);}if(!raw){return this.hex_hmac_md5(key,string);}return this.raw_hmac_md5(key,string);};if(typeof exports!=='undefined'){if(typeof module!=='undefined'&&module.exports){exports=module.exports=Chance;}exports.Chance=Chance;}if(typeof define==='function'&&define.amd){define([],function(){return Chance;});}if(typeof importScripts!=='undefined'){chance=new Chance();}if((typeof window==='undefined'?'undefined':_typeof(window))==="object"&&_typeof(window.document)==="object"){window.Chance=Chance;window.chance=new Chance();}})();

}).call(this,require("buffer").Buffer)
},{"buffer":23}],9:[function(require,module,exports){
(function (global){
"use strict";var _typeof=typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"?function(obj){return typeof obj;}:function(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj;};(function(f){if((typeof exports==="undefined"?"undefined":_typeof(exports))==="object"&&typeof module!=="undefined"){module.exports=f();}else if(typeof define==="function"&&define.amd){define([],f);}else{var g;if(typeof window!=="undefined"){g=window;}else if(typeof global!=="undefined"){g=global;}else if(typeof self!=="undefined"){g=self;}else{g=this;}g.React=f();}})(function(){var define,module,exports;return function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f;}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e);},l,l.exports,e,t,n,r);}return n[o].exports;}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++){s(r[o]);}return s;}({1:[function(_dereq_,module,exports){'use strict';var EventPluginUtils=_dereq_(19);var ReactChildren=_dereq_(32);var ReactComponent=_dereq_(34);var ReactClass=_dereq_(33);var ReactContext=_dereq_(38);var ReactCurrentOwner=_dereq_(39);var ReactElement=_dereq_(57);var ReactElementValidator=_dereq_(58);var ReactDOM=_dereq_(40);var ReactDOMTextComponent=_dereq_(51);var ReactDefaultInjection=_dereq_(54);var ReactInstanceHandles=_dereq_(66);var ReactMount=_dereq_(70);var ReactPerf=_dereq_(75);var ReactPropTypes=_dereq_(78);var ReactReconciler=_dereq_(81);var ReactServerRendering=_dereq_(84);var assign=_dereq_(27);var findDOMNode=_dereq_(117);var onlyChild=_dereq_(144);ReactDefaultInjection.inject();var createElement=ReactElement.createElement;var createFactory=ReactElement.createFactory;var cloneElement=ReactElement.cloneElement;if("production"!=="development"){createElement=ReactElementValidator.createElement;createFactory=ReactElementValidator.createFactory;cloneElement=ReactElementValidator.cloneElement;}var render=ReactPerf.measure('React','render',ReactMount.render);var React={Children:{map:ReactChildren.map,forEach:ReactChildren.forEach,count:ReactChildren.count,only:onlyChild},Component:ReactComponent,DOM:ReactDOM,PropTypes:ReactPropTypes,initializeTouchEvents:function initializeTouchEvents(shouldUseTouch){EventPluginUtils.useTouchEvents=shouldUseTouch;},createClass:ReactClass.createClass,createElement:createElement,cloneElement:cloneElement,createFactory:createFactory,createMixin:function createMixin(mixin){return mixin;},constructAndRenderComponent:ReactMount.constructAndRenderComponent,constructAndRenderComponentByID:ReactMount.constructAndRenderComponentByID,findDOMNode:findDOMNode,render:render,renderToString:ReactServerRendering.renderToString,renderToStaticMarkup:ReactServerRendering.renderToStaticMarkup,unmountComponentAtNode:ReactMount.unmountComponentAtNode,isValidElement:ReactElement.isValidElement,withContext:ReactContext.withContext,__spread:assign};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__!=='undefined'&&typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.inject==='function'){__REACT_DEVTOOLS_GLOBAL_HOOK__.inject({CurrentOwner:ReactCurrentOwner,InstanceHandles:ReactInstanceHandles,Mount:ReactMount,Reconciler:ReactReconciler,TextComponent:ReactDOMTextComponent});}if("production"!=="development"){var ExecutionEnvironment=_dereq_(21);if(ExecutionEnvironment.canUseDOM&&window.top===window.self){if(navigator.userAgent.indexOf('Chrome')>-1){if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__==='undefined'){console.debug('Download the React DevTools for a better development experience: '+'https://fb.me/react-devtools');}}var expectedFeatures=[Array.isArray,Array.prototype.every,Array.prototype.forEach,Array.prototype.indexOf,Array.prototype.map,Date.now,Function.prototype.bind,Object.keys,String.prototype.split,String.prototype.trim,Object.create,Object.freeze];for(var i=0;i<expectedFeatures.length;i++){if(!expectedFeatures[i]){console.error('One or more ES5 shim/shams expected by React are not available: '+'https://fb.me/react-warning-polyfills');break;}}}}React.version='0.13.3';module.exports=React;},{"117":117,"144":144,"19":19,"21":21,"27":27,"32":32,"33":33,"34":34,"38":38,"39":39,"40":40,"51":51,"54":54,"57":57,"58":58,"66":66,"70":70,"75":75,"78":78,"81":81,"84":84}],2:[function(_dereq_,module,exports){'use strict';var focusNode=_dereq_(119);var AutoFocusMixin={componentDidMount:function componentDidMount(){if(this.props.autoFocus){focusNode(this.getDOMNode());}}};module.exports=AutoFocusMixin;},{"119":119}],3:[function(_dereq_,module,exports){'use strict';var EventConstants=_dereq_(15);var EventPropagators=_dereq_(20);var ExecutionEnvironment=_dereq_(21);var FallbackCompositionState=_dereq_(22);var SyntheticCompositionEvent=_dereq_(93);var SyntheticInputEvent=_dereq_(97);var keyOf=_dereq_(141);var END_KEYCODES=[9,13,27,32];var START_KEYCODE=229;var canUseCompositionEvent=ExecutionEnvironment.canUseDOM&&'CompositionEvent'in window;var documentMode=null;if(ExecutionEnvironment.canUseDOM&&'documentMode'in document){documentMode=document.documentMode;}var canUseTextInputEvent=ExecutionEnvironment.canUseDOM&&'TextEvent'in window&&!documentMode&&!isPresto();var useFallbackCompositionData=ExecutionEnvironment.canUseDOM&&(!canUseCompositionEvent||documentMode&&documentMode>8&&documentMode<=11);function isPresto(){var opera=window.opera;return(typeof opera==="undefined"?"undefined":_typeof(opera))==='object'&&typeof opera.version==='function'&&parseInt(opera.version(),10)<=12;}var SPACEBAR_CODE=32;var SPACEBAR_CHAR=String.fromCharCode(SPACEBAR_CODE);var topLevelTypes=EventConstants.topLevelTypes;var eventTypes={beforeInput:{phasedRegistrationNames:{bubbled:keyOf({onBeforeInput:null}),captured:keyOf({onBeforeInputCapture:null})},dependencies:[topLevelTypes.topCompositionEnd,topLevelTypes.topKeyPress,topLevelTypes.topTextInput,topLevelTypes.topPaste]},compositionEnd:{phasedRegistrationNames:{bubbled:keyOf({onCompositionEnd:null}),captured:keyOf({onCompositionEndCapture:null})},dependencies:[topLevelTypes.topBlur,topLevelTypes.topCompositionEnd,topLevelTypes.topKeyDown,topLevelTypes.topKeyPress,topLevelTypes.topKeyUp,topLevelTypes.topMouseDown]},compositionStart:{phasedRegistrationNames:{bubbled:keyOf({onCompositionStart:null}),captured:keyOf({onCompositionStartCapture:null})},dependencies:[topLevelTypes.topBlur,topLevelTypes.topCompositionStart,topLevelTypes.topKeyDown,topLevelTypes.topKeyPress,topLevelTypes.topKeyUp,topLevelTypes.topMouseDown]},compositionUpdate:{phasedRegistrationNames:{bubbled:keyOf({onCompositionUpdate:null}),captured:keyOf({onCompositionUpdateCapture:null})},dependencies:[topLevelTypes.topBlur,topLevelTypes.topCompositionUpdate,topLevelTypes.topKeyDown,topLevelTypes.topKeyPress,topLevelTypes.topKeyUp,topLevelTypes.topMouseDown]}};var hasSpaceKeypress=false;function isKeypressCommand(nativeEvent){return(nativeEvent.ctrlKey||nativeEvent.altKey||nativeEvent.metaKey)&&!(nativeEvent.ctrlKey&&nativeEvent.altKey);}function getCompositionEventType(topLevelType){switch(topLevelType){case topLevelTypes.topCompositionStart:return eventTypes.compositionStart;case topLevelTypes.topCompositionEnd:return eventTypes.compositionEnd;case topLevelTypes.topCompositionUpdate:return eventTypes.compositionUpdate;}}function isFallbackCompositionStart(topLevelType,nativeEvent){return topLevelType===topLevelTypes.topKeyDown&&nativeEvent.keyCode===START_KEYCODE;}function isFallbackCompositionEnd(topLevelType,nativeEvent){switch(topLevelType){case topLevelTypes.topKeyUp:return END_KEYCODES.indexOf(nativeEvent.keyCode)!==-1;case topLevelTypes.topKeyDown:return nativeEvent.keyCode!==START_KEYCODE;case topLevelTypes.topKeyPress:case topLevelTypes.topMouseDown:case topLevelTypes.topBlur:return true;default:return false;}}function getDataFromCustomEvent(nativeEvent){var detail=nativeEvent.detail;if((typeof detail==="undefined"?"undefined":_typeof(detail))==='object'&&'data'in detail){return detail.data;}return null;}var currentComposition=null;function extractCompositionEvent(topLevelType,topLevelTarget,topLevelTargetID,nativeEvent){var eventType;var fallbackData;if(canUseCompositionEvent){eventType=getCompositionEventType(topLevelType);}else if(!currentComposition){if(isFallbackCompositionStart(topLevelType,nativeEvent)){eventType=eventTypes.compositionStart;}}else if(isFallbackCompositionEnd(topLevelType,nativeEvent)){eventType=eventTypes.compositionEnd;}if(!eventType){return null;}if(useFallbackCompositionData){if(!currentComposition&&eventType===eventTypes.compositionStart){currentComposition=FallbackCompositionState.getPooled(topLevelTarget);}else if(eventType===eventTypes.compositionEnd){if(currentComposition){fallbackData=currentComposition.getData();}}}var event=SyntheticCompositionEvent.getPooled(eventType,topLevelTargetID,nativeEvent);if(fallbackData){event.data=fallbackData;}else{var customData=getDataFromCustomEvent(nativeEvent);if(customData!==null){event.data=customData;}}EventPropagators.accumulateTwoPhaseDispatches(event);return event;}function getNativeBeforeInputChars(topLevelType,nativeEvent){switch(topLevelType){case topLevelTypes.topCompositionEnd:return getDataFromCustomEvent(nativeEvent);case topLevelTypes.topKeyPress:var which=nativeEvent.which;if(which!==SPACEBAR_CODE){return null;}hasSpaceKeypress=true;return SPACEBAR_CHAR;case topLevelTypes.topTextInput:var chars=nativeEvent.data;if(chars===SPACEBAR_CHAR&&hasSpaceKeypress){return null;}return chars;default:return null;}}function getFallbackBeforeInputChars(topLevelType,nativeEvent){if(currentComposition){if(topLevelType===topLevelTypes.topCompositionEnd||isFallbackCompositionEnd(topLevelType,nativeEvent)){var chars=currentComposition.getData();FallbackCompositionState.release(currentComposition);currentComposition=null;return chars;}return null;}switch(topLevelType){case topLevelTypes.topPaste:return null;case topLevelTypes.topKeyPress:if(nativeEvent.which&&!isKeypressCommand(nativeEvent)){return String.fromCharCode(nativeEvent.which);}return null;case topLevelTypes.topCompositionEnd:return useFallbackCompositionData?null:nativeEvent.data;default:return null;}}function extractBeforeInputEvent(topLevelType,topLevelTarget,topLevelTargetID,nativeEvent){var chars;if(canUseTextInputEvent){chars=getNativeBeforeInputChars(topLevelType,nativeEvent);}else{chars=getFallbackBeforeInputChars(topLevelType,nativeEvent);}if(!chars){return null;}var event=SyntheticInputEvent.getPooled(eventTypes.beforeInput,topLevelTargetID,nativeEvent);event.data=chars;EventPropagators.accumulateTwoPhaseDispatches(event);return event;}var BeforeInputEventPlugin={eventTypes:eventTypes,extractEvents:function extractEvents(topLevelType,topLevelTarget,topLevelTargetID,nativeEvent){return[extractCompositionEvent(topLevelType,topLevelTarget,topLevelTargetID,nativeEvent),extractBeforeInputEvent(topLevelType,topLevelTarget,topLevelTargetID,nativeEvent)];}};module.exports=BeforeInputEventPlugin;},{"141":141,"15":15,"20":20,"21":21,"22":22,"93":93,"97":97}],4:[function(_dereq_,module,exports){'use strict';var isUnitlessNumber={boxFlex:true,boxFlexGroup:true,columnCount:true,flex:true,flexGrow:true,flexPositive:true,flexShrink:true,flexNegative:true,fontWeight:true,lineClamp:true,lineHeight:true,opacity:true,order:true,orphans:true,widows:true,zIndex:true,zoom:true,fillOpacity:true,strokeDashoffset:true,strokeOpacity:true,strokeWidth:true};function prefixKey(prefix,key){return prefix+key.charAt(0).toUpperCase()+key.substring(1);}var prefixes=['Webkit','ms','Moz','O'];Object.keys(isUnitlessNumber).forEach(function(prop){prefixes.forEach(function(prefix){isUnitlessNumber[prefixKey(prefix,prop)]=isUnitlessNumber[prop];});});var shorthandPropertyExpansions={background:{backgroundImage:true,backgroundPosition:true,backgroundRepeat:true,backgroundColor:true},border:{borderWidth:true,borderStyle:true,borderColor:true},borderBottom:{borderBottomWidth:true,borderBottomStyle:true,borderBottomColor:true},borderLeft:{borderLeftWidth:true,borderLeftStyle:true,borderLeftColor:true},borderRight:{borderRightWidth:true,borderRightStyle:true,borderRightColor:true},borderTop:{borderTopWidth:true,borderTopStyle:true,borderTopColor:true},font:{fontStyle:true,fontVariant:true,fontWeight:true,fontSize:true,lineHeight:true,fontFamily:true}};var CSSProperty={isUnitlessNumber:isUnitlessNumber,shorthandPropertyExpansions:shorthandPropertyExpansions};module.exports=CSSProperty;},{}],5:[function(_dereq_,module,exports){'use strict';var CSSProperty=_dereq_(4);var ExecutionEnvironment=_dereq_(21);var camelizeStyleName=_dereq_(108);var dangerousStyleValue=_dereq_(113);var hyphenateStyleName=_dereq_(133);var memoizeStringOnly=_dereq_(143);var warning=_dereq_(154);var processStyleName=memoizeStringOnly(function(styleName){return hyphenateStyleName(styleName);});var styleFloatAccessor='cssFloat';if(ExecutionEnvironment.canUseDOM){if(document.documentElement.style.cssFloat===undefined){styleFloatAccessor='styleFloat';}}if("production"!=="development"){var badVendoredStyleNamePattern=/^(?:webkit|moz|o)[A-Z]/;var badStyleValueWithSemicolonPattern=/;\s*$/;var warnedStyleNames={};var warnedStyleValues={};var warnHyphenatedStyleName=function warnHyphenatedStyleName(name){if(warnedStyleNames.hasOwnProperty(name)&&warnedStyleNames[name]){return;}warnedStyleNames[name]=true;"production"!=="development"?warning(false,'Unsupported style property %s. Did you mean %s?',name,camelizeStyleName(name)):null;};var warnBadVendoredStyleName=function warnBadVendoredStyleName(name){if(warnedStyleNames.hasOwnProperty(name)&&warnedStyleNames[name]){return;}warnedStyleNames[name]=true;"production"!=="development"?warning(false,'Unsupported vendor-prefixed style property %s. Did you mean %s?',name,name.charAt(0).toUpperCase()+name.slice(1)):null;};var warnStyleValueWithSemicolon=function warnStyleValueWithSemicolon(name,value){if(warnedStyleValues.hasOwnProperty(value)&&warnedStyleValues[value]){return;}warnedStyleValues[value]=true;"production"!=="development"?warning(false,'Style property values shouldn\'t contain a semicolon. '+'Try "%s: %s" instead.',name,value.replace(badStyleValueWithSemicolonPattern,'')):null;};var warnValidStyle=function warnValidStyle(name,value){if(name.indexOf('-')>-1){warnHyphenatedStyleName(name);}else if(badVendoredStyleNamePattern.test(name)){warnBadVendoredStyleName(name);}else if(badStyleValueWithSemicolonPattern.test(value)){warnStyleValueWithSemicolon(name,value);}};}var CSSPropertyOperations={createMarkupForStyles:function createMarkupForStyles(styles){var serialized='';for(var styleName in styles){if(!styles.hasOwnProperty(styleName)){continue;}var styleValue=styles[styleName];if("production"!=="development"){warnValidStyle(styleName,styleValue);}if(styleValue!=null){serialized+=processStyleName(styleName)+':';serialized+=dangerousStyleValue(styleName,styleValue)+';';}}return serialized||null;},setValueForStyles:function setValueForStyles(node,styles){var style=node.style;for(var styleName in styles){if(!styles.hasOwnProperty(styleName)){continue;}if("production"!=="development"){warnValidStyle(styleName,styles[styleName]);}var styleValue=dangerousStyleValue(styleName,styles[styleName]);if(styleName==='float'){styleName=styleFloatAccessor;}if(styleValue){style[styleName]=styleValue;}else{var expansion=CSSProperty.shorthandPropertyExpansions[styleName];if(expansion){for(var individualStyleName in expansion){style[individualStyleName]='';}}else{style[styleName]='';}}}}};module.exports=CSSPropertyOperations;},{"108":108,"113":113,"133":133,"143":143,"154":154,"21":21,"4":4}],6:[function(_dereq_,module,exports){'use strict';var PooledClass=_dereq_(28);var assign=_dereq_(27);var invariant=_dereq_(135);function CallbackQueue(){this._callbacks=null;this._contexts=null;}assign(CallbackQueue.prototype,{enqueue:function enqueue(callback,context){this._callbacks=this._callbacks||[];this._contexts=this._contexts||[];this._callbacks.push(callback);this._contexts.push(context);},notifyAll:function notifyAll(){var callbacks=this._callbacks;var contexts=this._contexts;if(callbacks){"production"!=="development"?invariant(callbacks.length===contexts.length,'Mismatched list of contexts in callback queue'):invariant(callbacks.length===contexts.length);this._callbacks=null;this._contexts=null;for(var i=0,l=callbacks.length;i<l;i++){callbacks[i].call(contexts[i]);}callbacks.length=0;contexts.length=0;}},reset:function reset(){this._callbacks=null;this._contexts=null;},destructor:function destructor(){this.reset();}});PooledClass.addPoolingTo(CallbackQueue);module.exports=CallbackQueue;},{"135":135,"27":27,"28":28}],7:[function(_dereq_,module,exports){'use strict';var EventConstants=_dereq_(15);var EventPluginHub=_dereq_(17);var EventPropagators=_dereq_(20);var ExecutionEnvironment=_dereq_(21);var ReactUpdates=_dereq_(87);var SyntheticEvent=_dereq_(95);var isEventSupported=_dereq_(136);var isTextInputElement=_dereq_(138);var keyOf=_dereq_(141);var topLevelTypes=EventConstants.topLevelTypes;var eventTypes={change:{phasedRegistrationNames:{bubbled:keyOf({onChange:null}),captured:keyOf({onChangeCapture:null})},dependencies:[topLevelTypes.topBlur,topLevelTypes.topChange,topLevelTypes.topClick,topLevelTypes.topFocus,topLevelTypes.topInput,topLevelTypes.topKeyDown,topLevelTypes.topKeyUp,topLevelTypes.topSelectionChange]}};var activeElement=null;var activeElementID=null;var activeElementValue=null;var activeElementValueProp=null;function shouldUseChangeEvent(elem){return elem.nodeName==='SELECT'||elem.nodeName==='INPUT'&&elem.type==='file';}var doesChangeEventBubble=false;if(ExecutionEnvironment.canUseDOM){doesChangeEventBubble=isEventSupported('change')&&(!('documentMode'in document)||document.documentMode>8);}function manualDispatchChangeEvent(nativeEvent){var event=SyntheticEvent.getPooled(eventTypes.change,activeElementID,nativeEvent);EventPropagators.accumulateTwoPhaseDispatches(event);ReactUpdates.batchedUpdates(runEventInBatch,event);}function runEventInBatch(event){EventPluginHub.enqueueEvents(event);EventPluginHub.processEventQueue();}function startWatchingForChangeEventIE8(target,targetID){activeElement=target;activeElementID=targetID;activeElement.attachEvent('onchange',manualDispatchChangeEvent);}function stopWatchingForChangeEventIE8(){if(!activeElement){return;}activeElement.detachEvent('onchange',manualDispatchChangeEvent);activeElement=null;activeElementID=null;}function getTargetIDForChangeEvent(topLevelType,topLevelTarget,topLevelTargetID){if(topLevelType===topLevelTypes.topChange){return topLevelTargetID;}}function handleEventsForChangeEventIE8(topLevelType,topLevelTarget,topLevelTargetID){if(topLevelType===topLevelTypes.topFocus){stopWatchingForChangeEventIE8();startWatchingForChangeEventIE8(topLevelTarget,topLevelTargetID);}else if(topLevelType===topLevelTypes.topBlur){stopWatchingForChangeEventIE8();}}var isInputEventSupported=false;if(ExecutionEnvironment.canUseDOM){isInputEventSupported=isEventSupported('input')&&(!('documentMode'in document)||document.documentMode>9);}var newValueProp={get:function get(){return activeElementValueProp.get.call(this);},set:function set(val){activeElementValue=''+val;activeElementValueProp.set.call(this,val);}};function startWatchingForValueChange(target,targetID){activeElement=target;activeElementID=targetID;activeElementValue=target.value;activeElementValueProp=Object.getOwnPropertyDescriptor(target.constructor.prototype,'value');Object.defineProperty(activeElement,'value',newValueProp);activeElement.attachEvent('onpropertychange',handlePropertyChange);}function stopWatchingForValueChange(){if(!activeElement){return;}delete activeElement.value;activeElement.detachEvent('onpropertychange',handlePropertyChange);activeElement=null;activeElementID=null;activeElementValue=null;activeElementValueProp=null;}function handlePropertyChange(nativeEvent){if(nativeEvent.propertyName!=='value'){return;}var value=nativeEvent.srcElement.value;if(value===activeElementValue){return;}activeElementValue=value;manualDispatchChangeEvent(nativeEvent);}function getTargetIDForInputEvent(topLevelType,topLevelTarget,topLevelTargetID){if(topLevelType===topLevelTypes.topInput){return topLevelTargetID;}}function handleEventsForInputEventIE(topLevelType,topLevelTarget,topLevelTargetID){if(topLevelType===topLevelTypes.topFocus){stopWatchingForValueChange();startWatchingForValueChange(topLevelTarget,topLevelTargetID);}else if(topLevelType===topLevelTypes.topBlur){stopWatchingForValueChange();}}function getTargetIDForInputEventIE(topLevelType,topLevelTarget,topLevelTargetID){if(topLevelType===topLevelTypes.topSelectionChange||topLevelType===topLevelTypes.topKeyUp||topLevelType===topLevelTypes.topKeyDown){if(activeElement&&activeElement.value!==activeElementValue){activeElementValue=activeElement.value;return activeElementID;}}}function shouldUseClickEvent(elem){return elem.nodeName==='INPUT'&&(elem.type==='checkbox'||elem.type==='radio');}function getTargetIDForClickEvent(topLevelType,topLevelTarget,topLevelTargetID){if(topLevelType===topLevelTypes.topClick){return topLevelTargetID;}}var ChangeEventPlugin={eventTypes:eventTypes,extractEvents:function extractEvents(topLevelType,topLevelTarget,topLevelTargetID,nativeEvent){var getTargetIDFunc,handleEventFunc;if(shouldUseChangeEvent(topLevelTarget)){if(doesChangeEventBubble){getTargetIDFunc=getTargetIDForChangeEvent;}else{handleEventFunc=handleEventsForChangeEventIE8;}}else if(isTextInputElement(topLevelTarget)){if(isInputEventSupported){getTargetIDFunc=getTargetIDForInputEvent;}else{getTargetIDFunc=getTargetIDForInputEventIE;handleEventFunc=handleEventsForInputEventIE;}}else if(shouldUseClickEvent(topLevelTarget)){getTargetIDFunc=getTargetIDForClickEvent;}if(getTargetIDFunc){var targetID=getTargetIDFunc(topLevelType,topLevelTarget,topLevelTargetID);if(targetID){var event=SyntheticEvent.getPooled(eventTypes.change,targetID,nativeEvent);EventPropagators.accumulateTwoPhaseDispatches(event);return event;}}if(handleEventFunc){handleEventFunc(topLevelType,topLevelTarget,topLevelTargetID);}}};module.exports=ChangeEventPlugin;},{"136":136,"138":138,"141":141,"15":15,"17":17,"20":20,"21":21,"87":87,"95":95}],8:[function(_dereq_,module,exports){'use strict';var nextReactRootIndex=0;var ClientReactRootIndex={createReactRootIndex:function createReactRootIndex(){return nextReactRootIndex++;}};module.exports=ClientReactRootIndex;},{}],9:[function(_dereq_,module,exports){'use strict';var Danger=_dereq_(12);var ReactMultiChildUpdateTypes=_dereq_(72);var setTextContent=_dereq_(149);var invariant=_dereq_(135);function insertChildAt(parentNode,childNode,index){parentNode.insertBefore(childNode,parentNode.childNodes[index]||null);}var DOMChildrenOperations={dangerouslyReplaceNodeWithMarkup:Danger.dangerouslyReplaceNodeWithMarkup,updateTextContent:setTextContent,processUpdates:function processUpdates(updates,markupList){var update;var initialChildren=null;var updatedChildren=null;for(var i=0;i<updates.length;i++){update=updates[i];if(update.type===ReactMultiChildUpdateTypes.MOVE_EXISTING||update.type===ReactMultiChildUpdateTypes.REMOVE_NODE){var updatedIndex=update.fromIndex;var updatedChild=update.parentNode.childNodes[updatedIndex];var parentID=update.parentID;"production"!=="development"?invariant(updatedChild,'processUpdates(): Unable to find child %s of element. This '+'probably means the DOM was unexpectedly mutated (e.g., by the '+'browser), usually due to forgetting a <tbody> when using tables, '+'nesting tags like <form>, <p>, or <a>, or using non-SVG elements '+'in an <svg> parent. Try inspecting the child nodes of the element '+'with React ID `%s`.',updatedIndex,parentID):invariant(updatedChild);initialChildren=initialChildren||{};initialChildren[parentID]=initialChildren[parentID]||[];initialChildren[parentID][updatedIndex]=updatedChild;updatedChildren=updatedChildren||[];updatedChildren.push(updatedChild);}}var renderedMarkup=Danger.dangerouslyRenderMarkup(markupList);if(updatedChildren){for(var j=0;j<updatedChildren.length;j++){updatedChildren[j].parentNode.removeChild(updatedChildren[j]);}}for(var k=0;k<updates.length;k++){update=updates[k];switch(update.type){case ReactMultiChildUpdateTypes.INSERT_MARKUP:insertChildAt(update.parentNode,renderedMarkup[update.markupIndex],update.toIndex);break;case ReactMultiChildUpdateTypes.MOVE_EXISTING:insertChildAt(update.parentNode,initialChildren[update.parentID][update.fromIndex],update.toIndex);break;case ReactMultiChildUpdateTypes.TEXT_CONTENT:setTextContent(update.parentNode,update.textContent);break;case ReactMultiChildUpdateTypes.REMOVE_NODE:break;}}}};module.exports=DOMChildrenOperations;},{"12":12,"135":135,"149":149,"72":72}],10:[function(_dereq_,module,exports){'use strict';var invariant=_dereq_(135);function checkMask(value,bitmask){return(value&bitmask)===bitmask;}var DOMPropertyInjection={MUST_USE_ATTRIBUTE:0x1,MUST_USE_PROPERTY:0x2,HAS_SIDE_EFFECTS:0x4,HAS_BOOLEAN_VALUE:0x8,HAS_NUMERIC_VALUE:0x10,HAS_POSITIVE_NUMERIC_VALUE:0x20|0x10,HAS_OVERLOADED_BOOLEAN_VALUE:0x40,injectDOMPropertyConfig:function injectDOMPropertyConfig(domPropertyConfig){var Properties=domPropertyConfig.Properties||{};var DOMAttributeNames=domPropertyConfig.DOMAttributeNames||{};var DOMPropertyNames=domPropertyConfig.DOMPropertyNames||{};var DOMMutationMethods=domPropertyConfig.DOMMutationMethods||{};if(domPropertyConfig.isCustomAttribute){DOMProperty._isCustomAttributeFunctions.push(domPropertyConfig.isCustomAttribute);}for(var propName in Properties){"production"!=="development"?invariant(!DOMProperty.isStandardName.hasOwnProperty(propName),'injectDOMPropertyConfig(...): You\'re trying to inject DOM property '+'\'%s\' which has already been injected. You may be accidentally '+'injecting the same DOM property config twice, or you may be '+'injecting two configs that have conflicting property names.',propName):invariant(!DOMProperty.isStandardName.hasOwnProperty(propName));DOMProperty.isStandardName[propName]=true;var lowerCased=propName.toLowerCase();DOMProperty.getPossibleStandardName[lowerCased]=propName;if(DOMAttributeNames.hasOwnProperty(propName)){var attributeName=DOMAttributeNames[propName];DOMProperty.getPossibleStandardName[attributeName]=propName;DOMProperty.getAttributeName[propName]=attributeName;}else{DOMProperty.getAttributeName[propName]=lowerCased;}DOMProperty.getPropertyName[propName]=DOMPropertyNames.hasOwnProperty(propName)?DOMPropertyNames[propName]:propName;if(DOMMutationMethods.hasOwnProperty(propName)){DOMProperty.getMutationMethod[propName]=DOMMutationMethods[propName];}else{DOMProperty.getMutationMethod[propName]=null;}var propConfig=Properties[propName];DOMProperty.mustUseAttribute[propName]=checkMask(propConfig,DOMPropertyInjection.MUST_USE_ATTRIBUTE);DOMProperty.mustUseProperty[propName]=checkMask(propConfig,DOMPropertyInjection.MUST_USE_PROPERTY);DOMProperty.hasSideEffects[propName]=checkMask(propConfig,DOMPropertyInjection.HAS_SIDE_EFFECTS);DOMProperty.hasBooleanValue[propName]=checkMask(propConfig,DOMPropertyInjection.HAS_BOOLEAN_VALUE);DOMProperty.hasNumericValue[propName]=checkMask(propConfig,DOMPropertyInjection.HAS_NUMERIC_VALUE);DOMProperty.hasPositiveNumericValue[propName]=checkMask(propConfig,DOMPropertyInjection.HAS_POSITIVE_NUMERIC_VALUE);DOMProperty.hasOverloadedBooleanValue[propName]=checkMask(propConfig,DOMPropertyInjection.HAS_OVERLOADED_BOOLEAN_VALUE);"production"!=="development"?invariant(!DOMProperty.mustUseAttribute[propName]||!DOMProperty.mustUseProperty[propName],'DOMProperty: Cannot require using both attribute and property: %s',propName):invariant(!DOMProperty.mustUseAttribute[propName]||!DOMProperty.mustUseProperty[propName]);"production"!=="development"?invariant(DOMProperty.mustUseProperty[propName]||!DOMProperty.hasSideEffects[propName],'DOMProperty: Properties that have side effects must use property: %s',propName):invariant(DOMProperty.mustUseProperty[propName]||!DOMProperty.hasSideEffects[propName]);"production"!=="development"?invariant(!!DOMProperty.hasBooleanValue[propName]+!!DOMProperty.hasNumericValue[propName]+!!DOMProperty.hasOverloadedBooleanValue[propName]<=1,'DOMProperty: Value can be one of boolean, overloaded boolean, or '+'numeric value, but not a combination: %s',propName):invariant(!!DOMProperty.hasBooleanValue[propName]+!!DOMProperty.hasNumericValue[propName]+!!DOMProperty.hasOverloadedBooleanValue[propName]<=1);}}};var defaultValueCache={};var DOMProperty={ID_ATTRIBUTE_NAME:'data-reactid',isStandardName:{},getPossibleStandardName:{},getAttributeName:{},getPropertyName:{},getMutationMethod:{},mustUseAttribute:{},mustUseProperty:{},hasSideEffects:{},hasBooleanValue:{},hasNumericValue:{},hasPositiveNumericValue:{},hasOverloadedBooleanValue:{},_isCustomAttributeFunctions:[],isCustomAttribute:function isCustomAttribute(attributeName){for(var i=0;i<DOMProperty._isCustomAttributeFunctions.length;i++){var isCustomAttributeFn=DOMProperty._isCustomAttributeFunctions[i];if(isCustomAttributeFn(attributeName)){return true;}}return false;},getDefaultValueForProperty:function getDefaultValueForProperty(nodeName,prop){var nodeDefaults=defaultValueCache[nodeName];var testElement;if(!nodeDefaults){defaultValueCache[nodeName]=nodeDefaults={};}if(!(prop in nodeDefaults)){testElement=document.createElement(nodeName);nodeDefaults[prop]=testElement[prop];}return nodeDefaults[prop];},injection:DOMPropertyInjection};module.exports=DOMProperty;},{"135":135}],11:[function(_dereq_,module,exports){'use strict';var DOMProperty=_dereq_(10);var quoteAttributeValueForBrowser=_dereq_(147);var warning=_dereq_(154);function shouldIgnoreValue(name,value){return value==null||DOMProperty.hasBooleanValue[name]&&!value||DOMProperty.hasNumericValue[name]&&isNaN(value)||DOMProperty.hasPositiveNumericValue[name]&&value<1||DOMProperty.hasOverloadedBooleanValue[name]&&value===false;}if("production"!=="development"){var reactProps={children:true,dangerouslySetInnerHTML:true,key:true,ref:true};var warnedProperties={};var warnUnknownProperty=function warnUnknownProperty(name){if(reactProps.hasOwnProperty(name)&&reactProps[name]||warnedProperties.hasOwnProperty(name)&&warnedProperties[name]){return;}warnedProperties[name]=true;var lowerCasedName=name.toLowerCase();var standardName=DOMProperty.isCustomAttribute(lowerCasedName)?lowerCasedName:DOMProperty.getPossibleStandardName.hasOwnProperty(lowerCasedName)?DOMProperty.getPossibleStandardName[lowerCasedName]:null;"production"!=="development"?warning(standardName==null,'Unknown DOM property %s. Did you mean %s?',name,standardName):null;};}var DOMPropertyOperations={createMarkupForID:function createMarkupForID(id){return DOMProperty.ID_ATTRIBUTE_NAME+'='+quoteAttributeValueForBrowser(id);},createMarkupForProperty:function createMarkupForProperty(name,value){if(DOMProperty.isStandardName.hasOwnProperty(name)&&DOMProperty.isStandardName[name]){if(shouldIgnoreValue(name,value)){return'';}var attributeName=DOMProperty.getAttributeName[name];if(DOMProperty.hasBooleanValue[name]||DOMProperty.hasOverloadedBooleanValue[name]&&value===true){return attributeName;}return attributeName+'='+quoteAttributeValueForBrowser(value);}else if(DOMProperty.isCustomAttribute(name)){if(value==null){return'';}return name+'='+quoteAttributeValueForBrowser(value);}else if("production"!=="development"){warnUnknownProperty(name);}return null;},setValueForProperty:function setValueForProperty(node,name,value){if(DOMProperty.isStandardName.hasOwnProperty(name)&&DOMProperty.isStandardName[name]){var mutationMethod=DOMProperty.getMutationMethod[name];if(mutationMethod){mutationMethod(node,value);}else if(shouldIgnoreValue(name,value)){this.deleteValueForProperty(node,name);}else if(DOMProperty.mustUseAttribute[name]){node.setAttribute(DOMProperty.getAttributeName[name],''+value);}else{var propName=DOMProperty.getPropertyName[name];if(!DOMProperty.hasSideEffects[name]||''+node[propName]!==''+value){node[propName]=value;}}}else if(DOMProperty.isCustomAttribute(name)){if(value==null){node.removeAttribute(name);}else{node.setAttribute(name,''+value);}}else if("production"!=="development"){warnUnknownProperty(name);}},deleteValueForProperty:function deleteValueForProperty(node,name){if(DOMProperty.isStandardName.hasOwnProperty(name)&&DOMProperty.isStandardName[name]){var mutationMethod=DOMProperty.getMutationMethod[name];if(mutationMethod){mutationMethod(node,undefined);}else if(DOMProperty.mustUseAttribute[name]){node.removeAttribute(DOMProperty.getAttributeName[name]);}else{var propName=DOMProperty.getPropertyName[name];var defaultValue=DOMProperty.getDefaultValueForProperty(node.nodeName,propName);if(!DOMProperty.hasSideEffects[name]||''+node[propName]!==defaultValue){node[propName]=defaultValue;}}}else if(DOMProperty.isCustomAttribute(name)){node.removeAttribute(name);}else if("production"!=="development"){warnUnknownProperty(name);}}};module.exports=DOMPropertyOperations;},{"10":10,"147":147,"154":154}],12:[function(_dereq_,module,exports){'use strict';var ExecutionEnvironment=_dereq_(21);var createNodesFromMarkup=_dereq_(112);var emptyFunction=_dereq_(114);var getMarkupWrap=_dereq_(127);var invariant=_dereq_(135);var OPEN_TAG_NAME_EXP=/^(<[^ \/>]+)/;var RESULT_INDEX_ATTR='data-danger-index';function getNodeName(markup){return markup.substring(1,markup.indexOf(' '));}var Danger={dangerouslyRenderMarkup:function dangerouslyRenderMarkup(markupList){"production"!=="development"?invariant(ExecutionEnvironment.canUseDOM,'dangerouslyRenderMarkup(...): Cannot render markup in a worker '+'thread. Make sure `window` and `document` are available globally '+'before requiring React when unit testing or use '+'React.renderToString for server rendering.'):invariant(ExecutionEnvironment.canUseDOM);var nodeName;var markupByNodeName={};for(var i=0;i<markupList.length;i++){"production"!=="development"?invariant(markupList[i],'dangerouslyRenderMarkup(...): Missing markup.'):invariant(markupList[i]);nodeName=getNodeName(markupList[i]);nodeName=getMarkupWrap(nodeName)?nodeName:'*';markupByNodeName[nodeName]=markupByNodeName[nodeName]||[];markupByNodeName[nodeName][i]=markupList[i];}var resultList=[];var resultListAssignmentCount=0;for(nodeName in markupByNodeName){if(!markupByNodeName.hasOwnProperty(nodeName)){continue;}var markupListByNodeName=markupByNodeName[nodeName];var resultIndex;for(resultIndex in markupListByNodeName){if(markupListByNodeName.hasOwnProperty(resultIndex)){var markup=markupListByNodeName[resultIndex];markupListByNodeName[resultIndex]=markup.replace(OPEN_TAG_NAME_EXP,'$1 '+RESULT_INDEX_ATTR+'="'+resultIndex+'" ');}}var renderNodes=createNodesFromMarkup(markupListByNodeName.join(''),emptyFunction);for(var j=0;j<renderNodes.length;++j){var renderNode=renderNodes[j];if(renderNode.hasAttribute&&renderNode.hasAttribute(RESULT_INDEX_ATTR)){resultIndex=+renderNode.getAttribute(RESULT_INDEX_ATTR);renderNode.removeAttribute(RESULT_INDEX_ATTR);"production"!=="development"?invariant(!resultList.hasOwnProperty(resultIndex),'Danger: Assigning to an already-occupied result index.'):invariant(!resultList.hasOwnProperty(resultIndex));resultList[resultIndex]=renderNode;resultListAssignmentCount+=1;}else if("production"!=="development"){console.error('Danger: Discarding unexpected node:',renderNode);}}}"production"!=="development"?invariant(resultListAssignmentCount===resultList.length,'Danger: Did not assign to every index of resultList.'):invariant(resultListAssignmentCount===resultList.length);"production"!=="development"?invariant(resultList.length===markupList.length,'Danger: Expected markup to render %s nodes, but rendered %s.',markupList.length,resultList.length):invariant(resultList.length===markupList.length);return resultList;},dangerouslyReplaceNodeWithMarkup:function dangerouslyReplaceNodeWithMarkup(oldChild,markup){"production"!=="development"?invariant(ExecutionEnvironment.canUseDOM,'dangerouslyReplaceNodeWithMarkup(...): Cannot render markup in a '+'worker thread. Make sure `window` and `document` are available '+'globally before requiring React when unit testing or use '+'React.renderToString for server rendering.'):invariant(ExecutionEnvironment.canUseDOM);"production"!=="development"?invariant(markup,'dangerouslyReplaceNodeWithMarkup(...): Missing markup.'):invariant(markup);"production"!=="development"?invariant(oldChild.tagName.toLowerCase()!=='html','dangerouslyReplaceNodeWithMarkup(...): Cannot replace markup of the '+'<html> node. This is because browser quirks make this unreliable '+'and/or slow. If you want to render to the root you must use '+'server rendering. See React.renderToString().'):invariant(oldChild.tagName.toLowerCase()!=='html');var newChild=createNodesFromMarkup(markup,emptyFunction)[0];oldChild.parentNode.replaceChild(newChild,oldChild);}};module.exports=Danger;},{"112":112,"114":114,"127":127,"135":135,"21":21}],13:[function(_dereq_,module,exports){'use strict';var keyOf=_dereq_(141);var DefaultEventPluginOrder=[keyOf({ResponderEventPlugin:null}),keyOf({SimpleEventPlugin:null}),keyOf({TapEventPlugin:null}),keyOf({EnterLeaveEventPlugin:null}),keyOf({ChangeEventPlugin:null}),keyOf({SelectEventPlugin:null}),keyOf({BeforeInputEventPlugin:null}),keyOf({AnalyticsEventPlugin:null}),keyOf({MobileSafariClickEventPlugin:null})];module.exports=DefaultEventPluginOrder;},{"141":141}],14:[function(_dereq_,module,exports){'use strict';var EventConstants=_dereq_(15);var EventPropagators=_dereq_(20);var SyntheticMouseEvent=_dereq_(99);var ReactMount=_dereq_(70);var keyOf=_dereq_(141);var topLevelTypes=EventConstants.topLevelTypes;var getFirstReactDOM=ReactMount.getFirstReactDOM;var eventTypes={mouseEnter:{registrationName:keyOf({onMouseEnter:null}),dependencies:[topLevelTypes.topMouseOut,topLevelTypes.topMouseOver]},mouseLeave:{registrationName:keyOf({onMouseLeave:null}),dependencies:[topLevelTypes.topMouseOut,topLevelTypes.topMouseOver]}};var extractedEvents=[null,null];var EnterLeaveEventPlugin={eventTypes:eventTypes,extractEvents:function extractEvents(topLevelType,topLevelTarget,topLevelTargetID,nativeEvent){if(topLevelType===topLevelTypes.topMouseOver&&(nativeEvent.relatedTarget||nativeEvent.fromElement)){return null;}if(topLevelType!==topLevelTypes.topMouseOut&&topLevelType!==topLevelTypes.topMouseOver){return null;}var win;if(topLevelTarget.window===topLevelTarget){win=topLevelTarget;}else{var doc=topLevelTarget.ownerDocument;if(doc){win=doc.defaultView||doc.parentWindow;}else{win=window;}}var from,to;if(topLevelType===topLevelTypes.topMouseOut){from=topLevelTarget;to=getFirstReactDOM(nativeEvent.relatedTarget||nativeEvent.toElement)||win;}else{from=win;to=topLevelTarget;}if(from===to){return null;}var fromID=from?ReactMount.getID(from):'';var toID=to?ReactMount.getID(to):'';var leave=SyntheticMouseEvent.getPooled(eventTypes.mouseLeave,fromID,nativeEvent);leave.type='mouseleave';leave.target=from;leave.relatedTarget=to;var enter=SyntheticMouseEvent.getPooled(eventTypes.mouseEnter,toID,nativeEvent);enter.type='mouseenter';enter.target=to;enter.relatedTarget=from;EventPropagators.accumulateEnterLeaveDispatches(leave,enter,fromID,toID);extractedEvents[0]=leave;extractedEvents[1]=enter;return extractedEvents;}};module.exports=EnterLeaveEventPlugin;},{"141":141,"15":15,"20":20,"70":70,"99":99}],15:[function(_dereq_,module,exports){'use strict';var keyMirror=_dereq_(140);var PropagationPhases=keyMirror({bubbled:null,captured:null});var topLevelTypes=keyMirror({topBlur:null,topChange:null,topClick:null,topCompositionEnd:null,topCompositionStart:null,topCompositionUpdate:null,topContextMenu:null,topCopy:null,topCut:null,topDoubleClick:null,topDrag:null,topDragEnd:null,topDragEnter:null,topDragExit:null,topDragLeave:null,topDragOver:null,topDragStart:null,topDrop:null,topError:null,topFocus:null,topInput:null,topKeyDown:null,topKeyPress:null,topKeyUp:null,topLoad:null,topMouseDown:null,topMouseMove:null,topMouseOut:null,topMouseOver:null,topMouseUp:null,topPaste:null,topReset:null,topScroll:null,topSelectionChange:null,topSubmit:null,topTextInput:null,topTouchCancel:null,topTouchEnd:null,topTouchMove:null,topTouchStart:null,topWheel:null});var EventConstants={topLevelTypes:topLevelTypes,PropagationPhases:PropagationPhases};module.exports=EventConstants;},{"140":140}],16:[function(_dereq_,module,exports){var emptyFunction=_dereq_(114);var EventListener={listen:function listen(target,eventType,callback){if(target.addEventListener){target.addEventListener(eventType,callback,false);return{remove:function remove(){target.removeEventListener(eventType,callback,false);}};}else if(target.attachEvent){target.attachEvent('on'+eventType,callback);return{remove:function remove(){target.detachEvent('on'+eventType,callback);}};}},capture:function capture(target,eventType,callback){if(!target.addEventListener){if("production"!=="development"){console.error('Attempted to listen to events during the capture phase on a '+'browser that does not support the capture phase. Your application '+'will not receive some events.');}return{remove:emptyFunction};}else{target.addEventListener(eventType,callback,true);return{remove:function remove(){target.removeEventListener(eventType,callback,true);}};}},registerDefault:function registerDefault(){}};module.exports=EventListener;},{"114":114}],17:[function(_dereq_,module,exports){'use strict';var EventPluginRegistry=_dereq_(18);var EventPluginUtils=_dereq_(19);var accumulateInto=_dereq_(105);var forEachAccumulated=_dereq_(120);var invariant=_dereq_(135);var listenerBank={};var eventQueue=null;var executeDispatchesAndRelease=function executeDispatchesAndRelease(event){if(event){var executeDispatch=EventPluginUtils.executeDispatch;var PluginModule=EventPluginRegistry.getPluginModuleForEvent(event);if(PluginModule&&PluginModule.executeDispatch){executeDispatch=PluginModule.executeDispatch;}EventPluginUtils.executeDispatchesInOrder(event,executeDispatch);if(!event.isPersistent()){event.constructor.release(event);}}};var InstanceHandle=null;function validateInstanceHandle(){var valid=InstanceHandle&&InstanceHandle.traverseTwoPhase&&InstanceHandle.traverseEnterLeave;"production"!=="development"?invariant(valid,'InstanceHandle not injected before use!'):invariant(valid);}var EventPluginHub={injection:{injectMount:EventPluginUtils.injection.injectMount,injectInstanceHandle:function injectInstanceHandle(InjectedInstanceHandle){InstanceHandle=InjectedInstanceHandle;if("production"!=="development"){validateInstanceHandle();}},getInstanceHandle:function getInstanceHandle(){if("production"!=="development"){validateInstanceHandle();}return InstanceHandle;},injectEventPluginOrder:EventPluginRegistry.injectEventPluginOrder,injectEventPluginsByName:EventPluginRegistry.injectEventPluginsByName},eventNameDispatchConfigs:EventPluginRegistry.eventNameDispatchConfigs,registrationNameModules:EventPluginRegistry.registrationNameModules,putListener:function putListener(id,registrationName,listener){"production"!=="development"?invariant(!listener||typeof listener==='function','Expected %s listener to be a function, instead got type %s',registrationName,typeof listener==="undefined"?"undefined":_typeof(listener)):invariant(!listener||typeof listener==='function');var bankForRegistrationName=listenerBank[registrationName]||(listenerBank[registrationName]={});bankForRegistrationName[id]=listener;},getListener:function getListener(id,registrationName){var bankForRegistrationName=listenerBank[registrationName];return bankForRegistrationName&&bankForRegistrationName[id];},deleteListener:function deleteListener(id,registrationName){var bankForRegistrationName=listenerBank[registrationName];if(bankForRegistrationName){delete bankForRegistrationName[id];}},deleteAllListeners:function deleteAllListeners(id){for(var registrationName in listenerBank){delete listenerBank[registrationName][id];}},extractEvents:function extractEvents(topLevelType,topLevelTarget,topLevelTargetID,nativeEvent){var events;var plugins=EventPluginRegistry.plugins;for(var i=0,l=plugins.length;i<l;i++){var possiblePlugin=plugins[i];if(possiblePlugin){var extractedEvents=possiblePlugin.extractEvents(topLevelType,topLevelTarget,topLevelTargetID,nativeEvent);if(extractedEvents){events=accumulateInto(events,extractedEvents);}}}return events;},enqueueEvents:function enqueueEvents(events){if(events){eventQueue=accumulateInto(eventQueue,events);}},processEventQueue:function processEventQueue(){var processingEventQueue=eventQueue;eventQueue=null;forEachAccumulated(processingEventQueue,executeDispatchesAndRelease);"production"!=="development"?invariant(!eventQueue,'processEventQueue(): Additional events were enqueued while processing '+'an event queue. Support for this has not yet been implemented.'):invariant(!eventQueue);},__purge:function __purge(){listenerBank={};},__getListenerBank:function __getListenerBank(){return listenerBank;}};module.exports=EventPluginHub;},{"105":105,"120":120,"135":135,"18":18,"19":19}],18:[function(_dereq_,module,exports){'use strict';var invariant=_dereq_(135);var EventPluginOrder=null;var namesToPlugins={};function recomputePluginOrdering(){if(!EventPluginOrder){return;}for(var pluginName in namesToPlugins){var PluginModule=namesToPlugins[pluginName];var pluginIndex=EventPluginOrder.indexOf(pluginName);"production"!=="development"?invariant(pluginIndex>-1,'EventPluginRegistry: Cannot inject event plugins that do not exist in '+'the plugin ordering, `%s`.',pluginName):invariant(pluginIndex>-1);if(EventPluginRegistry.plugins[pluginIndex]){continue;}"production"!=="development"?invariant(PluginModule.extractEvents,'EventPluginRegistry: Event plugins must implement an `extractEvents` '+'method, but `%s` does not.',pluginName):invariant(PluginModule.extractEvents);EventPluginRegistry.plugins[pluginIndex]=PluginModule;var publishedEvents=PluginModule.eventTypes;for(var eventName in publishedEvents){"production"!=="development"?invariant(publishEventForPlugin(publishedEvents[eventName],PluginModule,eventName),'EventPluginRegistry: Failed to publish event `%s` for plugin `%s`.',eventName,pluginName):invariant(publishEventForPlugin(publishedEvents[eventName],PluginModule,eventName));}}}function publishEventForPlugin(dispatchConfig,PluginModule,eventName){"production"!=="development"?invariant(!EventPluginRegistry.eventNameDispatchConfigs.hasOwnProperty(eventName),'EventPluginHub: More than one plugin attempted to publish the same '+'event name, `%s`.',eventName):invariant(!EventPluginRegistry.eventNameDispatchConfigs.hasOwnProperty(eventName));EventPluginRegistry.eventNameDispatchConfigs[eventName]=dispatchConfig;var phasedRegistrationNames=dispatchConfig.phasedRegistrationNames;if(phasedRegistrationNames){for(var phaseName in phasedRegistrationNames){if(phasedRegistrationNames.hasOwnProperty(phaseName)){var phasedRegistrationName=phasedRegistrationNames[phaseName];publishRegistrationName(phasedRegistrationName,PluginModule,eventName);}}return true;}else if(dispatchConfig.registrationName){publishRegistrationName(dispatchConfig.registrationName,PluginModule,eventName);return true;}return false;}function publishRegistrationName(registrationName,PluginModule,eventName){"production"!=="development"?invariant(!EventPluginRegistry.registrationNameModules[registrationName],'EventPluginHub: More than one plugin attempted to publish the same '+'registration name, `%s`.',registrationName):invariant(!EventPluginRegistry.registrationNameModules[registrationName]);EventPluginRegistry.registrationNameModules[registrationName]=PluginModule;EventPluginRegistry.registrationNameDependencies[registrationName]=PluginModule.eventTypes[eventName].dependencies;}var EventPluginRegistry={plugins:[],eventNameDispatchConfigs:{},registrationNameModules:{},registrationNameDependencies:{},injectEventPluginOrder:function injectEventPluginOrder(InjectedEventPluginOrder){"production"!=="development"?invariant(!EventPluginOrder,'EventPluginRegistry: Cannot inject event plugin ordering more than '+'once. You are likely trying to load more than one copy of React.'):invariant(!EventPluginOrder);EventPluginOrder=Array.prototype.slice.call(InjectedEventPluginOrder);recomputePluginOrdering();},injectEventPluginsByName:function injectEventPluginsByName(injectedNamesToPlugins){var isOrderingDirty=false;for(var pluginName in injectedNamesToPlugins){if(!injectedNamesToPlugins.hasOwnProperty(pluginName)){continue;}var PluginModule=injectedNamesToPlugins[pluginName];if(!namesToPlugins.hasOwnProperty(pluginName)||namesToPlugins[pluginName]!==PluginModule){"production"!=="development"?invariant(!namesToPlugins[pluginName],'EventPluginRegistry: Cannot inject two different event plugins '+'using the same name, `%s`.',pluginName):invariant(!namesToPlugins[pluginName]);namesToPlugins[pluginName]=PluginModule;isOrderingDirty=true;}}if(isOrderingDirty){recomputePluginOrdering();}},getPluginModuleForEvent:function getPluginModuleForEvent(event){var dispatchConfig=event.dispatchConfig;if(dispatchConfig.registrationName){return EventPluginRegistry.registrationNameModules[dispatchConfig.registrationName]||null;}for(var phase in dispatchConfig.phasedRegistrationNames){if(!dispatchConfig.phasedRegistrationNames.hasOwnProperty(phase)){continue;}var PluginModule=EventPluginRegistry.registrationNameModules[dispatchConfig.phasedRegistrationNames[phase]];if(PluginModule){return PluginModule;}}return null;},_resetEventPlugins:function _resetEventPlugins(){EventPluginOrder=null;for(var pluginName in namesToPlugins){if(namesToPlugins.hasOwnProperty(pluginName)){delete namesToPlugins[pluginName];}}EventPluginRegistry.plugins.length=0;var eventNameDispatchConfigs=EventPluginRegistry.eventNameDispatchConfigs;for(var eventName in eventNameDispatchConfigs){if(eventNameDispatchConfigs.hasOwnProperty(eventName)){delete eventNameDispatchConfigs[eventName];}}var registrationNameModules=EventPluginRegistry.registrationNameModules;for(var registrationName in registrationNameModules){if(registrationNameModules.hasOwnProperty(registrationName)){delete registrationNameModules[registrationName];}}}};module.exports=EventPluginRegistry;},{"135":135}],19:[function(_dereq_,module,exports){'use strict';var EventConstants=_dereq_(15);var invariant=_dereq_(135);var injection={Mount:null,injectMount:function injectMount(InjectedMount){injection.Mount=InjectedMount;if("production"!=="development"){"production"!=="development"?invariant(InjectedMount&&InjectedMount.getNode,'EventPluginUtils.injection.injectMount(...): Injected Mount module '+'is missing getNode.'):invariant(InjectedMount&&InjectedMount.getNode);}}};var topLevelTypes=EventConstants.topLevelTypes;function isEndish(topLevelType){return topLevelType===topLevelTypes.topMouseUp||topLevelType===topLevelTypes.topTouchEnd||topLevelType===topLevelTypes.topTouchCancel;}function isMoveish(topLevelType){return topLevelType===topLevelTypes.topMouseMove||topLevelType===topLevelTypes.topTouchMove;}function isStartish(topLevelType){return topLevelType===topLevelTypes.topMouseDown||topLevelType===topLevelTypes.topTouchStart;}var validateEventDispatches;if("production"!=="development"){validateEventDispatches=function validateEventDispatches(event){var dispatchListeners=event._dispatchListeners;var dispatchIDs=event._dispatchIDs;var listenersIsArr=Array.isArray(dispatchListeners);var idsIsArr=Array.isArray(dispatchIDs);var IDsLen=idsIsArr?dispatchIDs.length:dispatchIDs?1:0;var listenersLen=listenersIsArr?dispatchListeners.length:dispatchListeners?1:0;"production"!=="development"?invariant(idsIsArr===listenersIsArr&&IDsLen===listenersLen,'EventPluginUtils: Invalid `event`.'):invariant(idsIsArr===listenersIsArr&&IDsLen===listenersLen);};}function forEachEventDispatch(event,cb){var dispatchListeners=event._dispatchListeners;var dispatchIDs=event._dispatchIDs;if("production"!=="development"){validateEventDispatches(event);}if(Array.isArray(dispatchListeners)){for(var i=0;i<dispatchListeners.length;i++){if(event.isPropagationStopped()){break;}cb(event,dispatchListeners[i],dispatchIDs[i]);}}else if(dispatchListeners){cb(event,dispatchListeners,dispatchIDs);}}function executeDispatch(event,listener,domID){event.currentTarget=injection.Mount.getNode(domID);var returnValue=listener(event,domID);event.currentTarget=null;return returnValue;}function executeDispatchesInOrder(event,cb){forEachEventDispatch(event,cb);event._dispatchListeners=null;event._dispatchIDs=null;}function executeDispatchesInOrderStopAtTrueImpl(event){var dispatchListeners=event._dispatchListeners;var dispatchIDs=event._dispatchIDs;if("production"!=="development"){validateEventDispatches(event);}if(Array.isArray(dispatchListeners)){for(var i=0;i<dispatchListeners.length;i++){if(event.isPropagationStopped()){break;}if(dispatchListeners[i](event,dispatchIDs[i])){return dispatchIDs[i];}}}else if(dispatchListeners){if(dispatchListeners(event,dispatchIDs)){return dispatchIDs;}}return null;}function executeDispatchesInOrderStopAtTrue(event){var ret=executeDispatchesInOrderStopAtTrueImpl(event);event._dispatchIDs=null;event._dispatchListeners=null;return ret;}function executeDirectDispatch(event){if("production"!=="development"){validateEventDispatches(event);}var dispatchListener=event._dispatchListeners;var dispatchID=event._dispatchIDs;"production"!=="development"?invariant(!Array.isArray(dispatchListener),'executeDirectDispatch(...): Invalid `event`.'):invariant(!Array.isArray(dispatchListener));var res=dispatchListener?dispatchListener(event,dispatchID):null;event._dispatchListeners=null;event._dispatchIDs=null;return res;}function hasDispatches(event){return!!event._dispatchListeners;}var EventPluginUtils={isEndish:isEndish,isMoveish:isMoveish,isStartish:isStartish,executeDirectDispatch:executeDirectDispatch,executeDispatch:executeDispatch,executeDispatchesInOrder:executeDispatchesInOrder,executeDispatchesInOrderStopAtTrue:executeDispatchesInOrderStopAtTrue,hasDispatches:hasDispatches,injection:injection,useTouchEvents:false};module.exports=EventPluginUtils;},{"135":135,"15":15}],20:[function(_dereq_,module,exports){'use strict';var EventConstants=_dereq_(15);var EventPluginHub=_dereq_(17);var accumulateInto=_dereq_(105);var forEachAccumulated=_dereq_(120);var PropagationPhases=EventConstants.PropagationPhases;var getListener=EventPluginHub.getListener;function listenerAtPhase(id,event,propagationPhase){var registrationName=event.dispatchConfig.phasedRegistrationNames[propagationPhase];return getListener(id,registrationName);}function accumulateDirectionalDispatches(domID,upwards,event){if("production"!=="development"){if(!domID){throw new Error('Dispatching id must not be null');}}var phase=upwards?PropagationPhases.bubbled:PropagationPhases.captured;var listener=listenerAtPhase(domID,event,phase);if(listener){event._dispatchListeners=accumulateInto(event._dispatchListeners,listener);event._dispatchIDs=accumulateInto(event._dispatchIDs,domID);}}function accumulateTwoPhaseDispatchesSingle(event){if(event&&event.dispatchConfig.phasedRegistrationNames){EventPluginHub.injection.getInstanceHandle().traverseTwoPhase(event.dispatchMarker,accumulateDirectionalDispatches,event);}}function accumulateDispatches(id,ignoredDirection,event){if(event&&event.dispatchConfig.registrationName){var registrationName=event.dispatchConfig.registrationName;var listener=getListener(id,registrationName);if(listener){event._dispatchListeners=accumulateInto(event._dispatchListeners,listener);event._dispatchIDs=accumulateInto(event._dispatchIDs,id);}}}function accumulateDirectDispatchesSingle(event){if(event&&event.dispatchConfig.registrationName){accumulateDispatches(event.dispatchMarker,null,event);}}function accumulateTwoPhaseDispatches(events){forEachAccumulated(events,accumulateTwoPhaseDispatchesSingle);}function accumulateEnterLeaveDispatches(leave,enter,fromID,toID){EventPluginHub.injection.getInstanceHandle().traverseEnterLeave(fromID,toID,accumulateDispatches,leave,enter);}function accumulateDirectDispatches(events){forEachAccumulated(events,accumulateDirectDispatchesSingle);}var EventPropagators={accumulateTwoPhaseDispatches:accumulateTwoPhaseDispatches,accumulateDirectDispatches:accumulateDirectDispatches,accumulateEnterLeaveDispatches:accumulateEnterLeaveDispatches};module.exports=EventPropagators;},{"105":105,"120":120,"15":15,"17":17}],21:[function(_dereq_,module,exports){"use strict";var canUseDOM=!!(typeof window!=='undefined'&&window.document&&window.document.createElement);var ExecutionEnvironment={canUseDOM:canUseDOM,canUseWorkers:typeof Worker!=='undefined',canUseEventListeners:canUseDOM&&!!(window.addEventListener||window.attachEvent),canUseViewport:canUseDOM&&!!window.screen,isInWorker:!canUseDOM};module.exports=ExecutionEnvironment;},{}],22:[function(_dereq_,module,exports){'use strict';var PooledClass=_dereq_(28);var assign=_dereq_(27);var getTextContentAccessor=_dereq_(130);function FallbackCompositionState(root){this._root=root;this._startText=this.getText();this._fallbackText=null;}assign(FallbackCompositionState.prototype,{getText:function getText(){if('value'in this._root){return this._root.value;}return this._root[getTextContentAccessor()];},getData:function getData(){if(this._fallbackText){return this._fallbackText;}var start;var startValue=this._startText;var startLength=startValue.length;var end;var endValue=this.getText();var endLength=endValue.length;for(start=0;start<startLength;start++){if(startValue[start]!==endValue[start]){break;}}var minEnd=startLength-start;for(end=1;end<=minEnd;end++){if(startValue[startLength-end]!==endValue[endLength-end]){break;}}var sliceTail=end>1?1-end:undefined;this._fallbackText=endValue.slice(start,sliceTail);return this._fallbackText;}});PooledClass.addPoolingTo(FallbackCompositionState);module.exports=FallbackCompositionState;},{"130":130,"27":27,"28":28}],23:[function(_dereq_,module,exports){'use strict';var DOMProperty=_dereq_(10);var ExecutionEnvironment=_dereq_(21);var MUST_USE_ATTRIBUTE=DOMProperty.injection.MUST_USE_ATTRIBUTE;var MUST_USE_PROPERTY=DOMProperty.injection.MUST_USE_PROPERTY;var HAS_BOOLEAN_VALUE=DOMProperty.injection.HAS_BOOLEAN_VALUE;var HAS_SIDE_EFFECTS=DOMProperty.injection.HAS_SIDE_EFFECTS;var HAS_NUMERIC_VALUE=DOMProperty.injection.HAS_NUMERIC_VALUE;var HAS_POSITIVE_NUMERIC_VALUE=DOMProperty.injection.HAS_POSITIVE_NUMERIC_VALUE;var HAS_OVERLOADED_BOOLEAN_VALUE=DOMProperty.injection.HAS_OVERLOADED_BOOLEAN_VALUE;var hasSVG;if(ExecutionEnvironment.canUseDOM){var implementation=document.implementation;hasSVG=implementation&&implementation.hasFeature&&implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#BasicStructure','1.1');}var HTMLDOMPropertyConfig={isCustomAttribute:RegExp.prototype.test.bind(/^(data|aria)-[a-z_][a-z\d_.\-]*$/),Properties:{accept:null,acceptCharset:null,accessKey:null,action:null,allowFullScreen:MUST_USE_ATTRIBUTE|HAS_BOOLEAN_VALUE,allowTransparency:MUST_USE_ATTRIBUTE,alt:null,async:HAS_BOOLEAN_VALUE,autoComplete:null,autoPlay:HAS_BOOLEAN_VALUE,cellPadding:null,cellSpacing:null,charSet:MUST_USE_ATTRIBUTE,checked:MUST_USE_PROPERTY|HAS_BOOLEAN_VALUE,classID:MUST_USE_ATTRIBUTE,className:hasSVG?MUST_USE_ATTRIBUTE:MUST_USE_PROPERTY,cols:MUST_USE_ATTRIBUTE|HAS_POSITIVE_NUMERIC_VALUE,colSpan:null,content:null,contentEditable:null,contextMenu:MUST_USE_ATTRIBUTE,controls:MUST_USE_PROPERTY|HAS_BOOLEAN_VALUE,coords:null,crossOrigin:null,data:null,dateTime:MUST_USE_ATTRIBUTE,defer:HAS_BOOLEAN_VALUE,dir:null,disabled:MUST_USE_ATTRIBUTE|HAS_BOOLEAN_VALUE,download:HAS_OVERLOADED_BOOLEAN_VALUE,draggable:null,encType:null,form:MUST_USE_ATTRIBUTE,formAction:MUST_USE_ATTRIBUTE,formEncType:MUST_USE_ATTRIBUTE,formMethod:MUST_USE_ATTRIBUTE,formNoValidate:HAS_BOOLEAN_VALUE,formTarget:MUST_USE_ATTRIBUTE,frameBorder:MUST_USE_ATTRIBUTE,headers:null,height:MUST_USE_ATTRIBUTE,hidden:MUST_USE_ATTRIBUTE|HAS_BOOLEAN_VALUE,high:null,href:null,hrefLang:null,htmlFor:null,httpEquiv:null,icon:null,id:MUST_USE_PROPERTY,label:null,lang:null,list:MUST_USE_ATTRIBUTE,loop:MUST_USE_PROPERTY|HAS_BOOLEAN_VALUE,low:null,manifest:MUST_USE_ATTRIBUTE,marginHeight:null,marginWidth:null,max:null,maxLength:MUST_USE_ATTRIBUTE,media:MUST_USE_ATTRIBUTE,mediaGroup:null,method:null,min:null,multiple:MUST_USE_PROPERTY|HAS_BOOLEAN_VALUE,muted:MUST_USE_PROPERTY|HAS_BOOLEAN_VALUE,name:null,noValidate:HAS_BOOLEAN_VALUE,open:HAS_BOOLEAN_VALUE,optimum:null,pattern:null,placeholder:null,poster:null,preload:null,radioGroup:null,readOnly:MUST_USE_PROPERTY|HAS_BOOLEAN_VALUE,rel:null,required:HAS_BOOLEAN_VALUE,role:MUST_USE_ATTRIBUTE,rows:MUST_USE_ATTRIBUTE|HAS_POSITIVE_NUMERIC_VALUE,rowSpan:null,sandbox:null,scope:null,scoped:HAS_BOOLEAN_VALUE,scrolling:null,seamless:MUST_USE_ATTRIBUTE|HAS_BOOLEAN_VALUE,selected:MUST_USE_PROPERTY|HAS_BOOLEAN_VALUE,shape:null,size:MUST_USE_ATTRIBUTE|HAS_POSITIVE_NUMERIC_VALUE,sizes:MUST_USE_ATTRIBUTE,span:HAS_POSITIVE_NUMERIC_VALUE,spellCheck:null,src:null,srcDoc:MUST_USE_PROPERTY,srcSet:MUST_USE_ATTRIBUTE,start:HAS_NUMERIC_VALUE,step:null,style:null,tabIndex:null,target:null,title:null,type:null,useMap:null,value:MUST_USE_PROPERTY|HAS_SIDE_EFFECTS,width:MUST_USE_ATTRIBUTE,wmode:MUST_USE_ATTRIBUTE,autoCapitalize:null,autoCorrect:null,itemProp:MUST_USE_ATTRIBUTE,itemScope:MUST_USE_ATTRIBUTE|HAS_BOOLEAN_VALUE,itemType:MUST_USE_ATTRIBUTE,itemID:MUST_USE_ATTRIBUTE,itemRef:MUST_USE_ATTRIBUTE,property:null,unselectable:MUST_USE_ATTRIBUTE},DOMAttributeNames:{acceptCharset:'accept-charset',className:'class',htmlFor:'for',httpEquiv:'http-equiv'},DOMPropertyNames:{autoCapitalize:'autocapitalize',autoComplete:'autocomplete',autoCorrect:'autocorrect',autoFocus:'autofocus',autoPlay:'autoplay',encType:'encoding',hrefLang:'hreflang',radioGroup:'radiogroup',spellCheck:'spellcheck',srcDoc:'srcdoc',srcSet:'srcset'}};module.exports=HTMLDOMPropertyConfig;},{"10":10,"21":21}],24:[function(_dereq_,module,exports){'use strict';var ReactPropTypes=_dereq_(78);var invariant=_dereq_(135);var hasReadOnlyValue={'button':true,'checkbox':true,'image':true,'hidden':true,'radio':true,'reset':true,'submit':true};function _assertSingleLink(input){"production"!=="development"?invariant(input.props.checkedLink==null||input.props.valueLink==null,'Cannot provide a checkedLink and a valueLink. If you want to use '+'checkedLink, you probably don\'t want to use valueLink and vice versa.'):invariant(input.props.checkedLink==null||input.props.valueLink==null);}function _assertValueLink(input){_assertSingleLink(input);"production"!=="development"?invariant(input.props.value==null&&input.props.onChange==null,'Cannot provide a valueLink and a value or onChange event. If you want '+'to use value or onChange, you probably don\'t want to use valueLink.'):invariant(input.props.value==null&&input.props.onChange==null);}function _assertCheckedLink(input){_assertSingleLink(input);"production"!=="development"?invariant(input.props.checked==null&&input.props.onChange==null,'Cannot provide a checkedLink and a checked property or onChange event. '+'If you want to use checked or onChange, you probably don\'t want to '+'use checkedLink'):invariant(input.props.checked==null&&input.props.onChange==null);}function _handleLinkedValueChange(e){this.props.valueLink.requestChange(e.target.value);}function _handleLinkedCheckChange(e){this.props.checkedLink.requestChange(e.target.checked);}var LinkedValueUtils={Mixin:{propTypes:{value:function value(props,propName,componentName){if(!props[propName]||hasReadOnlyValue[props.type]||props.onChange||props.readOnly||props.disabled){return null;}return new Error('You provided a `value` prop to a form field without an '+'`onChange` handler. This will render a read-only field. If '+'the field should be mutable use `defaultValue`. Otherwise, '+'set either `onChange` or `readOnly`.');},checked:function checked(props,propName,componentName){if(!props[propName]||props.onChange||props.readOnly||props.disabled){return null;}return new Error('You provided a `checked` prop to a form field without an '+'`onChange` handler. This will render a read-only field. If '+'the field should be mutable use `defaultChecked`. Otherwise, '+'set either `onChange` or `readOnly`.');},onChange:ReactPropTypes.func}},getValue:function getValue(input){if(input.props.valueLink){_assertValueLink(input);return input.props.valueLink.value;}return input.props.value;},getChecked:function getChecked(input){if(input.props.checkedLink){_assertCheckedLink(input);return input.props.checkedLink.value;}return input.props.checked;},getOnChange:function getOnChange(input){if(input.props.valueLink){_assertValueLink(input);return _handleLinkedValueChange;}else if(input.props.checkedLink){_assertCheckedLink(input);return _handleLinkedCheckChange;}return input.props.onChange;}};module.exports=LinkedValueUtils;},{"135":135,"78":78}],25:[function(_dereq_,module,exports){'use strict';var ReactBrowserEventEmitter=_dereq_(30);var accumulateInto=_dereq_(105);var forEachAccumulated=_dereq_(120);var invariant=_dereq_(135);function remove(event){event.remove();}var LocalEventTrapMixin={trapBubbledEvent:function trapBubbledEvent(topLevelType,handlerBaseName){"production"!=="development"?invariant(this.isMounted(),'Must be mounted to trap events'):invariant(this.isMounted());var node=this.getDOMNode();"production"!=="development"?invariant(node,'LocalEventTrapMixin.trapBubbledEvent(...): Requires node to be rendered.'):invariant(node);var listener=ReactBrowserEventEmitter.trapBubbledEvent(topLevelType,handlerBaseName,node);this._localEventListeners=accumulateInto(this._localEventListeners,listener);},componentWillUnmount:function componentWillUnmount(){if(this._localEventListeners){forEachAccumulated(this._localEventListeners,remove);}}};module.exports=LocalEventTrapMixin;},{"105":105,"120":120,"135":135,"30":30}],26:[function(_dereq_,module,exports){'use strict';var EventConstants=_dereq_(15);var emptyFunction=_dereq_(114);var topLevelTypes=EventConstants.topLevelTypes;var MobileSafariClickEventPlugin={eventTypes:null,extractEvents:function extractEvents(topLevelType,topLevelTarget,topLevelTargetID,nativeEvent){if(topLevelType===topLevelTypes.topTouchStart){var target=nativeEvent.target;if(target&&!target.onclick){target.onclick=emptyFunction;}}}};module.exports=MobileSafariClickEventPlugin;},{"114":114,"15":15}],27:[function(_dereq_,module,exports){'use strict';function assign(target,sources){if(target==null){throw new TypeError('Object.assign target cannot be null or undefined');}var to=Object(target);var hasOwnProperty=Object.prototype.hasOwnProperty;for(var nextIndex=1;nextIndex<arguments.length;nextIndex++){var nextSource=arguments[nextIndex];if(nextSource==null){continue;}var from=Object(nextSource);for(var key in from){if(hasOwnProperty.call(from,key)){to[key]=from[key];}}}return to;}module.exports=assign;},{}],28:[function(_dereq_,module,exports){'use strict';var invariant=_dereq_(135);var oneArgumentPooler=function oneArgumentPooler(copyFieldsFrom){var Klass=this;if(Klass.instancePool.length){var instance=Klass.instancePool.pop();Klass.call(instance,copyFieldsFrom);return instance;}else{return new Klass(copyFieldsFrom);}};var twoArgumentPooler=function twoArgumentPooler(a1,a2){var Klass=this;if(Klass.instancePool.length){var instance=Klass.instancePool.pop();Klass.call(instance,a1,a2);return instance;}else{return new Klass(a1,a2);}};var threeArgumentPooler=function threeArgumentPooler(a1,a2,a3){var Klass=this;if(Klass.instancePool.length){var instance=Klass.instancePool.pop();Klass.call(instance,a1,a2,a3);return instance;}else{return new Klass(a1,a2,a3);}};var fiveArgumentPooler=function fiveArgumentPooler(a1,a2,a3,a4,a5){var Klass=this;if(Klass.instancePool.length){var instance=Klass.instancePool.pop();Klass.call(instance,a1,a2,a3,a4,a5);return instance;}else{return new Klass(a1,a2,a3,a4,a5);}};var standardReleaser=function standardReleaser(instance){var Klass=this;"production"!=="development"?invariant(instance instanceof Klass,'Trying to release an instance into a pool of a different type.'):invariant(instance instanceof Klass);if(instance.destructor){instance.destructor();}if(Klass.instancePool.length<Klass.poolSize){Klass.instancePool.push(instance);}};var DEFAULT_POOL_SIZE=10;var DEFAULT_POOLER=oneArgumentPooler;var addPoolingTo=function addPoolingTo(CopyConstructor,pooler){var NewKlass=CopyConstructor;NewKlass.instancePool=[];NewKlass.getPooled=pooler||DEFAULT_POOLER;if(!NewKlass.poolSize){NewKlass.poolSize=DEFAULT_POOL_SIZE;}NewKlass.release=standardReleaser;return NewKlass;};var PooledClass={addPoolingTo:addPoolingTo,oneArgumentPooler:oneArgumentPooler,twoArgumentPooler:twoArgumentPooler,threeArgumentPooler:threeArgumentPooler,fiveArgumentPooler:fiveArgumentPooler};module.exports=PooledClass;},{"135":135}],29:[function(_dereq_,module,exports){'use strict';var findDOMNode=_dereq_(117);var ReactBrowserComponentMixin={getDOMNode:function getDOMNode(){return findDOMNode(this);}};module.exports=ReactBrowserComponentMixin;},{"117":117}],30:[function(_dereq_,module,exports){'use strict';var EventConstants=_dereq_(15);var EventPluginHub=_dereq_(17);var EventPluginRegistry=_dereq_(18);var ReactEventEmitterMixin=_dereq_(61);var ViewportMetrics=_dereq_(104);var assign=_dereq_(27);var isEventSupported=_dereq_(136);var alreadyListeningTo={};var isMonitoringScrollValue=false;var reactTopListenersCounter=0;var topEventMapping={topBlur:'blur',topChange:'change',topClick:'click',topCompositionEnd:'compositionend',topCompositionStart:'compositionstart',topCompositionUpdate:'compositionupdate',topContextMenu:'contextmenu',topCopy:'copy',topCut:'cut',topDoubleClick:'dblclick',topDrag:'drag',topDragEnd:'dragend',topDragEnter:'dragenter',topDragExit:'dragexit',topDragLeave:'dragleave',topDragOver:'dragover',topDragStart:'dragstart',topDrop:'drop',topFocus:'focus',topInput:'input',topKeyDown:'keydown',topKeyPress:'keypress',topKeyUp:'keyup',topMouseDown:'mousedown',topMouseMove:'mousemove',topMouseOut:'mouseout',topMouseOver:'mouseover',topMouseUp:'mouseup',topPaste:'paste',topScroll:'scroll',topSelectionChange:'selectionchange',topTextInput:'textInput',topTouchCancel:'touchcancel',topTouchEnd:'touchend',topTouchMove:'touchmove',topTouchStart:'touchstart',topWheel:'wheel'};var topListenersIDKey='_reactListenersID'+String(Math.random()).slice(2);function getListeningForDocument(mountAt){if(!Object.prototype.hasOwnProperty.call(mountAt,topListenersIDKey)){mountAt[topListenersIDKey]=reactTopListenersCounter++;alreadyListeningTo[mountAt[topListenersIDKey]]={};}return alreadyListeningTo[mountAt[topListenersIDKey]];}var ReactBrowserEventEmitter=assign({},ReactEventEmitterMixin,{ReactEventListener:null,injection:{injectReactEventListener:function injectReactEventListener(ReactEventListener){ReactEventListener.setHandleTopLevel(ReactBrowserEventEmitter.handleTopLevel);ReactBrowserEventEmitter.ReactEventListener=ReactEventListener;}},setEnabled:function setEnabled(enabled){if(ReactBrowserEventEmitter.ReactEventListener){ReactBrowserEventEmitter.ReactEventListener.setEnabled(enabled);}},isEnabled:function isEnabled(){return!!(ReactBrowserEventEmitter.ReactEventListener&&ReactBrowserEventEmitter.ReactEventListener.isEnabled());},listenTo:function listenTo(registrationName,contentDocumentHandle){var mountAt=contentDocumentHandle;var isListening=getListeningForDocument(mountAt);var dependencies=EventPluginRegistry.registrationNameDependencies[registrationName];var topLevelTypes=EventConstants.topLevelTypes;for(var i=0,l=dependencies.length;i<l;i++){var dependency=dependencies[i];if(!(isListening.hasOwnProperty(dependency)&&isListening[dependency])){if(dependency===topLevelTypes.topWheel){if(isEventSupported('wheel')){ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(topLevelTypes.topWheel,'wheel',mountAt);}else if(isEventSupported('mousewheel')){ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(topLevelTypes.topWheel,'mousewheel',mountAt);}else{ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(topLevelTypes.topWheel,'DOMMouseScroll',mountAt);}}else if(dependency===topLevelTypes.topScroll){if(isEventSupported('scroll',true)){ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(topLevelTypes.topScroll,'scroll',mountAt);}else{ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(topLevelTypes.topScroll,'scroll',ReactBrowserEventEmitter.ReactEventListener.WINDOW_HANDLE);}}else if(dependency===topLevelTypes.topFocus||dependency===topLevelTypes.topBlur){if(isEventSupported('focus',true)){ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(topLevelTypes.topFocus,'focus',mountAt);ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(topLevelTypes.topBlur,'blur',mountAt);}else if(isEventSupported('focusin')){ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(topLevelTypes.topFocus,'focusin',mountAt);ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(topLevelTypes.topBlur,'focusout',mountAt);}isListening[topLevelTypes.topBlur]=true;isListening[topLevelTypes.topFocus]=true;}else if(topEventMapping.hasOwnProperty(dependency)){ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(dependency,topEventMapping[dependency],mountAt);}isListening[dependency]=true;}}},trapBubbledEvent:function trapBubbledEvent(topLevelType,handlerBaseName,handle){return ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(topLevelType,handlerBaseName,handle);},trapCapturedEvent:function trapCapturedEvent(topLevelType,handlerBaseName,handle){return ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(topLevelType,handlerBaseName,handle);},ensureScrollValueMonitoring:function ensureScrollValueMonitoring(){if(!isMonitoringScrollValue){var refresh=ViewportMetrics.refreshScrollValues;ReactBrowserEventEmitter.ReactEventListener.monitorScrollValue(refresh);isMonitoringScrollValue=true;}},eventNameDispatchConfigs:EventPluginHub.eventNameDispatchConfigs,registrationNameModules:EventPluginHub.registrationNameModules,putListener:EventPluginHub.putListener,getListener:EventPluginHub.getListener,deleteListener:EventPluginHub.deleteListener,deleteAllListeners:EventPluginHub.deleteAllListeners});module.exports=ReactBrowserEventEmitter;},{"104":104,"136":136,"15":15,"17":17,"18":18,"27":27,"61":61}],31:[function(_dereq_,module,exports){'use strict';var ReactReconciler=_dereq_(81);var flattenChildren=_dereq_(118);var instantiateReactComponent=_dereq_(134);var shouldUpdateReactComponent=_dereq_(151);var ReactChildReconciler={instantiateChildren:function instantiateChildren(nestedChildNodes,transaction,context){var children=flattenChildren(nestedChildNodes);for(var name in children){if(children.hasOwnProperty(name)){var child=children[name];var childInstance=instantiateReactComponent(child,null);children[name]=childInstance;}}return children;},updateChildren:function updateChildren(prevChildren,nextNestedChildNodes,transaction,context){var nextChildren=flattenChildren(nextNestedChildNodes);if(!nextChildren&&!prevChildren){return null;}var name;for(name in nextChildren){if(!nextChildren.hasOwnProperty(name)){continue;}var prevChild=prevChildren&&prevChildren[name];var prevElement=prevChild&&prevChild._currentElement;var nextElement=nextChildren[name];if(shouldUpdateReactComponent(prevElement,nextElement)){ReactReconciler.receiveComponent(prevChild,nextElement,transaction,context);nextChildren[name]=prevChild;}else{if(prevChild){ReactReconciler.unmountComponent(prevChild,name);}var nextChildInstance=instantiateReactComponent(nextElement,null);nextChildren[name]=nextChildInstance;}}for(name in prevChildren){if(prevChildren.hasOwnProperty(name)&&!(nextChildren&&nextChildren.hasOwnProperty(name))){ReactReconciler.unmountComponent(prevChildren[name]);}}return nextChildren;},unmountChildren:function unmountChildren(renderedChildren){for(var name in renderedChildren){var renderedChild=renderedChildren[name];ReactReconciler.unmountComponent(renderedChild);}}};module.exports=ReactChildReconciler;},{"118":118,"134":134,"151":151,"81":81}],32:[function(_dereq_,module,exports){'use strict';var PooledClass=_dereq_(28);var ReactFragment=_dereq_(63);var traverseAllChildren=_dereq_(153);var warning=_dereq_(154);var twoArgumentPooler=PooledClass.twoArgumentPooler;var threeArgumentPooler=PooledClass.threeArgumentPooler;function ForEachBookKeeping(forEachFunction,forEachContext){this.forEachFunction=forEachFunction;this.forEachContext=forEachContext;}PooledClass.addPoolingTo(ForEachBookKeeping,twoArgumentPooler);function forEachSingleChild(traverseContext,child,name,i){var forEachBookKeeping=traverseContext;forEachBookKeeping.forEachFunction.call(forEachBookKeeping.forEachContext,child,i);}function forEachChildren(children,forEachFunc,forEachContext){if(children==null){return children;}var traverseContext=ForEachBookKeeping.getPooled(forEachFunc,forEachContext);traverseAllChildren(children,forEachSingleChild,traverseContext);ForEachBookKeeping.release(traverseContext);}function MapBookKeeping(mapResult,mapFunction,mapContext){this.mapResult=mapResult;this.mapFunction=mapFunction;this.mapContext=mapContext;}PooledClass.addPoolingTo(MapBookKeeping,threeArgumentPooler);function mapSingleChildIntoContext(traverseContext,child,name,i){var mapBookKeeping=traverseContext;var mapResult=mapBookKeeping.mapResult;var keyUnique=!mapResult.hasOwnProperty(name);if("production"!=="development"){"production"!=="development"?warning(keyUnique,'ReactChildren.map(...): Encountered two children with the same key, '+'`%s`. Child keys must be unique; when two children share a key, only '+'the first child will be used.',name):null;}if(keyUnique){var mappedChild=mapBookKeeping.mapFunction.call(mapBookKeeping.mapContext,child,i);mapResult[name]=mappedChild;}}function mapChildren(children,func,context){if(children==null){return children;}var mapResult={};var traverseContext=MapBookKeeping.getPooled(mapResult,func,context);traverseAllChildren(children,mapSingleChildIntoContext,traverseContext);MapBookKeeping.release(traverseContext);return ReactFragment.create(mapResult);}function forEachSingleChildDummy(traverseContext,child,name,i){return null;}function countChildren(children,context){return traverseAllChildren(children,forEachSingleChildDummy,null);}var ReactChildren={forEach:forEachChildren,map:mapChildren,count:countChildren};module.exports=ReactChildren;},{"153":153,"154":154,"28":28,"63":63}],33:[function(_dereq_,module,exports){'use strict';var ReactComponent=_dereq_(34);var ReactCurrentOwner=_dereq_(39);var ReactElement=_dereq_(57);var ReactErrorUtils=_dereq_(60);var ReactInstanceMap=_dereq_(67);var ReactLifeCycle=_dereq_(68);var ReactPropTypeLocations=_dereq_(77);var ReactPropTypeLocationNames=_dereq_(76);var ReactUpdateQueue=_dereq_(86);var assign=_dereq_(27);var invariant=_dereq_(135);var keyMirror=_dereq_(140);var keyOf=_dereq_(141);var warning=_dereq_(154);var MIXINS_KEY=keyOf({mixins:null});var SpecPolicy=keyMirror({DEFINE_ONCE:null,DEFINE_MANY:null,OVERRIDE_BASE:null,DEFINE_MANY_MERGED:null});var injectedMixins=[];var ReactClassInterface={mixins:SpecPolicy.DEFINE_MANY,statics:SpecPolicy.DEFINE_MANY,propTypes:SpecPolicy.DEFINE_MANY,contextTypes:SpecPolicy.DEFINE_MANY,childContextTypes:SpecPolicy.DEFINE_MANY,getDefaultProps:SpecPolicy.DEFINE_MANY_MERGED,getInitialState:SpecPolicy.DEFINE_MANY_MERGED,getChildContext:SpecPolicy.DEFINE_MANY_MERGED,render:SpecPolicy.DEFINE_ONCE,componentWillMount:SpecPolicy.DEFINE_MANY,componentDidMount:SpecPolicy.DEFINE_MANY,componentWillReceiveProps:SpecPolicy.DEFINE_MANY,shouldComponentUpdate:SpecPolicy.DEFINE_ONCE,componentWillUpdate:SpecPolicy.DEFINE_MANY,componentDidUpdate:SpecPolicy.DEFINE_MANY,componentWillUnmount:SpecPolicy.DEFINE_MANY,updateComponent:SpecPolicy.OVERRIDE_BASE};var RESERVED_SPEC_KEYS={displayName:function displayName(Constructor,_displayName){Constructor.displayName=_displayName;},mixins:function mixins(Constructor,_mixins){if(_mixins){for(var i=0;i<_mixins.length;i++){mixSpecIntoComponent(Constructor,_mixins[i]);}}},childContextTypes:function childContextTypes(Constructor,_childContextTypes){if("production"!=="development"){validateTypeDef(Constructor,_childContextTypes,ReactPropTypeLocations.childContext);}Constructor.childContextTypes=assign({},Constructor.childContextTypes,_childContextTypes);},contextTypes:function contextTypes(Constructor,_contextTypes){if("production"!=="development"){validateTypeDef(Constructor,_contextTypes,ReactPropTypeLocations.context);}Constructor.contextTypes=assign({},Constructor.contextTypes,_contextTypes);},getDefaultProps:function getDefaultProps(Constructor,_getDefaultProps){if(Constructor.getDefaultProps){Constructor.getDefaultProps=createMergedResultFunction(Constructor.getDefaultProps,_getDefaultProps);}else{Constructor.getDefaultProps=_getDefaultProps;}},propTypes:function propTypes(Constructor,_propTypes){if("production"!=="development"){validateTypeDef(Constructor,_propTypes,ReactPropTypeLocations.prop);}Constructor.propTypes=assign({},Constructor.propTypes,_propTypes);},statics:function statics(Constructor,_statics){mixStaticSpecIntoComponent(Constructor,_statics);}};function validateTypeDef(Constructor,typeDef,location){for(var propName in typeDef){if(typeDef.hasOwnProperty(propName)){"production"!=="development"?warning(typeof typeDef[propName]==='function','%s: %s type `%s` is invalid; it must be a function, usually from '+'React.PropTypes.',Constructor.displayName||'ReactClass',ReactPropTypeLocationNames[location],propName):null;}}}function validateMethodOverride(proto,name){var specPolicy=ReactClassInterface.hasOwnProperty(name)?ReactClassInterface[name]:null;if(ReactClassMixin.hasOwnProperty(name)){"production"!=="development"?invariant(specPolicy===SpecPolicy.OVERRIDE_BASE,'ReactClassInterface: You are attempting to override '+'`%s` from your class specification. Ensure that your method names '+'do not overlap with React methods.',name):invariant(specPolicy===SpecPolicy.OVERRIDE_BASE);}if(proto.hasOwnProperty(name)){"production"!=="development"?invariant(specPolicy===SpecPolicy.DEFINE_MANY||specPolicy===SpecPolicy.DEFINE_MANY_MERGED,'ReactClassInterface: You are attempting to define '+'`%s` on your component more than once. This conflict may be due '+'to a mixin.',name):invariant(specPolicy===SpecPolicy.DEFINE_MANY||specPolicy===SpecPolicy.DEFINE_MANY_MERGED);}}function mixSpecIntoComponent(Constructor,spec){if(!spec){return;}"production"!=="development"?invariant(typeof spec!=='function','ReactClass: You\'re attempting to '+'use a component class as a mixin. Instead, just use a regular object.'):invariant(typeof spec!=='function');"production"!=="development"?invariant(!ReactElement.isValidElement(spec),'ReactClass: You\'re attempting to '+'use a component as a mixin. Instead, just use a regular object.'):invariant(!ReactElement.isValidElement(spec));var proto=Constructor.prototype;if(spec.hasOwnProperty(MIXINS_KEY)){RESERVED_SPEC_KEYS.mixins(Constructor,spec.mixins);}for(var name in spec){if(!spec.hasOwnProperty(name)){continue;}if(name===MIXINS_KEY){continue;}var property=spec[name];validateMethodOverride(proto,name);if(RESERVED_SPEC_KEYS.hasOwnProperty(name)){RESERVED_SPEC_KEYS[name](Constructor,property);}else{var isReactClassMethod=ReactClassInterface.hasOwnProperty(name);var isAlreadyDefined=proto.hasOwnProperty(name);var markedDontBind=property&&property.__reactDontBind;var isFunction=typeof property==='function';var shouldAutoBind=isFunction&&!isReactClassMethod&&!isAlreadyDefined&&!markedDontBind;if(shouldAutoBind){if(!proto.__reactAutoBindMap){proto.__reactAutoBindMap={};}proto.__reactAutoBindMap[name]=property;proto[name]=property;}else{if(isAlreadyDefined){var specPolicy=ReactClassInterface[name];"production"!=="development"?invariant(isReactClassMethod&&(specPolicy===SpecPolicy.DEFINE_MANY_MERGED||specPolicy===SpecPolicy.DEFINE_MANY),'ReactClass: Unexpected spec policy %s for key %s '+'when mixing in component specs.',specPolicy,name):invariant(isReactClassMethod&&(specPolicy===SpecPolicy.DEFINE_MANY_MERGED||specPolicy===SpecPolicy.DEFINE_MANY));if(specPolicy===SpecPolicy.DEFINE_MANY_MERGED){proto[name]=createMergedResultFunction(proto[name],property);}else if(specPolicy===SpecPolicy.DEFINE_MANY){proto[name]=createChainedFunction(proto[name],property);}}else{proto[name]=property;if("production"!=="development"){if(typeof property==='function'&&spec.displayName){proto[name].displayName=spec.displayName+'_'+name;}}}}}}}function mixStaticSpecIntoComponent(Constructor,statics){if(!statics){return;}for(var name in statics){var property=statics[name];if(!statics.hasOwnProperty(name)){continue;}var isReserved=name in RESERVED_SPEC_KEYS;"production"!=="development"?invariant(!isReserved,'ReactClass: You are attempting to define a reserved '+'property, `%s`, that shouldn\'t be on the "statics" key. Define it '+'as an instance property instead; it will still be accessible on the '+'constructor.',name):invariant(!isReserved);var isInherited=name in Constructor;"production"!=="development"?invariant(!isInherited,'ReactClass: You are attempting to define '+'`%s` on your component more than once. This conflict may be '+'due to a mixin.',name):invariant(!isInherited);Constructor[name]=property;}}function mergeIntoWithNoDuplicateKeys(one,two){"production"!=="development"?invariant(one&&two&&(typeof one==="undefined"?"undefined":_typeof(one))==='object'&&(typeof two==="undefined"?"undefined":_typeof(two))==='object','mergeIntoWithNoDuplicateKeys(): Cannot merge non-objects.'):invariant(one&&two&&(typeof one==="undefined"?"undefined":_typeof(one))==='object'&&(typeof two==="undefined"?"undefined":_typeof(two))==='object');for(var key in two){if(two.hasOwnProperty(key)){"production"!=="development"?invariant(one[key]===undefined,'mergeIntoWithNoDuplicateKeys(): '+'Tried to merge two objects with the same key: `%s`. This conflict '+'may be due to a mixin; in particular, this may be caused by two '+'getInitialState() or getDefaultProps() methods returning objects '+'with clashing keys.',key):invariant(one[key]===undefined);one[key]=two[key];}}return one;}function createMergedResultFunction(one,two){return function mergedResult(){var a=one.apply(this,arguments);var b=two.apply(this,arguments);if(a==null){return b;}else if(b==null){return a;}var c={};mergeIntoWithNoDuplicateKeys(c,a);mergeIntoWithNoDuplicateKeys(c,b);return c;};}function createChainedFunction(one,two){return function chainedFunction(){one.apply(this,arguments);two.apply(this,arguments);};}function bindAutoBindMethod(component,method){var boundMethod=method.bind(component);if("production"!=="development"){boundMethod.__reactBoundContext=component;boundMethod.__reactBoundMethod=method;boundMethod.__reactBoundArguments=null;var componentName=component.constructor.displayName;var _bind=boundMethod.bind;boundMethod.bind=function(newThis){for(var args=[],$__0=1,$__1=arguments.length;$__0<$__1;$__0++){args.push(arguments[$__0]);}if(newThis!==component&&newThis!==null){"production"!=="development"?warning(false,'bind(): React component methods may only be bound to the '+'component instance. See %s',componentName):null;}else if(!args.length){"production"!=="development"?warning(false,'bind(): You are binding a component method to the component. '+'React does this for you automatically in a high-performance '+'way, so you can safely remove this call. See %s',componentName):null;return boundMethod;}var reboundMethod=_bind.apply(boundMethod,arguments);reboundMethod.__reactBoundContext=component;reboundMethod.__reactBoundMethod=method;reboundMethod.__reactBoundArguments=args;return reboundMethod;};}return boundMethod;}function bindAutoBindMethods(component){for(var autoBindKey in component.__reactAutoBindMap){if(component.__reactAutoBindMap.hasOwnProperty(autoBindKey)){var method=component.__reactAutoBindMap[autoBindKey];component[autoBindKey]=bindAutoBindMethod(component,ReactErrorUtils.guard(method,component.constructor.displayName+'.'+autoBindKey));}}}var typeDeprecationDescriptor={enumerable:false,get:function get(){var displayName=this.displayName||this.name||'Component';"production"!=="development"?warning(false,'%s.type is deprecated. Use %s directly to access the class.',displayName,displayName):null;Object.defineProperty(this,'type',{value:this});return this;}};var ReactClassMixin={replaceState:function replaceState(newState,callback){ReactUpdateQueue.enqueueReplaceState(this,newState);if(callback){ReactUpdateQueue.enqueueCallback(this,callback);}},isMounted:function isMounted(){if("production"!=="development"){var owner=ReactCurrentOwner.current;if(owner!==null){"production"!=="development"?warning(owner._warnedAboutRefsInRender,'%s is accessing isMounted inside its render() function. '+'render() should be a pure function of props and state. It should '+'never access something that requires stale data from the previous '+'render, such as refs. Move this logic to componentDidMount and '+'componentDidUpdate instead.',owner.getName()||'A component'):null;owner._warnedAboutRefsInRender=true;}}var internalInstance=ReactInstanceMap.get(this);return internalInstance&&internalInstance!==ReactLifeCycle.currentlyMountingInstance;},setProps:function setProps(partialProps,callback){ReactUpdateQueue.enqueueSetProps(this,partialProps);if(callback){ReactUpdateQueue.enqueueCallback(this,callback);}},replaceProps:function replaceProps(newProps,callback){ReactUpdateQueue.enqueueReplaceProps(this,newProps);if(callback){ReactUpdateQueue.enqueueCallback(this,callback);}}};var ReactClassComponent=function ReactClassComponent(){};assign(ReactClassComponent.prototype,ReactComponent.prototype,ReactClassMixin);var ReactClass={createClass:function createClass(spec){var Constructor=function Constructor(props,context){if("production"!=="development"){"production"!=="development"?warning(this instanceof Constructor,'Something is calling a React component directly. Use a factory or '+'JSX instead. See: https://fb.me/react-legacyfactory'):null;}if(this.__reactAutoBindMap){bindAutoBindMethods(this);}this.props=props;this.context=context;this.state=null;var initialState=this.getInitialState?this.getInitialState():null;if("production"!=="development"){if(typeof initialState==='undefined'&&this.getInitialState._isMockFunction){initialState=null;}}"production"!=="development"?invariant((typeof initialState==="undefined"?"undefined":_typeof(initialState))==='object'&&!Array.isArray(initialState),'%s.getInitialState(): must return an object or null',Constructor.displayName||'ReactCompositeComponent'):invariant((typeof initialState==="undefined"?"undefined":_typeof(initialState))==='object'&&!Array.isArray(initialState));this.state=initialState;};Constructor.prototype=new ReactClassComponent();Constructor.prototype.constructor=Constructor;injectedMixins.forEach(mixSpecIntoComponent.bind(null,Constructor));mixSpecIntoComponent(Constructor,spec);if(Constructor.getDefaultProps){Constructor.defaultProps=Constructor.getDefaultProps();}if("production"!=="development"){if(Constructor.getDefaultProps){Constructor.getDefaultProps.isReactClassApproved={};}if(Constructor.prototype.getInitialState){Constructor.prototype.getInitialState.isReactClassApproved={};}}"production"!=="development"?invariant(Constructor.prototype.render,'createClass(...): Class specification must implement a `render` method.'):invariant(Constructor.prototype.render);if("production"!=="development"){"production"!=="development"?warning(!Constructor.prototype.componentShouldUpdate,'%s has a method called '+'componentShouldUpdate(). Did you mean shouldComponentUpdate()? '+'The name is phrased as a question because the function is '+'expected to return a value.',spec.displayName||'A component'):null;}for(var methodName in ReactClassInterface){if(!Constructor.prototype[methodName]){Constructor.prototype[methodName]=null;}}Constructor.type=Constructor;if("production"!=="development"){try{Object.defineProperty(Constructor,'type',typeDeprecationDescriptor);}catch(x){}}return Constructor;},injection:{injectMixin:function injectMixin(mixin){injectedMixins.push(mixin);}}};module.exports=ReactClass;},{"135":135,"140":140,"141":141,"154":154,"27":27,"34":34,"39":39,"57":57,"60":60,"67":67,"68":68,"76":76,"77":77,"86":86}],34:[function(_dereq_,module,exports){'use strict';var ReactUpdateQueue=_dereq_(86);var invariant=_dereq_(135);var warning=_dereq_(154);function ReactComponent(props,context){this.props=props;this.context=context;}ReactComponent.prototype.setState=function(partialState,callback){"production"!=="development"?invariant((typeof partialState==="undefined"?"undefined":_typeof(partialState))==='object'||typeof partialState==='function'||partialState==null,'setState(...): takes an object of state variables to update or a '+'function which returns an object of state variables.'):invariant((typeof partialState==="undefined"?"undefined":_typeof(partialState))==='object'||typeof partialState==='function'||partialState==null);if("production"!=="development"){"production"!=="development"?warning(partialState!=null,'setState(...): You passed an undefined or null state object; '+'instead, use forceUpdate().'):null;}ReactUpdateQueue.enqueueSetState(this,partialState);if(callback){ReactUpdateQueue.enqueueCallback(this,callback);}};ReactComponent.prototype.forceUpdate=function(callback){ReactUpdateQueue.enqueueForceUpdate(this);if(callback){ReactUpdateQueue.enqueueCallback(this,callback);}};if("production"!=="development"){var deprecatedAPIs={getDOMNode:['getDOMNode','Use React.findDOMNode(component) instead.'],isMounted:['isMounted','Instead, make sure to clean up subscriptions and pending requests in '+'componentWillUnmount to prevent memory leaks.'],replaceProps:['replaceProps','Instead call React.render again at the top level.'],replaceState:['replaceState','Refactor your code to use setState instead (see '+'https://github.com/facebook/react/issues/3236).'],setProps:['setProps','Instead call React.render again at the top level.']};var defineDeprecationWarning=function defineDeprecationWarning(methodName,info){try{Object.defineProperty(ReactComponent.prototype,methodName,{get:function get(){"production"!=="development"?warning(false,'%s(...) is deprecated in plain JavaScript React classes. %s',info[0],info[1]):null;return undefined;}});}catch(x){}};for(var fnName in deprecatedAPIs){if(deprecatedAPIs.hasOwnProperty(fnName)){defineDeprecationWarning(fnName,deprecatedAPIs[fnName]);}}}module.exports=ReactComponent;},{"135":135,"154":154,"86":86}],35:[function(_dereq_,module,exports){'use strict';var ReactDOMIDOperations=_dereq_(44);var ReactMount=_dereq_(70);var ReactComponentBrowserEnvironment={processChildrenUpdates:ReactDOMIDOperations.dangerouslyProcessChildrenUpdates,replaceNodeWithMarkupByID:ReactDOMIDOperations.dangerouslyReplaceNodeWithMarkupByID,unmountIDFromEnvironment:function unmountIDFromEnvironment(rootNodeID){ReactMount.purgeID(rootNodeID);}};module.exports=ReactComponentBrowserEnvironment;},{"44":44,"70":70}],36:[function(_dereq_,module,exports){'use strict';var invariant=_dereq_(135);var injected=false;var ReactComponentEnvironment={unmountIDFromEnvironment:null,replaceNodeWithMarkupByID:null,processChildrenUpdates:null,injection:{injectEnvironment:function injectEnvironment(environment){"production"!=="development"?invariant(!injected,'ReactCompositeComponent: injectEnvironment() can only be called once.'):invariant(!injected);ReactComponentEnvironment.unmountIDFromEnvironment=environment.unmountIDFromEnvironment;ReactComponentEnvironment.replaceNodeWithMarkupByID=environment.replaceNodeWithMarkupByID;ReactComponentEnvironment.processChildrenUpdates=environment.processChildrenUpdates;injected=true;}}};module.exports=ReactComponentEnvironment;},{"135":135}],37:[function(_dereq_,module,exports){'use strict';var ReactComponentEnvironment=_dereq_(36);var ReactContext=_dereq_(38);var ReactCurrentOwner=_dereq_(39);var ReactElement=_dereq_(57);var ReactElementValidator=_dereq_(58);var ReactInstanceMap=_dereq_(67);var ReactLifeCycle=_dereq_(68);var ReactNativeComponent=_dereq_(73);var ReactPerf=_dereq_(75);var ReactPropTypeLocations=_dereq_(77);var ReactPropTypeLocationNames=_dereq_(76);var ReactReconciler=_dereq_(81);var ReactUpdates=_dereq_(87);var assign=_dereq_(27);var emptyObject=_dereq_(115);var invariant=_dereq_(135);var shouldUpdateReactComponent=_dereq_(151);var warning=_dereq_(154);function getDeclarationErrorAddendum(component){var owner=component._currentElement._owner||null;if(owner){var name=owner.getName();if(name){return' Check the render method of `'+name+'`.';}}return'';}var nextMountID=1;var ReactCompositeComponentMixin={construct:function construct(element){this._currentElement=element;this._rootNodeID=null;this._instance=null;this._pendingElement=null;this._pendingStateQueue=null;this._pendingReplaceState=false;this._pendingForceUpdate=false;this._renderedComponent=null;this._context=null;this._mountOrder=0;this._isTopLevel=false;this._pendingCallbacks=null;},mountComponent:function mountComponent(rootID,transaction,context){this._context=context;this._mountOrder=nextMountID++;this._rootNodeID=rootID;var publicProps=this._processProps(this._currentElement.props);var publicContext=this._processContext(this._currentElement._context);var Component=ReactNativeComponent.getComponentClassForElement(this._currentElement);var inst=new Component(publicProps,publicContext);if("production"!=="development"){"production"!=="development"?warning(inst.render!=null,'%s(...): No `render` method found on the returned component '+'instance: you may have forgotten to define `render` in your '+'component or you may have accidentally tried to render an element '+'whose type is a function that isn\'t a React component.',Component.displayName||Component.name||'Component'):null;}inst.props=publicProps;inst.context=publicContext;inst.refs=emptyObject;this._instance=inst;ReactInstanceMap.set(inst,this);if("production"!=="development"){this._warnIfContextsDiffer(this._currentElement._context,context);}if("production"!=="development"){"production"!=="development"?warning(!inst.getInitialState||inst.getInitialState.isReactClassApproved,'getInitialState was defined on %s, a plain JavaScript class. '+'This is only supported for classes created using React.createClass. '+'Did you mean to define a state property instead?',this.getName()||'a component'):null;"production"!=="development"?warning(!inst.getDefaultProps||inst.getDefaultProps.isReactClassApproved,'getDefaultProps was defined on %s, a plain JavaScript class. '+'This is only supported for classes created using React.createClass. '+'Use a static property to define defaultProps instead.',this.getName()||'a component'):null;"production"!=="development"?warning(!inst.propTypes,'propTypes was defined as an instance property on %s. Use a static '+'property to define propTypes instead.',this.getName()||'a component'):null;"production"!=="development"?warning(!inst.contextTypes,'contextTypes was defined as an instance property on %s. Use a '+'static property to define contextTypes instead.',this.getName()||'a component'):null;"production"!=="development"?warning(typeof inst.componentShouldUpdate!=='function','%s has a method called '+'componentShouldUpdate(). Did you mean shouldComponentUpdate()? '+'The name is phrased as a question because the function is '+'expected to return a value.',this.getName()||'A component'):null;}var initialState=inst.state;if(initialState===undefined){inst.state=initialState=null;}"production"!=="development"?invariant((typeof initialState==="undefined"?"undefined":_typeof(initialState))==='object'&&!Array.isArray(initialState),'%s.state: must be set to an object or null',this.getName()||'ReactCompositeComponent'):invariant((typeof initialState==="undefined"?"undefined":_typeof(initialState))==='object'&&!Array.isArray(initialState));this._pendingStateQueue=null;this._pendingReplaceState=false;this._pendingForceUpdate=false;var childContext;var renderedElement;var previouslyMounting=ReactLifeCycle.currentlyMountingInstance;ReactLifeCycle.currentlyMountingInstance=this;try{if(inst.componentWillMount){inst.componentWillMount();if(this._pendingStateQueue){inst.state=this._processPendingState(inst.props,inst.context);}}childContext=this._getValidatedChildContext(context);renderedElement=this._renderValidatedComponent(childContext);}finally{ReactLifeCycle.currentlyMountingInstance=previouslyMounting;}this._renderedComponent=this._instantiateReactComponent(renderedElement,this._currentElement.type);var markup=ReactReconciler.mountComponent(this._renderedComponent,rootID,transaction,this._mergeChildContext(context,childContext));if(inst.componentDidMount){transaction.getReactMountReady().enqueue(inst.componentDidMount,inst);}return markup;},unmountComponent:function unmountComponent(){var inst=this._instance;if(inst.componentWillUnmount){var previouslyUnmounting=ReactLifeCycle.currentlyUnmountingInstance;ReactLifeCycle.currentlyUnmountingInstance=this;try{inst.componentWillUnmount();}finally{ReactLifeCycle.currentlyUnmountingInstance=previouslyUnmounting;}}ReactReconciler.unmountComponent(this._renderedComponent);this._renderedComponent=null;this._pendingStateQueue=null;this._pendingReplaceState=false;this._pendingForceUpdate=false;this._pendingCallbacks=null;this._pendingElement=null;this._context=null;this._rootNodeID=null;ReactInstanceMap.remove(inst);},_setPropsInternal:function _setPropsInternal(partialProps,callback){var element=this._pendingElement||this._currentElement;this._pendingElement=ReactElement.cloneAndReplaceProps(element,assign({},element.props,partialProps));ReactUpdates.enqueueUpdate(this,callback);},_maskContext:function _maskContext(context){var maskedContext=null;if(typeof this._currentElement.type==='string'){return emptyObject;}var contextTypes=this._currentElement.type.contextTypes;if(!contextTypes){return emptyObject;}maskedContext={};for(var contextName in contextTypes){maskedContext[contextName]=context[contextName];}return maskedContext;},_processContext:function _processContext(context){var maskedContext=this._maskContext(context);if("production"!=="development"){var Component=ReactNativeComponent.getComponentClassForElement(this._currentElement);if(Component.contextTypes){this._checkPropTypes(Component.contextTypes,maskedContext,ReactPropTypeLocations.context);}}return maskedContext;},_getValidatedChildContext:function _getValidatedChildContext(currentContext){var inst=this._instance;var childContext=inst.getChildContext&&inst.getChildContext();if(childContext){"production"!=="development"?invariant(_typeof(inst.constructor.childContextTypes)==='object','%s.getChildContext(): childContextTypes must be defined in order to '+'use getChildContext().',this.getName()||'ReactCompositeComponent'):invariant(_typeof(inst.constructor.childContextTypes)==='object');if("production"!=="development"){this._checkPropTypes(inst.constructor.childContextTypes,childContext,ReactPropTypeLocations.childContext);}for(var name in childContext){"production"!=="development"?invariant(name in inst.constructor.childContextTypes,'%s.getChildContext(): key "%s" is not defined in childContextTypes.',this.getName()||'ReactCompositeComponent',name):invariant(name in inst.constructor.childContextTypes);}return childContext;}return null;},_mergeChildContext:function _mergeChildContext(currentContext,childContext){if(childContext){return assign({},currentContext,childContext);}return currentContext;},_processProps:function _processProps(newProps){if("production"!=="development"){var Component=ReactNativeComponent.getComponentClassForElement(this._currentElement);if(Component.propTypes){this._checkPropTypes(Component.propTypes,newProps,ReactPropTypeLocations.prop);}}return newProps;},_checkPropTypes:function _checkPropTypes(propTypes,props,location){var componentName=this.getName();for(var propName in propTypes){if(propTypes.hasOwnProperty(propName)){var error;try{"production"!=="development"?invariant(typeof propTypes[propName]==='function','%s: %s type `%s` is invalid; it must be a function, usually '+'from React.PropTypes.',componentName||'React class',ReactPropTypeLocationNames[location],propName):invariant(typeof propTypes[propName]==='function');error=propTypes[propName](props,propName,componentName,location);}catch(ex){error=ex;}if(error instanceof Error){var addendum=getDeclarationErrorAddendum(this);if(location===ReactPropTypeLocations.prop){"production"!=="development"?warning(false,'Failed Composite propType: %s%s',error.message,addendum):null;}else{"production"!=="development"?warning(false,'Failed Context Types: %s%s',error.message,addendum):null;}}}}},receiveComponent:function receiveComponent(nextElement,transaction,nextContext){var prevElement=this._currentElement;var prevContext=this._context;this._pendingElement=null;this.updateComponent(transaction,prevElement,nextElement,prevContext,nextContext);},performUpdateIfNecessary:function performUpdateIfNecessary(transaction){if(this._pendingElement!=null){ReactReconciler.receiveComponent(this,this._pendingElement||this._currentElement,transaction,this._context);}if(this._pendingStateQueue!==null||this._pendingForceUpdate){if("production"!=="development"){ReactElementValidator.checkAndWarnForMutatedProps(this._currentElement);}this.updateComponent(transaction,this._currentElement,this._currentElement,this._context,this._context);}},_warnIfContextsDiffer:function _warnIfContextsDiffer(ownerBasedContext,parentBasedContext){ownerBasedContext=this._maskContext(ownerBasedContext);parentBasedContext=this._maskContext(parentBasedContext);var parentKeys=Object.keys(parentBasedContext).sort();var displayName=this.getName()||'ReactCompositeComponent';for(var i=0;i<parentKeys.length;i++){var key=parentKeys[i];"production"!=="development"?warning(ownerBasedContext[key]===parentBasedContext[key],'owner-based and parent-based contexts differ '+'(values: `%s` vs `%s`) for key (%s) while mounting %s '+'(see: http://fb.me/react-context-by-parent)',ownerBasedContext[key],parentBasedContext[key],key,displayName):null;}},updateComponent:function updateComponent(transaction,prevParentElement,nextParentElement,prevUnmaskedContext,nextUnmaskedContext){var inst=this._instance;var nextContext=inst.context;var nextProps=inst.props;if(prevParentElement!==nextParentElement){nextContext=this._processContext(nextParentElement._context);nextProps=this._processProps(nextParentElement.props);if("production"!=="development"){if(nextUnmaskedContext!=null){this._warnIfContextsDiffer(nextParentElement._context,nextUnmaskedContext);}}if(inst.componentWillReceiveProps){inst.componentWillReceiveProps(nextProps,nextContext);}}var nextState=this._processPendingState(nextProps,nextContext);var shouldUpdate=this._pendingForceUpdate||!inst.shouldComponentUpdate||inst.shouldComponentUpdate(nextProps,nextState,nextContext);if("production"!=="development"){"production"!=="development"?warning(typeof shouldUpdate!=='undefined','%s.shouldComponentUpdate(): Returned undefined instead of a '+'boolean value. Make sure to return true or false.',this.getName()||'ReactCompositeComponent'):null;}if(shouldUpdate){this._pendingForceUpdate=false;this._performComponentUpdate(nextParentElement,nextProps,nextState,nextContext,transaction,nextUnmaskedContext);}else{this._currentElement=nextParentElement;this._context=nextUnmaskedContext;inst.props=nextProps;inst.state=nextState;inst.context=nextContext;}},_processPendingState:function _processPendingState(props,context){var inst=this._instance;var queue=this._pendingStateQueue;var replace=this._pendingReplaceState;this._pendingReplaceState=false;this._pendingStateQueue=null;if(!queue){return inst.state;}if(replace&&queue.length===1){return queue[0];}var nextState=assign({},replace?queue[0]:inst.state);for(var i=replace?1:0;i<queue.length;i++){var partial=queue[i];assign(nextState,typeof partial==='function'?partial.call(inst,nextState,props,context):partial);}return nextState;},_performComponentUpdate:function _performComponentUpdate(nextElement,nextProps,nextState,nextContext,transaction,unmaskedContext){var inst=this._instance;var prevProps=inst.props;var prevState=inst.state;var prevContext=inst.context;if(inst.componentWillUpdate){inst.componentWillUpdate(nextProps,nextState,nextContext);}this._currentElement=nextElement;this._context=unmaskedContext;inst.props=nextProps;inst.state=nextState;inst.context=nextContext;this._updateRenderedComponent(transaction,unmaskedContext);if(inst.componentDidUpdate){transaction.getReactMountReady().enqueue(inst.componentDidUpdate.bind(inst,prevProps,prevState,prevContext),inst);}},_updateRenderedComponent:function _updateRenderedComponent(transaction,context){var prevComponentInstance=this._renderedComponent;var prevRenderedElement=prevComponentInstance._currentElement;var childContext=this._getValidatedChildContext();var nextRenderedElement=this._renderValidatedComponent(childContext);if(shouldUpdateReactComponent(prevRenderedElement,nextRenderedElement)){ReactReconciler.receiveComponent(prevComponentInstance,nextRenderedElement,transaction,this._mergeChildContext(context,childContext));}else{var thisID=this._rootNodeID;var prevComponentID=prevComponentInstance._rootNodeID;ReactReconciler.unmountComponent(prevComponentInstance);this._renderedComponent=this._instantiateReactComponent(nextRenderedElement,this._currentElement.type);var nextMarkup=ReactReconciler.mountComponent(this._renderedComponent,thisID,transaction,this._mergeChildContext(context,childContext));this._replaceNodeWithMarkupByID(prevComponentID,nextMarkup);}},_replaceNodeWithMarkupByID:function _replaceNodeWithMarkupByID(prevComponentID,nextMarkup){ReactComponentEnvironment.replaceNodeWithMarkupByID(prevComponentID,nextMarkup);},_renderValidatedComponentWithoutOwnerOrContext:function _renderValidatedComponentWithoutOwnerOrContext(){var inst=this._instance;var renderedComponent=inst.render();if("production"!=="development"){if(typeof renderedComponent==='undefined'&&inst.render._isMockFunction){renderedComponent=null;}}return renderedComponent;},_renderValidatedComponent:function _renderValidatedComponent(childContext){var renderedComponent;var previousContext=ReactContext.current;ReactContext.current=this._mergeChildContext(this._currentElement._context,childContext);ReactCurrentOwner.current=this;try{renderedComponent=this._renderValidatedComponentWithoutOwnerOrContext();}finally{ReactContext.current=previousContext;ReactCurrentOwner.current=null;}"production"!=="development"?invariant(renderedComponent===null||renderedComponent===false||ReactElement.isValidElement(renderedComponent),'%s.render(): A valid ReactComponent must be returned. You may have '+'returned undefined, an array or some other invalid object.',this.getName()||'ReactCompositeComponent'):invariant(renderedComponent===null||renderedComponent===false||ReactElement.isValidElement(renderedComponent));return renderedComponent;},attachRef:function attachRef(ref,component){var inst=this.getPublicInstance();var refs=inst.refs===emptyObject?inst.refs={}:inst.refs;refs[ref]=component.getPublicInstance();},detachRef:function detachRef(ref){var refs=this.getPublicInstance().refs;delete refs[ref];},getName:function getName(){var type=this._currentElement.type;var constructor=this._instance&&this._instance.constructor;return type.displayName||constructor&&constructor.displayName||type.name||constructor&&constructor.name||null;},getPublicInstance:function getPublicInstance(){return this._instance;},_instantiateReactComponent:null};ReactPerf.measureMethods(ReactCompositeComponentMixin,'ReactCompositeComponent',{mountComponent:'mountComponent',updateComponent:'updateComponent',_renderValidatedComponent:'_renderValidatedComponent'});var ReactCompositeComponent={Mixin:ReactCompositeComponentMixin};module.exports=ReactCompositeComponent;},{"115":115,"135":135,"151":151,"154":154,"27":27,"36":36,"38":38,"39":39,"57":57,"58":58,"67":67,"68":68,"73":73,"75":75,"76":76,"77":77,"81":81,"87":87}],38:[function(_dereq_,module,exports){'use strict';var assign=_dereq_(27);var emptyObject=_dereq_(115);var warning=_dereq_(154);var didWarn=false;var ReactContext={current:emptyObject,withContext:function withContext(newContext,scopedCallback){if("production"!=="development"){"production"!=="development"?warning(didWarn,'withContext is deprecated and will be removed in a future version. '+'Use a wrapper component with getChildContext instead.'):null;didWarn=true;}var result;var previousContext=ReactContext.current;ReactContext.current=assign({},previousContext,newContext);try{result=scopedCallback();}finally{ReactContext.current=previousContext;}return result;}};module.exports=ReactContext;},{"115":115,"154":154,"27":27}],39:[function(_dereq_,module,exports){'use strict';var ReactCurrentOwner={current:null};module.exports=ReactCurrentOwner;},{}],40:[function(_dereq_,module,exports){'use strict';var ReactElement=_dereq_(57);var ReactElementValidator=_dereq_(58);var mapObject=_dereq_(142);function createDOMFactory(tag){if("production"!=="development"){return ReactElementValidator.createFactory(tag);}return ReactElement.createFactory(tag);}var ReactDOM=mapObject({a:'a',abbr:'abbr',address:'address',area:'area',article:'article',aside:'aside',audio:'audio',b:'b',base:'base',bdi:'bdi',bdo:'bdo',big:'big',blockquote:'blockquote',body:'body',br:'br',button:'button',canvas:'canvas',caption:'caption',cite:'cite',code:'code',col:'col',colgroup:'colgroup',data:'data',datalist:'datalist',dd:'dd',del:'del',details:'details',dfn:'dfn',dialog:'dialog',div:'div',dl:'dl',dt:'dt',em:'em',embed:'embed',fieldset:'fieldset',figcaption:'figcaption',figure:'figure',footer:'footer',form:'form',h1:'h1',h2:'h2',h3:'h3',h4:'h4',h5:'h5',h6:'h6',head:'head',header:'header',hr:'hr',html:'html',i:'i',iframe:'iframe',img:'img',input:'input',ins:'ins',kbd:'kbd',keygen:'keygen',label:'label',legend:'legend',li:'li',link:'link',main:'main',map:'map',mark:'mark',menu:'menu',menuitem:'menuitem',meta:'meta',meter:'meter',nav:'nav',noscript:'noscript',object:'object',ol:'ol',optgroup:'optgroup',option:'option',output:'output',p:'p',param:'param',picture:'picture',pre:'pre',progress:'progress',q:'q',rp:'rp',rt:'rt',ruby:'ruby',s:'s',samp:'samp',script:'script',section:'section',select:'select',small:'small',source:'source',span:'span',strong:'strong',style:'style',sub:'sub',summary:'summary',sup:'sup',table:'table',tbody:'tbody',td:'td',textarea:'textarea',tfoot:'tfoot',th:'th',thead:'thead',time:'time',title:'title',tr:'tr',track:'track',u:'u',ul:'ul','var':'var',video:'video',wbr:'wbr',circle:'circle',clipPath:'clipPath',defs:'defs',ellipse:'ellipse',g:'g',line:'line',linearGradient:'linearGradient',mask:'mask',path:'path',pattern:'pattern',polygon:'polygon',polyline:'polyline',radialGradient:'radialGradient',rect:'rect',stop:'stop',svg:'svg',text:'text',tspan:'tspan'},createDOMFactory);module.exports=ReactDOM;},{"142":142,"57":57,"58":58}],41:[function(_dereq_,module,exports){'use strict';var AutoFocusMixin=_dereq_(2);var ReactBrowserComponentMixin=_dereq_(29);var ReactClass=_dereq_(33);var ReactElement=_dereq_(57);var keyMirror=_dereq_(140);var button=ReactElement.createFactory('button');var mouseListenerNames=keyMirror({onClick:true,onDoubleClick:true,onMouseDown:true,onMouseMove:true,onMouseUp:true,onClickCapture:true,onDoubleClickCapture:true,onMouseDownCapture:true,onMouseMoveCapture:true,onMouseUpCapture:true});var ReactDOMButton=ReactClass.createClass({displayName:'ReactDOMButton',tagName:'BUTTON',mixins:[AutoFocusMixin,ReactBrowserComponentMixin],render:function render(){var props={};for(var key in this.props){if(this.props.hasOwnProperty(key)&&(!this.props.disabled||!mouseListenerNames[key])){props[key]=this.props[key];}}return button(props,this.props.children);}});module.exports=ReactDOMButton;},{"140":140,"2":2,"29":29,"33":33,"57":57}],42:[function(_dereq_,module,exports){'use strict';var CSSPropertyOperations=_dereq_(5);var DOMProperty=_dereq_(10);var DOMPropertyOperations=_dereq_(11);var ReactBrowserEventEmitter=_dereq_(30);var ReactComponentBrowserEnvironment=_dereq_(35);var ReactMount=_dereq_(70);var ReactMultiChild=_dereq_(71);var ReactPerf=_dereq_(75);var assign=_dereq_(27);var escapeTextContentForBrowser=_dereq_(116);var invariant=_dereq_(135);var isEventSupported=_dereq_(136);var keyOf=_dereq_(141);var warning=_dereq_(154);var deleteListener=ReactBrowserEventEmitter.deleteListener;var listenTo=ReactBrowserEventEmitter.listenTo;var registrationNameModules=ReactBrowserEventEmitter.registrationNameModules;var CONTENT_TYPES={'string':true,'number':true};var STYLE=keyOf({style:null});var ELEMENT_NODE_TYPE=1;var BackendIDOperations=null;function assertValidProps(props){if(!props){return;}if(props.dangerouslySetInnerHTML!=null){"production"!=="development"?invariant(props.children==null,'Can only set one of `children` or `props.dangerouslySetInnerHTML`.'):invariant(props.children==null);"production"!=="development"?invariant(_typeof(props.dangerouslySetInnerHTML)==='object'&&'__html'in props.dangerouslySetInnerHTML,'`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. '+'Please visit https://fb.me/react-invariant-dangerously-set-inner-html '+'for more information.'):invariant(_typeof(props.dangerouslySetInnerHTML)==='object'&&'__html'in props.dangerouslySetInnerHTML);}if("production"!=="development"){"production"!=="development"?warning(props.innerHTML==null,'Directly setting property `innerHTML` is not permitted. '+'For more information, lookup documentation on `dangerouslySetInnerHTML`.'):null;"production"!=="development"?warning(!props.contentEditable||props.children==null,'A component is `contentEditable` and contains `children` managed by '+'React. It is now your responsibility to guarantee that none of '+'those nodes are unexpectedly modified or duplicated. This is '+'probably not intentional.'):null;}"production"!=="development"?invariant(props.style==null||_typeof(props.style)==='object','The `style` prop expects a mapping from style properties to values, '+'not a string. For example, style={{marginRight: spacing + \'em\'}} when '+'using JSX.'):invariant(props.style==null||_typeof(props.style)==='object');}function putListener(id,registrationName,listener,transaction){if("production"!=="development"){"production"!=="development"?warning(registrationName!=='onScroll'||isEventSupported('scroll',true),'This browser doesn\'t support the `onScroll` event'):null;}var container=ReactMount.findReactContainerForID(id);if(container){var doc=container.nodeType===ELEMENT_NODE_TYPE?container.ownerDocument:container;listenTo(registrationName,doc);}transaction.getPutListenerQueue().enqueuePutListener(id,registrationName,listener);}var omittedCloseTags={'area':true,'base':true,'br':true,'col':true,'embed':true,'hr':true,'img':true,'input':true,'keygen':true,'link':true,'meta':true,'param':true,'source':true,'track':true,'wbr':true};var VALID_TAG_REGEX=/^[a-zA-Z][a-zA-Z:_\.\-\d]*$/;var validatedTagCache={};var hasOwnProperty={}.hasOwnProperty;function validateDangerousTag(tag){if(!hasOwnProperty.call(validatedTagCache,tag)){"production"!=="development"?invariant(VALID_TAG_REGEX.test(tag),'Invalid tag: %s',tag):invariant(VALID_TAG_REGEX.test(tag));validatedTagCache[tag]=true;}}function ReactDOMComponent(tag){validateDangerousTag(tag);this._tag=tag;this._renderedChildren=null;this._previousStyleCopy=null;this._rootNodeID=null;}ReactDOMComponent.displayName='ReactDOMComponent';ReactDOMComponent.Mixin={construct:function construct(element){this._currentElement=element;},mountComponent:function mountComponent(rootID,transaction,context){this._rootNodeID=rootID;assertValidProps(this._currentElement.props);var closeTag=omittedCloseTags[this._tag]?'':'</'+this._tag+'>';return this._createOpenTagMarkupAndPutListeners(transaction)+this._createContentMarkup(transaction,context)+closeTag;},_createOpenTagMarkupAndPutListeners:function _createOpenTagMarkupAndPutListeners(transaction){var props=this._currentElement.props;var ret='<'+this._tag;for(var propKey in props){if(!props.hasOwnProperty(propKey)){continue;}var propValue=props[propKey];if(propValue==null){continue;}if(registrationNameModules.hasOwnProperty(propKey)){putListener(this._rootNodeID,propKey,propValue,transaction);}else{if(propKey===STYLE){if(propValue){propValue=this._previousStyleCopy=assign({},props.style);}propValue=CSSPropertyOperations.createMarkupForStyles(propValue);}var markup=DOMPropertyOperations.createMarkupForProperty(propKey,propValue);if(markup){ret+=' '+markup;}}}if(transaction.renderToStaticMarkup){return ret+'>';}var markupForID=DOMPropertyOperations.createMarkupForID(this._rootNodeID);return ret+' '+markupForID+'>';},_createContentMarkup:function _createContentMarkup(transaction,context){var prefix='';if(this._tag==='listing'||this._tag==='pre'||this._tag==='textarea'){prefix='\n';}var props=this._currentElement.props;var innerHTML=props.dangerouslySetInnerHTML;if(innerHTML!=null){if(innerHTML.__html!=null){return prefix+innerHTML.__html;}}else{var contentToUse=CONTENT_TYPES[_typeof(props.children)]?props.children:null;var childrenToUse=contentToUse!=null?null:props.children;if(contentToUse!=null){return prefix+escapeTextContentForBrowser(contentToUse);}else if(childrenToUse!=null){var mountImages=this.mountChildren(childrenToUse,transaction,context);return prefix+mountImages.join('');}}return prefix;},receiveComponent:function receiveComponent(nextElement,transaction,context){var prevElement=this._currentElement;this._currentElement=nextElement;this.updateComponent(transaction,prevElement,nextElement,context);},updateComponent:function updateComponent(transaction,prevElement,nextElement,context){assertValidProps(this._currentElement.props);this._updateDOMProperties(prevElement.props,transaction);this._updateDOMChildren(prevElement.props,transaction,context);},_updateDOMProperties:function _updateDOMProperties(lastProps,transaction){var nextProps=this._currentElement.props;var propKey;var styleName;var styleUpdates;for(propKey in lastProps){if(nextProps.hasOwnProperty(propKey)||!lastProps.hasOwnProperty(propKey)){continue;}if(propKey===STYLE){var lastStyle=this._previousStyleCopy;for(styleName in lastStyle){if(lastStyle.hasOwnProperty(styleName)){styleUpdates=styleUpdates||{};styleUpdates[styleName]='';}}this._previousStyleCopy=null;}else if(registrationNameModules.hasOwnProperty(propKey)){deleteListener(this._rootNodeID,propKey);}else if(DOMProperty.isStandardName[propKey]||DOMProperty.isCustomAttribute(propKey)){BackendIDOperations.deletePropertyByID(this._rootNodeID,propKey);}}for(propKey in nextProps){var nextProp=nextProps[propKey];var lastProp=propKey===STYLE?this._previousStyleCopy:lastProps[propKey];if(!nextProps.hasOwnProperty(propKey)||nextProp===lastProp){continue;}if(propKey===STYLE){if(nextProp){nextProp=this._previousStyleCopy=assign({},nextProp);}else{this._previousStyleCopy=null;}if(lastProp){for(styleName in lastProp){if(lastProp.hasOwnProperty(styleName)&&(!nextProp||!nextProp.hasOwnProperty(styleName))){styleUpdates=styleUpdates||{};styleUpdates[styleName]='';}}for(styleName in nextProp){if(nextProp.hasOwnProperty(styleName)&&lastProp[styleName]!==nextProp[styleName]){styleUpdates=styleUpdates||{};styleUpdates[styleName]=nextProp[styleName];}}}else{styleUpdates=nextProp;}}else if(registrationNameModules.hasOwnProperty(propKey)){putListener(this._rootNodeID,propKey,nextProp,transaction);}else if(DOMProperty.isStandardName[propKey]||DOMProperty.isCustomAttribute(propKey)){BackendIDOperations.updatePropertyByID(this._rootNodeID,propKey,nextProp);}}if(styleUpdates){BackendIDOperations.updateStylesByID(this._rootNodeID,styleUpdates);}},_updateDOMChildren:function _updateDOMChildren(lastProps,transaction,context){var nextProps=this._currentElement.props;var lastContent=CONTENT_TYPES[_typeof(lastProps.children)]?lastProps.children:null;var nextContent=CONTENT_TYPES[_typeof(nextProps.children)]?nextProps.children:null;var lastHtml=lastProps.dangerouslySetInnerHTML&&lastProps.dangerouslySetInnerHTML.__html;var nextHtml=nextProps.dangerouslySetInnerHTML&&nextProps.dangerouslySetInnerHTML.__html;var lastChildren=lastContent!=null?null:lastProps.children;var nextChildren=nextContent!=null?null:nextProps.children;var lastHasContentOrHtml=lastContent!=null||lastHtml!=null;var nextHasContentOrHtml=nextContent!=null||nextHtml!=null;if(lastChildren!=null&&nextChildren==null){this.updateChildren(null,transaction,context);}else if(lastHasContentOrHtml&&!nextHasContentOrHtml){this.updateTextContent('');}if(nextContent!=null){if(lastContent!==nextContent){this.updateTextContent(''+nextContent);}}else if(nextHtml!=null){if(lastHtml!==nextHtml){BackendIDOperations.updateInnerHTMLByID(this._rootNodeID,nextHtml);}}else if(nextChildren!=null){this.updateChildren(nextChildren,transaction,context);}},unmountComponent:function unmountComponent(){this.unmountChildren();ReactBrowserEventEmitter.deleteAllListeners(this._rootNodeID);ReactComponentBrowserEnvironment.unmountIDFromEnvironment(this._rootNodeID);this._rootNodeID=null;}};ReactPerf.measureMethods(ReactDOMComponent,'ReactDOMComponent',{mountComponent:'mountComponent',updateComponent:'updateComponent'});assign(ReactDOMComponent.prototype,ReactDOMComponent.Mixin,ReactMultiChild.Mixin);ReactDOMComponent.injection={injectIDOperations:function injectIDOperations(IDOperations){ReactDOMComponent.BackendIDOperations=BackendIDOperations=IDOperations;}};module.exports=ReactDOMComponent;},{"10":10,"11":11,"116":116,"135":135,"136":136,"141":141,"154":154,"27":27,"30":30,"35":35,"5":5,"70":70,"71":71,"75":75}],43:[function(_dereq_,module,exports){'use strict';var EventConstants=_dereq_(15);var LocalEventTrapMixin=_dereq_(25);var ReactBrowserComponentMixin=_dereq_(29);var ReactClass=_dereq_(33);var ReactElement=_dereq_(57);var form=ReactElement.createFactory('form');var ReactDOMForm=ReactClass.createClass({displayName:'ReactDOMForm',tagName:'FORM',mixins:[ReactBrowserComponentMixin,LocalEventTrapMixin],render:function render(){return form(this.props);},componentDidMount:function componentDidMount(){this.trapBubbledEvent(EventConstants.topLevelTypes.topReset,'reset');this.trapBubbledEvent(EventConstants.topLevelTypes.topSubmit,'submit');}});module.exports=ReactDOMForm;},{"15":15,"25":25,"29":29,"33":33,"57":57}],44:[function(_dereq_,module,exports){'use strict';var CSSPropertyOperations=_dereq_(5);var DOMChildrenOperations=_dereq_(9);var DOMPropertyOperations=_dereq_(11);var ReactMount=_dereq_(70);var ReactPerf=_dereq_(75);var invariant=_dereq_(135);var setInnerHTML=_dereq_(148);var INVALID_PROPERTY_ERRORS={dangerouslySetInnerHTML:'`dangerouslySetInnerHTML` must be set using `updateInnerHTMLByID()`.',style:'`style` must be set using `updateStylesByID()`.'};var ReactDOMIDOperations={updatePropertyByID:function updatePropertyByID(id,name,value){var node=ReactMount.getNode(id);"production"!=="development"?invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name),'updatePropertyByID(...): %s',INVALID_PROPERTY_ERRORS[name]):invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name));if(value!=null){DOMPropertyOperations.setValueForProperty(node,name,value);}else{DOMPropertyOperations.deleteValueForProperty(node,name);}},deletePropertyByID:function deletePropertyByID(id,name,value){var node=ReactMount.getNode(id);"production"!=="development"?invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name),'updatePropertyByID(...): %s',INVALID_PROPERTY_ERRORS[name]):invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name));DOMPropertyOperations.deleteValueForProperty(node,name,value);},updateStylesByID:function updateStylesByID(id,styles){var node=ReactMount.getNode(id);CSSPropertyOperations.setValueForStyles(node,styles);},updateInnerHTMLByID:function updateInnerHTMLByID(id,html){var node=ReactMount.getNode(id);setInnerHTML(node,html);},updateTextContentByID:function updateTextContentByID(id,content){var node=ReactMount.getNode(id);DOMChildrenOperations.updateTextContent(node,content);},dangerouslyReplaceNodeWithMarkupByID:function dangerouslyReplaceNodeWithMarkupByID(id,markup){var node=ReactMount.getNode(id);DOMChildrenOperations.dangerouslyReplaceNodeWithMarkup(node,markup);},dangerouslyProcessChildrenUpdates:function dangerouslyProcessChildrenUpdates(updates,markup){for(var i=0;i<updates.length;i++){updates[i].parentNode=ReactMount.getNode(updates[i].parentID);}DOMChildrenOperations.processUpdates(updates,markup);}};ReactPerf.measureMethods(ReactDOMIDOperations,'ReactDOMIDOperations',{updatePropertyByID:'updatePropertyByID',deletePropertyByID:'deletePropertyByID',updateStylesByID:'updateStylesByID',updateInnerHTMLByID:'updateInnerHTMLByID',updateTextContentByID:'updateTextContentByID',dangerouslyReplaceNodeWithMarkupByID:'dangerouslyReplaceNodeWithMarkupByID',dangerouslyProcessChildrenUpdates:'dangerouslyProcessChildrenUpdates'});module.exports=ReactDOMIDOperations;},{"11":11,"135":135,"148":148,"5":5,"70":70,"75":75,"9":9}],45:[function(_dereq_,module,exports){'use strict';var EventConstants=_dereq_(15);var LocalEventTrapMixin=_dereq_(25);var ReactBrowserComponentMixin=_dereq_(29);var ReactClass=_dereq_(33);var ReactElement=_dereq_(57);var iframe=ReactElement.createFactory('iframe');var ReactDOMIframe=ReactClass.createClass({displayName:'ReactDOMIframe',tagName:'IFRAME',mixins:[ReactBrowserComponentMixin,LocalEventTrapMixin],render:function render(){return iframe(this.props);},componentDidMount:function componentDidMount(){this.trapBubbledEvent(EventConstants.topLevelTypes.topLoad,'load');}});module.exports=ReactDOMIframe;},{"15":15,"25":25,"29":29,"33":33,"57":57}],46:[function(_dereq_,module,exports){'use strict';var EventConstants=_dereq_(15);var LocalEventTrapMixin=_dereq_(25);var ReactBrowserComponentMixin=_dereq_(29);var ReactClass=_dereq_(33);var ReactElement=_dereq_(57);var img=ReactElement.createFactory('img');var ReactDOMImg=ReactClass.createClass({displayName:'ReactDOMImg',tagName:'IMG',mixins:[ReactBrowserComponentMixin,LocalEventTrapMixin],render:function render(){return img(this.props);},componentDidMount:function componentDidMount(){this.trapBubbledEvent(EventConstants.topLevelTypes.topLoad,'load');this.trapBubbledEvent(EventConstants.topLevelTypes.topError,'error');}});module.exports=ReactDOMImg;},{"15":15,"25":25,"29":29,"33":33,"57":57}],47:[function(_dereq_,module,exports){'use strict';var AutoFocusMixin=_dereq_(2);var DOMPropertyOperations=_dereq_(11);var LinkedValueUtils=_dereq_(24);var ReactBrowserComponentMixin=_dereq_(29);var ReactClass=_dereq_(33);var ReactElement=_dereq_(57);var ReactMount=_dereq_(70);var ReactUpdates=_dereq_(87);var assign=_dereq_(27);var invariant=_dereq_(135);var input=ReactElement.createFactory('input');var instancesByReactID={};function forceUpdateIfMounted(){if(this.isMounted()){this.forceUpdate();}}var ReactDOMInput=ReactClass.createClass({displayName:'ReactDOMInput',tagName:'INPUT',mixins:[AutoFocusMixin,LinkedValueUtils.Mixin,ReactBrowserComponentMixin],getInitialState:function getInitialState(){var defaultValue=this.props.defaultValue;return{initialChecked:this.props.defaultChecked||false,initialValue:defaultValue!=null?defaultValue:null};},render:function render(){var props=assign({},this.props);props.defaultChecked=null;props.defaultValue=null;var value=LinkedValueUtils.getValue(this);props.value=value!=null?value:this.state.initialValue;var checked=LinkedValueUtils.getChecked(this);props.checked=checked!=null?checked:this.state.initialChecked;props.onChange=this._handleChange;return input(props,this.props.children);},componentDidMount:function componentDidMount(){var id=ReactMount.getID(this.getDOMNode());instancesByReactID[id]=this;},componentWillUnmount:function componentWillUnmount(){var rootNode=this.getDOMNode();var id=ReactMount.getID(rootNode);delete instancesByReactID[id];},componentDidUpdate:function componentDidUpdate(prevProps,prevState,prevContext){var rootNode=this.getDOMNode();if(this.props.checked!=null){DOMPropertyOperations.setValueForProperty(rootNode,'checked',this.props.checked||false);}var value=LinkedValueUtils.getValue(this);if(value!=null){DOMPropertyOperations.setValueForProperty(rootNode,'value',''+value);}},_handleChange:function _handleChange(event){var returnValue;var onChange=LinkedValueUtils.getOnChange(this);if(onChange){returnValue=onChange.call(this,event);}ReactUpdates.asap(forceUpdateIfMounted,this);var name=this.props.name;if(this.props.type==='radio'&&name!=null){var rootNode=this.getDOMNode();var queryRoot=rootNode;while(queryRoot.parentNode){queryRoot=queryRoot.parentNode;}var group=queryRoot.querySelectorAll('input[name='+JSON.stringify(''+name)+'][type="radio"]');for(var i=0,groupLen=group.length;i<groupLen;i++){var otherNode=group[i];if(otherNode===rootNode||otherNode.form!==rootNode.form){continue;}var otherID=ReactMount.getID(otherNode);"production"!=="development"?invariant(otherID,'ReactDOMInput: Mixing React and non-React radio inputs with the '+'same `name` is not supported.'):invariant(otherID);var otherInstance=instancesByReactID[otherID];"production"!=="development"?invariant(otherInstance,'ReactDOMInput: Unknown radio button ID %s.',otherID):invariant(otherInstance);ReactUpdates.asap(forceUpdateIfMounted,otherInstance);}}return returnValue;}});module.exports=ReactDOMInput;},{"11":11,"135":135,"2":2,"24":24,"27":27,"29":29,"33":33,"57":57,"70":70,"87":87}],48:[function(_dereq_,module,exports){'use strict';var ReactBrowserComponentMixin=_dereq_(29);var ReactClass=_dereq_(33);var ReactElement=_dereq_(57);var warning=_dereq_(154);var option=ReactElement.createFactory('option');var ReactDOMOption=ReactClass.createClass({displayName:'ReactDOMOption',tagName:'OPTION',mixins:[ReactBrowserComponentMixin],componentWillMount:function componentWillMount(){if("production"!=="development"){"production"!=="development"?warning(this.props.selected==null,'Use the `defaultValue` or `value` props on <select> instead of '+'setting `selected` on <option>.'):null;}},render:function render(){return option(this.props,this.props.children);}});module.exports=ReactDOMOption;},{"154":154,"29":29,"33":33,"57":57}],49:[function(_dereq_,module,exports){'use strict';var AutoFocusMixin=_dereq_(2);var LinkedValueUtils=_dereq_(24);var ReactBrowserComponentMixin=_dereq_(29);var ReactClass=_dereq_(33);var ReactElement=_dereq_(57);var ReactUpdates=_dereq_(87);var assign=_dereq_(27);var select=ReactElement.createFactory('select');function updateOptionsIfPendingUpdateAndMounted(){if(this._pendingUpdate){this._pendingUpdate=false;var value=LinkedValueUtils.getValue(this);if(value!=null&&this.isMounted()){updateOptions(this,value);}}}function selectValueType(props,propName,componentName){if(props[propName]==null){return null;}if(props.multiple){if(!Array.isArray(props[propName])){return new Error("The `"+propName+"` prop supplied to <select> must be an array if "+"`multiple` is true.");}}else{if(Array.isArray(props[propName])){return new Error("The `"+propName+"` prop supplied to <select> must be a scalar "+"value if `multiple` is false.");}}}function updateOptions(component,propValue){var selectedValue,i,l;var options=component.getDOMNode().options;if(component.props.multiple){selectedValue={};for(i=0,l=propValue.length;i<l;i++){selectedValue[''+propValue[i]]=true;}for(i=0,l=options.length;i<l;i++){var selected=selectedValue.hasOwnProperty(options[i].value);if(options[i].selected!==selected){options[i].selected=selected;}}}else{selectedValue=''+propValue;for(i=0,l=options.length;i<l;i++){if(options[i].value===selectedValue){options[i].selected=true;return;}}if(options.length){options[0].selected=true;}}}var ReactDOMSelect=ReactClass.createClass({displayName:'ReactDOMSelect',tagName:'SELECT',mixins:[AutoFocusMixin,LinkedValueUtils.Mixin,ReactBrowserComponentMixin],propTypes:{defaultValue:selectValueType,value:selectValueType},render:function render(){var props=assign({},this.props);props.onChange=this._handleChange;props.value=null;return select(props,this.props.children);},componentWillMount:function componentWillMount(){this._pendingUpdate=false;},componentDidMount:function componentDidMount(){var value=LinkedValueUtils.getValue(this);if(value!=null){updateOptions(this,value);}else if(this.props.defaultValue!=null){updateOptions(this,this.props.defaultValue);}},componentDidUpdate:function componentDidUpdate(prevProps){var value=LinkedValueUtils.getValue(this);if(value!=null){this._pendingUpdate=false;updateOptions(this,value);}else if(!prevProps.multiple!==!this.props.multiple){if(this.props.defaultValue!=null){updateOptions(this,this.props.defaultValue);}else{updateOptions(this,this.props.multiple?[]:'');}}},_handleChange:function _handleChange(event){var returnValue;var onChange=LinkedValueUtils.getOnChange(this);if(onChange){returnValue=onChange.call(this,event);}this._pendingUpdate=true;ReactUpdates.asap(updateOptionsIfPendingUpdateAndMounted,this);return returnValue;}});module.exports=ReactDOMSelect;},{"2":2,"24":24,"27":27,"29":29,"33":33,"57":57,"87":87}],50:[function(_dereq_,module,exports){'use strict';var ExecutionEnvironment=_dereq_(21);var getNodeForCharacterOffset=_dereq_(128);var getTextContentAccessor=_dereq_(130);function isCollapsed(anchorNode,anchorOffset,focusNode,focusOffset){return anchorNode===focusNode&&anchorOffset===focusOffset;}function getIEOffsets(node){var selection=document.selection;var selectedRange=selection.createRange();var selectedLength=selectedRange.text.length;var fromStart=selectedRange.duplicate();fromStart.moveToElementText(node);fromStart.setEndPoint('EndToStart',selectedRange);var startOffset=fromStart.text.length;var endOffset=startOffset+selectedLength;return{start:startOffset,end:endOffset};}function getModernOffsets(node){var selection=window.getSelection&&window.getSelection();if(!selection||selection.rangeCount===0){return null;}var anchorNode=selection.anchorNode;var anchorOffset=selection.anchorOffset;var focusNode=selection.focusNode;var focusOffset=selection.focusOffset;var currentRange=selection.getRangeAt(0);var isSelectionCollapsed=isCollapsed(selection.anchorNode,selection.anchorOffset,selection.focusNode,selection.focusOffset);var rangeLength=isSelectionCollapsed?0:currentRange.toString().length;var tempRange=currentRange.cloneRange();tempRange.selectNodeContents(node);tempRange.setEnd(currentRange.startContainer,currentRange.startOffset);var isTempRangeCollapsed=isCollapsed(tempRange.startContainer,tempRange.startOffset,tempRange.endContainer,tempRange.endOffset);var start=isTempRangeCollapsed?0:tempRange.toString().length;var end=start+rangeLength;var detectionRange=document.createRange();detectionRange.setStart(anchorNode,anchorOffset);detectionRange.setEnd(focusNode,focusOffset);var isBackward=detectionRange.collapsed;return{start:isBackward?end:start,end:isBackward?start:end};}function setIEOffsets(node,offsets){var range=document.selection.createRange().duplicate();var start,end;if(typeof offsets.end==='undefined'){start=offsets.start;end=start;}else if(offsets.start>offsets.end){start=offsets.end;end=offsets.start;}else{start=offsets.start;end=offsets.end;}range.moveToElementText(node);range.moveStart('character',start);range.setEndPoint('EndToStart',range);range.moveEnd('character',end-start);range.select();}function setModernOffsets(node,offsets){if(!window.getSelection){return;}var selection=window.getSelection();var length=node[getTextContentAccessor()].length;var start=Math.min(offsets.start,length);var end=typeof offsets.end==='undefined'?start:Math.min(offsets.end,length);if(!selection.extend&&start>end){var temp=end;end=start;start=temp;}var startMarker=getNodeForCharacterOffset(node,start);var endMarker=getNodeForCharacterOffset(node,end);if(startMarker&&endMarker){var range=document.createRange();range.setStart(startMarker.node,startMarker.offset);selection.removeAllRanges();if(start>end){selection.addRange(range);selection.extend(endMarker.node,endMarker.offset);}else{range.setEnd(endMarker.node,endMarker.offset);selection.addRange(range);}}}var useIEOffsets=ExecutionEnvironment.canUseDOM&&'selection'in document&&!('getSelection'in window);var ReactDOMSelection={getOffsets:useIEOffsets?getIEOffsets:getModernOffsets,setOffsets:useIEOffsets?setIEOffsets:setModernOffsets};module.exports=ReactDOMSelection;},{"128":128,"130":130,"21":21}],51:[function(_dereq_,module,exports){'use strict';var DOMPropertyOperations=_dereq_(11);var ReactComponentBrowserEnvironment=_dereq_(35);var ReactDOMComponent=_dereq_(42);var assign=_dereq_(27);var escapeTextContentForBrowser=_dereq_(116);var ReactDOMTextComponent=function ReactDOMTextComponent(props){};assign(ReactDOMTextComponent.prototype,{construct:function construct(text){this._currentElement=text;this._stringText=''+text;this._rootNodeID=null;this._mountIndex=0;},mountComponent:function mountComponent(rootID,transaction,context){this._rootNodeID=rootID;var escapedText=escapeTextContentForBrowser(this._stringText);if(transaction.renderToStaticMarkup){return escapedText;}return'<span '+DOMPropertyOperations.createMarkupForID(rootID)+'>'+escapedText+'</span>';},receiveComponent:function receiveComponent(nextText,transaction){if(nextText!==this._currentElement){this._currentElement=nextText;var nextStringText=''+nextText;if(nextStringText!==this._stringText){this._stringText=nextStringText;ReactDOMComponent.BackendIDOperations.updateTextContentByID(this._rootNodeID,nextStringText);}}},unmountComponent:function unmountComponent(){ReactComponentBrowserEnvironment.unmountIDFromEnvironment(this._rootNodeID);}});module.exports=ReactDOMTextComponent;},{"11":11,"116":116,"27":27,"35":35,"42":42}],52:[function(_dereq_,module,exports){'use strict';var AutoFocusMixin=_dereq_(2);var DOMPropertyOperations=_dereq_(11);var LinkedValueUtils=_dereq_(24);var ReactBrowserComponentMixin=_dereq_(29);var ReactClass=_dereq_(33);var ReactElement=_dereq_(57);var ReactUpdates=_dereq_(87);var assign=_dereq_(27);var invariant=_dereq_(135);var warning=_dereq_(154);var textarea=ReactElement.createFactory('textarea');function forceUpdateIfMounted(){if(this.isMounted()){this.forceUpdate();}}var ReactDOMTextarea=ReactClass.createClass({displayName:'ReactDOMTextarea',tagName:'TEXTAREA',mixins:[AutoFocusMixin,LinkedValueUtils.Mixin,ReactBrowserComponentMixin],getInitialState:function getInitialState(){var defaultValue=this.props.defaultValue;var children=this.props.children;if(children!=null){if("production"!=="development"){"production"!=="development"?warning(false,'Use the `defaultValue` or `value` props instead of setting '+'children on <textarea>.'):null;}"production"!=="development"?invariant(defaultValue==null,'If you supply `defaultValue` on a <textarea>, do not pass children.'):invariant(defaultValue==null);if(Array.isArray(children)){"production"!=="development"?invariant(children.length<=1,'<textarea> can only have at most one child.'):invariant(children.length<=1);children=children[0];}defaultValue=''+children;}if(defaultValue==null){defaultValue='';}var value=LinkedValueUtils.getValue(this);return{initialValue:''+(value!=null?value:defaultValue)};},render:function render(){var props=assign({},this.props);"production"!=="development"?invariant(props.dangerouslySetInnerHTML==null,'`dangerouslySetInnerHTML` does not make sense on <textarea>.'):invariant(props.dangerouslySetInnerHTML==null);props.defaultValue=null;props.value=null;props.onChange=this._handleChange;return textarea(props,this.state.initialValue);},componentDidUpdate:function componentDidUpdate(prevProps,prevState,prevContext){var value=LinkedValueUtils.getValue(this);if(value!=null){var rootNode=this.getDOMNode();DOMPropertyOperations.setValueForProperty(rootNode,'value',''+value);}},_handleChange:function _handleChange(event){var returnValue;var onChange=LinkedValueUtils.getOnChange(this);if(onChange){returnValue=onChange.call(this,event);}ReactUpdates.asap(forceUpdateIfMounted,this);return returnValue;}});module.exports=ReactDOMTextarea;},{"11":11,"135":135,"154":154,"2":2,"24":24,"27":27,"29":29,"33":33,"57":57,"87":87}],53:[function(_dereq_,module,exports){'use strict';var ReactUpdates=_dereq_(87);var Transaction=_dereq_(103);var assign=_dereq_(27);var emptyFunction=_dereq_(114);var RESET_BATCHED_UPDATES={initialize:emptyFunction,close:function close(){ReactDefaultBatchingStrategy.isBatchingUpdates=false;}};var FLUSH_BATCHED_UPDATES={initialize:emptyFunction,close:ReactUpdates.flushBatchedUpdates.bind(ReactUpdates)};var TRANSACTION_WRAPPERS=[FLUSH_BATCHED_UPDATES,RESET_BATCHED_UPDATES];function ReactDefaultBatchingStrategyTransaction(){this.reinitializeTransaction();}assign(ReactDefaultBatchingStrategyTransaction.prototype,Transaction.Mixin,{getTransactionWrappers:function getTransactionWrappers(){return TRANSACTION_WRAPPERS;}});var transaction=new ReactDefaultBatchingStrategyTransaction();var ReactDefaultBatchingStrategy={isBatchingUpdates:false,batchedUpdates:function batchedUpdates(callback,a,b,c,d){var alreadyBatchingUpdates=ReactDefaultBatchingStrategy.isBatchingUpdates;ReactDefaultBatchingStrategy.isBatchingUpdates=true;if(alreadyBatchingUpdates){callback(a,b,c,d);}else{transaction.perform(callback,null,a,b,c,d);}}};module.exports=ReactDefaultBatchingStrategy;},{"103":103,"114":114,"27":27,"87":87}],54:[function(_dereq_,module,exports){'use strict';var BeforeInputEventPlugin=_dereq_(3);var ChangeEventPlugin=_dereq_(7);var ClientReactRootIndex=_dereq_(8);var DefaultEventPluginOrder=_dereq_(13);var EnterLeaveEventPlugin=_dereq_(14);var ExecutionEnvironment=_dereq_(21);var HTMLDOMPropertyConfig=_dereq_(23);var MobileSafariClickEventPlugin=_dereq_(26);var ReactBrowserComponentMixin=_dereq_(29);var ReactClass=_dereq_(33);var ReactComponentBrowserEnvironment=_dereq_(35);var ReactDefaultBatchingStrategy=_dereq_(53);var ReactDOMComponent=_dereq_(42);var ReactDOMButton=_dereq_(41);var ReactDOMForm=_dereq_(43);var ReactDOMImg=_dereq_(46);var ReactDOMIDOperations=_dereq_(44);var ReactDOMIframe=_dereq_(45);var ReactDOMInput=_dereq_(47);var ReactDOMOption=_dereq_(48);var ReactDOMSelect=_dereq_(49);var ReactDOMTextarea=_dereq_(52);var ReactDOMTextComponent=_dereq_(51);var ReactElement=_dereq_(57);var ReactEventListener=_dereq_(62);var ReactInjection=_dereq_(64);var ReactInstanceHandles=_dereq_(66);var ReactMount=_dereq_(70);var ReactReconcileTransaction=_dereq_(80);var SelectEventPlugin=_dereq_(89);var ServerReactRootIndex=_dereq_(90);var SimpleEventPlugin=_dereq_(91);var SVGDOMPropertyConfig=_dereq_(88);var createFullPageComponent=_dereq_(111);function autoGenerateWrapperClass(type){return ReactClass.createClass({tagName:type.toUpperCase(),render:function render(){return new ReactElement(type,null,null,null,null,this.props);}});}function inject(){ReactInjection.EventEmitter.injectReactEventListener(ReactEventListener);ReactInjection.EventPluginHub.injectEventPluginOrder(DefaultEventPluginOrder);ReactInjection.EventPluginHub.injectInstanceHandle(ReactInstanceHandles);ReactInjection.EventPluginHub.injectMount(ReactMount);ReactInjection.EventPluginHub.injectEventPluginsByName({SimpleEventPlugin:SimpleEventPlugin,EnterLeaveEventPlugin:EnterLeaveEventPlugin,ChangeEventPlugin:ChangeEventPlugin,MobileSafariClickEventPlugin:MobileSafariClickEventPlugin,SelectEventPlugin:SelectEventPlugin,BeforeInputEventPlugin:BeforeInputEventPlugin});ReactInjection.NativeComponent.injectGenericComponentClass(ReactDOMComponent);ReactInjection.NativeComponent.injectTextComponentClass(ReactDOMTextComponent);ReactInjection.NativeComponent.injectAutoWrapper(autoGenerateWrapperClass);ReactInjection.Class.injectMixin(ReactBrowserComponentMixin);ReactInjection.NativeComponent.injectComponentClasses({'button':ReactDOMButton,'form':ReactDOMForm,'iframe':ReactDOMIframe,'img':ReactDOMImg,'input':ReactDOMInput,'option':ReactDOMOption,'select':ReactDOMSelect,'textarea':ReactDOMTextarea,'html':createFullPageComponent('html'),'head':createFullPageComponent('head'),'body':createFullPageComponent('body')});ReactInjection.DOMProperty.injectDOMPropertyConfig(HTMLDOMPropertyConfig);ReactInjection.DOMProperty.injectDOMPropertyConfig(SVGDOMPropertyConfig);ReactInjection.EmptyComponent.injectEmptyComponent('noscript');ReactInjection.Updates.injectReconcileTransaction(ReactReconcileTransaction);ReactInjection.Updates.injectBatchingStrategy(ReactDefaultBatchingStrategy);ReactInjection.RootIndex.injectCreateReactRootIndex(ExecutionEnvironment.canUseDOM?ClientReactRootIndex.createReactRootIndex:ServerReactRootIndex.createReactRootIndex);ReactInjection.Component.injectEnvironment(ReactComponentBrowserEnvironment);ReactInjection.DOMComponent.injectIDOperations(ReactDOMIDOperations);if("production"!=="development"){var url=ExecutionEnvironment.canUseDOM&&window.location.href||'';if(/[?&]react_perf\b/.test(url)){var ReactDefaultPerf=_dereq_(55);ReactDefaultPerf.start();}}}module.exports={inject:inject};},{"111":111,"13":13,"14":14,"21":21,"23":23,"26":26,"29":29,"3":3,"33":33,"35":35,"41":41,"42":42,"43":43,"44":44,"45":45,"46":46,"47":47,"48":48,"49":49,"51":51,"52":52,"53":53,"55":55,"57":57,"62":62,"64":64,"66":66,"7":7,"70":70,"8":8,"80":80,"88":88,"89":89,"90":90,"91":91}],55:[function(_dereq_,module,exports){'use strict';var DOMProperty=_dereq_(10);var ReactDefaultPerfAnalysis=_dereq_(56);var ReactMount=_dereq_(70);var ReactPerf=_dereq_(75);var performanceNow=_dereq_(146);function roundFloat(val){return Math.floor(val*100)/100;}function addValue(obj,key,val){obj[key]=(obj[key]||0)+val;}var ReactDefaultPerf={_allMeasurements:[],_mountStack:[0],_injected:false,start:function start(){if(!ReactDefaultPerf._injected){ReactPerf.injection.injectMeasure(ReactDefaultPerf.measure);}ReactDefaultPerf._allMeasurements.length=0;ReactPerf.enableMeasure=true;},stop:function stop(){ReactPerf.enableMeasure=false;},getLastMeasurements:function getLastMeasurements(){return ReactDefaultPerf._allMeasurements;},printExclusive:function printExclusive(measurements){measurements=measurements||ReactDefaultPerf._allMeasurements;var summary=ReactDefaultPerfAnalysis.getExclusiveSummary(measurements);console.table(summary.map(function(item){return{'Component class name':item.componentName,'Total inclusive time (ms)':roundFloat(item.inclusive),'Exclusive mount time (ms)':roundFloat(item.exclusive),'Exclusive render time (ms)':roundFloat(item.render),'Mount time per instance (ms)':roundFloat(item.exclusive/item.count),'Render time per instance (ms)':roundFloat(item.render/item.count),'Instances':item.count};}));},printInclusive:function printInclusive(measurements){measurements=measurements||ReactDefaultPerf._allMeasurements;var summary=ReactDefaultPerfAnalysis.getInclusiveSummary(measurements);console.table(summary.map(function(item){return{'Owner > component':item.componentName,'Inclusive time (ms)':roundFloat(item.time),'Instances':item.count};}));console.log('Total time:',ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2)+' ms');},getMeasurementsSummaryMap:function getMeasurementsSummaryMap(measurements){var summary=ReactDefaultPerfAnalysis.getInclusiveSummary(measurements,true);return summary.map(function(item){return{'Owner > component':item.componentName,'Wasted time (ms)':item.time,'Instances':item.count};});},printWasted:function printWasted(measurements){measurements=measurements||ReactDefaultPerf._allMeasurements;console.table(ReactDefaultPerf.getMeasurementsSummaryMap(measurements));console.log('Total time:',ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2)+' ms');},printDOM:function printDOM(measurements){measurements=measurements||ReactDefaultPerf._allMeasurements;var summary=ReactDefaultPerfAnalysis.getDOMSummary(measurements);console.table(summary.map(function(item){var result={};result[DOMProperty.ID_ATTRIBUTE_NAME]=item.id;result['type']=item.type;result['args']=JSON.stringify(item.args);return result;}));console.log('Total time:',ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2)+' ms');},_recordWrite:function _recordWrite(id,fnName,totalTime,args){var writes=ReactDefaultPerf._allMeasurements[ReactDefaultPerf._allMeasurements.length-1].writes;writes[id]=writes[id]||[];writes[id].push({type:fnName,time:totalTime,args:args});},measure:function measure(moduleName,fnName,func){return function(){for(var args=[],$__0=0,$__1=arguments.length;$__0<$__1;$__0++){args.push(arguments[$__0]);}var totalTime;var rv;var start;if(fnName==='_renderNewRootComponent'||fnName==='flushBatchedUpdates'){ReactDefaultPerf._allMeasurements.push({exclusive:{},inclusive:{},render:{},counts:{},writes:{},displayNames:{},totalTime:0});start=performanceNow();rv=func.apply(this,args);ReactDefaultPerf._allMeasurements[ReactDefaultPerf._allMeasurements.length-1].totalTime=performanceNow()-start;return rv;}else if(fnName==='_mountImageIntoNode'||moduleName==='ReactDOMIDOperations'){start=performanceNow();rv=func.apply(this,args);totalTime=performanceNow()-start;if(fnName==='_mountImageIntoNode'){var mountID=ReactMount.getID(args[1]);ReactDefaultPerf._recordWrite(mountID,fnName,totalTime,args[0]);}else if(fnName==='dangerouslyProcessChildrenUpdates'){args[0].forEach(function(update){var writeArgs={};if(update.fromIndex!==null){writeArgs.fromIndex=update.fromIndex;}if(update.toIndex!==null){writeArgs.toIndex=update.toIndex;}if(update.textContent!==null){writeArgs.textContent=update.textContent;}if(update.markupIndex!==null){writeArgs.markup=args[1][update.markupIndex];}ReactDefaultPerf._recordWrite(update.parentID,update.type,totalTime,writeArgs);});}else{ReactDefaultPerf._recordWrite(args[0],fnName,totalTime,Array.prototype.slice.call(args,1));}return rv;}else if(moduleName==='ReactCompositeComponent'&&(fnName==='mountComponent'||fnName==='updateComponent'||fnName==='_renderValidatedComponent')){if(typeof this._currentElement.type==='string'){return func.apply(this,args);}var rootNodeID=fnName==='mountComponent'?args[0]:this._rootNodeID;var isRender=fnName==='_renderValidatedComponent';var isMount=fnName==='mountComponent';var mountStack=ReactDefaultPerf._mountStack;var entry=ReactDefaultPerf._allMeasurements[ReactDefaultPerf._allMeasurements.length-1];if(isRender){addValue(entry.counts,rootNodeID,1);}else if(isMount){mountStack.push(0);}start=performanceNow();rv=func.apply(this,args);totalTime=performanceNow()-start;if(isRender){addValue(entry.render,rootNodeID,totalTime);}else if(isMount){var subMountTime=mountStack.pop();mountStack[mountStack.length-1]+=totalTime;addValue(entry.exclusive,rootNodeID,totalTime-subMountTime);addValue(entry.inclusive,rootNodeID,totalTime);}else{addValue(entry.inclusive,rootNodeID,totalTime);}entry.displayNames[rootNodeID]={current:this.getName(),owner:this._currentElement._owner?this._currentElement._owner.getName():'<root>'};return rv;}else{return func.apply(this,args);}};}};module.exports=ReactDefaultPerf;},{"10":10,"146":146,"56":56,"70":70,"75":75}],56:[function(_dereq_,module,exports){var assign=_dereq_(27);var DONT_CARE_THRESHOLD=1.2;var DOM_OPERATION_TYPES={'_mountImageIntoNode':'set innerHTML',INSERT_MARKUP:'set innerHTML',MOVE_EXISTING:'move',REMOVE_NODE:'remove',TEXT_CONTENT:'set textContent','updatePropertyByID':'update attribute','deletePropertyByID':'delete attribute','updateStylesByID':'update styles','updateInnerHTMLByID':'set innerHTML','dangerouslyReplaceNodeWithMarkupByID':'replace'};function getTotalTime(measurements){var totalTime=0;for(var i=0;i<measurements.length;i++){var measurement=measurements[i];totalTime+=measurement.totalTime;}return totalTime;}function getDOMSummary(measurements){var items=[];for(var i=0;i<measurements.length;i++){var measurement=measurements[i];var id;for(id in measurement.writes){measurement.writes[id].forEach(function(write){items.push({id:id,type:DOM_OPERATION_TYPES[write.type]||write.type,args:write.args});});}}return items;}function getExclusiveSummary(measurements){var candidates={};var displayName;for(var i=0;i<measurements.length;i++){var measurement=measurements[i];var allIDs=assign({},measurement.exclusive,measurement.inclusive);for(var id in allIDs){displayName=measurement.displayNames[id].current;candidates[displayName]=candidates[displayName]||{componentName:displayName,inclusive:0,exclusive:0,render:0,count:0};if(measurement.render[id]){candidates[displayName].render+=measurement.render[id];}if(measurement.exclusive[id]){candidates[displayName].exclusive+=measurement.exclusive[id];}if(measurement.inclusive[id]){candidates[displayName].inclusive+=measurement.inclusive[id];}if(measurement.counts[id]){candidates[displayName].count+=measurement.counts[id];}}}var arr=[];for(displayName in candidates){if(candidates[displayName].exclusive>=DONT_CARE_THRESHOLD){arr.push(candidates[displayName]);}}arr.sort(function(a,b){return b.exclusive-a.exclusive;});return arr;}function getInclusiveSummary(measurements,onlyClean){var candidates={};var inclusiveKey;for(var i=0;i<measurements.length;i++){var measurement=measurements[i];var allIDs=assign({},measurement.exclusive,measurement.inclusive);var cleanComponents;if(onlyClean){cleanComponents=getUnchangedComponents(measurement);}for(var id in allIDs){if(onlyClean&&!cleanComponents[id]){continue;}var displayName=measurement.displayNames[id];inclusiveKey=displayName.owner+' > '+displayName.current;candidates[inclusiveKey]=candidates[inclusiveKey]||{componentName:inclusiveKey,time:0,count:0};if(measurement.inclusive[id]){candidates[inclusiveKey].time+=measurement.inclusive[id];}if(measurement.counts[id]){candidates[inclusiveKey].count+=measurement.counts[id];}}}var arr=[];for(inclusiveKey in candidates){if(candidates[inclusiveKey].time>=DONT_CARE_THRESHOLD){arr.push(candidates[inclusiveKey]);}}arr.sort(function(a,b){return b.time-a.time;});return arr;}function getUnchangedComponents(measurement){var cleanComponents={};var dirtyLeafIDs=Object.keys(measurement.writes);var allIDs=assign({},measurement.exclusive,measurement.inclusive);for(var id in allIDs){var isDirty=false;for(var i=0;i<dirtyLeafIDs.length;i++){if(dirtyLeafIDs[i].indexOf(id)===0){isDirty=true;break;}}if(!isDirty&&measurement.counts[id]>0){cleanComponents[id]=true;}}return cleanComponents;}var ReactDefaultPerfAnalysis={getExclusiveSummary:getExclusiveSummary,getInclusiveSummary:getInclusiveSummary,getDOMSummary:getDOMSummary,getTotalTime:getTotalTime};module.exports=ReactDefaultPerfAnalysis;},{"27":27}],57:[function(_dereq_,module,exports){'use strict';var ReactContext=_dereq_(38);var ReactCurrentOwner=_dereq_(39);var assign=_dereq_(27);var warning=_dereq_(154);var RESERVED_PROPS={key:true,ref:true};function defineWarningProperty(object,key){Object.defineProperty(object,key,{configurable:false,enumerable:true,get:function get(){if(!this._store){return null;}return this._store[key];},set:function set(value){"production"!=="development"?warning(false,'Don\'t set the %s property of the React element. Instead, '+'specify the correct value when initially creating the element.',key):null;this._store[key]=value;}});}var useMutationMembrane=false;function defineMutationMembrane(prototype){try{var pseudoFrozenProperties={props:true};for(var key in pseudoFrozenProperties){defineWarningProperty(prototype,key);}useMutationMembrane=true;}catch(x){}}var ReactElement=function ReactElement(type,key,ref,owner,context,props){this.type=type;this.key=key;this.ref=ref;this._owner=owner;this._context=context;if("production"!=="development"){this._store={props:props,originalProps:assign({},props)};try{Object.defineProperty(this._store,'validated',{configurable:false,enumerable:false,writable:true});}catch(x){}this._store.validated=false;if(useMutationMembrane){Object.freeze(this);return;}}this.props=props;};ReactElement.prototype={_isReactElement:true};if("production"!=="development"){defineMutationMembrane(ReactElement.prototype);}ReactElement.createElement=function(type,config,children){var propName;var props={};var key=null;var ref=null;if(config!=null){ref=config.ref===undefined?null:config.ref;key=config.key===undefined?null:''+config.key;for(propName in config){if(config.hasOwnProperty(propName)&&!RESERVED_PROPS.hasOwnProperty(propName)){props[propName]=config[propName];}}}var childrenLength=arguments.length-2;if(childrenLength===1){props.children=children;}else if(childrenLength>1){var childArray=Array(childrenLength);for(var i=0;i<childrenLength;i++){childArray[i]=arguments[i+2];}props.children=childArray;}if(type&&type.defaultProps){var defaultProps=type.defaultProps;for(propName in defaultProps){if(typeof props[propName]==='undefined'){props[propName]=defaultProps[propName];}}}return new ReactElement(type,key,ref,ReactCurrentOwner.current,ReactContext.current,props);};ReactElement.createFactory=function(type){var factory=ReactElement.createElement.bind(null,type);factory.type=type;return factory;};ReactElement.cloneAndReplaceProps=function(oldElement,newProps){var newElement=new ReactElement(oldElement.type,oldElement.key,oldElement.ref,oldElement._owner,oldElement._context,newProps);if("production"!=="development"){newElement._store.validated=oldElement._store.validated;}return newElement;};ReactElement.cloneElement=function(element,config,children){var propName;var props=assign({},element.props);var key=element.key;var ref=element.ref;var owner=element._owner;if(config!=null){if(config.ref!==undefined){ref=config.ref;owner=ReactCurrentOwner.current;}if(config.key!==undefined){key=''+config.key;}for(propName in config){if(config.hasOwnProperty(propName)&&!RESERVED_PROPS.hasOwnProperty(propName)){props[propName]=config[propName];}}}var childrenLength=arguments.length-2;if(childrenLength===1){props.children=children;}else if(childrenLength>1){var childArray=Array(childrenLength);for(var i=0;i<childrenLength;i++){childArray[i]=arguments[i+2];}props.children=childArray;}return new ReactElement(element.type,key,ref,owner,element._context,props);};ReactElement.isValidElement=function(object){var isElement=!!(object&&object._isReactElement);return isElement;};module.exports=ReactElement;},{"154":154,"27":27,"38":38,"39":39}],58:[function(_dereq_,module,exports){'use strict';var ReactElement=_dereq_(57);var ReactFragment=_dereq_(63);var ReactPropTypeLocations=_dereq_(77);var ReactPropTypeLocationNames=_dereq_(76);var ReactCurrentOwner=_dereq_(39);var ReactNativeComponent=_dereq_(73);var getIteratorFn=_dereq_(126);var invariant=_dereq_(135);var warning=_dereq_(154);function getDeclarationErrorAddendum(){if(ReactCurrentOwner.current){var name=ReactCurrentOwner.current.getName();if(name){return' Check the render method of `'+name+'`.';}}return'';}var ownerHasKeyUseWarning={};var loggedTypeFailures={};var NUMERIC_PROPERTY_REGEX=/^\d+$/;function getName(instance){var publicInstance=instance&&instance.getPublicInstance();if(!publicInstance){return undefined;}var constructor=publicInstance.constructor;if(!constructor){return undefined;}return constructor.displayName||constructor.name||undefined;}function getCurrentOwnerDisplayName(){var current=ReactCurrentOwner.current;return current&&getName(current)||undefined;}function validateExplicitKey(element,parentType){if(element._store.validated||element.key!=null){return;}element._store.validated=true;warnAndMonitorForKeyUse('Each child in an array or iterator should have a unique "key" prop.',element,parentType);}function validatePropertyKey(name,element,parentType){if(!NUMERIC_PROPERTY_REGEX.test(name)){return;}warnAndMonitorForKeyUse('Child objects should have non-numeric keys so ordering is preserved.',element,parentType);}function warnAndMonitorForKeyUse(message,element,parentType){var ownerName=getCurrentOwnerDisplayName();var parentName=typeof parentType==='string'?parentType:parentType.displayName||parentType.name;var useName=ownerName||parentName;var memoizer=ownerHasKeyUseWarning[message]||(ownerHasKeyUseWarning[message]={});if(memoizer.hasOwnProperty(useName)){return;}memoizer[useName]=true;var parentOrOwnerAddendum=ownerName?" Check the render method of "+ownerName+".":parentName?" Check the React.render call using <"+parentName+">.":'';var childOwnerAddendum='';if(element&&element._owner&&element._owner!==ReactCurrentOwner.current){var childOwnerName=getName(element._owner);childOwnerAddendum=" It was passed a child from "+childOwnerName+".";}"production"!=="development"?warning(false,message+'%s%s See https://fb.me/react-warning-keys for more information.',parentOrOwnerAddendum,childOwnerAddendum):null;}function validateChildKeys(node,parentType){if(Array.isArray(node)){for(var i=0;i<node.length;i++){var child=node[i];if(ReactElement.isValidElement(child)){validateExplicitKey(child,parentType);}}}else if(ReactElement.isValidElement(node)){node._store.validated=true;}else if(node){var iteratorFn=getIteratorFn(node);if(iteratorFn){if(iteratorFn!==node.entries){var iterator=iteratorFn.call(node);var step;while(!(step=iterator.next()).done){if(ReactElement.isValidElement(step.value)){validateExplicitKey(step.value,parentType);}}}}else if((typeof node==="undefined"?"undefined":_typeof(node))==='object'){var fragment=ReactFragment.extractIfFragment(node);for(var key in fragment){if(fragment.hasOwnProperty(key)){validatePropertyKey(key,fragment[key],parentType);}}}}}function checkPropTypes(componentName,propTypes,props,location){for(var propName in propTypes){if(propTypes.hasOwnProperty(propName)){var error;try{"production"!=="development"?invariant(typeof propTypes[propName]==='function','%s: %s type `%s` is invalid; it must be a function, usually from '+'React.PropTypes.',componentName||'React class',ReactPropTypeLocationNames[location],propName):invariant(typeof propTypes[propName]==='function');error=propTypes[propName](props,propName,componentName,location);}catch(ex){error=ex;}if(error instanceof Error&&!(error.message in loggedTypeFailures)){loggedTypeFailures[error.message]=true;var addendum=getDeclarationErrorAddendum(this);"production"!=="development"?warning(false,'Failed propType: %s%s',error.message,addendum):null;}}}}var warnedPropsMutations={};function warnForPropsMutation(propName,element){var type=element.type;var elementName=typeof type==='string'?type:type.displayName;var ownerName=element._owner?element._owner.getPublicInstance().constructor.displayName:null;var warningKey=propName+'|'+elementName+'|'+ownerName;if(warnedPropsMutations.hasOwnProperty(warningKey)){return;}warnedPropsMutations[warningKey]=true;var elementInfo='';if(elementName){elementInfo=' <'+elementName+' />';}var ownerInfo='';if(ownerName){ownerInfo=' The element was created by '+ownerName+'.';}"production"!=="development"?warning(false,'Don\'t set .props.%s of the React component%s. Instead, specify the '+'correct value when initially creating the element or use '+'React.cloneElement to make a new element with updated props.%s',propName,elementInfo,ownerInfo):null;}function is(a,b){if(a!==a){return b!==b;}if(a===0&&b===0){return 1/a===1/b;}return a===b;}function checkAndWarnForMutatedProps(element){if(!element._store){return;}var originalProps=element._store.originalProps;var props=element.props;for(var propName in props){if(props.hasOwnProperty(propName)){if(!originalProps.hasOwnProperty(propName)||!is(originalProps[propName],props[propName])){warnForPropsMutation(propName,element);originalProps[propName]=props[propName];}}}}function validatePropTypes(element){if(element.type==null){return;}var componentClass=ReactNativeComponent.getComponentClassForElement(element);var name=componentClass.displayName||componentClass.name;if(componentClass.propTypes){checkPropTypes(name,componentClass.propTypes,element.props,ReactPropTypeLocations.prop);}if(typeof componentClass.getDefaultProps==='function'){"production"!=="development"?warning(componentClass.getDefaultProps.isReactClassApproved,'getDefaultProps is only used on classic React.createClass '+'definitions. Use a static property named `defaultProps` instead.'):null;}}var ReactElementValidator={checkAndWarnForMutatedProps:checkAndWarnForMutatedProps,createElement:function createElement(type,props,children){"production"!=="development"?warning(type!=null,'React.createElement: type should not be null or undefined. It should '+'be a string (for DOM elements) or a ReactClass (for composite '+'components).'):null;var element=ReactElement.createElement.apply(this,arguments);if(element==null){return element;}for(var i=2;i<arguments.length;i++){validateChildKeys(arguments[i],type);}validatePropTypes(element);return element;},createFactory:function createFactory(type){var validatedFactory=ReactElementValidator.createElement.bind(null,type);validatedFactory.type=type;if("production"!=="development"){try{Object.defineProperty(validatedFactory,'type',{enumerable:false,get:function get(){"production"!=="development"?warning(false,'Factory.type is deprecated. Access the class directly '+'before passing it to createFactory.'):null;Object.defineProperty(this,'type',{value:type});return type;}});}catch(x){}}return validatedFactory;},cloneElement:function cloneElement(element,props,children){var newElement=ReactElement.cloneElement.apply(this,arguments);for(var i=2;i<arguments.length;i++){validateChildKeys(arguments[i],newElement.type);}validatePropTypes(newElement);return newElement;}};module.exports=ReactElementValidator;},{"126":126,"135":135,"154":154,"39":39,"57":57,"63":63,"73":73,"76":76,"77":77}],59:[function(_dereq_,module,exports){'use strict';var ReactElement=_dereq_(57);var ReactInstanceMap=_dereq_(67);var invariant=_dereq_(135);var component;var nullComponentIDsRegistry={};var ReactEmptyComponentInjection={injectEmptyComponent:function injectEmptyComponent(emptyComponent){component=ReactElement.createFactory(emptyComponent);}};var ReactEmptyComponentType=function ReactEmptyComponentType(){};ReactEmptyComponentType.prototype.componentDidMount=function(){var internalInstance=ReactInstanceMap.get(this);if(!internalInstance){return;}registerNullComponentID(internalInstance._rootNodeID);};ReactEmptyComponentType.prototype.componentWillUnmount=function(){var internalInstance=ReactInstanceMap.get(this);if(!internalInstance){return;}deregisterNullComponentID(internalInstance._rootNodeID);};ReactEmptyComponentType.prototype.render=function(){"production"!=="development"?invariant(component,'Trying to return null from a render, but no null placeholder component '+'was injected.'):invariant(component);return component();};var emptyElement=ReactElement.createElement(ReactEmptyComponentType);function registerNullComponentID(id){nullComponentIDsRegistry[id]=true;}function deregisterNullComponentID(id){delete nullComponentIDsRegistry[id];}function isNullComponentID(id){return!!nullComponentIDsRegistry[id];}var ReactEmptyComponent={emptyElement:emptyElement,injection:ReactEmptyComponentInjection,isNullComponentID:isNullComponentID};module.exports=ReactEmptyComponent;},{"135":135,"57":57,"67":67}],60:[function(_dereq_,module,exports){"use strict";var ReactErrorUtils={guard:function guard(func,name){return func;}};module.exports=ReactErrorUtils;},{}],61:[function(_dereq_,module,exports){'use strict';var EventPluginHub=_dereq_(17);function runEventQueueInBatch(events){EventPluginHub.enqueueEvents(events);EventPluginHub.processEventQueue();}var ReactEventEmitterMixin={handleTopLevel:function handleTopLevel(topLevelType,topLevelTarget,topLevelTargetID,nativeEvent){var events=EventPluginHub.extractEvents(topLevelType,topLevelTarget,topLevelTargetID,nativeEvent);runEventQueueInBatch(events);}};module.exports=ReactEventEmitterMixin;},{"17":17}],62:[function(_dereq_,module,exports){'use strict';var EventListener=_dereq_(16);var ExecutionEnvironment=_dereq_(21);var PooledClass=_dereq_(28);var ReactInstanceHandles=_dereq_(66);var ReactMount=_dereq_(70);var ReactUpdates=_dereq_(87);var assign=_dereq_(27);var getEventTarget=_dereq_(125);var getUnboundedScrollPosition=_dereq_(131);function findParent(node){var nodeID=ReactMount.getID(node);var rootID=ReactInstanceHandles.getReactRootIDFromNodeID(nodeID);var container=ReactMount.findReactContainerForID(rootID);var parent=ReactMount.getFirstReactDOM(container);return parent;}function TopLevelCallbackBookKeeping(topLevelType,nativeEvent){this.topLevelType=topLevelType;this.nativeEvent=nativeEvent;this.ancestors=[];}assign(TopLevelCallbackBookKeeping.prototype,{destructor:function destructor(){this.topLevelType=null;this.nativeEvent=null;this.ancestors.length=0;}});PooledClass.addPoolingTo(TopLevelCallbackBookKeeping,PooledClass.twoArgumentPooler);function handleTopLevelImpl(bookKeeping){var topLevelTarget=ReactMount.getFirstReactDOM(getEventTarget(bookKeeping.nativeEvent))||window;var ancestor=topLevelTarget;while(ancestor){bookKeeping.ancestors.push(ancestor);ancestor=findParent(ancestor);}for(var i=0,l=bookKeeping.ancestors.length;i<l;i++){topLevelTarget=bookKeeping.ancestors[i];var topLevelTargetID=ReactMount.getID(topLevelTarget)||'';ReactEventListener._handleTopLevel(bookKeeping.topLevelType,topLevelTarget,topLevelTargetID,bookKeeping.nativeEvent);}}function scrollValueMonitor(cb){var scrollPosition=getUnboundedScrollPosition(window);cb(scrollPosition);}var ReactEventListener={_enabled:true,_handleTopLevel:null,WINDOW_HANDLE:ExecutionEnvironment.canUseDOM?window:null,setHandleTopLevel:function setHandleTopLevel(handleTopLevel){ReactEventListener._handleTopLevel=handleTopLevel;},setEnabled:function setEnabled(enabled){ReactEventListener._enabled=!!enabled;},isEnabled:function isEnabled(){return ReactEventListener._enabled;},trapBubbledEvent:function trapBubbledEvent(topLevelType,handlerBaseName,handle){var element=handle;if(!element){return null;}return EventListener.listen(element,handlerBaseName,ReactEventListener.dispatchEvent.bind(null,topLevelType));},trapCapturedEvent:function trapCapturedEvent(topLevelType,handlerBaseName,handle){var element=handle;if(!element){return null;}return EventListener.capture(element,handlerBaseName,ReactEventListener.dispatchEvent.bind(null,topLevelType));},monitorScrollValue:function monitorScrollValue(refresh){var callback=scrollValueMonitor.bind(null,refresh);EventListener.listen(window,'scroll',callback);},dispatchEvent:function dispatchEvent(topLevelType,nativeEvent){if(!ReactEventListener._enabled){return;}var bookKeeping=TopLevelCallbackBookKeeping.getPooled(topLevelType,nativeEvent);try{ReactUpdates.batchedUpdates(handleTopLevelImpl,bookKeeping);}finally{TopLevelCallbackBookKeeping.release(bookKeeping);}}};module.exports=ReactEventListener;},{"125":125,"131":131,"16":16,"21":21,"27":27,"28":28,"66":66,"70":70,"87":87}],63:[function(_dereq_,module,exports){'use strict';var ReactElement=_dereq_(57);var warning=_dereq_(154);if("production"!=="development"){var fragmentKey='_reactFragment';var didWarnKey='_reactDidWarn';var canWarnForReactFragment=false;try{var dummy=function dummy(){return 1;};Object.defineProperty({},fragmentKey,{enumerable:false,value:true});Object.defineProperty({},'key',{enumerable:true,get:dummy});canWarnForReactFragment=true;}catch(x){}var proxyPropertyAccessWithWarning=function proxyPropertyAccessWithWarning(obj,key){Object.defineProperty(obj,key,{enumerable:true,get:function get(){"production"!=="development"?warning(this[didWarnKey],'A ReactFragment is an opaque type. Accessing any of its '+'properties is deprecated. Pass it to one of the React.Children '+'helpers.'):null;this[didWarnKey]=true;return this[fragmentKey][key];},set:function set(value){"production"!=="development"?warning(this[didWarnKey],'A ReactFragment is an immutable opaque type. Mutating its '+'properties is deprecated.'):null;this[didWarnKey]=true;this[fragmentKey][key]=value;}});};var issuedWarnings={};var didWarnForFragment=function didWarnForFragment(fragment){var fragmentCacheKey='';for(var key in fragment){fragmentCacheKey+=key+':'+_typeof(fragment[key])+',';}var alreadyWarnedOnce=!!issuedWarnings[fragmentCacheKey];issuedWarnings[fragmentCacheKey]=true;return alreadyWarnedOnce;};}var ReactFragment={create:function create(object){if("production"!=="development"){if((typeof object==="undefined"?"undefined":_typeof(object))!=='object'||!object||Array.isArray(object)){"production"!=="development"?warning(false,'React.addons.createFragment only accepts a single object.',object):null;return object;}if(ReactElement.isValidElement(object)){"production"!=="development"?warning(false,'React.addons.createFragment does not accept a ReactElement '+'without a wrapper object.'):null;return object;}if(canWarnForReactFragment){var proxy={};Object.defineProperty(proxy,fragmentKey,{enumerable:false,value:object});Object.defineProperty(proxy,didWarnKey,{writable:true,enumerable:false,value:false});for(var key in object){proxyPropertyAccessWithWarning(proxy,key);}Object.preventExtensions(proxy);return proxy;}}return object;},extract:function extract(fragment){if("production"!=="development"){if(canWarnForReactFragment){if(!fragment[fragmentKey]){"production"!=="development"?warning(didWarnForFragment(fragment),'Any use of a keyed object should be wrapped in '+'React.addons.createFragment(object) before being passed as a '+'child.'):null;return fragment;}return fragment[fragmentKey];}}return fragment;},extractIfFragment:function extractIfFragment(fragment){if("production"!=="development"){if(canWarnForReactFragment){if(fragment[fragmentKey]){return fragment[fragmentKey];}for(var key in fragment){if(fragment.hasOwnProperty(key)&&ReactElement.isValidElement(fragment[key])){return ReactFragment.extract(fragment);}}}}return fragment;}};module.exports=ReactFragment;},{"154":154,"57":57}],64:[function(_dereq_,module,exports){'use strict';var DOMProperty=_dereq_(10);var EventPluginHub=_dereq_(17);var ReactComponentEnvironment=_dereq_(36);var ReactClass=_dereq_(33);var ReactEmptyComponent=_dereq_(59);var ReactBrowserEventEmitter=_dereq_(30);var ReactNativeComponent=_dereq_(73);var ReactDOMComponent=_dereq_(42);var ReactPerf=_dereq_(75);var ReactRootIndex=_dereq_(83);var ReactUpdates=_dereq_(87);var ReactInjection={Component:ReactComponentEnvironment.injection,Class:ReactClass.injection,DOMComponent:ReactDOMComponent.injection,DOMProperty:DOMProperty.injection,EmptyComponent:ReactEmptyComponent.injection,EventPluginHub:EventPluginHub.injection,EventEmitter:ReactBrowserEventEmitter.injection,NativeComponent:ReactNativeComponent.injection,Perf:ReactPerf.injection,RootIndex:ReactRootIndex.injection,Updates:ReactUpdates.injection};module.exports=ReactInjection;},{"10":10,"17":17,"30":30,"33":33,"36":36,"42":42,"59":59,"73":73,"75":75,"83":83,"87":87}],65:[function(_dereq_,module,exports){'use strict';var ReactDOMSelection=_dereq_(50);var containsNode=_dereq_(109);var focusNode=_dereq_(119);var getActiveElement=_dereq_(121);function isInDocument(node){return containsNode(document.documentElement,node);}var ReactInputSelection={hasSelectionCapabilities:function hasSelectionCapabilities(elem){return elem&&(elem.nodeName==='INPUT'&&elem.type==='text'||elem.nodeName==='TEXTAREA'||elem.contentEditable==='true');},getSelectionInformation:function getSelectionInformation(){var focusedElem=getActiveElement();return{focusedElem:focusedElem,selectionRange:ReactInputSelection.hasSelectionCapabilities(focusedElem)?ReactInputSelection.getSelection(focusedElem):null};},restoreSelection:function restoreSelection(priorSelectionInformation){var curFocusedElem=getActiveElement();var priorFocusedElem=priorSelectionInformation.focusedElem;var priorSelectionRange=priorSelectionInformation.selectionRange;if(curFocusedElem!==priorFocusedElem&&isInDocument(priorFocusedElem)){if(ReactInputSelection.hasSelectionCapabilities(priorFocusedElem)){ReactInputSelection.setSelection(priorFocusedElem,priorSelectionRange);}focusNode(priorFocusedElem);}},getSelection:function getSelection(input){var selection;if('selectionStart'in input){selection={start:input.selectionStart,end:input.selectionEnd};}else if(document.selection&&input.nodeName==='INPUT'){var range=document.selection.createRange();if(range.parentElement()===input){selection={start:-range.moveStart('character',-input.value.length),end:-range.moveEnd('character',-input.value.length)};}}else{selection=ReactDOMSelection.getOffsets(input);}return selection||{start:0,end:0};},setSelection:function setSelection(input,offsets){var start=offsets.start;var end=offsets.end;if(typeof end==='undefined'){end=start;}if('selectionStart'in input){input.selectionStart=start;input.selectionEnd=Math.min(end,input.value.length);}else if(document.selection&&input.nodeName==='INPUT'){var range=input.createTextRange();range.collapse(true);range.moveStart('character',start);range.moveEnd('character',end-start);range.select();}else{ReactDOMSelection.setOffsets(input,offsets);}}};module.exports=ReactInputSelection;},{"109":109,"119":119,"121":121,"50":50}],66:[function(_dereq_,module,exports){'use strict';var ReactRootIndex=_dereq_(83);var invariant=_dereq_(135);var SEPARATOR='.';var SEPARATOR_LENGTH=SEPARATOR.length;var MAX_TREE_DEPTH=100;function getReactRootIDString(index){return SEPARATOR+index.toString(36);}function isBoundary(id,index){return id.charAt(index)===SEPARATOR||index===id.length;}function isValidID(id){return id===''||id.charAt(0)===SEPARATOR&&id.charAt(id.length-1)!==SEPARATOR;}function isAncestorIDOf(ancestorID,descendantID){return descendantID.indexOf(ancestorID)===0&&isBoundary(descendantID,ancestorID.length);}function getParentID(id){return id?id.substr(0,id.lastIndexOf(SEPARATOR)):'';}function getNextDescendantID(ancestorID,destinationID){"production"!=="development"?invariant(isValidID(ancestorID)&&isValidID(destinationID),'getNextDescendantID(%s, %s): Received an invalid React DOM ID.',ancestorID,destinationID):invariant(isValidID(ancestorID)&&isValidID(destinationID));"production"!=="development"?invariant(isAncestorIDOf(ancestorID,destinationID),'getNextDescendantID(...): React has made an invalid assumption about '+'the DOM hierarchy. Expected `%s` to be an ancestor of `%s`.',ancestorID,destinationID):invariant(isAncestorIDOf(ancestorID,destinationID));if(ancestorID===destinationID){return ancestorID;}var start=ancestorID.length+SEPARATOR_LENGTH;var i;for(i=start;i<destinationID.length;i++){if(isBoundary(destinationID,i)){break;}}return destinationID.substr(0,i);}function getFirstCommonAncestorID(oneID,twoID){var minLength=Math.min(oneID.length,twoID.length);if(minLength===0){return'';}var lastCommonMarkerIndex=0;for(var i=0;i<=minLength;i++){if(isBoundary(oneID,i)&&isBoundary(twoID,i)){lastCommonMarkerIndex=i;}else if(oneID.charAt(i)!==twoID.charAt(i)){break;}}var longestCommonID=oneID.substr(0,lastCommonMarkerIndex);"production"!=="development"?invariant(isValidID(longestCommonID),'getFirstCommonAncestorID(%s, %s): Expected a valid React DOM ID: %s',oneID,twoID,longestCommonID):invariant(isValidID(longestCommonID));return longestCommonID;}function traverseParentPath(start,stop,cb,arg,skipFirst,skipLast){start=start||'';stop=stop||'';"production"!=="development"?invariant(start!==stop,'traverseParentPath(...): Cannot traverse from and to the same ID, `%s`.',start):invariant(start!==stop);var traverseUp=isAncestorIDOf(stop,start);"production"!=="development"?invariant(traverseUp||isAncestorIDOf(start,stop),'traverseParentPath(%s, %s, ...): Cannot traverse from two IDs that do '+'not have a parent path.',start,stop):invariant(traverseUp||isAncestorIDOf(start,stop));var depth=0;var traverse=traverseUp?getParentID:getNextDescendantID;for(var id=start;;id=traverse(id,stop)){var ret;if((!skipFirst||id!==start)&&(!skipLast||id!==stop)){ret=cb(id,traverseUp,arg);}if(ret===false||id===stop){break;}"production"!=="development"?invariant(depth++<MAX_TREE_DEPTH,'traverseParentPath(%s, %s, ...): Detected an infinite loop while '+'traversing the React DOM ID tree. This may be due to malformed IDs: %s',start,stop):invariant(depth++<MAX_TREE_DEPTH);}}var ReactInstanceHandles={createReactRootID:function createReactRootID(){return getReactRootIDString(ReactRootIndex.createReactRootIndex());},createReactID:function createReactID(rootID,name){return rootID+name;},getReactRootIDFromNodeID:function getReactRootIDFromNodeID(id){if(id&&id.charAt(0)===SEPARATOR&&id.length>1){var index=id.indexOf(SEPARATOR,1);return index>-1?id.substr(0,index):id;}return null;},traverseEnterLeave:function traverseEnterLeave(leaveID,enterID,cb,upArg,downArg){var ancestorID=getFirstCommonAncestorID(leaveID,enterID);if(ancestorID!==leaveID){traverseParentPath(leaveID,ancestorID,cb,upArg,false,true);}if(ancestorID!==enterID){traverseParentPath(ancestorID,enterID,cb,downArg,true,false);}},traverseTwoPhase:function traverseTwoPhase(targetID,cb,arg){if(targetID){traverseParentPath('',targetID,cb,arg,true,false);traverseParentPath(targetID,'',cb,arg,false,true);}},traverseAncestors:function traverseAncestors(targetID,cb,arg){traverseParentPath('',targetID,cb,arg,true,false);},_getFirstCommonAncestorID:getFirstCommonAncestorID,_getNextDescendantID:getNextDescendantID,isAncestorIDOf:isAncestorIDOf,SEPARATOR:SEPARATOR};module.exports=ReactInstanceHandles;},{"135":135,"83":83}],67:[function(_dereq_,module,exports){'use strict';var ReactInstanceMap={remove:function remove(key){key._reactInternalInstance=undefined;},get:function get(key){return key._reactInternalInstance;},has:function has(key){return key._reactInternalInstance!==undefined;},set:function set(key,value){key._reactInternalInstance=value;}};module.exports=ReactInstanceMap;},{}],68:[function(_dereq_,module,exports){'use strict';var ReactLifeCycle={currentlyMountingInstance:null,currentlyUnmountingInstance:null};module.exports=ReactLifeCycle;},{}],69:[function(_dereq_,module,exports){'use strict';var adler32=_dereq_(106);var ReactMarkupChecksum={CHECKSUM_ATTR_NAME:'data-react-checksum',addChecksumToMarkup:function addChecksumToMarkup(markup){var checksum=adler32(markup);return markup.replace('>',' '+ReactMarkupChecksum.CHECKSUM_ATTR_NAME+'="'+checksum+'">');},canReuseMarkup:function canReuseMarkup(markup,element){var existingChecksum=element.getAttribute(ReactMarkupChecksum.CHECKSUM_ATTR_NAME);existingChecksum=existingChecksum&&parseInt(existingChecksum,10);var markupChecksum=adler32(markup);return markupChecksum===existingChecksum;}};module.exports=ReactMarkupChecksum;},{"106":106}],70:[function(_dereq_,module,exports){'use strict';var DOMProperty=_dereq_(10);var ReactBrowserEventEmitter=_dereq_(30);var ReactCurrentOwner=_dereq_(39);var ReactElement=_dereq_(57);var ReactElementValidator=_dereq_(58);var ReactEmptyComponent=_dereq_(59);var ReactInstanceHandles=_dereq_(66);var ReactInstanceMap=_dereq_(67);var ReactMarkupChecksum=_dereq_(69);var ReactPerf=_dereq_(75);var ReactReconciler=_dereq_(81);var ReactUpdateQueue=_dereq_(86);var ReactUpdates=_dereq_(87);var emptyObject=_dereq_(115);var containsNode=_dereq_(109);var getReactRootElementInContainer=_dereq_(129);var instantiateReactComponent=_dereq_(134);var invariant=_dereq_(135);var setInnerHTML=_dereq_(148);var shouldUpdateReactComponent=_dereq_(151);var warning=_dereq_(154);var SEPARATOR=ReactInstanceHandles.SEPARATOR;var ATTR_NAME=DOMProperty.ID_ATTRIBUTE_NAME;var nodeCache={};var ELEMENT_NODE_TYPE=1;var DOC_NODE_TYPE=9;var instancesByReactRootID={};var containersByReactRootID={};if("production"!=="development"){var rootElementsByReactRootID={};}var findComponentRootReusableArray=[];function firstDifferenceIndex(string1,string2){var minLen=Math.min(string1.length,string2.length);for(var i=0;i<minLen;i++){if(string1.charAt(i)!==string2.charAt(i)){return i;}}return string1.length===string2.length?-1:minLen;}function getReactRootID(container){var rootElement=getReactRootElementInContainer(container);return rootElement&&ReactMount.getID(rootElement);}function getID(node){var id=internalGetID(node);if(id){if(nodeCache.hasOwnProperty(id)){var cached=nodeCache[id];if(cached!==node){"production"!=="development"?invariant(!isValid(cached,id),'ReactMount: Two valid but unequal nodes with the same `%s`: %s',ATTR_NAME,id):invariant(!isValid(cached,id));nodeCache[id]=node;}}else{nodeCache[id]=node;}}return id;}function internalGetID(node){return node&&node.getAttribute&&node.getAttribute(ATTR_NAME)||'';}function setID(node,id){var oldID=internalGetID(node);if(oldID!==id){delete nodeCache[oldID];}node.setAttribute(ATTR_NAME,id);nodeCache[id]=node;}function getNode(id){if(!nodeCache.hasOwnProperty(id)||!isValid(nodeCache[id],id)){nodeCache[id]=ReactMount.findReactNodeByID(id);}return nodeCache[id];}function getNodeFromInstance(instance){var id=ReactInstanceMap.get(instance)._rootNodeID;if(ReactEmptyComponent.isNullComponentID(id)){return null;}if(!nodeCache.hasOwnProperty(id)||!isValid(nodeCache[id],id)){nodeCache[id]=ReactMount.findReactNodeByID(id);}return nodeCache[id];}function isValid(node,id){if(node){"production"!=="development"?invariant(internalGetID(node)===id,'ReactMount: Unexpected modification of `%s`',ATTR_NAME):invariant(internalGetID(node)===id);var container=ReactMount.findReactContainerForID(id);if(container&&containsNode(container,node)){return true;}}return false;}function purgeID(id){delete nodeCache[id];}var deepestNodeSoFar=null;function findDeepestCachedAncestorImpl(ancestorID){var ancestor=nodeCache[ancestorID];if(ancestor&&isValid(ancestor,ancestorID)){deepestNodeSoFar=ancestor;}else{return false;}}function findDeepestCachedAncestor(targetID){deepestNodeSoFar=null;ReactInstanceHandles.traverseAncestors(targetID,findDeepestCachedAncestorImpl);var foundNode=deepestNodeSoFar;deepestNodeSoFar=null;return foundNode;}function mountComponentIntoNode(componentInstance,rootID,container,transaction,shouldReuseMarkup){var markup=ReactReconciler.mountComponent(componentInstance,rootID,transaction,emptyObject);componentInstance._isTopLevel=true;ReactMount._mountImageIntoNode(markup,container,shouldReuseMarkup);}function batchedMountComponentIntoNode(componentInstance,rootID,container,shouldReuseMarkup){var transaction=ReactUpdates.ReactReconcileTransaction.getPooled();transaction.perform(mountComponentIntoNode,null,componentInstance,rootID,container,transaction,shouldReuseMarkup);ReactUpdates.ReactReconcileTransaction.release(transaction);}var ReactMount={_instancesByReactRootID:instancesByReactRootID,scrollMonitor:function scrollMonitor(container,renderCallback){renderCallback();},_updateRootComponent:function _updateRootComponent(prevComponent,nextElement,container,callback){if("production"!=="development"){ReactElementValidator.checkAndWarnForMutatedProps(nextElement);}ReactMount.scrollMonitor(container,function(){ReactUpdateQueue.enqueueElementInternal(prevComponent,nextElement);if(callback){ReactUpdateQueue.enqueueCallbackInternal(prevComponent,callback);}});if("production"!=="development"){rootElementsByReactRootID[getReactRootID(container)]=getReactRootElementInContainer(container);}return prevComponent;},_registerComponent:function _registerComponent(nextComponent,container){"production"!=="development"?invariant(container&&(container.nodeType===ELEMENT_NODE_TYPE||container.nodeType===DOC_NODE_TYPE),'_registerComponent(...): Target container is not a DOM element.'):invariant(container&&(container.nodeType===ELEMENT_NODE_TYPE||container.nodeType===DOC_NODE_TYPE));ReactBrowserEventEmitter.ensureScrollValueMonitoring();var reactRootID=ReactMount.registerContainer(container);instancesByReactRootID[reactRootID]=nextComponent;return reactRootID;},_renderNewRootComponent:function _renderNewRootComponent(nextElement,container,shouldReuseMarkup){"production"!=="development"?warning(ReactCurrentOwner.current==null,'_renderNewRootComponent(): Render methods should be a pure function '+'of props and state; triggering nested component updates from '+'render is not allowed. If necessary, trigger nested updates in '+'componentDidUpdate.'):null;var componentInstance=instantiateReactComponent(nextElement,null);var reactRootID=ReactMount._registerComponent(componentInstance,container);ReactUpdates.batchedUpdates(batchedMountComponentIntoNode,componentInstance,reactRootID,container,shouldReuseMarkup);if("production"!=="development"){rootElementsByReactRootID[reactRootID]=getReactRootElementInContainer(container);}return componentInstance;},render:function render(nextElement,container,callback){"production"!=="development"?invariant(ReactElement.isValidElement(nextElement),'React.render(): Invalid component element.%s',typeof nextElement==='string'?' Instead of passing an element string, make sure to instantiate '+'it by passing it to React.createElement.':typeof nextElement==='function'?' Instead of passing a component class, make sure to instantiate '+'it by passing it to React.createElement.':nextElement!=null&&nextElement.props!==undefined?' This may be caused by unintentionally loading two independent '+'copies of React.':''):invariant(ReactElement.isValidElement(nextElement));var prevComponent=instancesByReactRootID[getReactRootID(container)];if(prevComponent){var prevElement=prevComponent._currentElement;if(shouldUpdateReactComponent(prevElement,nextElement)){return ReactMount._updateRootComponent(prevComponent,nextElement,container,callback).getPublicInstance();}else{ReactMount.unmountComponentAtNode(container);}}var reactRootElement=getReactRootElementInContainer(container);var containerHasReactMarkup=reactRootElement&&ReactMount.isRenderedByReact(reactRootElement);if("production"!=="development"){if(!containerHasReactMarkup||reactRootElement.nextSibling){var rootElementSibling=reactRootElement;while(rootElementSibling){if(ReactMount.isRenderedByReact(rootElementSibling)){"production"!=="development"?warning(false,'render(): Target node has markup rendered by React, but there '+'are unrelated nodes as well. This is most commonly caused by '+'white-space inserted around server-rendered markup.'):null;break;}rootElementSibling=rootElementSibling.nextSibling;}}}var shouldReuseMarkup=containerHasReactMarkup&&!prevComponent;var component=ReactMount._renderNewRootComponent(nextElement,container,shouldReuseMarkup).getPublicInstance();if(callback){callback.call(component);}return component;},constructAndRenderComponent:function constructAndRenderComponent(constructor,props,container){var element=ReactElement.createElement(constructor,props);return ReactMount.render(element,container);},constructAndRenderComponentByID:function constructAndRenderComponentByID(constructor,props,id){var domNode=document.getElementById(id);"production"!=="development"?invariant(domNode,'Tried to get element with id of "%s" but it is not present on the page.',id):invariant(domNode);return ReactMount.constructAndRenderComponent(constructor,props,domNode);},registerContainer:function registerContainer(container){var reactRootID=getReactRootID(container);if(reactRootID){reactRootID=ReactInstanceHandles.getReactRootIDFromNodeID(reactRootID);}if(!reactRootID){reactRootID=ReactInstanceHandles.createReactRootID();}containersByReactRootID[reactRootID]=container;return reactRootID;},unmountComponentAtNode:function unmountComponentAtNode(container){"production"!=="development"?warning(ReactCurrentOwner.current==null,'unmountComponentAtNode(): Render methods should be a pure function of '+'props and state; triggering nested component updates from render is '+'not allowed. If necessary, trigger nested updates in '+'componentDidUpdate.'):null;"production"!=="development"?invariant(container&&(container.nodeType===ELEMENT_NODE_TYPE||container.nodeType===DOC_NODE_TYPE),'unmountComponentAtNode(...): Target container is not a DOM element.'):invariant(container&&(container.nodeType===ELEMENT_NODE_TYPE||container.nodeType===DOC_NODE_TYPE));var reactRootID=getReactRootID(container);var component=instancesByReactRootID[reactRootID];if(!component){return false;}ReactMount.unmountComponentFromNode(component,container);delete instancesByReactRootID[reactRootID];delete containersByReactRootID[reactRootID];if("production"!=="development"){delete rootElementsByReactRootID[reactRootID];}return true;},unmountComponentFromNode:function unmountComponentFromNode(instance,container){ReactReconciler.unmountComponent(instance);if(container.nodeType===DOC_NODE_TYPE){container=container.documentElement;}while(container.lastChild){container.removeChild(container.lastChild);}},findReactContainerForID:function findReactContainerForID(id){var reactRootID=ReactInstanceHandles.getReactRootIDFromNodeID(id);var container=containersByReactRootID[reactRootID];if("production"!=="development"){var rootElement=rootElementsByReactRootID[reactRootID];if(rootElement&&rootElement.parentNode!==container){"production"!=="development"?invariant(internalGetID(rootElement)===reactRootID,'ReactMount: Root element ID differed from reactRootID.'):invariant(internalGetID(rootElement)===reactRootID);var containerChild=container.firstChild;if(containerChild&&reactRootID===internalGetID(containerChild)){rootElementsByReactRootID[reactRootID]=containerChild;}else{"production"!=="development"?warning(false,'ReactMount: Root element has been removed from its original '+'container. New container:',rootElement.parentNode):null;}}}return container;},findReactNodeByID:function findReactNodeByID(id){var reactRoot=ReactMount.findReactContainerForID(id);return ReactMount.findComponentRoot(reactRoot,id);},isRenderedByReact:function isRenderedByReact(node){if(node.nodeType!==1){return false;}var id=ReactMount.getID(node);return id?id.charAt(0)===SEPARATOR:false;},getFirstReactDOM:function getFirstReactDOM(node){var current=node;while(current&&current.parentNode!==current){if(ReactMount.isRenderedByReact(current)){return current;}current=current.parentNode;}return null;},findComponentRoot:function findComponentRoot(ancestorNode,targetID){var firstChildren=findComponentRootReusableArray;var childIndex=0;var deepestAncestor=findDeepestCachedAncestor(targetID)||ancestorNode;firstChildren[0]=deepestAncestor.firstChild;firstChildren.length=1;while(childIndex<firstChildren.length){var child=firstChildren[childIndex++];var targetChild;while(child){var childID=ReactMount.getID(child);if(childID){if(targetID===childID){targetChild=child;}else if(ReactInstanceHandles.isAncestorIDOf(childID,targetID)){firstChildren.length=childIndex=0;firstChildren.push(child.firstChild);}}else{firstChildren.push(child.firstChild);}child=child.nextSibling;}if(targetChild){firstChildren.length=0;return targetChild;}}firstChildren.length=0;"production"!=="development"?invariant(false,'findComponentRoot(..., %s): Unable to find element. This probably '+'means the DOM was unexpectedly mutated (e.g., by the browser), '+'usually due to forgetting a <tbody> when using tables, nesting tags '+'like <form>, <p>, or <a>, or using non-SVG elements in an <svg> '+'parent. '+'Try inspecting the child nodes of the element with React ID `%s`.',targetID,ReactMount.getID(ancestorNode)):invariant(false);},_mountImageIntoNode:function _mountImageIntoNode(markup,container,shouldReuseMarkup){"production"!=="development"?invariant(container&&(container.nodeType===ELEMENT_NODE_TYPE||container.nodeType===DOC_NODE_TYPE),'mountComponentIntoNode(...): Target container is not valid.'):invariant(container&&(container.nodeType===ELEMENT_NODE_TYPE||container.nodeType===DOC_NODE_TYPE));if(shouldReuseMarkup){var rootElement=getReactRootElementInContainer(container);if(ReactMarkupChecksum.canReuseMarkup(markup,rootElement)){return;}else{var checksum=rootElement.getAttribute(ReactMarkupChecksum.CHECKSUM_ATTR_NAME);rootElement.removeAttribute(ReactMarkupChecksum.CHECKSUM_ATTR_NAME);var rootMarkup=rootElement.outerHTML;rootElement.setAttribute(ReactMarkupChecksum.CHECKSUM_ATTR_NAME,checksum);var diffIndex=firstDifferenceIndex(markup,rootMarkup);var difference=' (client) '+markup.substring(diffIndex-20,diffIndex+20)+'\n (server) '+rootMarkup.substring(diffIndex-20,diffIndex+20);"production"!=="development"?invariant(container.nodeType!==DOC_NODE_TYPE,'You\'re trying to render a component to the document using '+'server rendering but the checksum was invalid. This usually '+'means you rendered a different component type or props on '+'the client from the one on the server, or your render() '+'methods are impure. React cannot handle this case due to '+'cross-browser quirks by rendering at the document root. You '+'should look for environment dependent code in your components '+'and ensure the props are the same client and server side:\n%s',difference):invariant(container.nodeType!==DOC_NODE_TYPE);if("production"!=="development"){"production"!=="development"?warning(false,'React attempted to reuse markup in a container but the '+'checksum was invalid. This generally means that you are '+'using server rendering and the markup generated on the '+'server was not what the client was expecting. React injected '+'new markup to compensate which works but you have lost many '+'of the benefits of server rendering. Instead, figure out '+'why the markup being generated is different on the client '+'or server:\n%s',difference):null;}}}"production"!=="development"?invariant(container.nodeType!==DOC_NODE_TYPE,'You\'re trying to render a component to the document but '+'you didn\'t use server rendering. We can\'t do this '+'without using server rendering due to cross-browser quirks. '+'See React.renderToString() for server rendering.'):invariant(container.nodeType!==DOC_NODE_TYPE);setInnerHTML(container,markup);},getReactRootID:getReactRootID,getID:getID,setID:setID,getNode:getNode,getNodeFromInstance:getNodeFromInstance,purgeID:purgeID};ReactPerf.measureMethods(ReactMount,'ReactMount',{_renderNewRootComponent:'_renderNewRootComponent',_mountImageIntoNode:'_mountImageIntoNode'});module.exports=ReactMount;},{"10":10,"109":109,"115":115,"129":129,"134":134,"135":135,"148":148,"151":151,"154":154,"30":30,"39":39,"57":57,"58":58,"59":59,"66":66,"67":67,"69":69,"75":75,"81":81,"86":86,"87":87}],71:[function(_dereq_,module,exports){'use strict';var ReactComponentEnvironment=_dereq_(36);var ReactMultiChildUpdateTypes=_dereq_(72);var ReactReconciler=_dereq_(81);var ReactChildReconciler=_dereq_(31);var updateDepth=0;var updateQueue=[];var markupQueue=[];function enqueueMarkup(parentID,markup,toIndex){updateQueue.push({parentID:parentID,parentNode:null,type:ReactMultiChildUpdateTypes.INSERT_MARKUP,markupIndex:markupQueue.push(markup)-1,textContent:null,fromIndex:null,toIndex:toIndex});}function enqueueMove(parentID,fromIndex,toIndex){updateQueue.push({parentID:parentID,parentNode:null,type:ReactMultiChildUpdateTypes.MOVE_EXISTING,markupIndex:null,textContent:null,fromIndex:fromIndex,toIndex:toIndex});}function enqueueRemove(parentID,fromIndex){updateQueue.push({parentID:parentID,parentNode:null,type:ReactMultiChildUpdateTypes.REMOVE_NODE,markupIndex:null,textContent:null,fromIndex:fromIndex,toIndex:null});}function enqueueTextContent(parentID,textContent){updateQueue.push({parentID:parentID,parentNode:null,type:ReactMultiChildUpdateTypes.TEXT_CONTENT,markupIndex:null,textContent:textContent,fromIndex:null,toIndex:null});}function processQueue(){if(updateQueue.length){ReactComponentEnvironment.processChildrenUpdates(updateQueue,markupQueue);clearQueue();}}function clearQueue(){updateQueue.length=0;markupQueue.length=0;}var ReactMultiChild={Mixin:{mountChildren:function mountChildren(nestedChildren,transaction,context){var children=ReactChildReconciler.instantiateChildren(nestedChildren,transaction,context);this._renderedChildren=children;var mountImages=[];var index=0;for(var name in children){if(children.hasOwnProperty(name)){var child=children[name];var rootID=this._rootNodeID+name;var mountImage=ReactReconciler.mountComponent(child,rootID,transaction,context);child._mountIndex=index;mountImages.push(mountImage);index++;}}return mountImages;},updateTextContent:function updateTextContent(nextContent){updateDepth++;var errorThrown=true;try{var prevChildren=this._renderedChildren;ReactChildReconciler.unmountChildren(prevChildren);for(var name in prevChildren){if(prevChildren.hasOwnProperty(name)){this._unmountChildByName(prevChildren[name],name);}}this.setTextContent(nextContent);errorThrown=false;}finally{updateDepth--;if(!updateDepth){if(errorThrown){clearQueue();}else{processQueue();}}}},updateChildren:function updateChildren(nextNestedChildren,transaction,context){updateDepth++;var errorThrown=true;try{this._updateChildren(nextNestedChildren,transaction,context);errorThrown=false;}finally{updateDepth--;if(!updateDepth){if(errorThrown){clearQueue();}else{processQueue();}}}},_updateChildren:function _updateChildren(nextNestedChildren,transaction,context){var prevChildren=this._renderedChildren;var nextChildren=ReactChildReconciler.updateChildren(prevChildren,nextNestedChildren,transaction,context);this._renderedChildren=nextChildren;if(!nextChildren&&!prevChildren){return;}var name;var lastIndex=0;var nextIndex=0;for(name in nextChildren){if(!nextChildren.hasOwnProperty(name)){continue;}var prevChild=prevChildren&&prevChildren[name];var nextChild=nextChildren[name];if(prevChild===nextChild){this.moveChild(prevChild,nextIndex,lastIndex);lastIndex=Math.max(prevChild._mountIndex,lastIndex);prevChild._mountIndex=nextIndex;}else{if(prevChild){lastIndex=Math.max(prevChild._mountIndex,lastIndex);this._unmountChildByName(prevChild,name);}this._mountChildByNameAtIndex(nextChild,name,nextIndex,transaction,context);}nextIndex++;}for(name in prevChildren){if(prevChildren.hasOwnProperty(name)&&!(nextChildren&&nextChildren.hasOwnProperty(name))){this._unmountChildByName(prevChildren[name],name);}}},unmountChildren:function unmountChildren(){var renderedChildren=this._renderedChildren;ReactChildReconciler.unmountChildren(renderedChildren);this._renderedChildren=null;},moveChild:function moveChild(child,toIndex,lastIndex){if(child._mountIndex<lastIndex){enqueueMove(this._rootNodeID,child._mountIndex,toIndex);}},createChild:function createChild(child,mountImage){enqueueMarkup(this._rootNodeID,mountImage,child._mountIndex);},removeChild:function removeChild(child){enqueueRemove(this._rootNodeID,child._mountIndex);},setTextContent:function setTextContent(textContent){enqueueTextContent(this._rootNodeID,textContent);},_mountChildByNameAtIndex:function _mountChildByNameAtIndex(child,name,index,transaction,context){var rootID=this._rootNodeID+name;var mountImage=ReactReconciler.mountComponent(child,rootID,transaction,context);child._mountIndex=index;this.createChild(child,mountImage);},_unmountChildByName:function _unmountChildByName(child,name){this.removeChild(child);child._mountIndex=null;}}};module.exports=ReactMultiChild;},{"31":31,"36":36,"72":72,"81":81}],72:[function(_dereq_,module,exports){'use strict';var keyMirror=_dereq_(140);var ReactMultiChildUpdateTypes=keyMirror({INSERT_MARKUP:null,MOVE_EXISTING:null,REMOVE_NODE:null,TEXT_CONTENT:null});module.exports=ReactMultiChildUpdateTypes;},{"140":140}],73:[function(_dereq_,module,exports){'use strict';var assign=_dereq_(27);var invariant=_dereq_(135);var autoGenerateWrapperClass=null;var genericComponentClass=null;var tagToComponentClass={};var textComponentClass=null;var ReactNativeComponentInjection={injectGenericComponentClass:function injectGenericComponentClass(componentClass){genericComponentClass=componentClass;},injectTextComponentClass:function injectTextComponentClass(componentClass){textComponentClass=componentClass;},injectComponentClasses:function injectComponentClasses(componentClasses){assign(tagToComponentClass,componentClasses);},injectAutoWrapper:function injectAutoWrapper(wrapperFactory){autoGenerateWrapperClass=wrapperFactory;}};function getComponentClassForElement(element){if(typeof element.type==='function'){return element.type;}var tag=element.type;var componentClass=tagToComponentClass[tag];if(componentClass==null){tagToComponentClass[tag]=componentClass=autoGenerateWrapperClass(tag);}return componentClass;}function createInternalComponent(element){"production"!=="development"?invariant(genericComponentClass,'There is no registered component for the tag %s',element.type):invariant(genericComponentClass);return new genericComponentClass(element.type,element.props);}function createInstanceForText(text){return new textComponentClass(text);}function isTextComponent(component){return component instanceof textComponentClass;}var ReactNativeComponent={getComponentClassForElement:getComponentClassForElement,createInternalComponent:createInternalComponent,createInstanceForText:createInstanceForText,isTextComponent:isTextComponent,injection:ReactNativeComponentInjection};module.exports=ReactNativeComponent;},{"135":135,"27":27}],74:[function(_dereq_,module,exports){'use strict';var invariant=_dereq_(135);var ReactOwner={isValidOwner:function isValidOwner(object){return!!(object&&typeof object.attachRef==='function'&&typeof object.detachRef==='function');},addComponentAsRefTo:function addComponentAsRefTo(component,ref,owner){"production"!=="development"?invariant(ReactOwner.isValidOwner(owner),'addComponentAsRefTo(...): Only a ReactOwner can have refs. This '+'usually means that you\'re trying to add a ref to a component that '+'doesn\'t have an owner (that is, was not created inside of another '+'component\'s `render` method). Try rendering this component inside of '+'a new top-level component which will hold the ref.'):invariant(ReactOwner.isValidOwner(owner));owner.attachRef(ref,component);},removeComponentAsRefFrom:function removeComponentAsRefFrom(component,ref,owner){"production"!=="development"?invariant(ReactOwner.isValidOwner(owner),'removeComponentAsRefFrom(...): Only a ReactOwner can have refs. This '+'usually means that you\'re trying to remove a ref to a component that '+'doesn\'t have an owner (that is, was not created inside of another '+'component\'s `render` method). Try rendering this component inside of '+'a new top-level component which will hold the ref.'):invariant(ReactOwner.isValidOwner(owner));if(owner.getPublicInstance().refs[ref]===component.getPublicInstance()){owner.detachRef(ref);}}};module.exports=ReactOwner;},{"135":135}],75:[function(_dereq_,module,exports){'use strict';var ReactPerf={enableMeasure:false,storedMeasure:_noMeasure,measureMethods:function measureMethods(object,objectName,methodNames){if("production"!=="development"){for(var key in methodNames){if(!methodNames.hasOwnProperty(key)){continue;}object[key]=ReactPerf.measure(objectName,methodNames[key],object[key]);}}},measure:function measure(objName,fnName,func){if("production"!=="development"){var measuredFunc=null;var wrapper=function wrapper(){if(ReactPerf.enableMeasure){if(!measuredFunc){measuredFunc=ReactPerf.storedMeasure(objName,fnName,func);}return measuredFunc.apply(this,arguments);}return func.apply(this,arguments);};wrapper.displayName=objName+'_'+fnName;return wrapper;}return func;},injection:{injectMeasure:function injectMeasure(measure){ReactPerf.storedMeasure=measure;}}};function _noMeasure(objName,fnName,func){return func;}module.exports=ReactPerf;},{}],76:[function(_dereq_,module,exports){'use strict';var ReactPropTypeLocationNames={};if("production"!=="development"){ReactPropTypeLocationNames={prop:'prop',context:'context',childContext:'child context'};}module.exports=ReactPropTypeLocationNames;},{}],77:[function(_dereq_,module,exports){'use strict';var keyMirror=_dereq_(140);var ReactPropTypeLocations=keyMirror({prop:null,context:null,childContext:null});module.exports=ReactPropTypeLocations;},{"140":140}],78:[function(_dereq_,module,exports){'use strict';var ReactElement=_dereq_(57);var ReactFragment=_dereq_(63);var ReactPropTypeLocationNames=_dereq_(76);var emptyFunction=_dereq_(114);var ANONYMOUS='<<anonymous>>';var elementTypeChecker=createElementTypeChecker();var nodeTypeChecker=createNodeChecker();var ReactPropTypes={array:createPrimitiveTypeChecker('array'),bool:createPrimitiveTypeChecker('boolean'),func:createPrimitiveTypeChecker('function'),number:createPrimitiveTypeChecker('number'),object:createPrimitiveTypeChecker('object'),string:createPrimitiveTypeChecker('string'),any:createAnyTypeChecker(),arrayOf:createArrayOfTypeChecker,element:elementTypeChecker,instanceOf:createInstanceTypeChecker,node:nodeTypeChecker,objectOf:createObjectOfTypeChecker,oneOf:createEnumTypeChecker,oneOfType:createUnionTypeChecker,shape:createShapeTypeChecker};function createChainableTypeChecker(validate){function checkType(isRequired,props,propName,componentName,location){componentName=componentName||ANONYMOUS;if(props[propName]==null){var locationName=ReactPropTypeLocationNames[location];if(isRequired){return new Error("Required "+locationName+" `"+propName+"` was not specified in "+("`"+componentName+"`."));}return null;}else{return validate(props,propName,componentName,location);}}var chainedCheckType=checkType.bind(null,false);chainedCheckType.isRequired=checkType.bind(null,true);return chainedCheckType;}function createPrimitiveTypeChecker(expectedType){function validate(props,propName,componentName,location){var propValue=props[propName];var propType=getPropType(propValue);if(propType!==expectedType){var locationName=ReactPropTypeLocationNames[location];var preciseType=getPreciseType(propValue);return new Error("Invalid "+locationName+" `"+propName+"` of type `"+preciseType+"` "+("supplied to `"+componentName+"`, expected `"+expectedType+"`."));}return null;}return createChainableTypeChecker(validate);}function createAnyTypeChecker(){return createChainableTypeChecker(emptyFunction.thatReturns(null));}function createArrayOfTypeChecker(typeChecker){function validate(props,propName,componentName,location){var propValue=props[propName];if(!Array.isArray(propValue)){var locationName=ReactPropTypeLocationNames[location];var propType=getPropType(propValue);return new Error("Invalid "+locationName+" `"+propName+"` of type "+("`"+propType+"` supplied to `"+componentName+"`, expected an array."));}for(var i=0;i<propValue.length;i++){var error=typeChecker(propValue,i,componentName,location);if(error instanceof Error){return error;}}return null;}return createChainableTypeChecker(validate);}function createElementTypeChecker(){function validate(props,propName,componentName,location){if(!ReactElement.isValidElement(props[propName])){var locationName=ReactPropTypeLocationNames[location];return new Error("Invalid "+locationName+" `"+propName+"` supplied to "+("`"+componentName+"`, expected a ReactElement."));}return null;}return createChainableTypeChecker(validate);}function createInstanceTypeChecker(expectedClass){function validate(props,propName,componentName,location){if(!(props[propName]instanceof expectedClass)){var locationName=ReactPropTypeLocationNames[location];var expectedClassName=expectedClass.name||ANONYMOUS;return new Error("Invalid "+locationName+" `"+propName+"` supplied to "+("`"+componentName+"`, expected instance of `"+expectedClassName+"`."));}return null;}return createChainableTypeChecker(validate);}function createEnumTypeChecker(expectedValues){function validate(props,propName,componentName,location){var propValue=props[propName];for(var i=0;i<expectedValues.length;i++){if(propValue===expectedValues[i]){return null;}}var locationName=ReactPropTypeLocationNames[location];var valuesString=JSON.stringify(expectedValues);return new Error("Invalid "+locationName+" `"+propName+"` of value `"+propValue+"` "+("supplied to `"+componentName+"`, expected one of "+valuesString+"."));}return createChainableTypeChecker(validate);}function createObjectOfTypeChecker(typeChecker){function validate(props,propName,componentName,location){var propValue=props[propName];var propType=getPropType(propValue);if(propType!=='object'){var locationName=ReactPropTypeLocationNames[location];return new Error("Invalid "+locationName+" `"+propName+"` of type "+("`"+propType+"` supplied to `"+componentName+"`, expected an object."));}for(var key in propValue){if(propValue.hasOwnProperty(key)){var error=typeChecker(propValue,key,componentName,location);if(error instanceof Error){return error;}}}return null;}return createChainableTypeChecker(validate);}function createUnionTypeChecker(arrayOfTypeCheckers){function validate(props,propName,componentName,location){for(var i=0;i<arrayOfTypeCheckers.length;i++){var checker=arrayOfTypeCheckers[i];if(checker(props,propName,componentName,location)==null){return null;}}var locationName=ReactPropTypeLocationNames[location];return new Error("Invalid "+locationName+" `"+propName+"` supplied to "+("`"+componentName+"`."));}return createChainableTypeChecker(validate);}function createNodeChecker(){function validate(props,propName,componentName,location){if(!isNode(props[propName])){var locationName=ReactPropTypeLocationNames[location];return new Error("Invalid "+locationName+" `"+propName+"` supplied to "+("`"+componentName+"`, expected a ReactNode."));}return null;}return createChainableTypeChecker(validate);}function createShapeTypeChecker(shapeTypes){function validate(props,propName,componentName,location){var propValue=props[propName];var propType=getPropType(propValue);if(propType!=='object'){var locationName=ReactPropTypeLocationNames[location];return new Error("Invalid "+locationName+" `"+propName+"` of type `"+propType+"` "+("supplied to `"+componentName+"`, expected `object`."));}for(var key in shapeTypes){var checker=shapeTypes[key];if(!checker){continue;}var error=checker(propValue,key,componentName,location);if(error){return error;}}return null;}return createChainableTypeChecker(validate);}function isNode(propValue){switch(typeof propValue==="undefined"?"undefined":_typeof(propValue)){case'number':case'string':case'undefined':return true;case'boolean':return!propValue;case'object':if(Array.isArray(propValue)){return propValue.every(isNode);}if(propValue===null||ReactElement.isValidElement(propValue)){return true;}propValue=ReactFragment.extractIfFragment(propValue);for(var k in propValue){if(!isNode(propValue[k])){return false;}}return true;default:return false;}}function getPropType(propValue){var propType=typeof propValue==="undefined"?"undefined":_typeof(propValue);if(Array.isArray(propValue)){return'array';}if(propValue instanceof RegExp){return'object';}return propType;}function getPreciseType(propValue){var propType=getPropType(propValue);if(propType==='object'){if(propValue instanceof Date){return'date';}else if(propValue instanceof RegExp){return'regexp';}}return propType;}module.exports=ReactPropTypes;},{"114":114,"57":57,"63":63,"76":76}],79:[function(_dereq_,module,exports){'use strict';var PooledClass=_dereq_(28);var ReactBrowserEventEmitter=_dereq_(30);var assign=_dereq_(27);function ReactPutListenerQueue(){this.listenersToPut=[];}assign(ReactPutListenerQueue.prototype,{enqueuePutListener:function enqueuePutListener(rootNodeID,propKey,propValue){this.listenersToPut.push({rootNodeID:rootNodeID,propKey:propKey,propValue:propValue});},putListeners:function putListeners(){for(var i=0;i<this.listenersToPut.length;i++){var listenerToPut=this.listenersToPut[i];ReactBrowserEventEmitter.putListener(listenerToPut.rootNodeID,listenerToPut.propKey,listenerToPut.propValue);}},reset:function reset(){this.listenersToPut.length=0;},destructor:function destructor(){this.reset();}});PooledClass.addPoolingTo(ReactPutListenerQueue);module.exports=ReactPutListenerQueue;},{"27":27,"28":28,"30":30}],80:[function(_dereq_,module,exports){'use strict';var CallbackQueue=_dereq_(6);var PooledClass=_dereq_(28);var ReactBrowserEventEmitter=_dereq_(30);var ReactInputSelection=_dereq_(65);var ReactPutListenerQueue=_dereq_(79);var Transaction=_dereq_(103);var assign=_dereq_(27);var SELECTION_RESTORATION={initialize:ReactInputSelection.getSelectionInformation,close:ReactInputSelection.restoreSelection};var EVENT_SUPPRESSION={initialize:function initialize(){var currentlyEnabled=ReactBrowserEventEmitter.isEnabled();ReactBrowserEventEmitter.setEnabled(false);return currentlyEnabled;},close:function close(previouslyEnabled){ReactBrowserEventEmitter.setEnabled(previouslyEnabled);}};var ON_DOM_READY_QUEUEING={initialize:function initialize(){this.reactMountReady.reset();},close:function close(){this.reactMountReady.notifyAll();}};var PUT_LISTENER_QUEUEING={initialize:function initialize(){this.putListenerQueue.reset();},close:function close(){this.putListenerQueue.putListeners();}};var TRANSACTION_WRAPPERS=[PUT_LISTENER_QUEUEING,SELECTION_RESTORATION,EVENT_SUPPRESSION,ON_DOM_READY_QUEUEING];function ReactReconcileTransaction(){this.reinitializeTransaction();this.renderToStaticMarkup=false;this.reactMountReady=CallbackQueue.getPooled(null);this.putListenerQueue=ReactPutListenerQueue.getPooled();}var Mixin={getTransactionWrappers:function getTransactionWrappers(){return TRANSACTION_WRAPPERS;},getReactMountReady:function getReactMountReady(){return this.reactMountReady;},getPutListenerQueue:function getPutListenerQueue(){return this.putListenerQueue;},destructor:function destructor(){CallbackQueue.release(this.reactMountReady);this.reactMountReady=null;ReactPutListenerQueue.release(this.putListenerQueue);this.putListenerQueue=null;}};assign(ReactReconcileTransaction.prototype,Transaction.Mixin,Mixin);PooledClass.addPoolingTo(ReactReconcileTransaction);module.exports=ReactReconcileTransaction;},{"103":103,"27":27,"28":28,"30":30,"6":6,"65":65,"79":79}],81:[function(_dereq_,module,exports){'use strict';var ReactRef=_dereq_(82);var ReactElementValidator=_dereq_(58);function attachRefs(){ReactRef.attachRefs(this,this._currentElement);}var ReactReconciler={mountComponent:function mountComponent(internalInstance,rootID,transaction,context){var markup=internalInstance.mountComponent(rootID,transaction,context);if("production"!=="development"){ReactElementValidator.checkAndWarnForMutatedProps(internalInstance._currentElement);}transaction.getReactMountReady().enqueue(attachRefs,internalInstance);return markup;},unmountComponent:function unmountComponent(internalInstance){ReactRef.detachRefs(internalInstance,internalInstance._currentElement);internalInstance.unmountComponent();},receiveComponent:function receiveComponent(internalInstance,nextElement,transaction,context){var prevElement=internalInstance._currentElement;if(nextElement===prevElement&&nextElement._owner!=null){return;}if("production"!=="development"){ReactElementValidator.checkAndWarnForMutatedProps(nextElement);}var refsChanged=ReactRef.shouldUpdateRefs(prevElement,nextElement);if(refsChanged){ReactRef.detachRefs(internalInstance,prevElement);}internalInstance.receiveComponent(nextElement,transaction,context);if(refsChanged){transaction.getReactMountReady().enqueue(attachRefs,internalInstance);}},performUpdateIfNecessary:function performUpdateIfNecessary(internalInstance,transaction){internalInstance.performUpdateIfNecessary(transaction);}};module.exports=ReactReconciler;},{"58":58,"82":82}],82:[function(_dereq_,module,exports){'use strict';var ReactOwner=_dereq_(74);var ReactRef={};function attachRef(ref,component,owner){if(typeof ref==='function'){ref(component.getPublicInstance());}else{ReactOwner.addComponentAsRefTo(component,ref,owner);}}function detachRef(ref,component,owner){if(typeof ref==='function'){ref(null);}else{ReactOwner.removeComponentAsRefFrom(component,ref,owner);}}ReactRef.attachRefs=function(instance,element){var ref=element.ref;if(ref!=null){attachRef(ref,instance,element._owner);}};ReactRef.shouldUpdateRefs=function(prevElement,nextElement){return nextElement._owner!==prevElement._owner||nextElement.ref!==prevElement.ref;};ReactRef.detachRefs=function(instance,element){var ref=element.ref;if(ref!=null){detachRef(ref,instance,element._owner);}};module.exports=ReactRef;},{"74":74}],83:[function(_dereq_,module,exports){'use strict';var ReactRootIndexInjection={injectCreateReactRootIndex:function injectCreateReactRootIndex(_createReactRootIndex){ReactRootIndex.createReactRootIndex=_createReactRootIndex;}};var ReactRootIndex={createReactRootIndex:null,injection:ReactRootIndexInjection};module.exports=ReactRootIndex;},{}],84:[function(_dereq_,module,exports){'use strict';var ReactElement=_dereq_(57);var ReactInstanceHandles=_dereq_(66);var ReactMarkupChecksum=_dereq_(69);var ReactServerRenderingTransaction=_dereq_(85);var emptyObject=_dereq_(115);var instantiateReactComponent=_dereq_(134);var invariant=_dereq_(135);function renderToString(element){"production"!=="development"?invariant(ReactElement.isValidElement(element),'renderToString(): You must pass a valid ReactElement.'):invariant(ReactElement.isValidElement(element));var transaction;try{var id=ReactInstanceHandles.createReactRootID();transaction=ReactServerRenderingTransaction.getPooled(false);return transaction.perform(function(){var componentInstance=instantiateReactComponent(element,null);var markup=componentInstance.mountComponent(id,transaction,emptyObject);return ReactMarkupChecksum.addChecksumToMarkup(markup);},null);}finally{ReactServerRenderingTransaction.release(transaction);}}function renderToStaticMarkup(element){"production"!=="development"?invariant(ReactElement.isValidElement(element),'renderToStaticMarkup(): You must pass a valid ReactElement.'):invariant(ReactElement.isValidElement(element));var transaction;try{var id=ReactInstanceHandles.createReactRootID();transaction=ReactServerRenderingTransaction.getPooled(true);return transaction.perform(function(){var componentInstance=instantiateReactComponent(element,null);return componentInstance.mountComponent(id,transaction,emptyObject);},null);}finally{ReactServerRenderingTransaction.release(transaction);}}module.exports={renderToString:renderToString,renderToStaticMarkup:renderToStaticMarkup};},{"115":115,"134":134,"135":135,"57":57,"66":66,"69":69,"85":85}],85:[function(_dereq_,module,exports){'use strict';var PooledClass=_dereq_(28);var CallbackQueue=_dereq_(6);var ReactPutListenerQueue=_dereq_(79);var Transaction=_dereq_(103);var assign=_dereq_(27);var emptyFunction=_dereq_(114);var ON_DOM_READY_QUEUEING={initialize:function initialize(){this.reactMountReady.reset();},close:emptyFunction};var PUT_LISTENER_QUEUEING={initialize:function initialize(){this.putListenerQueue.reset();},close:emptyFunction};var TRANSACTION_WRAPPERS=[PUT_LISTENER_QUEUEING,ON_DOM_READY_QUEUEING];function ReactServerRenderingTransaction(renderToStaticMarkup){this.reinitializeTransaction();this.renderToStaticMarkup=renderToStaticMarkup;this.reactMountReady=CallbackQueue.getPooled(null);this.putListenerQueue=ReactPutListenerQueue.getPooled();}var Mixin={getTransactionWrappers:function getTransactionWrappers(){return TRANSACTION_WRAPPERS;},getReactMountReady:function getReactMountReady(){return this.reactMountReady;},getPutListenerQueue:function getPutListenerQueue(){return this.putListenerQueue;},destructor:function destructor(){CallbackQueue.release(this.reactMountReady);this.reactMountReady=null;ReactPutListenerQueue.release(this.putListenerQueue);this.putListenerQueue=null;}};assign(ReactServerRenderingTransaction.prototype,Transaction.Mixin,Mixin);PooledClass.addPoolingTo(ReactServerRenderingTransaction);module.exports=ReactServerRenderingTransaction;},{"103":103,"114":114,"27":27,"28":28,"6":6,"79":79}],86:[function(_dereq_,module,exports){'use strict';var ReactLifeCycle=_dereq_(68);var ReactCurrentOwner=_dereq_(39);var ReactElement=_dereq_(57);var ReactInstanceMap=_dereq_(67);var ReactUpdates=_dereq_(87);var assign=_dereq_(27);var invariant=_dereq_(135);var warning=_dereq_(154);function enqueueUpdate(internalInstance){if(internalInstance!==ReactLifeCycle.currentlyMountingInstance){ReactUpdates.enqueueUpdate(internalInstance);}}function getInternalInstanceReadyForUpdate(publicInstance,callerName){"production"!=="development"?invariant(ReactCurrentOwner.current==null,'%s(...): Cannot update during an existing state transition '+'(such as within `render`). Render methods should be a pure function '+'of props and state.',callerName):invariant(ReactCurrentOwner.current==null);var internalInstance=ReactInstanceMap.get(publicInstance);if(!internalInstance){if("production"!=="development"){"production"!=="development"?warning(!callerName,'%s(...): Can only update a mounted or mounting component. '+'This usually means you called %s() on an unmounted '+'component. This is a no-op.',callerName,callerName):null;}return null;}if(internalInstance===ReactLifeCycle.currentlyUnmountingInstance){return null;}return internalInstance;}var ReactUpdateQueue={enqueueCallback:function enqueueCallback(publicInstance,callback){"production"!=="development"?invariant(typeof callback==='function','enqueueCallback(...): You called `setProps`, `replaceProps`, '+'`setState`, `replaceState`, or `forceUpdate` with a callback that '+'isn\'t callable.'):invariant(typeof callback==='function');var internalInstance=getInternalInstanceReadyForUpdate(publicInstance);if(!internalInstance||internalInstance===ReactLifeCycle.currentlyMountingInstance){return null;}if(internalInstance._pendingCallbacks){internalInstance._pendingCallbacks.push(callback);}else{internalInstance._pendingCallbacks=[callback];}enqueueUpdate(internalInstance);},enqueueCallbackInternal:function enqueueCallbackInternal(internalInstance,callback){"production"!=="development"?invariant(typeof callback==='function','enqueueCallback(...): You called `setProps`, `replaceProps`, '+'`setState`, `replaceState`, or `forceUpdate` with a callback that '+'isn\'t callable.'):invariant(typeof callback==='function');if(internalInstance._pendingCallbacks){internalInstance._pendingCallbacks.push(callback);}else{internalInstance._pendingCallbacks=[callback];}enqueueUpdate(internalInstance);},enqueueForceUpdate:function enqueueForceUpdate(publicInstance){var internalInstance=getInternalInstanceReadyForUpdate(publicInstance,'forceUpdate');if(!internalInstance){return;}internalInstance._pendingForceUpdate=true;enqueueUpdate(internalInstance);},enqueueReplaceState:function enqueueReplaceState(publicInstance,completeState){var internalInstance=getInternalInstanceReadyForUpdate(publicInstance,'replaceState');if(!internalInstance){return;}internalInstance._pendingStateQueue=[completeState];internalInstance._pendingReplaceState=true;enqueueUpdate(internalInstance);},enqueueSetState:function enqueueSetState(publicInstance,partialState){var internalInstance=getInternalInstanceReadyForUpdate(publicInstance,'setState');if(!internalInstance){return;}var queue=internalInstance._pendingStateQueue||(internalInstance._pendingStateQueue=[]);queue.push(partialState);enqueueUpdate(internalInstance);},enqueueSetProps:function enqueueSetProps(publicInstance,partialProps){var internalInstance=getInternalInstanceReadyForUpdate(publicInstance,'setProps');if(!internalInstance){return;}"production"!=="development"?invariant(internalInstance._isTopLevel,'setProps(...): You called `setProps` on a '+'component with a parent. This is an anti-pattern since props will '+'get reactively updated when rendered. Instead, change the owner\'s '+'`render` method to pass the correct value as props to the component '+'where it is created.'):invariant(internalInstance._isTopLevel);var element=internalInstance._pendingElement||internalInstance._currentElement;var props=assign({},element.props,partialProps);internalInstance._pendingElement=ReactElement.cloneAndReplaceProps(element,props);enqueueUpdate(internalInstance);},enqueueReplaceProps:function enqueueReplaceProps(publicInstance,props){var internalInstance=getInternalInstanceReadyForUpdate(publicInstance,'replaceProps');if(!internalInstance){return;}"production"!=="development"?invariant(internalInstance._isTopLevel,'replaceProps(...): You called `replaceProps` on a '+'component with a parent. This is an anti-pattern since props will '+'get reactively updated when rendered. Instead, change the owner\'s '+'`render` method to pass the correct value as props to the component '+'where it is created.'):invariant(internalInstance._isTopLevel);var element=internalInstance._pendingElement||internalInstance._currentElement;internalInstance._pendingElement=ReactElement.cloneAndReplaceProps(element,props);enqueueUpdate(internalInstance);},enqueueElementInternal:function enqueueElementInternal(internalInstance,newElement){internalInstance._pendingElement=newElement;enqueueUpdate(internalInstance);}};module.exports=ReactUpdateQueue;},{"135":135,"154":154,"27":27,"39":39,"57":57,"67":67,"68":68,"87":87}],87:[function(_dereq_,module,exports){'use strict';var CallbackQueue=_dereq_(6);var PooledClass=_dereq_(28);var ReactCurrentOwner=_dereq_(39);var ReactPerf=_dereq_(75);var ReactReconciler=_dereq_(81);var Transaction=_dereq_(103);var assign=_dereq_(27);var invariant=_dereq_(135);var warning=_dereq_(154);var dirtyComponents=[];var asapCallbackQueue=CallbackQueue.getPooled();var asapEnqueued=false;var batchingStrategy=null;function ensureInjected(){"production"!=="development"?invariant(ReactUpdates.ReactReconcileTransaction&&batchingStrategy,'ReactUpdates: must inject a reconcile transaction class and batching '+'strategy'):invariant(ReactUpdates.ReactReconcileTransaction&&batchingStrategy);}var NESTED_UPDATES={initialize:function initialize(){this.dirtyComponentsLength=dirtyComponents.length;},close:function close(){if(this.dirtyComponentsLength!==dirtyComponents.length){dirtyComponents.splice(0,this.dirtyComponentsLength);flushBatchedUpdates();}else{dirtyComponents.length=0;}}};var UPDATE_QUEUEING={initialize:function initialize(){this.callbackQueue.reset();},close:function close(){this.callbackQueue.notifyAll();}};var TRANSACTION_WRAPPERS=[NESTED_UPDATES,UPDATE_QUEUEING];function ReactUpdatesFlushTransaction(){this.reinitializeTransaction();this.dirtyComponentsLength=null;this.callbackQueue=CallbackQueue.getPooled();this.reconcileTransaction=ReactUpdates.ReactReconcileTransaction.getPooled();}assign(ReactUpdatesFlushTransaction.prototype,Transaction.Mixin,{getTransactionWrappers:function getTransactionWrappers(){return TRANSACTION_WRAPPERS;},destructor:function destructor(){this.dirtyComponentsLength=null;CallbackQueue.release(this.callbackQueue);this.callbackQueue=null;ReactUpdates.ReactReconcileTransaction.release(this.reconcileTransaction);this.reconcileTransaction=null;},perform:function perform(method,scope,a){return Transaction.Mixin.perform.call(this,this.reconcileTransaction.perform,this.reconcileTransaction,method,scope,a);}});PooledClass.addPoolingTo(ReactUpdatesFlushTransaction);function batchedUpdates(callback,a,b,c,d){ensureInjected();batchingStrategy.batchedUpdates(callback,a,b,c,d);}function mountOrderComparator(c1,c2){return c1._mountOrder-c2._mountOrder;}function runBatchedUpdates(transaction){var len=transaction.dirtyComponentsLength;"production"!=="development"?invariant(len===dirtyComponents.length,'Expected flush transaction\'s stored dirty-components length (%s) to '+'match dirty-components array length (%s).',len,dirtyComponents.length):invariant(len===dirtyComponents.length);dirtyComponents.sort(mountOrderComparator);for(var i=0;i<len;i++){var component=dirtyComponents[i];var callbacks=component._pendingCallbacks;component._pendingCallbacks=null;ReactReconciler.performUpdateIfNecessary(component,transaction.reconcileTransaction);if(callbacks){for(var j=0;j<callbacks.length;j++){transaction.callbackQueue.enqueue(callbacks[j],component.getPublicInstance());}}}}var flushBatchedUpdates=function flushBatchedUpdates(){while(dirtyComponents.length||asapEnqueued){if(dirtyComponents.length){var transaction=ReactUpdatesFlushTransaction.getPooled();transaction.perform(runBatchedUpdates,null,transaction);ReactUpdatesFlushTransaction.release(transaction);}if(asapEnqueued){asapEnqueued=false;var queue=asapCallbackQueue;asapCallbackQueue=CallbackQueue.getPooled();queue.notifyAll();CallbackQueue.release(queue);}}};flushBatchedUpdates=ReactPerf.measure('ReactUpdates','flushBatchedUpdates',flushBatchedUpdates);function enqueueUpdate(component){ensureInjected();"production"!=="development"?warning(ReactCurrentOwner.current==null,'enqueueUpdate(): Render methods should be a pure function of props '+'and state; triggering nested component updates from render is not '+'allowed. If necessary, trigger nested updates in '+'componentDidUpdate.'):null;if(!batchingStrategy.isBatchingUpdates){batchingStrategy.batchedUpdates(enqueueUpdate,component);return;}dirtyComponents.push(component);}function asap(callback,context){"production"!=="development"?invariant(batchingStrategy.isBatchingUpdates,'ReactUpdates.asap: Can\'t enqueue an asap callback in a context where'+'updates are not being batched.'):invariant(batchingStrategy.isBatchingUpdates);asapCallbackQueue.enqueue(callback,context);asapEnqueued=true;}var ReactUpdatesInjection={injectReconcileTransaction:function injectReconcileTransaction(ReconcileTransaction){"production"!=="development"?invariant(ReconcileTransaction,'ReactUpdates: must provide a reconcile transaction class'):invariant(ReconcileTransaction);ReactUpdates.ReactReconcileTransaction=ReconcileTransaction;},injectBatchingStrategy:function injectBatchingStrategy(_batchingStrategy){"production"!=="development"?invariant(_batchingStrategy,'ReactUpdates: must provide a batching strategy'):invariant(_batchingStrategy);"production"!=="development"?invariant(typeof _batchingStrategy.batchedUpdates==='function','ReactUpdates: must provide a batchedUpdates() function'):invariant(typeof _batchingStrategy.batchedUpdates==='function');"production"!=="development"?invariant(typeof _batchingStrategy.isBatchingUpdates==='boolean','ReactUpdates: must provide an isBatchingUpdates boolean attribute'):invariant(typeof _batchingStrategy.isBatchingUpdates==='boolean');batchingStrategy=_batchingStrategy;}};var ReactUpdates={ReactReconcileTransaction:null,batchedUpdates:batchedUpdates,enqueueUpdate:enqueueUpdate,flushBatchedUpdates:flushBatchedUpdates,injection:ReactUpdatesInjection,asap:asap};module.exports=ReactUpdates;},{"103":103,"135":135,"154":154,"27":27,"28":28,"39":39,"6":6,"75":75,"81":81}],88:[function(_dereq_,module,exports){'use strict';var DOMProperty=_dereq_(10);var MUST_USE_ATTRIBUTE=DOMProperty.injection.MUST_USE_ATTRIBUTE;var SVGDOMPropertyConfig={Properties:{clipPath:MUST_USE_ATTRIBUTE,cx:MUST_USE_ATTRIBUTE,cy:MUST_USE_ATTRIBUTE,d:MUST_USE_ATTRIBUTE,dx:MUST_USE_ATTRIBUTE,dy:MUST_USE_ATTRIBUTE,fill:MUST_USE_ATTRIBUTE,fillOpacity:MUST_USE_ATTRIBUTE,fontFamily:MUST_USE_ATTRIBUTE,fontSize:MUST_USE_ATTRIBUTE,fx:MUST_USE_ATTRIBUTE,fy:MUST_USE_ATTRIBUTE,gradientTransform:MUST_USE_ATTRIBUTE,gradientUnits:MUST_USE_ATTRIBUTE,markerEnd:MUST_USE_ATTRIBUTE,markerMid:MUST_USE_ATTRIBUTE,markerStart:MUST_USE_ATTRIBUTE,offset:MUST_USE_ATTRIBUTE,opacity:MUST_USE_ATTRIBUTE,patternContentUnits:MUST_USE_ATTRIBUTE,patternUnits:MUST_USE_ATTRIBUTE,points:MUST_USE_ATTRIBUTE,preserveAspectRatio:MUST_USE_ATTRIBUTE,r:MUST_USE_ATTRIBUTE,rx:MUST_USE_ATTRIBUTE,ry:MUST_USE_ATTRIBUTE,spreadMethod:MUST_USE_ATTRIBUTE,stopColor:MUST_USE_ATTRIBUTE,stopOpacity:MUST_USE_ATTRIBUTE,stroke:MUST_USE_ATTRIBUTE,strokeDasharray:MUST_USE_ATTRIBUTE,strokeLinecap:MUST_USE_ATTRIBUTE,strokeOpacity:MUST_USE_ATTRIBUTE,strokeWidth:MUST_USE_ATTRIBUTE,textAnchor:MUST_USE_ATTRIBUTE,transform:MUST_USE_ATTRIBUTE,version:MUST_USE_ATTRIBUTE,viewBox:MUST_USE_ATTRIBUTE,x1:MUST_USE_ATTRIBUTE,x2:MUST_USE_ATTRIBUTE,x:MUST_USE_ATTRIBUTE,y1:MUST_USE_ATTRIBUTE,y2:MUST_USE_ATTRIBUTE,y:MUST_USE_ATTRIBUTE},DOMAttributeNames:{clipPath:'clip-path',fillOpacity:'fill-opacity',fontFamily:'font-family',fontSize:'font-size',gradientTransform:'gradientTransform',gradientUnits:'gradientUnits',markerEnd:'marker-end',markerMid:'marker-mid',markerStart:'marker-start',patternContentUnits:'patternContentUnits',patternUnits:'patternUnits',preserveAspectRatio:'preserveAspectRatio',spreadMethod:'spreadMethod',stopColor:'stop-color',stopOpacity:'stop-opacity',strokeDasharray:'stroke-dasharray',strokeLinecap:'stroke-linecap',strokeOpacity:'stroke-opacity',strokeWidth:'stroke-width',textAnchor:'text-anchor',viewBox:'viewBox'}};module.exports=SVGDOMPropertyConfig;},{"10":10}],89:[function(_dereq_,module,exports){'use strict';var EventConstants=_dereq_(15);var EventPropagators=_dereq_(20);var ReactInputSelection=_dereq_(65);var SyntheticEvent=_dereq_(95);var getActiveElement=_dereq_(121);var isTextInputElement=_dereq_(138);var keyOf=_dereq_(141);var shallowEqual=_dereq_(150);var topLevelTypes=EventConstants.topLevelTypes;var eventTypes={select:{phasedRegistrationNames:{bubbled:keyOf({onSelect:null}),captured:keyOf({onSelectCapture:null})},dependencies:[topLevelTypes.topBlur,topLevelTypes.topContextMenu,topLevelTypes.topFocus,topLevelTypes.topKeyDown,topLevelTypes.topMouseDown,topLevelTypes.topMouseUp,topLevelTypes.topSelectionChange]}};var activeElement=null;var activeElementID=null;var lastSelection=null;var mouseDown=false;function getSelection(node){if('selectionStart'in node&&ReactInputSelection.hasSelectionCapabilities(node)){return{start:node.selectionStart,end:node.selectionEnd};}else if(window.getSelection){var selection=window.getSelection();return{anchorNode:selection.anchorNode,anchorOffset:selection.anchorOffset,focusNode:selection.focusNode,focusOffset:selection.focusOffset};}else if(document.selection){var range=document.selection.createRange();return{parentElement:range.parentElement(),text:range.text,top:range.boundingTop,left:range.boundingLeft};}}function constructSelectEvent(nativeEvent){if(mouseDown||activeElement==null||activeElement!==getActiveElement()){return null;}var currentSelection=getSelection(activeElement);if(!lastSelection||!shallowEqual(lastSelection,currentSelection)){lastSelection=currentSelection;var syntheticEvent=SyntheticEvent.getPooled(eventTypes.select,activeElementID,nativeEvent);syntheticEvent.type='select';syntheticEvent.target=activeElement;EventPropagators.accumulateTwoPhaseDispatches(syntheticEvent);return syntheticEvent;}}var SelectEventPlugin={eventTypes:eventTypes,extractEvents:function extractEvents(topLevelType,topLevelTarget,topLevelTargetID,nativeEvent){switch(topLevelType){case topLevelTypes.topFocus:if(isTextInputElement(topLevelTarget)||topLevelTarget.contentEditable==='true'){activeElement=topLevelTarget;activeElementID=topLevelTargetID;lastSelection=null;}break;case topLevelTypes.topBlur:activeElement=null;activeElementID=null;lastSelection=null;break;case topLevelTypes.topMouseDown:mouseDown=true;break;case topLevelTypes.topContextMenu:case topLevelTypes.topMouseUp:mouseDown=false;return constructSelectEvent(nativeEvent);case topLevelTypes.topSelectionChange:case topLevelTypes.topKeyDown:case topLevelTypes.topKeyUp:return constructSelectEvent(nativeEvent);}}};module.exports=SelectEventPlugin;},{"121":121,"138":138,"141":141,"15":15,"150":150,"20":20,"65":65,"95":95}],90:[function(_dereq_,module,exports){'use strict';var GLOBAL_MOUNT_POINT_MAX=Math.pow(2,53);var ServerReactRootIndex={createReactRootIndex:function createReactRootIndex(){return Math.ceil(Math.random()*GLOBAL_MOUNT_POINT_MAX);}};module.exports=ServerReactRootIndex;},{}],91:[function(_dereq_,module,exports){'use strict';var EventConstants=_dereq_(15);var EventPluginUtils=_dereq_(19);var EventPropagators=_dereq_(20);var SyntheticClipboardEvent=_dereq_(92);var SyntheticEvent=_dereq_(95);var SyntheticFocusEvent=_dereq_(96);var SyntheticKeyboardEvent=_dereq_(98);var SyntheticMouseEvent=_dereq_(99);var SyntheticDragEvent=_dereq_(94);var SyntheticTouchEvent=_dereq_(100);var SyntheticUIEvent=_dereq_(101);var SyntheticWheelEvent=_dereq_(102);var getEventCharCode=_dereq_(122);var invariant=_dereq_(135);var keyOf=_dereq_(141);var warning=_dereq_(154);var topLevelTypes=EventConstants.topLevelTypes;var eventTypes={blur:{phasedRegistrationNames:{bubbled:keyOf({onBlur:true}),captured:keyOf({onBlurCapture:true})}},click:{phasedRegistrationNames:{bubbled:keyOf({onClick:true}),captured:keyOf({onClickCapture:true})}},contextMenu:{phasedRegistrationNames:{bubbled:keyOf({onContextMenu:true}),captured:keyOf({onContextMenuCapture:true})}},copy:{phasedRegistrationNames:{bubbled:keyOf({onCopy:true}),captured:keyOf({onCopyCapture:true})}},cut:{phasedRegistrationNames:{bubbled:keyOf({onCut:true}),captured:keyOf({onCutCapture:true})}},doubleClick:{phasedRegistrationNames:{bubbled:keyOf({onDoubleClick:true}),captured:keyOf({onDoubleClickCapture:true})}},drag:{phasedRegistrationNames:{bubbled:keyOf({onDrag:true}),captured:keyOf({onDragCapture:true})}},dragEnd:{phasedRegistrationNames:{bubbled:keyOf({onDragEnd:true}),captured:keyOf({onDragEndCapture:true})}},dragEnter:{phasedRegistrationNames:{bubbled:keyOf({onDragEnter:true}),captured:keyOf({onDragEnterCapture:true})}},dragExit:{phasedRegistrationNames:{bubbled:keyOf({onDragExit:true}),captured:keyOf({onDragExitCapture:true})}},dragLeave:{phasedRegistrationNames:{bubbled:keyOf({onDragLeave:true}),captured:keyOf({onDragLeaveCapture:true})}},dragOver:{phasedRegistrationNames:{bubbled:keyOf({onDragOver:true}),captured:keyOf({onDragOverCapture:true})}},dragStart:{phasedRegistrationNames:{bubbled:keyOf({onDragStart:true}),captured:keyOf({onDragStartCapture:true})}},drop:{phasedRegistrationNames:{bubbled:keyOf({onDrop:true}),captured:keyOf({onDropCapture:true})}},focus:{phasedRegistrationNames:{bubbled:keyOf({onFocus:true}),captured:keyOf({onFocusCapture:true})}},input:{phasedRegistrationNames:{bubbled:keyOf({onInput:true}),captured:keyOf({onInputCapture:true})}},keyDown:{phasedRegistrationNames:{bubbled:keyOf({onKeyDown:true}),captured:keyOf({onKeyDownCapture:true})}},keyPress:{phasedRegistrationNames:{bubbled:keyOf({onKeyPress:true}),captured:keyOf({onKeyPressCapture:true})}},keyUp:{phasedRegistrationNames:{bubbled:keyOf({onKeyUp:true}),captured:keyOf({onKeyUpCapture:true})}},load:{phasedRegistrationNames:{bubbled:keyOf({onLoad:true}),captured:keyOf({onLoadCapture:true})}},error:{phasedRegistrationNames:{bubbled:keyOf({onError:true}),captured:keyOf({onErrorCapture:true})}},mouseDown:{phasedRegistrationNames:{bubbled:keyOf({onMouseDown:true}),captured:keyOf({onMouseDownCapture:true})}},mouseMove:{phasedRegistrationNames:{bubbled:keyOf({onMouseMove:true}),captured:keyOf({onMouseMoveCapture:true})}},mouseOut:{phasedRegistrationNames:{bubbled:keyOf({onMouseOut:true}),captured:keyOf({onMouseOutCapture:true})}},mouseOver:{phasedRegistrationNames:{bubbled:keyOf({onMouseOver:true}),captured:keyOf({onMouseOverCapture:true})}},mouseUp:{phasedRegistrationNames:{bubbled:keyOf({onMouseUp:true}),captured:keyOf({onMouseUpCapture:true})}},paste:{phasedRegistrationNames:{bubbled:keyOf({onPaste:true}),captured:keyOf({onPasteCapture:true})}},reset:{phasedRegistrationNames:{bubbled:keyOf({onReset:true}),captured:keyOf({onResetCapture:true})}},scroll:{phasedRegistrationNames:{bubbled:keyOf({onScroll:true}),captured:keyOf({onScrollCapture:true})}},submit:{phasedRegistrationNames:{bubbled:keyOf({onSubmit:true}),captured:keyOf({onSubmitCapture:true})}},touchCancel:{phasedRegistrationNames:{bubbled:keyOf({onTouchCancel:true}),captured:keyOf({onTouchCancelCapture:true})}},touchEnd:{phasedRegistrationNames:{bubbled:keyOf({onTouchEnd:true}),captured:keyOf({onTouchEndCapture:true})}},touchMove:{phasedRegistrationNames:{bubbled:keyOf({onTouchMove:true}),captured:keyOf({onTouchMoveCapture:true})}},touchStart:{phasedRegistrationNames:{bubbled:keyOf({onTouchStart:true}),captured:keyOf({onTouchStartCapture:true})}},wheel:{phasedRegistrationNames:{bubbled:keyOf({onWheel:true}),captured:keyOf({onWheelCapture:true})}}};var topLevelEventsToDispatchConfig={topBlur:eventTypes.blur,topClick:eventTypes.click,topContextMenu:eventTypes.contextMenu,topCopy:eventTypes.copy,topCut:eventTypes.cut,topDoubleClick:eventTypes.doubleClick,topDrag:eventTypes.drag,topDragEnd:eventTypes.dragEnd,topDragEnter:eventTypes.dragEnter,topDragExit:eventTypes.dragExit,topDragLeave:eventTypes.dragLeave,topDragOver:eventTypes.dragOver,topDragStart:eventTypes.dragStart,topDrop:eventTypes.drop,topError:eventTypes.error,topFocus:eventTypes.focus,topInput:eventTypes.input,topKeyDown:eventTypes.keyDown,topKeyPress:eventTypes.keyPress,topKeyUp:eventTypes.keyUp,topLoad:eventTypes.load,topMouseDown:eventTypes.mouseDown,topMouseMove:eventTypes.mouseMove,topMouseOut:eventTypes.mouseOut,topMouseOver:eventTypes.mouseOver,topMouseUp:eventTypes.mouseUp,topPaste:eventTypes.paste,topReset:eventTypes.reset,topScroll:eventTypes.scroll,topSubmit:eventTypes.submit,topTouchCancel:eventTypes.touchCancel,topTouchEnd:eventTypes.touchEnd,topTouchMove:eventTypes.touchMove,topTouchStart:eventTypes.touchStart,topWheel:eventTypes.wheel};for(var type in topLevelEventsToDispatchConfig){topLevelEventsToDispatchConfig[type].dependencies=[type];}var SimpleEventPlugin={eventTypes:eventTypes,executeDispatch:function executeDispatch(event,listener,domID){var returnValue=EventPluginUtils.executeDispatch(event,listener,domID);"production"!=="development"?warning(typeof returnValue!=='boolean','Returning `false` from an event handler is deprecated and will be '+'ignored in a future release. Instead, manually call '+'e.stopPropagation() or e.preventDefault(), as appropriate.'):null;if(returnValue===false){event.stopPropagation();event.preventDefault();}},extractEvents:function extractEvents(topLevelType,topLevelTarget,topLevelTargetID,nativeEvent){var dispatchConfig=topLevelEventsToDispatchConfig[topLevelType];if(!dispatchConfig){return null;}var EventConstructor;switch(topLevelType){case topLevelTypes.topInput:case topLevelTypes.topLoad:case topLevelTypes.topError:case topLevelTypes.topReset:case topLevelTypes.topSubmit:EventConstructor=SyntheticEvent;break;case topLevelTypes.topKeyPress:if(getEventCharCode(nativeEvent)===0){return null;}case topLevelTypes.topKeyDown:case topLevelTypes.topKeyUp:EventConstructor=SyntheticKeyboardEvent;break;case topLevelTypes.topBlur:case topLevelTypes.topFocus:EventConstructor=SyntheticFocusEvent;break;case topLevelTypes.topClick:if(nativeEvent.button===2){return null;}case topLevelTypes.topContextMenu:case topLevelTypes.topDoubleClick:case topLevelTypes.topMouseDown:case topLevelTypes.topMouseMove:case topLevelTypes.topMouseOut:case topLevelTypes.topMouseOver:case topLevelTypes.topMouseUp:EventConstructor=SyntheticMouseEvent;break;case topLevelTypes.topDrag:case topLevelTypes.topDragEnd:case topLevelTypes.topDragEnter:case topLevelTypes.topDragExit:case topLevelTypes.topDragLeave:case topLevelTypes.topDragOver:case topLevelTypes.topDragStart:case topLevelTypes.topDrop:EventConstructor=SyntheticDragEvent;break;case topLevelTypes.topTouchCancel:case topLevelTypes.topTouchEnd:case topLevelTypes.topTouchMove:case topLevelTypes.topTouchStart:EventConstructor=SyntheticTouchEvent;break;case topLevelTypes.topScroll:EventConstructor=SyntheticUIEvent;break;case topLevelTypes.topWheel:EventConstructor=SyntheticWheelEvent;break;case topLevelTypes.topCopy:case topLevelTypes.topCut:case topLevelTypes.topPaste:EventConstructor=SyntheticClipboardEvent;break;}"production"!=="development"?invariant(EventConstructor,'SimpleEventPlugin: Unhandled event type, `%s`.',topLevelType):invariant(EventConstructor);var event=EventConstructor.getPooled(dispatchConfig,topLevelTargetID,nativeEvent);EventPropagators.accumulateTwoPhaseDispatches(event);return event;}};module.exports=SimpleEventPlugin;},{"100":100,"101":101,"102":102,"122":122,"135":135,"141":141,"15":15,"154":154,"19":19,"20":20,"92":92,"94":94,"95":95,"96":96,"98":98,"99":99}],92:[function(_dereq_,module,exports){'use strict';var SyntheticEvent=_dereq_(95);var ClipboardEventInterface={clipboardData:function clipboardData(event){return'clipboardData'in event?event.clipboardData:window.clipboardData;}};function SyntheticClipboardEvent(dispatchConfig,dispatchMarker,nativeEvent){SyntheticEvent.call(this,dispatchConfig,dispatchMarker,nativeEvent);}SyntheticEvent.augmentClass(SyntheticClipboardEvent,ClipboardEventInterface);module.exports=SyntheticClipboardEvent;},{"95":95}],93:[function(_dereq_,module,exports){'use strict';var SyntheticEvent=_dereq_(95);var CompositionEventInterface={data:null};function SyntheticCompositionEvent(dispatchConfig,dispatchMarker,nativeEvent){SyntheticEvent.call(this,dispatchConfig,dispatchMarker,nativeEvent);}SyntheticEvent.augmentClass(SyntheticCompositionEvent,CompositionEventInterface);module.exports=SyntheticCompositionEvent;},{"95":95}],94:[function(_dereq_,module,exports){'use strict';var SyntheticMouseEvent=_dereq_(99);var DragEventInterface={dataTransfer:null};function SyntheticDragEvent(dispatchConfig,dispatchMarker,nativeEvent){SyntheticMouseEvent.call(this,dispatchConfig,dispatchMarker,nativeEvent);}SyntheticMouseEvent.augmentClass(SyntheticDragEvent,DragEventInterface);module.exports=SyntheticDragEvent;},{"99":99}],95:[function(_dereq_,module,exports){'use strict';var PooledClass=_dereq_(28);var assign=_dereq_(27);var emptyFunction=_dereq_(114);var getEventTarget=_dereq_(125);var EventInterface={type:null,target:getEventTarget,currentTarget:emptyFunction.thatReturnsNull,eventPhase:null,bubbles:null,cancelable:null,timeStamp:function timeStamp(event){return event.timeStamp||Date.now();},defaultPrevented:null,isTrusted:null};function SyntheticEvent(dispatchConfig,dispatchMarker,nativeEvent){this.dispatchConfig=dispatchConfig;this.dispatchMarker=dispatchMarker;this.nativeEvent=nativeEvent;var Interface=this.constructor.Interface;for(var propName in Interface){if(!Interface.hasOwnProperty(propName)){continue;}var normalize=Interface[propName];if(normalize){this[propName]=normalize(nativeEvent);}else{this[propName]=nativeEvent[propName];}}var defaultPrevented=nativeEvent.defaultPrevented!=null?nativeEvent.defaultPrevented:nativeEvent.returnValue===false;if(defaultPrevented){this.isDefaultPrevented=emptyFunction.thatReturnsTrue;}else{this.isDefaultPrevented=emptyFunction.thatReturnsFalse;}this.isPropagationStopped=emptyFunction.thatReturnsFalse;}assign(SyntheticEvent.prototype,{preventDefault:function preventDefault(){this.defaultPrevented=true;var event=this.nativeEvent;if(event.preventDefault){event.preventDefault();}else{event.returnValue=false;}this.isDefaultPrevented=emptyFunction.thatReturnsTrue;},stopPropagation:function stopPropagation(){var event=this.nativeEvent;if(event.stopPropagation){event.stopPropagation();}else{event.cancelBubble=true;}this.isPropagationStopped=emptyFunction.thatReturnsTrue;},persist:function persist(){this.isPersistent=emptyFunction.thatReturnsTrue;},isPersistent:emptyFunction.thatReturnsFalse,destructor:function destructor(){var Interface=this.constructor.Interface;for(var propName in Interface){this[propName]=null;}this.dispatchConfig=null;this.dispatchMarker=null;this.nativeEvent=null;}});SyntheticEvent.Interface=EventInterface;SyntheticEvent.augmentClass=function(Class,Interface){var Super=this;var prototype=Object.create(Super.prototype);assign(prototype,Class.prototype);Class.prototype=prototype;Class.prototype.constructor=Class;Class.Interface=assign({},Super.Interface,Interface);Class.augmentClass=Super.augmentClass;PooledClass.addPoolingTo(Class,PooledClass.threeArgumentPooler);};PooledClass.addPoolingTo(SyntheticEvent,PooledClass.threeArgumentPooler);module.exports=SyntheticEvent;},{"114":114,"125":125,"27":27,"28":28}],96:[function(_dereq_,module,exports){'use strict';var SyntheticUIEvent=_dereq_(101);var FocusEventInterface={relatedTarget:null};function SyntheticFocusEvent(dispatchConfig,dispatchMarker,nativeEvent){SyntheticUIEvent.call(this,dispatchConfig,dispatchMarker,nativeEvent);}SyntheticUIEvent.augmentClass(SyntheticFocusEvent,FocusEventInterface);module.exports=SyntheticFocusEvent;},{"101":101}],97:[function(_dereq_,module,exports){'use strict';var SyntheticEvent=_dereq_(95);var InputEventInterface={data:null};function SyntheticInputEvent(dispatchConfig,dispatchMarker,nativeEvent){SyntheticEvent.call(this,dispatchConfig,dispatchMarker,nativeEvent);}SyntheticEvent.augmentClass(SyntheticInputEvent,InputEventInterface);module.exports=SyntheticInputEvent;},{"95":95}],98:[function(_dereq_,module,exports){'use strict';var SyntheticUIEvent=_dereq_(101);var getEventCharCode=_dereq_(122);var getEventKey=_dereq_(123);var getEventModifierState=_dereq_(124);var KeyboardEventInterface={key:getEventKey,location:null,ctrlKey:null,shiftKey:null,altKey:null,metaKey:null,repeat:null,locale:null,getModifierState:getEventModifierState,charCode:function charCode(event){if(event.type==='keypress'){return getEventCharCode(event);}return 0;},keyCode:function keyCode(event){if(event.type==='keydown'||event.type==='keyup'){return event.keyCode;}return 0;},which:function which(event){if(event.type==='keypress'){return getEventCharCode(event);}if(event.type==='keydown'||event.type==='keyup'){return event.keyCode;}return 0;}};function SyntheticKeyboardEvent(dispatchConfig,dispatchMarker,nativeEvent){SyntheticUIEvent.call(this,dispatchConfig,dispatchMarker,nativeEvent);}SyntheticUIEvent.augmentClass(SyntheticKeyboardEvent,KeyboardEventInterface);module.exports=SyntheticKeyboardEvent;},{"101":101,"122":122,"123":123,"124":124}],99:[function(_dereq_,module,exports){'use strict';var SyntheticUIEvent=_dereq_(101);var ViewportMetrics=_dereq_(104);var getEventModifierState=_dereq_(124);var MouseEventInterface={screenX:null,screenY:null,clientX:null,clientY:null,ctrlKey:null,shiftKey:null,altKey:null,metaKey:null,getModifierState:getEventModifierState,button:function button(event){var button=event.button;if('which'in event){return button;}return button===2?2:button===4?1:0;},buttons:null,relatedTarget:function relatedTarget(event){return event.relatedTarget||(event.fromElement===event.srcElement?event.toElement:event.fromElement);},pageX:function pageX(event){return'pageX'in event?event.pageX:event.clientX+ViewportMetrics.currentScrollLeft;},pageY:function pageY(event){return'pageY'in event?event.pageY:event.clientY+ViewportMetrics.currentScrollTop;}};function SyntheticMouseEvent(dispatchConfig,dispatchMarker,nativeEvent){SyntheticUIEvent.call(this,dispatchConfig,dispatchMarker,nativeEvent);}SyntheticUIEvent.augmentClass(SyntheticMouseEvent,MouseEventInterface);module.exports=SyntheticMouseEvent;},{"101":101,"104":104,"124":124}],100:[function(_dereq_,module,exports){'use strict';var SyntheticUIEvent=_dereq_(101);var getEventModifierState=_dereq_(124);var TouchEventInterface={touches:null,targetTouches:null,changedTouches:null,altKey:null,metaKey:null,ctrlKey:null,shiftKey:null,getModifierState:getEventModifierState};function SyntheticTouchEvent(dispatchConfig,dispatchMarker,nativeEvent){SyntheticUIEvent.call(this,dispatchConfig,dispatchMarker,nativeEvent);}SyntheticUIEvent.augmentClass(SyntheticTouchEvent,TouchEventInterface);module.exports=SyntheticTouchEvent;},{"101":101,"124":124}],101:[function(_dereq_,module,exports){'use strict';var SyntheticEvent=_dereq_(95);var getEventTarget=_dereq_(125);var UIEventInterface={view:function view(event){if(event.view){return event.view;}var target=getEventTarget(event);if(target!=null&&target.window===target){return target;}var doc=target.ownerDocument;if(doc){return doc.defaultView||doc.parentWindow;}else{return window;}},detail:function detail(event){return event.detail||0;}};function SyntheticUIEvent(dispatchConfig,dispatchMarker,nativeEvent){SyntheticEvent.call(this,dispatchConfig,dispatchMarker,nativeEvent);}SyntheticEvent.augmentClass(SyntheticUIEvent,UIEventInterface);module.exports=SyntheticUIEvent;},{"125":125,"95":95}],102:[function(_dereq_,module,exports){'use strict';var SyntheticMouseEvent=_dereq_(99);var WheelEventInterface={deltaX:function deltaX(event){return'deltaX'in event?event.deltaX:'wheelDeltaX'in event?-event.wheelDeltaX:0;},deltaY:function deltaY(event){return'deltaY'in event?event.deltaY:'wheelDeltaY'in event?-event.wheelDeltaY:'wheelDelta'in event?-event.wheelDelta:0;},deltaZ:null,deltaMode:null};function SyntheticWheelEvent(dispatchConfig,dispatchMarker,nativeEvent){SyntheticMouseEvent.call(this,dispatchConfig,dispatchMarker,nativeEvent);}SyntheticMouseEvent.augmentClass(SyntheticWheelEvent,WheelEventInterface);module.exports=SyntheticWheelEvent;},{"99":99}],103:[function(_dereq_,module,exports){'use strict';var invariant=_dereq_(135);var Mixin={reinitializeTransaction:function reinitializeTransaction(){this.transactionWrappers=this.getTransactionWrappers();if(!this.wrapperInitData){this.wrapperInitData=[];}else{this.wrapperInitData.length=0;}this._isInTransaction=false;},_isInTransaction:false,getTransactionWrappers:null,isInTransaction:function isInTransaction(){return!!this._isInTransaction;},perform:function perform(method,scope,a,b,c,d,e,f){"production"!=="development"?invariant(!this.isInTransaction(),'Transaction.perform(...): Cannot initialize a transaction when there '+'is already an outstanding transaction.'):invariant(!this.isInTransaction());var errorThrown;var ret;try{this._isInTransaction=true;errorThrown=true;this.initializeAll(0);ret=method.call(scope,a,b,c,d,e,f);errorThrown=false;}finally{try{if(errorThrown){try{this.closeAll(0);}catch(err){}}else{this.closeAll(0);}}finally{this._isInTransaction=false;}}return ret;},initializeAll:function initializeAll(startIndex){var transactionWrappers=this.transactionWrappers;for(var i=startIndex;i<transactionWrappers.length;i++){var wrapper=transactionWrappers[i];try{this.wrapperInitData[i]=Transaction.OBSERVED_ERROR;this.wrapperInitData[i]=wrapper.initialize?wrapper.initialize.call(this):null;}finally{if(this.wrapperInitData[i]===Transaction.OBSERVED_ERROR){try{this.initializeAll(i+1);}catch(err){}}}}},closeAll:function closeAll(startIndex){"production"!=="development"?invariant(this.isInTransaction(),'Transaction.closeAll(): Cannot close transaction when none are open.'):invariant(this.isInTransaction());var transactionWrappers=this.transactionWrappers;for(var i=startIndex;i<transactionWrappers.length;i++){var wrapper=transactionWrappers[i];var initData=this.wrapperInitData[i];var errorThrown;try{errorThrown=true;if(initData!==Transaction.OBSERVED_ERROR&&wrapper.close){wrapper.close.call(this,initData);}errorThrown=false;}finally{if(errorThrown){try{this.closeAll(i+1);}catch(e){}}}}this.wrapperInitData.length=0;}};var Transaction={Mixin:Mixin,OBSERVED_ERROR:{}};module.exports=Transaction;},{"135":135}],104:[function(_dereq_,module,exports){'use strict';var ViewportMetrics={currentScrollLeft:0,currentScrollTop:0,refreshScrollValues:function refreshScrollValues(scrollPosition){ViewportMetrics.currentScrollLeft=scrollPosition.x;ViewportMetrics.currentScrollTop=scrollPosition.y;}};module.exports=ViewportMetrics;},{}],105:[function(_dereq_,module,exports){'use strict';var invariant=_dereq_(135);function accumulateInto(current,next){"production"!=="development"?invariant(next!=null,'accumulateInto(...): Accumulated items must not be null or undefined.'):invariant(next!=null);if(current==null){return next;}var currentIsArray=Array.isArray(current);var nextIsArray=Array.isArray(next);if(currentIsArray&&nextIsArray){current.push.apply(current,next);return current;}if(currentIsArray){current.push(next);return current;}if(nextIsArray){return[current].concat(next);}return[current,next];}module.exports=accumulateInto;},{"135":135}],106:[function(_dereq_,module,exports){'use strict';var MOD=65521;function adler32(data){var a=1;var b=0;for(var i=0;i<data.length;i++){a=(a+data.charCodeAt(i))%MOD;b=(b+a)%MOD;}return a|b<<16;}module.exports=adler32;},{}],107:[function(_dereq_,module,exports){var _hyphenPattern=/-(.)/g;function camelize(string){return string.replace(_hyphenPattern,function(_,character){return character.toUpperCase();});}module.exports=camelize;},{}],108:[function(_dereq_,module,exports){"use strict";var camelize=_dereq_(107);var msPattern=/^-ms-/;function camelizeStyleName(string){return camelize(string.replace(msPattern,'ms-'));}module.exports=camelizeStyleName;},{"107":107}],109:[function(_dereq_,module,exports){var isTextNode=_dereq_(139);function containsNode(outerNode,innerNode){if(!outerNode||!innerNode){return false;}else if(outerNode===innerNode){return true;}else if(isTextNode(outerNode)){return false;}else if(isTextNode(innerNode)){return containsNode(outerNode,innerNode.parentNode);}else if(outerNode.contains){return outerNode.contains(innerNode);}else if(outerNode.compareDocumentPosition){return!!(outerNode.compareDocumentPosition(innerNode)&16);}else{return false;}}module.exports=containsNode;},{"139":139}],110:[function(_dereq_,module,exports){var toArray=_dereq_(152);function hasArrayNature(obj){return!!obj&&((typeof obj==="undefined"?"undefined":_typeof(obj))=='object'||typeof obj=='function')&&'length'in obj&&!('setInterval'in obj)&&typeof obj.nodeType!='number'&&(Array.isArray(obj)||'callee'in obj||'item'in obj);}function createArrayFromMixed(obj){if(!hasArrayNature(obj)){return[obj];}else if(Array.isArray(obj)){return obj.slice();}else{return toArray(obj);}}module.exports=createArrayFromMixed;},{"152":152}],111:[function(_dereq_,module,exports){'use strict';var ReactClass=_dereq_(33);var ReactElement=_dereq_(57);var invariant=_dereq_(135);function createFullPageComponent(tag){var elementFactory=ReactElement.createFactory(tag);var FullPageComponent=ReactClass.createClass({tagName:tag.toUpperCase(),displayName:'ReactFullPageComponent'+tag,componentWillUnmount:function componentWillUnmount(){"production"!=="development"?invariant(false,'%s tried to unmount. Because of cross-browser quirks it is '+'impossible to unmount some top-level components (eg <html>, <head>, '+'and <body>) reliably and efficiently. To fix this, have a single '+'top-level component that never unmounts render these elements.',this.constructor.displayName):invariant(false);},render:function render(){return elementFactory(this.props);}});return FullPageComponent;}module.exports=createFullPageComponent;},{"135":135,"33":33,"57":57}],112:[function(_dereq_,module,exports){var ExecutionEnvironment=_dereq_(21);var createArrayFromMixed=_dereq_(110);var getMarkupWrap=_dereq_(127);var invariant=_dereq_(135);var dummyNode=ExecutionEnvironment.canUseDOM?document.createElement('div'):null;var nodeNamePattern=/^\s*<(\w+)/;function getNodeName(markup){var nodeNameMatch=markup.match(nodeNamePattern);return nodeNameMatch&&nodeNameMatch[1].toLowerCase();}function createNodesFromMarkup(markup,handleScript){var node=dummyNode;"production"!=="development"?invariant(!!dummyNode,'createNodesFromMarkup dummy not initialized'):invariant(!!dummyNode);var nodeName=getNodeName(markup);var wrap=nodeName&&getMarkupWrap(nodeName);if(wrap){node.innerHTML=wrap[1]+markup+wrap[2];var wrapDepth=wrap[0];while(wrapDepth--){node=node.lastChild;}}else{node.innerHTML=markup;}var scripts=node.getElementsByTagName('script');if(scripts.length){"production"!=="development"?invariant(handleScript,'createNodesFromMarkup(...): Unexpected <script> element rendered.'):invariant(handleScript);createArrayFromMixed(scripts).forEach(handleScript);}var nodes=createArrayFromMixed(node.childNodes);while(node.lastChild){node.removeChild(node.lastChild);}return nodes;}module.exports=createNodesFromMarkup;},{"110":110,"127":127,"135":135,"21":21}],113:[function(_dereq_,module,exports){'use strict';var CSSProperty=_dereq_(4);var isUnitlessNumber=CSSProperty.isUnitlessNumber;function dangerousStyleValue(name,value){var isEmpty=value==null||typeof value==='boolean'||value==='';if(isEmpty){return'';}var isNonNumeric=isNaN(value);if(isNonNumeric||value===0||isUnitlessNumber.hasOwnProperty(name)&&isUnitlessNumber[name]){return''+value;}if(typeof value==='string'){value=value.trim();}return value+'px';}module.exports=dangerousStyleValue;},{"4":4}],114:[function(_dereq_,module,exports){function makeEmptyFunction(arg){return function(){return arg;};}function emptyFunction(){}emptyFunction.thatReturns=makeEmptyFunction;emptyFunction.thatReturnsFalse=makeEmptyFunction(false);emptyFunction.thatReturnsTrue=makeEmptyFunction(true);emptyFunction.thatReturnsNull=makeEmptyFunction(null);emptyFunction.thatReturnsThis=function(){return this;};emptyFunction.thatReturnsArgument=function(arg){return arg;};module.exports=emptyFunction;},{}],115:[function(_dereq_,module,exports){"use strict";var emptyObject={};if("production"!=="development"){Object.freeze(emptyObject);}module.exports=emptyObject;},{}],116:[function(_dereq_,module,exports){'use strict';var ESCAPE_LOOKUP={'&':'&amp;','>':'&gt;','<':'&lt;','"':'&quot;','\'':'&#x27;'};var ESCAPE_REGEX=/[&><"']/g;function escaper(match){return ESCAPE_LOOKUP[match];}function escapeTextContentForBrowser(text){return(''+text).replace(ESCAPE_REGEX,escaper);}module.exports=escapeTextContentForBrowser;},{}],117:[function(_dereq_,module,exports){'use strict';var ReactCurrentOwner=_dereq_(39);var ReactInstanceMap=_dereq_(67);var ReactMount=_dereq_(70);var invariant=_dereq_(135);var isNode=_dereq_(137);var warning=_dereq_(154);function findDOMNode(componentOrElement){if("production"!=="development"){var owner=ReactCurrentOwner.current;if(owner!==null){"production"!=="development"?warning(owner._warnedAboutRefsInRender,'%s is accessing getDOMNode or findDOMNode inside its render(). '+'render() should be a pure function of props and state. It should '+'never access something that requires stale data from the previous '+'render, such as refs. Move this logic to componentDidMount and '+'componentDidUpdate instead.',owner.getName()||'A component'):null;owner._warnedAboutRefsInRender=true;}}if(componentOrElement==null){return null;}if(isNode(componentOrElement)){return componentOrElement;}if(ReactInstanceMap.has(componentOrElement)){return ReactMount.getNodeFromInstance(componentOrElement);}"production"!=="development"?invariant(componentOrElement.render==null||typeof componentOrElement.render!=='function','Component (with keys: %s) contains `render` method '+'but is not mounted in the DOM',Object.keys(componentOrElement)):invariant(componentOrElement.render==null||typeof componentOrElement.render!=='function');"production"!=="development"?invariant(false,'Element appears to be neither ReactComponent nor DOMNode (keys: %s)',Object.keys(componentOrElement)):invariant(false);}module.exports=findDOMNode;},{"135":135,"137":137,"154":154,"39":39,"67":67,"70":70}],118:[function(_dereq_,module,exports){'use strict';var traverseAllChildren=_dereq_(153);var warning=_dereq_(154);function flattenSingleChildIntoContext(traverseContext,child,name){var result=traverseContext;var keyUnique=!result.hasOwnProperty(name);if("production"!=="development"){"production"!=="development"?warning(keyUnique,'flattenChildren(...): Encountered two children with the same key, '+'`%s`. Child keys must be unique; when two children share a key, only '+'the first child will be used.',name):null;}if(keyUnique&&child!=null){result[name]=child;}}function flattenChildren(children){if(children==null){return children;}var result={};traverseAllChildren(children,flattenSingleChildIntoContext,result);return result;}module.exports=flattenChildren;},{"153":153,"154":154}],119:[function(_dereq_,module,exports){"use strict";function focusNode(node){try{node.focus();}catch(e){}}module.exports=focusNode;},{}],120:[function(_dereq_,module,exports){'use strict';var forEachAccumulated=function forEachAccumulated(arr,cb,scope){if(Array.isArray(arr)){arr.forEach(cb,scope);}else if(arr){cb.call(scope,arr);}};module.exports=forEachAccumulated;},{}],121:[function(_dereq_,module,exports){function getActiveElement(){try{return document.activeElement||document.body;}catch(e){return document.body;}}module.exports=getActiveElement;},{}],122:[function(_dereq_,module,exports){'use strict';function getEventCharCode(nativeEvent){var charCode;var keyCode=nativeEvent.keyCode;if('charCode'in nativeEvent){charCode=nativeEvent.charCode;if(charCode===0&&keyCode===13){charCode=13;}}else{charCode=keyCode;}if(charCode>=32||charCode===13){return charCode;}return 0;}module.exports=getEventCharCode;},{}],123:[function(_dereq_,module,exports){'use strict';var getEventCharCode=_dereq_(122);var normalizeKey={'Esc':'Escape','Spacebar':' ','Left':'ArrowLeft','Up':'ArrowUp','Right':'ArrowRight','Down':'ArrowDown','Del':'Delete','Win':'OS','Menu':'ContextMenu','Apps':'ContextMenu','Scroll':'ScrollLock','MozPrintableKey':'Unidentified'};var translateToKey={8:'Backspace',9:'Tab',12:'Clear',13:'Enter',16:'Shift',17:'Control',18:'Alt',19:'Pause',20:'CapsLock',27:'Escape',32:' ',33:'PageUp',34:'PageDown',35:'End',36:'Home',37:'ArrowLeft',38:'ArrowUp',39:'ArrowRight',40:'ArrowDown',45:'Insert',46:'Delete',112:'F1',113:'F2',114:'F3',115:'F4',116:'F5',117:'F6',118:'F7',119:'F8',120:'F9',121:'F10',122:'F11',123:'F12',144:'NumLock',145:'ScrollLock',224:'Meta'};function getEventKey(nativeEvent){if(nativeEvent.key){var key=normalizeKey[nativeEvent.key]||nativeEvent.key;if(key!=='Unidentified'){return key;}}if(nativeEvent.type==='keypress'){var charCode=getEventCharCode(nativeEvent);return charCode===13?'Enter':String.fromCharCode(charCode);}if(nativeEvent.type==='keydown'||nativeEvent.type==='keyup'){return translateToKey[nativeEvent.keyCode]||'Unidentified';}return'';}module.exports=getEventKey;},{"122":122}],124:[function(_dereq_,module,exports){'use strict';var modifierKeyToProp={'Alt':'altKey','Control':'ctrlKey','Meta':'metaKey','Shift':'shiftKey'};function modifierStateGetter(keyArg){var syntheticEvent=this;var nativeEvent=syntheticEvent.nativeEvent;if(nativeEvent.getModifierState){return nativeEvent.getModifierState(keyArg);}var keyProp=modifierKeyToProp[keyArg];return keyProp?!!nativeEvent[keyProp]:false;}function getEventModifierState(nativeEvent){return modifierStateGetter;}module.exports=getEventModifierState;},{}],125:[function(_dereq_,module,exports){'use strict';function getEventTarget(nativeEvent){var target=nativeEvent.target||nativeEvent.srcElement||window;return target.nodeType===3?target.parentNode:target;}module.exports=getEventTarget;},{}],126:[function(_dereq_,module,exports){'use strict';var ITERATOR_SYMBOL=typeof Symbol==='function'&&Symbol.iterator;var FAUX_ITERATOR_SYMBOL='@@iterator';function getIteratorFn(maybeIterable){var iteratorFn=maybeIterable&&(ITERATOR_SYMBOL&&maybeIterable[ITERATOR_SYMBOL]||maybeIterable[FAUX_ITERATOR_SYMBOL]);if(typeof iteratorFn==='function'){return iteratorFn;}}module.exports=getIteratorFn;},{}],127:[function(_dereq_,module,exports){var ExecutionEnvironment=_dereq_(21);var invariant=_dereq_(135);var dummyNode=ExecutionEnvironment.canUseDOM?document.createElement('div'):null;var shouldWrap={'circle':true,'clipPath':true,'defs':true,'ellipse':true,'g':true,'line':true,'linearGradient':true,'path':true,'polygon':true,'polyline':true,'radialGradient':true,'rect':true,'stop':true,'text':true};var selectWrap=[1,'<select multiple="true">','</select>'];var tableWrap=[1,'<table>','</table>'];var trWrap=[3,'<table><tbody><tr>','</tr></tbody></table>'];var svgWrap=[1,'<svg>','</svg>'];var markupWrap={'*':[1,'?<div>','</div>'],'area':[1,'<map>','</map>'],'col':[2,'<table><tbody></tbody><colgroup>','</colgroup></table>'],'legend':[1,'<fieldset>','</fieldset>'],'param':[1,'<object>','</object>'],'tr':[2,'<table><tbody>','</tbody></table>'],'optgroup':selectWrap,'option':selectWrap,'caption':tableWrap,'colgroup':tableWrap,'tbody':tableWrap,'tfoot':tableWrap,'thead':tableWrap,'td':trWrap,'th':trWrap,'circle':svgWrap,'clipPath':svgWrap,'defs':svgWrap,'ellipse':svgWrap,'g':svgWrap,'line':svgWrap,'linearGradient':svgWrap,'path':svgWrap,'polygon':svgWrap,'polyline':svgWrap,'radialGradient':svgWrap,'rect':svgWrap,'stop':svgWrap,'text':svgWrap};function getMarkupWrap(nodeName){"production"!=="development"?invariant(!!dummyNode,'Markup wrapping node not initialized'):invariant(!!dummyNode);if(!markupWrap.hasOwnProperty(nodeName)){nodeName='*';}if(!shouldWrap.hasOwnProperty(nodeName)){if(nodeName==='*'){dummyNode.innerHTML='<link />';}else{dummyNode.innerHTML='<'+nodeName+'></'+nodeName+'>';}shouldWrap[nodeName]=!dummyNode.firstChild;}return shouldWrap[nodeName]?markupWrap[nodeName]:null;}module.exports=getMarkupWrap;},{"135":135,"21":21}],128:[function(_dereq_,module,exports){'use strict';function getLeafNode(node){while(node&&node.firstChild){node=node.firstChild;}return node;}function getSiblingNode(node){while(node){if(node.nextSibling){return node.nextSibling;}node=node.parentNode;}}function getNodeForCharacterOffset(root,offset){var node=getLeafNode(root);var nodeStart=0;var nodeEnd=0;while(node){if(node.nodeType===3){nodeEnd=nodeStart+node.textContent.length;if(nodeStart<=offset&&nodeEnd>=offset){return{node:node,offset:offset-nodeStart};}nodeStart=nodeEnd;}node=getLeafNode(getSiblingNode(node));}}module.exports=getNodeForCharacterOffset;},{}],129:[function(_dereq_,module,exports){'use strict';var DOC_NODE_TYPE=9;function getReactRootElementInContainer(container){if(!container){return null;}if(container.nodeType===DOC_NODE_TYPE){return container.documentElement;}else{return container.firstChild;}}module.exports=getReactRootElementInContainer;},{}],130:[function(_dereq_,module,exports){'use strict';var ExecutionEnvironment=_dereq_(21);var contentKey=null;function getTextContentAccessor(){if(!contentKey&&ExecutionEnvironment.canUseDOM){contentKey='textContent'in document.documentElement?'textContent':'innerText';}return contentKey;}module.exports=getTextContentAccessor;},{"21":21}],131:[function(_dereq_,module,exports){"use strict";function getUnboundedScrollPosition(scrollable){if(scrollable===window){return{x:window.pageXOffset||document.documentElement.scrollLeft,y:window.pageYOffset||document.documentElement.scrollTop};}return{x:scrollable.scrollLeft,y:scrollable.scrollTop};}module.exports=getUnboundedScrollPosition;},{}],132:[function(_dereq_,module,exports){var _uppercasePattern=/([A-Z])/g;function hyphenate(string){return string.replace(_uppercasePattern,'-$1').toLowerCase();}module.exports=hyphenate;},{}],133:[function(_dereq_,module,exports){"use strict";var hyphenate=_dereq_(132);var msPattern=/^ms-/;function hyphenateStyleName(string){return hyphenate(string).replace(msPattern,'-ms-');}module.exports=hyphenateStyleName;},{"132":132}],134:[function(_dereq_,module,exports){'use strict';var ReactCompositeComponent=_dereq_(37);var ReactEmptyComponent=_dereq_(59);var ReactNativeComponent=_dereq_(73);var assign=_dereq_(27);var invariant=_dereq_(135);var warning=_dereq_(154);var ReactCompositeComponentWrapper=function ReactCompositeComponentWrapper(){};assign(ReactCompositeComponentWrapper.prototype,ReactCompositeComponent.Mixin,{_instantiateReactComponent:instantiateReactComponent});function isInternalComponentType(type){return typeof type==='function'&&typeof type.prototype!=='undefined'&&typeof type.prototype.mountComponent==='function'&&typeof type.prototype.receiveComponent==='function';}function instantiateReactComponent(node,parentCompositeType){var instance;if(node===null||node===false){node=ReactEmptyComponent.emptyElement;}if((typeof node==="undefined"?"undefined":_typeof(node))==='object'){var element=node;if("production"!=="development"){"production"!=="development"?warning(element&&(typeof element.type==='function'||typeof element.type==='string'),'Only functions or strings can be mounted as React components.'):null;}if(parentCompositeType===element.type&&typeof element.type==='string'){instance=ReactNativeComponent.createInternalComponent(element);}else if(isInternalComponentType(element.type)){instance=new element.type(element);}else{instance=new ReactCompositeComponentWrapper();}}else if(typeof node==='string'||typeof node==='number'){instance=ReactNativeComponent.createInstanceForText(node);}else{"production"!=="development"?invariant(false,'Encountered invalid React node of type %s',typeof node==="undefined"?"undefined":_typeof(node)):invariant(false);}if("production"!=="development"){"production"!=="development"?warning(typeof instance.construct==='function'&&typeof instance.mountComponent==='function'&&typeof instance.receiveComponent==='function'&&typeof instance.unmountComponent==='function','Only React Components can be mounted.'):null;}instance.construct(node);instance._mountIndex=0;instance._mountImage=null;if("production"!=="development"){instance._isOwnerNecessary=false;instance._warnedAboutRefsInRender=false;}if("production"!=="development"){if(Object.preventExtensions){Object.preventExtensions(instance);}}return instance;}module.exports=instantiateReactComponent;},{"135":135,"154":154,"27":27,"37":37,"59":59,"73":73}],135:[function(_dereq_,module,exports){"use strict";var invariant=function invariant(condition,format,a,b,c,d,e,f){if("production"!=="development"){if(format===undefined){throw new Error('invariant requires an error message argument');}}if(!condition){var error;if(format===undefined){error=new Error('Minified exception occurred; use the non-minified dev environment '+'for the full error message and additional helpful warnings.');}else{var args=[a,b,c,d,e,f];var argIndex=0;error=new Error('Invariant Violation: '+format.replace(/%s/g,function(){return args[argIndex++];}));}error.framesToPop=1;throw error;}};module.exports=invariant;},{}],136:[function(_dereq_,module,exports){'use strict';var ExecutionEnvironment=_dereq_(21);var useHasFeature;if(ExecutionEnvironment.canUseDOM){useHasFeature=document.implementation&&document.implementation.hasFeature&&document.implementation.hasFeature('','')!==true;}function isEventSupported(eventNameSuffix,capture){if(!ExecutionEnvironment.canUseDOM||capture&&!('addEventListener'in document)){return false;}var eventName='on'+eventNameSuffix;var isSupported=eventName in document;if(!isSupported){var element=document.createElement('div');element.setAttribute(eventName,'return;');isSupported=typeof element[eventName]==='function';}if(!isSupported&&useHasFeature&&eventNameSuffix==='wheel'){isSupported=document.implementation.hasFeature('Events.wheel','3.0');}return isSupported;}module.exports=isEventSupported;},{"21":21}],137:[function(_dereq_,module,exports){function isNode(object){return!!(object&&(typeof Node==='function'?object instanceof Node:(typeof object==="undefined"?"undefined":_typeof(object))==='object'&&typeof object.nodeType==='number'&&typeof object.nodeName==='string'));}module.exports=isNode;},{}],138:[function(_dereq_,module,exports){'use strict';var supportedInputTypes={'color':true,'date':true,'datetime':true,'datetime-local':true,'email':true,'month':true,'number':true,'password':true,'range':true,'search':true,'tel':true,'text':true,'time':true,'url':true,'week':true};function isTextInputElement(elem){return elem&&(elem.nodeName==='INPUT'&&supportedInputTypes[elem.type]||elem.nodeName==='TEXTAREA');}module.exports=isTextInputElement;},{}],139:[function(_dereq_,module,exports){var isNode=_dereq_(137);function isTextNode(object){return isNode(object)&&object.nodeType==3;}module.exports=isTextNode;},{"137":137}],140:[function(_dereq_,module,exports){'use strict';var invariant=_dereq_(135);var keyMirror=function keyMirror(obj){var ret={};var key;"production"!=="development"?invariant(obj instanceof Object&&!Array.isArray(obj),'keyMirror(...): Argument must be an object.'):invariant(obj instanceof Object&&!Array.isArray(obj));for(key in obj){if(!obj.hasOwnProperty(key)){continue;}ret[key]=key;}return ret;};module.exports=keyMirror;},{"135":135}],141:[function(_dereq_,module,exports){var keyOf=function keyOf(oneKeyObj){var key;for(key in oneKeyObj){if(!oneKeyObj.hasOwnProperty(key)){continue;}return key;}return null;};module.exports=keyOf;},{}],142:[function(_dereq_,module,exports){'use strict';var hasOwnProperty=Object.prototype.hasOwnProperty;function mapObject(object,callback,context){if(!object){return null;}var result={};for(var name in object){if(hasOwnProperty.call(object,name)){result[name]=callback.call(context,object[name],name,object);}}return result;}module.exports=mapObject;},{}],143:[function(_dereq_,module,exports){'use strict';function memoizeStringOnly(callback){var cache={};return function(string){if(!cache.hasOwnProperty(string)){cache[string]=callback.call(this,string);}return cache[string];};}module.exports=memoizeStringOnly;},{}],144:[function(_dereq_,module,exports){'use strict';var ReactElement=_dereq_(57);var invariant=_dereq_(135);function onlyChild(children){"production"!=="development"?invariant(ReactElement.isValidElement(children),'onlyChild must be passed a children with exactly one child.'):invariant(ReactElement.isValidElement(children));return children;}module.exports=onlyChild;},{"135":135,"57":57}],145:[function(_dereq_,module,exports){"use strict";var ExecutionEnvironment=_dereq_(21);var performance;if(ExecutionEnvironment.canUseDOM){performance=window.performance||window.msPerformance||window.webkitPerformance;}module.exports=performance||{};},{"21":21}],146:[function(_dereq_,module,exports){var performance=_dereq_(145);if(!performance||!performance.now){performance=Date;}var performanceNow=performance.now.bind(performance);module.exports=performanceNow;},{"145":145}],147:[function(_dereq_,module,exports){'use strict';var escapeTextContentForBrowser=_dereq_(116);function quoteAttributeValueForBrowser(value){return'"'+escapeTextContentForBrowser(value)+'"';}module.exports=quoteAttributeValueForBrowser;},{"116":116}],148:[function(_dereq_,module,exports){'use strict';var ExecutionEnvironment=_dereq_(21);var WHITESPACE_TEST=/^[ \r\n\t\f]/;var NONVISIBLE_TEST=/<(!--|link|noscript|meta|script|style)[ \r\n\t\f\/>]/;var setInnerHTML=function setInnerHTML(node,html){node.innerHTML=html;};if(typeof MSApp!=='undefined'&&MSApp.execUnsafeLocalFunction){setInnerHTML=function setInnerHTML(node,html){MSApp.execUnsafeLocalFunction(function(){node.innerHTML=html;});};}if(ExecutionEnvironment.canUseDOM){var testElement=document.createElement('div');testElement.innerHTML=' ';if(testElement.innerHTML===''){setInnerHTML=function setInnerHTML(node,html){if(node.parentNode){node.parentNode.replaceChild(node,node);}if(WHITESPACE_TEST.test(html)||html[0]==='<'&&NONVISIBLE_TEST.test(html)){node.innerHTML="\uFEFF"+html;var textNode=node.firstChild;if(textNode.data.length===1){node.removeChild(textNode);}else{textNode.deleteData(0,1);}}else{node.innerHTML=html;}};}}module.exports=setInnerHTML;},{"21":21}],149:[function(_dereq_,module,exports){'use strict';var ExecutionEnvironment=_dereq_(21);var escapeTextContentForBrowser=_dereq_(116);var setInnerHTML=_dereq_(148);var setTextContent=function setTextContent(node,text){node.textContent=text;};if(ExecutionEnvironment.canUseDOM){if(!('textContent'in document.documentElement)){setTextContent=function setTextContent(node,text){setInnerHTML(node,escapeTextContentForBrowser(text));};}}module.exports=setTextContent;},{"116":116,"148":148,"21":21}],150:[function(_dereq_,module,exports){'use strict';function shallowEqual(objA,objB){if(objA===objB){return true;}var key;for(key in objA){if(objA.hasOwnProperty(key)&&(!objB.hasOwnProperty(key)||objA[key]!==objB[key])){return false;}}for(key in objB){if(objB.hasOwnProperty(key)&&!objA.hasOwnProperty(key)){return false;}}return true;}module.exports=shallowEqual;},{}],151:[function(_dereq_,module,exports){'use strict';var warning=_dereq_(154);function shouldUpdateReactComponent(prevElement,nextElement){if(prevElement!=null&&nextElement!=null){var prevType=typeof prevElement==="undefined"?"undefined":_typeof(prevElement);var nextType=typeof nextElement==="undefined"?"undefined":_typeof(nextElement);if(prevType==='string'||prevType==='number'){return nextType==='string'||nextType==='number';}else{if(nextType==='object'&&prevElement.type===nextElement.type&&prevElement.key===nextElement.key){var ownersMatch=prevElement._owner===nextElement._owner;var prevName=null;var nextName=null;var nextDisplayName=null;if("production"!=="development"){if(!ownersMatch){if(prevElement._owner!=null&&prevElement._owner.getPublicInstance()!=null&&prevElement._owner.getPublicInstance().constructor!=null){prevName=prevElement._owner.getPublicInstance().constructor.displayName;}if(nextElement._owner!=null&&nextElement._owner.getPublicInstance()!=null&&nextElement._owner.getPublicInstance().constructor!=null){nextName=nextElement._owner.getPublicInstance().constructor.displayName;}if(nextElement.type!=null&&nextElement.type.displayName!=null){nextDisplayName=nextElement.type.displayName;}if(nextElement.type!=null&&typeof nextElement.type==='string'){nextDisplayName=nextElement.type;}if(typeof nextElement.type!=='string'||nextElement.type==='input'||nextElement.type==='textarea'){if(prevElement._owner!=null&&prevElement._owner._isOwnerNecessary===false||nextElement._owner!=null&&nextElement._owner._isOwnerNecessary===false){if(prevElement._owner!=null){prevElement._owner._isOwnerNecessary=true;}if(nextElement._owner!=null){nextElement._owner._isOwnerNecessary=true;}"production"!=="development"?warning(false,'<%s /> is being rendered by both %s and %s using the same '+'key (%s) in the same place. Currently, this means that '+'they don\'t preserve state. This behavior should be very '+'rare so we\'re considering deprecating it. Please contact '+'the React team and explain your use case so that we can '+'take that into consideration.',nextDisplayName||'Unknown Component',prevName||'[Unknown]',nextName||'[Unknown]',prevElement.key):null;}}}}return ownersMatch;}}}return false;}module.exports=shouldUpdateReactComponent;},{"154":154}],152:[function(_dereq_,module,exports){var invariant=_dereq_(135);function toArray(obj){var length=obj.length;"production"!=="development"?invariant(!Array.isArray(obj)&&((typeof obj==="undefined"?"undefined":_typeof(obj))==='object'||typeof obj==='function'),'toArray: Array-like object expected'):invariant(!Array.isArray(obj)&&((typeof obj==="undefined"?"undefined":_typeof(obj))==='object'||typeof obj==='function'));"production"!=="development"?invariant(typeof length==='number','toArray: Object needs a length property'):invariant(typeof length==='number');"production"!=="development"?invariant(length===0||length-1 in obj,'toArray: Object should have keys for indices'):invariant(length===0||length-1 in obj);if(obj.hasOwnProperty){try{return Array.prototype.slice.call(obj);}catch(e){}}var ret=Array(length);for(var ii=0;ii<length;ii++){ret[ii]=obj[ii];}return ret;}module.exports=toArray;},{"135":135}],153:[function(_dereq_,module,exports){'use strict';var ReactElement=_dereq_(57);var ReactFragment=_dereq_(63);var ReactInstanceHandles=_dereq_(66);var getIteratorFn=_dereq_(126);var invariant=_dereq_(135);var warning=_dereq_(154);var SEPARATOR=ReactInstanceHandles.SEPARATOR;var SUBSEPARATOR=':';var userProvidedKeyEscaperLookup={'=':'=0','.':'=1',':':'=2'};var userProvidedKeyEscapeRegex=/[=.:]/g;var didWarnAboutMaps=false;function userProvidedKeyEscaper(match){return userProvidedKeyEscaperLookup[match];}function getComponentKey(component,index){if(component&&component.key!=null){return wrapUserProvidedKey(component.key);}return index.toString(36);}function escapeUserProvidedKey(text){return(''+text).replace(userProvidedKeyEscapeRegex,userProvidedKeyEscaper);}function wrapUserProvidedKey(key){return'$'+escapeUserProvidedKey(key);}function traverseAllChildrenImpl(children,nameSoFar,indexSoFar,callback,traverseContext){var type=typeof children==="undefined"?"undefined":_typeof(children);if(type==='undefined'||type==='boolean'){children=null;}if(children===null||type==='string'||type==='number'||ReactElement.isValidElement(children)){callback(traverseContext,children,nameSoFar===''?SEPARATOR+getComponentKey(children,0):nameSoFar,indexSoFar);return 1;}var child,nextName,nextIndex;var subtreeCount=0;if(Array.isArray(children)){for(var i=0;i<children.length;i++){child=children[i];nextName=(nameSoFar!==''?nameSoFar+SUBSEPARATOR:SEPARATOR)+getComponentKey(child,i);nextIndex=indexSoFar+subtreeCount;subtreeCount+=traverseAllChildrenImpl(child,nextName,nextIndex,callback,traverseContext);}}else{var iteratorFn=getIteratorFn(children);if(iteratorFn){var iterator=iteratorFn.call(children);var step;if(iteratorFn!==children.entries){var ii=0;while(!(step=iterator.next()).done){child=step.value;nextName=(nameSoFar!==''?nameSoFar+SUBSEPARATOR:SEPARATOR)+getComponentKey(child,ii++);nextIndex=indexSoFar+subtreeCount;subtreeCount+=traverseAllChildrenImpl(child,nextName,nextIndex,callback,traverseContext);}}else{if("production"!=="development"){"production"!=="development"?warning(didWarnAboutMaps,'Using Maps as children is not yet fully supported. It is an '+'experimental feature that might be removed. Convert it to a '+'sequence / iterable of keyed ReactElements instead.'):null;didWarnAboutMaps=true;}while(!(step=iterator.next()).done){var entry=step.value;if(entry){child=entry[1];nextName=(nameSoFar!==''?nameSoFar+SUBSEPARATOR:SEPARATOR)+wrapUserProvidedKey(entry[0])+SUBSEPARATOR+getComponentKey(child,0);nextIndex=indexSoFar+subtreeCount;subtreeCount+=traverseAllChildrenImpl(child,nextName,nextIndex,callback,traverseContext);}}}}else if(type==='object'){"production"!=="development"?invariant(children.nodeType!==1,'traverseAllChildren(...): Encountered an invalid child; DOM '+'elements are not valid children of React components.'):invariant(children.nodeType!==1);var fragment=ReactFragment.extract(children);for(var key in fragment){if(fragment.hasOwnProperty(key)){child=fragment[key];nextName=(nameSoFar!==''?nameSoFar+SUBSEPARATOR:SEPARATOR)+wrapUserProvidedKey(key)+SUBSEPARATOR+getComponentKey(child,0);nextIndex=indexSoFar+subtreeCount;subtreeCount+=traverseAllChildrenImpl(child,nextName,nextIndex,callback,traverseContext);}}}}return subtreeCount;}function traverseAllChildren(children,callback,traverseContext){if(children==null){return 0;}return traverseAllChildrenImpl(children,'',0,callback,traverseContext);}module.exports=traverseAllChildren;},{"126":126,"135":135,"154":154,"57":57,"63":63,"66":66}],154:[function(_dereq_,module,exports){"use strict";var emptyFunction=_dereq_(114);var warning=emptyFunction;if("production"!=="development"){warning=function warning(condition,format){for(var args=[],$__0=2,$__1=arguments.length;$__0<$__1;$__0++){args.push(arguments[$__0]);}if(format===undefined){throw new Error('`warning(condition, format, ...args)` requires a warning '+'message argument');}if(format.length<10||/^[s\W]*$/.test(format)){throw new Error('The warning format should be able to uniquely identify this '+'warning. Please, use a more descriptive format than: '+format);}if(format.indexOf('Failed Composite propType: ')===0){return;}if(!condition){var argIndex=0;var message='Warning: '+format.replace(/%s/g,function(){return args[argIndex++];});console.warn(message);try{throw new Error(message);}catch(x){}}};}module.exports=warning;},{"114":114}]},{},[1])(1);});

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
        this.fname = this.chance.first({ gender: 'male' });
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
            return React.createElement("div", { className: "army" }, React.createElement("p", { className: "date" }, army.HQ.realDate), React.createElement("div", null, React.createElement(VPlayer, { player: army.HQ.player, engine: engine }), React.createElement(VInspected, { officer: army.HQ.findInspected(), engine: engine })), React.createElement(VUnit, { officer: army.HQ.player, engine: engine }), React.createElement(VStructure, { units: army.units.corps, engine: engine }));
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
            var engine = this.props.engine;
            if (engine) engine.actions.inspect(commander[0].id);
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
            return React.createElement("div", null, React.createElement("div", { className: units[0].type + ' ' + units[0].isRed }, React.createElement("div", { onClick: this.inspect.bind(this, [units[0].commander]) }, units[0].name), React.createElement(VStructure, { units: units[0].subunits, engine: this.state.engine })), React.createElement("div", { className: units[1].type + ' ' + units[1].isRed }, React.createElement("div", { onClick: this.inspect.bind(this, [units[1].commander]) }, units[1].name), React.createElement(VStructure, { units: units[1].subunits, engine: this.state.engine })));
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
            return React.createElement("div", { className: "player" }, React.createElement("div", { onClick: this.inspect.bind(this) }, player.name()), React.createElement("div", null, this.state.engine.army.HQ.findUnitById(player.unitId).name), React.createElement(VStats, { officer: player, engine: this.state.engine }), React.createElement(VStaff, { officer: player, engine: this.state.engine }));
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
        key: "target",
        value: function target() {
            if (this.props.engine) this.props.engine.actions.target(this.props.officer.id);
        }
    }, {
        key: "render",
        value: function render() {
            if (!this.props.officer) return React.createElement("div", null);
            var army = this.state.engine.army;
            var officer = this.props.officer;
            var engine = this.state.engine;
            var superior = army.HQ.findCommandingOfficer(officer);
            var superiorHTML = !officer.reserved && !officer.isPlayer && officer.rank.hierarchy < 7 ? React.createElement("div", { className: "superior" }, React.createElement("div", null, "Commanding Officer"), React.createElement(VOfficer, { officer: superior, engine: engine })) : React.createElement("div", null);
            var headerHTML = !officer.isPlayer ? React.createElement("div", { onClick: this.target.bind(this) }, React.createElement("h1", null, "Officer"), React.createElement(VOfficer, { officer: officer, engine: engine }), React.createElement(VStats, { officer: officer, engine: engine })) : React.createElement("div", null);
            return React.createElement("div", { className: "inspected" }, headerHTML, superiorHTML, React.createElement(VHistory, { officer: officer, engine: this.state.engine }));
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
                staff.push(React.createElement("li", null, React.createElement(VOfficer, { officer: officer, engine: _this8.state.engine })));
            });
            var superiorHTML = !this.state.officer.reserved ? React.createElement("div", null, React.createElement("div", null, "Commanding Officer"), React.createElement(VOfficer, { officer: superior, engine: this.state.engine })) : null;
            var staffHTML = staff.length && !this.state.officer.reserved ? React.createElement("div", null, superiorHTML, React.createElement("h2", null, "Staff"), React.createElement("ul", { className: "staff" }, staff)) : React.createElement("div", null, superiorHTML);
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
            var html;
            if (this.props.officer) {
                html = React.createElement("div", null, React.createElement("div", { onClick: this.inspect.bind(this) }, this.props.officer.name()));
            } else {
                html = React.createElement("div", null);
            }
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
            var html;
            if (this.props.officer) {
                html = React.createElement("div", { className: "stats" }, React.createElement("div", null, "INT ", this.props.officer.intelligence), React.createElement("div", null, "MIL ", this.props.officer.commanding), React.createElement("div", null, "DIP ", this.props.officer.diplomacy));
            } else {
                html = React.createElement("div", { className: "stats" });
            }
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
                    history.push(React.createElement("li", { className: "log" }, event));
                });
            }
            var html = this.props.officer ? React.createElement("div", { className: "history" }, React.createElement("div", null, "Record"), React.createElement("ul", null, history)) : React.createElement("div", null);
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
            var targetId = this.state.target.id;
            var spec = {
                name: this.state.name,
                type: this.state.type,
                officer: army.HQ.findOfficerById(staffOfficerId),
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
        key: "handleClickTarget",
        value: function handleClickTarget() {
            this.setState({ target: this.state.engine.army.HQ.target });
        }
    }, {
        key: "handleSearch",
        value: function handleSearch(event, selected) {
            if (!selected) {
                this.state.engine.army.HQ.target = undefined;
                this.setState({ targets: this.state.engine.army.HQ.findOfficersByName(event.target.value) });
            } else {
                this.setState({ targets: this.state.engine.army.HQ.findOfficersByName(selected) });
            }
        }
    }, {
        key: "componentDidUpdate",
        value: function componentDidUpdate(prevProps, prevState) {
            if (prevState.target && this.state.engine.army.HQ.target && this.state.engine.army.HQ.target.lname !== prevState.target.lname) {
                this.handleSearch(undefined, this.state.engine.army.HQ.target.name());
            } else if (this.state.engine.army.HQ.target && !prevState.target) {
                this.handleSearch(undefined, this.state.engine.army.HQ.target.name());
            }
            this.state.target = this.state.engine.army.HQ.target;
        }
    }, {
        key: "render",
        value: function render() {
            var army = this.state.engine.army;
            var player = this.state.player;
            var targets = this.state.targets ? this.state.targets : army.HQ.findActiveOfficers();
            var types = ['commanding', 'intelligence', 'diplomacy'];
            var staff = army.HQ.findOperationalStaff(player, self);
            var operationTypes = [];
            var officers = [];
            var staffOfficers = [];
            var selectedTarget = this.state.target && this.state.target.name ? this.state.target.name() : '';
            types.forEach(function (type) {
                operationTypes.push(React.createElement("option", null, type));
            });
            staff.forEach(function (officer) {
                staffOfficers.push(React.createElement("option", { value: [officer.id, player.unitId] }, officer.name()));
            });
            if (!this.state.target) {
                targets.forEach(function (target) {
                    officers.push(React.createElement("option", { value: target.id }, target.name()));
                });
            } else if (this.state.target && this.state.target.name) {
                officers.push(React.createElement("option", { value: this.state.target.id }, this.state.target.name()));
            }
            operationTypes.unshift(React.createElement("option", null));
            officers.unshift(React.createElement("option", null));
            staffOfficers.unshift(React.createElement("option", null));
            return React.createElement("div", { className: "unit" }, React.createElement("h1", null, "Headquarters"), React.createElement("div", null, "Operation name"), React.createElement("input", { onChange: this.handleName.bind(this) }), React.createElement("div", null, "Type"), React.createElement("select", { id: "operationType", onChange: this.handleType.bind(this) }, operationTypes), React.createElement("div", null, "Commander"), React.createElement("select", { id: "operationOfficer", onChange: this.handleOfficer.bind(this) }, staffOfficers), React.createElement("div", null, "Target"), React.createElement("input", { type: "text", value: selectedTarget, onChange: this.handleSearch.bind(this) }), React.createElement("select", { id: "operationTarget", onChange: this.handleTarget.bind(this) }, officers), React.createElement("button", { onClick: this.startOperation.bind(this) }, "Start Operation"));
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
