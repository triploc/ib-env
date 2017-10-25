[![Logo](./ib-logo.png)](http://interactivebrokers.com/)

# Interactive Brokers Environment

Simplify setup of programmable trading environments using the [ib-sdk](https://github.com/triploc/ib-sdk).

## Installation

    npm install ib-env
    
#### Prerequisites

* An [Interactive Brokers](https://www.interactivebrokers.com/) trading account.
* Install the [IB Gateway](https://www.interactivebrokers.com/en/index.php?f=16457) or [IB TWS (Trader Workstation)](https://www.interactivebrokers.com/en/index.php?f=674&ns=T).
    
## Getting Started

Login to the [IB Gateway](http://interactivebrokers.github.io) or [IB TWS (Trader Workstation)](https://www.interactivebrokers.com/en/index.php?f=674&ns=T) software.

* The API and SDK expect to connect to an authenticated user session.
* The IB software must be configured to accept API connections.
* The SDK connects over `tcp://localhost:4001` by default.
* Use [ib-controller](https://github.com/ib-controller/ib-controller/releases) to automate UI interaction if so desired.

Make sure sure things work by running the terminal interface.  Any issues encountered during startup will be reported and the terminal will exit.

    $ cd ib-env
    $ node run
    
If the SDK can establish a working connection, the terminal will start successfully.  Otherwise see help for more info.

    $ node run --help

#### Run

The `run` method is the programmatic analogy of the command line interface.

```javascript
require('ib-env').run(configObject, "file_1.json", "file_2.json");
```

#### Setup

Use the `setup` method to build an `environment`.  

```javascript
require('ib-env').setup({
    session: { port: 4001 },
    account: true,
    securities: [ "AAPL stock", "EUR in USD", ]
}, (err, environment, interactive) => {
    if (err) console.log(err);
    else {
        let account = environment.workspace.account,
            AAPL = environment.workspace.AAPL;
    
        // OPTIONAL: start repl terminal
        interactive();
    }
});
```

#### Interactive

An `interactive` callback is returned which can optionally start a REPL interface for debugging and interactive development.  Once called, the `environment.workspace` is the `context` for the REPL command-line interface.  That means values added to the `environment.workspace` object can be referenced directly from the command line (i.e. AAPL in the code above).

    > AAPL.contract.summary

#### Workspace

The `environment` contains builder methods that act on the `environment.workspace` object, making it the goto place for consuming data.

```javascript
let symbols = environment.workspace.symbols;
            
// Add values to workspace and symbols
environment.assign("x", { });
environment.free("x");
```
    
## Configuration

A configuration object may be supplied directly to the `setup` global method.  

The terminal interface automatically assembles a configuration using a combination of command line flags and a list of JSON files.

The configuration object may contain the following fields:

* __session__ - _object_ 
    - __host__ - _string_ - hostname or ip address
    - __port__ - _number_ - port number
    - __clientId__ - _number_ - specify client id
    - __timeout__ - _number_ - milliseconds to wait for connection
* __account__
    - _boolean_ - use default account id
    - _string_ - use specific account id
    - _object_
        - __id__ - _string_ - use specific account id
        - __name__ - _string_ - override workspace name
* __accountSummary__
    - _boolean_ - stream all tags and positions
    - _object_
        - __positions__ - _boolean_ - stream positions
        - __group__ - _string_ - group name (defaults to "all")
        - __tags__ - _array_ - list of account tags to stream (defaults to all)
        - __name__ - _string_ - override workspace name
* __positions__
    - _boolean_ - stream all positions
    - _object_
        - __name__ - _string_ - override workspace name
* __trades__
    - _boolean_ - stream all trades today
    - _object_
        - __account__ - _string_ - account filter
        - __client__ - _string_ - client id filter
        - __exchange__ - _string_ - exchange filter
        - __secType__ - _string_ - security type filter
        - __side__ - _string_ - buy/sell side filter
        - __symbol__ - _string_ - security symbol filter
        - __time__ - _string_ - time filter
        - __name__ - _string_ - override workspace name
* __orders__
    - _boolean_ - stream all orders
* __securities__
    - _array_ - a list of security descriptions to load
* __curves__
    - _array_ - a list of curve descriptions to load
* __optionChains__
    - _array_ - a list of option chain descriptions to load
* __fundamentals__
    - _array_ - default list of fundamental reports to load automatically for all stock securities
* __charts__
    - _boolean_ - stream real-time bars on all securities automatically
    - _object_
        - __historicals__ - _array_ - list of bar sizes to load
        - __studies__ - _array_ - list of studies to bind automatically
* __depth__
    - _boolean_ - stream level 2 quotes on all securities automatically
    - _object_
        - __exchanges__ - _array_ - list of exchanges
        - __rows__ - _number_ - number of rows
* __quote__
    - _boolean_ - stream real-time quotes on all securities automatically
    - _array_ - list of quote tick type classes to use
    - _object_
        - __types__ - _array_ - list of quote tick type classes to use
        - __fields__ - _array_ - list of quote tick type fields to use
* __frozen__ - _boolean_ - set quote market data type from live to frozen
* __repl__
    - _boolean_ - open REPL with default cursor
    - _string_ - open REPL with specified cursor
    - _object_ - open REPL with specified config
* __error__ - _function_ - override default error handler
* __disconnected__ - _function_ - override default disconnect handler
* __doNotHandleUncaughtExceptions__ - _boolean_ - override default error handling behavior
* __record__
    - _boolean_ - log using time-based log file name
    - _string_ - file path to event log
* __mock__ - _string_ - file path to event log

## Environment

The `environment` is usually configured by the `setup` method, but it may also be programmed directly.

```javascript
require("ib-env").setup((err, environment, interactive) => {
    
    // Accounting
    environment.account((err, account) => { });
    environment.accountSummary((err, summary) => { });
    environment.positions((err, positions) => { });
    environment.trades((err, trades) => { });
    
    // Securities
    environment.securities([ "AAPL stock" ], (err, securities) => { });
    environment.optionChains([ "AAPL options" ], (err, options) => { });
    environment.curves([ "CL futures on NYMEX" ], (err, curves) => { });
    
    // Interface
    environment.terminal(require("repl").start("> "));
    
});
```

Methods related to accounting objects take an optional `options` first parameter.  The results are automatically stored in the `environment.workspace` using the name of the method (i.e. account, accountSummary, positions, trades) unless an `options.name` override parameter is specified.

```javascript
require("ib-env").setup((err, environment, interactive) => {
    
    environment.account("XYZ123", (err, account) => { });
    
    environment.accountSummary({ 
        positions: true, 
        tags: [ ], 
        group: "all"
    }, (err, summary) => { });
    
    environment.positions({ 
        name: "pos" 
    }, (err, positions) => { });
    
    environment.trades({
        account: "",
        client: 0,
        exchange: "",
        secType: "",
        side: "",
        symbol: "",
        time: "" 
    }, (err, trades) => { });
    
});
```

## License

Copyright 2017 Jonathan Hollinger

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.