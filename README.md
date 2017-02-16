# Simple Node.js library to interact with the masterpass apis #


Based on [Test Merchant Server](https://github.com/Mastercard/masterpass-android-sample-app/tree/master/Test-Merchant-Server)

## Install ##
```bash
npm install github:perusworld/node-masterpass-api --save
```
## Usage ##

### Request Token Service - [Request Token Service](https://developer.mastercard.com/documentation/masterpass-merchant-integration#api_request_token_service) ##
```javascript
const fs = require('fs');

var masterpassapi = require('node-masterpass-api').masterpass();
var private = fs.readFileSync("privateKey", "utf8");

var masterpassOAuth = new masterpassapi.Masterpass({
    privateKey: private,
    consumerKey: '------your consumer key ---',
    callBackUrl: 'https://www.blah.com/blah'
});

masterpassOAuth.requestToken((err, resp) => {
    if (err) {
        console.log(err);
    } else {
        console.log(resp);
    }
});

```