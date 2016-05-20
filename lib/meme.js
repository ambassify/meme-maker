'use strict';

exports.__esModule = true;

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _template2 = require('lodash/template');

var _template3 = _interopRequireDefault(_template2);

var _templateSettings2 = require('lodash/templateSettings');

var _templateSettings3 = _interopRequireDefault(_templateSettings2);

var _transform2 = require('lodash/transform');

var _transform3 = _interopRequireDefault(_transform2);

var _emitter = require('./emitter');

var _emitter2 = _interopRequireDefault(_emitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _template = function _template(tpl) {
    var compiled = (0, _template3.default)(tpl);
    return function (data) {
        return compiled((0, _extends3.default)({}, data, { data: data }));
    };
};

var MEME_CONFIGURATION = '[data-meme-type="configuration"]';
var MEME_USAGE = '[data-meme-type="usage"]';

var _jsonParse = function _jsonParse(str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return {};
    }
};

// Lodash templating with Twig style delimiters
// {{ }} to 'paste' variables
// {{ |e }} to HTML-escape and 'paste'
// {% %} to evaluate JavaScript
_templateSettings3.default.interpolate = /{{([^|]+?)}}/g;
_templateSettings3.default.escape = /{{([^}]+?)\|e\s*}}/g;
_templateSettings3.default.evaluate = /{%([\s\S]+?)%}/g;

function download(url, ok, error) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);

    request.onreadystatechange = function () {
        if (request.readyState != 4) return;

        if (request.status >= 200 && request.status < 400) {
            ok(request.responseText);
        } else {
            error();
        }
    };
    request.onerror = error;
    request.send();
}

function getFragment(html) {
    var fragment = document.createDocumentFragment();
    var body = document.createElement('body');

    body.innerHTML = html;
    fragment.appendChild(body);

    return fragment;
}

function getFragmentContents(fragment) {
    return fragment.querySelector('body').innerHTML;
}

function getFromHtml(html, selector) {
    var node = getFragment(html).querySelector(selector);
    return node ? node.innerHTML : '';
}

function setInHtml(html, selector, contents) {
    var frag = getFragment(html);
    var el = frag.querySelector(selector);

    if (el) {
        el.innerHTML = contents;
        return getFragmentContents(frag);
    }

    return html;
}

function createFrame() {
    var frame = document.createElement('iframe');
    frame.setAttribute('class', 'amb-meme-container');
    frame.style.border = 'none';
    frame.style['vertical-align'] = 'bottom';
    return frame;
}

function waitForFrame(container, onFrame) {
    if (container.contentWindow.document.body) return false;

    container.addEventListener('load', onFrame);
    return true;
}

function createScript(node) {
    var script = document.createElement("script");

    script.text = node.innerHTML;
    for (var i = node.attributes.length - 1; i >= 0; i--) {
        script.setAttribute(node.attributes[i].name, node.attributes[i].value);
    }

    return script;
}

function _render(container, template, data, overwriteConfig) {
    var html = template ? template(data) : '';

    if (overwriteConfig) {
        var json = (0, _stringify2.default)(overwriteConfig);
        html = setInHtml(html, MEME_CONFIGURATION, json);
    }

    var body = container.contentWindow.document.body;

    body.innerHTML = html;

    var scripts = body.querySelectorAll('script[type="text/javascript"]');
    [].forEach.call(scripts, function (script) {
        return script.parentNode.replaceChild(createScript(script), script);
    });

    if (data.width) container.setAttribute('width', data.width);

    if (data.height) container.setAttribute('height', data.height);

    return html;
}

function attachChangeHandlers(container, onChange) {
    var target = container.contentWindow;
    ['change', 'blur', 'keyup', 'paste', 'input'].forEach(function (eventName) {
        target.addEventListener(eventName, function (e) {
            var _onChange;

            var target = e.target;
            // not a node, could be the window for example
            if (!target.getAttribute) return;

            var memeVar = target.getAttribute('data-meme-var');

            if (!memeVar) return;

            var tag = target.tagName.toLowerCase();
            var contentEditable = target.getAttribute('contentEditable');
            var previous = target.getAttribute('data-original');
            var current = void 0;

            if (tag === 'input' || tag === 'textarea') current = target.value;else if (contentEditable && contentEditable != 'false') current = target.innerHTML;

            if (current === previous) return;

            target.setAttribute('data-original', current);
            onChange((_onChange = {}, _onChange[memeVar] = current, _onChange));
        });
    });
}

var Meme = function (_Emitter) {
    (0, _inherits3.default)(Meme, _Emitter);

    function Meme(container) {
        (0, _classCallCheck3.default)(this, Meme);

        var _this = (0, _possibleConstructorReturn3.default)(this, _Emitter.call(this));

        _this.config = {};


        if (typeof container === 'string') container = document.querySelector(container);

        if (!container) throw new Error('A valid container must be passed');

        _this.parent = container;

        _this.container = createFrame();
        _this.parent.appendChild(_this.container);
        return _this;
    }

    Meme.prototype._setSource = function _setSource(html) {
        this._html = html;
        this._defaultConfig = _jsonParse(getFromHtml(html, MEME_CONFIGURATION));
        this._template = _template(html);
        this._usageTemplate = _template(getFromHtml(html, MEME_USAGE));
    };

    Meme.prototype._loadSource = function _loadSource(url, ready) {
        var _this2 = this;

        download(url, function (html) {
            _this2._setSource(html);
            ready(html);
        }, function () {
            throw new Error('Failed to load meme: ' + url);
        });
    };

    Meme.prototype.getConfig = function getConfig() {
        var config = {};

        (0, _assign2.default)(config, this._defaultConfig, this.config);
        config.variables = this.getVariables();

        return config;
    };

    Meme.prototype.getVariables = function getVariables() {
        var override = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        return (0, _assign2.default)({ engine: 'meme' }, this._defaultConfig.variables || {}, this.config.variables || {}, override);
    };

    Meme.prototype.configure = function configure(config, ready) {
        var _this3 = this;

        if (waitForFrame(this.container, function () {
            return _this3.configure(config, ready);
        })) return;

        var setHtml = config.html && config.html !== this._html;
        var getHtml = !config.html && config.url && config.url !== this.config.url;
        this.config = config;

        if (setHtml) {
            this._setSource(config.html);
        } else if (getHtml) {
            return this._loadSource(config.url, function () {
                return _this3.configure(config, ready);
            });
        } else if (!this._html) {
            throw new Error('First call to configure must have an URL or html for the meme');
        }

        delete this.config.html;
        var newConfig = this.getConfig();
        var data = newConfig.variables;

        var template = setInHtml(this._html, MEME_CONFIGURATION, (0, _stringify2.default)(newConfig));

        var readyData = {
            config: newConfig,
            template: template,
            usage: this._usageTemplate ? _jsonParse(this._usageTemplate(data)) : {},
            preview: _render(this.container, this._template, data, newConfig)
        };

        attachChangeHandlers(this.container, function (changes) {
            return _this3.emit('change', changes);
        });
        this.emit('ready', readyData);

        if (typeof ready === 'function') ready(readyData);
    };

    Meme.prototype.render = function render(variables, ready) {
        var _this4 = this;

        if (waitForFrame(this.container, function () {
            return _this4.render(variables, ready);
        })) return;

        var readyData = {
            variables: variables,
            preview: _render(this.container, this._template, this.getVariables(variables))
        };

        attachChangeHandlers(this.container, function (changes) {
            return _this4.emit('change', changes);
        });
        this.emit('rendered', readyData);

        if (typeof ready === 'function') ready(readyData);
    };

    return Meme;
}(_emitter2.default);

exports.default = Meme;