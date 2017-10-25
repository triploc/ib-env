"use strict";

const fs = require("fs"),
      repl = require("repl"),
      ib = require("ib-sdk"),
      async = require("async"),
      mock = require("./mock"),
      Environment = require("./environment");

module.exports = (config, cb) => {
    if (cb == null && typeof config == "function") {
        cb = config;
        config = null;
    }
    
    config = config || { };
    
    if (typeof config.repl === "undefined") config.repl = true;
    if (config.error == null) config.error = err => console.log(err);
    if (config.disconnected == null) config.disconnected = () => process.exit(0);
    
    let open = ib.open;
    if (config.mock) open = mock;
    
    if (config.record) {
        let file = config.record;
        if (typeof file == "boolean") {
            file = (new Date()).getTime() + ".log";
        }
        
        if (!config.session) config.session = { };
        config.session.trace = (name, data) => {
            let msg = (new Date()).getTime() + "|" + name + "|" + JSON.stringify(data) + "\n";
            fs.appendFile(file, msg, err => err ? console.log(err) : null);
        }
    }
    
    let mock = open(config.session, (err, session) => {
        if (err) {
            if (cb) cb(err);
            else config.error(err);
        }
        else {
            session.on("disconnected", config.disconnected).on("error", config.error);
            session.frozen = config.frozen;
            
            let env = new Environment(session);
            env.on("error", config.error);
            
            let interactive = () => env.terminal(repl.start(config.repl === true ? "> " : config.repl));
            assemble(env, config, err => {
                if (cb) cb(err, env, interactive);
                else {
                    if (err) config.error(err);
                    interactive();
                }
            });
        }
    });
    
    if (config.mock) {
        mock.replay(config.mock);
    }
    
    if (config.doNotHandleUncaughtExceptions) return;
    else process.on('uncaughtException', config.error);
};

function assemble(env, config, cb) {
    if (config.fundamentals && !Array.isArray(config.fundamentals)) {
        config.fundamentals = [ config.fundamentals ];
    }
    
    async.series([
        cb => config.account ? env.account(config.account, cb) : cb(),
        cb => config.accountSummary ? env.accountSummary(config.accountSummary, cb) : cb(),
        cb => config.positions ? env.positions(config.positions, cb) : cb(),
        cb => config.orders ? env.session.orders.stream() : cb(),
        cb => config.trades ? env.trades(config.trades, cb) : cb(),
        cb => config.securities ? env.securities(config.securities, (err, securities) => {
            if (err) cb(err);
            else subscribe(env, config, securities, cb);
        }) : cb(),
        cb => config.curves ? env.curves(config.curves, cb) : cb(),
        cb => config.optionChains ? env.optionChains(config.optionChains, cb) : cb()
    ], err => cb(err));
}

function subscribe(env, config, securities, cb) {
    async.forEachSeries(securities, (security, cb) => {
        async.parallel([
            cb => {
                if (config.charts && security.charts) {
                    if (typeof config.charts == "object" && config.charts.studies) {
                        security.charts.each(bars => config.charts.studies.forEach(params => bars.study(...params)));
                    }

                    if (security.contract.marketsOpen) {
                        security.charts.stream().either("error", "update", err => {
                            if (err) cb(err);
                            else if (typeof config.charts == "object" && config.charts.historicals) {
                                async.forEachSeries(config.charts.historicals, (barSize, cb) => security.charts.get(barSize).history(cb), cb);
                            }
                            else cb();
                        });
                    }
                    else {
                        security.contract.on("marketsOpen", () => security.charts.stream());
                        if (typeof config.charts == "object" && config.charts.historicals) {
                            async.forEachSeries(config.charts.historicals, (barSize, cb) => security.charts.get(barSize).history(cb), cb);
                        }
                        else cb();
                    }
                }
                else cb();
            },
            cb => {
                if (config.quote && security.quote) {
                    if (typeof config.quote == "object") {
                        if (config.quote.types) config.quote.types.forEach(t => security.quote[t]());
                        if (config.quote.fields) security.quote.addFieldTypes(config.quote.fields);
                    }
                    else if (Array.isArray(config.quote)) security.quote.addFieldTypes(config.quote);

                    if (security.contract.marketsOpen || security.session.frozen) security.quote.stream().either("error", "load", cb);
                    else security.quote.query(cb).contract.on("marketsOpen", () => security.query.stream());
                }
                else cb();
            },
            cb => {
                if (config.depth && security.depth) {
                    let depth = (typeof config.depth == "object") ? config.depth : { };
                    if (security.contract.marketsOpen) security.depth.stream(depth.exchanges, depth.rows).either("error", "update", cb);
                    else {
                        security.contract.on("marketsOpen", () => security.depth.stream(depth.exchanges, depth.rows));
                        cb();
                    }
                }
                else cb();
            },
            cb => {
                if (config.fundamentals && security.contract.summary.secType == ib.flags.SECURITY_TYPE.stock && security.fundamentals) {
                    async.forEachSeries(config.fundamentals, (report, cb) => security.fundamentals(report, err => cb()), err => cb(err));
                }
                else cb();
            }
        ], cb);
    }, cb);
}