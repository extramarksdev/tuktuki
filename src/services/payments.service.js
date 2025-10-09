import { httpGet } from "../utils/http.js";

const PROXY_BASE_URL = "http://localhost:8888/api";

export const fetchPayments = async () => {
  try {
    const paymentsUrl = `${PROXY_BASE_URL}/razorpay/payments`;

    const data = await httpGet(paymentsUrl);

    return {
      payments: data.items,
      count: data.count,
    };
  } catch (error) {
    console.error("Error fetching Razorpay payments:", error);
    throw error;
  }
};

