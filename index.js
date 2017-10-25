let fs = require('fs'),
    Sugar = require('sugar');

exports.MockIB = require("./mock");

exports.replay = require("./replay");

exports.Environment = require("./environment");

const setup = exports.setup = require("./setup");

const run = exports.run = (config, files) => {
    if (files && files.length) {
        Sugar.Object.mergeAll(config, files.map(file => JSON.parse(fs.readFileSync(file).toString())));
    }

    setup(config);
};