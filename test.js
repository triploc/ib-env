require('./').setup({
    session: {
        trace: "./output/events.log"
    },
    account: true,
    securities: [ "AAPL stock" ],
    quote: true,
    depth: true,
    charts: {
        historicals: [ "30 secs", "5 mins", "30 mins" ]
    },
    fundamentals: [ "snapshot", "statements", "consensus", /* "financials", "ownership", "calendar" */ ]
}, (err, env, interactive) => {
    if (err) console.log(err);
    else {
        let account = env.workspace.account,
            AAPL = env.workspace.AAPL;
    
        interactive(); // start repl terminal
    }
});