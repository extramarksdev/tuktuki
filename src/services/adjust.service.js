import { httpGet } from "../utils/http.js";

const PROXY_BASE_URL = "http://localhost:8888/api";

export const fetchAdjustDownloads = async (date) => {
  try {
    let targetDate;
    if (date && typeof date === 'string') {
      targetDate = date;
    } else {
      const dt = new Date();
      dt.setDate(dt.getDate() - 1);
      targetDate = dt.toISOString().split('T')[0];
    }

    const url = `${PROXY_BASE_URL}/adjust/report?date=${encodeURIComponent(targetDate)}`;
    const data = await httpGet(url);

    console.log("🤖 Adjust API Response:", data);

    return {
      error: false,
      androidDownloads: data.android?.installs || 0,
      iosDownloads: data.ios?.installs || 0,
      androidSessions: data.android?.sessions || 0,
      iosSessions: data.ios?.sessions || 0,
      androidDAUs: data.android?.daus || 0,
      iosDAUs: data.ios?.daus || 0,
      totalDownloads: data.totals?.installs || 0,
      date: data.date || targetDate,
      rawData: data,
    };
  } catch (error) {
    console.error("Error fetching Adjust downloads:", error);
    const errorMsg = error.message || "Failed to fetch Adjust downloads";
    const is500Error = errorMsg.includes("500");

    return {
      error: true,
      downloads: 0,
      date: null,
      message: is500Error ? "Server error. Please try again later." : "Failed to fetch Adjust downloads",
    };
  }
};

