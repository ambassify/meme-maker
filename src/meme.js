import _lodashTemplate from 'lodash/template';
import _templateSettings from 'lodash/templateSettings';
import _transform from 'lodash/transform';
import Emitter from './emitter';

const _template = (tpl) => {
    const compiled = _lodashTemplate(tpl);
    return data => compiled({ ...data, data });
};

const MEME_CONFIGURATION = '[data-meme-type="configuration"]';
const MEME_USAGE = '[data-meme-type="usage"]';

const _jsonParse = (str) => {
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
_templateSettings.interpolate = /{{([^|]+?)}}/g;
_templateSettings.escape = /{{([^}]+?)\|e\s*}}/g;
_templateSettings.evaluate = /{%([\s\S]+?)%}/g;

function download(url, ok, error) {
    const request = new XMLHttpRequest();
    request.open('GET', url, true);

    request.onreadystatechange = function() {
        if (request.readyState != 4)
            return;

        if (request.status >= 200 && request.status < 400) {
            ok(request.responseText);
        } else {
            error();
        }
    }
    request.onerror = error;
    request.send();
}

function getFragment(html) {
    const fragment = document.createDocumentFragment();
    const body = document.createElement('body');

    body.innerHTML = html;
    fragment.appendChild(body);

    return fragment;
}

function getFragmentContents(fragment) {
    return fragment.querySelector('body').innerHTML;
}

function getFromHtml(html, selector) {
    const node = getFragment(html).querySelector(selector);
    return node ? node.innerHTML : '';
}

function setInHtml(html, selector, contents) {
    const frag = getFragment(html);
    const el = frag.querySelector(selector);

    if (el) {
        el.innerHTML = contents;
        return getFragmentContents(frag);
    }

    return html;
}

function createFrame() {
    const frame = document.createElement('iframe');
    frame.setAttribute('class', 'amb-meme-container');
    frame.style.border = 'none';
    frame.style['vertical-align'] = 'bottom';
    frame.addEventListener('load', () => {
        frame.setAttribute('data-loaded', 'true');
    });
    return frame;
}

function waitForFrame(container, onFrame) {
    if (container.getAttribute('data-loaded') == 'true')
        return false;

    container.addEventListener('load', onFrame);
    return true;
}

function createScript(node){
    const script  = document.createElement("script");

    script.text = node.innerHTML;
    for (let i = node.attributes.length - 1; i >= 0; i--) {
        script.setAttribute(node.attributes[i].name, node.attributes[i].value);
    }

    return script;
}

function render(container, template, data, overwriteConfig) {
    let html = template ? template(data) : '';

    if (overwriteConfig) {
        const json = JSON.stringify(overwriteConfig);
        html = setInHtml(html, MEME_CONFIGURATION, json);
    }

    const body = container.contentWindow.document.body;

    body.innerHTML = html;

    const scripts = body.querySelectorAll('script[type="text/javascript"]');
    [].forEach.call(scripts, script => script.parentNode.replaceChild(createScript(script), script));

    if (data.width)
        container.setAttribute('width', data.width);

    if (data.height)
        container.setAttribute('height', data.height);

    return html;
}

function attachChangeHandlers(container, onChange) {
    const target = container.contentWindow;
    ['change', 'blur', 'keyup', 'paste', 'input'].forEach(eventName => {
        target.addEventListener(eventName, (e) => {
            const target = e.target;
            // not a node, could be the window for example
            if (!target.getAttribute)
                return;

            const memeVar = target.getAttribute('data-meme-var');

            if (!memeVar)
                return;

            const tag = target.tagName.toLowerCase();
            const contentEditable = target.getAttribute('contentEditable');
            const previous = target.getAttribute('data-original');
            let current;

            if (tag === 'input' || tag === 'textarea')
                current = target.value;
            else if (contentEditable && contentEditable != 'false')
                current = target.innerHTML;

            if (current === previous)
                return;

            target.setAttribute('data-original', current);
            onChange({ [memeVar]: current });
        });
    });
}

export default
class Meme extends Emitter {
    config = {}

    constructor(container) {
        super();

        if (typeof container === 'string')
            container = document.querySelector(container);

        if (!container)
            throw new Error('A valid container must be passed');

        this.parent = container;

        this.container = createFrame();
        this.parent.appendChild(this.container);
    }

    _setSource(html) {
        this._html = html;
        this._defaultConfig = _jsonParse(getFromHtml(html, MEME_CONFIGURATION));
        this._template = _template(html);
        this._usageTemplate = _template(getFromHtml(html, MEME_USAGE));
    }

    _loadSource(url, ready) {
        download(url, (html) => {
            this._setSource(html);
            ready(html);
        }, () => { throw new Error('Failed to load meme: ' + url); });
    }

    getConfig() {
        const config = {};

        Object.assign(config, this._defaultConfig, this.config);
        config.variables = this.getVariables();

        return config;
    }

    getVariables(override = {}) {
        return Object.assign(
            { engine: 'meme' },
            this._defaultConfig.variables || {},
            this.config.variables || {},
            override
        );
    }

    configure(config, ready) {
        if (waitForFrame(this.container, () => this.configure(config, ready)))
            return;

        const setHtml = config.html && config.html !== this._html;
        const getHtml = !config.html && config.url && config.url !== this.config.url;
        this.config = config;

        if (setHtml) {
            this._setSource(config.html);
        } else if (getHtml) {
            return this._loadSource(config.url, () => this.configure(config, ready));
        } else if (!this._html) {
            throw new Error('First call to configure must have an URL or html for the meme');
        }

        delete this.config.html;
        const newConfig = this.getConfig();
        const data = newConfig.variables;

        const template = setInHtml(this._html, MEME_CONFIGURATION, JSON.stringify(newConfig));

        const readyData = {
            config: newConfig,
            template,
            usage: this._usageTemplate ? _jsonParse(this._usageTemplate(data)) : {},
            preview: render(this.container, this._template, data, newConfig)
        };

        attachChangeHandlers(this.container, (changes) => this.emit('change', changes));
        this.emit('ready', readyData);

        if (typeof ready === 'function')
            ready(readyData);
    }

    render(variables, ready) {
        if (waitForFrame(this.container, () => this.render(variables, ready)))
            return;

        const readyData = {
            variables,
            preview: render(this.container, this._template, this.getVariables(variables))
        };

        attachChangeHandlers(this.container, (changes) => this.emit('change', changes));
        this.emit('rendered', readyData);

        if (typeof ready === 'function')
            ready(readyData);
    }
}
