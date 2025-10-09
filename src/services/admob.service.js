import { API_KEYS, API_ENDPOINTS } from '../constants/api.js';
import { httpGet, createBearerAuthHeader } from '../utils/http.js';

export const fetchAdMobMetrics = async () => {
  try {
    const authHeader = createBearerAuthHeader(API_KEYS.ADMOB_CLIENT_ID);

    const url = `${API_ENDPOINTS.ADMOB_BASE}/accounts/YOUR_ACCOUNT_ID/networkReport:generate`;
    
    const data = await httpGet(url, authHeader);

    return {
      impressions: data.impressions || 0,
      revenue: data.earnings?.microsAmount ? data.earnings.microsAmount / 1000000 : 0,
    };
  } catch (error) {
    console.error('Error fetching AdMob metrics:', error);
    throw error;
  }
};

