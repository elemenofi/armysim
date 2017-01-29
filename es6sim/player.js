'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var officer_1 = require('./officer');
var Player = (function (_super) {
    __extends(Player, _super);
    function Player(spec, HQ, unitName) {
        spec.isPlayer = true;
        _super.call(this, spec, HQ, unitName);
    }
    return Player;
})(officer_1["default"]);
exports["default"] = Player;
