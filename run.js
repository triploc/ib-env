let prog = require('commander'),
    fs = require('fs'),
    Sugar = require('sugar');

let list = val => val.length ? val.split(',').compact(true) : null;
let integer = val => parseInt(val);

prog.version('0.1.0')
    .usage('[options] [files]')
    /* Low-level Settings */
    .option('-h, --host <host>', 'Specifies the host', 'localhost')
    .option('-p, --port <port>', 'Specifies the port (otherwise IB gateway default port)', integer, 4001)
    .option('--paper', 'Uses the IB gateway default paper trading port', 4002)
    .option('--tws', 'Uses the TWS default port', 7496)
    .option('-t, --timeout <millis>', 'Specifies the connection timeout', integer, 2500)
    .option('-i, --mock <file>', 'Mock events from trace file')
    .option('-o, --record [file]', 'Record events with optional file name')
    .option('-s, --norepl', 'No terminal interface', false)
    /* Balances & Trading */
    .option('--account [id]', 'Stream account [id] or first account found')
    .option('--summary', 'Stream account summary')
    .option('--trades', 'Stream trades')
    .option('--orders', 'Stream orders')
    .option('--positions', 'Stream positions')
    /* Market Data */
    .option('--frozen', 'Use frozen quote data (useful for after-hours).')
    .option('--securities <list>', 'Load securities', list)
    .option('--curves <list>', 'Load curves', list)
    .option('--option-chains <list>', 'Load option chains', list)
    .parse(process.argv);

let config = { 
    session: { 
        host: prog.host,
        port: prog.port,
        timeout: prog.timeout
    },
    repl: !prog.norepl,
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
    optionChains: prog.chains
};

require('./index').run(config, prog.args);