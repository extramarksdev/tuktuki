import {
  fetchSubscriptionRevenue,
  fetchPaymentData,
} from "./razorpay.service.js";
import { fetchAppStoreDownloads } from "./appstore.service.js";
import { fetchPlayStoreDownloads } from "./playstore.service.js";
import { fetchAdMobReport } from "./admob.service.js";
import { METRIC_TYPES } from "../constants/metrics.js";

const MOCK_DATA = {
  downloads: 3182,
  episodeViews: 9739,
  admobImpressions: 3300,
  admobRevenue: 1200,
};

export const fetchAllMetrics = async (date = null) => {
  try {
    const [razorpayData, paymentData, appstoreData, playstoreData, admobData] =
      await Promise.all([
        fetchSubscriptionRevenue(),
        fetchPaymentData(),
        fetchAppStoreDownloads(date),
        fetchPlayStoreDownloads(),
        fetchAdMobReport(),
      ]);

    const totalRevenue = paymentData.stats.revenue || razorpayData.totalRevenue;

    return {
      metrics: {
        [METRIC_TYPES.DOWNLOADS]: {
          value: appstoreData.downloads,
          error: appstoreData.error,
          disabled: false,
          message: appstoreData.message,
        },
        [METRIC_TYPES.EPISODE_VIEWS]: {
          value: MOCK_DATA.episodeViews,
          error: false,
          disabled: true,
        },
        [METRIC_TYPES.ADMOB_IMPRESSIONS]: {
          value: admobData.stats?.impressions || 0,
          error: admobData.error,
          disabled: false,
        },
        [METRIC_TYPES.ADMOB_REVENUE]: {
          value: admobData.stats?.revenue || 0,
          error: admobData.error,
          disabled: false,
        },
        [METRIC_TYPES.SUBSCRIPTION_REVENUE]: {
          value: totalRevenue,
          error: false,
          disabled: false,
        },
      },
      appstoreDate: appstoreData.date,
      playstoreDownloads: playstoreData.downloads,
      playstoreError: playstoreData.error,
      playstoreMessage: playstoreData.message,
      playstoreLastUpdated: playstoreData.lastUpdated,
      admobStats: admobData.stats,
      admobError: admobData.error,
      admobMessage: admobData.message,
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
          value: 0,
          error: true,
          disabled: false,
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
