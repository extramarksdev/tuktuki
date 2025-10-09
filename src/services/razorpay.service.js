import { httpGet } from "../utils/http.js";
import { formatSubscriptionStats } from "../utils/razorpay.js";
import { formatPaymentStats } from "../utils/payments.js";

const PROXY_BASE_URL = "http://localhost:8888/api";

export const fetchSubscriptionRevenue = async () => {
  try {
    const subscriptionsUrl = `${PROXY_BASE_URL}/razorpay/subscriptions`;

    const data = await httpGet(subscriptionsUrl);

    const stats = formatSubscriptionStats(data.items);

    return {
      totalRevenue: stats.revenue,
      subscriptions: data.items,
      count: data.count,
      stats,
    };
  } catch (error) {
    console.error("Error fetching Razorpay subscription revenue:", error);
    throw error;
  }
};

export const fetchPaymentData = async () => {
  try {
    const paymentsUrl = `${PROXY_BASE_URL}/razorpay/payments`;

    const data = await httpGet(paymentsUrl);

    const stats = formatPaymentStats(data.items);

    return {
      payments: data.items,
      count: data.count,
      stats,
    };
  } catch (error) {
    console.error("Error fetching Razorpay payments:", error);
    throw error;
  }
};

export const fetchSubscriptionById = async (subscriptionId) => {
  try {
    const url = `${PROXY_BASE_URL}/razorpay/subscriptions/${subscriptionId}`;

    return await httpGet(url);
  } catch (error) {
    console.error("Error fetching subscription by ID:", error);
    throw error;
  }
};
