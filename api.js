"use strict";

var util = require('util'),
    crypto = require('crypto');
var async = require('async');
var merge = require('merge');
var xml2js = require('xml2js');
var forge = require('node-forge');
var pki = forge.pki;
var rsa = pki.rsa;

const request = require('request'),
    querystring = require('querystring');


function Masterpass(opts) {
    this.conf = merge({
        version: '1.0',
        signature: 'RSA-SHA1',
        realm: 'eWallet',
        env: 'stage',
        urlPrefix: 'https://sandbox.api.mastercard.com',
        keySize: 2048
    }, opts, {
            urls: {
                production: 'https://api.mastercard.com',
                stage: 'https://sandbox.api.mastercard.com',
                requestToken: '/oauth/consumer/v1/request_token',
                keySign: '/masterpass/v6/sessionkeysigning',
                shoppingCart: '/masterpass/v6/shopping-cart',
                merchantInit: '/masterpass/v6/merchant-initialization',
                accessToken: '/oauth/consumer/v1/access_token',
                checkout: '/masterpass/v6/checkout/%s',
                paymentData: '/masterpass/paymentdata/%s?cartId=%s&checkoutId=%s',
                transaction: '/masterpass/v6/transaction'
            }
        });
    if (this.conf.env === 'production') {
        this.conf.urlPrefix = this.conf.urls.production;
    } else {
        this.conf.urlPrefix = this.conf.urls.stage;
    }
    this.conf.requestUrl = this.conf.urlPrefix + this.conf.urls.requestToken;
    this.conf.keySignUrl = this.conf.urlPrefix + this.conf.urls.keySign;
    this.conf.shoppingCartUrl = this.conf.urlPrefix + this.conf.urls.shoppingCart;
    this.conf.merchantInitUrl = this.conf.urlPrefix + this.conf.urls.merchantInit;
    this.conf.accessTokenUrl = this.conf.urlPrefix + this.conf.urls.accessToken;
    this.conf.checkoutUrl = this.conf.urlPrefix + this.conf.urls.checkout;
    this.conf.paymentDataUrl = this.conf.urlPrefix + this.conf.urls.paymentData;
    this.conf.transactionUrl = this.conf.urlPrefix + this.conf.urls.transaction;
    if (this.conf.httpProxy && "" !== this.conf.httpProxy) {
        console.log('using proxy', this.conf.httpProxy)
    }

}

Masterpass.prototype.getTimestamp = function () {
    return "" + Math.floor((new Date()).getTime() / 1000);
};

Masterpass.prototype.getNonce = function () {
    var hrtime = process.hrtime();
    return "" + (hrtime[0] * 1e9 + hrtime[1]);
};

Masterpass.prototype.toXML = function (header, obj, callback) {
    async.nextTick(function () {
        var options = {
            rootName: header,
            renderOpts: {
                pretty: false
            },
            headless: true
        };
        var builder = new xml2js.Builder(options);
        callback(null, builder.buildObject(obj));
    });
};

Masterpass.prototype.toJSON = function (xml, callback) {
    var options = {
        normalizeTags: true,
        explicitArray: false
    };
    var parser = new xml2js.Parser(options);
    parser.parseString(xml, callback);
};

Masterpass.prototype.encodeData = function (toEncode) {
    if (toEncode === null || toEncode === "") {
        return "";
    } else {
        var result = encodeURIComponent(toEncode);
        return result.replace(/\!/g, "%21")
            .replace(/\'/g, "%27")
            .replace(/\(/g, "%28")
            .replace(/\)/g, "%29")
            .replace(/\*/g, "%2A");
    }
};

Masterpass.prototype.buildHeaderString = function (ctx, callback) {
    var params = [];
    for (var key in ctx.params) {
        if (ctx.params.hasOwnProperty(key)) {
            params.push(key + "=\"" + this.encodeData(ctx.params[key]) + "\"");
        }
    }
    ctx.headerString = "OAuth " + params.join(",");
    callback(null, ctx);
};

Masterpass.prototype.signHeader = function (ctx, callback) {
    ctx.params.oauth_signature = crypto.createSign("RSA-SHA1").update(ctx.header).sign(this.conf.privateKey, 'base64');
    callback(null, ctx);
};

Masterpass.prototype.buildRequestHeader = function (ctx, callback, method) {
    var params = {
        oauth_consumer_key: this.conf.consumerKey,
        oauth_nonce: ctx.nonce ? ctx.nonce : this.getNonce(),
        oauth_timestamp: ctx.timestamp ? ctx.timestamp : this.getTimestamp(),
        oauth_signature_method: this.conf.signature,
        oauth_version: this.conf.version
    };
    if (ctx.customParams) {
        params = merge(params, ctx.customParams);
    }
    var encodedParams = [
        "oauth_consumer_key=" + this.encodeData(params.oauth_consumer_key),
        "oauth_nonce=" + this.encodeData(params.oauth_nonce), "oauth_signature_method=" + this.encodeData(params.oauth_signature_method),
        "oauth_timestamp=" + this.encodeData(params.oauth_timestamp), "oauth_version=" + this.encodeData(params.oauth_version)
    ];
    if (ctx.customParams) {
        for (var key in ctx.customParams) {
            if (ctx.customParams.hasOwnProperty(key) && key != 'realm') {
                encodedParams.push(key + '=' + this.encodeData(ctx.customParams[key]))
            }
        }
    }
    encodedParams = encodedParams.sort();
    if (ctx.body) {
        var hash = crypto.createHash('sha1');
        hash.update(ctx.body);
        var hashed = hash.digest('base64');
        encodedParams.unshift("oauth_body_hash=" + this.encodeData(hashed));
        params.oauth_body_hash = hashed;
    }
    ctx.params = params;
    ctx.header = [method ? method : "POST", encodeURIComponent(ctx.url).replace("%3F","&")].join("&");
    ctx.header = ctx.header + '%26' + encodeURIComponent(encodedParams.join('&'));
    callback(null, ctx);
};

Masterpass.prototype.send = function (ctx, callback, method) {
    var ptr = this;
    var req = {
        uri: ctx.url,
        method: method ? method : 'POST',
        headers: {
            'Authorization': ctx.headerString,
            'Content-Type': 'application/json;charset=UTF-8'
        }
    };
    if (this.conf.httpProxy && "" !== this.conf.httpProxy) {
        req.proxy = this.conf.httpProxy;
    }
    if (this.conf.hasOwnProperty('rejectUnauthorized')) {
        console.log('rejectUnauthorized');
        req.rejectUnauthorized  = this.conf.rejectUnauthorized ;
    }
    if (ctx.body) {
        req.body = ctx.body;
    }
    request(req, function (error, response, body) {
        if (error) {
            callback(error, null);
        } else if (200 == response.statusCode) {
            if (!ctx.sendOpts || ctx.sendOpts.queryString) {
                callback(error, querystring.parse(body));
            } else if (ctx.sendOpts && ctx.sendOpts.xmlToJson) {
                ptr.toJSON(body, callback);
            } else {
                callback(error, body);
            }
        } else {
            callback(body, null);
        }
    });
};

Masterpass.prototype.buildAndSendRequest = function (ctx, callback, method) {
    var ptr = this;
    async.waterfall([
        function (callback) {
            ptr.buildRequestHeader(ctx, callback, method);
        },
        function (ctx, callback) {
            ptr.signHeader(ctx, callback);
        },
        function (ctx, callback) {
            ptr.buildHeaderString(ctx, callback);
        },
        function (ctx, callback) {
            ptr.send(ctx, callback, method);
        }
    ], callback);
};

Masterpass.prototype.initSession = function (callback) {
    rsa.generateKeyPair({ bits: this.conf.keySize }, function (err, keypair) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, {
                sessionKeys: {
                    privateKey: pki.privateKeyToPem(keypair.privateKey),
                    publicKey: pki.publicKeyToPem(keypair.publicKey)
                }
            });
        }
    });
};

Masterpass.prototype.requestToken = function (callback) {
    this.buildAndSendRequest({
        url: this.conf.requestUrl,
        customParams: {
            oauth_callback: this.conf.callBackUrl,
            realm: this.conf.realm
        }
    }, callback);
};

Masterpass.prototype.sessionKeySign = function (req, callback) {
    var ptr = this;
    async.waterfall([
        function (callback) {
            ptr.toXML('SessionKeySigningRequest', {
                AppId: ptr.conf.appId,
                AppVersion: ptr.conf.appVersion,
                AppSigningPublicKey: req.sessionKeys.publicKey
            }, callback);
        },
        function (xmlStr, callback) {
            ptr.buildAndSendRequest({
                url: ptr.conf.keySignUrl,
                body: xmlStr,
                sendOpts: {
                    xmlToJson: true
                }
            }, callback);
        }
    ], callback);
};

Masterpass.prototype.buildShoppingCartRequest = function (req, callback) {
    var ret = {
        OAuthToken: [req.token],
        ShoppingCart:
        [{
            CurrencyCode: [req.currencyCode],
            Subtotal: [req.subTotal],
            ShoppingCartItem: []
        }]
    };
    req.items.forEach((entry) => {
        ret.ShoppingCart[0].ShoppingCartItem.push({
            Description: [entry.desc],
            Quantity: [entry.qty],
            Value: [entry.value]
        })
    });
    async.nextTick(() => {
        callback(null, ret);
    });
};

Masterpass.prototype.createShoppingCart = function (req, callback) {
    var ptr = this;
    async.waterfall([
        function (callback) {
            ptr.buildShoppingCartRequest(req, callback);
        },
        function (newReq, callback) {
            ptr.toXML('ShoppingCartRequest', newReq, callback);
        },
        function (xmlStr, callback) {
            ptr.buildAndSendRequest({
                url: ptr.conf.shoppingCartUrl,
                body: xmlStr,
                sendOpts: {
                    xmlToJson: true
                }
            }, callback);
        }
    ], callback);
};

Masterpass.prototype.merchantInit = function (req, callback) {
    var ptr = this;
    async.waterfall([
        function (callback) {
            ptr.toXML('MerchantInitializationRequest', {
                OAuthToken: [req.token],
                OriginUrl: [ptr.conf.originUrl]
            }, callback);
        },
        function (xmlStr, callback) {
            ptr.buildAndSendRequest({
                url: ptr.conf.merchantInitUrl,
                body: xmlStr,
                sendOpts: {
                    xmlToJson: true
                }
            }, callback);
        }
    ], callback);
};

Masterpass.prototype.accessToken = function (req, callback) {
    this.buildAndSendRequest({
        url: this.conf.accessTokenUrl,
        customParams: {
            oauth_callback: this.conf.callBackUrl,
            oauth_verifier: req.verifier,
            oauth_token: req.token,
            realm: this.conf.realm
        }
    }, callback);
};

Masterpass.prototype.checkout = function (req, callback) {
    this.buildAndSendRequest({
        url: util.format(this.conf.checkoutUrl, req.checkoutId),
        customParams: {
            oauth_token: req.token,
        },
        sendOpts: {
            xmlToJson: true
        }
    }, callback, 'GET');
};

Masterpass.prototype.paymentData = function (req, callback) {
    this.buildAndSendRequest({
        url: util.format(this.conf.paymentDataUrl, req.oauthVerifier, req.cartId, this.conf.merchantCheckoutId),
        customParams: {
            realm: this.conf.realm
        },
    }, callback, 'GET');
};

Masterpass.prototype.transactionPostback = function (req, callback) {
    var ptr = this;
    var mtrans = {
        MerchantTransactions:
        [{
            TransactionId: [req.transactionId],
            ConsumerKey: [ptr.conf.consumerKey],
            Currency: [req.currency],
            OrderAmount: [req.amount],
            PurchaseDate: [req.date],
            TransactionStatus: [req.status],
            ApprovalCode: [req.approvalCode],
            ExpressCheckoutIndicator: [req.expressCheckoutIndicator]
        }]
    };
    async.waterfall([
        function (callback) {
            ptr.toXML('MerchantTransactions', mtrans, callback);
        },
        function (xmlStr, callback) {
            ptr.buildAndSendRequest({
                url: ptr.conf.transactionUrl,
                body: xmlStr,
                sendOpts: {
                    xmlToJson: true
                }
            }, callback);
        }
    ], callback);
};


module.exports.Masterpass = Masterpass;