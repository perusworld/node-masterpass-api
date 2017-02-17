const fs = require('fs');

var masterpassapi = require('./node-masterpass-api').masterpass();
var private = fs.readFileSync("privateKey", "utf8");

var masterpass = new masterpassapi.Masterpass({
    privateKey: private,
    consumerKey: '------your consumer key ---',
    callBackUrl: 'https://www.blah.com/blah'
});

masterpass.requestToken((err, resp) => {
    if (err) {
        console.log(err);
    } else {
        console.log(resp);
    }
});