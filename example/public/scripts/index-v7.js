var checkoutConfig = {
  callBackUrl: "",
  cartIdCallBackUrl: "",
  merchantCheckoutId: "",
  nowDate: ""
};

function beginCheckout(cartId, amount, callBackUrl, merchantCheckoutId) {
  masterpass.checkout({
    "cartId": cartId,
    "amount": "" + Math.round(amount * 100),
    "currency": 'USD',
    "callbackUrl": callBackUrl,
    "checkoutId": merchantCheckoutId,
    "allowedCardTypes": ["master,amex,discover,visa"]
  });
}

$(function () {

  $("#btnInitCart").click(function () {
    var cartId = new Date().getTime();
    $("#cartId").val(cartId);
    checkoutConfig.cartIdCallBackUrl = checkoutConfig.callBackUrl + '?cartId=' + cartId
    return false;
  });

  $("#btnStartCheckout").click(function () {
    beginCheckout($("#cartId").val(), parseInt($("#amount").val()), checkoutConfig.cartIdCallBackUrl, checkoutConfig.merchantCheckoutId);
    return false;
  });

  $("form#getPayment").submit(function (event) {
    var req = $(this).serializeArray();
    $.post("/payment", req, function (data) {
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