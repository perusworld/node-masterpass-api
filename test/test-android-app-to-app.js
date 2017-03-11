var async = require('async');

var masterpassapi = require('../node-masterpass-api').masterpass();

var masterpass = new masterpassapi.Masterpass({
    privateKey: process.env.MP_PRIVATE_KEY,
    consumerKey: process.env.MP_CONSUMER_KEY,
    callBackUrl: process.env.MP_CALLBACK_URL,
    appVersion: process.env.MP_APP_VERSION,
    appId: process.env.MP_APP_ID,
});

async.waterfall([
    function (callback) {
        masterpass.initSession(callback);
    },
    function (ctx, callback) {
        masterpass.sessionKeySign(ctx, callback);
    },
    function (resp, callback) {
        callback( null, resp);
    }
], (err, resp) => {
    if (err) {
        console.log(err);
    } else {
        console.log(resp);
    }
});
