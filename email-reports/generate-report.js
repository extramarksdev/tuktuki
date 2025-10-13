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
      console.error(`   Message:`, errorData.message || 'Unknown error');
      console.error(`   Details:`, errorData.errorDetails || 'No details');
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

async function generateReport() {
  console.log("🚀 Starting report generation...");

  const reportDay = new Date();
  reportDay.setDate(reportDay.getDate() - 1);
  const reportDate = reportDay.toISOString().split("T")[0];

  console.log(`📅 Generating report for: ${reportDate} (yesterday)`);
  console.log("📡 Fetching data from APIs...");

  const [adjustData, admobData, razorpayPayments] = await Promise.all([
    fetchData(`${API_BASE}/adjust/report?date=${reportDate}`),
    fetchData(`${API_BASE}/admob/report`),
    fetchData(`${API_BASE}/razorpay/payments`),
  ]);

  console.log("✅ Data fetched successfully");

  const iosDownloads = adjustData?.ios?.installs || 0;
  const androidDownloads = adjustData?.android?.installs || 0;
  const totalDownloads = iosDownloads + androidDownloads;

  const videoViewEvent = adjustData?.events?.["9v5ed0"] || {};
  const videoViewAndroid = parseInt(videoViewEvent?.rows?.find(r => r.os_name === "android")?.events || 0, 10);
  const videoViewIOS = parseInt(videoViewEvent?.rows?.find(r => r.os_name === "ios")?.events || 0, 10);
  const totalVideoViews = videoViewEvent?.totals?.events || 0;

  const dailyAdmob = admobData?.dailyData || [];
  const yesterdayAdmob = dailyAdmob.filter((d) => d.date === reportDate);

  const iosYesterday = yesterdayAdmob.find((d) => d.platform === "iOS" || d.platform === "PLATFORM_IOS");
  const androidYesterday = yesterdayAdmob.find((d) => d.platform === "Android" || d.platform === "PLATFORM_ANDROID");

  const iosImpressions = iosYesterday?.impressions || 0;
  const androidImpressions = androidYesterday?.impressions || 0;
  const admobImpressions = iosImpressions + androidImpressions;

  const iosAdRevenue = iosYesterday?.revenue || 0;
  const androidAdRevenue = androidYesterday?.revenue || 0;
  const admobRevenue = iosAdRevenue + androidAdRevenue;
  const admobRevenueINR = admobRevenue * 83.5;

  const reportLocalDate = new Date(reportDate + "T00:00:00").toLocaleDateString("en-IN");
  const yesterdayPayments = razorpayPayments?.items?.filter((payment) => {
    const createdLocalDate = new Date(payment.created_at * 1000).toLocaleDateString("en-IN");
    return createdLocalDate === reportLocalDate && (payment.status === "captured" || payment.status === "authorized");
  }) || [];

  const subscriptionRevenue = yesterdayPayments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

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
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">

<table width="600" border="0" cellpadding="0" cellspacing="0" align="center" style="background-color: white; border-radius: 8px;">
  <tr>
    <td style="padding: 30px; text-align: center; border-bottom: 2px solid #eee;">
      <h1 style="margin: 0; font-size: 24px; color: #333;">TukTuki Reports Dashboard</h1>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Showing data for <strong style="color: #5469d4;">${dateStr}</strong></p>
    </td>
  </tr>
  <tr>
    <td style="padding: 20px;">
      
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" valign="top" style="padding: 10px;">
            <table width="100%" border="0" cellpadding="15" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
              <tr>
                <td>
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; font-weight: bold;">Total Downloads</p>
                  <p style="margin: 0 0 10px 0; font-size: 28px; color: #111; font-weight: bold;">${totalDownloads.toLocaleString()}</p>
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid #ddd; padding-top: 8px;">
                    <tr>
                      <td width="50%" style="padding-right: 5px; border-right: 1px solid #ddd;">
                        <p style="margin: 0 0 3px 0; font-size: 11px; color: #888;">Android</p>
                        <p style="margin: 0; font-size: 18px; color: #333; font-weight: bold;">${androidDownloads.toLocaleString()}</p>
                      </td>
                      <td width="50%" style="padding-left: 5px;">
                        <p style="margin: 0 0 3px 0; font-size: 11px; color: #888;">iOS</p>
                        <p style="margin: 0; font-size: 18px; color: #333; font-weight: bold;">${iosDownloads.toLocaleString()}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
          <td width="50%" valign="top" style="padding: 10px;">
            <table width="100%" border="0" cellpadding="15" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
              <tr>
                <td>
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; font-weight: bold;">Episode Views</p>
                  <p style="margin: 0 0 10px 0; font-size: 28px; color: #111; font-weight: bold;">${totalVideoViews.toLocaleString()}</p>
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid #ddd; padding-top: 8px;">
                    <tr>
                      <td width="50%" style="padding-right: 5px; border-right: 1px solid #ddd;">
                        <p style="margin: 0 0 3px 0; font-size: 11px; color: #888;">Android</p>
                        <p style="margin: 0; font-size: 18px; color: #333; font-weight: bold;">${videoViewAndroid.toLocaleString()}</p>
                      </td>
                      <td width="50%" style="padding-left: 5px;">
                        <p style="margin: 0 0 3px 0; font-size: 11px; color: #888;">iOS</p>
                        <p style="margin: 0; font-size: 18px; color: #333; font-weight: bold;">${videoViewIOS.toLocaleString()}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td width="50%" valign="top" style="padding: 10px;">
            <table width="100%" border="0" cellpadding="15" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
              <tr>
                <td>
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; font-weight: bold;">AdMob Impressions</p>
                  <p style="margin: 0 0 10px 0; font-size: 28px; color: #111; font-weight: bold;">${admobImpressions.toLocaleString()}</p>
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid #ddd; padding-top: 8px;">
                    <tr>
                      <td width="50%" style="padding-right: 5px; border-right: 1px solid #ddd;">
                        <p style="margin: 0 0 3px 0; font-size: 11px; color: #888;">Android</p>
                        <p style="margin: 0; font-size: 18px; color: #333; font-weight: bold;">${androidImpressions.toLocaleString()}</p>
                      </td>
                      <td width="50%" style="padding-left: 5px;">
                        <p style="margin: 0 0 3px 0; font-size: 11px; color: #888;">iOS</p>
                        <p style="margin: 0; font-size: 18px; color: #333; font-weight: bold;">${iosImpressions.toLocaleString()}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
          <td width="50%" valign="top" style="padding: 10px;">
            <table width="100%" border="0" cellpadding="15" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
              <tr>
                <td>
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; font-weight: bold;">AdMob Revenue</p>
                  <p style="margin: 0 0 10px 0; font-size: 28px; color: #111; font-weight: bold;">₹${Math.round(admobRevenueINR).toLocaleString()}</p>
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid #ddd; padding-top: 8px;">
                    <tr>
                      <td width="50%" style="padding-right: 5px; border-right: 1px solid #ddd;">
                        <p style="margin: 0 0 3px 0; font-size: 11px; color: #888;">Android</p>
                        <p style="margin: 0; font-size: 18px; color: #333; font-weight: bold;">₹${Math.round(androidAdRevenue * 83.5).toLocaleString()}</p>
                      </td>
                      <td width="50%" style="padding-left: 5px;">
                        <p style="margin: 0 0 3px 0; font-size: 11px; color: #888;">iOS</p>
                        <p style="margin: 0; font-size: 18px; color: #333; font-weight: bold;">₹${Math.round(iosAdRevenue * 83.5).toLocaleString()}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td width="50%" valign="top" style="padding: 10px;">
            <table width="100%" border="0" cellpadding="15" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
              <tr>
                <td>
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; font-weight: bold;">Revenue (Razorpay)</p>
                  <p style="margin: 0; font-size: 28px; color: #111; font-weight: bold;">₹${Math.round(subscriptionRevenue).toLocaleString()}</p>
                </td>
              </tr>
            </table>
          </td>
          <td width="50%" valign="top" style="padding: 10px;">
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>

</body>
</html>`;

  const outputPath = path.join(__dirname, "index.html");
  fs.writeFileSync(outputPath, html, "utf8");

  console.log(`✅ Report generated: ${outputPath}`);
  console.log("📊 Summary:");
  console.log(`   Total Downloads: ${totalDownloads} (iOS: ${iosDownloads}, Android: ${androidDownloads})`);
  console.log(`   Episode Views: ${totalVideoViews} (iOS: ${videoViewIOS}, Android: ${videoViewAndroid})`);
  console.log(`   AdMob Impressions: ${admobImpressions} (iOS: ${iosImpressions}, Android: ${androidImpressions})`);
  console.log(`   AdMob Revenue: ₹${Math.round(admobRevenueINR)}`);
  console.log(`   Razorpay Revenue: ₹${Math.round(subscriptionRevenue)}`);
}

generateReport().catch(console.error);
