# Simple Node.js library to interact with the masterpass apis #

[![bitHound Overall Score](https://www.bithound.io/github/perusworld/node-masterpass-api/badges/score.svg)](https://www.bithound.io/github/perusworld/node-masterpass-api)
[![bitHound Dependencies](https://www.bithound.io/github/perusworld/node-masterpass-api/badges/dependencies.svg)](https://www.bithound.io/github/perusworld/node-masterpass-api/master/dependencies/npm)
[![bitHound Code](https://www.bithound.io/github/perusworld/node-masterpass-api/badges/code.svg)](https://www.bithound.io/github/perusworld/node-masterpass-api)

Based on [Test Merchant Server](https://github.com/Mastercard/masterpass-android-sample-app/tree/master/Test-Merchant-Server)

## Install ##
```bash
npm install github:perusworld/node-masterpass-api --save
```
## Usage ##


### [Standard Checkout Initiation Steps](https://developer.mastercard.com/documentation/masterpass-merchant-integration#standard-checkout) ##
```javascript
var async = require('async');
var masterpassapi = require('node-masterpass-api').masterpass();

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
```

### [Standard Checkout Processing Steps](https://developer.mastercard.com/documentation/masterpass-merchant-integration#standard-checkout) ##
```javascript
var async = require('async');
var masterpassapi = require('node-masterpass-api').masterpass();

var masterpass = new masterpassapi.Masterpass({
    privateKey: process.env.MP_PRIVATE_KEY,
    consumerKey: process.env.MP_CONSUMER_KEY,
    callBackUrl: process.env.MP_CALLBACK_URL,
    originUrl: process.env.MP_ORIGIN_URL
});

var ctx = {};
var req = {
    oauth_token: '----oauth token from lightbox response----',
    oauth_verifier: '----oauth verifier from lightbox response----',
    checkout_resource_url: '---- checkout resource url from lightbox response----'
};
async.waterfall([
    function (callback) {
        masterpass.accessToken({
            token: req.oauth_token,
            verifier: req.oauth_verifier,
        }, callback);
    },
    function (resp, callback) {
        masterpass.checkout({
            token: resp.oauth_token,
            checkoutId: req.checkout_resource_url.substring(req.checkout_resource_url.lastIndexOf('/') + 1),
        }, callback);
    }
], (err, resp) => {
    if (err) {
        console.log(err);
    } else {
        console.log('card info', resp);
    }
});
```

### [Request Token Service](https://developer.mastercard.com/documentation/masterpass-merchant-integration#api_request_token_service) ##
```javascript
var masterpassapi = require('node-masterpass-api').masterpass();

var masterpass = new masterpassapi.Masterpass({
    privateKey: process.env.MP_PRIVATE_KEY,
    consumerKey: process.env.MP_CONSUMER_KEY,
    callBackUrl: process.env.MP_CALLBACK_URL
});

masterpass.requestToken((err, resp) => {
    if (err) {
        console.log(err);
    } else {
        console.log(resp);
    }
});

```

### [Request Session Key Signing](https://developer.mastercard.com/documentation/masterpass-merchant-integration#api_session_key_signing) ##
```javascript
var masterpassapi = require('node-masterpass-api').masterpass();
var async = require('async');

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
    }
], (err, resp) => {
    if (err) {
        console.log(err);
    } else {
        console.log(resp);
    }
});

```

## Example App ##
### node-masterpass-api - Masterpass Standard Checkout Lightbox Demo Video ###
[![node-masterpass-api - Masterpass Standard Checkout Lightbox Demo Video](https://img.youtube.com/vi/Ayyq_hYlTEg/3.jpg)](https://youtu.be/Ayyq_hYlTEg)

### Example App ###
![Example App](https://raw.githubusercontent.com/perusworld/node-masterpass-api/master/example/public/images/screenshot.png "Example App")

There is a sample app in the example folder that shows the available operations, set the following env variables before running the app.

```powershell
    $env:MP_PRIVATE_KEY = [IO.File]::ReadAllText("---your private key---")
    $env:MP_CONSUMER_KEY = "---your consumer key---"
    $env:MP_CALLBACK_URL = "http://localhost:3000/requestTokenCallback"
```

Run the app

```powershell
    node server.js
```
