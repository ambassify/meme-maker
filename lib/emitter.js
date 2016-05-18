"use strict";

exports.__esModule = true;

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Emitter = function () {
    function Emitter() {
        (0, _classCallCheck3.default)(this, Emitter);
        this.events = {};
    }

    Emitter.prototype.on = function on(name, cb) {
        this.events[name] = this.events[name] || [];
        this.events[name].push(cb);
        return this;
    };

    Emitter.prototype.once = function once(name, cb) {
        var _this = this;

        var proxy = function proxy() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            _this.off(name, cb);
            cb.apply(undefined, args);
        };
        proxy._original = cb;
        return this;
    };

    Emitter.prototype.off = function off(name, cb) {
        var cbs = this.events[name];

        if (!cbs) return this;

        for (var i = cbs.length - 1; i >= 0; i--) {
            if (cbs[i] === cb || cbs[i]._original === cb) cbs.splice(i, 1);
        }

        if (!cbs.length) delete this.events[name];

        return this;
    };

    Emitter.prototype.emit = function emit(name) {
        var cbs = this.events[name];

        if (!cbs) return this;

        for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
        }

        for (var i = cbs.length - 1; i >= 0; i--) {
            cbs[i].apply(undefined, args);
        }

        return this;
    };

    return Emitter;
}();

exports.default = Emitter;