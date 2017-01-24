(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Actions = function () {
    function Actions(engine) {
        _classCallCheck(this, Actions);

        this.HQ = engine.army.HQ;
    }

    _createClass(Actions, [{
        key: "inspect",
        value: function inspect(officerId) {
            this.HQ.inspectOfficer(officerId);
            engine.update();
            engine.updateUI();
        }
    }]);

    return Actions;
}();

exports.default = Actions;

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _hq = require('./hq');

var _hq2 = _interopRequireDefault(_hq);

var _unit = require('./unit');

var _unit2 = _interopRequireDefault(_unit);

var _world = require('./world');

var _world2 = _interopRequireDefault(_world);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Army = function () {
  function Army() {
    _classCallCheck(this, Army);

    this.HQ = new _hq2.default();

    this._unitsId = 2;
    this.units = {
      corps: []
    };

    this.id = 1;
    this.generate('corp', _config2.default.unitDepth);
    this.HQ.world = new _world2.default(this.HQ);
  }

  _createClass(Army, [{
    key: 'generate',
    value: function generate(type, quantity, parent) {
      if (quantity === 0) {
        return;
      } else {
        var spec = {
          id: this._unitsId,
          type: type
        };

        var unit = {};
        this._unitsId++;
        spec.parentId = parent ? parent.id : 1;

        switch (type) {
          case 'corp':
            spec.rank = 'lgeneral';
            unit = new _unit2.default(spec, this.HQ);
            this.units.corps.push(unit);

            this.generate('division', _config2.default.unitDepth, unit);
            this.generate('corp', quantity - 1, parent);
            break;

          case 'division':
            spec.rank = 'dgeneral';
            unit = new _unit2.default(spec, this.HQ);
            parent.subunits.push(unit);

            this.generate('brigade', _config2.default.unitDepth, unit);
            this.generate('division', quantity - 1, parent);
            break;

          case 'brigade':
            spec.rank = 'bgeneral';
            unit = new _unit2.default(spec, this.HQ);
            parent.subunits.push(unit);

            this.generate('regiment', _config2.default.unitDepth, unit);
            this.generate('brigade', quantity - 1, parent);
            break;

          case 'regiment':
            spec.rank = 'coronel';
            unit = new _unit2.default(spec, this.HQ);
            parent.subunits.push(unit);

            this.generate('battalion', _config2.default.unitDepth, unit);
            this.generate('regiment', quantity - 1, parent);
            break;

          case 'battalion':
            spec.rank = 'lcoronel';
            unit = new _unit2.default(spec, this.HQ);
            parent.subunits.push(unit);

            this.generate('company', _config2.default.unitDepth, unit);
            this.generate('battalion', quantity - 1, parent);
            break;

          case 'company':
            spec.rank = 'major';
            unit = new _unit2.default(spec, this.HQ);
            parent.subunits.push(unit);

            this.generate('platoon', _config2.default.unitDepth, unit);
            this.generate('company', quantity - 1, parent);
            break;

          case 'platoon':
            spec.rank = 'captain';
            unit = new _unit2.default(spec, this.HQ);
            parent.subunits.push(unit);

            this.generate('squad', _config2.default.unitDepth, unit);
            this.generate('platoon', quantity - 1, parent);
            break;

          case 'squad':
            spec.rank = 'lieutenant';
            unit = new _unit2.default(spec, this.HQ);
            parent.subunits.push(unit);

            this.generate('squad', quantity - 1, parent);
            break;
        }

        this.HQ.add(unit);
      }
    }
  }]);

  return Army;
}();

exports.default = Army;

},{"./config":4,"./hq":7,"./unit":20,"./world":21}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Comparisons = function () {
  function Comparisons() {
    _classCallCheck(this, Comparisons);
  }

  _createClass(Comparisons, [{
    key: 'byExperience',
    value: function byExperience(a, b) {
      if (a.experience > b.experience) {
        return -1;
      } else if (a.experience < b.experience) {
        return 1;
      }
      return 0;
    }
  }]);

  return Comparisons;
}();

exports.default = Comparisons;

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var config = {
  promoted: function promoted(promotion) {
    var message = 'Promoted to ' + this.ranks[promotion.rank].title + ' on ' + promotion.date + ', assigned to the ' + promotion.unit;

    return message;
  },
  graduated: function graduated(graduation, officer) {
    var when = '';

    if (graduation.date && graduation.unit) {
      when = ' on ' + graduation.date + ', assigned to the ' + graduation.unit;
    }

    var message = 'Graduated from ' + officer.traits.base.school + when;
    return message;
  },
  suffix: function suffix(i) {
    var j = i % 10,
        k = i % 100;
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
  formatDate: function formatDate(rawDate) {
    var realDate = void 0;
    realDate = rawDate.toFormat('DDDD the D of MMMM, YYYY');
    realDate = realDate.split(' ');
    realDate[2] = rawDate.toFormat('D') + config.suffix(rawDate.toFormat('D'));
    realDate = realDate.join(' ');
    return realDate;
  },
  random: function random(n) {
    return Math.round(Math.random() * n);
  },


  speed: 200,

  bufferTurns: 100,

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
      startxp: 10,
      maxxp: 40,
      startpr: 100
    },
    captain: {
      hierarchy: 1,
      title: 'Captain',
      alias: 'captain',
      startxp: 40,
      maxxp: 60,
      startpr: 200
    },
    major: {
      hierarchy: 2,
      title: 'Major',
      alias: 'major',
      startxp: 60,
      maxxp: 80,
      startpr: 300
    },
    lcoronel: {
      hierarchy: 3,
      title: 'Lieutenant Coronel',
      alias: 'lcoronel',
      startxp: 80,
      maxxp: 100,
      startpr: 400
    },
    coronel: {
      hierarchy: 4,
      title: 'Coronel',
      alias: 'coronel',
      startxp: 100,
      maxxp: 120,
      startpr: 500
    },
    bgeneral: {
      hierarchy: 5,
      title: 'Brigade General',
      alias: 'bgeneral',
      startxp: 120,
      maxxp: 140,
      startpr: 600
    },
    dgeneral: {
      hierarchy: 6,
      title: 'Division General',
      alias: 'dgeneral',
      startxp: 140,
      maxxp: 160,
      startpr: 700
    },
    lgeneral: {
      hierarchy: 7,
      title: 'Lieutenant General',
      alias: 'lgeneral',
      startxp: 160,
      maxxp: 180,
      startpr: 800
    },
    general: {
      hierarchy: 8,
      title: 'General',
      alias: 'general',
      startxp: 180,
      maxxp: 220,
      startpr: 900
    }
  }
};

exports.default = config;

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _uiGame = require('./ui-game.jsx');

var _uiGame2 = _interopRequireDefault(_uiGame);

var _actions = require('./actions');

var _actions2 = _interopRequireDefault(_actions);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Engine = function () {
  function Engine(army) {
    _classCallCheck(this, Engine);

    this.army = army;
    this.ui = new _uiGame2.default(this);
    this.actions = new _actions2.default(this);
    this.turn = 0;
    this.running = true;
    this.start(this);
  }

  _createClass(Engine, [{
    key: 'start',
    value: function start() {
      this.update();
      this.army.HQ.player();
      this.updateUI();
    }
  }, {
    key: 'pause',
    value: function pause() {
      this.running = !this.running;
      if (this.running) this.update();
      if (this.running) this.updateUI();
    }
  }, {
    key: 'update',
    value: function update() {
      var _this = this;

      while (this.turn < _config2.default.bufferTurns) {
        this.army.HQ.update();
        this.turn++;
      }

      this.army.HQ.update();
      this.turn++;

      if (this.running) {
        this.gameLoop = setTimeout(function () {
          _this.update();
        }, _config2.default.speed);
      }
    }
  }, {
    key: 'updateUI',
    value: function updateUI() {
      var _this2 = this;

      this.ui.render(this.army);
      if (this.running) {
        this.UILoop = setTimeout(function () {
          _this2.updateUI();
        }, _config2.default.speed);
      }
    }
  }]);

  return Engine;
}();

exports.default = Engine;

},{"./actions":1,"./config":4,"./ui-game.jsx":19}],6:[function(require,module,exports){
'use strict';

var _engine = require('./engine');

var _engine2 = _interopRequireDefault(_engine);

var _army = require('./army');

var _army2 = _interopRequireDefault(_army);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.army = new _army2.default();
window.engine = new _engine2.default(army);

},{"./army":2,"./engine":5}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('./lib/date.js');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _operations = require('./operations');

var _operations2 = _interopRequireDefault(_operations);

var _officers = require('./officers');

var _officers2 = _interopRequireDefault(_officers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HQ = function () {
  function HQ() {
    _classCallCheck(this, HQ);

    this.operations = new _operations2.default();
    this.rawDate = new Date();
    this.units = [];
    this.officers = new _officers2.default(this);
  }

  _createClass(HQ, [{
    key: 'updateDate',
    value: function updateDate() {
      this.rawDate = this.rawDate.addDays(_config2.default.random(150));
      this.realDate = _config2.default.formatDate(this.rawDate);
    }
  }, {
    key: 'update',
    value: function update() {
      this.updateDate();
      this.units.map(this.reserve.bind(this));
      this.operations.update(this);
      this.officers.update(this);
      this.officers.reserve();
    }
  }, {
    key: 'player',
    value: function player() {
      var squads = this.findUnitsByType('squad');
      var unit = squads[_config2.default.random(squads.length) + 1];
      unit.commander.reserved = true;
      unit.commander = this.officers.replaceForPlayer.call(this, unit.commander);
      this.player = unit.commander;
    }
  }, {
    key: 'findOfficersByName',
    value: function findOfficersByName(name) {
      return this.officers.active.filter(function (officer) {
        return officer.name().toLowerCase().includes(name.toLowerCase());
      });
    }
  }, {
    key: 'findUnitsByType',
    value: function findUnitsByType(type) {
      return this.units.filter(function (unit) {
        return unit.type === type;
      });
    }
  }, {
    key: 'findUnitById',
    value: function findUnitById(id) {
      return this.units.filter(function (unit) {
        return unit.id === id;
      })[0];
    }
  }, {
    key: 'findCommandingOfficer',
    value: function findCommandingOfficer(officer) {
      var officerUnit = this.units.filter(function (unit) {
        return unit.id === officer.unitId;
      })[0];
      var superiorUnit = this.units.filter(function (unit) {
        return officerUnit && unit.id === officerUnit.parentId;
      })[0];
      if (!superiorUnit) return { name: function name() {
          return 'No name';
        } };
      return superiorUnit.commander;
    }
  }, {
    key: 'findOfficerById',
    value: function findOfficerById(officerId) {
      return this.officers.pool.filter(function (officer) {
        return officer.id === Number(officerId);
      })[0];
    }
  }, {
    key: 'inspectOfficer',
    value: function inspectOfficer(officerId) {
      var officer = this.findOfficerById(officerId);
      this.officers.inspected = officer;
      return officer;
    }
  }, {
    key: 'findStaffById',
    value: function findStaffById(officerId, playerUnitId) {
      var unit = this.units.filter(function (unit) {
        return unit.id === Number(playerUnitId);
      })[0];
      return unit.reserve.filter(function (officer) {
        return officer.id === Number(officerId);
      })[0];
    }
  }, {
    key: 'findStaff',
    value: function findStaff(officer) {
      var staff = [];
      var unit = this.units.filter(function (unit) {
        return unit.id === officer.unitId;
      })[0];
      if (unit && unit.reserve) unit.reserve.forEach(function (officer) {
        if (!officer.isPLayer) staff.push(officer);
      });
      return staff;
    }
  }, {
    key: 'findSubordinates',
    value: function findSubordinates(officer) {
      var subordinates = [];
      var unit = this.units.filter(function (unit) {
        return unit.id === officer.unitId;
      })[0];
      if (unit && unit.subunits) unit.subunits.forEach(function (subunit) {
        subordinates.push(subunit.commander);
      });
      return subordinates;
    }
  }, {
    key: 'findInspected',
    value: function findInspected() {
      return this.officers.inspected;
    }
  }, {
    key: 'findOfficersByRank',
    value: function findOfficersByRank(rank) {
      return this.officers.active.filter(function (officer) {
        return officer.rank === rank;
      });
    }
  }, {
    key: 'findActiveOfficers',
    value: function findActiveOfficers() {
      return this.officers.active;
    }
  }, {
    key: 'add',
    value: function add(unit) {
      this.units.push(unit);
    }
  }, {
    key: 'reserve',
    value: function reserve(unit) {
      if (unit.commander.reserved) this.replace(unit);
    }
  }, {
    key: 'replace',
    value: function replace(unit) {
      unit.commander = this.officers.replace.call(this, unit.commander);
    }
  }, {
    key: 'deassign',
    value: function deassign(id) {
      this.replace(this.units.filter(function (unit) {
        return unit.id === id;
      })[0]);
    }
  }, {
    key: 'inspect',
    value: function inspect(officer) {
      this.officers.inspected = officer;
    }
  }, {
    key: 'unitName',
    value: function unitName(unitId, _unitName) {
      var result = this.units.filter(function (unit) {
        return unit.id === unitId;
      })[0];
      if (!result) return _unitName;
      return result.name;
    }
  }]);

  return HQ;
}();

exports.default = HQ;

},{"./config":4,"./lib/date.js":9,"./officers":13,"./operations":14}],8:[function(require,module,exports){
(function (Buffer){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

!function () {
  function a(b) {
    if (!(this instanceof a)) return null == b ? new a() : new a(b);if ("function" == typeof b) return this.random = b, this;var c;arguments.length && (this.seed = 0);for (var d = 0; d < arguments.length; d++) {
      if (c = 0, "string" == typeof arguments[d]) for (var e = 0; e < arguments[d].length; e++) {
        c += (arguments[d].length - e) * arguments[d].charCodeAt(e);
      } else c = arguments[d];this.seed += (arguments.length - d) * c;
    }return this.mt = this.mersenne_twister(this.seed), this.bimd5 = this.blueimp_md5(), this.random = function () {
      return this.mt.random(this.seed);
    }, this;
  }function b(a, b) {
    if (a || (a = {}), b) for (var c in b) {
      "undefined" == typeof a[c] && (a[c] = b[c]);
    }return a;
  }function c(a, b) {
    if (a) throw new RangeError(b);
  }function d(a) {
    return function () {
      return this.natural(a);
    };
  }function e(a, b) {
    for (var c, d = r(a), e = 0, f = d.length; f > e; e++) {
      c = d[e], b[c] = a[c] || b[c];
    }
  }function f(a, b) {
    for (var c = 0, d = a.length; d > c; c++) {
      b[c] = a[c];
    }
  }function g(a, b) {
    var c = Array.isArray(a),
        d = b || (c ? new Array(a.length) : {});return c ? f(a, d) : e(a, d), d;
  }var h = 9007199254740992,
      i = -h,
      j = "0123456789",
      k = "abcdefghijklmnopqrstuvwxyz",
      l = k.toUpperCase(),
      m = j + "abcdef",
      n = Array.prototype.slice;a.prototype.VERSION = "0.7.6";var o = function o() {
    throw new Error("No Base64 encoder available.");
  };!function () {
    "function" == typeof btoa ? o = btoa : "function" == typeof Buffer && (o = function o(a) {
      return new Buffer(a).toString("base64");
    });
  }(), a.prototype.bool = function (a) {
    return a = b(a, { likelihood: 50 }), c(a.likelihood < 0 || a.likelihood > 100, "Chance: Likelihood accepts values from 0 to 100."), 100 * this.random() < a.likelihood;
  }, a.prototype.character = function (a) {
    a = b(a), c(a.alpha && a.symbols, "Chance: Cannot specify both alpha and symbols.");var d,
        e,
        f = "!@#$%^&*()[]";return d = "lower" === a.casing ? k : "upper" === a.casing ? l : k + l, e = a.pool ? a.pool : a.alpha ? d : a.symbols ? f : d + j + f, e.charAt(this.natural({ max: e.length - 1 }));
  }, a.prototype.floating = function (a) {
    a = b(a, { fixed: 4 }), c(a.fixed && a.precision, "Chance: Cannot specify both fixed and precision.");var d,
        e = Math.pow(10, a.fixed),
        f = h / e,
        g = -f;c(a.min && a.fixed && a.min < g, "Chance: Min specified is out of range with fixed. Min should be, at least, " + g), c(a.max && a.fixed && a.max > f, "Chance: Max specified is out of range with fixed. Max should be, at most, " + f), a = b(a, { min: g, max: f }), d = this.integer({ min: a.min * e, max: a.max * e });var i = (d / e).toFixed(a.fixed);return parseFloat(i);
  }, a.prototype.integer = function (a) {
    return a = b(a, { min: i, max: h }), c(a.min > a.max, "Chance: Min cannot be greater than Max."), Math.floor(this.random() * (a.max - a.min + 1) + a.min);
  }, a.prototype.natural = function (a) {
    return a = b(a, { min: 0, max: h }), c(a.min < 0, "Chance: Min cannot be less than zero."), this.integer(a);
  }, a.prototype.string = function (a) {
    a = b(a, { length: this.natural({ min: 5, max: 20 }) }), c(a.length < 0, "Chance: Length cannot be less than zero.");var d = a.length,
        e = this.n(this.character, d, a);return e.join("");
  }, a.prototype.capitalize = function (a) {
    return a.charAt(0).toUpperCase() + a.substr(1);
  }, a.prototype.mixin = function (b) {
    for (var c in b) {
      a.prototype[c] = b[c];
    }return this;
  }, a.prototype.unique = function (a, d, e) {
    c("function" != typeof a, "Chance: The first argument must be a function."), e = b(e, { comparator: function comparator(a, b) {
        return -1 !== a.indexOf(b);
      } });for (var f, g = [], h = 0, i = 50 * d, j = n.call(arguments, 2); g.length < d;) {
      if (f = a.apply(this, j), e.comparator(g, f) || (g.push(f), h = 0), ++h > i) throw new RangeError("Chance: num is likely too large for sample set");
    }return g;
  }, a.prototype.n = function (a, b) {
    c("function" != typeof a, "Chance: The first argument must be a function."), "undefined" == typeof b && (b = 1);var d = b,
        e = [],
        f = n.call(arguments, 2);for (d = Math.max(0, d), null; d--; null) {
      e.push(a.apply(this, f));
    }return e;
  }, a.prototype.pad = function (a, b, c) {
    return c = c || "0", a += "", a.length >= b ? a : new Array(b - a.length + 1).join(c) + a;
  }, a.prototype.pick = function (a, b) {
    if (0 === a.length) throw new RangeError("Chance: Cannot pick() from an empty array");return b && 1 !== b ? this.shuffle(a).slice(0, b) : a[this.natural({ max: a.length - 1 })];
  }, a.prototype.shuffle = function (a) {
    for (var b = a.slice(0), c = [], d = 0, e = Number(b.length), f = 0; e > f; f++) {
      d = this.natural({ max: b.length - 1 }), c[f] = b[d], b.splice(d, 1);
    }return c;
  }, a.prototype.weighted = function (a, b) {
    if (a.length !== b.length) throw new RangeError("Chance: length of array and weights must match");for (var c = b.length - 1; c >= 0; --c) {
      b[c] <= 0 && (a.splice(c, 1), b.splice(c, 1));
    }if (b.some(function (a) {
      return 1 > a;
    })) {
      var d = b.reduce(function (a, b) {
        return a > b ? b : a;
      }, b[0]),
          e = 1 / d;b = b.map(function (a) {
        return a * e;
      });
    }var f,
        g = b.reduce(function (a, b) {
      return a + b;
    }, 0),
        h = this.natural({ min: 1, max: g }),
        i = 0;return b.some(function (b, c) {
      return i + b >= h ? (f = a[c], !0) : (i += b, !1);
    }), f;
  }, a.prototype.paragraph = function (a) {
    a = b(a);var c = a.sentences || this.natural({ min: 3, max: 7 }),
        d = this.n(this.sentence, c);return d.join(" ");
  }, a.prototype.sentence = function (a) {
    a = b(a);var c,
        d = a.words || this.natural({ min: 12, max: 18 }),
        e = this.n(this.word, d);return c = e.join(" "), c = this.capitalize(c) + ".";
  }, a.prototype.syllable = function (a) {
    a = b(a);for (var c, d = a.length || this.natural({ min: 2, max: 3 }), e = "bcdfghjklmnprstvwz", f = "aeiou", g = e + f, h = "", i = 0; d > i; i++) {
      c = this.character(0 === i ? { pool: g } : -1 === e.indexOf(c) ? { pool: e } : { pool: f }), h += c;
    }return h;
  }, a.prototype.word = function (a) {
    a = b(a), c(a.syllables && a.length, "Chance: Cannot specify both syllables AND length.");var d = a.syllables || this.natural({ min: 1, max: 3 }),
        e = "";if (a.length) {
      do {
        e += this.syllable();
      } while (e.length < a.length);e = e.substring(0, a.length);
    } else for (var f = 0; d > f; f++) {
      e += this.syllable();
    }return e;
  }, a.prototype.age = function (a) {
    a = b(a);var c;switch (a.type) {case "child":
        c = { min: 1, max: 12 };break;case "teen":
        c = { min: 13, max: 19 };break;case "adult":
        c = { min: 18, max: 65 };break;case "senior":
        c = { min: 65, max: 100 };break;case "all":
        c = { min: 1, max: 100 };break;default:
        c = { min: 18, max: 65 };}return this.natural(c);
  }, a.prototype.birthday = function (a) {
    return a = b(a, { year: new Date().getFullYear() - this.age(a) }), this.date(a);
  }, a.prototype.cpf = function () {
    var a = this.n(this.natural, 9, { max: 9 }),
        b = 2 * a[8] + 3 * a[7] + 4 * a[6] + 5 * a[5] + 6 * a[4] + 7 * a[3] + 8 * a[2] + 9 * a[1] + 10 * a[0];b = 11 - b % 11, b >= 10 && (b = 0);var c = 2 * b + 3 * a[8] + 4 * a[7] + 5 * a[6] + 6 * a[5] + 7 * a[4] + 8 * a[3] + 9 * a[2] + 10 * a[1] + 11 * a[0];return c = 11 - c % 11, c >= 10 && (c = 0), "" + a[0] + a[1] + a[2] + "." + a[3] + a[4] + a[5] + "." + a[6] + a[7] + a[8] + "-" + b + c;
  }, a.prototype.first = function (a) {
    return a = b(a, { gender: this.gender() }), this.pick(this.get("firstNames")[a.gender.toLowerCase()]);
  }, a.prototype.gender = function () {
    return this.pick(["Male", "Female"]);
  }, a.prototype.last = function () {
    return this.pick(this.get("lastNames"));
  }, a.prototype.mrz = function (a) {
    var c = function c(a) {
      var b = "<ABCDEFGHIJKLMNOPQRSTUVWXYXZ".split(""),
          c = [7, 3, 1],
          d = 0;return "string" != typeof a && (a = a.toString()), a.split("").forEach(function (a, e) {
        var f = b.indexOf(a);a = -1 !== f ? 0 === f ? 0 : f + 9 : parseInt(a, 10), a *= c[e % c.length], d += a;
      }), d % 10;
    },
        d = function d(a) {
      var b = function b(a) {
        return new Array(a + 1).join("<");
      },
          d = ["P<", a.issuer, a.last.toUpperCase(), "<<", a.first.toUpperCase(), b(39 - (a.last.length + a.first.length + 2)), a.passportNumber, c(a.passportNumber), a.nationality, a.dob, c(a.dob), a.gender, a.expiry, c(a.expiry), b(14), c(b(14))].join("");return d + c(d.substr(44, 10) + d.substr(57, 7) + d.substr(65, 7));
    },
        e = this;return a = b(a, { first: this.first(), last: this.last(), passportNumber: this.integer({ min: 1e8, max: 999999999 }), dob: function () {
        var a = e.birthday({ type: "adult" });return [a.getFullYear().toString().substr(2), e.pad(a.getMonth() + 1, 2), e.pad(a.getDate(), 2)].join("");
      }(), expiry: function () {
        var a = new Date();return [(a.getFullYear() + 5).toString().substr(2), e.pad(a.getMonth() + 1, 2), e.pad(a.getDate(), 2)].join("");
      }(), gender: "Female" === this.gender() ? "F" : "M", issuer: "GBR", nationality: "GBR" }), d(a);
  }, a.prototype.name = function (a) {
    a = b(a);var c,
        d = this.first(a),
        e = this.last();return c = a.middle ? d + " " + this.first(a) + " " + e : a.middle_initial ? d + " " + this.character({ alpha: !0, casing: "upper" }) + ". " + e : d + " " + e, a.prefix && (c = this.prefix(a) + " " + c), a.suffix && (c = c + " " + this.suffix(a)), c;
  }, a.prototype.name_prefixes = function (a) {
    a = a || "all", a = a.toLowerCase();var b = [{ name: "Doctor", abbreviation: "Dr." }];return ("male" === a || "all" === a) && b.push({ name: "Mister", abbreviation: "Mr." }), ("female" === a || "all" === a) && (b.push({ name: "Miss", abbreviation: "Miss" }), b.push({ name: "Misses", abbreviation: "Mrs." })), b;
  }, a.prototype.prefix = function (a) {
    return this.name_prefix(a);
  }, a.prototype.name_prefix = function (a) {
    return a = b(a, { gender: "all" }), a.full ? this.pick(this.name_prefixes(a.gender)).name : this.pick(this.name_prefixes(a.gender)).abbreviation;
  }, a.prototype.ssn = function (a) {
    a = b(a, { ssnFour: !1, dashes: !0 });var c,
        d = "1234567890",
        e = a.dashes ? "-" : "";return c = a.ssnFour ? this.string({ pool: d, length: 4 }) : this.string({ pool: d, length: 3 }) + e + this.string({ pool: d, length: 2 }) + e + this.string({ pool: d, length: 4 });
  }, a.prototype.name_suffixes = function () {
    var a = [{ name: "Doctor of Osteopathic Medicine", abbreviation: "D.O." }, { name: "Doctor of Philosophy", abbreviation: "Ph.D." }, { name: "Esquire", abbreviation: "Esq." }, { name: "Junior", abbreviation: "Jr." }, { name: "Juris Doctor", abbreviation: "J.D." }, { name: "Master of Arts", abbreviation: "M.A." }, { name: "Master of Business Administration", abbreviation: "M.B.A." }, { name: "Master of Science", abbreviation: "M.S." }, { name: "Medical Doctor", abbreviation: "M.D." }, { name: "Senior", abbreviation: "Sr." }, { name: "The Third", abbreviation: "III" }, { name: "The Fourth", abbreviation: "IV" }, { name: "Bachelor of Engineering", abbreviation: "B.E" }, { name: "Bachelor of Technology", abbreviation: "B.TECH" }];return a;
  }, a.prototype.suffix = function (a) {
    return this.name_suffix(a);
  }, a.prototype.name_suffix = function (a) {
    return a = b(a), a.full ? this.pick(this.name_suffixes()).name : this.pick(this.name_suffixes()).abbreviation;
  }, a.prototype.android_id = function () {
    return "APA91" + this.string({ pool: "0123456789abcefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_", length: 178 });
  }, a.prototype.apple_token = function () {
    return this.string({ pool: "abcdef1234567890", length: 64 });
  }, a.prototype.wp8_anid2 = function () {
    return o(this.hash({ length: 32 }));
  }, a.prototype.wp7_anid = function () {
    return "A=" + this.guid().replace(/-/g, "").toUpperCase() + "&E=" + this.hash({ length: 3 }) + "&W=" + this.integer({ min: 0, max: 9 });
  }, a.prototype.bb_pin = function () {
    return this.hash({ length: 8 });
  }, a.prototype.avatar = function (a) {
    var c = null,
        d = "//www.gravatar.com/avatar/",
        e = { http: "http", https: "https" },
        f = { bmp: "bmp", gif: "gif", jpg: "jpg", png: "png" },
        g = { 404: "404", mm: "mm", identicon: "identicon", monsterid: "monsterid", wavatar: "wavatar", retro: "retro", blank: "blank" },
        h = { g: "g", pg: "pg", r: "r", x: "x" },
        i = { protocol: null, email: null, fileExtension: null, size: null, fallback: null, rating: null };if (a) {
      if ("string" == typeof a) i.email = a, a = {};else {
        if ("object" != (typeof a === "undefined" ? "undefined" : _typeof(a))) return null;if ("Array" === a.constructor) return null;
      }
    } else i.email = this.email(), a = {};return i = b(a, i), i.email || (i.email = this.email()), i.protocol = e[i.protocol] ? i.protocol + ":" : "", i.size = parseInt(i.size, 0) ? i.size : "", i.rating = h[i.rating] ? i.rating : "", i.fallback = g[i.fallback] ? i.fallback : "", i.fileExtension = f[i.fileExtension] ? i.fileExtension : "", c = i.protocol + d + this.bimd5.md5(i.email) + (i.fileExtension ? "." + i.fileExtension : "") + (i.size || i.rating || i.fallback ? "?" : "") + (i.size ? "&s=" + i.size.toString() : "") + (i.rating ? "&r=" + i.rating : "") + (i.fallback ? "&d=" + i.fallback : "");
  }, a.prototype.color = function (a) {
    function c(a, b) {
      return [a, a, a].join(b || "");
    }a = b(a, { format: this.pick(["hex", "shorthex", "rgb", "rgba", "0x"]), grayscale: !1, casing: "lower" });var d,
        e = a.grayscale;if ("hex" === a.format) d = "#" + (e ? c(this.hash({ length: 2 })) : this.hash({ length: 6 }));else if ("shorthex" === a.format) d = "#" + (e ? c(this.hash({ length: 1 })) : this.hash({ length: 3 }));else if ("rgb" === a.format) d = e ? "rgb(" + c(this.natural({ max: 255 }), ",") + ")" : "rgb(" + this.natural({ max: 255 }) + "," + this.natural({ max: 255 }) + "," + this.natural({ max: 255 }) + ")";else if ("rgba" === a.format) d = e ? "rgba(" + c(this.natural({ max: 255 }), ",") + "," + this.floating({ min: 0, max: 1 }) + ")" : "rgba(" + this.natural({ max: 255 }) + "," + this.natural({ max: 255 }) + "," + this.natural({ max: 255 }) + "," + this.floating({ min: 0, max: 1 }) + ")";else {
      if ("0x" !== a.format) throw new RangeError('Invalid format provided. Please provide one of "hex", "shorthex", "rgb", "rgba", or "0x".');d = "0x" + (e ? c(this.hash({ length: 2 })) : this.hash({ length: 6 }));
    }return "upper" === a.casing && (d = d.toUpperCase()), d;
  }, a.prototype.domain = function (a) {
    return a = b(a), this.word() + "." + (a.tld || this.tld());
  }, a.prototype.email = function (a) {
    return a = b(a), this.word({ length: a.length }) + "@" + (a.domain || this.domain());
  }, a.prototype.fbid = function () {
    return parseInt("10000" + this.natural({ max: 1e11 }), 10);
  }, a.prototype.google_analytics = function () {
    var a = this.pad(this.natural({ max: 999999 }), 6),
        b = this.pad(this.natural({ max: 99 }), 2);return "UA-" + a + "-" + b;
  }, a.prototype.hashtag = function () {
    return "#" + this.word();
  }, a.prototype.ip = function () {
    return this.natural({ max: 255 }) + "." + this.natural({ max: 255 }) + "." + this.natural({ max: 255 }) + "." + this.natural({ max: 255 });
  }, a.prototype.ipv6 = function () {
    var a = this.n(this.hash, 8, { length: 4 });return a.join(":");
  }, a.prototype.klout = function () {
    return this.natural({ min: 1, max: 99 });
  }, a.prototype.tlds = function () {
    return ["com", "org", "edu", "gov", "co.uk", "net", "io"];
  }, a.prototype.tld = function () {
    return this.pick(this.tlds());
  }, a.prototype.twitter = function () {
    return "@" + this.word();
  }, a.prototype.url = function (a) {
    a = b(a, { protocol: "http", domain: this.domain(a), domain_prefix: "", path: this.word(), extensions: [] });var c = a.extensions.length > 0 ? "." + this.pick(a.extensions) : "",
        d = a.domain_prefix ? a.domain_prefix + "." + a.domain : a.domain;return a.protocol + "://" + d + "/" + a.path + c;
  }, a.prototype.address = function (a) {
    return a = b(a), this.natural({ min: 5, max: 2e3 }) + " " + this.street(a);
  }, a.prototype.altitude = function (a) {
    return a = b(a, { fixed: 5, min: 0, max: 8848 }), this.floating({ min: a.min, max: a.max, fixed: a.fixed });
  }, a.prototype.areacode = function (a) {
    a = b(a, { parens: !0 });var c = this.natural({ min: 2, max: 9 }).toString() + this.natural({ min: 0, max: 8 }).toString() + this.natural({ min: 0, max: 9 }).toString();return a.parens ? "(" + c + ")" : c;
  }, a.prototype.city = function () {
    return this.capitalize(this.word({ syllables: 3 }));
  }, a.prototype.coordinates = function (a) {
    return this.latitude(a) + ", " + this.longitude(a);
  }, a.prototype.countries = function () {
    return this.get("countries");
  }, a.prototype.country = function (a) {
    a = b(a);var c = this.pick(this.countries());return a.full ? c.name : c.abbreviation;
  }, a.prototype.depth = function (a) {
    return a = b(a, { fixed: 5, min: -2550, max: 0 }), this.floating({ min: a.min, max: a.max, fixed: a.fixed });
  }, a.prototype.geohash = function (a) {
    return a = b(a, { length: 7 }), this.string({ length: a.length, pool: "0123456789bcdefghjkmnpqrstuvwxyz" });
  }, a.prototype.geojson = function (a) {
    return this.latitude(a) + ", " + this.longitude(a) + ", " + this.altitude(a);
  }, a.prototype.latitude = function (a) {
    return a = b(a, { fixed: 5, min: -90, max: 90 }), this.floating({ min: a.min, max: a.max, fixed: a.fixed });
  }, a.prototype.longitude = function (a) {
    return a = b(a, { fixed: 5, min: -180, max: 180 }), this.floating({ min: a.min, max: a.max, fixed: a.fixed });
  }, a.prototype.phone = function (a) {
    var c,
        d = this,
        e = function e(a) {
      var b = [];return a.sections.forEach(function (a) {
        b.push(d.string({ pool: "0123456789", length: a }));
      }), a.area + b.join(" ");
    };a = b(a, { formatted: !0, country: "us", mobile: !1 }), a.formatted || (a.parens = !1);var f;switch (a.country) {case "fr":
        a.mobile ? (c = this.pick(["06", "07"]) + d.string({ pool: "0123456789", length: 8 }), f = a.formatted ? c.match(/../g).join(" ") : c) : (c = this.pick(["01" + this.pick(["30", "34", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "53", "55", "56", "58", "60", "64", "69", "70", "72", "73", "74", "75", "76", "77", "78", "79", "80", "81", "82", "83"]) + d.string({ pool: "0123456789", length: 6 }), "02" + this.pick(["14", "18", "22", "23", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "40", "41", "43", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "56", "57", "61", "62", "69", "72", "76", "77", "78", "85", "90", "96", "97", "98", "99"]) + d.string({ pool: "0123456789", length: 6 }), "03" + this.pick(["10", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "39", "44", "45", "51", "52", "54", "55", "57", "58", "59", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "70", "71", "72", "73", "80", "81", "82", "83", "84", "85", "86", "87", "88", "89", "90"]) + d.string({ pool: "0123456789", length: 6 }), "04" + this.pick(["11", "13", "15", "20", "22", "26", "27", "30", "32", "34", "37", "42", "43", "44", "50", "56", "57", "63", "66", "67", "68", "69", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "80", "81", "82", "83", "84", "85", "86", "88", "89", "90", "91", "92", "93", "94", "95", "97", "98"]) + d.string({ pool: "0123456789", length: 6 }), "05" + this.pick(["08", "16", "17", "19", "24", "31", "32", "33", "34", "35", "40", "45", "46", "47", "49", "53", "55", "56", "57", "58", "59", "61", "62", "63", "64", "65", "67", "79", "81", "82", "86", "87", "90", "94"]) + d.string({ pool: "0123456789", length: 6 }), "09" + d.string({ pool: "0123456789", length: 8 })]), f = a.formatted ? c.match(/../g).join(" ") : c);break;case "uk":
        a.mobile ? (c = this.pick([{ area: "07" + this.pick(["4", "5", "7", "8", "9"]), sections: [2, 6] }, { area: "07624 ", sections: [6] }]), f = a.formatted ? e(c) : e(c).replace(" ", "")) : (c = this.pick([{ area: "01" + this.character({ pool: "234569" }) + "1 ", sections: [3, 4] }, { area: "020 " + this.character({ pool: "378" }), sections: [3, 4] }, { area: "023 " + this.character({ pool: "89" }), sections: [3, 4] }, { area: "024 7", sections: [3, 4] }, { area: "028 " + this.pick(["25", "28", "37", "71", "82", "90", "92", "95"]), sections: [2, 4] }, { area: "012" + this.pick(["04", "08", "54", "76", "97", "98"]) + " ", sections: [5] }, { area: "013" + this.pick(["63", "64", "84", "86"]) + " ", sections: [5] }, { area: "014" + this.pick(["04", "20", "60", "61", "80", "88"]) + " ", sections: [5] }, { area: "015" + this.pick(["24", "27", "62", "66"]) + " ", sections: [5] }, { area: "016" + this.pick(["06", "29", "35", "47", "59", "95"]) + " ", sections: [5] }, { area: "017" + this.pick(["26", "44", "50", "68"]) + " ", sections: [5] }, { area: "018" + this.pick(["27", "37", "84", "97"]) + " ", sections: [5] }, { area: "019" + this.pick(["00", "05", "35", "46", "49", "63", "95"]) + " ", sections: [5] }]), f = a.formatted ? e(c) : e(c).replace(" ", "", "g"));break;case "us":
        var g = this.areacode(a).toString(),
            h = this.natural({ min: 2, max: 9 }).toString() + this.natural({ min: 0, max: 9 }).toString() + this.natural({ min: 0, max: 9 }).toString(),
            i = this.natural({ min: 1e3, max: 9999 }).toString();f = a.formatted ? g + " " + h + "-" + i : g + h + i;}return f;
  }, a.prototype.postal = function () {
    var a = this.character({ pool: "XVTSRPNKLMHJGECBA" }),
        b = a + this.natural({ max: 9 }) + this.character({ alpha: !0, casing: "upper" }),
        c = this.natural({ max: 9 }) + this.character({ alpha: !0, casing: "upper" }) + this.natural({ max: 9 });return b + " " + c;
  }, a.prototype.provinces = function () {
    return this.get("provinces");
  }, a.prototype.province = function (a) {
    return a && a.full ? this.pick(this.provinces()).name : this.pick(this.provinces()).abbreviation;
  }, a.prototype.state = function (a) {
    return a && a.full ? this.pick(this.states(a)).name : this.pick(this.states(a)).abbreviation;
  }, a.prototype.states = function (a) {
    a = b(a);var c,
        d = this.get("us_states_and_dc"),
        e = this.get("territories"),
        f = this.get("armed_forces");return c = d, a.territories && (c = c.concat(e)), a.armed_forces && (c = c.concat(f)), c;
  }, a.prototype.street = function (a) {
    a = b(a);var c = this.word({ syllables: 2 });return c = this.capitalize(c), c += " ", c += a.short_suffix ? this.street_suffix().abbreviation : this.street_suffix().name;
  }, a.prototype.street_suffix = function () {
    return this.pick(this.street_suffixes());
  }, a.prototype.street_suffixes = function () {
    return this.get("street_suffixes");
  }, a.prototype.zip = function (a) {
    var b = this.n(this.natural, 5, { max: 9 });return a && a.plusfour === !0 && (b.push("-"), b = b.concat(this.n(this.natural, 4, { max: 9 }))), b.join("");
  }, a.prototype.ampm = function () {
    return this.bool() ? "am" : "pm";
  }, a.prototype.date = function (a) {
    var c, d;if (a && (a.min || a.max)) {
      a = b(a, { american: !0, string: !1 });var e = "undefined" != typeof a.min ? a.min.getTime() : 1,
          f = "undefined" != typeof a.max ? a.max.getTime() : 864e13;d = new Date(this.natural({ min: e, max: f }));
    } else {
      var g = this.month({ raw: !0 }),
          h = g.days;a && a.month && (h = this.get("months")[(a.month % 12 + 12) % 12].days), a = b(a, { year: parseInt(this.year(), 10), month: g.numeric - 1, day: this.natural({ min: 1, max: h }), hour: this.hour(), minute: this.minute(), second: this.second(), millisecond: this.millisecond(), american: !0, string: !1 }), d = new Date(a.year, a.month, a.day, a.hour, a.minute, a.second, a.millisecond);
    }return c = a.american ? d.getMonth() + 1 + "/" + d.getDate() + "/" + d.getFullYear() : d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear(), a.string ? c : d;
  }, a.prototype.hammertime = function (a) {
    return this.date(a).getTime();
  }, a.prototype.hour = function (a) {
    return a = b(a, { min: 1, max: a && a.twentyfour ? 24 : 12 }), c(a.min < 1, "Chance: Min cannot be less than 1."), c(a.twentyfour && a.max > 24, "Chance: Max cannot be greater than 24 for twentyfour option."), c(!a.twentyfour && a.max > 12, "Chance: Max cannot be greater than 12."), c(a.min > a.max, "Chance: Min cannot be greater than Max."), this.natural({ min: a.min, max: a.max });
  }, a.prototype.millisecond = function () {
    return this.natural({ max: 999 });
  }, a.prototype.minute = a.prototype.second = function (a) {
    return a = b(a, { min: 0, max: 59 }), c(a.min < 0, "Chance: Min cannot be less than 0."), c(a.max > 59, "Chance: Max cannot be greater than 59."), c(a.min > a.max, "Chance: Min cannot be greater than Max."), this.natural({ min: a.min, max: a.max });
  }, a.prototype.month = function (a) {
    a = b(a, { min: 1, max: 12 }), c(a.min < 1, "Chance: Min cannot be less than 1."), c(a.max > 12, "Chance: Max cannot be greater than 12."), c(a.min > a.max, "Chance: Min cannot be greater than Max.");var d = this.pick(this.months().slice(a.min - 1, a.max));return a.raw ? d : d.name;
  }, a.prototype.months = function () {
    return this.get("months");
  }, a.prototype.second = function () {
    return this.natural({ max: 59 });
  }, a.prototype.timestamp = function () {
    return this.natural({ min: 1, max: parseInt(new Date().getTime() / 1e3, 10) });
  }, a.prototype.year = function (a) {
    return a = b(a, { min: new Date().getFullYear() }), a.max = "undefined" != typeof a.max ? a.max : a.min + 100, this.natural(a).toString();
  }, a.prototype.cc = function (a) {
    a = b(a);var c, d, e;return c = this.cc_type(a.type ? { name: a.type, raw: !0 } : { raw: !0 }), d = c.prefix.split(""), e = c.length - c.prefix.length - 1, d = d.concat(this.n(this.integer, e, { min: 0, max: 9 })), d.push(this.luhn_calculate(d.join(""))), d.join("");
  }, a.prototype.cc_types = function () {
    return this.get("cc_types");
  }, a.prototype.cc_type = function (a) {
    a = b(a);var c = this.cc_types(),
        d = null;if (a.name) {
      for (var e = 0; e < c.length; e++) {
        if (c[e].name === a.name || c[e].short_name === a.name) {
          d = c[e];break;
        }
      }if (null === d) throw new RangeError("Credit card type '" + a.name + "'' is not supported");
    } else d = this.pick(c);return a.raw ? d : d.name;
  }, a.prototype.currency_types = function () {
    return this.get("currency_types");
  }, a.prototype.currency = function () {
    return this.pick(this.currency_types());
  }, a.prototype.currency_pair = function (a) {
    var b = this.unique(this.currency, 2, { comparator: function comparator(a, b) {
        return a.reduce(function (a, c) {
          return a || c.code === b.code;
        }, !1);
      } });return a ? b[0].code + "/" + b[1].code : b;
  }, a.prototype.dollar = function (a) {
    a = b(a, { max: 1e4, min: 0 });var c = this.floating({ min: a.min, max: a.max, fixed: 2 }).toString(),
        d = c.split(".")[1];return void 0 === d ? c += ".00" : d.length < 2 && (c += "0"), 0 > c ? "-$" + c.replace("-", "") : "$" + c;
  }, a.prototype.exp = function (a) {
    a = b(a);var c = {};return c.year = this.exp_year(), c.year === new Date().getFullYear().toString() ? c.month = this.exp_month({ future: !0 }) : c.month = this.exp_month(), a.raw ? c : c.month + "/" + c.year;
  }, a.prototype.exp_month = function (a) {
    a = b(a);var c,
        d,
        e = new Date().getMonth() + 1;if (a.future) {
      do {
        c = this.month({ raw: !0 }).numeric, d = parseInt(c, 10);
      } while (e >= d);
    } else c = this.month({ raw: !0 }).numeric;return c;
  }, a.prototype.exp_year = function () {
    return this.year({ max: new Date().getFullYear() + 10 });
  }, a.prototype.d4 = d({ min: 1, max: 4 }), a.prototype.d6 = d({ min: 1, max: 6 }), a.prototype.d8 = d({ min: 1, max: 8 }), a.prototype.d10 = d({ min: 1, max: 10 }), a.prototype.d12 = d({ min: 1, max: 12 }), a.prototype.d20 = d({ min: 1, max: 20 }), a.prototype.d30 = d({ min: 1, max: 30 }), a.prototype.d100 = d({ min: 1, max: 100 }), a.prototype.rpg = function (a, c) {
    if (c = b(c), a) {
      var d = a.toLowerCase().split("d"),
          e = [];if (2 !== d.length || !parseInt(d[0], 10) || !parseInt(d[1], 10)) throw new Error("Invalid format provided. Please provide #d# where the first # is the number of dice to roll, the second # is the max of each die");for (var f = d[0]; f > 0; f--) {
        e[f - 1] = this.natural({ min: 1, max: d[1] });
      }return "undefined" != typeof c.sum && c.sum ? e.reduce(function (a, b) {
        return a + b;
      }) : e;
    }throw new RangeError("A type of die roll must be included");
  }, a.prototype.guid = function (a) {
    a = b(a, { version: 5 });var c = "abcdef1234567890",
        d = "ab89",
        e = this.string({ pool: c, length: 8 }) + "-" + this.string({ pool: c, length: 4 }) + "-" + a.version + this.string({ pool: c, length: 3 }) + "-" + this.string({ pool: d, length: 1 }) + this.string({ pool: c, length: 3 }) + "-" + this.string({ pool: c, length: 12 });return e;
  }, a.prototype.hash = function (a) {
    a = b(a, { length: 40, casing: "lower" });var c = "upper" === a.casing ? m.toUpperCase() : m;return this.string({ pool: c, length: a.length });
  }, a.prototype.luhn_check = function (a) {
    var b = a.toString(),
        c = +b.substring(b.length - 1);return c === this.luhn_calculate(+b.substring(0, b.length - 1));
  }, a.prototype.luhn_calculate = function (a) {
    for (var b, c = a.toString().split("").reverse(), d = 0, e = 0, f = c.length; f > e; ++e) {
      b = +c[e], e % 2 === 0 && (b *= 2, b > 9 && (b -= 9)), d += b;
    }return 9 * d % 10;
  }, a.prototype.md5 = function (a) {
    var c = { str: "", key: null, raw: !1 };if (a) {
      if ("string" == typeof a) c.str = a, a = {};else {
        if ("object" != (typeof a === "undefined" ? "undefined" : _typeof(a))) return null;if ("Array" === a.constructor) return null;
      }
    } else c.str = this.string(), a = {};if (c = b(a, c), !c.str) throw new Error("A parameter is required to return an md5 hash.");return this.bimd5.md5(c.str, c.key, c.raw);
  };var p = { firstNames: { male: ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Charles", "Thomas", "Christopher", "Daniel", "Matthew", "George", "Donald", "Anthony", "Paul", "Mark", "Edward", "Steven", "Kenneth", "Andrew", "Brian", "Joshua", "Kevin", "Ronald", "Timothy", "Jason", "Jeffrey", "Frank", "Gary", "Ryan", "Nicholas", "Eric", "Stephen", "Jacob", "Larry", "Jonathan", "Scott", "Raymond", "Justin", "Brandon", "Gregory", "Samuel", "Benjamin", "Patrick", "Jack", "Henry", "Walter", "Dennis", "Jerry", "Alexander", "Peter", "Tyler", "Douglas", "Harold", "Aaron", "Jose", "Adam", "Arthur", "Zachary", "Carl", "Nathan", "Albert", "Kyle", "Lawrence", "Joe", "Willie", "Gerald", "Roger", "Keith", "Jeremy", "Terry", "Harry", "Ralph", "Sean", "Jesse", "Roy", "Louis", "Billy", "Austin", "Bruce", "Eugene", "Christian", "Bryan", "Wayne", "Russell", "Howard", "Fred", "Ethan", "Jordan", "Philip", "Alan", "Juan", "Randy", "Vincent", "Bobby", "Dylan", "Johnny", "Phillip", "Victor", "Clarence", "Ernest", "Martin", "Craig", "Stanley", "Shawn", "Travis", "Bradley", "Leonard", "Earl", "Gabriel", "Jimmy", "Francis", "Todd", "Noah", "Danny", "Dale", "Cody", "Carlos", "Allen", "Frederick", "Logan", "Curtis", "Alex", "Joel", "Luis", "Norman", "Marvin", "Glenn", "Tony", "Nathaniel", "Rodney", "Melvin", "Alfred", "Steve", "Cameron", "Chad", "Edwin", "Caleb", "Evan", "Antonio", "Lee", "Herbert", "Jeffery", "Isaac", "Derek", "Ricky", "Marcus", "Theodore", "Elijah", "Luke", "Jesus", "Eddie", "Troy", "Mike", "Dustin", "Ray", "Adrian", "Bernard", "Leroy", "Angel", "Randall", "Wesley", "Ian", "Jared", "Mason", "Hunter", "Calvin", "Oscar", "Clifford", "Jay", "Shane", "Ronnie", "Barry", "Lucas", "Corey", "Manuel", "Leo", "Tommy", "Warren", "Jackson", "Isaiah", "Connor", "Don", "Dean", "Jon", "Julian", "Miguel", "Bill", "Lloyd", "Charlie", "Mitchell", "Leon", "Jerome", "Darrell", "Jeremiah", "Alvin", "Brett", "Seth", "Floyd", "Jim", "Blake", "Micheal", "Gordon", "Trevor", "Lewis", "Erik", "Edgar", "Vernon", "Devin", "Gavin", "Jayden", "Chris", "Clyde", "Tom", "Derrick", "Mario", "Brent", "Marc", "Herman", "Chase", "Dominic", "Ricardo", "Franklin", "Maurice", "Max", "Aiden", "Owen", "Lester", "Gilbert", "Elmer", "Gene", "Francisco", "Glen", "Cory", "Garrett", "Clayton", "Sam", "Jorge", "Chester", "Alejandro", "Jeff", "Harvey", "Milton", "Cole", "Ivan", "Andre", "Duane", "Landon"], female: ["Mary", "Emma", "Elizabeth", "Minnie", "Margaret", "Ida", "Alice", "Bertha", "Sarah", "Annie", "Clara", "Ella", "Florence", "Cora", "Martha", "Laura", "Nellie", "Grace", "Carrie", "Maude", "Mabel", "Bessie", "Jennie", "Gertrude", "Julia", "Hattie", "Edith", "Mattie", "Rose", "Catherine", "Lillian", "Ada", "Lillie", "Helen", "Jessie", "Louise", "Ethel", "Lula", "Myrtle", "Eva", "Frances", "Lena", "Lucy", "Edna", "Maggie", "Pearl", "Daisy", "Fannie", "Josephine", "Dora", "Rosa", "Katherine", "Agnes", "Marie", "Nora", "May", "Mamie", "Blanche", "Stella", "Ellen", "Nancy", "Effie", "Sallie", "Nettie", "Della", "Lizzie", "Flora", "Susie", "Maud", "Mae", "Etta", "Harriet", "Sadie", "Caroline", "Katie", "Lydia", "Elsie", "Kate", "Susan", "Mollie", "Alma", "Addie", "Georgia", "Eliza", "Lulu", "Nannie", "Lottie", "Amanda", "Belle", "Charlotte", "Rebecca", "Ruth", "Viola", "Olive", "Amelia", "Hannah", "Jane", "Virginia", "Emily", "Matilda", "Irene", "Kathryn", "Esther", "Willie", "Henrietta", "Ollie", "Amy", "Rachel", "Sara", "Estella", "Theresa", "Augusta", "Ora", "Pauline", "Josie", "Lola", "Sophia", "Leona", "Anne", "Mildred", "Ann", "Beulah", "Callie", "Lou", "Delia", "Eleanor", "Barbara", "Iva", "Louisa", "Maria", "Mayme", "Evelyn", "Estelle", "Nina", "Betty", "Marion", "Bettie", "Dorothy", "Luella", "Inez", "Lela", "Rosie", "Allie", "Millie", "Janie", "Cornelia", "Victoria", "Ruby", "Winifred", "Alta", "Celia", "Christine", "Beatrice", "Birdie", "Harriett", "Mable", "Myra", "Sophie", "Tillie", "Isabel", "Sylvia", "Carolyn", "Isabelle", "Leila", "Sally", "Ina", "Essie", "Bertie", "Nell", "Alberta", "Katharine", "Lora", "Rena", "Mina", "Rhoda", "Mathilda", "Abbie", "Eula", "Dollie", "Hettie", "Eunice", "Fanny", "Ola", "Lenora", "Adelaide", "Christina", "Lelia", "Nelle", "Sue", "Johanna", "Lilly", "Lucinda", "Minerva", "Lettie", "Roxie", "Cynthia", "Helena", "Hilda", "Hulda", "Bernice", "Genevieve", "Jean", "Cordelia", "Marian", "Francis", "Jeanette", "Adeline", "Gussie", "Leah", "Lois", "Lura", "Mittie", "Hallie", "Isabella", "Olga", "Phoebe", "Teresa", "Hester", "Lida", "Lina", "Winnie", "Claudia", "Marguerite", "Vera", "Cecelia", "Bess", "Emilie", "John", "Rosetta", "Verna", "Myrtie", "Cecilia", "Elva", "Olivia", "Ophelia", "Georgie", "Elnora", "Violet", "Adele", "Lily", "Linnie", "Loretta", "Madge", "Polly", "Virgie", "Eugenia", "Lucile", "Lucille", "Mabelle", "Rosalie"] }, lastNames: ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson", "Clark", "Rodriguez", "Lewis", "Lee", "Walker", "Hall", "Allen", "Young", "Hernandez", "King", "Wright", "Lopez", "Hill", "Scott", "Green", "Adams", "Baker", "Gonzalez", "Nelson", "Carter", "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards", "Collins", "Stewart", "Sanchez", "Morris", "Rogers", "Reed", "Cook", "Morgan", "Bell", "Murphy", "Bailey", "Rivera", "Cooper", "Richardson", "Cox", "Howard", "Ward", "Torres", "Peterson", "Gray", "Ramirez", "James", "Watson", "Brooks", "Kelly", "Sanders", "Price", "Bennett", "Wood", "Barnes", "Ross", "Henderson", "Coleman", "Jenkins", "Perry", "Powell", "Long", "Patterson", "Hughes", "Flores", "Washington", "Butler", "Simmons", "Foster", "Gonzales", "Bryant", "Alexander", "Russell", "Griffin", "Diaz", "Hayes", "Myers", "Ford", "Hamilton", "Graham", "Sullivan", "Wallace", "Woods", "Cole", "West", "Jordan", "Owens", "Reynolds", "Fisher", "Ellis", "Harrison", "Gibson", "McDonald", "Cruz", "Marshall", "Ortiz", "Gomez", "Murray", "Freeman", "Wells", "Webb", "Simpson", "Stevens", "Tucker", "Porter", "Hunter", "Hicks", "Crawford", "Henry", "Boyd", "Mason", "Morales", "Kennedy", "Warren", "Dixon", "Ramos", "Reyes", "Burns", "Gordon", "Shaw", "Holmes", "Rice", "Robertson", "Hunt", "Black", "Daniels", "Palmer", "Mills", "Nichols", "Grant", "Knight", "Ferguson", "Rose", "Stone", "Hawkins", "Dunn", "Perkins", "Hudson", "Spencer", "Gardner", "Stephens", "Payne", "Pierce", "Berry", "Matthews", "Arnold", "Wagner", "Willis", "Ray", "Watkins", "Olson", "Carroll", "Duncan", "Snyder", "Hart", "Cunningham", "Bradley", "Lane", "Andrews", "Ruiz", "Harper", "Fox", "Riley", "Armstrong", "Carpenter", "Weaver", "Greene", "Lawrence", "Elliott", "Chavez", "Sims", "Austin", "Peters", "Kelley", "Franklin", "Lawson", "Fields", "Gutierrez", "Ryan", "Schmidt", "Carr", "Vasquez", "Castillo", "Wheeler", "Chapman", "Oliver", "Montgomery", "Richards", "Williamson", "Johnston", "Banks", "Meyer", "Bishop", "McCoy", "Howell", "Alvarez", "Morrison", "Hansen", "Fernandez", "Garza", "Harvey", "Little", "Burton", "Stanley", "Nguyen", "George", "Jacobs", "Reid", "Kim", "Fuller", "Lynch", "Dean", "Gilbert", "Garrett", "Romero", "Welch", "Larson", "Frazier", "Burke", "Hanson", "Day", "Mendoza", "Moreno", "Bowman", "Medina", "Fowler", "Brewer", "Hoffman", "Carlson", "Silva", "Pearson", "Holland", "Douglas", "Fleming", "Jensen", "Vargas", "Byrd", "Davidson", "Hopkins", "May", "Terry", "Herrera", "Wade", "Soto", "Walters", "Curtis", "Neal", "Caldwell", "Lowe", "Jennings", "Barnett", "Graves", "Jimenez", "Horton", "Shelton", "Barrett", "Obrien", "Castro", "Sutton", "Gregory", "McKinney", "Lucas", "Miles", "Craig", "Rodriquez", "Chambers", "Holt", "Lambert", "Fletcher", "Watts", "Bates", "Hale", "Rhodes", "Pena", "Beck", "Newman", "Haynes", "McDaniel", "Mendez", "Bush", "Vaughn", "Parks", "Dawson", "Santiago", "Norris", "Hardy", "Love", "Steele", "Curry", "Powers", "Schultz", "Barker", "Guzman", "Page", "Munoz", "Ball", "Keller", "Chandler", "Weber", "Leonard", "Walsh", "Lyons", "Ramsey", "Wolfe", "Schneider", "Mullins", "Benson", "Sharp", "Bowen", "Daniel", "Barber", "Cummings", "Hines", "Baldwin", "Griffith", "Valdez", "Hubbard", "Salazar", "Reeves", "Warner", "Stevenson", "Burgess", "Santos", "Tate", "Cross", "Garner", "Mann", "Mack", "Moss", "Thornton", "Dennis", "McGee", "Farmer", "Delgado", "Aguilar", "Vega", "Glover", "Manning", "Cohen", "Harmon", "Rodgers", "Robbins", "Newton", "Todd", "Blair", "Higgins", "Ingram", "Reese", "Cannon", "Strickland", "Townsend", "Potter", "Goodwin", "Walton", "Rowe", "Hampton", "Ortega", "Patton", "Swanson", "Joseph", "Francis", "Goodman", "Maldonado", "Yates", "Becker", "Erickson", "Hodges", "Rios", "Conner", "Adkins", "Webster", "Norman", "Malone", "Hammond", "Flowers", "Cobb", "Moody", "Quinn", "Blake", "Maxwell", "Pope", "Floyd", "Osborne", "Paul", "McCarthy", "Guerrero", "Lindsey", "Estrada", "Sandoval", "Gibbs", "Tyler", "Gross", "Fitzgerald", "Stokes", "Doyle", "Sherman", "Saunders", "Wise", "Colon", "Gill", "Alvarado", "Greer", "Padilla", "Simon", "Waters", "Nunez", "Ballard", "Schwartz", "McBride", "Houston", "Christensen", "Klein", "Pratt", "Briggs", "Parsons", "McLaughlin", "Zimmerman", "French", "Buchanan", "Moran", "Copeland", "Roy", "Pittman", "Brady", "McCormick", "Holloway", "Brock", "Poole", "Frank", "Logan", "Owen", "Bass", "Marsh", "Drake", "Wong", "Jefferson", "Park", "Morton", "Abbott", "Sparks", "Patrick", "Norton", "Huff", "Clayton", "Massey", "Lloyd", "Figueroa", "Carson", "Bowers", "Roberson", "Barton", "Tran", "Lamb", "Harrington", "Casey", "Boone", "Cortez", "Clarke", "Mathis", "Singleton", "Wilkins", "Cain", "Bryan", "Underwood", "Hogan", "McKenzie", "Collier", "Luna", "Phelps", "McGuire", "Allison", "Bridges", "Wilkerson", "Nash", "Summers", "Atkins"],
    countries: [{ name: "Afghanistan", abbreviation: "AF" }, { name: "Albania", abbreviation: "AL" }, { name: "Algeria", abbreviation: "DZ" }, { name: "American Samoa", abbreviation: "AS" }, { name: "Andorra", abbreviation: "AD" }, { name: "Angola", abbreviation: "AO" }, { name: "Anguilla", abbreviation: "AI" }, { name: "Antarctica", abbreviation: "AQ" }, { name: "Antigua and Barbuda", abbreviation: "AG" }, { name: "Argentina", abbreviation: "AR" }, { name: "Armenia", abbreviation: "AM" }, { name: "Aruba", abbreviation: "AW" }, { name: "Australia", abbreviation: "AU" }, { name: "Austria", abbreviation: "AT" }, { name: "Azerbaijan", abbreviation: "AZ" }, { name: "Bahamas", abbreviation: "BS" }, { name: "Bahrain", abbreviation: "BH" }, { name: "Bangladesh", abbreviation: "BD" }, { name: "Barbados", abbreviation: "BB" }, { name: "Belarus", abbreviation: "BY" }, { name: "Belgium", abbreviation: "BE" }, { name: "Belize", abbreviation: "BZ" }, { name: "Benin", abbreviation: "BJ" }, { name: "Bermuda", abbreviation: "BM" }, { name: "Bhutan", abbreviation: "BT" }, { name: "Bolivia", abbreviation: "BO" }, { name: "Bosnia and Herzegovina", abbreviation: "BA" }, { name: "Botswana", abbreviation: "BW" }, { name: "Bouvet Island", abbreviation: "BV" }, { name: "Brazil", abbreviation: "BR" }, { name: "British Antarctic Territory", abbreviation: "BQ" }, { name: "British Indian Ocean Territory", abbreviation: "IO" }, { name: "British Virgin Islands", abbreviation: "VG" }, { name: "Brunei", abbreviation: "BN" }, { name: "Bulgaria", abbreviation: "BG" }, { name: "Burkina Faso", abbreviation: "BF" }, { name: "Burundi", abbreviation: "BI" }, { name: "Cambodia", abbreviation: "KH" }, { name: "Cameroon", abbreviation: "CM" }, { name: "Canada", abbreviation: "CA" }, { name: "Canton and Enderbury Islands", abbreviation: "CT" }, { name: "Cape Verde", abbreviation: "CV" }, { name: "Cayman Islands", abbreviation: "KY" }, { name: "Central African Republic", abbreviation: "CF" }, { name: "Chad", abbreviation: "TD" }, { name: "Chile", abbreviation: "CL" }, { name: "China", abbreviation: "CN" }, { name: "Christmas Island", abbreviation: "CX" }, { name: "Cocos [Keeling] Islands", abbreviation: "CC" }, { name: "Colombia", abbreviation: "CO" }, { name: "Comoros", abbreviation: "KM" }, { name: "Congo - Brazzaville", abbreviation: "CG" }, { name: "Congo - Kinshasa", abbreviation: "CD" }, { name: "Cook Islands", abbreviation: "CK" }, { name: "Costa Rica", abbreviation: "CR" }, { name: "Croatia", abbreviation: "HR" }, { name: "Cuba", abbreviation: "CU" }, { name: "Cyprus", abbreviation: "CY" }, { name: "Czech Republic", abbreviation: "CZ" }, { name: "Côte d’Ivoire", abbreviation: "CI" }, { name: "Denmark", abbreviation: "DK" }, { name: "Djibouti", abbreviation: "DJ" }, { name: "Dominica", abbreviation: "DM" }, { name: "Dominican Republic", abbreviation: "DO" }, { name: "Dronning Maud Land", abbreviation: "NQ" }, { name: "East Germany", abbreviation: "DD" }, { name: "Ecuador", abbreviation: "EC" }, { name: "Egypt", abbreviation: "EG" }, { name: "El Salvador", abbreviation: "SV" }, { name: "Equatorial Guinea", abbreviation: "GQ" }, { name: "Eritrea", abbreviation: "ER" }, { name: "Estonia", abbreviation: "EE" }, { name: "Ethiopia", abbreviation: "ET" }, { name: "Falkland Islands", abbreviation: "FK" }, { name: "Faroe Islands", abbreviation: "FO" }, { name: "Fiji", abbreviation: "FJ" }, { name: "Finland", abbreviation: "FI" }, { name: "France", abbreviation: "FR" }, { name: "French Guiana", abbreviation: "GF" }, { name: "French Polynesia", abbreviation: "PF" }, { name: "French Southern Territories", abbreviation: "TF" }, { name: "French Southern and Antarctic Territories", abbreviation: "FQ" }, { name: "Gabon", abbreviation: "GA" }, { name: "Gambia", abbreviation: "GM" }, { name: "Georgia", abbreviation: "GE" }, { name: "Germany", abbreviation: "DE" }, { name: "Ghana", abbreviation: "GH" }, { name: "Gibraltar", abbreviation: "GI" }, { name: "Greece", abbreviation: "GR" }, { name: "Greenland", abbreviation: "GL" }, { name: "Grenada", abbreviation: "GD" }, { name: "Guadeloupe", abbreviation: "GP" }, { name: "Guam", abbreviation: "GU" }, { name: "Guatemala", abbreviation: "GT" }, { name: "Guernsey", abbreviation: "GG" }, { name: "Guinea", abbreviation: "GN" }, { name: "Guinea-Bissau", abbreviation: "GW" }, { name: "Guyana", abbreviation: "GY" }, { name: "Haiti", abbreviation: "HT" }, { name: "Heard Island and McDonald Islands", abbreviation: "HM" }, { name: "Honduras", abbreviation: "HN" }, { name: "Hong Kong SAR China", abbreviation: "HK" }, { name: "Hungary", abbreviation: "HU" }, { name: "Iceland", abbreviation: "IS" }, { name: "India", abbreviation: "IN" }, { name: "Indonesia", abbreviation: "ID" }, { name: "Iran", abbreviation: "IR" }, { name: "Iraq", abbreviation: "IQ" }, { name: "Ireland", abbreviation: "IE" }, { name: "Isle of Man", abbreviation: "IM" }, { name: "Israel", abbreviation: "IL" }, { name: "Italy", abbreviation: "IT" }, { name: "Jamaica", abbreviation: "JM" }, { name: "Japan", abbreviation: "JP" }, { name: "Jersey", abbreviation: "JE" }, { name: "Johnston Island", abbreviation: "JT" }, { name: "Jordan", abbreviation: "JO" }, { name: "Kazakhstan", abbreviation: "KZ" }, { name: "Kenya", abbreviation: "KE" }, { name: "Kiribati", abbreviation: "KI" }, { name: "Kuwait", abbreviation: "KW" }, { name: "Kyrgyzstan", abbreviation: "KG" }, { name: "Laos", abbreviation: "LA" }, { name: "Latvia", abbreviation: "LV" }, { name: "Lebanon", abbreviation: "LB" }, { name: "Lesotho", abbreviation: "LS" }, { name: "Liberia", abbreviation: "LR" }, { name: "Libya", abbreviation: "LY" }, { name: "Liechtenstein", abbreviation: "LI" }, { name: "Lithuania", abbreviation: "LT" }, { name: "Luxembourg", abbreviation: "LU" }, { name: "Macau SAR China", abbreviation: "MO" }, { name: "Macedonia", abbreviation: "MK" }, { name: "Madagascar", abbreviation: "MG" }, { name: "Malawi", abbreviation: "MW" }, { name: "Malaysia", abbreviation: "MY" }, { name: "Maldives", abbreviation: "MV" }, { name: "Mali", abbreviation: "ML" }, { name: "Malta", abbreviation: "MT" }, { name: "Marshall Islands", abbreviation: "MH" }, { name: "Martinique", abbreviation: "MQ" }, { name: "Mauritania", abbreviation: "MR" }, { name: "Mauritius", abbreviation: "MU" }, { name: "Mayotte", abbreviation: "YT" }, { name: "Metropolitan France", abbreviation: "FX" }, { name: "Mexico", abbreviation: "MX" }, { name: "Micronesia", abbreviation: "FM" }, { name: "Midway Islands", abbreviation: "MI" }, { name: "Moldova", abbreviation: "MD" }, { name: "Monaco", abbreviation: "MC" }, { name: "Mongolia", abbreviation: "MN" }, { name: "Montenegro", abbreviation: "ME" }, { name: "Montserrat", abbreviation: "MS" }, { name: "Morocco", abbreviation: "MA" }, { name: "Mozambique", abbreviation: "MZ" }, { name: "Myanmar [Burma]", abbreviation: "MM" }, { name: "Namibia", abbreviation: "NA" }, { name: "Nauru", abbreviation: "NR" }, { name: "Nepal", abbreviation: "NP" }, { name: "Netherlands", abbreviation: "NL" }, { name: "Netherlands Antilles", abbreviation: "AN" }, { name: "Neutral Zone", abbreviation: "NT" }, { name: "New Caledonia", abbreviation: "NC" }, { name: "New Zealand", abbreviation: "NZ" }, { name: "Nicaragua", abbreviation: "NI" }, { name: "Niger", abbreviation: "NE" }, { name: "Nigeria", abbreviation: "NG" }, { name: "Niue", abbreviation: "NU" }, { name: "Norfolk Island", abbreviation: "NF" }, { name: "North Korea", abbreviation: "KP" }, { name: "North Vietnam", abbreviation: "VD" }, { name: "Northern Mariana Islands", abbreviation: "MP" }, { name: "Norway", abbreviation: "NO" }, { name: "Oman", abbreviation: "OM" }, { name: "Pacific Islands Trust Territory", abbreviation: "PC" }, { name: "Pakistan", abbreviation: "PK" }, { name: "Palau", abbreviation: "PW" }, { name: "Palestinian Territories", abbreviation: "PS" }, { name: "Panama", abbreviation: "PA" }, { name: "Panama Canal Zone", abbreviation: "PZ" }, { name: "Papua New Guinea", abbreviation: "PG" }, { name: "Paraguay", abbreviation: "PY" }, { name: "People's Democratic Republic of Yemen", abbreviation: "YD" }, { name: "Peru", abbreviation: "PE" }, { name: "Philippines", abbreviation: "PH" }, { name: "Pitcairn Islands", abbreviation: "PN" }, { name: "Poland", abbreviation: "PL" }, { name: "Portugal", abbreviation: "PT" }, { name: "Puerto Rico", abbreviation: "PR" }, { name: "Qatar", abbreviation: "QA" }, { name: "Romania", abbreviation: "RO" }, { name: "Russia", abbreviation: "RU" }, { name: "Rwanda", abbreviation: "RW" }, { name: "Réunion", abbreviation: "RE" }, { name: "Saint Barthélemy", abbreviation: "BL" }, { name: "Saint Helena", abbreviation: "SH" }, { name: "Saint Kitts and Nevis", abbreviation: "KN" }, { name: "Saint Lucia", abbreviation: "LC" }, { name: "Saint Martin", abbreviation: "MF" }, { name: "Saint Pierre and Miquelon", abbreviation: "PM" }, { name: "Saint Vincent and the Grenadines", abbreviation: "VC" }, { name: "Samoa", abbreviation: "WS" }, { name: "San Marino", abbreviation: "SM" }, { name: "Saudi Arabia", abbreviation: "SA" }, { name: "Senegal", abbreviation: "SN" }, { name: "Serbia", abbreviation: "RS" }, { name: "Serbia and Montenegro", abbreviation: "CS" }, { name: "Seychelles", abbreviation: "SC" }, { name: "Sierra Leone", abbreviation: "SL" }, { name: "Singapore", abbreviation: "SG" }, { name: "Slovakia", abbreviation: "SK" }, { name: "Slovenia", abbreviation: "SI" }, { name: "Solomon Islands", abbreviation: "SB" }, { name: "Somalia", abbreviation: "SO" }, { name: "South Africa", abbreviation: "ZA" }, { name: "South Georgia and the South Sandwich Islands", abbreviation: "GS" }, { name: "South Korea", abbreviation: "KR" }, { name: "Spain", abbreviation: "ES" }, { name: "Sri Lanka", abbreviation: "LK" }, { name: "Sudan", abbreviation: "SD" }, { name: "Suriname", abbreviation: "SR" }, { name: "Svalbard and Jan Mayen", abbreviation: "SJ" }, { name: "Swaziland", abbreviation: "SZ" }, { name: "Sweden", abbreviation: "SE" }, { name: "Switzerland", abbreviation: "CH" }, { name: "Syria", abbreviation: "SY" }, { name: "São Tomé and Príncipe", abbreviation: "ST" }, { name: "Taiwan", abbreviation: "TW" }, { name: "Tajikistan", abbreviation: "TJ" }, { name: "Tanzania", abbreviation: "TZ" }, { name: "Thailand", abbreviation: "TH" }, { name: "Timor-Leste", abbreviation: "TL" }, { name: "Togo", abbreviation: "TG" }, { name: "Tokelau", abbreviation: "TK" }, { name: "Tonga", abbreviation: "TO" }, { name: "Trinidad and Tobago", abbreviation: "TT" }, { name: "Tunisia", abbreviation: "TN" }, { name: "Turkey", abbreviation: "TR" }, { name: "Turkmenistan", abbreviation: "TM" }, { name: "Turks and Caicos Islands", abbreviation: "TC" }, { name: "Tuvalu", abbreviation: "TV" }, { name: "U.S. Minor Outlying Islands", abbreviation: "UM" }, { name: "U.S. Miscellaneous Pacific Islands", abbreviation: "PU" }, { name: "U.S. Virgin Islands", abbreviation: "VI" }, { name: "Uganda", abbreviation: "UG" }, { name: "Ukraine", abbreviation: "UA" }, { name: "Union of Soviet Socialist Republics", abbreviation: "SU" }, { name: "United Arab Emirates", abbreviation: "AE" }, { name: "United Kingdom", abbreviation: "GB" }, { name: "United States", abbreviation: "US" }, { name: "Unknown or Invalid Region", abbreviation: "ZZ" }, { name: "Uruguay", abbreviation: "UY" }, { name: "Uzbekistan", abbreviation: "UZ" }, { name: "Vanuatu", abbreviation: "VU" }, { name: "Vatican City", abbreviation: "VA" }, { name: "Venezuela", abbreviation: "VE" }, { name: "Vietnam", abbreviation: "VN" }, { name: "Wake Island", abbreviation: "WK" }, { name: "Wallis and Futuna", abbreviation: "WF" }, { name: "Western Sahara", abbreviation: "EH" }, { name: "Yemen", abbreviation: "YE" }, { name: "Zambia", abbreviation: "ZM" }, { name: "Zimbabwe", abbreviation: "ZW" }, { name: "Åland Islands", abbreviation: "AX" }], provinces: [{ name: "Alberta", abbreviation: "AB" }, { name: "British Columbia", abbreviation: "BC" }, { name: "Manitoba", abbreviation: "MB" }, { name: "New Brunswick", abbreviation: "NB" }, { name: "Newfoundland and Labrador", abbreviation: "NL" }, { name: "Nova Scotia", abbreviation: "NS" }, { name: "Ontario", abbreviation: "ON" }, { name: "Prince Edward Island", abbreviation: "PE" }, { name: "Quebec", abbreviation: "QC" }, { name: "Saskatchewan", abbreviation: "SK" }, { name: "Northwest Territories", abbreviation: "NT" }, { name: "Nunavut", abbreviation: "NU" }, { name: "Yukon", abbreviation: "YT" }], us_states_and_dc: [{ name: "Alabama", abbreviation: "AL" }, { name: "Alaska", abbreviation: "AK" }, { name: "Arizona", abbreviation: "AZ" }, { name: "Arkansas", abbreviation: "AR" }, { name: "California", abbreviation: "CA" }, { name: "Colorado", abbreviation: "CO" }, { name: "Connecticut", abbreviation: "CT" }, { name: "Delaware", abbreviation: "DE" }, { name: "District of Columbia", abbreviation: "DC" }, { name: "Florida", abbreviation: "FL" }, { name: "Georgia", abbreviation: "GA" }, { name: "Hawaii", abbreviation: "HI" }, { name: "Idaho", abbreviation: "ID" }, { name: "Illinois", abbreviation: "IL" }, { name: "Indiana", abbreviation: "IN" }, { name: "Iowa", abbreviation: "IA" }, { name: "Kansas", abbreviation: "KS" }, { name: "Kentucky", abbreviation: "KY" }, { name: "Louisiana", abbreviation: "LA" }, { name: "Maine", abbreviation: "ME" }, { name: "Maryland", abbreviation: "MD" }, { name: "Massachusetts", abbreviation: "MA" }, { name: "Michigan", abbreviation: "MI" }, { name: "Minnesota", abbreviation: "MN" }, { name: "Mississippi", abbreviation: "MS" }, { name: "Missouri", abbreviation: "MO" }, { name: "Montana", abbreviation: "MT" }, { name: "Nebraska", abbreviation: "NE" }, { name: "Nevada", abbreviation: "NV" }, { name: "New Hampshire", abbreviation: "NH" }, { name: "New Jersey", abbreviation: "NJ" }, { name: "New Mexico", abbreviation: "NM" }, { name: "New York", abbreviation: "NY" }, { name: "North Carolina", abbreviation: "NC" }, { name: "North Dakota", abbreviation: "ND" }, { name: "Ohio", abbreviation: "OH" }, { name: "Oklahoma", abbreviation: "OK" }, { name: "Oregon", abbreviation: "OR" }, { name: "Pennsylvania", abbreviation: "PA" }, { name: "Rhode Island", abbreviation: "RI" }, { name: "South Carolina", abbreviation: "SC" }, { name: "South Dakota", abbreviation: "SD" }, { name: "Tennessee", abbreviation: "TN" }, { name: "Texas", abbreviation: "TX" }, { name: "Utah", abbreviation: "UT" }, { name: "Vermont", abbreviation: "VT" }, { name: "Virginia", abbreviation: "VA" }, { name: "Washington", abbreviation: "WA" }, { name: "West Virginia", abbreviation: "WV" }, { name: "Wisconsin", abbreviation: "WI" }, { name: "Wyoming", abbreviation: "WY" }], territories: [{ name: "American Samoa", abbreviation: "AS" }, { name: "Federated States of Micronesia", abbreviation: "FM" }, { name: "Guam", abbreviation: "GU" }, { name: "Marshall Islands", abbreviation: "MH" }, { name: "Northern Mariana Islands", abbreviation: "MP" }, { name: "Puerto Rico", abbreviation: "PR" }, { name: "Virgin Islands, U.S.", abbreviation: "VI" }], armed_forces: [{ name: "Armed Forces Europe", abbreviation: "AE" }, { name: "Armed Forces Pacific", abbreviation: "AP" }, { name: "Armed Forces the Americas", abbreviation: "AA" }], street_suffixes: [{ name: "Avenue", abbreviation: "Ave" }, { name: "Boulevard", abbreviation: "Blvd" }, { name: "Center", abbreviation: "Ctr" }, { name: "Circle", abbreviation: "Cir" }, { name: "Court", abbreviation: "Ct" }, { name: "Drive", abbreviation: "Dr" }, { name: "Extension", abbreviation: "Ext" }, { name: "Glen", abbreviation: "Gln" }, { name: "Grove", abbreviation: "Grv" }, { name: "Heights", abbreviation: "Hts" }, { name: "Highway", abbreviation: "Hwy" }, { name: "Junction", abbreviation: "Jct" }, { name: "Key", abbreviation: "Key" }, { name: "Lane", abbreviation: "Ln" }, { name: "Loop", abbreviation: "Loop" }, { name: "Manor", abbreviation: "Mnr" }, { name: "Mill", abbreviation: "Mill" }, { name: "Park", abbreviation: "Park" }, { name: "Parkway", abbreviation: "Pkwy" }, { name: "Pass", abbreviation: "Pass" }, { name: "Path", abbreviation: "Path" }, { name: "Pike", abbreviation: "Pike" }, { name: "Place", abbreviation: "Pl" }, { name: "Plaza", abbreviation: "Plz" }, { name: "Point", abbreviation: "Pt" }, { name: "Ridge", abbreviation: "Rdg" }, { name: "River", abbreviation: "Riv" }, { name: "Road", abbreviation: "Rd" }, { name: "Square", abbreviation: "Sq" }, { name: "Street", abbreviation: "St" }, { name: "Terrace", abbreviation: "Ter" }, { name: "Trail", abbreviation: "Trl" }, { name: "Turnpike", abbreviation: "Tpke" }, { name: "View", abbreviation: "Vw" }, { name: "Way", abbreviation: "Way" }], months: [{ name: "January", short_name: "Jan", numeric: "01", days: 31 }, { name: "February", short_name: "Feb", numeric: "02", days: 28 }, { name: "March", short_name: "Mar", numeric: "03", days: 31 }, { name: "April", short_name: "Apr", numeric: "04", days: 30 }, { name: "May", short_name: "May", numeric: "05", days: 31 }, { name: "June", short_name: "Jun", numeric: "06", days: 30 }, { name: "July", short_name: "Jul", numeric: "07", days: 31 }, { name: "August", short_name: "Aug", numeric: "08", days: 31 }, { name: "September", short_name: "Sep", numeric: "09", days: 30 }, { name: "October", short_name: "Oct", numeric: "10", days: 31 }, { name: "November", short_name: "Nov", numeric: "11", days: 30 }, { name: "December", short_name: "Dec", numeric: "12", days: 31 }], cc_types: [{ name: "American Express", short_name: "amex", prefix: "34", length: 15 }, { name: "Bankcard", short_name: "bankcard", prefix: "5610", length: 16 }, { name: "China UnionPay", short_name: "chinaunion", prefix: "62", length: 16 }, { name: "Diners Club Carte Blanche", short_name: "dccarte", prefix: "300", length: 14 }, { name: "Diners Club enRoute", short_name: "dcenroute", prefix: "2014", length: 15 }, { name: "Diners Club International", short_name: "dcintl", prefix: "36", length: 14 }, { name: "Diners Club United States & Canada", short_name: "dcusc", prefix: "54", length: 16 }, { name: "Discover Card", short_name: "discover", prefix: "6011", length: 16 }, { name: "InstaPayment", short_name: "instapay", prefix: "637", length: 16 }, { name: "JCB", short_name: "jcb", prefix: "3528", length: 16 }, { name: "Laser", short_name: "laser", prefix: "6304", length: 16 }, { name: "Maestro", short_name: "maestro", prefix: "5018", length: 16 }, { name: "Mastercard", short_name: "mc", prefix: "51", length: 16 }, { name: "Solo", short_name: "solo", prefix: "6334", length: 16 }, { name: "Switch", short_name: "switch", prefix: "4903", length: 16 }, { name: "Visa", short_name: "visa", prefix: "4", length: 16 }, { name: "Visa Electron", short_name: "electron", prefix: "4026", length: 16 }], currency_types: [{ code: "AED", name: "United Arab Emirates Dirham" }, { code: "AFN", name: "Afghanistan Afghani" }, { code: "ALL", name: "Albania Lek" }, { code: "AMD", name: "Armenia Dram" }, { code: "ANG", name: "Netherlands Antilles Guilder" }, { code: "AOA", name: "Angola Kwanza" }, { code: "ARS", name: "Argentina Peso" }, { code: "AUD", name: "Australia Dollar" }, { code: "AWG", name: "Aruba Guilder" }, { code: "AZN", name: "Azerbaijan New Manat" }, { code: "BAM", name: "Bosnia and Herzegovina Convertible Marka" }, { code: "BBD", name: "Barbados Dollar" }, { code: "BDT", name: "Bangladesh Taka" }, { code: "BGN", name: "Bulgaria Lev" }, { code: "BHD", name: "Bahrain Dinar" }, { code: "BIF", name: "Burundi Franc" }, { code: "BMD", name: "Bermuda Dollar" }, { code: "BND", name: "Brunei Darussalam Dollar" }, { code: "BOB", name: "Bolivia Boliviano" }, { code: "BRL", name: "Brazil Real" }, { code: "BSD", name: "Bahamas Dollar" }, { code: "BTN", name: "Bhutan Ngultrum" }, { code: "BWP", name: "Botswana Pula" }, { code: "BYR", name: "Belarus Ruble" }, { code: "BZD", name: "Belize Dollar" }, { code: "CAD", name: "Canada Dollar" }, { code: "CDF", name: "Congo/Kinshasa Franc" }, { code: "CHF", name: "Switzerland Franc" }, { code: "CLP", name: "Chile Peso" }, { code: "CNY", name: "China Yuan Renminbi" }, { code: "COP", name: "Colombia Peso" }, { code: "CRC", name: "Costa Rica Colon" }, { code: "CUC", name: "Cuba Convertible Peso" }, { code: "CUP", name: "Cuba Peso" }, { code: "CVE", name: "Cape Verde Escudo" }, { code: "CZK", name: "Czech Republic Koruna" }, { code: "DJF", name: "Djibouti Franc" }, { code: "DKK", name: "Denmark Krone" }, { code: "DOP", name: "Dominican Republic Peso" }, { code: "DZD", name: "Algeria Dinar" }, { code: "EGP", name: "Egypt Pound" }, { code: "ERN", name: "Eritrea Nakfa" }, { code: "ETB", name: "Ethiopia Birr" }, { code: "EUR", name: "Euro Member Countries" }, { code: "FJD", name: "Fiji Dollar" }, { code: "FKP", name: "Falkland Islands (Malvinas) Pound" }, { code: "GBP", name: "United Kingdom Pound" }, { code: "GEL", name: "Georgia Lari" }, { code: "GGP", name: "Guernsey Pound" }, { code: "GHS", name: "Ghana Cedi" }, { code: "GIP", name: "Gibraltar Pound" }, { code: "GMD", name: "Gambia Dalasi" }, { code: "GNF", name: "Guinea Franc" }, { code: "GTQ", name: "Guatemala Quetzal" }, { code: "GYD", name: "Guyana Dollar" }, { code: "HKD", name: "Hong Kong Dollar" }, { code: "HNL", name: "Honduras Lempira" }, { code: "HRK", name: "Croatia Kuna" }, { code: "HTG", name: "Haiti Gourde" }, { code: "HUF", name: "Hungary Forint" }, { code: "IDR", name: "Indonesia Rupiah" }, { code: "ILS", name: "Israel Shekel" }, { code: "IMP", name: "Isle of Man Pound" }, { code: "INR", name: "India Rupee" }, { code: "IQD", name: "Iraq Dinar" }, { code: "IRR", name: "Iran Rial" }, { code: "ISK", name: "Iceland Krona" }, { code: "JEP", name: "Jersey Pound" }, { code: "JMD", name: "Jamaica Dollar" }, { code: "JOD", name: "Jordan Dinar" }, { code: "JPY", name: "Japan Yen" }, { code: "KES", name: "Kenya Shilling" }, { code: "KGS", name: "Kyrgyzstan Som" }, { code: "KHR", name: "Cambodia Riel" }, { code: "KMF", name: "Comoros Franc" }, { code: "KPW", name: "Korea (North) Won" }, { code: "KRW", name: "Korea (South) Won" }, { code: "KWD", name: "Kuwait Dinar" }, { code: "KYD", name: "Cayman Islands Dollar" }, { code: "KZT", name: "Kazakhstan Tenge" }, { code: "LAK", name: "Laos Kip" }, { code: "LBP", name: "Lebanon Pound" }, { code: "LKR", name: "Sri Lanka Rupee" }, { code: "LRD", name: "Liberia Dollar" }, { code: "LSL", name: "Lesotho Loti" }, { code: "LTL", name: "Lithuania Litas" }, { code: "LYD", name: "Libya Dinar" }, { code: "MAD", name: "Morocco Dirham" }, { code: "MDL", name: "Moldova Leu" }, { code: "MGA", name: "Madagascar Ariary" }, { code: "MKD", name: "Macedonia Denar" }, { code: "MMK", name: "Myanmar (Burma) Kyat" }, { code: "MNT", name: "Mongolia Tughrik" }, { code: "MOP", name: "Macau Pataca" }, { code: "MRO", name: "Mauritania Ouguiya" }, { code: "MUR", name: "Mauritius Rupee" }, { code: "MVR", name: "Maldives (Maldive Islands) Rufiyaa" }, { code: "MWK", name: "Malawi Kwacha" }, { code: "MXN", name: "Mexico Peso" }, { code: "MYR", name: "Malaysia Ringgit" }, { code: "MZN", name: "Mozambique Metical" }, { code: "NAD", name: "Namibia Dollar" }, { code: "NGN", name: "Nigeria Naira" }, { code: "NIO", name: "Nicaragua Cordoba" }, { code: "NOK", name: "Norway Krone" }, { code: "NPR", name: "Nepal Rupee" }, { code: "NZD", name: "New Zealand Dollar" }, { code: "OMR", name: "Oman Rial" }, { code: "PAB", name: "Panama Balboa" }, { code: "PEN", name: "Peru Nuevo Sol" }, { code: "PGK", name: "Papua New Guinea Kina" }, { code: "PHP", name: "Philippines Peso" }, { code: "PKR", name: "Pakistan Rupee" }, { code: "PLN", name: "Poland Zloty" }, { code: "PYG", name: "Paraguay Guarani" }, { code: "QAR", name: "Qatar Riyal" }, { code: "RON", name: "Romania New Leu" }, { code: "RSD", name: "Serbia Dinar" }, { code: "RUB", name: "Russia Ruble" }, { code: "RWF", name: "Rwanda Franc" }, { code: "SAR", name: "Saudi Arabia Riyal" }, { code: "SBD", name: "Solomon Islands Dollar" }, { code: "SCR", name: "Seychelles Rupee" }, { code: "SDG", name: "Sudan Pound" }, { code: "SEK", name: "Sweden Krona" }, { code: "SGD", name: "Singapore Dollar" }, { code: "SHP", name: "Saint Helena Pound" }, { code: "SLL", name: "Sierra Leone Leone" }, { code: "SOS", name: "Somalia Shilling" }, { code: "SPL", name: "Seborga Luigino" }, { code: "SRD", name: "Suriname Dollar" }, { code: "STD", name: "São Tomé and Príncipe Dobra" }, { code: "SVC", name: "El Salvador Colon" }, { code: "SYP", name: "Syria Pound" }, { code: "SZL", name: "Swaziland Lilangeni" }, { code: "THB", name: "Thailand Baht" }, { code: "TJS", name: "Tajikistan Somoni" }, { code: "TMT", name: "Turkmenistan Manat" }, { code: "TND", name: "Tunisia Dinar" }, { code: "TOP", name: "Tonga Pa'anga" }, { code: "TRY", name: "Turkey Lira" }, { code: "TTD", name: "Trinidad and Tobago Dollar" }, { code: "TVD", name: "Tuvalu Dollar" }, { code: "TWD", name: "Taiwan New Dollar" }, { code: "TZS", name: "Tanzania Shilling" }, { code: "UAH", name: "Ukraine Hryvnia" }, { code: "UGX", name: "Uganda Shilling" }, { code: "USD", name: "United States Dollar" }, { code: "UYU", name: "Uruguay Peso" }, { code: "UZS", name: "Uzbekistan Som" }, { code: "VEF", name: "Venezuela Bolivar" }, { code: "VND", name: "Viet Nam Dong" }, { code: "VUV", name: "Vanuatu Vatu" }, { code: "WST", name: "Samoa Tala" }, { code: "XAF", name: "Communauté Financière Africaine (BEAC) CFA Franc BEAC" }, { code: "XCD", name: "East Caribbean Dollar" }, { code: "XDR", name: "International Monetary Fund (IMF) Special Drawing Rights" }, { code: "XOF", name: "Communauté Financière Africaine (BCEAO) Franc" }, { code: "XPF", name: "Comptoirs Français du Pacifique (CFP) Franc" }, { code: "YER", name: "Yemen Rial" }, { code: "ZAR", name: "South Africa Rand" }, { code: "ZMW", name: "Zambia Kwacha" }, { code: "ZWD", name: "Zimbabwe Dollar" }] },
      q = Object.prototype.hasOwnProperty,
      r = Object.keys || function (a) {
    var b = [];for (var c in a) {
      q.call(a, c) && b.push(c);
    }return b;
  };a.prototype.get = function (a) {
    return g(p[a]);
  }, a.prototype.mac_address = function (a) {
    a = b(a), a.separator || (a.separator = a.networkVersion ? "." : ":");var c = "ABCDEF1234567890",
        d = "";return d = a.networkVersion ? this.n(this.string, 3, { pool: c, length: 4 }).join(a.separator) : this.n(this.string, 6, { pool: c, length: 2 }).join(a.separator);
  }, a.prototype.normal = function (a) {
    a = b(a, { mean: 0, dev: 1 });var c,
        d,
        e,
        f,
        g = a.mean,
        h = a.dev;do {
      d = 2 * this.random() - 1, e = 2 * this.random() - 1, c = d * d + e * e;
    } while (c >= 1);return f = d * Math.sqrt(-2 * Math.log(c) / c), h * f + g;
  }, a.prototype.radio = function (a) {
    a = b(a, { side: "?" });var c = "";switch (a.side.toLowerCase()) {case "east":case "e":
        c = "W";break;case "west":case "w":
        c = "K";break;default:
        c = this.character({ pool: "KW" });}return c + this.character({ alpha: !0, casing: "upper" }) + this.character({ alpha: !0, casing: "upper" }) + this.character({ alpha: !0, casing: "upper" });
  }, a.prototype.set = function (a, b) {
    "string" == typeof a ? p[a] = b : p = g(a, p);
  }, a.prototype.tv = function (a) {
    return this.radio(a);
  }, a.prototype.cnpj = function () {
    var a = this.n(this.natural, 8, { max: 9 }),
        b = 2 + 6 * a[7] + 7 * a[6] + 8 * a[5] + 9 * a[4] + 2 * a[3] + 3 * a[2] + 4 * a[1] + 5 * a[0];b = 11 - b % 11, b >= 10 && (b = 0);var c = 2 * b + 3 + 7 * a[7] + 8 * a[6] + 9 * a[5] + 2 * a[4] + 3 * a[3] + 4 * a[2] + 5 * a[1] + 6 * a[0];return c = 11 - c % 11, c >= 10 && (c = 0), "" + a[0] + a[1] + "." + a[2] + a[3] + a[4] + "." + a[5] + a[6] + a[7] + "/0001-" + b + c;
  }, a.prototype.mersenne_twister = function (a) {
    return new s(a);
  }, a.prototype.blueimp_md5 = function () {
    return new t();
  };var s = function s(a) {
    void 0 === a && (a = Math.floor(Math.random() * Math.pow(10, 13))), this.N = 624, this.M = 397, this.MATRIX_A = 2567483615, this.UPPER_MASK = 2147483648, this.LOWER_MASK = 2147483647, this.mt = new Array(this.N), this.mti = this.N + 1, this.init_genrand(a);
  };s.prototype.init_genrand = function (a) {
    for (this.mt[0] = a >>> 0, this.mti = 1; this.mti < this.N; this.mti++) {
      a = this.mt[this.mti - 1] ^ this.mt[this.mti - 1] >>> 30, this.mt[this.mti] = (1812433253 * ((4294901760 & a) >>> 16) << 16) + 1812433253 * (65535 & a) + this.mti, this.mt[this.mti] >>>= 0;
    }
  }, s.prototype.init_by_array = function (a, b) {
    var c,
        d,
        e = 1,
        f = 0;for (this.init_genrand(19650218), c = this.N > b ? this.N : b; c; c--) {
      d = this.mt[e - 1] ^ this.mt[e - 1] >>> 30, this.mt[e] = (this.mt[e] ^ (1664525 * ((4294901760 & d) >>> 16) << 16) + 1664525 * (65535 & d)) + a[f] + f, this.mt[e] >>>= 0, e++, f++, e >= this.N && (this.mt[0] = this.mt[this.N - 1], e = 1), f >= b && (f = 0);
    }for (c = this.N - 1; c; c--) {
      d = this.mt[e - 1] ^ this.mt[e - 1] >>> 30, this.mt[e] = (this.mt[e] ^ (1566083941 * ((4294901760 & d) >>> 16) << 16) + 1566083941 * (65535 & d)) - e, this.mt[e] >>>= 0, e++, e >= this.N && (this.mt[0] = this.mt[this.N - 1], e = 1);
    }this.mt[0] = 2147483648;
  }, s.prototype.genrand_int32 = function () {
    var a,
        b = new Array(0, this.MATRIX_A);if (this.mti >= this.N) {
      var c;for (this.mti === this.N + 1 && this.init_genrand(5489), c = 0; c < this.N - this.M; c++) {
        a = this.mt[c] & this.UPPER_MASK | this.mt[c + 1] & this.LOWER_MASK, this.mt[c] = this.mt[c + this.M] ^ a >>> 1 ^ b[1 & a];
      }for (; c < this.N - 1; c++) {
        a = this.mt[c] & this.UPPER_MASK | this.mt[c + 1] & this.LOWER_MASK, this.mt[c] = this.mt[c + (this.M - this.N)] ^ a >>> 1 ^ b[1 & a];
      }a = this.mt[this.N - 1] & this.UPPER_MASK | this.mt[0] & this.LOWER_MASK, this.mt[this.N - 1] = this.mt[this.M - 1] ^ a >>> 1 ^ b[1 & a], this.mti = 0;
    }return a = this.mt[this.mti++], a ^= a >>> 11, a ^= a << 7 & 2636928640, a ^= a << 15 & 4022730752, a ^= a >>> 18, a >>> 0;
  }, s.prototype.genrand_int31 = function () {
    return this.genrand_int32() >>> 1;
  }, s.prototype.genrand_real1 = function () {
    return this.genrand_int32() * (1 / 4294967295);
  }, s.prototype.random = function () {
    return this.genrand_int32() * (1 / 4294967296);
  }, s.prototype.genrand_real3 = function () {
    return (this.genrand_int32() + .5) * (1 / 4294967296);
  }, s.prototype.genrand_res53 = function () {
    var a = this.genrand_int32() >>> 5,
        b = this.genrand_int32() >>> 6;return (67108864 * a + b) * (1 / 9007199254740992);
  };var t = function t() {};t.prototype.VERSION = "1.0.1", t.prototype.safe_add = function (a, b) {
    var c = (65535 & a) + (65535 & b),
        d = (a >> 16) + (b >> 16) + (c >> 16);return d << 16 | 65535 & c;
  }, t.prototype.bit_roll = function (a, b) {
    return a << b | a >>> 32 - b;
  }, t.prototype.md5_cmn = function (a, b, c, d, e, f) {
    return this.safe_add(this.bit_roll(this.safe_add(this.safe_add(b, a), this.safe_add(d, f)), e), c);
  }, t.prototype.md5_ff = function (a, b, c, d, e, f, g) {
    return this.md5_cmn(b & c | ~b & d, a, b, e, f, g);
  }, t.prototype.md5_gg = function (a, b, c, d, e, f, g) {
    return this.md5_cmn(b & d | c & ~d, a, b, e, f, g);
  }, t.prototype.md5_hh = function (a, b, c, d, e, f, g) {
    return this.md5_cmn(b ^ c ^ d, a, b, e, f, g);
  }, t.prototype.md5_ii = function (a, b, c, d, e, f, g) {
    return this.md5_cmn(c ^ (b | ~d), a, b, e, f, g);
  }, t.prototype.binl_md5 = function (a, b) {
    a[b >> 5] |= 128 << b % 32, a[(b + 64 >>> 9 << 4) + 14] = b;var c,
        d,
        e,
        f,
        g,
        h = 1732584193,
        i = -271733879,
        j = -1732584194,
        k = 271733878;for (c = 0; c < a.length; c += 16) {
      d = h, e = i, f = j, g = k, h = this.md5_ff(h, i, j, k, a[c], 7, -680876936), k = this.md5_ff(k, h, i, j, a[c + 1], 12, -389564586), j = this.md5_ff(j, k, h, i, a[c + 2], 17, 606105819), i = this.md5_ff(i, j, k, h, a[c + 3], 22, -1044525330), h = this.md5_ff(h, i, j, k, a[c + 4], 7, -176418897), k = this.md5_ff(k, h, i, j, a[c + 5], 12, 1200080426), j = this.md5_ff(j, k, h, i, a[c + 6], 17, -1473231341), i = this.md5_ff(i, j, k, h, a[c + 7], 22, -45705983), h = this.md5_ff(h, i, j, k, a[c + 8], 7, 1770035416), k = this.md5_ff(k, h, i, j, a[c + 9], 12, -1958414417), j = this.md5_ff(j, k, h, i, a[c + 10], 17, -42063), i = this.md5_ff(i, j, k, h, a[c + 11], 22, -1990404162), h = this.md5_ff(h, i, j, k, a[c + 12], 7, 1804603682), k = this.md5_ff(k, h, i, j, a[c + 13], 12, -40341101), j = this.md5_ff(j, k, h, i, a[c + 14], 17, -1502002290), i = this.md5_ff(i, j, k, h, a[c + 15], 22, 1236535329), h = this.md5_gg(h, i, j, k, a[c + 1], 5, -165796510), k = this.md5_gg(k, h, i, j, a[c + 6], 9, -1069501632), j = this.md5_gg(j, k, h, i, a[c + 11], 14, 643717713), i = this.md5_gg(i, j, k, h, a[c], 20, -373897302), h = this.md5_gg(h, i, j, k, a[c + 5], 5, -701558691), k = this.md5_gg(k, h, i, j, a[c + 10], 9, 38016083), j = this.md5_gg(j, k, h, i, a[c + 15], 14, -660478335), i = this.md5_gg(i, j, k, h, a[c + 4], 20, -405537848), h = this.md5_gg(h, i, j, k, a[c + 9], 5, 568446438), k = this.md5_gg(k, h, i, j, a[c + 14], 9, -1019803690), j = this.md5_gg(j, k, h, i, a[c + 3], 14, -187363961), i = this.md5_gg(i, j, k, h, a[c + 8], 20, 1163531501), h = this.md5_gg(h, i, j, k, a[c + 13], 5, -1444681467), k = this.md5_gg(k, h, i, j, a[c + 2], 9, -51403784), j = this.md5_gg(j, k, h, i, a[c + 7], 14, 1735328473), i = this.md5_gg(i, j, k, h, a[c + 12], 20, -1926607734), h = this.md5_hh(h, i, j, k, a[c + 5], 4, -378558), k = this.md5_hh(k, h, i, j, a[c + 8], 11, -2022574463), j = this.md5_hh(j, k, h, i, a[c + 11], 16, 1839030562), i = this.md5_hh(i, j, k, h, a[c + 14], 23, -35309556), h = this.md5_hh(h, i, j, k, a[c + 1], 4, -1530992060), k = this.md5_hh(k, h, i, j, a[c + 4], 11, 1272893353), j = this.md5_hh(j, k, h, i, a[c + 7], 16, -155497632), i = this.md5_hh(i, j, k, h, a[c + 10], 23, -1094730640), h = this.md5_hh(h, i, j, k, a[c + 13], 4, 681279174), k = this.md5_hh(k, h, i, j, a[c], 11, -358537222), j = this.md5_hh(j, k, h, i, a[c + 3], 16, -722521979), i = this.md5_hh(i, j, k, h, a[c + 6], 23, 76029189), h = this.md5_hh(h, i, j, k, a[c + 9], 4, -640364487), k = this.md5_hh(k, h, i, j, a[c + 12], 11, -421815835), j = this.md5_hh(j, k, h, i, a[c + 15], 16, 530742520), i = this.md5_hh(i, j, k, h, a[c + 2], 23, -995338651), h = this.md5_ii(h, i, j, k, a[c], 6, -198630844), k = this.md5_ii(k, h, i, j, a[c + 7], 10, 1126891415), j = this.md5_ii(j, k, h, i, a[c + 14], 15, -1416354905), i = this.md5_ii(i, j, k, h, a[c + 5], 21, -57434055), h = this.md5_ii(h, i, j, k, a[c + 12], 6, 1700485571), k = this.md5_ii(k, h, i, j, a[c + 3], 10, -1894986606), j = this.md5_ii(j, k, h, i, a[c + 10], 15, -1051523), i = this.md5_ii(i, j, k, h, a[c + 1], 21, -2054922799), h = this.md5_ii(h, i, j, k, a[c + 8], 6, 1873313359), k = this.md5_ii(k, h, i, j, a[c + 15], 10, -30611744), j = this.md5_ii(j, k, h, i, a[c + 6], 15, -1560198380), i = this.md5_ii(i, j, k, h, a[c + 13], 21, 1309151649), h = this.md5_ii(h, i, j, k, a[c + 4], 6, -145523070), k = this.md5_ii(k, h, i, j, a[c + 11], 10, -1120210379), j = this.md5_ii(j, k, h, i, a[c + 2], 15, 718787259), i = this.md5_ii(i, j, k, h, a[c + 9], 21, -343485551), h = this.safe_add(h, d), i = this.safe_add(i, e), j = this.safe_add(j, f), k = this.safe_add(k, g);
    }return [h, i, j, k];
  }, t.prototype.binl2rstr = function (a) {
    var b,
        c = "";for (b = 0; b < 32 * a.length; b += 8) {
      c += String.fromCharCode(a[b >> 5] >>> b % 32 & 255);
    }return c;
  }, t.prototype.rstr2binl = function (a) {
    var b,
        c = [];for (c[(a.length >> 2) - 1] = void 0, b = 0; b < c.length; b += 1) {
      c[b] = 0;
    }for (b = 0; b < 8 * a.length; b += 8) {
      c[b >> 5] |= (255 & a.charCodeAt(b / 8)) << b % 32;
    }return c;
  }, t.prototype.rstr_md5 = function (a) {
    return this.binl2rstr(this.binl_md5(this.rstr2binl(a), 8 * a.length));
  }, t.prototype.rstr_hmac_md5 = function (a, b) {
    var c,
        d,
        e = this.rstr2binl(a),
        f = [],
        g = [];for (f[15] = g[15] = void 0, e.length > 16 && (e = this.binl_md5(e, 8 * a.length)), c = 0; 16 > c; c += 1) {
      f[c] = 909522486 ^ e[c], g[c] = 1549556828 ^ e[c];
    }return d = this.binl_md5(f.concat(this.rstr2binl(b)), 512 + 8 * b.length), this.binl2rstr(this.binl_md5(g.concat(d), 640));
  }, t.prototype.rstr2hex = function (a) {
    var b,
        c,
        d = "0123456789abcdef",
        e = "";for (c = 0; c < a.length; c += 1) {
      b = a.charCodeAt(c), e += d.charAt(b >>> 4 & 15) + d.charAt(15 & b);
    }return e;
  }, t.prototype.str2rstr_utf8 = function (a) {
    return unescape(encodeURIComponent(a));
  }, t.prototype.raw_md5 = function (a) {
    return this.rstr_md5(this.str2rstr_utf8(a));
  }, t.prototype.hex_md5 = function (a) {
    return this.rstr2hex(this.raw_md5(a));
  }, t.prototype.raw_hmac_md5 = function (a, b) {
    return this.rstr_hmac_md5(this.str2rstr_utf8(a), this.str2rstr_utf8(b));
  }, t.prototype.hex_hmac_md5 = function (a, b) {
    return this.rstr2hex(this.raw_hmac_md5(a, b));
  }, t.prototype.md5 = function (a, b, c) {
    return b ? c ? this.raw_hmac_md5(b, a) : this.hex_hmac_md5(b, a) : c ? this.raw_md5(a) : this.hex_md5(a);
  }, "undefined" != typeof exports && ("undefined" != typeof module && module.exports && (exports = module.exports = a), exports.Chance = a), "function" == typeof define && define.amd && define([], function () {
    return a;
  }), "undefined" != typeof importScripts && (chance = new a()), "object" == (typeof window === "undefined" ? "undefined" : _typeof(window)) && "object" == _typeof(window.document) && (window.Chance = a, window.chance = new a());
}();


}).call(this,require("buffer").Buffer)
},{"buffer":23}],9:[function(require,module,exports){
'use strict';

/*

© 2011 by Jerry Sievert

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

(function () {
    /** @class Date */
    // constants
    var monthsAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    var monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    var daysAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    var daysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    var dayNames = {
        'su': 0,
        'sun': 0,
        'sunday': 0,
        'mo': 1,
        'mon': 1,
        'monday': 1,
        'tu': 2,
        'tue': 2,
        'tuesday': 2,
        'we': 3,
        'wed': 3,
        'wednesday': 3,
        'th': 4,
        'thu': 4,
        'thursday': 4,
        'fr': 5,
        'fri': 5,
        'friday': 5,
        'sa': 6,
        'sat': 6,
        'saturday': 6
    };
    var monthsAll = monthsFull.concat(monthsAbbr);
    var daysAll = ['su', 'sun', 'sunday', 'mo', 'mon', 'monday', 'tu', 'tue', 'tuesday', 'we', 'wed', 'wednesday', 'th', 'thu', 'thursday', 'fr', 'fri', 'friday', 'sa', 'sat', 'saturday'];

    var monthNames = {
        'jan': 0,
        'january': 0,
        'feb': 1,
        'february': 1,
        'mar': 2,
        'march': 2,
        'apr': 3,
        'april': 3,
        'may': 4,
        'jun': 5,
        'june': 5,
        'jul': 6,
        'july': 6,
        'aug': 7,
        'august': 7,
        'sep': 8,
        'september': 8,
        'oct': 9,
        'october': 9,
        'nov': 10,
        'november': 10,
        'dec': 11,
        'december': 11
    };

    var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // private helper functions
    /** @ignore */
    function pad(str, length) {
        str = String(str);
        while (str.length < length) {
            str = '0' + str;
        }
        return str;
    }

    var isInteger = function isInteger(str) {
        if (str.match(/^(\d+)$/)) {
            return true;
        }
        return false;
    };
    var getInt = function getInt(str, i, minlength, maxlength) {
        for (var x = maxlength; x >= minlength; x--) {
            var token = str.substring(i, i + x);
            if (token.length < minlength) {
                return null;
            }
            if (isInteger(token)) {
                return token;
            }
        }
        return null;
    };

    // static class methods
    var origParse = Date.parse;
    // ------------------------------------------------------------------
    // getDateFromFormat( date_string , format_string )
    //
    // This function takes a date string and a format string. It matches
    // If the date string matches the format string, it returns the
    // getTime() of the date. If it does not match, it returns NaN.
    // Original Author: Matt Kruse <matt@mattkruse.com>
    // WWW: http://www.mattkruse.com/
    // Adapted from: http://www.mattkruse.com/javascript/date/source.html
    // ------------------------------------------------------------------


    var getDateFromFormat = function getDateFromFormat(val, format) {
        val = val + "";
        format = format + "";
        var iVal = 0;
        var iFormat = 0;
        var c = "";
        var token = "";
        var token2 = "";
        var x, y;
        var now = new Date();
        var year = now.getYear();
        var month = now.getMonth() + 1;
        var date = 1;
        var hh = 0;
        var mm = 0;
        var ss = 0;
        var ampm = "";

        while (iFormat < format.length) {
            // Get next token from format string
            c = format.charAt(iFormat);
            token = "";
            while (format.charAt(iFormat) === c && iFormat < format.length) {
                token += format.charAt(iFormat++);
            }
            // Extract contents of value based on format token
            if (token === "yyyy" || token === "yy" || token === "y") {
                if (token === "yyyy") {
                    x = 4;
                    y = 4;
                }
                if (token === "yy") {
                    x = 2;
                    y = 2;
                }
                if (token === "y") {
                    x = 2;
                    y = 4;
                }
                year = getInt(val, iVal, x, y);
                if (year === null) {
                    return NaN;
                }
                iVal += year.length;
                if (year.length === 2) {
                    if (year > 70) {
                        year = 1900 + (year - 0);
                    } else {
                        year = 2000 + (year - 0);
                    }
                }
            } else if (token === "MMM" || token === "NNN") {
                month = 0;
                for (var i = 0; i < monthsAll.length; i++) {
                    var monthName = monthsAll[i];
                    if (val.substring(iVal, iVal + monthName.length).toLowerCase() === monthName.toLowerCase()) {
                        if (token === "MMM" || token === "NNN" && i > 11) {
                            month = i + 1;
                            if (month > 12) {
                                month -= 12;
                            }
                            iVal += monthName.length;
                            break;
                        }
                    }
                }
                if (month < 1 || month > 12) {
                    return NaN;
                }
            } else if (token === "EE" || token === "E") {
                for (var n = 0; n < daysAll.length; n++) {
                    var dayName = daysAll[n];
                    if (val.substring(iVal, iVal + dayName.length).toLowerCase() === dayName.toLowerCase()) {
                        iVal += dayName.length;
                        break;
                    }
                }
            } else if (token === "MM" || token === "M") {
                month = getInt(val, iVal, token.length, 2);
                if (month === null || month < 1 || month > 12) {
                    return NaN;
                }
                iVal += month.length;
            } else if (token === "dd" || token === "d") {
                date = getInt(val, iVal, token.length, 2);
                if (date === null || date < 1 || date > 31) {
                    return NaN;
                }
                iVal += date.length;
            } else if (token === "hh" || token === "h") {
                hh = getInt(val, iVal, token.length, 2);
                if (hh === null || hh < 1 || hh > 12) {
                    return NaN;
                }
                iVal += hh.length;
            } else if (token === "HH" || token === "H") {
                hh = getInt(val, iVal, token.length, 2);
                if (hh === null || hh < 0 || hh > 23) {
                    return NaN;
                }
                iVal += hh.length;
            } else if (token === "KK" || token === "K") {
                hh = getInt(val, iVal, token.length, 2);
                if (hh === null || hh < 0 || hh > 11) {
                    return NaN;
                }
                iVal += hh.length;
            } else if (token === "kk" || token === "k") {
                hh = getInt(val, iVal, token.length, 2);
                if (hh === null || hh < 1 || hh > 24) {
                    return NaN;
                }
                iVal += hh.length;
                hh--;
            } else if (token === "mm" || token === "m") {
                mm = getInt(val, iVal, token.length, 2);
                if (mm === null || mm < 0 || mm > 59) {
                    return NaN;
                }
                iVal += mm.length;
            } else if (token === "ss" || token === "s") {
                ss = getInt(val, iVal, token.length, 2);
                if (ss === null || ss < 0 || ss > 59) {
                    return NaN;
                }
                iVal += ss.length;
            } else if (token === "a") {
                if (val.substring(iVal, iVal + 2).toLowerCase() === "am") {
                    ampm = "AM";
                } else if (val.substring(iVal, iVal + 2).toLowerCase() === "pm") {
                    ampm = "PM";
                } else {
                    return NaN;
                }
                iVal += 2;
            } else {
                if (val.substring(iVal, iVal + token.length) !== token) {
                    return NaN;
                } else {
                    iVal += token.length;
                }
            }
        }
        // If there are any trailing characters left in the value, it doesn't match
        if (iVal !== val.length) {
            return NaN;
        }
        // Is date valid for month?
        if (month === 2) {
            // Check for leap year
            if (year % 4 === 0 && year % 100 !== 0 || year % 400 === 0) {
                // leap year
                if (date > 29) {
                    return NaN;
                }
            } else {
                if (date > 28) {
                    return NaN;
                }
            }
        }
        if (month === 4 || month === 6 || month === 9 || month === 11) {
            if (date > 30) {
                return NaN;
            }
        }
        // Correct hours value
        if (hh < 12 && ampm === "PM") {
            hh = hh - 0 + 12;
        } else if (hh > 11 && ampm === "AM") {
            hh -= 12;
        }
        var newdate = new Date(year, month - 1, date, hh, mm, ss);
        return newdate.getTime();
    };

    /** @ignore */
    Date.parse = function (date, format) {
        if (format) {
            return getDateFromFormat(date, format);
        }
        var timestamp = origParse(date),
            minutesOffset = 0,
            match;
        if (isNaN(timestamp) && (match = /^(\d{4}|[+\-]\d{6})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?))?/.exec(date))) {
            if (match[8] !== 'Z') {
                minutesOffset = +match[10] * 60 + +match[11];

                if (match[9] === '+') {
                    minutesOffset = 0 - minutesOffset;
                }
            }

            match[7] = match[7] || '000';

            timestamp = Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5] + minutesOffset, +match[6], +match[7].substr(0, 3));
        }

        return timestamp;
    };

    function polyfill(name, func) {
        if (Date.prototype[name] === undefined) {
            Date.prototype[name] = func;
        }
    }

    /**
        Returns new instance of Date object with the date set to today and
        the time set to midnight
        @static
        @returns {Date} Today's Date
        @function today
        @memberof Date
     */
    Date.today = function () {
        return new Date().clearTime();
    };

    /**
        Returns new instance of Date object with the date set to today and
        the time set to midnight in UTC
        @static
        @returns {Date} Today's Date in UTC
        @function UTCtoday
        @memberof Date
     */
    Date.UTCtoday = function () {
        return new Date().clearUTCTime();
    };

    /**
        Returns new instance of Date object with the date set to tomorrow and
        the time set to midnight
        @static
        @returns {Date} Tomorrow's Date
        @function tomorrow
        @memberof Date
     */
    Date.tomorrow = function () {
        return Date.today().add({ days: 1 });
    };

    /**
        Returns new instance of Date object with the date set to tomorrow and
        the time set to midnight in UTC
        @static
        @returns {Date} Tomorrow's Date in UTC
        @function UTCtomorrow
        @memberof Date
     */
    Date.UTCtomorrow = function () {
        return Date.UTCtoday().add({ days: 1 });
    };

    /**
        Returns new instance of Date object with the date set to yesterday and
        the time set to midnight
        @static
        @returns {Date} Yesterday's Date
        @function yesterday
        @memberof Date
     */
    Date.yesterday = function () {
        return Date.today().add({ days: -1 });
    };

    /**
        Returns new instance of Date object with the date set to yesterday and
        the time set to midnight in UTC
        @static
        @returns {Date} Yesterday's Date in UTC
        @function UTCyesterday
        @memberof Date
     */
    Date.UTCyesterday = function () {
        return Date.UTCtoday().add({ days: -1 });
    };

    /**
        Returns whether the day is valid
        @static
        @param day {Number} day of the month
        @param year {Number} year
        @param month {Number} month of the year [0-11]
        @returns {Boolean}
        @function validateDay
        @memberof Date
     */
    Date.validateDay = function (day, year, month) {
        var date = new Date(year, month, day);
        return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
    };

    /**
       Returns whether the year is valid
       @static
       @param year {Number} year
       @returns {Boolean}
       @function validateYear
       @memberof Date
    */
    Date.validateYear = function (year) {
        return year >= 0 && year <= 9999;
    };

    /**
       Returns whether the second is valid
       @static
       @param second {Number} second
       @returns {Boolean}
       @function validateSecond
       @memberof Date
    */
    Date.validateSecond = function (second) {
        return second >= 0 && second < 60;
    };

    /**
       Returns whether the month is valid [0-11]
       @static
       @param month {Number} month
       @returns {Boolean}
       @function validateMonth
       @memberof Date
    */
    Date.validateMonth = function (month) {
        return month >= 0 && month < 12;
    };

    /**
       Returns whether the minute is valid
       @static
       @param minute {Number} minute
       @returns {Boolean}
       @function validateMinute
       @memberof Date
    */
    Date.validateMinute = function (minute) {
        return minute >= 0 && minute < 60;
    };

    /**
       Returns whether the millisecond is valid
       @static
       @param millisecond {Number} millisecond
       @returns {Boolean}
       @function validateMillisecond
       @memberof Date
    */
    Date.validateMillisecond = function (milli) {
        return milli >= 0 && milli < 1000;
    };

    /**
       Returns whether the hour is valid [0-23]
       @static
       @param hour {Number} hour
       @returns {Boolean}
       @function validateHour
       @memberof Date
    */
    Date.validateHour = function (hour) {
        return hour >= 0 && hour < 24;
    };

    /**
       Compares two dates
       @static
       @param date1 {Date} first date
       @param date2 {Date} second date
       @returns {Number} -1 if date1 is less than date2, 0 if they are equal, 1 if date1 is more than date2
       @function compare
       @memberof Date
    */
    Date.compare = function (date1, date2) {
        if (date1.valueOf() < date2.valueOf()) {
            return -1;
        } else if (date1.valueOf() > date2.valueOf()) {
            return 1;
        }
        return 0;
    };

    /**
       Compares two dates to the millisecond
       @static
       @param date1 {Date} first date
       @param date2 {Date} second date
       @returns {Boolean}
       @function equals
       @memberof Date
    */
    Date.equals = function (date1, date2) {
        return date1.valueOf() === date2.valueOf();
    };

    /**
       Compares two dates by day
       @static
       @param date1 {Date} first date
       @param date2 {Date} second date
       @returns {Boolean}
       @function equalsDay
       @memberof Date
    */
    Date.equalsDay = function (date1, date2) {
        return date1.toYMD() === date2.toYMD();
    };

    /**
       Returns the day number for a day [0-6]
       @static
       @param day {String} day name
       @returns {Number}
       @function getDayNumberFromName
       @memberof Date
    */
    Date.getDayNumberFromName = function (name) {
        return dayNames[name.toLowerCase()];
    };

    /**
       Returns the day number for a month [0-11]
       @static
       @param month {String} month name
       @returns {Number}
       @function getMonthNumberFromName
       @memberof Date
    */
    Date.getMonthNumberFromName = function (name) {
        return monthNames[name.toLowerCase()];
    };

    /**
       Returns the month name for a month [0-11]
       @static
       @param month {Number} month
       @returns {String}
       @function getMonthNameFromNumber
       @memberof Date
    */
    Date.getMonthNameFromNumber = function (number) {
        return monthsFull[number];
    };

    /**
       Returns the month name abbreviated for a month [0-11]
       @static
       @param month {Number} month
       @returns {String}
       @function getMonthAbbrNameFromNumber
       @memberof Date
    */
    Date.getMonthAbbrFromNumber = function (number) {
        return monthsAbbr[number];
    };

    /**
       Returns whether or not the year is a leap year
       @static
       @param year {Number} year
       @returns {Boolean}
       @function isLeapYear
       @memberof Date
    */
    Date.isLeapYear = function (year) {
        return new Date(year, 1, 29).getDate() === 29;
    };

    /**
       Returns the number of days in a month
       @static
       @param year {Number} year
       @param month {Number} month
       @returns {Number}
       @function getDaysInMonth
       @memberof Date
    */
    Date.getDaysInMonth = function (year, month) {
        if (month === 1) {
            return Date.isLeapYear(year) ? 29 : 28;
        }
        return daysInMonth[month];
    };

    /**
       Returns the abbreviated month name
       @returns {String}
       @function getMonthAbbr
       @instance
       @memberof Date
    */
    polyfill('getMonthAbbr', function () {
        return monthsAbbr[this.getMonth()];
    });

    /**
       Returns the month name
       @returns {String}
       @function getMonthName
       @instance
       @memberof Date
    */
    polyfill('getMonthName', function () {
        return monthsFull[this.getMonth()];
    });

    /**
       Returns the name of last month
       @returns {String}
       @function getLastMonthName
       @instance
       @memberof Date
    */
    polyfill('getLastMonthName', function () {
        var i = this.getMonth();
        i = i === 0 ? 11 : i - 1;
        return monthsFull[i];
    });

    /**
       Returns the current UTC office
       @returns {String}
       @function getUTCOffset
       @instance
       @memberof Date
    */
    polyfill('getUTCOffset', function () {
        var tz = pad(Math.abs(this.getTimezoneOffset() / 0.6), 4);
        if (this.getTimezoneOffset() > 0) {
            tz = '-' + tz;
        }
        return tz;
    });

    /**
       Returns a padded Common Log Format
       @returns {String}
       @function toCLFString
       @deprecated Will be deprecated in version 2.0 in favor of toFormat
       @instance
       @memberof Date
    */
    polyfill('toCLFString', function () {
        return pad(this.getDate(), 2) + '/' + this.getMonthAbbr() + '/' + this.getFullYear() + ':' + pad(this.getHours(), 2) + ':' + pad(this.getMinutes(), 2) + ':' + pad(this.getSeconds(), 2) + ' ' + this.getUTCOffset();
    });

    /**
       Returns a padded Year/Month/Day
       @returns {String}
       @param separator {String} optional, defaults to "-"
       @function toYMD
       @deprecated Will be deprecated in version 2.0 in favor of toFormat
       @instance
       @memberof Date
    */
    polyfill('toYMD', function (separator) {
        separator = typeof separator === 'undefined' ? '-' : separator;
        return this.getFullYear() + separator + pad(this.getMonth() + 1, 2) + separator + pad(this.getDate(), 2);
    });

    /**
       Returns a formatted String for database insertion
       @returns {String}
       @function toDBString
       @deprecated Will be deprecated in version 2.0 in favor of toFormat
       @instance
       @memberof Date
    */
    polyfill('toDBString', function () {
        return this.getUTCFullYear() + '-' + pad(this.getUTCMonth() + 1, 2) + '-' + pad(this.getUTCDate(), 2) + ' ' + pad(this.getUTCHours(), 2) + ':' + pad(this.getUTCMinutes(), 2) + ':' + pad(this.getUTCSeconds(), 2);
    });

    /**
       Sets the time to 00:00:00.0000 and returns a new Date object
       @returns {Date}
       @function clearTime
       @instance
       @memberof Date
    */
    polyfill('clearTime', function () {
        this.setHours(0);
        this.setMinutes(0);
        this.setSeconds(0);
        this.setMilliseconds(0);

        return this;
    });

    /**
       Sets the time to 00:00:00.0000 and returns a new Date object with set to UTC
       @returns {Date}
       @function clearUTCTime
       @instance
       @memberof Date
    */
    polyfill('clearUTCTime', function () {
        this.setUTCHours(0);
        this.setUTCMinutes(0);
        this.setUTCSeconds(0);
        this.setUTCMilliseconds(0);

        return this;
    });

    /**
       Adds `milliseconds`, `seconds`, `minutes`, `hours`, `days`, `weeks`, `months`, and `years` and returns a new Date.
       Usage: `data.add({ "seconds": 10, "days": 1 })`
       @param additions {Object}
       @returns {Date}
       @function add
       @instance
       @memberof Date
    */
    polyfill('add', function (obj) {
        if (obj.milliseconds !== undefined) {
            this.setMilliseconds(this.getMilliseconds() + obj.milliseconds);
        }
        if (obj.seconds !== undefined) {
            this.setSeconds(this.getSeconds() + obj.seconds);
        }
        if (obj.minutes !== undefined) {
            this.setMinutes(this.getMinutes() + obj.minutes);
        }
        if (obj.hours !== undefined) {
            this.setHours(this.getHours() + obj.hours);
        }
        if (obj.days !== undefined) {
            this.setDate(this.getDate() + obj.days);
        }
        if (obj.weeks !== undefined) {
            this.setDate(this.getDate() + obj.weeks * 7);
        }
        if (obj.months !== undefined) {
            this.setMonth(this.getMonth() + obj.months);
        }
        if (obj.years !== undefined) {
            this.setFullYear(this.getFullYear() + obj.years);
        }
        return this;
    });

    /**
       Adds milliseconds to the Date and returns it
       @returns {Date}
       @param milliseconds {Number} Number of milliseconds to add
       @function addMilliseconds
       @deprecated Will be deprecated in version 2.0 in favor of add
       @instance
       @memberof Date
    */
    polyfill('addMilliseconds', function (milliseconds) {
        return this.add({ milliseconds: milliseconds });
    });

    /**
       Adds seconds to the Date and returns it
       @returns {Date}
       @param seconds {Number} Number of seconds to add
       @function addSeconds
       @deprecated Will be deprecated in version 2.0 in favor of add
       @instance
       @memberof Date
    */
    polyfill('addSeconds', function (seconds) {
        return this.add({ seconds: seconds });
    });

    /**
       Adds minutes to the Date and returns it
       @returns {Date}
       @param minutes {Number} Number of minutes to add
       @function addMinutes
       @deprecated Will be deprecated in version 2.0 in favor of add
       @instance
       @memberof Date
    */
    polyfill('addMinutes', function (minutes) {
        return this.add({ minutes: minutes });
    });

    /**
       Adds hours to the Date and returns it
       @returns {Date}
       @param hours {Number} Number of hours to add
       @function addHours
       @deprecated Will be deprecated in version 2.0 in favor of add
       @instance
       @memberof Date
    */
    polyfill('addHours', function (hours) {
        return this.add({ hours: hours });
    });

    /**
       Adds days to the Date and returns it
       @returns {Date}
       @param days {Number} Number of days to add
       @function addSeconds
       @deprecated Will be deprecated in version 2.0 in favor of add
       @instance
       @memberof Date
    */
    polyfill('addDays', function (days) {
        return this.add({ days: days });
    });

    /**
       Adds weeks to the Date and returns it
       @returns {Date}
       @param weeks {Number} Number of weeks to add
       @function addWeeks
       @deprecated Will be deprecated in version 2.0 in favor of add
       @instance
       @memberof Date
    */
    polyfill('addWeeks', function (weeks) {
        return this.add({ days: weeks * 7 });
    });

    /**
       Adds months to the Date and returns it
       @returns {Date}
       @param months {Number} Number of months to add
       @function addMonths
       @deprecated Will be deprecated in version 2.0 in favor of add
       @instance
       @memberof Date
    */
    polyfill('addMonths', function (months) {
        return this.add({ months: months });
    });

    /**
       Adds years to the Date and returns it
       @returns {Date}
       @param years {Number} Number of years to add
       @function addYears
       @deprecated Will be deprecated in version 2.0 in favor of add
       @instance
       @memberof Date
    */
    polyfill('addYears', function (years) {
        return this.add({ years: years });
    });

    /**
       Removes `milliseconds`, `seconds`, `minutes`, `hours`, `days`, `weeks`, `months`, and `years` and returns a new Date.
       Usage: `data.remove({ "seconds": 10, "days": 1 })`
       @param removals {Object}
       @returns {Date}
       @function remove
       @instance
       @memberof Date
    */
    polyfill('remove', function (obj) {
        if (obj.seconds !== undefined) {
            this.setSeconds(this.getSeconds() - obj.seconds);
        }
        if (obj.minutes !== undefined) {
            this.setMinutes(this.getMinutes() - obj.minutes);
        }
        if (obj.hours !== undefined) {
            this.setHours(this.getHours() - obj.hours);
        }
        if (obj.days !== undefined) {
            this.setDate(this.getDate() - obj.days);
        }
        if (obj.weeks !== undefined) {
            this.setDate(this.getDate() - obj.weeks * 7);
        }
        if (obj.months !== undefined) {
            this.setMonth(this.getMonth() - obj.months);
        }
        if (obj.years !== undefined) {
            this.setFullYear(this.getFullYear() - obj.years);
        }
        return this;
    });

    /**
       Removes milliseconds from the Date and returns it
       @returns {Date}
       @param milliseconds {Number} Number of millseconds to remove
       @function removeMilliseconds
       @deprecated Will be deprecated in version 2.0 in favor of remove
       @instance
       @memberof Date
    */
    polyfill('removeMilliseconds', function (milliseconds) {
        throw new Error('Not implemented');
    });

    /**
       Removes seconds from the Date and returns it
       @returns {Date}
       @param seconds {Number} Number of seconds to remove
       @function removeSeconds
       @deprecated Will be deprecated in version 2.0 in favor of remove
       @instance
       @memberof Date
    */
    polyfill('removeSeconds', function (seconds) {
        return this.remove({ seconds: seconds });
    });

    /**
       Removes minutes from the Date and returns it
       @returns {Date}
       @param seconds {Number} Number of minutes to remove
       @function removeMinutes
       @deprecated Will be deprecated in version 2.0 in favor of remove
       @instance
       @memberof Date
    */
    polyfill('removeMinutes', function (minutes) {
        return this.remove({ minutes: minutes });
    });

    /**
       Removes hours from the Date and returns it
       @returns {Date}
       @param hours {Number} Number of hours to remove
       @function removeHours
       @deprecated Will be deprecated in version 2.0 in favor of remove
       @instance
       @memberof Date
    */
    polyfill('removeHours', function (hours) {
        return this.remove({ hours: hours });
    });

    /**
       Removes days from the Date and returns it
       @returns {Date}
       @param days {Number} Number of days to remove
       @function removeDays
       @deprecated Will be deprecated in version 2.0 in favor of remove
       @instance
       @memberof Date
    */
    polyfill('removeDays', function (days) {
        return this.remove({ days: days });
    });

    /**
       Removes weeks from the Date and returns it
       @returns {Date}
       @param weeks {Number} Number of weeks to remove
       @function removeWeeks
       @deprecated Will be deprecated in version 2.0 in favor of remove
       @instance
       @memberof Date
    */
    polyfill('removeWeeks', function (weeks) {
        return this.remove({ days: weeks * 7 });
    });

    /**
       Removes months from the Date and returns it
       @returns {Date}
       @param months {Number} Number of months to remove
       @function removeMonths
       @deprecated Will be deprecated in version 2.0 in favor of remove
       @instance
       @memberof Date
    */
    polyfill('removeMonths', function (months) {
        return this.remove({ months: months });
    });

    /**
       Removes years from the Date and returns it
       @returns {Date}
       @param years {Number} Number of years to remove
       @function removeYears
       @deprecated Will be deprecated in version 2.0 in favor of remove
       @instance
       @memberof Date
    */
    polyfill('removeYears', function (years) {
        return this.remove({ years: years });
    });

    /**
       Adds weekdays based on a Mon-Fri work schedule and returns it
       @returns {Date}
       @param weekdays {Number} Number of weekdays to add
       @function addWeekdays
       @instance
       @memberof Date
    */
    polyfill('addWeekdays', function (weekdays) {
        var day = this.getDay();
        if (day === 0) {
            day = 7;
        }
        var daysOffset = weekdays;
        var weekspan = Math.floor((weekdays + day - 1) / 5.0);
        if (weekdays > 0) {
            daysOffset += weekspan * 2;
            if (day > 5) {
                daysOffset -= day - 5;
            }
        } else {
            daysOffset += Math.min(weekspan * 2, 0);
            if (day > 6) {
                daysOffset -= 1;
            }
        }
        return this.addDays(daysOffset);
    });

    /**
       Sets the time and date to now
       @function setTimeToNow
       @instance
       @memberof Date
    */
    polyfill('setTimeToNow', function () {
        var n = new Date();
        this.setMilliseconds(n.getMilliseconds());
        this.setSeconds(n.getSeconds());
        this.setMinutes(n.getMinutes());
        this.setHours(n.getHours());
    });

    /**
       Returns a cloned copy of the current Date
       @function clone
       @instance
       @memberof Date
    */
    polyfill('clone', function () {
        return new Date(this.valueOf());
    });

    /**
       Returns whether this Date is between a start and end date
       @function between
       @returns {Boolean}
       @instance
       @memberof Date
    */
    polyfill('between', function (start, end) {
        return this.valueOf() >= start.valueOf() && this.valueOf() <= end.valueOf();
    });
    /**
       Compares a Date to this Date
       @param {Date} Date to compare to
       @function compareTo
       @returns {Number} -1 if less than date, 0 if they are equal, 1 if more than date
       @instance
       @memberof Date
    */
    polyfill('compareTo', function (date) {
        return Date.compare(this, date);
    });

    /**
       Compares a Date and time to this Date and time for equality
       @param {Date} Date to compare to
       @function equals
       @returns {Boolean}
       @instance
       @memberof Date
    */
    polyfill('equals', function (date) {
        return Date.equals(this, date);
    });

    /**
       Compares a Date to this Date for equality
       @param {Date} Date to compare to
       @function equalsDay
       @returns {Boolean}
       @instance
       @memberof Date
    */
    polyfill('equalsDay', function (date) {
        return Date.equalsDay(this, date);
    });

    /**
       Checks to see if the Date is today
       @function isToday
       @returns {Boolean}
       @instance
       @memberof Date
    */
    polyfill('isToday', function () {
        return Date.equalsDay(this, Date.today());
    });

    /**
       Compares a Date to this Date for to see if it is after the Date passed
       @param {Date} Date to compare to
       @function isAfter
       @returns {Boolean}
       @instance
       @memberof Date
    */
    polyfill('isAfter', function (date) {
        date = date ? date : new Date();
        return this.compareTo(date) > 0;
    });

    /**
       Compares a Date to this Date for to see if it is before the Date passed
       @param {Date} Date to compare to
       @function isBefore
       @returns {Boolean}
       @instance
       @memberof Date
    */
    polyfill('isBefore', function (date) {
        date = date ? date : new Date();
        return this.compareTo(date) < 0;
    });

    /**
       Returns `true` if the Date is a weekend using standard Saturday/Sunday definition of a weekend
       @function isWeekend
       @returns {Boolean}
       @instance
       @memberof Date
    */
    polyfill('isWeekend', function (date) {
        return this.getDay() % 6 === 0;
    });

    /**
       Returns the number of days between this Date and the Date passed in
       @function getDaysBetween
       @param {Date} Date to compare to
       @returns {Number}
       @instance
       @memberof Date
    */
    polyfill('getDaysBetween', function (date) {
        return (date.clone().valueOf() - this.valueOf()) / 86400000 | 0;
    });

    /**
       Returns the number of hours between this Date and the Date passed in
       @function getHoursBetween
       @param {Date} Date to compare to
       @returns {Number}
       @instance
       @memberof Date
    */
    polyfill('getHoursBetween', function (date) {
        return (date.clone().valueOf() - this.valueOf()) / 3600000 | 0;
    });

    /**
       Returns the number of minutes between this Date and the Date passed in
       @function getMinutesBetween
       @param {Date} Date to compare to
       @returns {Number}
       @instance
       @memberof Date
    */
    polyfill('getMinutesBetween', function (date) {
        return (date.clone().valueOf() - this.valueOf()) / 60000 | 0;
    });

    /**
       Returns the number of seconds between this Date and the Date passed in
       @function getSecondsBetween
       @param {Date} Date to compare to
       @returns {Number}
       @instance
       @memberof Date
    */
    polyfill('getSecondsBetween', function (date) {
        return (date.clone().valueOf() - this.valueOf()) / 1000 | 0;
    });

    /**
       Returns the number of milliseconds between this Date and the Date passed in
       @function getMillisecondsBetween
       @param {Date} Date to compare to
       @returns {Number}
       @instance
       @memberof Date
    */
    polyfill('getMillisecondsBetween', function (date) {
        return date.clone().valueOf() - this.valueOf() | 0;
    });

    /**
       Returns the number of months between this Date and the Date passed in
       @function getMonthsBetween
       @param {Date} Date to compare to
       @returns {Number}
       @instance
       @memberof Date
    */
    polyfill('getMonthsBetween', function (date) {
        // make a guess at the answer; using 31 means that we'll be close but won't exceed
        var daysDiff,
            daysInMonth,
            months = Math.ceil(new Date(date - this).getUTCDate() / 31),
            testDate = new Date(this.getTime()),
            totalDays = Date.getDaysInMonth;

        // find the maximum number of months that's less than or equal to the end date
        testDate.setUTCMonth(testDate.getUTCMonth() + months);
        while (testDate.getTime() < date.getTime()) {
            testDate.setUTCMonth(testDate.getUTCMonth() + 1);
            months++;
        }

        if (testDate.getTime() !== date.getTime()) {
            // back off 1 month since we exceeded the end date
            testDate.setUTCMonth(testDate.getUTCMonth() - 1);
            months--;
        }

        if (date.getUTCMonth() === testDate.getUTCMonth()) {
            daysDiff = new Date(date - testDate).getUTCDate();
            daysInMonth = totalDays(testDate.getUTCFullYear(), testDate.getUTCMonth());

            return months + daysDiff / daysInMonth;
        } else {
            // if two dates are on different months,
            // the calculation must be done for each separate month
            // because their number of days can be different
            daysInMonth = totalDays(testDate.getUTCFullYear(), testDate.getUTCMonth());
            daysDiff = daysInMonth - testDate.getUTCDate() + 1;

            return months + +(daysDiff / daysInMonth).toFixed(5) + +(date.getUTCDate() / totalDays(date.getUTCFullYear(), date.getUTCMonth())).toFixed(5);
        }
    });

    /**
       Returns the ordinal number of this Date
       @function getOrdinalNumber
       @returns {Number}
       @instance
       @memberof Date
    */
    polyfill('getOrdinalNumber', function () {
        return Math.ceil((this.clone().clearTime() - new Date(this.getFullYear(), 0, 1)) / 86400000) + 1;
    });

    /**
       Returns the a formatted version of this Date
       @function toFormat
       @param format {String} Format of the Date, using `YYYY`, `YY`, `MM`, `DD`, `HH`, `HH24`, `MI`, `SS`, etc
       @returns {String}
       @instance
       @memberof Date
    */
    polyfill('toFormat', function (format) {
        return toFormat(format, getReplaceMap(this));
    });

    /**
       Returns the a formatted version of the UTC version of this Date
       @function toUTCFormat
       @param format {String} Format of the Date, using `YYYY`, `YY`, `MM`, `DD`, `HH`, `HH24`, `MI`, `SS`, etc
       @returns {String}
       @instance
       @memberof Date
    */
    polyfill('toUTCFormat', function (format) {
        return toFormat(format, getUTCReplaceMap(this));
    });

    /**
       Returns the week number of this Date
       @function getWeekNumber
       @returns {Number}
       @instance
       @memberof Date
    */
    polyfill('getWeekNumber', function () {
        var onejan = new Date(this.getFullYear(), 0, 1);
        return Math.ceil(((this - onejan) / 86400000 + onejan.getDay() + 1) / 7);
    });

    /**
       Returns the week number of this Date, zero padded
       @function getFullWeekNumber
       @returns {Number}
       @instance
       @memberof Date
    */
    polyfill('getFullWeekNumber', function () {
        var weekNumber = '' + this.getWeekNumber();
        if (weekNumber.length === 1) {
            weekNumber = "0" + weekNumber;
        }

        return weekNumber;
    });

    var toFormat = function toFormat(format, replaceMap) {
        var f = [format],
            i,
            l,
            s;
        var replace = function replace(str, rep) {
            var i = 0,
                l = f.length,
                j,
                ll,
                t,
                n = [];
            for (; i < l; i++) {
                if (typeof f[i] == 'string') {
                    t = f[i].split(str);
                    for (j = 0, ll = t.length - 1; j < ll; j++) {
                        n.push(t[j]);
                        n.push([rep]); // replacement pushed as non-string
                    }
                    n.push(t[ll]);
                } else {
                    // must be a replacement, don't process, just push
                    n.push(f[i]);
                }
            }
            f = n;
        };

        for (i in replaceMap) {
            replace(i, replaceMap[i]);
        }

        s = '';
        for (i = 0, l = f.length; i < l; i++) {
            s += typeof f[i] == 'string' ? f[i] : f[i][0];
        }return f.join('');
    };

    var getReplaceMap = function getReplaceMap(date) {
        var hours = date.getHours() % 12 ? date.getHours() % 12 : 12;
        return {
            'YYYY': date.getFullYear(),
            'YY': String(date.getFullYear()).slice(-2),
            'MMMM': monthsFull[date.getMonth()],
            'MMM': monthsAbbr[date.getMonth()],
            'MM': pad(date.getMonth() + 1, 2),
            'MI': pad(date.getMinutes(), 2),
            'M': date.getMonth() + 1,
            'DDDD': daysFull[date.getDay()],
            'DDD': daysAbbr[date.getDay()],
            'DD': pad(date.getDate(), 2),
            'D': date.getDate(),
            'HH24': pad(date.getHours(), 2),
            'HH': pad(hours, 2),
            'H': hours,
            'SS': pad(date.getSeconds(), 2),
            'PP': date.getHours() >= 12 ? 'PM' : 'AM',
            'P': date.getHours() >= 12 ? 'pm' : 'am',
            'LL': pad(date.getMilliseconds(), 3)
        };
    };

    var getUTCReplaceMap = function getUTCReplaceMap(date) {
        var hours = date.getUTCHours() % 12 ? date.getUTCHours() % 12 : 12;
        return {
            'YYYY': date.getUTCFullYear(),
            'YY': String(date.getUTCFullYear()).slice(-2),
            'MMMM': monthsFull[date.getUTCMonth()],
            'MMM': monthsAbbr[date.getUTCMonth()],
            'MM': pad(date.getUTCMonth() + 1, 2),
            'MI': pad(date.getUTCMinutes(), 2),
            'M': date.getUTCMonth() + 1,
            'DDDD': daysFull[date.getUTCDay()],
            'DDD': daysAbbr[date.getUTCDay()],
            'DD': pad(date.getUTCDate(), 2),
            'D': date.getUTCDate(),
            'HH24': pad(date.getUTCHours(), 2),
            'HH': pad(hours, 2),
            'H': hours,
            'SS': pad(date.getUTCSeconds(), 2),
            'PP': date.getUTCHours() >= 12 ? 'PM' : 'AM',
            'P': date.getUTCHours() >= 12 ? 'pm' : 'am',
            'LL': pad(date.getUTCMilliseconds(), 3)
        };
    };
})();

},{}],10:[function(require,module,exports){
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
},{}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var names = {};

names.corp = ['1st Corp', '2nd Corp'];

names.division = ['1st Division', '2nd Division', '3rd Division', '4th Division'];

names.brigade = ['1st Brigade', '2nd Brigade', '3rd Brigade', '4th Brigade', '5th Brigade', '6th Brigade', '7th Brigade', '8th Brigade'];

names.regiment = ['1st Regiment', '2nd Regiment', '3rd Regiment', '4th Regiment', '5th Regiment', '6th Regiment', '7th Regiment', '8th Regiment', '9th Regiment', '10th Regiment', '11th Regiment', '12th Regiment', '13th Regiment', '14th Regiment', '15th Regiment', '16th Regiment'];

names.company = ['1st A Company', '2nd A Company', '3rd A Company', '4th A Company', '5th A Company', '6th A Company', '7th A Company', '8th A Company', '9th A Company', '10th A Company', '11th A Company', '12th A Company', '13th A Company', '14th A Company', '15th A Company', '16th A Company', '17th A Company', '18th A Company', '19th A Company', '20th A Company', '21th A Company', '22th A Company', '23th A Company', '24th A Company', '25th A Company', '26th A Company', '27th A Company', '28th A Company', '29th A Company', '30th A Company', '31th A Company', '32th A Company', '1st B Company', '2nd B Company', '3rd B Company', '4th B Company', '5th B Company', '6th B Company', '7th B Company', '8th B Company', '9th B Company', '10th B Company', '11th B Company', '12th B Company', '13th B Company', '14th B Company', '15th B Company', '16th B Company', '17th B Company', '18th B Company', '19th B Company', '20th B Company', '21th B Company', '22th B Company', '23th B Company', '24th B Company', '25th B Company', '26th B Company', '27th B Company', '28th B Company', '29th B Company', '30th B Company', '31th B Company', '32th B Company'];

names.battalion = ['1st Battalion', '2nd Battalion', '3rd Battalion', '4th Battalion', '5th Battalion', '6th Battalion', '7th Battalion', '8th Battalion', '9th Battalion', '10th Battalion', '11th Battalion', '12th Battalion', '13th Battalion', '14th Battalion', '15th Battalion', '16th Battalion', '17th Battalion', '18th Battalion', '19th Battalion', '20th Battalion', '21th Battalion', '22th Battalion', '23th Battalion', '24th Battalion', '25th Battalion', '26th Battalion', '27th Battalion', '28th Battalion', '29th Battalion', '30th Battalion', '31th Battalion', '32th Battalion', '33th Battalion', '34th Battalion', '35th Battalion', '36th Battalion', '37th Battalion', '38th Battalion', '39th Battalion', '40th Battalion', '41th Battalion', '42th Battalion', '43th Battalion', '44th Battalion', '45th Battalion', '46th Battalion', '47th Battalion', '48th Battalion', '49th Battalion', '50th Battalion', '51th Battalion', '52th Battalion', '53th Battalion', '54th Battalion', '55th Battalion', '56th Battalion', '57th Battalion', '58th Battalion', '59th Battalion', '60th Battalion', '61th Battalion', '62th Battalion', '63th Battalion', '64th Battalion'];

names.platoon = ['1st Platoon', '2nd Platoon', '3rd Platoon', '4th Platoon', '5th Platoon', '6th Platoon', '7th Platoon', '8th Platoon', '9th Platoon', '10th Platoon', '11th Platoon', '12th Platoon', '13th Platoon', '14th Platoon', '15th Platoon', '16th Platoon', '17th Platoon', '18th Platoon', '19th Platoon', '20th Platoon', '21th Platoon', '22th Platoon', '23th Platoon', '24th Platoon', '25th Platoon', '26th Platoon', '27th Platoon', '28th Platoon', '29th Platoon', '30th Platoon', '31th Platoon', '32th Platoon', '33th Platoon', '34th Platoon', '35th Platoon', '36th Platoon', '37th Platoon', '38th Platoon', '39th Platoon', '40th Platoon', '41th Platoon', '42th Platoon', '43th Platoon', '44th Platoon', '45th Platoon', '46th Platoon', '47th Platoon', '48th Platoon', '49th Platoon', '50th Platoon', '51th Platoon', '52th Platoon', '53th Platoon', '54th Platoon', '55th Platoon', '56th Platoon', '57th Platoon', '58th Platoon', '59th Platoon', '60th Platoon', '61th Platoon', '62th Platoon', '63th Platoon', '64th Platoon', '65th Platoon', '66th Platoon', '67th Platoon', '68th Platoon', '69th Platoon', '70th Platoon', '71th Platoon', '72th Platoon', '73th Platoon', '74th Platoon', '75th Platoon', '76th Platoon', '77th Platoon', '78th Platoon', '79th Platoon', '80th Platton', '81th Platoon', '82th Platoon', '83th Platoon', '84th Platoon', '85th Platoon', '86th Platoon', '87th Platoon', '88th Platoon', '89th Platoon', '90th Platoon', '91th Platoon', '92th Platoon', '93th Platoon', '94th Platoon', '95th Platoon', '96th Platoon', '97th Platoon', '98th Platoon', '99th Platoon', '100th Platoon', '101th Platoon', '102th Platoon', '103th Platoon', '104th Platoon', '105th Platoon', '106th Platoon', '107th Platoon', '108th Platoon', '109th Platoon', '110th Platoon', '111th Platoon', '112th Platoon', '113th Platoon', '114th Platoon', '115th Platoon', '116th Platoon', '117th Platoon', '118th Platoon', '119th Platoon', '120th Platoon', '121th Platoon', '122th Platoon', '123th Platoon', '124th Platoon', '125th Platoon', '126th Platoon', '127th Platoon', '128th Platoon', '129th Platoon'];

names.squad = ['1st A Squad', '2nd A Squad', '3rd A Squad', '4th A Squad', '5th A Squad', '6th A Squad', '7th A Squad', '8th A Squad', '9th A Squad', '10th A Squad', '11th A Squad', '12th A Squad', '13th A Squad', '14th A Squad', '15th A Squad', '16th A Squad', '17th A Squad', '18th A Squad', '19th A Squad', '20th A Squad', '21th A Squad', '22th A Squad', '23th A Squad', '24th A Squad', '25th A Squad', '26th A Squad', '27th A Squad', '28th A Squad', '29th A Squad', '30th A Squad', '31th A Squad', '32th A Squad', '33th A Squad', '34th A Squad', '35th A Squad', '36th A Squad', '37th A Squad', '38th A Squad', '39th A Squad', '40th A Squad', '41th A Squad', '42th A Squad', '43th A Squad', '44th A Squad', '45th A Squad', '46th A Squad', '47th A Squad', '48th A Squad', '49th A Squad', '50th A Squad', '51th A Squad', '52th A Squad', '53th A Squad', '54th A Squad', '55th A Squad', '56th A Squad', '57th A Squad', '58th A Squad', '59th A Squad', '60th A Squad', '61th A Squad', '62th A Squad', '63th A Squad', '64th A Squad', '65th A Squad', '66th A Squad', '67th A Squad', '68th A Squad', '69th A Squad', '70th A Squad', '71th A Squad', '72th A Squad', '73th A Squad', '74th A Squad', '75th A Squad', '76th A Squad', '77th A Squad', '78th A Squad', '79th A Squad', '80th Platton', '81th A Squad', '82th A Squad', '83th A Squad', '84th A Squad', '85th A Squad', '86th A Squad', '87th A Squad', '88th A Squad', '89th A Squad', '90th A Squad', '91th A Squad', '92th A Squad', '93th A Squad', '94th A Squad', '95th A Squad', '96th A Squad', '97th A Squad', '98th A Squad', '99th A Squad', '100th A Squad', '101th A Squad', '102th A Squad', '103th A Squad', '104th A Squad', '105th A Squad', '106th A Squad', '107th A Squad', '108th A Squad', '109th A Squad', '110th A Squad', '111th A Squad', '112th A Squad', '113th A Squad', '114th A Squad', '115th A Squad', '116th A Squad', '117th A Squad', '118th A Squad', '119th A Squad', '120th A Squad', '121th A Squad', '122th A Squad', '123th A Squad', '124th A Squad', '125th A Squad', '126th A Squad', '127th A Squad', '128th A Squad', '129th A Squad', '1st B Squad', '2nd B Squad', '3rd B Squad', '4th B Squad', '5th B Squad', '6th B Squad', '7th B Squad', '8th B Squad', '9th B Squad', '10th B Squad', '11th B Squad', '12th B Squad', '13th B Squad', '14th B Squad', '15th B Squad', '16th B Squad', '17th B Squad', '18th B Squad', '19th B Squad', '20th B Squad', '21th B Squad', '22th B Squad', '23th B Squad', '24th B Squad', '25th B Squad', '26th B Squad', '27th B Squad', '28th B Squad', '29th B Squad', '30th B Squad', '31th B Squad', '32th B Squad', '33th B Squad', '34th B Squad', '35th B Squad', '36th B Squad', '37th B Squad', '38th B Squad', '39th B Squad', '40th B Squad', '41th B Squad', '42th B Squad', '43th B Squad', '44th B Squad', '45th B Squad', '46th B Squad', '47th B Squad', '48th B Squad', '49th B Squad', '50th B Squad', '51th B Squad', '52th B Squad', '53th B Squad', '54th B Squad', '55th B Squad', '56th B Squad', '57th B Squad', '58th B Squad', '59th B Squad', '60th B Squad', '61th B Squad', '62th B Squad', '63th B Squad', '64th B Squad', '65th B Squad', '66th B Squad', '67th B Squad', '68th B Squad', '69th B Squad', '70th B Squad', '71th B Squad', '72th B Squad', '73th B Squad', '74th B Squad', '75th B Squad', '76th B Squad', '77th B Squad', '78th B Squad', '79th B Squad', '80th Platton', '81th B Squad', '82th B Squad', '83th B Squad', '84th B Squad', '85th B Squad', '86th B Squad', '87th B Squad', '88th B Squad', '89th B Squad', '90th B Squad', '91th B Squad', '92th B Squad', '93th B Squad', '94th B Squad', '95th B Squad', '96th B Squad', '97th B Squad', '98th B Squad', '99th B Squad', '100th B Squad', '101th B Squad', '102th B Squad', '103th B Squad', '104th B Squad', '105th B Squad', '106th B Squad', '107th B Squad', '108th B Squad', '109th B Squad', '110th B Squad', '111th B Squad', '112th B Squad', '113th B Squad', '114th B Squad', '115th B Squad', '116th B Squad', '117th B Squad', '118th B Squad', '119th B Squad', '120th B Squad', '121th B Squad', '122th B Squad', '123th B Squad', '124th B Squad', '125th B Squad', '126th B Squad', '127th B Squad', '128th B Squad', '129th B Squad'];

exports.default = names;

},{}],12:[function(require,module,exports){
/* global Chance */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('./lib/chance');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _traits = require('./traits');

var _traits2 = _interopRequireDefault(_traits);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Officer = function () {
  function Officer(spec, HQ, unitName) {
    _classCallCheck(this, Officer);

    var chance = new Chance();
    var traits = new _traits2.default();
    this.id = spec.id;
    this.isPlayer = spec.isPlayer;
    this.unitId = spec.unitId;
    this.rank = _config2.default.ranks[spec.rank];
    this.experience = _config2.default.ranks[spec.rank].startxp + _config2.default.random(10);
    this.prestige = _config2.default.ranks[spec.rank].startpr + _config2.default.random(10);
    this.traits = { base: traits.random() };
    this.intelligence = this.traits.base.intelligence + _config2.default.random(10);
    this.commanding = this.traits.base.commanding + _config2.default.random(10);
    this.diplomacy = this.traits.base.diplomacy + _config2.default.random(10);
    this.alignment = _config2.default.random(1000);
    this.militancy = _config2.default.random(10);
    this.drift = 0;
    this.operations = [];
    this.history = [];
    this.reserved = false;
    if (this.isPlayer) {
      this.lname = 'Richardson';
      this.fname = 'John';
      this.experience = 0;
    } else {
      this.lname = chance.last();
      this.fname = chance.first({ gender: 'male' });
    }
    this.graduate({
      date: _config2.default.formatDate(HQ.rawDate),
      unitName: HQ.unitName(this.unitId, unitName)
    });
  }

  _createClass(Officer, [{
    key: 'name',
    value: function name() {
      return !this.reserved ? this.rank.title + ' ' + this.fname + ' ' + this.lname : this.rank.title + ' (R) ' + this.fname + ' ' + this.lname;
    }
  }, {
    key: 'graduate',
    value: function graduate(spec) {
      var graduation = { unit: spec.unitName, date: spec.date };
      this.history.push(_config2.default.graduated(graduation, this));
      if (this.isPlayer) console.log(this);
    }
  }, {
    key: 'update',
    value: function update(HQ) {
      this.align();
      this.militate(HQ);
      this.experience++;
      this.prestige += _config2.default.random(_config2.default.ranks[this.rank.alias].startpr);
      if (!this.reserved && this.experience > this.rank.maxxp) this.reserve(HQ);
      if (this.isPlayer) console.log(this);
    }
  }, {
    key: 'drifts',
    value: function drifts(officers, units) {
      var _this = this;

      this.unit = units.filter(function (unit) {
        return unit.id === _this.unitId;
      })[0];

      this.commander = officers.filter(function (officer) {
        return officer.unitId === _this.unit.parentId;
      })[0];

      if (this.commander && this.commander.alignment > 500) {
        this.drift++;
      } else {
        this.drift--;
      }
    }
  }, {
    key: 'align',
    value: function align() {
      if (this.drift > 0 && this.alignment < 1000) {
        this.alignment += this.drift;
      } else if (this.drift < 0 && this.alignment > 0) {
        this.alignment += this.drift;
      }
    }
  }, {
    key: 'militate',
    value: function militate(HQ) {}
  }, {
    key: 'reserve',
    value: function reserve(HQ, reason) {
      var _this2 = this;

      var lastUnit = HQ.units.filter(function (unit) {
        return unit.id === _this2.unitId;
      })[0];

      lastUnit.reserve.push(this);
      if (lastUnit.reserve.length > 3) lastUnit.reserve.pop();

      this.reserved = true;

      this.history.push('Moved to reserve on ' + HQ.realDate);
      if (reason) this.history[this.history.length - 1] = this.history[this.history.length - 1] + ' after succesful operation by ' + reason.officer.name();

      if (this.isPlayer || reason) console.log(this.history[this.history.length - 1]);
    }
  }]);

  return Officer;
}();

exports.default = Officer;

},{"./config":4,"./lib/chance":8,"./traits":18}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _officer = require('./officer');

var _officer2 = _interopRequireDefault(_officer);

var _secretary = require('./secretary');

var _secretary2 = _interopRequireDefault(_secretary);

var _player = require('./player');

var _player2 = _interopRequireDefault(_player);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Officers = function () {
  function Officers() {
    _classCallCheck(this, Officers);

    this.pool = [];
    this.active = [];
    this.__officersID = 1;
    this.secretary = new _secretary2.default();
    this.player = undefined;
    this.inspected = undefined;
  }

  _createClass(Officers, [{
    key: 'update',
    value: function update(HQ) {
      this.active.forEach(function (officer) {
        officer.update(HQ);
      });
    }
  }, {
    key: 'recruit',
    value: function recruit(rank, unitId, isPlayer, unitName) {
      var options = {
        date: this.realDate,
        id: this.officers.__officersID,
        unitId: unitId,
        rank: rank
      };

      var cadet = isPlayer ? new _player2.default(options, this, unitName) : new _officer2.default(options, this, unitName);

      if (isPlayer) this.player = cadet;

      this.officers.active.push(cadet);
      this.officers.pool.push(cadet);
      this.officers.__officersID++;
      return cadet;
    }
  }, {
    key: 'reserve',
    value: function reserve() {
      this.active = this.active.filter(function (officer) {
        return !officer.reserved;
      });
    }
  }, {
    key: 'replace',
    value: function replace(replacedCommander) {
      var lowerRank = this.officers.secretary.rankLower(replacedCommander.rank);

      var spec = {
        unitId: replacedCommander.unitId,
        rank: replacedCommander.rank.alias,
        rankToPromote: lowerRank,
        HQ: this
      };

      if (lowerRank) {
        return this.officers.candidate(spec);
      } else {
        return this.officers.recruit.call(this, spec.rank, replacedCommander.unitId);
      }
    }
  }, {
    key: 'replaceForPlayer',
    value: function replaceForPlayer(replacedCommander) {
      return this.officers.recruit.call(this, 'lieutenant', replacedCommander.unitId, true);
    }
  }, {
    key: 'candidate',
    value: function candidate(spec) {
      var candidate = this.active.filter(function (officer) {
        return officer.rank.alias === spec.rankToPromote;
      }).reduce(function (prev, curr) {
        return curr.experience > prev.experience ? curr : prev;
      });
      return this.promote(candidate, spec);
    }
  }, {
    key: 'promote',
    value: function promote(officer, spec) {
      spec.HQ.deassign(officer.unitId);
      var promotion = this.promotion(officer, spec);
      officer.history.push(_config2.default.promoted(promotion));
      officer.drifts(this.active, spec.HQ.units);
      return officer;
    }
  }, {
    key: 'promotion',
    value: function promotion(officer, spec) {
      officer.unitId = spec.unitId;
      officer.rank = _config2.default.ranks[spec.rank];

      return {
        rank: spec.rank,
        date: spec.HQ.realDate,
        unit: spec.HQ.unitName(officer.unitId)
      };
    }
  }]);

  return Officers;
}();

exports.default = Officers;

},{"./config":4,"./officer":12,"./player":15,"./secretary":17}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Operations = function () {
  function Operations() {
    _classCallCheck(this, Operations);

    this.operationsID = 1;
    this.active = [];
  }

  _createClass(Operations, [{
    key: 'add',
    value: function add(spec) {
      var operation = new Operation(spec);
      operation.id = this.operationsID;
      this.operationsID++;
      this.active.push(operation);
      return operation;
    }
  }, {
    key: 'update',
    value: function update(HQ) {
      this.active = this.active.filter(function (operation) {
        if (!HQ.player.reserved && !operation.target.reserved && operation.turns > 0) {
          return true;
        } else {
          alert(operation.name + ' ended.');
          return false;
        }
      });

      this.active.forEach(function (operation) {
        operation.execute(HQ);
      });
      if (this.active.length) console.log('active operations', this.active.length);
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
    key: 'execute',
    value: function execute(HQ) {
      var officerRoll = this.officer[this.type] + _config2.default.random(10);
      var targetRoll = this.target[this.type] + _config2.default.random(10);

      console.log(officerRoll, targetRoll);

      if (officerRoll > targetRoll) {
        this.strength++;
      }

      if (this.strength >= 5) {
        this.target.reserve(HQ, this);
      }

      this.turns--;
    }
  }]);

  return Operation;
}();

exports.default = Operations;

},{"./config":4}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _officer = require('./officer');

var _officer2 = _interopRequireDefault(_officer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Player = function (_Officer) {
  _inherits(Player, _Officer);

  function Player(spec, HQ, unitName) {
    _classCallCheck(this, Player);

    spec.isPlayer = true;
    return _possibleConstructorReturn(this, (Player.__proto__ || Object.getPrototypeOf(Player)).call(this, spec, HQ, unitName));
  }

  return Player;
}(_officer2.default);

exports.default = Player;

},{"./config":4,"./officer":12}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

require('./lib/chance');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var chance = new Chance();

var Region = function Region(id) {
  _classCallCheck(this, Region);

  this.id = id;
  this.name = chance.city();
  this.units = [];
};

exports.default = Region;

},{"./lib/chance":8}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

exports.default = Secretary;

},{}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

exports.default = Traits;

},{}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* jshint ignore:start */


var _react = require('./lib/react');

var _react2 = _interopRequireDefault(_react);

var _comparisons = require('./comparisons');

var _comparisons2 = _interopRequireDefault(_comparisons);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var comparisons = new _comparisons2.default();

var Ui = function () {
    function Ui(spec) {
        _classCallCheck(this, Ui);

        this.engine = spec;
    }

    _createClass(Ui, [{
        key: 'render',
        value: function render(army) {
            _react2.default.render(_react2.default.createElement(Army, { engine: this.engine }), document.body);
        }
    }]);

    return Ui;
}();

var Army = function (_React$Component) {
    _inherits(Army, _React$Component);

    function Army(props) {
        _classCallCheck(this, Army);

        var _this = _possibleConstructorReturn(this, (Army.__proto__ || Object.getPrototypeOf(Army)).call(this, props));

        _this.state = {
            army: props.engine.army,
            engine: props.engine
        };
        return _this;
    }

    _createClass(Army, [{
        key: 'render',
        value: function render() {
            var army = this.state.army;
            var engine = this.state.engine;
            return _react2.default.createElement(
                'div',
                null,
                _react2.default.createElement(Date, { hq: army.HQ, engine: engine }),
                _react2.default.createElement(Player, { player: army.HQ.player, engine: engine })
            );
        }
    }]);

    return Army;
}(_react2.default.Component);

var Date = function (_React$Component2) {
    _inherits(Date, _React$Component2);

    function Date(props) {
        _classCallCheck(this, Date);

        var _this2 = _possibleConstructorReturn(this, (Date.__proto__ || Object.getPrototypeOf(Date)).call(this, props));

        _this2.state = {
            hq: _this2.props.hq,
            engine: _this2.props.engine
        };
        return _this2;
    }

    _createClass(Date, [{
        key: 'pause',
        value: function pause() {
            this.state.engine.pause();
        }
    }, {
        key: 'render',
        value: function render() {
            return _react2.default.createElement(
                'div',
                { onClick: this.pause.bind(this) },
                this.state.hq.realDate
            );
        }
    }]);

    return Date;
}(_react2.default.Component);

var Player = function (_React$Component3) {
    _inherits(Player, _React$Component3);

    function Player(props) {
        _classCallCheck(this, Player);

        var _this3 = _possibleConstructorReturn(this, (Player.__proto__ || Object.getPrototypeOf(Player)).call(this, props));

        _this3.state = {
            player: _this3.props.player,
            engine: _this3.props.engine
        };
        return _this3;
    }

    _createClass(Player, [{
        key: 'render',
        value: function render() {
            return _react2.default.createElement(
                'div',
                null,
                _react2.default.createElement(
                    'div',
                    null,
                    this.state.player.name()
                ),
                _react2.default.createElement(Staff, { officer: this.state.player, engine: this.state.engine }),
                _react2.default.createElement('br', null),
                _react2.default.createElement(Unit, { officer: this.state.player, engine: this.state.engine })
            );
        }
    }]);

    return Player;
}(_react2.default.Component);

var Staff = function (_React$Component4) {
    _inherits(Staff, _React$Component4);

    function Staff(props) {
        _classCallCheck(this, Staff);

        var _this4 = _possibleConstructorReturn(this, (Staff.__proto__ || Object.getPrototypeOf(Staff)).call(this, props));

        _this4.state = {
            officer: _this4.props.officer,
            engine: _this4.props.engine
        };
        return _this4;
    }

    _createClass(Staff, [{
        key: 'render',
        value: function render() {
            var _this5 = this;

            var army = this.state.engine.army;
            var unit = army.HQ.findUnitById(this.state.officer.unitId);
            if (!unit) unit = { name: 'No unit' };
            var superior = army.HQ.findCommandingOfficer(this.state.officer);
            var superiorHTML = !this.state.officer.reserved ? _react2.default.createElement(
                'div',
                null,
                _react2.default.createElement(
                    'div',
                    null,
                    'SUPERIOR OFFICER'
                ),
                _react2.default.createElement(Officer, { officer: superior, engine: this.state.engine }),
                _react2.default.createElement('br', null)
            ) : _react2.default.createElement('div', null);
            var inspectedSuperiorHTML = army.HQ.findInspected() && !army.HQ.findInspected().reserved ? _react2.default.createElement(
                'div',
                null,
                _react2.default.createElement(
                    'div',
                    null,
                    'SUPERIOR OFFICER'
                ),
                _react2.default.createElement(Officer, { officer: army.HQ.findCommandingOfficer(army.HQ.findInspected()), engine: this.state.engine })
            ) : _react2.default.createElement('div', null);
            var staff = [];
            var subordinates = [];
            var inspecteds = [];

            army.HQ.findStaff(this.state.officer).forEach(function (staffOfficer) {
                staff.push(_react2.default.createElement(
                    'li',
                    null,
                    _react2.default.createElement(Officer, { officer: staffOfficer, engine: _this5.state.engine })
                ));
            });

            army.HQ.findSubordinates(this.state.officer).forEach(function (subordinate) {
                subordinates.push(_react2.default.createElement(
                    'li',
                    null,
                    _react2.default.createElement(Officer, { officer: subordinate, engine: _this5.state.engine })
                ));
            });

            if (army.HQ.findInspected() && army.HQ.findInspected().name) {
                inspecteds.push(_react2.default.createElement(
                    'li',
                    null,
                    _react2.default.createElement(Officer, { officer: army.HQ.findInspected(), engine: this.state.engine }),
                    _react2.default.createElement('br', null),
                    inspectedSuperiorHTML
                ));
            }

            return _react2.default.createElement(
                'div',
                null,
                _react2.default.createElement(
                    'div',
                    null,
                    unit.name
                ),
                _react2.default.createElement('br', null),
                superiorHTML,
                _react2.default.createElement(
                    'div',
                    null,
                    'STAFF OFFICERS'
                ),
                _react2.default.createElement(
                    'ul',
                    { className: 'staffOfficers' },
                    staff
                ),
                _react2.default.createElement('br', null),
                _react2.default.createElement(
                    'div',
                    null,
                    'SUBORDINATE OFFICERS'
                ),
                _react2.default.createElement(
                    'ul',
                    { className: 'staffOfficers' },
                    subordinates
                ),
                _react2.default.createElement('br', null),
                _react2.default.createElement(
                    'div',
                    null,
                    'INSPECTED OFFICER'
                ),
                _react2.default.createElement(
                    'ul',
                    { className: 'staffOfficers' },
                    inspecteds
                )
            );
        }
    }]);

    return Staff;
}(_react2.default.Component);

var Officer = function (_React$Component5) {
    _inherits(Officer, _React$Component5);

    function Officer(props) {
        _classCallCheck(this, Officer);

        var _this6 = _possibleConstructorReturn(this, (Officer.__proto__ || Object.getPrototypeOf(Officer)).call(this, props));

        _this6.state = {
            engine: _this6.props.engine,
            officer: _this6.props.officer
        };
        return _this6;
    }

    _createClass(Officer, [{
        key: 'inspect',
        value: function inspect() {
            if (this.props.engine) this.props.engine.actions.inspect(this.props.officer.id);
        }
    }, {
        key: 'render',
        value: function render() {

            var html = this.props.officer ? _react2.default.createElement(
                'div',
                null,
                _react2.default.createElement(
                    'div',
                    { onClick: this.inspect.bind(this) },
                    this.props.officer.name()
                )
            ) : _react2.default.createElement('div', null);

            return html;
        }
    }]);

    return Officer;
}(_react2.default.Component);

var Unit = function (_React$Component6) {
    _inherits(Unit, _React$Component6);

    function Unit(props) {
        _classCallCheck(this, Unit);

        var _this7 = _possibleConstructorReturn(this, (Unit.__proto__ || Object.getPrototypeOf(Unit)).call(this, props));

        _this7.state = {
            player: _this7.props.officer,
            engine: _this7.props.engine,
            name: undefined,
            type: undefined,
            officer: undefined,
            target: undefined,
            targets: undefined
        };
        return _this7;
    }

    _createClass(Unit, [{
        key: 'startOperation',
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
        key: 'handleName',
        value: function handleName(event) {
            this.setState({ name: event.target.value });
        }
    }, {
        key: 'handleType',
        value: function handleType(event) {
            this.setState({ type: event.target.value });
        }
    }, {
        key: 'handleOfficer',
        value: function handleOfficer(event) {
            this.setState({ officer: event.target.value });
        }
    }, {
        key: 'handleTarget',
        value: function handleTarget(event) {
            this.setState({ target: event.target.value });
        }
    }, {
        key: 'handleSearch',
        value: function handleSearch(event) {
            this.setState({ targets: this.state.engine.army.HQ.findOfficersByName(event.target.value) });
        }
    }, {
        key: 'render',
        value: function render() {
            var army = this.state.engine.army;
            var player = this.state.player;
            var targets = this.state.targets ? this.state.targets : army.HQ.findActiveOfficers();

            var types = ['commanding', 'intelligence'];
            var staff = army.HQ.findStaff(this.props.officer);

            var operationTypes = [];
            var officers = [];
            var staffOfficers = [];

            types.forEach(function (type) {
                operationTypes.push(_react2.default.createElement(
                    'option',
                    null,
                    type
                ));
            });

            targets.forEach(function (target) {
                officers.push(_react2.default.createElement(
                    'option',
                    { value: target.id },
                    target.name()
                ));
            });

            staff.forEach(function (officer) {
                staffOfficers.push(_react2.default.createElement(
                    'option',
                    { value: [officer.id, player.unitId] },
                    officer.name()
                ));
            });

            operationTypes.unshift(_react2.default.createElement('option', null));
            officers.unshift(_react2.default.createElement('option', null));
            staffOfficers.unshift(_react2.default.createElement('option', null));

            return _react2.default.createElement(
                'div',
                null,
                _react2.default.createElement(
                    'div',
                    null,
                    'New Operation'
                ),
                _react2.default.createElement(
                    'div',
                    null,
                    'Type'
                ),
                _react2.default.createElement('input', { onChange: this.handleName.bind(this) }),
                _react2.default.createElement(
                    'select',
                    { id: 'operationType', onChange: this.handleType.bind(this) },
                    operationTypes
                ),
                _react2.default.createElement(
                    'div',
                    null,
                    'Commander'
                ),
                _react2.default.createElement(
                    'select',
                    { id: 'operationOfficer', onChange: this.handleOfficer.bind(this) },
                    staffOfficers
                ),
                _react2.default.createElement(
                    'div',
                    null,
                    'Target'
                ),
                _react2.default.createElement('input', { type: 'text', onChange: this.handleSearch.bind(this) }),
                _react2.default.createElement(
                    'select',
                    { id: 'operationTarget', onChange: this.handleTarget.bind(this) },
                    officers
                ),
                _react2.default.createElement('br', null),
                _react2.default.createElement(
                    'button',
                    { onClick: this.startOperation.bind(this) },
                    'Start Operation'
                )
            );
        }
    }]);

    return Unit;
}(_react2.default.Component);

exports.default = Ui;

},{"./comparisons":3,"./lib/react":10}],20:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _names = require('./names');

var _names2 = _interopRequireDefault(_names);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Unit = function Unit(spec, HQ) {
  _classCallCheck(this, Unit);

  this.id = spec.id;
  this.parentId = spec.parentId;
  this.type = spec.type;
  this.name = _names2.default[spec.type][0];
  _names2.default[spec.type].shift();
  this.subunits = [];
  this.reserve = [];
  this.commander = HQ.officers.recruit.call(HQ, spec.rank, this.id, false, this.name);
};

exports.default = Unit;

},{"./names":11}],21:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _region = require('./region');

var _region2 = _interopRequireDefault(_region);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var World = function () {
  function World(HQ) {
    _classCallCheck(this, World);

    this.regions = [];
    this.generate(HQ);
  }

  _createClass(World, [{
    key: 'addRegion',
    value: function addRegion() {
      var regionId = this.regions.length;
      this.regions.push(new _region2.default(regionId));
    }
  }, {
    key: 'generate',
    value: function generate(HQ) {
      var amount = _config2.default.random(10) + 5;
      for (var i = 0; i < amount; i++) {
        this.addRegion();
      }
      this.mapUnitsAndRegions(HQ);
    }
  }, {
    key: 'mapUnitsAndRegions',
    value: function mapUnitsAndRegions(HQ) {
      var unitsPerRegion = Math.ceil(HQ.units.length / this.regions.length) + 1;
      var unitIndex = 0;

      this.regions.map(function (region) {
        var count = 0;

        while (count < unitsPerRegion) {
          var unit = HQ.units[unitIndex];

          if (unit) {
            region.units.push(unit);
            unit.regionId = region.id;
            unitIndex++;
            count++;
          } else {
            return;
          }
        }
      });
    }
  }]);

  return World;
}();

exports.default = World;

},{"./config":4,"./region":16}],22:[function(require,module,exports){
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

},{}]},{},[6]);
