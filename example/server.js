'use strict';

const
    bodyParser = require('body-parser'),
    async = require('async'),
    express = require('express');
var moment = require('moment');

var masterpassapi = require('../node-masterpass-api').masterpass();

var masterpass = new masterpassapi.Masterpass({
    privateKey: process.env.MP_PRIVATE_KEY,
    consumerKey: process.env.MP_CONSUMER_KEY,
    callBackUrl: process.env.MP_CALLBACK_URL,
    merchantCheckoutId: process.env.MP_CHECKOUT_ID,
    originUrl: process.env.MP_ORIGIN_URL,
    env: process.env.MP_ENV
});

var app = express();
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'pug');
app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('public'));

app.get('/', function (req, res) {
    res.render('index', {
        title: 'Hello',
        masterpass: masterpass,
        params: {
            nowDate: moment().toISOString()
        },
    });
});

app.get('/requestToken', function (req, res) {
    masterpass.requestToken((err, resp) => {
        if (err) {
            res.json(err);
        } else {
            res.json(resp);
        }
    });
});

app.post('/setupShoppingCart', function (req, res) {
    var amt = Math.round(Number.parseFloat(req.body.itemPrice) * 100);
    var cart = {
        token: req.body.requestToken,
        subTotal: amt,
        currencyCode: 'USD',
        items: [
            { desc: req.body.itemDesc, qty: Number.parseInt(req.body.itemQty), value: amt }
        ]
    };
    masterpass.createShoppingCart(cart, (err, resp) => {
        if (err) {
            res.json(err);
        } else {
            res.json(resp);
        }
    });
});

app.post('/merchantInit', function (req, res) {
    masterpass.merchantInit({
        token: req.body.requestToken,
    }, (err, resp) => {
        if (err) {
            res.json(err);
        } else {
            res.json(resp);
        }
    });
});

app.post('/accessToken', function (req, res) {
    masterpass.accessToken({
        token: req.body.oauthToken,
        verifier: req.body.oauthVerifier,
    }, (err, resp) => {
        if (err) {
            res.json(err);
        } else {
            res.json(resp);
        }
    });
});

app.post('/checkout', function (req, res) {
    masterpass.checkout({
        token: req.body.accessToken,
        checkoutId: req.body.checkoutId,
    }, (err, resp) => {
        if (err) {
            res.json(err);
        } else {
            res.json(resp);
        }
    });
});

app.post('/transactionPostback', function (req, res) {
    masterpass.transactionPostback(req.body, (err, resp) => {
        if (err) {
            res.json(err);
        } else {
            res.json(resp);
        }
    });
});

app.get('/requestTokenCallback', function (req, res) {
    console.log('requestTokenCallback', req.query);
    res.render('index', {
        title: 'Continue Checkout',
        masterpass: masterpass,
        params: req.query
    });
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});