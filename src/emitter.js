export default
class Emitter {
    events = {}

    on(name, cb) {
        this.events[name] = this.events[name] || [];
        this.events[name].push(cb);
        return this;
    }

    once(name, cb) {
        const proxy = (...args) => {
            this.off(name, cb);
            cb.apply(undefined, args);
        }
        proxy._original = cb;
        return this;
    }

    off(name, cb) {
        const cbs = this.events[name];

        if (!cbs)
            return this;

        for (let i = cbs.length - 1; i >= 0; i--) {
            if (cbs[i] === cb || cbs[i]._original === cb)
                cbs.splice(i, 1);
        }

        if (!cbs.length)
            delete this.events[name];

        return this;
    }

    emit(name, ...args) {
        const cbs = this.events[name];

        if (!cbs)
            return this;

        for (let i = cbs.length -1; i >= 0; i--) {
            cbs[i].apply(undefined, args);
        }

        return this;
    }
}
