import { httpGet } from "../utils/http.js";

const PROXY_BASE_URL = "http://localhost:8888/api";

export const fetchPlayStoreDownloads = async () => {
  try {
    const url = `${PROXY_BASE_URL}/playstore/downloads`;
    const data = await httpGet(url);

    console.log("📥 Play Store API Response:", data);

    return {
      error: false,
      downloads: data.downloads || 0,
      period: data.period || "last 7 days",
    };
  } catch (error) {
    console.error("Error fetching Play Store downloads:", error);
    const errorMsg = error.message || "Failed to fetch Play Store downloads";
    const is500Error = errorMsg.includes("500");

    return {
      error: true,
      downloads: 0,
      message: is500Error
        ? "Server error. Please try again later."
        : "Failed to fetch Play Store downloads",
    };
  }
};
