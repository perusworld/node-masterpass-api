'use strict';

const
    bodyParser = require('body-parser'),
    async = require('async'),
    express = require('express');

var masterpassapi = require('../node-masterpass-api').masterpass();

var masterpass = new masterpassapi.Masterpass({
    privateKey: process.env.MP_PRIVATE_KEY,
    consumerKey: process.env.MP_CONSUMER_KEY,
    callBackUrl: process.env.MP_CALLBACK_URL,
    merchantCheckoutId: process.env.MP_CHECKOUT_ID
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
        params: {}
    })
})

app.get('/requestToken', function (req, res) {
    masterpass.requestToken((err, resp) => {
        if (err) {
            res.json(err);
        } else {
            res.json(resp);
        }
    });
})

app.get('/requestTokenCallback', function (req, res) {
    res.render('index', {
        title: 'Continue Checkout',
        masterpass: masterpass,
        params: req.query
    })
})

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});