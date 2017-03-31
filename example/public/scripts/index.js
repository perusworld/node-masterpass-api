var checkoutConfig = {
  callBackUrl: "",
  merchantCheckoutId: ""
};

function continueCheckout(resp) {
      $("#mpstatus").val(resp.mpstatus);
      $("#checkoutResourceUrl").val(resp.checkout_resource_url);
      $("#oauthVerifier").val(resp.oauth_verifier);
      $("#oauthToken").val(resp.oauth_token);
}

function beginCheckout(token, callBackUrl, merchantCheckoutId) {
  MasterPass.client.checkout({
    "requestToken": token,
    "callbackUrl": callBackUrl,
    "failureCallback": continueCheckout,
    "cancelCallback": continueCheckout,
    "successCallback": continueCheckout,
    "merchantCheckoutId": merchantCheckoutId,
    "allowedCardTypes": ["master,amex,discover,visa"],
    "suppressShippingAddressEnable": "false",
    "version": "v6"
  });
}

$(function () {

  $("#btnReqToken").click(function () {
    $.get("/requestToken", function (data) {
      $("#requestToken").val(data.oauth_token);
    });
    return false;
  });

  $("form#setupShoppingCart").submit(function (event) {
    var req = $(this).serializeArray();
    $.post("/setupShoppingCart", req, function (data) {
      $("#cartRequestToken").val(data.shoppingcartresponse.oauthtoken);
    });
    event.preventDefault();
  });

  $("form#initMerchant").submit(function (event) {
    var req = $(this).serializeArray();
    $.post("/merchantInit", req, function (data) {
      $("#initRequestToken").val(data.merchantinitializationresponse.oauthtoken);
    });
    event.preventDefault();
  });

  $("#btnStartCheckout").click(function () {
    beginCheckout($("#initRequestToken").val(), checkoutConfig.callBackUrl, checkoutConfig.merchantCheckoutId);
    return false;
  });

  $("form#accessTokenService").submit(function (event) {
    var req = $(this).serializeArray();
    $.post("/accessToken", req, function (data) {
      console.log(data);
    });
    event.preventDefault();
  });

});