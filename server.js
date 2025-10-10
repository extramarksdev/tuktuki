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

    console.log("📊 AdMob API Request Started");
    console.log("   Publisher ID:", publisherId || "❌ MISSING");
    console.log("   Client ID:", clientId ? "✅ SET" : "❌ MISSING");
    console.log("   Client Secret:", clientSecret ? "✅ SET" : "❌ MISSING");
    console.log("   Refresh Token:", refreshToken || "❌ MISSING");
    console.log("   ttttttttt Full Refresh Token:", refreshToken);

    if (!publisherId || !clientId || !clientSecret || !refreshToken) {
      return res.status(400).json({
        error: true,
        message:
          "AdMob OAuth credentials missing. Need: ADMOB_PUBLISHER_ID, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN",
      });
    }

    console.log("🔐 Creating OAuth2 client...");
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    oauth2Client.on('tokens', (tokens) => {
      console.log("🔄 ttttttttt New access token obtained from refresh token!");
      console.log("   Access Token:", tokens.access_token ? `✅ ${tokens.access_token.substring(0, 30)}...` : "❌");
      console.log("   Expires in:", tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : "unknown");
      if (tokens.refresh_token) {
        console.log("   New Refresh Token received:", tokens.refresh_token.substring(0, 30) + "...");
      }
    });

    console.log("✅ OAuth2 client configured with refresh token");
    console.log("📡 Initializing AdMob API client...");
    const admob = google.admob({ version: "v1", auth: oauth2Client });

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    console.log(`📅 Fetching AdMob data from ${thirtyDaysAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);
    console.log(`🎯 Target account: accounts/${publisherId}`);

    const response = await admob.accounts.networkReport.generate({
      parent: `accounts/${publisherId}`,
      requestBody: {
        reportSpec: {
          dateRange: {
            startDate: {
              year: thirtyDaysAgo.getFullYear(),
              month: thirtyDaysAgo.getMonth() + 1,
              day: thirtyDaysAgo.getDate(),
            },
            endDate: {
              year: today.getFullYear(),
              month: today.getMonth() + 1,
              day: today.getDate(),
            },
          },
          metrics: ["IMPRESSIONS", "CLICKS", "ESTIMATED_EARNINGS"],
          dimensions: ["DATE", "PLATFORM"],
        },
      },
    });

    console.log("✅ AdMob API call successful!");
    console.log("📦 Full Response Object:", JSON.stringify(response.data, null, 2));

    const responseArray = response.data || [];
    const dataRows = responseArray.filter(item => item.row).map(item => item.row);
    
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalEarnings = 0;
    const dailyData = [];

    dataRows.forEach((row) => {
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

      totalImpressions += impressions;
      totalClicks += clicks;
      totalEarnings += earnings;

      dailyData.push({
        date: date.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
        platform,
        impressions,
        clicks,
        revenue: earnings,
      });
    });

    console.log("📊 Parsed totals:");
    console.log("   Impressions:", totalImpressions);
    console.log("   Clicks:", totalClicks);
    console.log("   Revenue:", totalEarnings);

    return res.json({
      publisherId,
      impressions: totalImpressions,
      clicks: totalClicks,
      revenue: totalEarnings,
      period: "last 30 days",
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

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
