const axios = require("axios");

/**
 * Get PayPal Access Token
 */
async function getAccessToken() {
  try {
    const response = await axios({
      url: `${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`,
      method: "post",
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_CLIENT_SECRET,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: "grant_type=client_credentials",
    });

    return response.data.access_token;
  } catch (error) {
    console.error("❌ PayPal auth error:", error.response?.data || error.message);
    throw new Error("Failed to get PayPal access token");
  }
}

/**
 * Create PayPal Order
 */
async function createPaypalOrder(amount) {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.post(
      `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: Number(amount).toFixed(2),
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.id;
  } catch (error) {
    console.error(
      "❌ PayPal create order error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to create PayPal order");
  }
}

/**
 * Capture PayPal Order
 */
async function capturePaypalOrder(orderID) {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.post(
      `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const capture =
      response.data.purchase_units[0].payments.captures[0];

    return {
      captureId: capture.id,
      status: capture.status,
    };
  } catch (error) {
    console.error(
      "❌ PayPal capture error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to capture PayPal payment");
  }
}

module.exports = {
  createPaypalOrder,
  capturePaypalOrder,
};
