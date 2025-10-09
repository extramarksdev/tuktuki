import { fetchSubscriptionRevenue, fetchPaymentData } from "./razorpay.service.js";
import { METRIC_TYPES } from "../constants/metrics.js";

const MOCK_DATA = {
  downloads: 3182,
  episodeViews: 9739,
  admobImpressions: 3300,
  admobRevenue: 1200,
};

export const fetchAllMetrics = async () => {
  try {
    const [razorpayData, paymentData] = await Promise.all([
      fetchSubscriptionRevenue(),
      fetchPaymentData(),
    ]);

    const totalRevenue = paymentData.stats.revenue || razorpayData.totalRevenue;

    return {
      metrics: {
        [METRIC_TYPES.DOWNLOADS]: {
          value: MOCK_DATA.downloads,
          error: false,
          disabled: true,
        },
        [METRIC_TYPES.EPISODE_VIEWS]: {
          value: MOCK_DATA.episodeViews,
          error: false,
          disabled: true,
        },
        [METRIC_TYPES.ADMOB_IMPRESSIONS]: {
          value: MOCK_DATA.admobImpressions,
          error: false,
          disabled: true,
        },
        [METRIC_TYPES.ADMOB_REVENUE]: {
          value: MOCK_DATA.admobRevenue,
          error: false,
          disabled: true,
        },
        [METRIC_TYPES.SUBSCRIPTION_REVENUE]: {
          value: totalRevenue,
          error: false,
          disabled: false,
        },
      },
      razorpayStats: razorpayData.stats,
      razorpaySubscriptions: razorpayData.subscriptions,
      paymentStats: paymentData.stats,
      payments: paymentData.payments,
    };
  } catch (error) {
    console.error("Error fetching metrics:", error);

    return {
      metrics: {
        [METRIC_TYPES.DOWNLOADS]: {
          value: MOCK_DATA.downloads,
          error: false,
          disabled: true,
        },
        [METRIC_TYPES.EPISODE_VIEWS]: {
          value: MOCK_DATA.episodeViews,
          error: false,
          disabled: true,
        },
        [METRIC_TYPES.ADMOB_IMPRESSIONS]: {
          value: MOCK_DATA.admobImpressions,
          error: false,
          disabled: true,
        },
        [METRIC_TYPES.ADMOB_REVENUE]: {
          value: MOCK_DATA.admobRevenue,
          error: false,
          disabled: true,
        },
        [METRIC_TYPES.SUBSCRIPTION_REVENUE]: {
          value: 0,
          error: true,
          disabled: false,
        },
      },
      razorpayStats: null,
      razorpaySubscriptions: [],
      paymentStats: null,
      payments: [],
    };
  }
};
