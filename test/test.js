const fs = require('fs');
var async = require('async');

var masterpassapi = require('../node-masterpass-api').masterpass();

var masterpass = new masterpassapi.Masterpass({
    privateKey: process.env.MP_PRIVATE_KEY,
    consumerKey: process.env.MP_CONSUMER_KEY,
    callBackUrl: process.env.MP_CALLBACK_URL,
    originUrl: process.env.MP_ORIGIN_URL
});

var ctx = {};
async.waterfall([
    function (callback) {
        masterpass.requestToken(callback);
    },
    function (tokenReq, callback) {
        ctx.tokenReq = tokenReq;
        masterpass.createShoppingCart({
            token: tokenReq.oauth_token,
            subTotal: 74996,
            currencyCode: 'USD',
            items: [
                { desc: 'One', qty: 1, value: 29999 },
                { desc: 'Two', qty: 5, value: 4999 }
            ]
        }, callback);
    },
    function (resp, callback) {
        masterpass.merchantInit({
            token: ctx.tokenReq.oauth_token
        }, callback);
    }
], (err, resp) => {
    if (err) {
        console.log(err);
    } else {
        console.log(resp);
    }
});
