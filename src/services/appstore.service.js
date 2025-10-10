import { httpGet } from "../utils/http.js";

const PROXY_BASE_URL = "http://localhost:8888/api";

export const fetchAppStoreDownloads = async (date) => {
  try {
    const targetDate =
      date ||
      (() => {
        const dt = new Date();
        dt.setUTCDate(dt.getUTCDate() - 1);
        const y = dt.getUTCFullYear();
        const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
        const d = String(dt.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      })();

    const url = `${PROXY_BASE_URL}/appstore/downloads?date=${encodeURIComponent(
      targetDate
    )}`;
    const data = await httpGet(url);

    console.log("📥 App Store API Response rrrrrrrrrrrr:", data);

    return {
      error: false,
      downloads: data.breakdown?.newDownloads || data.downloads || 0,
      date: data.date || targetDate,
    };
  } catch (error) {
    console.error("Error fetching App Store downloads:", error);
    const errorMsg = error.message || "Failed to fetch App Store downloads";
    const isNotAvailable = errorMsg.includes("404") || errorMsg.includes("not available");
    const is500Error = errorMsg.includes("500");
    
    let userMessage = "Failed to fetch App Store downloads";
    if (isNotAvailable) {
      userMessage = "Report not available for this date";
    } else if (is500Error) {
      userMessage = "Server error. Please try again later.";
    }
    
    return {
      error: true,
      downloads: 0,
      date: null,
      message: userMessage,
    };
  }
};
