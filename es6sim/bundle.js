(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _hq = require('./hq');

var _hq2 = _interopRequireDefault(_hq);

var _unit = require('./unit');

var _unit2 = _interopRequireDefault(_unit);

var _world = require('./world');

var _world2 = _interopRequireDefault(_world);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _officers = require('./officers');

var _officers2 = _interopRequireDefault(_officers);

var Army = (function () {
  function Army() {
    _classCallCheck(this, Army);

    this.HQ = new _hq2['default']();
    this.HQ.officers = new _officers2['default'](this.HQ);

    this._unitsId = 2;
    this.units = {
      corps: []
    };

    this.id = 1;
    this.generate('corp', _config2['default'].unitDepth);
    this.HQ.world = new _world2['default'](this.HQ);
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
            var unit = new _unit2['default'](spec, this.HQ);
            this.units.corps.push(unit);

            this.generate('division', _config2['default'].unitDepth, unit);
            this.generate('corp', quantity - 1, parent);
            break;

          case 'division':
            spec.rank = 'dgeneral';
            unit = new _unit2['default'](spec, this.HQ);
            parent.subunits.push(unit);

            this.generate('brigade', _config2['default'].unitDepth, unit);
            this.generate('division', quantity - 1, parent);
            break;

          case 'brigade':
            spec.rank = 'bgeneral';
            unit = new _unit2['default'](spec, this.HQ);
            parent.subunits.push(unit);

            this.generate('regiment', _config2['default'].unitDepth, unit);
            this.generate('brigade', quantity - 1, parent);
            break;

          case 'regiment':
            spec.rank = 'coronel';
            unit = new _unit2['default'](spec, this.HQ);
            parent.subunits.push(unit);

            this.generate('battalion', _config2['default'].unitDepth, unit);
            this.generate('regiment', quantity - 1, parent);
            break;

          case 'battalion':
            spec.rank = 'lcoronel';
            unit = new _unit2['default'](spec, this.HQ);
            parent.subunits.push(unit);

            this.generate('company', _config2['default'].unitDepth, unit);
            this.generate('battalion', quantity - 1, parent);
            break;

          case 'company':
            spec.rank = 'major';
            unit = new _unit2['default'](spec, this.HQ);
            parent.subunits.push(unit);

            this.generate('platoon', _config2['default'].unitDepth, unit);
            this.generate('company', quantity - 1, parent);
            break;

          case 'platoon':
            spec.rank = 'captain';
            unit = new _unit2['default'](spec, this.HQ);
            parent.subunits.push(unit);

            this.generate('squad', _config2['default'].unitDepth, unit);
            this.generate('platoon', quantity - 1, parent);
            break;

          case 'squad':
            spec.rank = 'lieutenant';
            unit = new _unit2['default'](spec, this.HQ);
            parent.subunits.push(unit);

            this.generate('squad', quantity - 1, parent);
            break;
        }

        this.HQ.add(unit);
      }
    }
  }]);

  return Army;
})();

exports['default'] = Army;
module.exports = exports['default'];

},{"./config":2,"./hq":5,"./officers":10,"./unit":17,"./world":18}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
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
    var realDate = undefined;
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

exports['default'] = config;
module.exports = exports['default'];

},{}],3:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _uiJsx = require('./ui.jsx');

var _uiJsx2 = _interopRequireDefault(_uiJsx);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var Engine = (function () {
  function Engine(army) {
    _classCallCheck(this, Engine);

    this.army = army;
    this.ui = new _uiJsx2['default'](this);
    this.turn = 0;
    this.running = true;
    this.start(this);
  }

  _createClass(Engine, [{
    key: 'start',
    value: function start(engine) {
      this.update();
      this.army.HQ.player();
      this.updateUI();
    }
  }, {
    key: 'pause',
    value: function pause() {
      this.running = !this.running;
      if (this.running) this.update();
    }
  }, {
    key: 'update',
    value: function update() {
      var _this = this;

      while (this.turn < _config2['default'].bufferTurns) {
        this.army.HQ.update();
        this.turn++;
      }

      this.army.HQ.update();
      this.turn++;

      if (this.running) setTimeout(function () {
        _this.update();
      }, _config2['default'].speed);
    }
  }, {
    key: 'updateUI',
    value: function updateUI() {
      var _this2 = this;

      this.ui.render(this.army);
      setTimeout(function () {
        _this2.updateUI();
      }, _config2['default'].speed);
    }
  }]);

  return Engine;
})();

exports['default'] = Engine;
module.exports = exports['default'];

},{"./config":2,"./ui.jsx":16}],4:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _engine = require('./engine');

var _engine2 = _interopRequireDefault(_engine);

var _army = require('./army');

var _army2 = _interopRequireDefault(_army);

var army = new _army2['default']();
var engine = new _engine2['default'](army);

},{"./army":1,"./engine":3}],5:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

require('./lib/date.js');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _operations = require('./operations');

var _operations2 = _interopRequireDefault(_operations);

var HQ = (function () {
  function HQ() {
    _classCallCheck(this, HQ);

    this.operations = new _operations2['default']();
    this.rawDate = new Date();
    this.units = [];
  }

  _createClass(HQ, [{
    key: 'updateDate',
    value: function updateDate() {
      this.rawDate = this.rawDate.addDays(_config2['default'].random(150));
      this.realDate = _config2['default'].formatDate(this.rawDate);
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
      var unit = squads[_config2['default'].random(squads.length) + 1];
      unit.commander.reserved = true;
      unit.commander = this.officers.replaceForPlayer.call(this, unit.commander);
      this.player = unit.commander;
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
        return unit.id === officerUnit.parentId;
      })[0];
      return superiorUnit.commander;
    }
  }, {
    key: 'findOfficerById',
    value: function findOfficerById(officerId) {
      return this.officers.active.filter(function (officer) {
        return officer.id === Number(officerId);
      })[0];
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
      unit.reserve.forEach(function (officer) {
        staff.push(officer);
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
      unit.subunits.forEach(function (subunit) {
        subordinates.push(subunit.commander);
      });
      return subordinates;
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
})();

exports['default'] = HQ;
module.exports = exports['default'];

},{"./config":2,"./lib/date.js":7,"./operations":11}],6:[function(require,module,exports){
(function (Buffer){
"use strict";

!(function () {
  function a(b) {
    if (!(this instanceof a)) return null == b ? new a() : new a(b);if ("function" == typeof b) return (this.random = b, this);var c;arguments.length && (this.seed = 0);for (var d = 0; d < arguments.length; d++) {
      if ((c = 0, "string" == typeof arguments[d])) for (var e = 0; e < arguments[d].length; e++) c += (arguments[d].length - e) * arguments[d].charCodeAt(e);else c = arguments[d];this.seed += (arguments.length - d) * c;
    }return (this.mt = this.mersenne_twister(this.seed), this.bimd5 = this.blueimp_md5(), this.random = function () {
      return this.mt.random(this.seed);
    }, this);
  }function b(a, b) {
    if ((a || (a = {}), b)) for (var c in b) "undefined" == typeof a[c] && (a[c] = b[c]);return a;
  }function c(a, b) {
    if (a) throw new RangeError(b);
  }function d(a) {
    return function () {
      return this.natural(a);
    };
  }function e(a, b) {
    for (var c, d = r(a), e = 0, f = d.length; f > e; e++) c = d[e], b[c] = a[c] || b[c];
  }function f(a, b) {
    for (var c = 0, d = a.length; d > c; c++) b[c] = a[c];
  }function g(a, b) {
    var c = Array.isArray(a),
        d = b || (c ? new Array(a.length) : {});return (c ? f(a, d) : e(a, d), d);
  }var h = 9007199254740992,
      i = -h,
      j = "0123456789",
      k = "abcdefghijklmnopqrstuvwxyz",
      l = k.toUpperCase(),
      m = j + "abcdef",
      n = Array.prototype.slice;a.prototype.VERSION = "0.7.6";var o = function o() {
    throw new Error("No Base64 encoder available.");
  };!(function () {
    "function" == typeof btoa ? o = btoa : "function" == typeof Buffer && (o = function (a) {
      return new Buffer(a).toString("base64");
    });
  })(), a.prototype.bool = function (a) {
    return (a = b(a, { likelihood: 50 }), c(a.likelihood < 0 || a.likelihood > 100, "Chance: Likelihood accepts values from 0 to 100."), 100 * this.random() < a.likelihood);
  }, a.prototype.character = function (a) {
    a = b(a), c(a.alpha && a.symbols, "Chance: Cannot specify both alpha and symbols.");var d,
        e,
        f = "!@#$%^&*()[]";return (d = "lower" === a.casing ? k : "upper" === a.casing ? l : k + l, e = a.pool ? a.pool : a.alpha ? d : a.symbols ? f : d + j + f, e.charAt(this.natural({ max: e.length - 1 })));
  }, a.prototype.floating = function (a) {
    a = b(a, { fixed: 4 }), c(a.fixed && a.precision, "Chance: Cannot specify both fixed and precision.");var d,
        e = Math.pow(10, a.fixed),
        f = h / e,
        g = -f;c(a.min && a.fixed && a.min < g, "Chance: Min specified is out of range with fixed. Min should be, at least, " + g), c(a.max && a.fixed && a.max > f, "Chance: Max specified is out of range with fixed. Max should be, at most, " + f), a = b(a, { min: g, max: f }), d = this.integer({ min: a.min * e, max: a.max * e });var i = (d / e).toFixed(a.fixed);return parseFloat(i);
  }, a.prototype.integer = function (a) {
    return (a = b(a, { min: i, max: h }), c(a.min > a.max, "Chance: Min cannot be greater than Max."), Math.floor(this.random() * (a.max - a.min + 1) + a.min));
  }, a.prototype.natural = function (a) {
    return (a = b(a, { min: 0, max: h }), c(a.min < 0, "Chance: Min cannot be less than zero."), this.integer(a));
  }, a.prototype.string = function (a) {
    a = b(a, { length: this.natural({ min: 5, max: 20 }) }), c(a.length < 0, "Chance: Length cannot be less than zero.");var d = a.length,
        e = this.n(this.character, d, a);return e.join("");
  }, a.prototype.capitalize = function (a) {
    return a.charAt(0).toUpperCase() + a.substr(1);
  }, a.prototype.mixin = function (b) {
    for (var c in b) a.prototype[c] = b[c];return this;
  }, a.prototype.unique = function (a, d, e) {
    c("function" != typeof a, "Chance: The first argument must be a function."), e = b(e, { comparator: function comparator(a, b) {
        return -1 !== a.indexOf(b);
      } });for (var f, g = [], h = 0, i = 50 * d, j = n.call(arguments, 2); g.length < d;) if ((f = a.apply(this, j), e.comparator(g, f) || (g.push(f), h = 0), ++h > i)) throw new RangeError("Chance: num is likely too large for sample set");return g;
  }, a.prototype.n = function (a, b) {
    c("function" != typeof a, "Chance: The first argument must be a function."), "undefined" == typeof b && (b = 1);var d = b,
        e = [],
        f = n.call(arguments, 2);for (d = Math.max(0, d), null; d--; null) e.push(a.apply(this, f));return e;
  }, a.prototype.pad = function (a, b, c) {
    return (c = c || "0", a += "", a.length >= b ? a : new Array(b - a.length + 1).join(c) + a);
  }, a.prototype.pick = function (a, b) {
    if (0 === a.length) throw new RangeError("Chance: Cannot pick() from an empty array");return b && 1 !== b ? this.shuffle(a).slice(0, b) : a[this.natural({ max: a.length - 1 })];
  }, a.prototype.shuffle = function (a) {
    for (var b = a.slice(0), c = [], d = 0, e = Number(b.length), f = 0; e > f; f++) d = this.natural({ max: b.length - 1 }), c[f] = b[d], b.splice(d, 1);return c;
  }, a.prototype.weighted = function (a, b) {
    if (a.length !== b.length) throw new RangeError("Chance: length of array and weights must match");for (var c = b.length - 1; c >= 0; --c) b[c] <= 0 && (a.splice(c, 1), b.splice(c, 1));if (b.some(function (a) {
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
        i = 0;return (b.some(function (b, c) {
      return i + b >= h ? (f = a[c], !0) : (i += b, !1);
    }), f);
  }, a.prototype.paragraph = function (a) {
    a = b(a);var c = a.sentences || this.natural({ min: 3, max: 7 }),
        d = this.n(this.sentence, c);return d.join(" ");
  }, a.prototype.sentence = function (a) {
    a = b(a);var c,
        d = a.words || this.natural({ min: 12, max: 18 }),
        e = this.n(this.word, d);return (c = e.join(" "), c = this.capitalize(c) + ".");
  }, a.prototype.syllable = function (a) {
    a = b(a);for (var c, d = a.length || this.natural({ min: 2, max: 3 }), e = "bcdfghjklmnprstvwz", f = "aeiou", g = e + f, h = "", i = 0; d > i; i++) c = this.character(0 === i ? { pool: g } : -1 === e.indexOf(c) ? { pool: e } : { pool: f }), h += c;return h;
  }, a.prototype.word = function (a) {
    a = b(a), c(a.syllables && a.length, "Chance: Cannot specify both syllables AND length.");var d = a.syllables || this.natural({ min: 1, max: 3 }),
        e = "";if (a.length) {
      do e += this.syllable(); while (e.length < a.length);e = e.substring(0, a.length);
    } else for (var f = 0; d > f; f++) e += this.syllable();return e;
  }, a.prototype.age = function (a) {
    a = b(a);var c;switch (a.type) {case "child":
        c = { min: 1, max: 12 };break;case "teen":
        c = { min: 13, max: 19 };break;case "adult":
        c = { min: 18, max: 65 };break;case "senior":
        c = { min: 65, max: 100 };break;case "all":
        c = { min: 1, max: 100 };break;default:
        c = { min: 18, max: 65 };}return this.natural(c);
  }, a.prototype.birthday = function (a) {
    return (a = b(a, { year: new Date().getFullYear() - this.age(a) }), this.date(a));
  }, a.prototype.cpf = function () {
    var a = this.n(this.natural, 9, { max: 9 }),
        b = 2 * a[8] + 3 * a[7] + 4 * a[6] + 5 * a[5] + 6 * a[4] + 7 * a[3] + 8 * a[2] + 9 * a[1] + 10 * a[0];b = 11 - b % 11, b >= 10 && (b = 0);var c = 2 * b + 3 * a[8] + 4 * a[7] + 5 * a[6] + 6 * a[5] + 7 * a[4] + 8 * a[3] + 9 * a[2] + 10 * a[1] + 11 * a[0];return (c = 11 - c % 11, c >= 10 && (c = 0), "" + a[0] + a[1] + a[2] + "." + a[3] + a[4] + a[5] + "." + a[6] + a[7] + a[8] + "-" + b + c);
  }, a.prototype.first = function (a) {
    return (a = b(a, { gender: this.gender() }), this.pick(this.get("firstNames")[a.gender.toLowerCase()]));
  }, a.prototype.gender = function () {
    return this.pick(["Male", "Female"]);
  }, a.prototype.last = function () {
    return this.pick(this.get("lastNames"));
  }, a.prototype.mrz = function (a) {
    var c = function c(a) {
      var b = "<ABCDEFGHIJKLMNOPQRSTUVWXYXZ".split(""),
          c = [7, 3, 1],
          d = 0;return ("string" != typeof a && (a = a.toString()), a.split("").forEach(function (a, e) {
        var f = b.indexOf(a);a = -1 !== f ? 0 === f ? 0 : f + 9 : parseInt(a, 10), a *= c[e % c.length], d += a;
      }), d % 10);
    },
        d = function d(a) {
      var b = function b(a) {
        return new Array(a + 1).join("<");
      },
          d = ["P<", a.issuer, a.last.toUpperCase(), "<<", a.first.toUpperCase(), b(39 - (a.last.length + a.first.length + 2)), a.passportNumber, c(a.passportNumber), a.nationality, a.dob, c(a.dob), a.gender, a.expiry, c(a.expiry), b(14), c(b(14))].join("");return d + c(d.substr(44, 10) + d.substr(57, 7) + d.substr(65, 7));
    },
        e = this;return (a = b(a, { first: this.first(), last: this.last(), passportNumber: this.integer({ min: 1e8, max: 999999999 }), dob: (function () {
        var a = e.birthday({ type: "adult" });return [a.getFullYear().toString().substr(2), e.pad(a.getMonth() + 1, 2), e.pad(a.getDate(), 2)].join("");
      })(), expiry: (function () {
        var a = new Date();return [(a.getFullYear() + 5).toString().substr(2), e.pad(a.getMonth() + 1, 2), e.pad(a.getDate(), 2)].join("");
      })(), gender: "Female" === this.gender() ? "F" : "M", issuer: "GBR", nationality: "GBR" }), d(a));
  }, a.prototype.name = function (a) {
    a = b(a);var c,
        d = this.first(a),
        e = this.last();return (c = a.middle ? d + " " + this.first(a) + " " + e : a.middle_initial ? d + " " + this.character({ alpha: !0, casing: "upper" }) + ". " + e : d + " " + e, a.prefix && (c = this.prefix(a) + " " + c), a.suffix && (c = c + " " + this.suffix(a)), c);
  }, a.prototype.name_prefixes = function (a) {
    a = a || "all", a = a.toLowerCase();var b = [{ name: "Doctor", abbreviation: "Dr." }];return (("male" === a || "all" === a) && b.push({ name: "Mister", abbreviation: "Mr." }), ("female" === a || "all" === a) && (b.push({ name: "Miss", abbreviation: "Miss" }), b.push({ name: "Misses", abbreviation: "Mrs." })), b);
  }, a.prototype.prefix = function (a) {
    return this.name_prefix(a);
  }, a.prototype.name_prefix = function (a) {
    return (a = b(a, { gender: "all" }), a.full ? this.pick(this.name_prefixes(a.gender)).name : this.pick(this.name_prefixes(a.gender)).abbreviation);
  }, a.prototype.ssn = function (a) {
    a = b(a, { ssnFour: !1, dashes: !0 });var c,
        d = "1234567890",
        e = a.dashes ? "-" : "";return c = a.ssnFour ? this.string({ pool: d, length: 4 }) : this.string({ pool: d, length: 3 }) + e + this.string({ pool: d, length: 2 }) + e + this.string({ pool: d, length: 4 });
  }, a.prototype.name_suffixes = function () {
    var a = [{ name: "Doctor of Osteopathic Medicine", abbreviation: "D.O." }, { name: "Doctor of Philosophy", abbreviation: "Ph.D." }, { name: "Esquire", abbreviation: "Esq." }, { name: "Junior", abbreviation: "Jr." }, { name: "Juris Doctor", abbreviation: "J.D." }, { name: "Master of Arts", abbreviation: "M.A." }, { name: "Master of Business Administration", abbreviation: "M.B.A." }, { name: "Master of Science", abbreviation: "M.S." }, { name: "Medical Doctor", abbreviation: "M.D." }, { name: "Senior", abbreviation: "Sr." }, { name: "The Third", abbreviation: "III" }, { name: "The Fourth", abbreviation: "IV" }, { name: "Bachelor of Engineering", abbreviation: "B.E" }, { name: "Bachelor of Technology", abbreviation: "B.TECH" }];return a;
  }, a.prototype.suffix = function (a) {
    return this.name_suffix(a);
  }, a.prototype.name_suffix = function (a) {
    return (a = b(a), a.full ? this.pick(this.name_suffixes()).name : this.pick(this.name_suffixes()).abbreviation);
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
        i = { protocol: null, email: null, fileExtension: null, size: null, fallback: null, rating: null };if (a) if ("string" == typeof a) i.email = a, a = {};else {
      if ("object" != typeof a) return null;if ("Array" === a.constructor) return null;
    } else i.email = this.email(), a = {};return (i = b(a, i), i.email || (i.email = this.email()), i.protocol = e[i.protocol] ? i.protocol + ":" : "", i.size = parseInt(i.size, 0) ? i.size : "", i.rating = h[i.rating] ? i.rating : "", i.fallback = g[i.fallback] ? i.fallback : "", i.fileExtension = f[i.fileExtension] ? i.fileExtension : "", c = i.protocol + d + this.bimd5.md5(i.email) + (i.fileExtension ? "." + i.fileExtension : "") + (i.size || i.rating || i.fallback ? "?" : "") + (i.size ? "&s=" + i.size.toString() : "") + (i.rating ? "&r=" + i.rating : "") + (i.fallback ? "&d=" + i.fallback : ""));
  }, a.prototype.color = function (a) {
    function c(a, b) {
      return [a, a, a].join(b || "");
    }a = b(a, { format: this.pick(["hex", "shorthex", "rgb", "rgba", "0x"]), grayscale: !1, casing: "lower" });var d,
        e = a.grayscale;if ("hex" === a.format) d = "#" + (e ? c(this.hash({ length: 2 })) : this.hash({ length: 6 }));else if ("shorthex" === a.format) d = "#" + (e ? c(this.hash({ length: 1 })) : this.hash({ length: 3 }));else if ("rgb" === a.format) d = e ? "rgb(" + c(this.natural({ max: 255 }), ",") + ")" : "rgb(" + this.natural({ max: 255 }) + "," + this.natural({ max: 255 }) + "," + this.natural({ max: 255 }) + ")";else if ("rgba" === a.format) d = e ? "rgba(" + c(this.natural({ max: 255 }), ",") + "," + this.floating({ min: 0, max: 1 }) + ")" : "rgba(" + this.natural({ max: 255 }) + "," + this.natural({ max: 255 }) + "," + this.natural({ max: 255 }) + "," + this.floating({ min: 0, max: 1 }) + ")";else {
      if ("0x" !== a.format) throw new RangeError('Invalid format provided. Please provide one of "hex", "shorthex", "rgb", "rgba", or "0x".');d = "0x" + (e ? c(this.hash({ length: 2 })) : this.hash({ length: 6 }));
    }return ("upper" === a.casing && (d = d.toUpperCase()), d);
  }, a.prototype.domain = function (a) {
    return (a = b(a), this.word() + "." + (a.tld || this.tld()));
  }, a.prototype.email = function (a) {
    return (a = b(a), this.word({ length: a.length }) + "@" + (a.domain || this.domain()));
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
    return (a = b(a), this.natural({ min: 5, max: 2e3 }) + " " + this.street(a));
  }, a.prototype.altitude = function (a) {
    return (a = b(a, { fixed: 5, min: 0, max: 8848 }), this.floating({ min: a.min, max: a.max, fixed: a.fixed }));
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
    return (a = b(a, { fixed: 5, min: -2550, max: 0 }), this.floating({ min: a.min, max: a.max, fixed: a.fixed }));
  }, a.prototype.geohash = function (a) {
    return (a = b(a, { length: 7 }), this.string({ length: a.length, pool: "0123456789bcdefghjkmnpqrstuvwxyz" }));
  }, a.prototype.geojson = function (a) {
    return this.latitude(a) + ", " + this.longitude(a) + ", " + this.altitude(a);
  }, a.prototype.latitude = function (a) {
    return (a = b(a, { fixed: 5, min: -90, max: 90 }), this.floating({ min: a.min, max: a.max, fixed: a.fixed }));
  }, a.prototype.longitude = function (a) {
    return (a = b(a, { fixed: 5, min: -180, max: 180 }), this.floating({ min: a.min, max: a.max, fixed: a.fixed }));
  }, a.prototype.phone = function (a) {
    var c,
        d = this,
        e = function e(a) {
      var b = [];return (a.sections.forEach(function (a) {
        b.push(d.string({ pool: "0123456789", length: a }));
      }), a.area + b.join(" "));
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
        f = this.get("armed_forces");return (c = d, a.territories && (c = c.concat(e)), a.armed_forces && (c = c.concat(f)), c);
  }, a.prototype.street = function (a) {
    a = b(a);var c = this.word({ syllables: 2 });return (c = this.capitalize(c), c += " ", c += a.short_suffix ? this.street_suffix().abbreviation : this.street_suffix().name);
  }, a.prototype.street_suffix = function () {
    return this.pick(this.street_suffixes());
  }, a.prototype.street_suffixes = function () {
    return this.get("street_suffixes");
  }, a.prototype.zip = function (a) {
    var b = this.n(this.natural, 5, { max: 9 });return (a && a.plusfour === !0 && (b.push("-"), b = b.concat(this.n(this.natural, 4, { max: 9 }))), b.join(""));
  }, a.prototype.ampm = function () {
    return this.bool() ? "am" : "pm";
  }, a.prototype.date = function (a) {
    var c, d;if (a && (a.min || a.max)) {
      a = b(a, { american: !0, string: !1 });var e = "undefined" != typeof a.min ? a.min.getTime() : 1,
          f = "undefined" != typeof a.max ? a.max.getTime() : 864e13;d = new Date(this.natural({ min: e, max: f }));
    } else {
      var g = this.month({ raw: !0 }),
          h = g.days;a && a.month && (h = this.get("months")[(a.month % 12 + 12) % 12].days), a = b(a, { year: parseInt(this.year(), 10), month: g.numeric - 1, day: this.natural({ min: 1, max: h }), hour: this.hour(), minute: this.minute(), second: this.second(), millisecond: this.millisecond(), american: !0, string: !1 }), d = new Date(a.year, a.month, a.day, a.hour, a.minute, a.second, a.millisecond);
    }return (c = a.american ? d.getMonth() + 1 + "/" + d.getDate() + "/" + d.getFullYear() : d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear(), a.string ? c : d);
  }, a.prototype.hammertime = function (a) {
    return this.date(a).getTime();
  }, a.prototype.hour = function (a) {
    return (a = b(a, { min: 1, max: a && a.twentyfour ? 24 : 12 }), c(a.min < 1, "Chance: Min cannot be less than 1."), c(a.twentyfour && a.max > 24, "Chance: Max cannot be greater than 24 for twentyfour option."), c(!a.twentyfour && a.max > 12, "Chance: Max cannot be greater than 12."), c(a.min > a.max, "Chance: Min cannot be greater than Max."), this.natural({ min: a.min, max: a.max }));
  }, a.prototype.millisecond = function () {
    return this.natural({ max: 999 });
  }, a.prototype.minute = a.prototype.second = function (a) {
    return (a = b(a, { min: 0, max: 59 }), c(a.min < 0, "Chance: Min cannot be less than 0."), c(a.max > 59, "Chance: Max cannot be greater than 59."), c(a.min > a.max, "Chance: Min cannot be greater than Max."), this.natural({ min: a.min, max: a.max }));
  }, a.prototype.month = function (a) {
    a = b(a, { min: 1, max: 12 }), c(a.min < 1, "Chance: Min cannot be less than 1."), c(a.max > 12, "Chance: Max cannot be greater than 12."), c(a.min > a.max, "Chance: Min cannot be greater than Max.");var d = this.pick(this.months().slice(a.min - 1, a.max));return a.raw ? d : d.name;
  }, a.prototype.months = function () {
    return this.get("months");
  }, a.prototype.second = function () {
    return this.natural({ max: 59 });
  }, a.prototype.timestamp = function () {
    return this.natural({ min: 1, max: parseInt(new Date().getTime() / 1e3, 10) });
  }, a.prototype.year = function (a) {
    return (a = b(a, { min: new Date().getFullYear() }), a.max = "undefined" != typeof a.max ? a.max : a.min + 100, this.natural(a).toString());
  }, a.prototype.cc = function (a) {
    a = b(a);var c, d, e;return (c = this.cc_type(a.type ? { name: a.type, raw: !0 } : { raw: !0 }), d = c.prefix.split(""), e = c.length - c.prefix.length - 1, d = d.concat(this.n(this.integer, e, { min: 0, max: 9 })), d.push(this.luhn_calculate(d.join(""))), d.join(""));
  }, a.prototype.cc_types = function () {
    return this.get("cc_types");
  }, a.prototype.cc_type = function (a) {
    a = b(a);var c = this.cc_types(),
        d = null;if (a.name) {
      for (var e = 0; e < c.length; e++) if (c[e].name === a.name || c[e].short_name === a.name) {
        d = c[e];break;
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
        d = c.split(".")[1];return (void 0 === d ? c += ".00" : d.length < 2 && (c += "0"), 0 > c ? "-$" + c.replace("-", "") : "$" + c);
  }, a.prototype.exp = function (a) {
    a = b(a);var c = {};return (c.year = this.exp_year(), c.year === new Date().getFullYear().toString() ? c.month = this.exp_month({ future: !0 }) : c.month = this.exp_month(), a.raw ? c : c.month + "/" + c.year);
  }, a.prototype.exp_month = function (a) {
    a = b(a);var c,
        d,
        e = new Date().getMonth() + 1;if (a.future) {
      do c = this.month({ raw: !0 }).numeric, d = parseInt(c, 10); while (e >= d);
    } else c = this.month({ raw: !0 }).numeric;return c;
  }, a.prototype.exp_year = function () {
    return this.year({ max: new Date().getFullYear() + 10 });
  }, a.prototype.d4 = d({ min: 1, max: 4 }), a.prototype.d6 = d({ min: 1, max: 6 }), a.prototype.d8 = d({ min: 1, max: 8 }), a.prototype.d10 = d({ min: 1, max: 10 }), a.prototype.d12 = d({ min: 1, max: 12 }), a.prototype.d20 = d({ min: 1, max: 20 }), a.prototype.d30 = d({ min: 1, max: 30 }), a.prototype.d100 = d({ min: 1, max: 100 }), a.prototype.rpg = function (a, c) {
    if ((c = b(c), a)) {
      var d = a.toLowerCase().split("d"),
          e = [];if (2 !== d.length || !parseInt(d[0], 10) || !parseInt(d[1], 10)) throw new Error("Invalid format provided. Please provide #d# where the first # is the number of dice to roll, the second # is the max of each die");for (var f = d[0]; f > 0; f--) e[f - 1] = this.natural({ min: 1, max: d[1] });return "undefined" != typeof c.sum && c.sum ? e.reduce(function (a, b) {
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
    for (var b, c = a.toString().split("").reverse(), d = 0, e = 0, f = c.length; f > e; ++e) b = +c[e], e % 2 === 0 && (b *= 2, b > 9 && (b -= 9)), d += b;return 9 * d % 10;
  }, a.prototype.md5 = function (a) {
    var c = { str: "", key: null, raw: !1 };if (a) if ("string" == typeof a) c.str = a, a = {};else {
      if ("object" != typeof a) return null;if ("Array" === a.constructor) return null;
    } else c.str = this.string(), a = {};if ((c = b(a, c), !c.str)) throw new Error("A parameter is required to return an md5 hash.");return this.bimd5.md5(c.str, c.key, c.raw);
  };var p = { firstNames: { male: ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Charles", "Thomas", "Christopher", "Daniel", "Matthew", "George", "Donald", "Anthony", "Paul", "Mark", "Edward", "Steven", "Kenneth", "Andrew", "Brian", "Joshua", "Kevin", "Ronald", "Timothy", "Jason", "Jeffrey", "Frank", "Gary", "Ryan", "Nicholas", "Eric", "Stephen", "Jacob", "Larry", "Jonathan", "Scott", "Raymond", "Justin", "Brandon", "Gregory", "Samuel", "Benjamin", "Patrick", "Jack", "Henry", "Walter", "Dennis", "Jerry", "Alexander", "Peter", "Tyler", "Douglas", "Harold", "Aaron", "Jose", "Adam", "Arthur", "Zachary", "Carl", "Nathan", "Albert", "Kyle", "Lawrence", "Joe", "Willie", "Gerald", "Roger", "Keith", "Jeremy", "Terry", "Harry", "Ralph", "Sean", "Jesse", "Roy", "Louis", "Billy", "Austin", "Bruce", "Eugene", "Christian", "Bryan", "Wayne", "Russell", "Howard", "Fred", "Ethan", "Jordan", "Philip", "Alan", "Juan", "Randy", "Vincent", "Bobby", "Dylan", "Johnny", "Phillip", "Victor", "Clarence", "Ernest", "Martin", "Craig", "Stanley", "Shawn", "Travis", "Bradley", "Leonard", "Earl", "Gabriel", "Jimmy", "Francis", "Todd", "Noah", "Danny", "Dale", "Cody", "Carlos", "Allen", "Frederick", "Logan", "Curtis", "Alex", "Joel", "Luis", "Norman", "Marvin", "Glenn", "Tony", "Nathaniel", "Rodney", "Melvin", "Alfred", "Steve", "Cameron", "Chad", "Edwin", "Caleb", "Evan", "Antonio", "Lee", "Herbert", "Jeffery", "Isaac", "Derek", "Ricky", "Marcus", "Theodore", "Elijah", "Luke", "Jesus", "Eddie", "Troy", "Mike", "Dustin", "Ray", "Adrian", "Bernard", "Leroy", "Angel", "Randall", "Wesley", "Ian", "Jared", "Mason", "Hunter", "Calvin", "Oscar", "Clifford", "Jay", "Shane", "Ronnie", "Barry", "Lucas", "Corey", "Manuel", "Leo", "Tommy", "Warren", "Jackson", "Isaiah", "Connor", "Don", "Dean", "Jon", "Julian", "Miguel", "Bill", "Lloyd", "Charlie", "Mitchell", "Leon", "Jerome", "Darrell", "Jeremiah", "Alvin", "Brett", "Seth", "Floyd", "Jim", "Blake", "Micheal", "Gordon", "Trevor", "Lewis", "Erik", "Edgar", "Vernon", "Devin", "Gavin", "Jayden", "Chris", "Clyde", "Tom", "Derrick", "Mario", "Brent", "Marc", "Herman", "Chase", "Dominic", "Ricardo", "Franklin", "Maurice", "Max", "Aiden", "Owen", "Lester", "Gilbert", "Elmer", "Gene", "Francisco", "Glen", "Cory", "Garrett", "Clayton", "Sam", "Jorge", "Chester", "Alejandro", "Jeff", "Harvey", "Milton", "Cole", "Ivan", "Andre", "Duane", "Landon"], female: ["Mary", "Emma", "Elizabeth", "Minnie", "Margaret", "Ida", "Alice", "Bertha", "Sarah", "Annie", "Clara", "Ella", "Florence", "Cora", "Martha", "Laura", "Nellie", "Grace", "Carrie", "Maude", "Mabel", "Bessie", "Jennie", "Gertrude", "Julia", "Hattie", "Edith", "Mattie", "Rose", "Catherine", "Lillian", "Ada", "Lillie", "Helen", "Jessie", "Louise", "Ethel", "Lula", "Myrtle", "Eva", "Frances", "Lena", "Lucy", "Edna", "Maggie", "Pearl", "Daisy", "Fannie", "Josephine", "Dora", "Rosa", "Katherine", "Agnes", "Marie", "Nora", "May", "Mamie", "Blanche", "Stella", "Ellen", "Nancy", "Effie", "Sallie", "Nettie", "Della", "Lizzie", "Flora", "Susie", "Maud", "Mae", "Etta", "Harriet", "Sadie", "Caroline", "Katie", "Lydia", "Elsie", "Kate", "Susan", "Mollie", "Alma", "Addie", "Georgia", "Eliza", "Lulu", "Nannie", "Lottie", "Amanda", "Belle", "Charlotte", "Rebecca", "Ruth", "Viola", "Olive", "Amelia", "Hannah", "Jane", "Virginia", "Emily", "Matilda", "Irene", "Kathryn", "Esther", "Willie", "Henrietta", "Ollie", "Amy", "Rachel", "Sara", "Estella", "Theresa", "Augusta", "Ora", "Pauline", "Josie", "Lola", "Sophia", "Leona", "Anne", "Mildred", "Ann", "Beulah", "Callie", "Lou", "Delia", "Eleanor", "Barbara", "Iva", "Louisa", "Maria", "Mayme", "Evelyn", "Estelle", "Nina", "Betty", "Marion", "Bettie", "Dorothy", "Luella", "Inez", "Lela", "Rosie", "Allie", "Millie", "Janie", "Cornelia", "Victoria", "Ruby", "Winifred", "Alta", "Celia", "Christine", "Beatrice", "Birdie", "Harriett", "Mable", "Myra", "Sophie", "Tillie", "Isabel", "Sylvia", "Carolyn", "Isabelle", "Leila", "Sally", "Ina", "Essie", "Bertie", "Nell", "Alberta", "Katharine", "Lora", "Rena", "Mina", "Rhoda", "Mathilda", "Abbie", "Eula", "Dollie", "Hettie", "Eunice", "Fanny", "Ola", "Lenora", "Adelaide", "Christina", "Lelia", "Nelle", "Sue", "Johanna", "Lilly", "Lucinda", "Minerva", "Lettie", "Roxie", "Cynthia", "Helena", "Hilda", "Hulda", "Bernice", "Genevieve", "Jean", "Cordelia", "Marian", "Francis", "Jeanette", "Adeline", "Gussie", "Leah", "Lois", "Lura", "Mittie", "Hallie", "Isabella", "Olga", "Phoebe", "Teresa", "Hester", "Lida", "Lina", "Winnie", "Claudia", "Marguerite", "Vera", "Cecelia", "Bess", "Emilie", "John", "Rosetta", "Verna", "Myrtie", "Cecilia", "Elva", "Olivia", "Ophelia", "Georgie", "Elnora", "Violet", "Adele", "Lily", "Linnie", "Loretta", "Madge", "Polly", "Virgie", "Eugenia", "Lucile", "Lucille", "Mabelle", "Rosalie"] }, lastNames: ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson", "Clark", "Rodriguez", "Lewis", "Lee", "Walker", "Hall", "Allen", "Young", "Hernandez", "King", "Wright", "Lopez", "Hill", "Scott", "Green", "Adams", "Baker", "Gonzalez", "Nelson", "Carter", "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards", "Collins", "Stewart", "Sanchez", "Morris", "Rogers", "Reed", "Cook", "Morgan", "Bell", "Murphy", "Bailey", "Rivera", "Cooper", "Richardson", "Cox", "Howard", "Ward", "Torres", "Peterson", "Gray", "Ramirez", "James", "Watson", "Brooks", "Kelly", "Sanders", "Price", "Bennett", "Wood", "Barnes", "Ross", "Henderson", "Coleman", "Jenkins", "Perry", "Powell", "Long", "Patterson", "Hughes", "Flores", "Washington", "Butler", "Simmons", "Foster", "Gonzales", "Bryant", "Alexander", "Russell", "Griffin", "Diaz", "Hayes", "Myers", "Ford", "Hamilton", "Graham", "Sullivan", "Wallace", "Woods", "Cole", "West", "Jordan", "Owens", "Reynolds", "Fisher", "Ellis", "Harrison", "Gibson", "McDonald", "Cruz", "Marshall", "Ortiz", "Gomez", "Murray", "Freeman", "Wells", "Webb", "Simpson", "Stevens", "Tucker", "Porter", "Hunter", "Hicks", "Crawford", "Henry", "Boyd", "Mason", "Morales", "Kennedy", "Warren", "Dixon", "Ramos", "Reyes", "Burns", "Gordon", "Shaw", "Holmes", "Rice", "Robertson", "Hunt", "Black", "Daniels", "Palmer", "Mills", "Nichols", "Grant", "Knight", "Ferguson", "Rose", "Stone", "Hawkins", "Dunn", "Perkins", "Hudson", "Spencer", "Gardner", "Stephens", "Payne", "Pierce", "Berry", "Matthews", "Arnold", "Wagner", "Willis", "Ray", "Watkins", "Olson", "Carroll", "Duncan", "Snyder", "Hart", "Cunningham", "Bradley", "Lane", "Andrews", "Ruiz", "Harper", "Fox", "Riley", "Armstrong", "Carpenter", "Weaver", "Greene", "Lawrence", "Elliott", "Chavez", "Sims", "Austin", "Peters", "Kelley", "Franklin", "Lawson", "Fields", "Gutierrez", "Ryan", "Schmidt", "Carr", "Vasquez", "Castillo", "Wheeler", "Chapman", "Oliver", "Montgomery", "Richards", "Williamson", "Johnston", "Banks", "Meyer", "Bishop", "McCoy", "Howell", "Alvarez", "Morrison", "Hansen", "Fernandez", "Garza", "Harvey", "Little", "Burton", "Stanley", "Nguyen", "George", "Jacobs", "Reid", "Kim", "Fuller", "Lynch", "Dean", "Gilbert", "Garrett", "Romero", "Welch", "Larson", "Frazier", "Burke", "Hanson", "Day", "Mendoza", "Moreno", "Bowman", "Medina", "Fowler", "Brewer", "Hoffman", "Carlson", "Silva", "Pearson", "Holland", "Douglas", "Fleming", "Jensen", "Vargas", "Byrd", "Davidson", "Hopkins", "May", "Terry", "Herrera", "Wade", "Soto", "Walters", "Curtis", "Neal", "Caldwell", "Lowe", "Jennings", "Barnett", "Graves", "Jimenez", "Horton", "Shelton", "Barrett", "Obrien", "Castro", "Sutton", "Gregory", "McKinney", "Lucas", "Miles", "Craig", "Rodriquez", "Chambers", "Holt", "Lambert", "Fletcher", "Watts", "Bates", "Hale", "Rhodes", "Pena", "Beck", "Newman", "Haynes", "McDaniel", "Mendez", "Bush", "Vaughn", "Parks", "Dawson", "Santiago", "Norris", "Hardy", "Love", "Steele", "Curry", "Powers", "Schultz", "Barker", "Guzman", "Page", "Munoz", "Ball", "Keller", "Chandler", "Weber", "Leonard", "Walsh", "Lyons", "Ramsey", "Wolfe", "Schneider", "Mullins", "Benson", "Sharp", "Bowen", "Daniel", "Barber", "Cummings", "Hines", "Baldwin", "Griffith", "Valdez", "Hubbard", "Salazar", "Reeves", "Warner", "Stevenson", "Burgess", "Santos", "Tate", "Cross", "Garner", "Mann", "Mack", "Moss", "Thornton", "Dennis", "McGee", "Farmer", "Delgado", "Aguilar", "Vega", "Glover", "Manning", "Cohen", "Harmon", "Rodgers", "Robbins", "Newton", "Todd", "Blair", "Higgins", "Ingram", "Reese", "Cannon", "Strickland", "Townsend", "Potter", "Goodwin", "Walton", "Rowe", "Hampton", "Ortega", "Patton", "Swanson", "Joseph", "Francis", "Goodman", "Maldonado", "Yates", "Becker", "Erickson", "Hodges", "Rios", "Conner", "Adkins", "Webster", "Norman", "Malone", "Hammond", "Flowers", "Cobb", "Moody", "Quinn", "Blake", "Maxwell", "Pope", "Floyd", "Osborne", "Paul", "McCarthy", "Guerrero", "Lindsey", "Estrada", "Sandoval", "Gibbs", "Tyler", "Gross", "Fitzgerald", "Stokes", "Doyle", "Sherman", "Saunders", "Wise", "Colon", "Gill", "Alvarado", "Greer", "Padilla", "Simon", "Waters", "Nunez", "Ballard", "Schwartz", "McBride", "Houston", "Christensen", "Klein", "Pratt", "Briggs", "Parsons", "McLaughlin", "Zimmerman", "French", "Buchanan", "Moran", "Copeland", "Roy", "Pittman", "Brady", "McCormick", "Holloway", "Brock", "Poole", "Frank", "Logan", "Owen", "Bass", "Marsh", "Drake", "Wong", "Jefferson", "Park", "Morton", "Abbott", "Sparks", "Patrick", "Norton", "Huff", "Clayton", "Massey", "Lloyd", "Figueroa", "Carson", "Bowers", "Roberson", "Barton", "Tran", "Lamb", "Harrington", "Casey", "Boone", "Cortez", "Clarke", "Mathis", "Singleton", "Wilkins", "Cain", "Bryan", "Underwood", "Hogan", "McKenzie", "Collier", "Luna", "Phelps", "McGuire", "Allison", "Bridges", "Wilkerson", "Nash", "Summers", "Atkins"],
    countries: [{ name: "Afghanistan", abbreviation: "AF" }, { name: "Albania", abbreviation: "AL" }, { name: "Algeria", abbreviation: "DZ" }, { name: "American Samoa", abbreviation: "AS" }, { name: "Andorra", abbreviation: "AD" }, { name: "Angola", abbreviation: "AO" }, { name: "Anguilla", abbreviation: "AI" }, { name: "Antarctica", abbreviation: "AQ" }, { name: "Antigua and Barbuda", abbreviation: "AG" }, { name: "Argentina", abbreviation: "AR" }, { name: "Armenia", abbreviation: "AM" }, { name: "Aruba", abbreviation: "AW" }, { name: "Australia", abbreviation: "AU" }, { name: "Austria", abbreviation: "AT" }, { name: "Azerbaijan", abbreviation: "AZ" }, { name: "Bahamas", abbreviation: "BS" }, { name: "Bahrain", abbreviation: "BH" }, { name: "Bangladesh", abbreviation: "BD" }, { name: "Barbados", abbreviation: "BB" }, { name: "Belarus", abbreviation: "BY" }, { name: "Belgium", abbreviation: "BE" }, { name: "Belize", abbreviation: "BZ" }, { name: "Benin", abbreviation: "BJ" }, { name: "Bermuda", abbreviation: "BM" }, { name: "Bhutan", abbreviation: "BT" }, { name: "Bolivia", abbreviation: "BO" }, { name: "Bosnia and Herzegovina", abbreviation: "BA" }, { name: "Botswana", abbreviation: "BW" }, { name: "Bouvet Island", abbreviation: "BV" }, { name: "Brazil", abbreviation: "BR" }, { name: "British Antarctic Territory", abbreviation: "BQ" }, { name: "British Indian Ocean Territory", abbreviation: "IO" }, { name: "British Virgin Islands", abbreviation: "VG" }, { name: "Brunei", abbreviation: "BN" }, { name: "Bulgaria", abbreviation: "BG" }, { name: "Burkina Faso", abbreviation: "BF" }, { name: "Burundi", abbreviation: "BI" }, { name: "Cambodia", abbreviation: "KH" }, { name: "Cameroon", abbreviation: "CM" }, { name: "Canada", abbreviation: "CA" }, { name: "Canton and Enderbury Islands", abbreviation: "CT" }, { name: "Cape Verde", abbreviation: "CV" }, { name: "Cayman Islands", abbreviation: "KY" }, { name: "Central African Republic", abbreviation: "CF" }, { name: "Chad", abbreviation: "TD" }, { name: "Chile", abbreviation: "CL" }, { name: "China", abbreviation: "CN" }, { name: "Christmas Island", abbreviation: "CX" }, { name: "Cocos [Keeling] Islands", abbreviation: "CC" }, { name: "Colombia", abbreviation: "CO" }, { name: "Comoros", abbreviation: "KM" }, { name: "Congo - Brazzaville", abbreviation: "CG" }, { name: "Congo - Kinshasa", abbreviation: "CD" }, { name: "Cook Islands", abbreviation: "CK" }, { name: "Costa Rica", abbreviation: "CR" }, { name: "Croatia", abbreviation: "HR" }, { name: "Cuba", abbreviation: "CU" }, { name: "Cyprus", abbreviation: "CY" }, { name: "Czech Republic", abbreviation: "CZ" }, { name: "Côte d’Ivoire", abbreviation: "CI" }, { name: "Denmark", abbreviation: "DK" }, { name: "Djibouti", abbreviation: "DJ" }, { name: "Dominica", abbreviation: "DM" }, { name: "Dominican Republic", abbreviation: "DO" }, { name: "Dronning Maud Land", abbreviation: "NQ" }, { name: "East Germany", abbreviation: "DD" }, { name: "Ecuador", abbreviation: "EC" }, { name: "Egypt", abbreviation: "EG" }, { name: "El Salvador", abbreviation: "SV" }, { name: "Equatorial Guinea", abbreviation: "GQ" }, { name: "Eritrea", abbreviation: "ER" }, { name: "Estonia", abbreviation: "EE" }, { name: "Ethiopia", abbreviation: "ET" }, { name: "Falkland Islands", abbreviation: "FK" }, { name: "Faroe Islands", abbreviation: "FO" }, { name: "Fiji", abbreviation: "FJ" }, { name: "Finland", abbreviation: "FI" }, { name: "France", abbreviation: "FR" }, { name: "French Guiana", abbreviation: "GF" }, { name: "French Polynesia", abbreviation: "PF" }, { name: "French Southern Territories", abbreviation: "TF" }, { name: "French Southern and Antarctic Territories", abbreviation: "FQ" }, { name: "Gabon", abbreviation: "GA" }, { name: "Gambia", abbreviation: "GM" }, { name: "Georgia", abbreviation: "GE" }, { name: "Germany", abbreviation: "DE" }, { name: "Ghana", abbreviation: "GH" }, { name: "Gibraltar", abbreviation: "GI" }, { name: "Greece", abbreviation: "GR" }, { name: "Greenland", abbreviation: "GL" }, { name: "Grenada", abbreviation: "GD" }, { name: "Guadeloupe", abbreviation: "GP" }, { name: "Guam", abbreviation: "GU" }, { name: "Guatemala", abbreviation: "GT" }, { name: "Guernsey", abbreviation: "GG" }, { name: "Guinea", abbreviation: "GN" }, { name: "Guinea-Bissau", abbreviation: "GW" }, { name: "Guyana", abbreviation: "GY" }, { name: "Haiti", abbreviation: "HT" }, { name: "Heard Island and McDonald Islands", abbreviation: "HM" }, { name: "Honduras", abbreviation: "HN" }, { name: "Hong Kong SAR China", abbreviation: "HK" }, { name: "Hungary", abbreviation: "HU" }, { name: "Iceland", abbreviation: "IS" }, { name: "India", abbreviation: "IN" }, { name: "Indonesia", abbreviation: "ID" }, { name: "Iran", abbreviation: "IR" }, { name: "Iraq", abbreviation: "IQ" }, { name: "Ireland", abbreviation: "IE" }, { name: "Isle of Man", abbreviation: "IM" }, { name: "Israel", abbreviation: "IL" }, { name: "Italy", abbreviation: "IT" }, { name: "Jamaica", abbreviation: "JM" }, { name: "Japan", abbreviation: "JP" }, { name: "Jersey", abbreviation: "JE" }, { name: "Johnston Island", abbreviation: "JT" }, { name: "Jordan", abbreviation: "JO" }, { name: "Kazakhstan", abbreviation: "KZ" }, { name: "Kenya", abbreviation: "KE" }, { name: "Kiribati", abbreviation: "KI" }, { name: "Kuwait", abbreviation: "KW" }, { name: "Kyrgyzstan", abbreviation: "KG" }, { name: "Laos", abbreviation: "LA" }, { name: "Latvia", abbreviation: "LV" }, { name: "Lebanon", abbreviation: "LB" }, { name: "Lesotho", abbreviation: "LS" }, { name: "Liberia", abbreviation: "LR" }, { name: "Libya", abbreviation: "LY" }, { name: "Liechtenstein", abbreviation: "LI" }, { name: "Lithuania", abbreviation: "LT" }, { name: "Luxembourg", abbreviation: "LU" }, { name: "Macau SAR China", abbreviation: "MO" }, { name: "Macedonia", abbreviation: "MK" }, { name: "Madagascar", abbreviation: "MG" }, { name: "Malawi", abbreviation: "MW" }, { name: "Malaysia", abbreviation: "MY" }, { name: "Maldives", abbreviation: "MV" }, { name: "Mali", abbreviation: "ML" }, { name: "Malta", abbreviation: "MT" }, { name: "Marshall Islands", abbreviation: "MH" }, { name: "Martinique", abbreviation: "MQ" }, { name: "Mauritania", abbreviation: "MR" }, { name: "Mauritius", abbreviation: "MU" }, { name: "Mayotte", abbreviation: "YT" }, { name: "Metropolitan France", abbreviation: "FX" }, { name: "Mexico", abbreviation: "MX" }, { name: "Micronesia", abbreviation: "FM" }, { name: "Midway Islands", abbreviation: "MI" }, { name: "Moldova", abbreviation: "MD" }, { name: "Monaco", abbreviation: "MC" }, { name: "Mongolia", abbreviation: "MN" }, { name: "Montenegro", abbreviation: "ME" }, { name: "Montserrat", abbreviation: "MS" }, { name: "Morocco", abbreviation: "MA" }, { name: "Mozambique", abbreviation: "MZ" }, { name: "Myanmar [Burma]", abbreviation: "MM" }, { name: "Namibia", abbreviation: "NA" }, { name: "Nauru", abbreviation: "NR" }, { name: "Nepal", abbreviation: "NP" }, { name: "Netherlands", abbreviation: "NL" }, { name: "Netherlands Antilles", abbreviation: "AN" }, { name: "Neutral Zone", abbreviation: "NT" }, { name: "New Caledonia", abbreviation: "NC" }, { name: "New Zealand", abbreviation: "NZ" }, { name: "Nicaragua", abbreviation: "NI" }, { name: "Niger", abbreviation: "NE" }, { name: "Nigeria", abbreviation: "NG" }, { name: "Niue", abbreviation: "NU" }, { name: "Norfolk Island", abbreviation: "NF" }, { name: "North Korea", abbreviation: "KP" }, { name: "North Vietnam", abbreviation: "VD" }, { name: "Northern Mariana Islands", abbreviation: "MP" }, { name: "Norway", abbreviation: "NO" }, { name: "Oman", abbreviation: "OM" }, { name: "Pacific Islands Trust Territory", abbreviation: "PC" }, { name: "Pakistan", abbreviation: "PK" }, { name: "Palau", abbreviation: "PW" }, { name: "Palestinian Territories", abbreviation: "PS" }, { name: "Panama", abbreviation: "PA" }, { name: "Panama Canal Zone", abbreviation: "PZ" }, { name: "Papua New Guinea", abbreviation: "PG" }, { name: "Paraguay", abbreviation: "PY" }, { name: "People's Democratic Republic of Yemen", abbreviation: "YD" }, { name: "Peru", abbreviation: "PE" }, { name: "Philippines", abbreviation: "PH" }, { name: "Pitcairn Islands", abbreviation: "PN" }, { name: "Poland", abbreviation: "PL" }, { name: "Portugal", abbreviation: "PT" }, { name: "Puerto Rico", abbreviation: "PR" }, { name: "Qatar", abbreviation: "QA" }, { name: "Romania", abbreviation: "RO" }, { name: "Russia", abbreviation: "RU" }, { name: "Rwanda", abbreviation: "RW" }, { name: "Réunion", abbreviation: "RE" }, { name: "Saint Barthélemy", abbreviation: "BL" }, { name: "Saint Helena", abbreviation: "SH" }, { name: "Saint Kitts and Nevis", abbreviation: "KN" }, { name: "Saint Lucia", abbreviation: "LC" }, { name: "Saint Martin", abbreviation: "MF" }, { name: "Saint Pierre and Miquelon", abbreviation: "PM" }, { name: "Saint Vincent and the Grenadines", abbreviation: "VC" }, { name: "Samoa", abbreviation: "WS" }, { name: "San Marino", abbreviation: "SM" }, { name: "Saudi Arabia", abbreviation: "SA" }, { name: "Senegal", abbreviation: "SN" }, { name: "Serbia", abbreviation: "RS" }, { name: "Serbia and Montenegro", abbreviation: "CS" }, { name: "Seychelles", abbreviation: "SC" }, { name: "Sierra Leone", abbreviation: "SL" }, { name: "Singapore", abbreviation: "SG" }, { name: "Slovakia", abbreviation: "SK" }, { name: "Slovenia", abbreviation: "SI" }, { name: "Solomon Islands", abbreviation: "SB" }, { name: "Somalia", abbreviation: "SO" }, { name: "South Africa", abbreviation: "ZA" }, { name: "South Georgia and the South Sandwich Islands", abbreviation: "GS" }, { name: "South Korea", abbreviation: "KR" }, { name: "Spain", abbreviation: "ES" }, { name: "Sri Lanka", abbreviation: "LK" }, { name: "Sudan", abbreviation: "SD" }, { name: "Suriname", abbreviation: "SR" }, { name: "Svalbard and Jan Mayen", abbreviation: "SJ" }, { name: "Swaziland", abbreviation: "SZ" }, { name: "Sweden", abbreviation: "SE" }, { name: "Switzerland", abbreviation: "CH" }, { name: "Syria", abbreviation: "SY" }, { name: "São Tomé and Príncipe", abbreviation: "ST" }, { name: "Taiwan", abbreviation: "TW" }, { name: "Tajikistan", abbreviation: "TJ" }, { name: "Tanzania", abbreviation: "TZ" }, { name: "Thailand", abbreviation: "TH" }, { name: "Timor-Leste", abbreviation: "TL" }, { name: "Togo", abbreviation: "TG" }, { name: "Tokelau", abbreviation: "TK" }, { name: "Tonga", abbreviation: "TO" }, { name: "Trinidad and Tobago", abbreviation: "TT" }, { name: "Tunisia", abbreviation: "TN" }, { name: "Turkey", abbreviation: "TR" }, { name: "Turkmenistan", abbreviation: "TM" }, { name: "Turks and Caicos Islands", abbreviation: "TC" }, { name: "Tuvalu", abbreviation: "TV" }, { name: "U.S. Minor Outlying Islands", abbreviation: "UM" }, { name: "U.S. Miscellaneous Pacific Islands", abbreviation: "PU" }, { name: "U.S. Virgin Islands", abbreviation: "VI" }, { name: "Uganda", abbreviation: "UG" }, { name: "Ukraine", abbreviation: "UA" }, { name: "Union of Soviet Socialist Republics", abbreviation: "SU" }, { name: "United Arab Emirates", abbreviation: "AE" }, { name: "United Kingdom", abbreviation: "GB" }, { name: "United States", abbreviation: "US" }, { name: "Unknown or Invalid Region", abbreviation: "ZZ" }, { name: "Uruguay", abbreviation: "UY" }, { name: "Uzbekistan", abbreviation: "UZ" }, { name: "Vanuatu", abbreviation: "VU" }, { name: "Vatican City", abbreviation: "VA" }, { name: "Venezuela", abbreviation: "VE" }, { name: "Vietnam", abbreviation: "VN" }, { name: "Wake Island", abbreviation: "WK" }, { name: "Wallis and Futuna", abbreviation: "WF" }, { name: "Western Sahara", abbreviation: "EH" }, { name: "Yemen", abbreviation: "YE" }, { name: "Zambia", abbreviation: "ZM" }, { name: "Zimbabwe", abbreviation: "ZW" }, { name: "Åland Islands", abbreviation: "AX" }], provinces: [{ name: "Alberta", abbreviation: "AB" }, { name: "British Columbia", abbreviation: "BC" }, { name: "Manitoba", abbreviation: "MB" }, { name: "New Brunswick", abbreviation: "NB" }, { name: "Newfoundland and Labrador", abbreviation: "NL" }, { name: "Nova Scotia", abbreviation: "NS" }, { name: "Ontario", abbreviation: "ON" }, { name: "Prince Edward Island", abbreviation: "PE" }, { name: "Quebec", abbreviation: "QC" }, { name: "Saskatchewan", abbreviation: "SK" }, { name: "Northwest Territories", abbreviation: "NT" }, { name: "Nunavut", abbreviation: "NU" }, { name: "Yukon", abbreviation: "YT" }], us_states_and_dc: [{ name: "Alabama", abbreviation: "AL" }, { name: "Alaska", abbreviation: "AK" }, { name: "Arizona", abbreviation: "AZ" }, { name: "Arkansas", abbreviation: "AR" }, { name: "California", abbreviation: "CA" }, { name: "Colorado", abbreviation: "CO" }, { name: "Connecticut", abbreviation: "CT" }, { name: "Delaware", abbreviation: "DE" }, { name: "District of Columbia", abbreviation: "DC" }, { name: "Florida", abbreviation: "FL" }, { name: "Georgia", abbreviation: "GA" }, { name: "Hawaii", abbreviation: "HI" }, { name: "Idaho", abbreviation: "ID" }, { name: "Illinois", abbreviation: "IL" }, { name: "Indiana", abbreviation: "IN" }, { name: "Iowa", abbreviation: "IA" }, { name: "Kansas", abbreviation: "KS" }, { name: "Kentucky", abbreviation: "KY" }, { name: "Louisiana", abbreviation: "LA" }, { name: "Maine", abbreviation: "ME" }, { name: "Maryland", abbreviation: "MD" }, { name: "Massachusetts", abbreviation: "MA" }, { name: "Michigan", abbreviation: "MI" }, { name: "Minnesota", abbreviation: "MN" }, { name: "Mississippi", abbreviation: "MS" }, { name: "Missouri", abbreviation: "MO" }, { name: "Montana", abbreviation: "MT" }, { name: "Nebraska", abbreviation: "NE" }, { name: "Nevada", abbreviation: "NV" }, { name: "New Hampshire", abbreviation: "NH" }, { name: "New Jersey", abbreviation: "NJ" }, { name: "New Mexico", abbreviation: "NM" }, { name: "New York", abbreviation: "NY" }, { name: "North Carolina", abbreviation: "NC" }, { name: "North Dakota", abbreviation: "ND" }, { name: "Ohio", abbreviation: "OH" }, { name: "Oklahoma", abbreviation: "OK" }, { name: "Oregon", abbreviation: "OR" }, { name: "Pennsylvania", abbreviation: "PA" }, { name: "Rhode Island", abbreviation: "RI" }, { name: "South Carolina", abbreviation: "SC" }, { name: "South Dakota", abbreviation: "SD" }, { name: "Tennessee", abbreviation: "TN" }, { name: "Texas", abbreviation: "TX" }, { name: "Utah", abbreviation: "UT" }, { name: "Vermont", abbreviation: "VT" }, { name: "Virginia", abbreviation: "VA" }, { name: "Washington", abbreviation: "WA" }, { name: "West Virginia", abbreviation: "WV" }, { name: "Wisconsin", abbreviation: "WI" }, { name: "Wyoming", abbreviation: "WY" }], territories: [{ name: "American Samoa", abbreviation: "AS" }, { name: "Federated States of Micronesia", abbreviation: "FM" }, { name: "Guam", abbreviation: "GU" }, { name: "Marshall Islands", abbreviation: "MH" }, { name: "Northern Mariana Islands", abbreviation: "MP" }, { name: "Puerto Rico", abbreviation: "PR" }, { name: "Virgin Islands, U.S.", abbreviation: "VI" }], armed_forces: [{ name: "Armed Forces Europe", abbreviation: "AE" }, { name: "Armed Forces Pacific", abbreviation: "AP" }, { name: "Armed Forces the Americas", abbreviation: "AA" }], street_suffixes: [{ name: "Avenue", abbreviation: "Ave" }, { name: "Boulevard", abbreviation: "Blvd" }, { name: "Center", abbreviation: "Ctr" }, { name: "Circle", abbreviation: "Cir" }, { name: "Court", abbreviation: "Ct" }, { name: "Drive", abbreviation: "Dr" }, { name: "Extension", abbreviation: "Ext" }, { name: "Glen", abbreviation: "Gln" }, { name: "Grove", abbreviation: "Grv" }, { name: "Heights", abbreviation: "Hts" }, { name: "Highway", abbreviation: "Hwy" }, { name: "Junction", abbreviation: "Jct" }, { name: "Key", abbreviation: "Key" }, { name: "Lane", abbreviation: "Ln" }, { name: "Loop", abbreviation: "Loop" }, { name: "Manor", abbreviation: "Mnr" }, { name: "Mill", abbreviation: "Mill" }, { name: "Park", abbreviation: "Park" }, { name: "Parkway", abbreviation: "Pkwy" }, { name: "Pass", abbreviation: "Pass" }, { name: "Path", abbreviation: "Path" }, { name: "Pike", abbreviation: "Pike" }, { name: "Place", abbreviation: "Pl" }, { name: "Plaza", abbreviation: "Plz" }, { name: "Point", abbreviation: "Pt" }, { name: "Ridge", abbreviation: "Rdg" }, { name: "River", abbreviation: "Riv" }, { name: "Road", abbreviation: "Rd" }, { name: "Square", abbreviation: "Sq" }, { name: "Street", abbreviation: "St" }, { name: "Terrace", abbreviation: "Ter" }, { name: "Trail", abbreviation: "Trl" }, { name: "Turnpike", abbreviation: "Tpke" }, { name: "View", abbreviation: "Vw" }, { name: "Way", abbreviation: "Way" }], months: [{ name: "January", short_name: "Jan", numeric: "01", days: 31 }, { name: "February", short_name: "Feb", numeric: "02", days: 28 }, { name: "March", short_name: "Mar", numeric: "03", days: 31 }, { name: "April", short_name: "Apr", numeric: "04", days: 30 }, { name: "May", short_name: "May", numeric: "05", days: 31 }, { name: "June", short_name: "Jun", numeric: "06", days: 30 }, { name: "July", short_name: "Jul", numeric: "07", days: 31 }, { name: "August", short_name: "Aug", numeric: "08", days: 31 }, { name: "September", short_name: "Sep", numeric: "09", days: 30 }, { name: "October", short_name: "Oct", numeric: "10", days: 31 }, { name: "November", short_name: "Nov", numeric: "11", days: 30 }, { name: "December", short_name: "Dec", numeric: "12", days: 31 }], cc_types: [{ name: "American Express", short_name: "amex", prefix: "34", length: 15 }, { name: "Bankcard", short_name: "bankcard", prefix: "5610", length: 16 }, { name: "China UnionPay", short_name: "chinaunion", prefix: "62", length: 16 }, { name: "Diners Club Carte Blanche", short_name: "dccarte", prefix: "300", length: 14 }, { name: "Diners Club enRoute", short_name: "dcenroute", prefix: "2014", length: 15 }, { name: "Diners Club International", short_name: "dcintl", prefix: "36", length: 14 }, { name: "Diners Club United States & Canada", short_name: "dcusc", prefix: "54", length: 16 }, { name: "Discover Card", short_name: "discover", prefix: "6011", length: 16 }, { name: "InstaPayment", short_name: "instapay", prefix: "637", length: 16 }, { name: "JCB", short_name: "jcb", prefix: "3528", length: 16 }, { name: "Laser", short_name: "laser", prefix: "6304", length: 16 }, { name: "Maestro", short_name: "maestro", prefix: "5018", length: 16 }, { name: "Mastercard", short_name: "mc", prefix: "51", length: 16 }, { name: "Solo", short_name: "solo", prefix: "6334", length: 16 }, { name: "Switch", short_name: "switch", prefix: "4903", length: 16 }, { name: "Visa", short_name: "visa", prefix: "4", length: 16 }, { name: "Visa Electron", short_name: "electron", prefix: "4026", length: 16 }], currency_types: [{ code: "AED", name: "United Arab Emirates Dirham" }, { code: "AFN", name: "Afghanistan Afghani" }, { code: "ALL", name: "Albania Lek" }, { code: "AMD", name: "Armenia Dram" }, { code: "ANG", name: "Netherlands Antilles Guilder" }, { code: "AOA", name: "Angola Kwanza" }, { code: "ARS", name: "Argentina Peso" }, { code: "AUD", name: "Australia Dollar" }, { code: "AWG", name: "Aruba Guilder" }, { code: "AZN", name: "Azerbaijan New Manat" }, { code: "BAM", name: "Bosnia and Herzegovina Convertible Marka" }, { code: "BBD", name: "Barbados Dollar" }, { code: "BDT", name: "Bangladesh Taka" }, { code: "BGN", name: "Bulgaria Lev" }, { code: "BHD", name: "Bahrain Dinar" }, { code: "BIF", name: "Burundi Franc" }, { code: "BMD", name: "Bermuda Dollar" }, { code: "BND", name: "Brunei Darussalam Dollar" }, { code: "BOB", name: "Bolivia Boliviano" }, { code: "BRL", name: "Brazil Real" }, { code: "BSD", name: "Bahamas Dollar" }, { code: "BTN", name: "Bhutan Ngultrum" }, { code: "BWP", name: "Botswana Pula" }, { code: "BYR", name: "Belarus Ruble" }, { code: "BZD", name: "Belize Dollar" }, { code: "CAD", name: "Canada Dollar" }, { code: "CDF", name: "Congo/Kinshasa Franc" }, { code: "CHF", name: "Switzerland Franc" }, { code: "CLP", name: "Chile Peso" }, { code: "CNY", name: "China Yuan Renminbi" }, { code: "COP", name: "Colombia Peso" }, { code: "CRC", name: "Costa Rica Colon" }, { code: "CUC", name: "Cuba Convertible Peso" }, { code: "CUP", name: "Cuba Peso" }, { code: "CVE", name: "Cape Verde Escudo" }, { code: "CZK", name: "Czech Republic Koruna" }, { code: "DJF", name: "Djibouti Franc" }, { code: "DKK", name: "Denmark Krone" }, { code: "DOP", name: "Dominican Republic Peso" }, { code: "DZD", name: "Algeria Dinar" }, { code: "EGP", name: "Egypt Pound" }, { code: "ERN", name: "Eritrea Nakfa" }, { code: "ETB", name: "Ethiopia Birr" }, { code: "EUR", name: "Euro Member Countries" }, { code: "FJD", name: "Fiji Dollar" }, { code: "FKP", name: "Falkland Islands (Malvinas) Pound" }, { code: "GBP", name: "United Kingdom Pound" }, { code: "GEL", name: "Georgia Lari" }, { code: "GGP", name: "Guernsey Pound" }, { code: "GHS", name: "Ghana Cedi" }, { code: "GIP", name: "Gibraltar Pound" }, { code: "GMD", name: "Gambia Dalasi" }, { code: "GNF", name: "Guinea Franc" }, { code: "GTQ", name: "Guatemala Quetzal" }, { code: "GYD", name: "Guyana Dollar" }, { code: "HKD", name: "Hong Kong Dollar" }, { code: "HNL", name: "Honduras Lempira" }, { code: "HRK", name: "Croatia Kuna" }, { code: "HTG", name: "Haiti Gourde" }, { code: "HUF", name: "Hungary Forint" }, { code: "IDR", name: "Indonesia Rupiah" }, { code: "ILS", name: "Israel Shekel" }, { code: "IMP", name: "Isle of Man Pound" }, { code: "INR", name: "India Rupee" }, { code: "IQD", name: "Iraq Dinar" }, { code: "IRR", name: "Iran Rial" }, { code: "ISK", name: "Iceland Krona" }, { code: "JEP", name: "Jersey Pound" }, { code: "JMD", name: "Jamaica Dollar" }, { code: "JOD", name: "Jordan Dinar" }, { code: "JPY", name: "Japan Yen" }, { code: "KES", name: "Kenya Shilling" }, { code: "KGS", name: "Kyrgyzstan Som" }, { code: "KHR", name: "Cambodia Riel" }, { code: "KMF", name: "Comoros Franc" }, { code: "KPW", name: "Korea (North) Won" }, { code: "KRW", name: "Korea (South) Won" }, { code: "KWD", name: "Kuwait Dinar" }, { code: "KYD", name: "Cayman Islands Dollar" }, { code: "KZT", name: "Kazakhstan Tenge" }, { code: "LAK", name: "Laos Kip" }, { code: "LBP", name: "Lebanon Pound" }, { code: "LKR", name: "Sri Lanka Rupee" }, { code: "LRD", name: "Liberia Dollar" }, { code: "LSL", name: "Lesotho Loti" }, { code: "LTL", name: "Lithuania Litas" }, { code: "LYD", name: "Libya Dinar" }, { code: "MAD", name: "Morocco Dirham" }, { code: "MDL", name: "Moldova Leu" }, { code: "MGA", name: "Madagascar Ariary" }, { code: "MKD", name: "Macedonia Denar" }, { code: "MMK", name: "Myanmar (Burma) Kyat" }, { code: "MNT", name: "Mongolia Tughrik" }, { code: "MOP", name: "Macau Pataca" }, { code: "MRO", name: "Mauritania Ouguiya" }, { code: "MUR", name: "Mauritius Rupee" }, { code: "MVR", name: "Maldives (Maldive Islands) Rufiyaa" }, { code: "MWK", name: "Malawi Kwacha" }, { code: "MXN", name: "Mexico Peso" }, { code: "MYR", name: "Malaysia Ringgit" }, { code: "MZN", name: "Mozambique Metical" }, { code: "NAD", name: "Namibia Dollar" }, { code: "NGN", name: "Nigeria Naira" }, { code: "NIO", name: "Nicaragua Cordoba" }, { code: "NOK", name: "Norway Krone" }, { code: "NPR", name: "Nepal Rupee" }, { code: "NZD", name: "New Zealand Dollar" }, { code: "OMR", name: "Oman Rial" }, { code: "PAB", name: "Panama Balboa" }, { code: "PEN", name: "Peru Nuevo Sol" }, { code: "PGK", name: "Papua New Guinea Kina" }, { code: "PHP", name: "Philippines Peso" }, { code: "PKR", name: "Pakistan Rupee" }, { code: "PLN", name: "Poland Zloty" }, { code: "PYG", name: "Paraguay Guarani" }, { code: "QAR", name: "Qatar Riyal" }, { code: "RON", name: "Romania New Leu" }, { code: "RSD", name: "Serbia Dinar" }, { code: "RUB", name: "Russia Ruble" }, { code: "RWF", name: "Rwanda Franc" }, { code: "SAR", name: "Saudi Arabia Riyal" }, { code: "SBD", name: "Solomon Islands Dollar" }, { code: "SCR", name: "Seychelles Rupee" }, { code: "SDG", name: "Sudan Pound" }, { code: "SEK", name: "Sweden Krona" }, { code: "SGD", name: "Singapore Dollar" }, { code: "SHP", name: "Saint Helena Pound" }, { code: "SLL", name: "Sierra Leone Leone" }, { code: "SOS", name: "Somalia Shilling" }, { code: "SPL", name: "Seborga Luigino" }, { code: "SRD", name: "Suriname Dollar" }, { code: "STD", name: "São Tomé and Príncipe Dobra" }, { code: "SVC", name: "El Salvador Colon" }, { code: "SYP", name: "Syria Pound" }, { code: "SZL", name: "Swaziland Lilangeni" }, { code: "THB", name: "Thailand Baht" }, { code: "TJS", name: "Tajikistan Somoni" }, { code: "TMT", name: "Turkmenistan Manat" }, { code: "TND", name: "Tunisia Dinar" }, { code: "TOP", name: "Tonga Pa'anga" }, { code: "TRY", name: "Turkey Lira" }, { code: "TTD", name: "Trinidad and Tobago Dollar" }, { code: "TVD", name: "Tuvalu Dollar" }, { code: "TWD", name: "Taiwan New Dollar" }, { code: "TZS", name: "Tanzania Shilling" }, { code: "UAH", name: "Ukraine Hryvnia" }, { code: "UGX", name: "Uganda Shilling" }, { code: "USD", name: "United States Dollar" }, { code: "UYU", name: "Uruguay Peso" }, { code: "UZS", name: "Uzbekistan Som" }, { code: "VEF", name: "Venezuela Bolivar" }, { code: "VND", name: "Viet Nam Dong" }, { code: "VUV", name: "Vanuatu Vatu" }, { code: "WST", name: "Samoa Tala" }, { code: "XAF", name: "Communauté Financière Africaine (BEAC) CFA Franc BEAC" }, { code: "XCD", name: "East Caribbean Dollar" }, { code: "XDR", name: "International Monetary Fund (IMF) Special Drawing Rights" }, { code: "XOF", name: "Communauté Financière Africaine (BCEAO) Franc" }, { code: "XPF", name: "Comptoirs Français du Pacifique (CFP) Franc" }, { code: "YER", name: "Yemen Rial" }, { code: "ZAR", name: "South Africa Rand" }, { code: "ZMW", name: "Zambia Kwacha" }, { code: "ZWD", name: "Zimbabwe Dollar" }] },
      q = Object.prototype.hasOwnProperty,
      r = Object.keys || function (a) {
    var b = [];for (var c in a) q.call(a, c) && b.push(c);return b;
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
        h = a.dev;do d = 2 * this.random() - 1, e = 2 * this.random() - 1, c = d * d + e * e; while (c >= 1);return (f = d * Math.sqrt(-2 * Math.log(c) / c), h * f + g);
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
        b = 2 + 6 * a[7] + 7 * a[6] + 8 * a[5] + 9 * a[4] + 2 * a[3] + 3 * a[2] + 4 * a[1] + 5 * a[0];b = 11 - b % 11, b >= 10 && (b = 0);var c = 2 * b + 3 + 7 * a[7] + 8 * a[6] + 9 * a[5] + 2 * a[4] + 3 * a[3] + 4 * a[2] + 5 * a[1] + 6 * a[0];return (c = 11 - c % 11, c >= 10 && (c = 0), "" + a[0] + a[1] + "." + a[2] + a[3] + a[4] + "." + a[5] + a[6] + a[7] + "/0001-" + b + c);
  }, a.prototype.mersenne_twister = function (a) {
    return new s(a);
  }, a.prototype.blueimp_md5 = function () {
    return new t();
  };var s = function s(a) {
    void 0 === a && (a = Math.floor(Math.random() * Math.pow(10, 13))), this.N = 624, this.M = 397, this.MATRIX_A = 2567483615, this.UPPER_MASK = 2147483648, this.LOWER_MASK = 2147483647, this.mt = new Array(this.N), this.mti = this.N + 1, this.init_genrand(a);
  };s.prototype.init_genrand = function (a) {
    for (this.mt[0] = a >>> 0, this.mti = 1; this.mti < this.N; this.mti++) a = this.mt[this.mti - 1] ^ this.mt[this.mti - 1] >>> 30, this.mt[this.mti] = (1812433253 * ((4294901760 & a) >>> 16) << 16) + 1812433253 * (65535 & a) + this.mti, this.mt[this.mti] >>>= 0;
  }, s.prototype.init_by_array = function (a, b) {
    var c,
        d,
        e = 1,
        f = 0;for (this.init_genrand(19650218), c = this.N > b ? this.N : b; c; c--) d = this.mt[e - 1] ^ this.mt[e - 1] >>> 30, this.mt[e] = (this.mt[e] ^ (1664525 * ((4294901760 & d) >>> 16) << 16) + 1664525 * (65535 & d)) + a[f] + f, this.mt[e] >>>= 0, e++, f++, e >= this.N && (this.mt[0] = this.mt[this.N - 1], e = 1), f >= b && (f = 0);for (c = this.N - 1; c; c--) d = this.mt[e - 1] ^ this.mt[e - 1] >>> 30, this.mt[e] = (this.mt[e] ^ (1566083941 * ((4294901760 & d) >>> 16) << 16) + 1566083941 * (65535 & d)) - e, this.mt[e] >>>= 0, e++, e >= this.N && (this.mt[0] = this.mt[this.N - 1], e = 1);this.mt[0] = 2147483648;
  }, s.prototype.genrand_int32 = function () {
    var a,
        b = new Array(0, this.MATRIX_A);if (this.mti >= this.N) {
      var c;for (this.mti === this.N + 1 && this.init_genrand(5489), c = 0; c < this.N - this.M; c++) a = this.mt[c] & this.UPPER_MASK | this.mt[c + 1] & this.LOWER_MASK, this.mt[c] = this.mt[c + this.M] ^ a >>> 1 ^ b[1 & a];for (; c < this.N - 1; c++) a = this.mt[c] & this.UPPER_MASK | this.mt[c + 1] & this.LOWER_MASK, this.mt[c] = this.mt[c + (this.M - this.N)] ^ a >>> 1 ^ b[1 & a];a = this.mt[this.N - 1] & this.UPPER_MASK | this.mt[0] & this.LOWER_MASK, this.mt[this.N - 1] = this.mt[this.M - 1] ^ a >>> 1 ^ b[1 & a], this.mti = 0;
    }return (a = this.mt[this.mti++], a ^= a >>> 11, a ^= a << 7 & 2636928640, a ^= a << 15 & 4022730752, a ^= a >>> 18, a >>> 0);
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
        k = 271733878;for (c = 0; c < a.length; c += 16) d = h, e = i, f = j, g = k, h = this.md5_ff(h, i, j, k, a[c], 7, -680876936), k = this.md5_ff(k, h, i, j, a[c + 1], 12, -389564586), j = this.md5_ff(j, k, h, i, a[c + 2], 17, 606105819), i = this.md5_ff(i, j, k, h, a[c + 3], 22, -1044525330), h = this.md5_ff(h, i, j, k, a[c + 4], 7, -176418897), k = this.md5_ff(k, h, i, j, a[c + 5], 12, 1200080426), j = this.md5_ff(j, k, h, i, a[c + 6], 17, -1473231341), i = this.md5_ff(i, j, k, h, a[c + 7], 22, -45705983), h = this.md5_ff(h, i, j, k, a[c + 8], 7, 1770035416), k = this.md5_ff(k, h, i, j, a[c + 9], 12, -1958414417), j = this.md5_ff(j, k, h, i, a[c + 10], 17, -42063), i = this.md5_ff(i, j, k, h, a[c + 11], 22, -1990404162), h = this.md5_ff(h, i, j, k, a[c + 12], 7, 1804603682), k = this.md5_ff(k, h, i, j, a[c + 13], 12, -40341101), j = this.md5_ff(j, k, h, i, a[c + 14], 17, -1502002290), i = this.md5_ff(i, j, k, h, a[c + 15], 22, 1236535329), h = this.md5_gg(h, i, j, k, a[c + 1], 5, -165796510), k = this.md5_gg(k, h, i, j, a[c + 6], 9, -1069501632), j = this.md5_gg(j, k, h, i, a[c + 11], 14, 643717713), i = this.md5_gg(i, j, k, h, a[c], 20, -373897302), h = this.md5_gg(h, i, j, k, a[c + 5], 5, -701558691), k = this.md5_gg(k, h, i, j, a[c + 10], 9, 38016083), j = this.md5_gg(j, k, h, i, a[c + 15], 14, -660478335), i = this.md5_gg(i, j, k, h, a[c + 4], 20, -405537848), h = this.md5_gg(h, i, j, k, a[c + 9], 5, 568446438), k = this.md5_gg(k, h, i, j, a[c + 14], 9, -1019803690), j = this.md5_gg(j, k, h, i, a[c + 3], 14, -187363961), i = this.md5_gg(i, j, k, h, a[c + 8], 20, 1163531501), h = this.md5_gg(h, i, j, k, a[c + 13], 5, -1444681467), k = this.md5_gg(k, h, i, j, a[c + 2], 9, -51403784), j = this.md5_gg(j, k, h, i, a[c + 7], 14, 1735328473), i = this.md5_gg(i, j, k, h, a[c + 12], 20, -1926607734), h = this.md5_hh(h, i, j, k, a[c + 5], 4, -378558), k = this.md5_hh(k, h, i, j, a[c + 8], 11, -2022574463), j = this.md5_hh(j, k, h, i, a[c + 11], 16, 1839030562), i = this.md5_hh(i, j, k, h, a[c + 14], 23, -35309556), h = this.md5_hh(h, i, j, k, a[c + 1], 4, -1530992060), k = this.md5_hh(k, h, i, j, a[c + 4], 11, 1272893353), j = this.md5_hh(j, k, h, i, a[c + 7], 16, -155497632), i = this.md5_hh(i, j, k, h, a[c + 10], 23, -1094730640), h = this.md5_hh(h, i, j, k, a[c + 13], 4, 681279174), k = this.md5_hh(k, h, i, j, a[c], 11, -358537222), j = this.md5_hh(j, k, h, i, a[c + 3], 16, -722521979), i = this.md5_hh(i, j, k, h, a[c + 6], 23, 76029189), h = this.md5_hh(h, i, j, k, a[c + 9], 4, -640364487), k = this.md5_hh(k, h, i, j, a[c + 12], 11, -421815835), j = this.md5_hh(j, k, h, i, a[c + 15], 16, 530742520), i = this.md5_hh(i, j, k, h, a[c + 2], 23, -995338651), h = this.md5_ii(h, i, j, k, a[c], 6, -198630844), k = this.md5_ii(k, h, i, j, a[c + 7], 10, 1126891415), j = this.md5_ii(j, k, h, i, a[c + 14], 15, -1416354905), i = this.md5_ii(i, j, k, h, a[c + 5], 21, -57434055), h = this.md5_ii(h, i, j, k, a[c + 12], 6, 1700485571), k = this.md5_ii(k, h, i, j, a[c + 3], 10, -1894986606), j = this.md5_ii(j, k, h, i, a[c + 10], 15, -1051523), i = this.md5_ii(i, j, k, h, a[c + 1], 21, -2054922799), h = this.md5_ii(h, i, j, k, a[c + 8], 6, 1873313359), k = this.md5_ii(k, h, i, j, a[c + 15], 10, -30611744), j = this.md5_ii(j, k, h, i, a[c + 6], 15, -1560198380), i = this.md5_ii(i, j, k, h, a[c + 13], 21, 1309151649), h = this.md5_ii(h, i, j, k, a[c + 4], 6, -145523070), k = this.md5_ii(k, h, i, j, a[c + 11], 10, -1120210379), j = this.md5_ii(j, k, h, i, a[c + 2], 15, 718787259), i = this.md5_ii(i, j, k, h, a[c + 9], 21, -343485551), h = this.safe_add(h, d), i = this.safe_add(i, e), j = this.safe_add(j, f), k = this.safe_add(k, g);return [h, i, j, k];
  }, t.prototype.binl2rstr = function (a) {
    var b,
        c = "";for (b = 0; b < 32 * a.length; b += 8) c += String.fromCharCode(a[b >> 5] >>> b % 32 & 255);return c;
  }, t.prototype.rstr2binl = function (a) {
    var b,
        c = [];for (c[(a.length >> 2) - 1] = void 0, b = 0; b < c.length; b += 1) c[b] = 0;for (b = 0; b < 8 * a.length; b += 8) c[b >> 5] |= (255 & a.charCodeAt(b / 8)) << b % 32;return c;
  }, t.prototype.rstr_md5 = function (a) {
    return this.binl2rstr(this.binl_md5(this.rstr2binl(a), 8 * a.length));
  }, t.prototype.rstr_hmac_md5 = function (a, b) {
    var c,
        d,
        e = this.rstr2binl(a),
        f = [],
        g = [];for (f[15] = g[15] = void 0, e.length > 16 && (e = this.binl_md5(e, 8 * a.length)), c = 0; 16 > c; c += 1) f[c] = 909522486 ^ e[c], g[c] = 1549556828 ^ e[c];return (d = this.binl_md5(f.concat(this.rstr2binl(b)), 512 + 8 * b.length), this.binl2rstr(this.binl_md5(g.concat(d), 640)));
  }, t.prototype.rstr2hex = function (a) {
    var b,
        c,
        d = "0123456789abcdef",
        e = "";for (c = 0; c < a.length; c += 1) b = a.charCodeAt(c), e += d.charAt(b >>> 4 & 15) + d.charAt(15 & b);return e;
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
  }), "undefined" != typeof importScripts && (chance = new a()), "object" == typeof window && "object" == typeof window.document && (window.Chance = a, window.chance = new a());
})();


}).call(this,require("buffer").Buffer)
},{"buffer":19}],7:[function(require,module,exports){
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

'use strict';

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
        for (i = 0, l = f.length; i < l; i++) s += typeof f[i] == 'string' ? f[i] : f[i][0];
        return f.join('');
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

},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
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

exports['default'] = names;
module.exports = exports['default'];

},{}],9:[function(require,module,exports){
/* global Chance */
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

require('./lib/chance');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _traits = require('./traits');

var _traits2 = _interopRequireDefault(_traits);

var Officer = (function () {
  function Officer(spec, HQ, unitName) {
    _classCallCheck(this, Officer);

    var chance = new Chance();
    var traits = new _traits2['default']();
    this.id = spec.id;
    this.isPlayer = spec.isPlayer;
    this.unitId = spec.unitId;
    this.rank = _config2['default'].ranks[spec.rank];
    this.experience = _config2['default'].ranks[spec.rank].startxp + _config2['default'].random(10);
    this.prestige = _config2['default'].ranks[spec.rank].startpr + _config2['default'].random(10);
    this.traits = { base: traits.random() };
    this.intelligence = this.traits.base.intelligence + _config2['default'].random(10);
    this.commanding = this.traits.base.commanding + _config2['default'].random(10);
    this.diplomacy = this.traits.base.diplomacy + _config2['default'].random(10);
    this.alignment = _config2['default'].random(1000);
    this.militancy = _config2['default'].random(10);
    this.drift = 0;
    this.operations = [];
    this.history = [];
    if (this.isPlayer) {
      this.lname = 'Richardson';
      this.fname = 'John';
      this.experience = 0;
    } else {
      this.lname = chance.last();
      this.fname = chance.first({ gender: 'male' });
    }
    this.graduate({
      date: _config2['default'].formatDate(HQ.rawDate),
      unitName: HQ.unitName(this.unitId, unitName)
    });
  }

  _createClass(Officer, [{
    key: 'name',
    value: function name() {
      return this.rank.title + ' ' + this.fname + ' ' + this.lname;
    }
  }, {
    key: 'graduate',
    value: function graduate(spec) {
      var graduation = { unit: spec.unitName, date: spec.date };
      this.history.push(_config2['default'].graduated(graduation, this));
    }
  }, {
    key: 'update',
    value: function update(HQ) {
      this.align();
      this.militate(HQ);
      this.experience++;
      this.prestige += _config2['default'].random(_config2['default'].ranks[this.rank.alias].startpr);
      if (this.experience > this.rank.maxxp) this.reserve(HQ);
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
    value: function reserve(HQ) {
      var _this2 = this;

      var lastUnit = HQ.units.filter(function (unit) {
        return unit.id === _this2.unitId;
      })[0];
      lastUnit.reserve.push(this);
      if (lastUnit.reserve.length > 3) lastUnit.reserve.pop();
      this.reserved = true;
      this.history.push('Moved to reserve on ' + HQ.realDate);
    }
  }]);

  return Officer;
})();

exports['default'] = Officer;
module.exports = exports['default'];

},{"./config":2,"./lib/chance":6,"./traits":15}],10:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _officer = require('./officer');

var _officer2 = _interopRequireDefault(_officer);

var _secretary = require('./secretary');

var _secretary2 = _interopRequireDefault(_secretary);

var _player = require('./player');

var _player2 = _interopRequireDefault(_player);

var Officers = (function () {
  function Officers() {
    _classCallCheck(this, Officers);

    this.active = [];
    this.__officersID = 1;
    this.secretary = new _secretary2['default']();
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

      var cadet = isPlayer ? new _player2['default'](options, this, unitName) : new _officer2['default'](options, this, unitName);

      this.officers.active.push(cadet);
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
      officer.history.push(_config2['default'].promoted(promotion));
      officer.drifts(this.active, spec.HQ.units);
      return officer;
    }
  }, {
    key: 'promotion',
    value: function promotion(officer, spec) {
      officer.unitId = spec.unitId;
      officer.rank = _config2['default'].ranks[spec.rank];

      return {
        rank: spec.rank,
        date: spec.HQ.realDate,
        unit: spec.HQ.unitName(officer.unitId)
      };
    }
  }]);

  return Officers;
})();

exports['default'] = Officers;
module.exports = exports['default'];

},{"./config":2,"./officer":9,"./player":12,"./secretary":14}],11:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var Operations = (function () {
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
        if (!operation.done && operation.target && !operation.target.reserved) {
          return true;
        } else {
          alert(operation.name + ' ended.');
          return false;
        }
      });
      this.active.forEach(function (operation) {
        operation.execute(HQ);
      });
    }
  }]);

  return Operations;
})();

var Operation = (function () {
  function Operation(spec) {
    _classCallCheck(this, Operation);

    this.officer = spec.officer;
    this.target = spec.target;
    this.type = spec.type;
    this.name = spec.name;
    this.strength = 0;
    this.documents = [];
    this.done = false;
    this.fail = false;
    this.success = false;
  }

  _createClass(Operation, [{
    key: 'execute',
    value: function execute(HQ) {
      var officerRoll = this.officer[this.type] + _config2['default'].random(10);
      var targetRoll = this.target[this.type] + _config2['default'].random(10);
      if (officerRoll > targetRoll) {
        this.strength++;
        console.log(this.strength);
      }
    }
  }]);

  return Operation;
})();

exports['default'] = Operations;

// 'use strict';
// import config from './config';
//
// class Operations {
//   constructor () {
//     this.__operationsID = 1;
//     this.active = [];
//   }
//
//   add (HQ, officer, target, type) {
//     let operation = new Operation(HQ, officer, target);
//     operation.id = this.__operationsID;
//     this.__operationsID++;
//     this.active.push(operation);
//     return operation;
//   }
//
//   update (HQ) {
//     this.active = this.active.filter(operation => {
//       return (!operation.done && !operation.lead.reserved && !operation.target.reserved);
//     });
//     this.active.forEach(operation => { operation.execute(HQ); });
//   }
// }
//
// class Operation {
//   constructor (officer, HQ, target, type) {
//     this.lead = officer;
//     this.side = (officer.alignment > 500) ? 'right' : 'left';
//     this.target = (target) ? target : this.pick(officer, HQ);
//     this.type = (type) ? type : config.operations[officer.traits.base.area];
//     this.strength = 0;
//     this.failed = (this.target) ? null : true;
//     this.done = null;
//   }
//
//   pick (officer, HQ) {
//     this.targets = HQ.officers.active.filter(officer => {
//       if (officer.militancy > 5)  {
//         if (
//           officer.alignment > 500 && this.side === 'left' ||
//           officer.alignment < 500 && this.side === 'right'
//         ) {
//           return true;
//         }
//       }
//     }) || [];
//
//     return this.targets[Math.ceil(Math.random() * this.targets.length)];
//   }
//
//   execute (HQ) {
//     this.strength++;
//     if (this.strength > 5)  {
//       if (this.target[this.type.area] < this.lead[this.type.area]) {
//         HQ.deassign(this.target.unitId);
//         this.done = true;
//         this.result = this[this.type.action](HQ.realDate);
//         this.target.reserved = true;
//         this.target.history.push('Forced on to reserve by ' + this.lead.name());
//       } else {
//         this.failed = true;
//       }
//     }
//   }
//
//   deviate (date) {
//     let result = 'Forced ' + this.target.name() +
//     ' into reserve after revealing a fraudulent scheme on ' + date;
//     this.lead.history.push(result);
//     return result;
//   }
//
//   coup (date) {
//     let result = 'Forced ' + this.target.name() +
//     ' into reserve after taking control of his unit on ' + date;
//     this.lead.history.push(result);
//     return result;
//   }
//
//   influence (date) {
//     let result = 'Forced ' + this.target.name() +
//     ' into reserve after influencing key staff members on ' + date;
//     this.lead.history.push(result);
//     return result;
//   }
//
//   spy (date) {
//     let result = 'Forced ' + this.target.name() +
//     ' into reserve after revealing personal secrets on ' + date;
//     this.lead.history.push(result);
//     return result;
//   }
// }
//
// export default Operations;
module.exports = exports['default'];

},{"./config":2}],12:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _officer = require('./officer');

var _officer2 = _interopRequireDefault(_officer);

var Player = (function (_Officer) {
  _inherits(Player, _Officer);

  function Player(spec, HQ, unitName) {
    _classCallCheck(this, Player);

    spec.isPlayer = true;
    _get(Object.getPrototypeOf(Player.prototype), 'constructor', this).call(this, spec, HQ, unitName);
  }

  return Player;
})(_officer2['default']);

exports['default'] = Player;
module.exports = exports['default'];

},{"./config":2,"./officer":9}],13:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

require('./lib/chance');

var chance = new Chance();

var Region = function Region(id) {
  _classCallCheck(this, Region);

  this.id = id;
  this.name = chance.city();
  this.units = [];
};

exports['default'] = Region;
module.exports = exports['default'];

},{"./lib/chance":6}],14:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Secretary = (function () {
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
})();

exports['default'] = Secretary;
module.exports = exports['default'];

},{}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Traits = (function () {
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
})();

exports['default'] = Traits;
module.exports = exports['default'];

},{}],16:[function(require,module,exports){
"use strict";

},{}],17:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _names = require('./names');

var _names2 = _interopRequireDefault(_names);

var Unit = function Unit(spec, HQ) {
  _classCallCheck(this, Unit);

  this.id = spec.id;
  this.parentId = spec.parentId;
  this.type = spec.type;
  this.name = _names2['default'][spec.type][0];
  _names2['default'][spec.type].shift();
  this.subunits = [];
  this.reserve = [];
  this.commander = HQ.officers.recruit.call(HQ, spec.rank, this.id, false, this.name);
};

exports['default'] = Unit;
module.exports = exports['default'];

},{"./names":8}],18:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _region = require('./region');

var _region2 = _interopRequireDefault(_region);

var World = (function () {
  function World(HQ) {
    _classCallCheck(this, World);

    this.regions = [];
    this.generate(HQ);
  }

  _createClass(World, [{
    key: 'addRegion',
    value: function addRegion() {
      var regionId = this.regions.length;
      this.regions.push(new _region2['default'](regionId));
    }
  }, {
    key: 'generate',
    value: function generate(HQ) {
      var amount = _config2['default'].random(10) + 5;
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
})();

exports['default'] = World;
module.exports = exports['default'];

},{"./config":2,"./region":13}],19:[function(require,module,exports){
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
},{"base64-js":20,"ieee754":21,"isarray":22}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}]},{},[4]);
