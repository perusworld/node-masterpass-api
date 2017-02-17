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

```

## Example App ##

![Example App](https://raw.githubusercontent.com/perusworld/node-masterpass-api/master/example/public/images/screenshot.png "Example App")

There is a sample app in the example folder that shows the available operations, set the following env variables before running the app.

```powershell
    $env:MP_PRIVATE_KEY = [IO.File]::ReadAllText("---your private key---")
    $env:MP_CONSUMER_KEY = "---your consumer key---"
    $env:MP_CALLBACK_URL = "http://localhost:3000/requestTokenCallback"
    $env:MP_CHECKOUT_ID = "---your checkout id---"
```

Run the app

```powershell
    node server.js
```
