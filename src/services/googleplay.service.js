import { API_KEYS, API_ENDPOINTS } from '../constants/api.js';
import { httpGet, createBearerAuthHeader } from '../utils/http.js';

export const fetchGooglePlayDownloads = async () => {
  try {
    const authHeader = createBearerAuthHeader(API_KEYS.GOOGLE_PLAY_API_KEY);

    const url = `${API_ENDPOINTS.GOOGLE_PLAY_BASE}/applications/YOUR_PACKAGE_NAME/statistics`;
    
    const data = await httpGet(url, authHeader);

    return {
      downloads: data.totalDownloads || 0,
    };
  } catch (error) {
    console.error('Error fetching Google Play downloads:', error);
    throw error;
  }
};

