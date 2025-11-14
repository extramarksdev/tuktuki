import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getUsdToInrRate } from "./utils/currency.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const API_BASE = process.env.API_BASE_URL || "http://localhost:8888/api";

const ENV_ENDPOINTS = {
  dev: "https://tuktukiapp-dev-219733694412.asia-south1.run.app/api/addPerformanceReport",
  qa: "https://tuktuki-mobile-app-qa-886129854521.asia-south1.run.app/api/addPerformanceReport",
  live: "https://tuktukiapp-236950728917.asia-south1.run.app/api/addPerformanceReport",
};

const getTargetEndpoint = () => {
  const mode = process.env.ENV_MODE || "dev";
  const endpoint = ENV_ENDPOINTS[mode];

  if (!endpoint) {
    throw new Error(`Invalid ENV_MODE: ${mode}. Must be one of: dev, qa, live`);
  }

  console.log(`📍 Target environment: ${mode.toUpperCase()}`);
  console.log(`📍 API endpoint: ${endpoint}`);

  return endpoint;
};

const fetchData = async (url) => {
  try {
    console.log(`🔄 Fetching: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ Error fetching ${url}:`);
      console.error(`   Status: ${response.status}`);
      console.error(`   Message:`, errorData.message || "Unknown error");
      console.error(`   Details:`, errorData.errorDetails || "No details");
      throw new Error(`HTTP ${response.status}`);
    }

    console.log(`✅ Successfully fetched: ${url}`);
    return await response.json();
  } catch (error) {
    console.error(`❌ Error fetching ${url}:`, error.message);
    return null;
  }
};

const getReportDate = async () => {
  console.log("\n" + "=".repeat(60));
  console.log("🕐 GETTING IST DATE");
  console.log("=".repeat(60));

  const offset = parseInt(process.env.REPORT_DATE_OFFSET || "1", 10);

  try {
    console.log("📡 Trying timeapi.io/api (timeout: 5 seconds)...");

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Request timeout after 5 seconds")),
        5000
      );
    });

    const response = await Promise.race([
      fetch("https://timeapi.io/api/TimeZone/zone?timeZone=Asia/Kolkata"),
      timeoutPromise,
    ]);

    if (!response.ok) {
      throw new Error(`timeapi.io returned status ${response.status}`);
    }

    const data = await response.json();

    console.log("✅ timeapi.io Response:");
    console.log(`   Current Time: ${data.currentLocalTime}`);
    console.log(`   TimeZone: ${data.timeZone}`);

    const currentIST = new Date(data.currentLocalTime);

    console.log(
      `   Current IST Date: ${currentIST.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
      })}`
    );
    console.log(
      `   Current IST Time: ${currentIST.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
      })}`
    );

    const targetDate = new Date(currentIST);
    targetDate.setDate(targetDate.getDate() - offset);

    const reportDate = `${targetDate.getFullYear()}-${String(
      targetDate.getMonth() + 1
    ).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;

    console.log(
      `   Target Date (today - ${offset}): ${targetDate.toLocaleDateString(
        "en-IN",
        {
          timeZone: "Asia/Kolkata",
        }
      )}`
    );
    console.log("\n🎯 FINAL REPORT DATE: " + reportDate);
    console.log("=".repeat(60) + "\n");

    return reportDate;
  } catch (error) {
    console.warn("⚠️  timeapi.io failed:", error.message);
    console.log("↩️  Falling back to Node.js IST calculation...");

    const nowInIndia = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const currentIST = new Date(nowInIndia);

    console.log("✅ Node.js IST Calculation:");
    console.log(
      `   Current IST Date/Time: ${currentIST.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })}`
    );

    const targetDate = new Date(currentIST);
    targetDate.setDate(targetDate.getDate() - offset);

    const reportDate = `${targetDate.getFullYear()}-${String(
      targetDate.getMonth() + 1
    ).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;

    console.log(
      `   Target Date (today - ${offset}): ${targetDate.toLocaleDateString(
        "en-IN",
        {
          timeZone: "Asia/Kolkata",
        }
      )}`
    );
    console.log("\n🎯 FINAL REPORT DATE (Fallback): " + reportDate);
    console.log("=".repeat(60) + "\n");

    return reportDate;
  }
};

async function generateReportData() {
  const reportDate = await getReportDate();

  console.log("\n" + "=".repeat(60));
  console.log("📡 FETCHING DATA FROM APIs");
  console.log("=".repeat(60));
  console.log(`Using Report Date: ${reportDate} for all API calls\n`);

  const [adjustData, admobData, razorpayPayments] = await Promise.all([
    fetchData(`${API_BASE}/adjust/report?date=${reportDate}`),
    fetchData(`${API_BASE}/admob/report?date=${reportDate}`),
    fetchData(`${API_BASE}/razorpay/payments?date=${reportDate}`),
  ]);

  const androidDownloads = adjustData?.android?.installs || 0;
  const iosDownloads = adjustData?.ios?.installs || 0;
  const androidViews = adjustData?.android?.views || 0;
  const iosViews = adjustData?.ios?.views || 0;

  console.log(`\n📊 Adjust Data:`);
  console.log(`   Android Downloads: ${androidDownloads}`);
  console.log(`   iOS Downloads: ${iosDownloads}`);
  console.log(`   Android Views: ${androidViews}`);
  console.log(`   iOS Views: ${iosViews}`);

  const dailyAdmob = admobData?.dailyData || [];
  const dayAdmob = dailyAdmob.filter((d) => d.date === reportDate);
  const iosAdmob = dayAdmob.find(
    (d) => d.platform === "iOS" || d.platform === "PLATFORM_IOS"
  );
  const androidAdmob = dayAdmob.find(
    (d) => d.platform === "Android" || d.platform === "PLATFORM_ANDROID"
  );

  const androidImpressions = androidAdmob?.impressions || 0;
  const iosImpressions = iosAdmob?.impressions || 0;
  const androidAdRevenueUsd = androidAdmob?.revenue || 0;
  const iosAdRevenueUsd = iosAdmob?.revenue || 0;

  const usdToInr = await getUsdToInrRate();
  const androidAdRevenue = Math.round(androidAdRevenueUsd * usdToInr);
  const iosAdRevenue = Math.round(iosAdRevenueUsd * usdToInr);

  console.log(`\n📊 AdMob Data:`);
  console.log(`   Android Impressions: ${androidImpressions.toLocaleString()}`);
  console.log(`   iOS Impressions: ${iosImpressions.toLocaleString()}`);
  console.log(
    `   Android Revenue: $${androidAdRevenueUsd.toFixed(
      2
    )} × ${usdToInr} = ₹${androidAdRevenue}`
  );
  console.log(
    `   iOS Revenue: $${iosAdRevenueUsd.toFixed(
      2
    )} × ${usdToInr} = ₹${iosAdRevenue}`
  );
  console.log(
    `   Total AdMob Revenue: ₹${(
      androidAdRevenue + iosAdRevenue
    ).toLocaleString()}`
  );

  const reportLocalDate = new Date(reportDate + "T00:00:00").toLocaleDateString(
    "en-IN"
  );

  const dayPayments =
    razorpayPayments?.items?.filter((payment) => {
      const createdLocalDate = new Date(
        payment.created_at * 1000
      ).toLocaleDateString("en-IN");
      return (
        createdLocalDate === reportLocalDate &&
        (payment.status === "captured" || payment.status === "authorized")
      );
    }) || [];

  const razorpayRevenue =
    dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

  console.log(`\n📊 Razorpay Data:`);
  console.log(`   Captured Payments: ${dayPayments.length}`);
  console.log(
    `   Total Revenue: ₹${Math.round(razorpayRevenue).toLocaleString()}`
  );

  const dateTimestamp = new Date(`${reportDate}T00:00:00+05:30`).getTime();

  console.log(`\n📅 Date Conversion:`);
  console.log(`   Report Date String: ${reportDate}`);
  console.log(`   Unix Timestamp (ms): ${dateTimestamp}`);
  console.log(`   Timestamp Verification: ${new Date(dateTimestamp).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "long", day: "numeric" })}`);
  console.log(`   ✅ Timestamp represents midnight IST on ${reportDate}`);

  const payload = {
    date: dateTimestamp.toString(),
    app_download_android: androidDownloads.toString(),
    app_download_ios: iosDownloads.toString(),
    episodes_viewed_android: androidViews.toString(),
    episodes_viewed_ios: iosViews.toString(),
    admob_impressions_android: androidImpressions.toString(),
    admob_impressions_ios: iosImpressions.toString(),
    admob_revenue_android: androidAdRevenue.toString(),
    admob_revenue_ios: iosAdRevenue.toString(),
    razor_pay_revenue: Math.round(razorpayRevenue).toString(),
  };

  console.log(`\n✅ Report data compiled successfully`);
  return payload;
}

const sendReport = async (endpoint, payload) => {
  console.log(`\n📤 Sending report to API...`);
  console.log(`📦 Payload:`, JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log(`\n📡 Raw API Response:`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));

    const rawText = await response.text();
    console.log(`   Raw Body: ${rawText}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${rawText}`);
    }

    let result;
    try {
      result = JSON.parse(rawText);
    } catch (e) {
      result = { raw: rawText };
    }

    console.log(`\n✅ Report sent successfully!`);
    console.log(`📥 Parsed Response:`, JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error(`\n❌ Failed to send report`);
    console.error(`❌ Error: ${error.message}`);
    throw error;
  }
};

async function main() {
  try {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🚀 Starting Report Send to Database`);
    console.log(`${"=".repeat(60)}\n`);

    const targetEndpoint = getTargetEndpoint();
    const payload = await generateReportData();

    const result = await sendReport(targetEndpoint, payload);

    console.log(`\n${"=".repeat(60)}`);
    console.log(`✅ REPORT SAVED TO DATABASE SUCCESSFULLY`);
    console.log(`${"=".repeat(60)}`);
    console.log(`\n📊 Report Summary:`);
    console.log(
      `   Date: ${new Date(parseInt(payload.date)).toLocaleDateString("en-IN")}`
    );
    console.log(
      `   Android Downloads: ${parseInt(
        payload.app_download_android
      ).toLocaleString()}`
    );
    console.log(
      `   iOS Downloads: ${parseInt(payload.app_download_ios).toLocaleString()}`
    );
    console.log(
      `   Total Downloads: ${(
        parseInt(payload.app_download_android) +
        parseInt(payload.app_download_ios)
      ).toLocaleString()}`
    );
    console.log(
      `   Android Views: ${parseInt(
        payload.episodes_viewed_android
      ).toLocaleString()}`
    );
    console.log(
      `   iOS Views: ${parseInt(payload.episodes_viewed_ios).toLocaleString()}`
    );
    console.log(
      `   Total Views: ${(
        parseInt(payload.episodes_viewed_android) +
        parseInt(payload.episodes_viewed_ios)
      ).toLocaleString()}`
    );
    console.log(
      `   Android Impressions: ${parseInt(
        payload.admob_impressions_android
      ).toLocaleString()}`
    );
    console.log(
      `   iOS Impressions: ${parseInt(
        payload.admob_impressions_ios
      ).toLocaleString()}`
    );
    console.log(
      `   Total Impressions: ${(
        parseInt(payload.admob_impressions_android) +
        parseInt(payload.admob_impressions_ios)
      ).toLocaleString()}`
    );
    console.log(
      `   Android AdMob Revenue: ₹${parseInt(
        payload.admob_revenue_android
      ).toLocaleString()}`
    );
    console.log(
      `   iOS AdMob Revenue: ₹${parseInt(
        payload.admob_revenue_ios
      ).toLocaleString()}`
    );
    console.log(
      `   Total AdMob Revenue: ₹${(
        parseInt(payload.admob_revenue_android) +
        parseInt(payload.admob_revenue_ios)
      ).toLocaleString()}`
    );
    console.log(
      `   Razorpay Revenue: ₹${parseInt(
        payload.razor_pay_revenue
      ).toLocaleString()}`
    );
    console.log(`\n${"=".repeat(60)}\n`);
  } catch (error) {
    console.error(`\n${"=".repeat(60)}`);
    console.error(`❌ FAILED TO SAVE REPORT TO DATABASE`);
    console.error(`❌ Reason: ${error.message}`);
    console.error(`${"=".repeat(60)}\n`);
    process.exit(1);
  }
}

main();
