import express from "express";
import cors from "cors";
import { Buffer } from "buffer";
import dotenv from "dotenv";
import fs from "fs";
import https from "https";
import zlib from "zlib";
import jwt from "jsonwebtoken";
import { google } from "googleapis";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8888;

app.use(cors());
app.use(express.json());

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error(
    "Error: Razorpay credentials not found in environment variables"
  );
  console.error(
    "Please create a .env file with RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET"
  );
  process.exit(1);
}

const createBasicAuth = () => {
  const credentials = Buffer.from(
    `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
  ).toString("base64");
  return `Basic ${credentials}`;
};

app.get("/api/razorpay/subscriptions", async (req, res) => {
  try {
    let allSubscriptions = [];
    let skip = 0;
    const count = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `https://api.razorpay.com/v1/subscriptions?count=${count}&skip=${skip}`,
        {
          method: "GET",
          headers: {
            Authorization: createBasicAuth(),
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Razorpay API error: ${response.status}`);
      }

      const data = await response.json();
      allSubscriptions = allSubscriptions.concat(data.items);

      if (data.items.length < count) {
        hasMore = false;
      } else {
        skip += count;
      }
    }

    res.json({
      entity: "collection",
      count: allSubscriptions.length,
      items: allSubscriptions,
    });
  } catch (error) {
    console.error("Error fetching Razorpay subscriptions:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/razorpay/plans/:planId", async (req, res) => {
  try {
    const { planId } = req.params;
    const response = await fetch(
      `https://api.razorpay.com/v1/plans/${planId}`,
      {
        method: "GET",
        headers: {
          Authorization: createBasicAuth(),
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Razorpay API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching Razorpay plan:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/razorpay/payments", async (req, res) => {
  try {
    let allPayments = [];
    let skip = 0;
    const count = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `https://api.razorpay.com/v1/payments?count=${count}&skip=${skip}`,
        {
          method: "GET",
          headers: {
            Authorization: createBasicAuth(),
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Razorpay API error: ${response.status}`);
      }

      const data = await response.json();
      allPayments = allPayments.concat(data.items);

      if (data.items.length < count) {
        hasMore = false;
      } else {
        skip += count;
      }
    }

    res.json({
      entity: "collection",
      count: allPayments.length,
      items: allPayments,
    });
  } catch (error) {
    console.error("Error fetching Razorpay payments:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/razorpay/invoices", async (req, res) => {
  try {
    let allInvoices = [];
    let skip = 0;
    const count = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `https://api.razorpay.com/v1/invoices?count=${count}&skip=${skip}&type=invoice`,
        {
          method: "GET",
          headers: {
            Authorization: createBasicAuth(),
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Razorpay API error: ${response.status}`);
      }

      const data = await response.json();
      allInvoices = allInvoices.concat(data.items);

      if (data.items.length < count) {
        hasMore = false;
      } else {
        skip += count;
      }
    }

    res.json({
      entity: "collection",
      count: allInvoices.length,
      items: allInvoices,
    });
  } catch (error) {
    console.error("Error fetching Razorpay invoices:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/appstore/downloads", async (req, res) => {
  try {
    const issuerId = process.env.APPSTORE_ISSUER_ID;
    const keyId = process.env.APPSTORE_KEY_ID;
    const keyPath = process.env.APPSTORE_KEY_PATH;
    const vendorNumber = process.env.APPSTORE_VENDOR_NUMBER;
    const appProductId = process.env.APPSTORE_APP_PRODUCT_ID;
    const reportDate =
      req.query.date ||
      (() => {
        const d = new Date();
        d.setDate(d.getDate() - 3);
        return d.toISOString().split("T")[0];
      })();

    if (!issuerId || !keyId || !keyPath || !vendorNumber || !appProductId) {
      return res.status(400).json({
        error: true,
        message: "Apple credentials missing in .env",
      });
    }

    const privateKey = fs.readFileSync(keyPath, "utf8");
    const payload = {
      iss: issuerId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 20 * 60,
      aud: "appstoreconnect-v1",
    };
    const token = jwt.sign(payload, privateKey, {
      algorithm: "ES256",
      header: { kid: keyId, typ: "JWT" },
    });

    const queryString = new URLSearchParams({
      "filter[frequency]": "DAILY",
      "filter[reportDate]": reportDate,
      "filter[reportSubType]": "SUMMARY",
      "filter[reportType]": "SALES",
      "filter[vendorNumber]": vendorNumber,
      "filter[version]": "1_0",
    }).toString();

    const options = {
      hostname: "api.appstoreconnect.apple.com",
      port: 443,
      path: `/v1/salesReports?${queryString}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/a-gzip",
      },
    };

    const tsv = await new Promise((resolve, reject) => {
      https
        .get(options, (r) => {
          const chunks = [];
          r.on("data", (c) => chunks.push(c));
          r.on("end", () => {
            const buffer = Buffer.concat(chunks);
            if (r.statusCode !== 200) {
              const errMsg = buffer.toString("utf-8");
              return reject(new Error(`Apple API ${r.statusCode}: ${errMsg}`));
            }
            const contentType = r.headers["content-type"] || "";
            if (contentType.includes("gzip") || buffer[0] === 0x1f) {
              zlib.gunzip(buffer, (err, decompressed) => {
                if (err) return reject(err);
                resolve(decompressed.toString("utf-8"));
              });
            } else {
              resolve(buffer.toString("utf-8"));
            }
          });
        })
        .on("error", reject);
    });

    const lines = tsv.split("\n").filter((l) => l.trim());
    if (lines.length === 0) {
      return res.json({
        date: reportDate,
        productId: appProductId,
        downloads: 0,
        rawResponse: {
          headers: [],
          rows: [],
        },
      });
    }
    const headers = lines[0].split("\t");
    const idxUnits = headers.indexOf("Units");
    const idxAppleId = headers.indexOf("Apple Identifier");
    const idxType = headers.indexOf("Product Type Identifier");

    const allRows = [];
    let downloads = 0;
    let newDownloads = 0;
    let updates = 0;
    let reDownloads = 0;

    for (let i = 1; i < lines.length; i++) {
      const fields = lines[i].split("\t");
      const appleId = fields[idxAppleId];
      const ptype = fields[idxType];
      const units = parseInt(fields[idxUnits] || "0", 10);

      const rowData = {};
      headers.forEach((header, idx) => {
        rowData[header] = fields[idx];
      });
      allRows.push(rowData);

      if (appleId === appProductId && !Number.isNaN(units)) {
        if (ptype === "1" || ptype === "1F") {
          newDownloads += units;
          downloads += units;
        } else if (ptype === "7" || ptype === "7F") {
          updates += units;
          downloads += units;
        } else if (ptype === "3" || ptype === "3F") {
          reDownloads += units;
          downloads += units;
        }
      }
    }

    return res.json({
      date: reportDate,
      productId: appProductId,
      downloads,
      units: downloads,
      breakdown: {
        newDownloads,
        updates,
        reDownloads,
        total: downloads,
      },
      rawResponse: {
        headers,
        rows: allRows,
        totalRows: allRows.length,
      },
    });
  } catch (error) {
    console.error("Error fetching App Store downloads:", error.message);
    res
      .status(500)
      .json({ error: true, message: "Failed to fetch App Store downloads" });
  }
});

app.post("/api/oauth/exchange-code", async (req, res) => {
  try {
    const { code } = req.body;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!code || !clientId || !clientSecret) {
      return res.status(400).json({
        error: true,
        message: "Missing code, client_id, or client_secret",
      });
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: "https://developers.google.com/oauthplayground",
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorData}`);
    }

    const tokenData = await tokenResponse.json();

    return res.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
    });
  } catch (error) {
    console.error("Error exchanging OAuth code:", error.message);
    res.status(500).json({
      error: true,
      message: "Failed to exchange authorization code",
      errorDetails: error.message,
    });
  }
});

app.get("/api/admob/report", async (req, res) => {
  try {
    const publisherId = process.env.ADMOB_PUBLISHER_ID;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    // Get report date from query params (default to yesterday in IST)
    let reportDate = req.query.date;
    if (!reportDate) {
      const nowInIndia = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const reportDay = new Date(nowInIndia);
      reportDay.setDate(reportDay.getDate() - 1);
      reportDate = `${reportDay.getFullYear()}-${String(reportDay.getMonth() + 1).padStart(2, '0')}-${String(reportDay.getDate()).padStart(2, '0')}`;
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 ADMOB API REQUEST");
    console.log("=".repeat(60));
    console.log("📅 Report Date:", reportDate);
    console.log("📍 Publisher ID:", publisherId || "❌ MISSING");
    console.log("🔑 Client ID:", clientId ? "✅ SET" : "❌ MISSING");
    console.log("🔑 Client Secret:", clientSecret ? "✅ SET" : "❌ MISSING");
    console.log("🔑 Refresh Token:", refreshToken ? "✅ SET" : "❌ MISSING");

    if (!publisherId || !clientId || !clientSecret || !refreshToken) {
      return res.status(400).json({
        error: true,
        message:
          "AdMob OAuth credentials missing. Need: ADMOB_PUBLISHER_ID, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN",
      });
    }

    console.log("\n🔐 Creating OAuth2 client...");
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    oauth2Client.on('tokens', (tokens) => {
      console.log("🔄 New access token obtained from refresh token");
      console.log("   Expires:", tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : "unknown");
    });

    console.log("✅ OAuth2 client configured");
    console.log("📡 Initializing AdMob API client...");
    const admob = google.admob({ version: "v1", auth: oauth2Client });

    // Parse the report date (YYYY-MM-DD)
    const [year, month, day] = reportDate.split('-').map(Number);

    console.log("\n📊 AdMob API Call Details:");
    console.log("   Account: accounts/" + publisherId);
    console.log("   Date Range: " + reportDate + " (single day only)");
    console.log("   Start Date: Year=" + year + ", Month=" + month + ", Day=" + day);
    console.log("   End Date: Year=" + year + ", Month=" + month + ", Day=" + day);
    console.log("   Metrics: IMPRESSIONS, CLICKS, ESTIMATED_EARNINGS");
    console.log("   Dimensions: DATE, PLATFORM");

    const response = await admob.accounts.networkReport.generate({
      parent: `accounts/${publisherId}`,
      requestBody: {
        reportSpec: {
          dateRange: {
            startDate: {
              year: year,
              month: month,
              day: day,
            },
            endDate: {
              year: year,
              month: month,
              day: day,
            },
          },
          metrics: ["IMPRESSIONS", "CLICKS", "ESTIMATED_EARNINGS"],
          dimensions: ["DATE", "PLATFORM"],
        },
      },
    });

    console.log("\n✅ AdMob API call successful!");
    console.log("📦 Response Structure:");
    console.log("   Total items:", response.data?.length || 0);
    
    if (response.data && response.data.length > 0) {
      console.log("\n📋 ALL Response Items:");
      response.data.forEach((item, idx) => {
        console.log(`   Item ${idx + 1}:`, JSON.stringify(item, null, 2));
      });
    } else {
      console.log("   ⚠️  No data returned from AdMob API");
    }

    const responseArray = response.data || [];
    const dataRows = responseArray.filter(item => item.row).map(item => item.row);
    
    console.log("\n📊 Processing AdMob Response:");
    console.log("   Total response items:", responseArray.length);
    console.log("   Rows with data:", dataRows.length);
    
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalEarnings = 0;
    const dailyData = [];

    dataRows.forEach((row, idx) => {
      const date = row.dimensionValues?.DATE?.value || "";
      const platform = row.dimensionValues?.PLATFORM?.value || "Unknown";
      const metrics = row.metricValues || {};
      
      const impressions = parseInt(metrics.IMPRESSIONS?.integerValue || 0, 10);
      const clicks = parseInt(metrics.CLICKS?.integerValue || 0, 10);
      const earnings = parseFloat(
        metrics.ESTIMATED_EARNINGS?.microsValue
          ? metrics.ESTIMATED_EARNINGS.microsValue / 1000000
          : 0
      );

      const formattedDate = date.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");

      console.log(`   Row ${idx + 1}: Date=${formattedDate}, Platform=${platform}, Impressions=${impressions}, Revenue=$${earnings.toFixed(4)}`);

      totalImpressions += impressions;
      totalClicks += clicks;
      totalEarnings += earnings;

      dailyData.push({
        date: formattedDate,
        platform,
        impressions,
        clicks,
        revenue: earnings,
      });
    });

    console.log("\n📊 Final Totals for " + reportDate + ":");
    console.log("   Total Impressions:", totalImpressions);
    console.log("   Total Clicks:", totalClicks);
    console.log("   Total Revenue: $" + totalEarnings.toFixed(4));
    console.log("   Daily Data Rows:", dailyData.length);
    console.log("=".repeat(60) + "\n");

    return res.json({
      publisherId,
      impressions: totalImpressions,
      clicks: totalClicks,
      revenue: totalEarnings,
      reportDate: reportDate,
      period: reportDate,
      dailyData,
      rawResponse: response.data,
    });
  } catch (error) {
    console.error("❌ AdMob API Error:", error.message);
    console.error("📄 Full error:", error);

    let userMessage = "Failed to fetch AdMob data";
    if (error.message.includes("401") || error.message.includes("invalid_grant")) {
      userMessage = "OAuth token expired or invalid. Please refresh GOOGLE_REFRESH_TOKEN.";
      console.error("🔑 Token issue detected - refresh token may be invalid or expired");
    } else if (error.message.includes("403")) {
      userMessage = "Permission denied. Google account doesn't have access to this AdMob account.";
      console.error("🚫 Permission denied - check account access");
    } else if (error.message.includes("404")) {
      userMessage = "AdMob account not found. Check ADMOB_PUBLISHER_ID.";
      console.error("🔍 Account not found - publisher ID may be wrong");
    }

    res.status(500).json({
      error: true,
      message: userMessage,
      errorDetails: error.message,
    });
  }
});

app.get("/api/playstore/downloads", async (req, res) => {
  try {
    const bucketName = process.env.PLAYSTORE_BUCKET_NAME;
    const packageName = process.env.PLAYSTORE_PACKAGE_NAME;
    const serviceAccountPath = process.env.PLAYSTORE_SERVICE_ACCOUNT_PATH;

    if (!bucketName || !packageName || !serviceAccountPath) {
      return res.status(400).json({
        error: true,
        message:
          "Google Play credentials missing. Need: PLAYSTORE_BUCKET_NAME, PLAYSTORE_PACKAGE_NAME, PLAYSTORE_SERVICE_ACCOUNT_PATH",
      });
    }

    const keyFile = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    const auth = new google.auth.JWT({
      email: keyFile.client_email,
      key: keyFile.private_key,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    await auth.authorize();

    const storage = google.storage({ version: "v1", auth });

    const listResponse = await storage.objects.list({
      bucket: bucketName,
      prefix: "stats/installs/",
      maxResults: 10,
    });

    const files = listResponse.data?.items || [];

    if (files.length === 0) {
      return res.json({
        packageName,
        downloads: 0,
        message:
          "No reports available yet. Reports generate daily after Cloud Storage export is enabled in Play Console.",
      });
    }

    const latestFile = files.sort(
      (a, b) => new Date(b.updated) - new Date(a.updated)
    )[0];

    const fileResponse = await storage.objects.get(
      {
        bucket: bucketName,
        object: latestFile.name,
        alt: "media",
      },
      { responseType: "stream" }
    );

    let csvContent = "";
    for await (const chunk of fileResponse.data) {
      csvContent += chunk.toString();
    }

    const lines = csvContent.split("\n").filter((l) => l.trim());
    if (lines.length === 0) {
      return res.json({
        packageName,
        downloads: 0,
        message: "Report file is empty",
      });
    }

    const headers = lines[0].split(",");
    const installsIdx = headers.findIndex((h) =>
      h.toLowerCase().includes("install")
    );

    if (installsIdx === -1) {
      return res.json({
        packageName,
        downloads: 0,
        message: "No installs column found in report",
      });
    }

    let totalDownloads = 0;
    for (let i = 1; i < lines.length; i++) {
      const fields = lines[i].split(",");
      const installs = parseInt(fields[installsIdx] || "0", 10);
      if (!Number.isNaN(installs)) {
        totalDownloads += installs;
      }
    }

    return res.json({
      packageName,
      downloads: totalDownloads,
      lastUpdated: latestFile.updated,
      fileName: latestFile.name,
    });
  } catch (error) {
    console.error("Error fetching Play Store downloads:", error.message);

    let userMessage = "Failed to fetch Play Store downloads";
    if (error.message.includes("404")) {
      userMessage =
        "Cloud Storage bucket not found. Check PLAYSTORE_BUCKET_NAME in .env";
    } else if (error.message.includes("403")) {
      userMessage =
        "Permission denied. Service account needs 'Storage Object Viewer' role";
    }
    
    res.status(500).json({
      error: true,
      message: userMessage,
      errorDetails: error.message,
    });
  }
});

app.get("/api/adjust/report", async (req, res) => {
  try {
    const apiToken = process.env.ADJUST_API_TOKEN;
    const appTokenAndroid = process.env.ADJUST_APP_TOKEN_ANDROID;
    const appTokenIOS = process.env.ADJUST_APP_TOKEN_IOS;
    const videoViewToken = process.env.ADJUST_EVENT_TOKEN_VIDEO_VIEW;
    const firstInstallToken = process.env.ADJUST_EVENT_TOKEN_FIRST_INSTALL;
    
    const reportDate = req.query.date || (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().split("T")[0];
    })();

    console.log("🤖 Adjust API Request Started");
    console.log("   API Token:", apiToken ? `✅ SET` : "❌ MISSING");
    console.log("   App Token (Android):", appTokenAndroid || "❌ MISSING");
    console.log("   App Token (iOS):", appTokenIOS || "❌ MISSING");
    console.log("   Event Token (Video View):", videoViewToken || "❌ MISSING");
    console.log("   Event Token (First Install):", firstInstallToken || "❌ MISSING");
    console.log("   Report Date:", reportDate);

    if (!apiToken || !appTokenAndroid || !appTokenIOS) {
      return res.status(400).json({
        error: true,
        message: "Adjust credentials missing. Need: ADJUST_API_TOKEN, ADJUST_APP_TOKEN_ANDROID, ADJUST_APP_TOKEN_IOS",
      });
    }

    const appTokens = `${appTokenAndroid},${appTokenIOS}`;
    const eventTokens = [videoViewToken, firstInstallToken].filter(Boolean).join(',');
    
    // Use the requested single day (absolute range) per Adjust docs
    let url = `https://automate.adjust.com/reports-service/report?app_token__in=${encodeURIComponent(appTokens)}&date_period=${reportDate}:${reportDate}&dimensions=os_name,day&metrics=installs,video_view_events`;
    
    if (eventTokens) {
      url += `&event_token__in=${eventTokens}`;
    }
    
    console.log("📡 Calling Adjust API:");
    console.log("   URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("📥 Adjust API Response:");
    console.log("   Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Adjust API Error Response:", errorText);
      throw new Error(`Adjust API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Adjust API Success!");
    console.log("📦 Full Response:", JSON.stringify(data, null, 2));

    const rows = data?.rows || [];
    const androidRow = rows.find(r => r.os_name === "android");
    const iosRow = rows.find(r => r.os_name === "ios");

    let eventsData = {};
    if (eventTokens) {
      try {
        console.log("📡 Fetching Adjust custom events...");
        const eventsList = eventTokens.split(',');
        
        for (const eventToken of eventsList) {
          const eventsUrl = `https://automate.adjust.com/reports-service/report?app_token__in=${encodeURIComponent(appTokens)}&date_period=${reportDate}:${reportDate}&dimensions=os_name,day&metrics=installs,video_view_events`;
          
          const eventsResponse = await fetch(eventsUrl, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${apiToken}`,
              "Content-Type": "application/json",
            },
          });

          console.log(`📥 Event ${eventToken} Response Status:`, eventsResponse.status);
          
          if (eventsResponse.ok) {
            const eventData = await eventsResponse.json();
            console.log(`✅ Event ${eventToken} Success!`);
            console.log("📦 Event Response:", JSON.stringify(eventData, null, 2));
            eventsData[eventToken] = eventData;
          } else {
            const errorText = await eventsResponse.text();
            console.error(`❌ Event ${eventToken} failed:`, errorText);
          }
        }
      } catch (eventsError) {
        console.error("⚠️ Events fetch failed:", eventsError.message);
      }
    }

    return res.json({
      date: reportDate,
      android: {
        installs: parseInt(androidRow?.installs || 0, 10),
        sessions: parseInt(androidRow?.sessions || 0, 10),
        daus: parseFloat(androidRow?.daus || 0),
        revenue: parseFloat(androidRow?.revenue || 0),
        views: parseInt(androidRow?.video_view_events || 0, 10)
      },
      ios: {
        installs: parseInt(iosRow?.installs || 0, 10),
        sessions: parseInt(iosRow?.sessions || 0, 10),
        daus: parseFloat(iosRow?.daus || 0),
        revenue: parseFloat(iosRow?.revenue || 0),
        views: parseInt(iosRow?.video_view_events || 0, 10)
      },
      totals: data?.totals || {},
      events: eventsData,
      rawResponse: data,
    });
  } catch (error) {
    console.error("❌ Adjust Error:", error.message);
    console.error("📄 Full error:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch Adjust data",
      errorDetails: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
