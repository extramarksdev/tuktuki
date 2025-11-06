import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const API_BASE = process.env.API_BASE_URL || "http://localhost:8888/api";

async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ Error fetching ${url}:`);
      console.error(`   Status: ${response.status}`);
      console.error(`   Message:`, errorData.message || "Unknown error");
      console.error(`   Details:`, errorData.errorDetails || "No details");
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

/**
 * Get report date (always yesterday in IST) - BULLETPROOF
 * @returns {string} Report date in YYYY-MM-DD format
 */
async function getReportDate() {
  console.log("\n" + "=".repeat(60));
  console.log("🕐 GETTING IST DATE");
  console.log("=".repeat(60));
  
  try {
    // Try WorldTimeAPI first (free, no auth, reliable)
    console.log("📡 Trying WorldTimeAPI (timeout: 10 seconds)...");
    
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000);
    });
    
    // Race between fetch and timeout
    const response = await Promise.race([
      fetch("http://worldtimeapi.org/api/timezone/Asia/Kolkata"),
      timeoutPromise
    ]);
    
    if (!response.ok) {
      throw new Error(`WorldTimeAPI returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log("✅ WorldTimeAPI Response:");
    console.log(`   DateTime: ${data.datetime}`);
    console.log(`   TimeZone: ${data.timezone}`);
    console.log(`   UTC Offset: ${data.utc_offset}`);
    
    // Parse the datetime field (format: "2025-11-05T09:56:23.123456+05:30")
    const currentIST = new Date(data.datetime);
    
    console.log(`   Current IST Date: ${currentIST.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log(`   Current IST Time: ${currentIST.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    
    // Subtract 1 day to get yesterday
    const yesterday = new Date(currentIST);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format as YYYY-MM-DD
    const reportDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    
    console.log(`   Yesterday IST Date: ${yesterday.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log("\n🎯 FINAL REPORT DATE: " + reportDate);
    console.log("=".repeat(60) + "\n");
    
    return reportDate;
    
  } catch (error) {
    console.warn("⚠️  WorldTimeAPI failed:", error.message);
    console.log("↩️  Falling back to Node.js IST calculation...");
    
    // Fallback: Use Node.js with IST timezone conversion
    const nowInIndia = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const currentIST = new Date(nowInIndia);
    
    console.log("✅ Node.js IST Calculation:");
    console.log(`   Current IST Date/Time: ${currentIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    
    // Subtract 1 day to get yesterday
    const yesterday = new Date(currentIST);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format as YYYY-MM-DD
    const reportDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    
    console.log(`   Yesterday IST Date: ${yesterday.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log("\n🎯 FINAL REPORT DATE (Fallback): " + reportDate);
    console.log("=".repeat(60) + "\n");
    
    return reportDate;
  }
}

async function generateReport() {
  // Get report date (always yesterday in IST) using robust calculation
  const reportDate = await getReportDate();

  console.log("\n" + "=".repeat(60));
  console.log("📡 FETCHING DATA FROM APIs");
  console.log("=".repeat(60));
  console.log(`Using Report Date: ${reportDate} for all API calls\n`);

  const [adjustData, admobData, razorpayPayments] =
    await Promise.all([
      fetchData(`${API_BASE}/adjust/report?date=${reportDate}`),
      fetchData(`${API_BASE}/admob/report?date=${reportDate}`),
      fetchData(`${API_BASE}/razorpay/payments?date=${reportDate}`),   
    ]);

  const iosDownloads = adjustData?.ios?.installs || 0;
  const androidDownloads = adjustData?.android?.installs || 0;
  const totalDownloads = iosDownloads + androidDownloads;

  const videoViewAndroid = adjustData?.android?.views;
  const videoViewIOS = adjustData?.ios?.views;

  const totalVideoViews = videoViewAndroid + videoViewIOS;

  const dailyAdmob = admobData?.dailyData || [];
  const yesterdayAdmob = dailyAdmob.filter((d) => d.date === reportDate);
  const iosYesterday = yesterdayAdmob.find(
    (d) => d.platform === "iOS" || d.platform === "PLATFORM_IOS"
  );
  const androidYesterday = yesterdayAdmob.find(
    (d) => d.platform === "Android" || d.platform === "PLATFORM_ANDROID"
  );
  const iosImpressions = iosYesterday?.impressions || 0;
  const androidImpressions = androidYesterday?.impressions || 0;
  const admobImpressions = iosImpressions + androidImpressions;
  const iosAdRevenue = iosYesterday?.revenue || 0;
  const androidAdRevenue = androidYesterday?.revenue || 0;
  const admobRevenue = iosAdRevenue + androidAdRevenue;
  const admobRevenueINR = admobRevenue * 83.5;

  const reportLocalDate = new Date(reportDate + "T00:00:00").toLocaleDateString(
    "en-IN"
  );
  const yesterdayPayments =
    razorpayPayments?.items?.filter((payment) => {
      const createdLocalDate = new Date(
        payment.created_at * 1000
      ).toLocaleDateString("en-IN");
      return (
        createdLocalDate === reportLocalDate &&
        (payment.status === "captured" || payment.status === "authorized")
      );
    }) || [];
  const subscriptionRevenue =
    yesterdayPayments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

  const dateStr = new Date(reportDate).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">

<table width="750" border="0" cellpadding="0" cellspacing="0" align="center" style="background-color: white; border: 1px solid #d0d0d0; border-radius: 8px;">
  <tr>
    <td style="padding: 35px 45px; text-align: center; background-color: white; border-bottom: 3px solid #e1e4e8;">
      <h1 style="margin: 0; font-size: 28px; color: #1a1a1a; font-weight: 700; letter-spacing: -0.5px;">TukTuki Reports Dashboard</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px; color: #1a1a1a; font-weight: 600;">Showing data for <strong style="color: #5469d4; font-size: 17px;">${dateStr}</strong></p>
    </td>
  </tr>
  <tr>
    <td style="padding: 40px;">
      
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" valign="top" style="padding: 8px;">
            <table width="100%" border="0" cellpadding="22" cellspacing="0" style="background-color: #f0f0f0; border: 1px solid #d0d0d0; border-radius: 8px;">
              <tr>
                <td>
                  <p style="margin: 0 0 14px 0; font-size: 15px; color: #1a1a1a; font-weight: 600; letter-spacing: 0.3px;">📥 Total Downloads</p>
                  <p style="margin: 0 0 18px 0; font-size: 38px; color: #24292e; font-weight: 700; line-height: 1;">${totalDownloads.toLocaleString()}</p>
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 2px solid #d1d5da; padding-top: 14px;">
                    <tr>
                      <td width="40%" style="padding-right: 10px;">
                        <p style="margin: 0 0 6px 0; font-size: 14px; color: #1a1a1a; font-weight: 700;">🤖 Android</p>
                        <p style="margin: 0; font-size: 24px; color: #24292e; font-weight: 700;">${androidDownloads.toLocaleString()}</p>
                      </td>
                      <td width="10%" align="center"><div style="width: 2px; height: 40px; background-color: #d1d5da;"></div></td>
                      <td width="50%" style="padding-left: 22px;">
                        <p style="margin: 0 0 6px 0; font-size: 14px; color: #1a1a1a; font-weight: 700;">📱 iOS</p>
                        <p style="margin: 0; font-size: 24px; color: #24292e; font-weight: 700;">${iosDownloads.toLocaleString()}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
          <td width="50%" valign="top" style="padding: 8px;">
            <table width="100%" border="0" cellpadding="22" cellspacing="0" style="background-color: #f0f0f0; border: 1px solid #d0d0d0; border-radius: 8px;">
              <tr>
                <td>
                  <p style="margin: 0 0 14px 0; font-size: 15px; color: #1a1a1a; font-weight: 600; letter-spacing: 0.3px;">📺 Episode Views</p>
                  <p style="margin: 0 0 18px 0; font-size: 38px; color: #24292e; font-weight: 700; line-height: 1;">${totalVideoViews.toLocaleString()}</p>
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 2px solid #d1d5da; padding-top: 14px;">
                    <tr>
                      <td width="40%" style="padding-right: 10px;">
                        <p style="margin: 0 0 6px 0; font-size: 14px; color: #1a1a1a; font-weight: 700;">🤖 Android</p>
                        <p style="margin: 0; font-size: 24px; color: #24292e; font-weight: 700;">${videoViewAndroid.toLocaleString()}</p>
                      </td>
                      <td width="10%" align="center"><div style="width: 2px; height: 40px; background-color: #d1d5da;"></div></td>
                      <td width="50%" style="padding-left: 22px;">
                        <p style="margin: 0 0 6px 0; font-size: 14px; color: #1a1a1a; font-weight: 700;">📱 iOS</p>
                        <p style="margin: 0; font-size: 24px; color: #24292e; font-weight: 700;">${videoViewIOS.toLocaleString()}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td width="50%" valign="top" style="padding: 8px;">
            <table width="100%" border="0" cellpadding="22" cellspacing="0" style="background-color: #f0f0f0; border: 1px solid #d0d0d0; border-radius: 8px;">
              <tr>
                <td>
                  <p style="margin: 0 0 14px 0; font-size: 15px; color: #1a1a1a; font-weight: 600; letter-spacing: 0.3px;">👁️ AdMob Impressions</p>
                  <p style="margin: 0 0 18px 0; font-size: 38px; color: #24292e; font-weight: 700; line-height: 1;">${admobImpressions.toLocaleString()}</p>
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 2px solid #d1d5da; padding-top: 14px;">
                    <tr>
                      <td width="40%" style="padding-right: 10px;">
                        <p style="margin: 0 0 6px 0; font-size: 14px; color: #1a1a1a; font-weight: 700;">🤖 Android</p>
                        <p style="margin: 0; font-size: 24px; color: #24292e; font-weight: 700;">${androidImpressions.toLocaleString()}</p>
                      </td>
                      <td width="10%" align="center"><div style="width: 2px; height: 40px; background-color: #d1d5da;"></div></td>
                      <td width="50%" style="padding-left: 22px;">
                        <p style="margin: 0 0 6px 0; font-size: 14px; color: #1a1a1a; font-weight: 700;">📱 iOS</p>
                        <p style="margin: 0; font-size: 24px; color: #24292e; font-weight: 700;">${iosImpressions.toLocaleString()}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
          <td width="50%" valign="top" style="padding: 8px;">
            <table width="100%" border="0" cellpadding="22" cellspacing="0" style="background-color: #f0f0f0; border: 1px solid #d0d0d0; border-radius: 8px;">
              <tr>
                <td>
                  <p style="margin: 0 0 14px 0; font-size: 15px; color: #1a1a1a; font-weight: 600; letter-spacing: 0.3px;">💰 AdMob Revenue</p>
                  <p style="margin: 0 0 18px 0; font-size: 38px; color: #24292e; font-weight: 700; line-height: 1;">₹${Math.round(
                    admobRevenueINR
                  ).toLocaleString()}</p>
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 2px solid #d1d5da; padding-top: 14px;">
                    <tr>
                      <td width="40%" style="padding-right: 10px;">
                        <p style="margin: 0 0 6px 0; font-size: 14px; color: #1a1a1a; font-weight: 700;">🤖 Android</p>
                        <p style="margin: 0; font-size: 24px; color: #24292e; font-weight: 700;">₹${Math.round(
                          androidAdRevenue * 83.5
                        ).toLocaleString()}</p>
                      </td>
                      <td width="10%" align="center"><div style="width: 2px; height: 40px; background-color: #d1d5da;"></div></td>
                      <td width="50%" style="padding-left: 22px;">
                        <p style="margin: 0 0 6px 0; font-size: 14px; color: #1a1a1a; font-weight: 700;">📱 iOS</p>
                        <p style="margin: 0; font-size: 24px; color: #24292e; font-weight: 700;">₹${Math.round(
                          iosAdRevenue * 83.5
                        ).toLocaleString()}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td width="50%" valign="top" style="padding: 8px;">
            <table width="100%" border="0" cellpadding="22" cellspacing="0" style="background-color: #f0f0f0; border: 1px solid #d0d0d0; border-radius: 8px;">
              <tr>
                <td>
                  <p style="margin: 0 0 14px 0; font-size: 15px; color: #1a1a1a; font-weight: 600; letter-spacing: 0.3px;">💳 Revenue (Razorpay)</p>
                  <p style="margin: 0; font-size: 38px; color: #24292e; font-weight: 700; line-height: 1;">₹${Math.round(
                    subscriptionRevenue
                  ).toLocaleString()}</p>
                </td>
              </tr>
            </table>
          </td>
          <td width="50%" valign="top" style="padding: 8px;"></td>
        </tr>
      </table>

    </td>
  </tr>
</table>

</body>
</html>`;

  const outputPath = path.join(__dirname, "index.html");
  fs.writeFileSync(outputPath, html, "utf8");
}

generateReport().catch(console.error);
