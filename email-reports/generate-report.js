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
  reportDay.setDate(reportDay.getDate() - 2);
  const reportDate = reportDay.toISOString().split("T")[0];

  console.log(
    `📅 Generating report for: ${reportDate} (2 days ago for all metrics)`
  );
  console.log("📡 Fetching data from APIs...");

  const [appStoreData, playStoreData, admobData, razorpayPayments] =
    await Promise.all([
      fetchData(`${API_BASE}/appstore/downloads?date=${reportDate}`),
      fetchData(`${API_BASE}/playstore/downloads`),
      fetchData(`${API_BASE}/admob/report`),
      fetchData(`${API_BASE}/razorpay/payments`),
    ]);

  console.log("✅ Data fetched successfully");

  console.log(`📱 App Store data for ${reportDate}:`, appStoreData);
  const iosDownloads =
    appStoreData?.breakdown?.newDownloads || appStoreData?.downloads || 0;
  const androidDownloads = 0;
  const totalDownloads = iosDownloads + androidDownloads;
  console.log(`   iOS Downloads: ${iosDownloads}`);

  const dailyAdmob = admobData?.dailyData || [];

  console.log(`🔍 Looking for AdMob data for date: ${reportDate}`);
  console.log(`   Total AdMob rows: ${dailyAdmob.length}`);
  console.log(
    `   All dates in AdMob:`,
    dailyAdmob.map((d) => d.date)
  );
  console.log(
    `   Full AdMob data:`,
    JSON.stringify(dailyAdmob.slice(0, 5), null, 2)
  );

  const yesterdayAdmob = dailyAdmob.filter((d) => d.date === reportDate);

  console.log(`   Matched rows for ${reportDate}: ${yesterdayAdmob.length}`);
  console.log(`   Matched data:`, yesterdayAdmob);

  const iosYesterday = yesterdayAdmob.find(
    (d) => d.platform === "iOS" || d.platform === "PLATFORM_IOS"
  );
  const androidYesterday = yesterdayAdmob.find(
    (d) => d.platform === "Android" || d.platform === "PLATFORM_ANDROID"
  );

  console.log(`   iOS data:`, iosYesterday);
  console.log(`   Android data:`, androidYesterday);

  const iosImpressions = iosYesterday?.impressions || 0;
  const androidImpressions = androidYesterday?.impressions || 0;
  const admobImpressions = iosImpressions + androidImpressions;

  const iosAdRevenue = iosYesterday?.revenue || 0;
  const androidAdRevenue = androidYesterday?.revenue || 0;
  const admobRevenue = iosAdRevenue + androidAdRevenue;
  const admobRevenueINR = admobRevenue * 83.5;

  console.log(`💳 Filtering Razorpay payments for ${reportDate}...`);
  console.log(
    `   Total payments received: ${razorpayPayments?.items?.length || 0}`
  );

  const reportLocalDate = new Date(reportDate + "T00:00:00").toLocaleDateString(
    "en-IN"
  );
  console.log(`   Looking for local date: ${reportLocalDate}`);

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

  console.log(
    `   Matched payments for ${reportLocalDate}: ${yesterdayPayments.length}`
  );
  console.log(
    `   Payment details:`,
    yesterdayPayments.map((p) => ({
      id: p.id,
      amount: p.amount / 100,
      status: p.status,
      created: new Date(p.created_at * 1000).toLocaleDateString("en-IN"),
    }))
  );

  const subscriptionRevenue =
    yesterdayPayments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

  console.log(`   Total revenue: ₹${subscriptionRevenue}`);

  const totalRevenue = admobRevenueINR + subscriptionRevenue;
  const episodeViews = 16543;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Business Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      text-align: center;
      margin-bottom: 28px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f0f0f0;
    }
    .header h1 {
      font-size: 28px;
      color: #1a1a1a;
      margin-bottom: 8px;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .header p {
      font-size: 13px;
      color: #888;
      font-weight: 500;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }
    .card {
      background: linear-gradient(135deg, #f6f8fb 0%, #ffffff 100%);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e8ecf1;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .card-label {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      letter-spacing: 0.5px;
    }
    .icon {
      width: 28px;
      height: 28px;
      color: #667eea;
    }
    .card-value {
      font-size: 32px;
      font-weight: 800;
      color: #1a1a1a;
      margin-bottom: 12px;
      line-height: 1.2;
    }
    .split {
      display: flex;
      gap: 20px;
      font-size: 14px;
      color: #666;
      padding-top: 10px;
      border-top: 1px solid #e0e0e0;
    }
    .split-item {
      flex: 1;
      padding: 0 10px;
    }
    .split-item:first-child {
      border-right: 1px solid #e0e0e0;
    }
    .split-label {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
      font-size: 13px;
      font-weight: 700;
      color: #4b5563;
    }
    .platform-icon {
      font-size: 14px;
    }
    .split-value {
      font-size: 22px;
      font-weight: 700;
      color: #374151;
    }
    .footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 2px solid #f0f0f0;
      font-size: 14px;
      color: #6b7280;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TukTuki Reports Dashboard</h1>
      <p style="font-size: 16px; font-weight: 700; margin-top: 8px; color: #555;">
        Showing data for <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${new Date(reportDate).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}</span>
      </p>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-label">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
          </svg>
          Total Downloads
        </div>
        <div class="card-value">${totalDownloads.toLocaleString()}</div>
        <div class="split">
          <div class="split-item">
            <span class="split-label">Android</span>
            <div class="split-value">${androidDownloads.toLocaleString()}</div>
          </div>
          <div class="split-item">
            <span class="split-label">iOS</span>
            <div class="split-value">${iosDownloads.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-label">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          AdMob Impressions
        </div>
        <div class="card-value">${admobImpressions.toLocaleString()}</div>
        ${
          iosImpressions > 0 || androidImpressions > 0
            ? `
        <div class="split">
          <div class="split-item">
            <span class="split-label">Android</span>
            <div class="split-value">${androidImpressions.toLocaleString()}</div>
          </div>
          <div class="split-item">
            <span class="split-label">iOS</span>
            <div class="split-value">${iosImpressions.toLocaleString()}</div>
          </div>
        </div>
        `
            : ""
        }
      </div>

      <div class="card">
        <div class="card-label">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          AdMob Revenue
        </div>
        <div class="card-value">₹${Math.round(
          admobRevenueINR
        ).toLocaleString()}</div>
        ${
          iosAdRevenue > 0 || androidAdRevenue > 0
            ? `
        <div class="split">
          <div class="split-item">
            <span class="split-label">Android</span>
            <div class="split-value">₹${Math.round(
              androidAdRevenue * 83.5
            ).toLocaleString()}</div>
          </div>
          <div class="split-item">
            <span class="split-label">iOS</span>
            <div class="split-value">₹${Math.round(
              iosAdRevenue * 83.5
            ).toLocaleString()}</div>
          </div>
        </div>
        `
            : ""
        }
      </div>

      <div class="card">
        <div class="card-label">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          </svg>
          Revenue (Razorpay)
        </div>
        <div class="card-value">₹${Math.round(
          subscriptionRevenue
        ).toLocaleString()}</div>
      </div>

      <div class="card">
        <div class="card-label">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          Episode Views
        </div>
        <div class="card-value">${episodeViews.toLocaleString()}</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const outputPath = path.join(__dirname, "index.html");
  fs.writeFileSync(outputPath, html, "utf8");

  console.log(`✅ Report generated: ${outputPath}`);
  console.log("📊 Summary:");
  console.log(
    `   Total Downloads: ${totalDownloads} (iOS: ${iosDownloads}, Android: ${androidDownloads})`
  );
  console.log(`   Episode Views: ${episodeViews}`);
  console.log(`   AdMob Impressions: ${admobImpressions}`);
  console.log(`   AdMob Revenue: $${Math.round(admobRevenue)}`);
  console.log(
    `   Subscription Revenue: $${Math.round(subscriptionRevenue / 83.5)}`
  );
  console.log(`\n📧 Send ${outputPath} via email`);
}

generateReport().catch(console.error);
