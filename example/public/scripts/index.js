var checkoutConfig = {
  callBackUrl: "",
  merchantCheckoutId: "",
  nowDate: ""
};

function continueCheckout(resp) {
  $("#mpstatus").val(resp.mpstatus);
  $("#checkoutResourceUrl").val(resp.checkout_resource_url);
  if (resp.checkout_resource_url) {
    $("#checkoutId").val(resp.checkout_resource_url.substring(resp.checkout_resource_url.lastIndexOf('/') + 1));
  }
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
      $("#accessToken").val(data.oauth_token);
    });
    event.preventDefault();
  });

  $("form#getCheckout").submit(function (event) {
    var req = $(this).serializeArray();
    $.post("/checkout", req, function (data) {
      $("#cartData").val(JSON.stringify(data, null, 2));
      if (data && data.checkout) {
        $("#transactionId").val(data.checkout.transactionid);
      }
    });
    event.preventDefault();
  });

  $("form#transactionPostback").submit(function (event) {
    var req = $(this).serializeArray();
    $.post("/transactionPostback", req, function (data) {
      console.log(data);
    });
    event.preventDefault();
  });


});