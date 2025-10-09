export const METRIC_TYPES = {
  DOWNLOADS: 'downloads',
  EPISODE_VIEWS: 'episode_views',
  ADMOB_IMPRESSIONS: 'admob_impressions',
  ADMOB_REVENUE: 'admob_revenue',
  SUBSCRIPTION_REVENUE: 'subscription_revenue',
};

export const METRIC_LABELS = {
  [METRIC_TYPES.DOWNLOADS]: 'Total Number of Downloads (Play Store + App Store)',
  [METRIC_TYPES.EPISODE_VIEWS]: 'Total Number of Views of Episodes',
  [METRIC_TYPES.ADMOB_IMPRESSIONS]: 'Total Number of Impressions on AdMob',
  [METRIC_TYPES.ADMOB_REVENUE]: 'Total Revenue from AdMob',
  [METRIC_TYPES.SUBSCRIPTION_REVENUE]: 'Total Revenue from Subscriptions',
};

export const METRIC_SOURCES = {
  [METRIC_TYPES.DOWNLOADS]: 'AppStore API + Google Play Console API',
  [METRIC_TYPES.EPISODE_VIEWS]: 'Database',
  [METRIC_TYPES.ADMOB_IMPRESSIONS]: 'Google AdMob API',
  [METRIC_TYPES.ADMOB_REVENUE]: 'Google AdMob API',
  [METRIC_TYPES.SUBSCRIPTION_REVENUE]: 'RazorPay API',
};

