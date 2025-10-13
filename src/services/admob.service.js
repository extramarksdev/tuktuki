import { httpGet } from "../utils/http.js";

const PROXY_BASE_URL = "http://localhost:8888/api";

export const fetchAdMobReport = async () => {
  try {
    const url = `${PROXY_BASE_URL}/admob/report`;
    const response = await httpGet(url);

    console.log("📊 AdMob API Response:", response);
    console.log("   Daily data rows:", response.dailyData?.length);
    console.log("   Sample dates:", response.dailyData?.slice(0, 3).map(d => d.date));

    return {
      error: false,
      stats: {
        impressions: response.impressions || 0,
        clicks: response.clicks || 0,
        revenue: response.revenue || 0,
        period: response.period || "last 30 days",
        dailyData: response.dailyData || [],
      },
    };
  } catch (error) {
    console.error("Error fetching AdMob report:", error);

    let errorMessage = "Unable to fetch AdMob data. Please check your configuration.";

    if (error.message.includes("404")) {
      errorMessage =
        "AdMob account not accessible. Check ADMOB_PUBLISHER_ID in .env.";
    } else if (error.message.includes("400")) {
      errorMessage = "Missing OAuth credentials. Check .env file for GOOGLE_REFRESH_TOKEN.";
    } else if (error.message.includes("401") || error.message.includes("403")) {
      errorMessage =
        "OAuth permission denied. Get a new GOOGLE_REFRESH_TOKEN from OAuth Playground.";
    } else if (error.message.includes("500")) {
      errorMessage = "AdMob API error. Check server logs for details.";
    }

    return {
      error: true,
      message: errorMessage,
      stats: null,
    };
  }
};
