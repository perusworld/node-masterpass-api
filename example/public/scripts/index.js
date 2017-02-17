var checkoutConfig = {
  callBackUrl: "",
  merchantCheckoutId: ""
};

function continueCheckout(resp) {
  console.log(resp);
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
    "suppressShippingAddressEnable": "true",
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

  $("#btnStartCheckout").click(function () {
    beginCheckout($("#requestToken").val(), checkoutConfig.callBackUrl, checkoutConfig.merchantCheckoutId);
    return false;
  });

});