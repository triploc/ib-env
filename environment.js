"use strict";

const Events = require("events"),
      async = require("async");

class Scheduler {
    
    constructor() {
        this.timers = { };
    }
    
    notify(time, cb) {
        if (time.isPast() || time.secondsFromNow() < 1) {
            cb();
        }
        else {
            let name = time.getTime();
            if (this.timers[name]) this.timers[name].callbacks.push(cb);
            else {
                this.timers[name] = { callbacks: [ cb ] };
                setTimeout(() => this.timers[name].callbacks.forEach(cb => cb()), time.millisecondsFromNow() - 10);
            }
        }
    }
    
}

class Environment extends Events {
    
    constructor(session) {
        super();
        
        Object.defineProperty(this, "session", { value: session });
        
        this.workspace = { };
    }
    
    assign(name, value) {
        if (!this.workspace.symbols) {
            this.workspace.symbols = [ ];
        }
        
        if (this.workspace[name] == null) {
            this.workspace[name] = value;
            this.workspace.symbols.append(name).sort();
        }
        
        return this;
    }
    
    free(name) {
        if (this.workspace[name]) {
            this.workspace[name].cancel();
        }
        
        delete this.workspace[name];
        this.symbols.remove(name);
        
        return this;
    }
    
    securities(symbols, cb) {
        if (!Array.isArray(symbols)) symbols = [ symbols ];
        async.mapSeries(symbols, (symbol, cb) => {
            this.session.securities(symbol, (err, securities) => {
                if (err) cb(err);
                else {
                    security.environment = this;
                    this.assign(security.contract.symbol, security);
                    cb(null, security);
                }
            });
        }, (err, securities) => cb(err, securities ? securities.flatten() : null));
        
        return this;
    }
    
    curves(symbols, cb) {
        if (!Array.isArray(symbols)) symbols = [ symbols ];
        async.mapSeries(symbols, (symbol, cb) => {
            this.session.curve(symbol, (err, curve) => {
                if (err) cb(err);
                else {
                    curve.environment = this;
                    this.assign(curve.symbol, curve);
                    cb(null, curve);
                }
            });
        }, cb);
    }
    
    optionChains(symbols, cb) {
        if (!Array.isArray(symbols)) symbols = [ symbols ];
        async.mapSeries(symbols, (symbol, cb) => {
            this.session.chain(symbol, (err, chain) => {
                if (err) cb(err);
                else {
                    chain.environment = this;
                    this.assign(chain.symbol, chain);
                    cb(null, chain);
                }
            });
        }, cb);
    }

    account(options, cb) {
        if (cb == null && typeof options == "function") {
            cb = options;
            options = null;
        }
        
        let name = options ? options.name || "account" : "account";
        this.workspace[name] = this.session.account(options).on("load", err => cb(err, this.workspace.account));
        
        return this;
    }
    
    accountSummary(options, cb) {
        if (cb == null && typeof options == "function") {
            cb = options;
            options = null;
        }
        
        let name = options ? options.name || "accountSummary" : "accountSummary";
        this.workspace[name] = this.session.accountSummary(options).on("load", err => cb(err, this.workspace.accountSummary));
        
        return this;
    }
    
    positions(options, cb) {
        if (cb == null && typeof options == "function") {
            cb = options;
            options = null;
        }
        
        let name = options ? options.name || "positions" : "positions";
        this.workspace[name] = this.session.positions(options).on("load", err => cb(err, this.workspace.positions));
        
        return this;
    }
    
    trades(options, cb) {
        if (cb == null && typeof options == "function") {
            cb = options;
            options = null;
        }
        
        let name = options ? options.name || "trades" : "trades";
        this.workspace[name] = this.session.trades(options).on("load", err => cb(err, this.workspace.trades));
        
        return this;
    }
    
    terminal(repl) {
        for (let key in this.workspace) {
            repl.context[key] = this.workspace[key];
        }
        
        repl.context.session = this.session;
        
        repl.context.$ = text => {
            this.session.securities(text, (err, list) => {
                if (err) console.log(err);
                else list.forEach(l => this.assign(l.contract.symbol, l));
            });
        };
        
        repl.context.chain = text => {
            this.session.chain(text, (err, chain) => {
                if (err) console.log(err);
                else this.assign(chain.symbol, chain);
            });
        };
        
        repl.context.curve = text => {
            this.session.curve(text, (err, curve) => {
                if (err) console.log(err);
                else this.assign(curve.symbol, curve);
            });
        };
        
        this.workspace = repl.context;
        repl.on("exit", () => this.session.close());
        return repl;
    }
    
}

module.exports = Environment;