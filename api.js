"use strict";

var util = require('util'),
    crypto = require('crypto');
var async = require('async');
var merge = require('merge');

const request = require('request'),
    querystring = require('querystring');


function Masterpass(opts) {
    this.conf = merge({
        version: '1.0',
        signature: 'RSA-SHA1',
        realm: 'eWallet',
        env: 'stage',
        urlPrefix: 'https://sandbox.api.mastercard.com'
    }, opts, {
        urls: {
            production: '',
            stage: 'https://sandbox.api.mastercard.com',
            accessToken: '/oauth/consumer/v1/request_token'
        }
    });
    if (this.conf.env === 'production') {
        //
    } else {
        this.conf.urlPrefix = this.conf.urls.stage;
    }
    this.conf.requestUrl = this.conf.urlPrefix + this.conf.urls.accessToken;

};

Masterpass.prototype.getTimestamp = function () {
    return "" + Math.floor((new Date()).getTime() / 1000);
};

Masterpass.prototype.getNonce = function () {
    var hrtime = process.hrtime();
    return "" + (hrtime[0] * 1e9 + hrtime[1])
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
    var params = ctx.params;
    ctx.header = ["POST", encodeURIComponent(this.conf.requestUrl), encodeURIComponent([
        "oauth_callback=" + this.encodeData(params.oauth_callback), "oauth_consumer_key=" + this.encodeData(params.oauth_consumer_key),
        "oauth_nonce=" + this.encodeData(params.oauth_nonce), "oauth_signature_method=" + this.encodeData(params.oauth_signature_method),
        "oauth_timestamp=" + this.encodeData(params.oauth_timestamp), "oauth_version=" + this.encodeData(params.oauth_version)
    ].join('&'))].join("&");
    callback(null, ctx);
};

Masterpass.prototype.send = function (ctx, callback) {
    request({
        uri: this.conf.requestUrl,
        method: 'POST',
        headers: {
            'Authorization': ctx.headerString,
            'Content-Type': 'application/xml;charset=UTF-8'
        }

    }, function (error, response, body) {
        if (error) {
            callback(error, null);
        } else if (200 == response.statusCode) {
            callback(error, querystring.parse(body));
        } else {
            callback(body, null);
        }
    });
};

Masterpass.prototype.requestToken = function (callback) {
    var ptr = this;
    async.waterfall([
        function (callback) {
            ptr.buildRequestHeader({
                params: {
                    oauth_consumer_key: ptr.conf.consumerKey,
                    oauth_nonce: ptr.getNonce(),
                    oauth_timestamp: ptr.getTimestamp(),
                    oauth_signature_method: ptr.conf.signature,
                    oauth_version: ptr.conf.version,
                    oauth_callback: ptr.conf.callBackUrl,
                    realm: ptr.conf.realm
                }
            }, callback);
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

module.exports.Masterpass = Masterpass;