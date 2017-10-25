let prog = require('commander'),
    fs = require('fs'),
    Sugar = require('sugar');

let list = val => val.length ? val.split(',').compact(true) : null;

prog.version('0.1.0')
    .usage('[options] [files]')
    .option('-h, --host <host>', 'Specifies the host', 'localhost')
    .option('-p, --port <port>', 'Specifies the port', parseInt, 4001)
    .option('-t, --timeout <millis>', 'Specifies the connection timeout', parseInt, 2500)
    .option('-m, --mock <file>', 'Mock events from trace file')
    .option('-r, --record [file]', 'Record events with optional file name')
    .option('-a, --account [id]', 'Stream account [id] or first account found')
    .option('-s, --summary', 'Stream account summary')
    .option('-x, --trades', 'Stream trades')
    .option('-o, --orders', 'Stream orders')
    .option('-b, --positions', 'Stream positions')
    .option('-e, --securities <list>', 'Load securities', list)
    .option('-c, --curves <list>', 'Load curves', list)
    .option('-p, --chains <list>', 'Load option chains', list)
    .option('-f, --frozen', 'Use frozen quote data')
    .option('-q, --quote [list]', 'Stream quote with types', list)
    .option('-u, --fundamentals [list]', 'Load fundamental reports', list)
    .option('-d, --depth [rows]', 'Load level2 quotes', parseInt, 5)
    .option('-w, --charts', 'Stream real-time bars')
    .option('--norepl', 'No terminal interface', false)
    .parse(process.argv);

let config = { 
    session: { 
        host: prog.host,
        port: prog.port,
        timeout: prog.timeout
    },
    mock: prog.mock,
    record: prog.record,
    account: prog.account,
    accountSummary: prog.summary,
    trades: prog.trades,
    orders: prog.orders,
    positions: prog.positions,
    frozen: prog.frozen,
    securities: prog.securities,
    curves: prog.curves,
    optionChains: prog.chains,
    quote: prog.quote,
    chart: prog.charts,
    repl: !prog.norepl
};

require('./index').run(config, prog.args);