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
                production: '',
                stage: 'https://sandbox.api.mastercard.com',
                accessToken: '/oauth/consumer/v1/request_token',
                keySign: '/masterpass/v6/sessionkeysigning'
            }
        });
    if (this.conf.env === 'production') {
        //
    } else {
        this.conf.urlPrefix = this.conf.urls.stage;
    }
    this.conf.requestUrl = this.conf.urlPrefix + this.conf.urls.accessToken;
    this.conf.keySignUrl = this.conf.urlPrefix + this.conf.urls.keySign;

};

Masterpass.prototype.getTimestamp = function () {
    return "" + Math.floor((new Date()).getTime() / 1000);
};

Masterpass.prototype.getNonce = function () {
    var hrtime = process.hrtime();
    return "" + (hrtime[0] * 1e9 + hrtime[1])
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
    if (toEncode == null || toEncode == "") return ""
    else {
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
    ctx.params.oauth_signature = crypto.createSign("RSA-SHA1").update(ctx.header).sign(this.conf.privateKey, 'base64')
    callback(null, ctx);
};

Masterpass.prototype.buildRequestHeader = function (ctx, callback) {
    var params = {
        oauth_consumer_key: this.conf.consumerKey,
        oauth_nonce: this.getNonce(),
        oauth_timestamp: this.getTimestamp(),
        oauth_signature_method: this.conf.signature,
        oauth_version: this.conf.version
    }
    if (ctx.customParams) {
        params = merge(params, ctx.customParams);
    }
    var encodedParams = [
        "oauth_consumer_key=" + this.encodeData(params.oauth_consumer_key),
        "oauth_nonce=" + this.encodeData(params.oauth_nonce), "oauth_signature_method=" + this.encodeData(params.oauth_signature_method),
        "oauth_timestamp=" + this.encodeData(params.oauth_timestamp), "oauth_version=" + this.encodeData(params.oauth_version)
    ];
    if (ctx.customParams && ctx.customParams["oauth_callback"]) {
        encodedParams.unshift("oauth_callback=" + this.encodeData(ctx.customParams.oauth_callback));
    }
    if (ctx.body) {
        var hash = crypto.createHash('sha1');
        hash.update(ctx.body);
        var hashed = hash.digest('base64');
        encodedParams.unshift("oauth_body_hash=" + this.encodeData(hashed));
        params.oauth_body_hash = hashed;
    }
    ctx.params = params;
    ctx.header = ["POST", encodeURIComponent(ctx.url), encodeURIComponent(encodedParams.join('&'))].join("&");
    callback(null, ctx);
};

Masterpass.prototype.send = function (ctx, callback) {
    var ptr = this;
    var req = {
        uri: ctx.url,
        method: 'POST',
        headers: {
            'Authorization': ctx.headerString,
            'Content-Type': 'application/xml;charset=UTF-8'
        }
    };
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

Masterpass.prototype.buildAndSendRequest = function (ctx, callback) {
    var ptr = this;
    async.waterfall([
        function (callback) {
            ptr.buildRequestHeader(ctx, callback);
        },
        function (ctx, callback) {
            ptr.signHeader(ctx, callback);
        },
        function (ctx, callback) {
            ptr.buildHeaderString(ctx, callback);
        },
        function (ctx, callback) {
            ptr.send(ctx, callback);
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
            })
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

module.exports.Masterpass = Masterpass;