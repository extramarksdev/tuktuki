import { httpGet } from "../utils/http.js";

const PROXY_BASE_URL = "http://localhost:8888/api";

export const fetchPlayStoreDownloads = async () => {
  try {
    const url = `${PROXY_BASE_URL}/playstore/downloads`;
    const data = await httpGet(url);

    console.log("🤖 Play Store API Response:", data);

    const noDataAvailable = data.message && data.downloads === 0;

    return {
      error: false,
      downloads: data.downloads || 0,
      lastUpdated: data.lastUpdated,
      message: noDataAvailable ? data.message : null,
    };
  } catch (error) {
    console.error("Error fetching Play Store downloads:", error);
    const errorMsg = error.message || "Failed to fetch Play Store downloads";

    let userMessage = "Failed to fetch Play Store downloads";
    if (errorMsg.includes("500")) {
      userMessage = "Server error. Please try again later.";
    } else if (errorMsg.includes("404")) {
      userMessage = "Cloud Storage not configured";
    } else if (errorMsg.includes("403")) {
      userMessage = "Permission denied. Check service account permissions.";
    }

    return {
      error: true,
      downloads: 0,
      message: userMessage,
    };
  }
};
