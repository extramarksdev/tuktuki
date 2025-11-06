import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import ExcelJS from "exceljs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const API_BASE = process.env.API_BASE_URL || "http://localhost:8888/api";

async function safeFetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  }
}

function getISTDate(daysAgo = 0) {
  const nowStr = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
  });
  const d = new Date(nowStr);
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function lastNDatesIST(n) {
  const out = [];
  for (let i = 1; i <= n; i++) out.push(getISTDate(i));
  return out;
}

function fmtBreakdown(android, ios) {
  const hasAndroid = android !== null && android !== undefined;
  const hasIos = ios !== null && ios !== undefined;
  if (!hasAndroid && !hasIos) return "N/A";
  const a = hasAndroid ? android : 0;
  const i = hasIos ? ios : 0;
  return `${a} + ${i} = ${a + i}`;
}

async function fetchForDate(date) {
  const [adjustData, admobData, razorpay] = await Promise.all([
    safeFetchJson(`${API_BASE}/adjust/report?date=${date}`),
    safeFetchJson(`${API_BASE}/admob/report?date=${date}`),
    safeFetchJson(`${API_BASE}/razorpay/payments?date=${date}`),
  ]);

  // Adjust (downloads, views)
  const androidDownloads = adjustData?.android?.installs ?? null;
  const iosDownloads = adjustData?.ios?.installs ?? null;
  const androidViews = adjustData?.android?.views ?? null;
  const iosViews = adjustData?.ios?.views ?? null;

  // AdMob (impressions, revenue)
  const daily = admobData?.dailyData || [];
  const dayRows = daily.filter((r) => r.date === date);
  const admobAndroid =
    dayRows.find(
      (r) => r.platform === "Android" || r.platform === "PLATFORM_ANDROID"
    ) || null;
  const admobIos =
    dayRows.find(
      (r) => r.platform === "iOS" || r.platform === "PLATFORM_IOS"
    ) || null;

  const androidImpr = admobAndroid?.impressions ?? null;
  const iosImpr = admobIos?.impressions ?? null;
  const androidRevUsd = admobAndroid?.revenue ?? null;
  const iosRevUsd = admobIos?.revenue ?? null;
  const usdToInr = 83.5;
  const androidRevInr =
    androidRevUsd !== null && androidRevUsd !== undefined
      ? Math.round(androidRevUsd * usdToInr)
      : null;
  const iosRevInr =
    iosRevUsd !== null && iosRevUsd !== undefined
      ? Math.round(iosRevUsd * usdToInr)
      : null;

  // Razorpay (revenue)
  const reportLocalDate = new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-IN"
  );
  const payments = razorpay?.items || [];
  const dayPayments = payments.filter((p) => {
    const createdLocal = new Date(p.created_at * 1000).toLocaleDateString(
      "en-IN"
    );
    return (
      createdLocal === reportLocalDate &&
      (p.status === "captured" || p.status === "authorized")
    );
  });
  const rzRevenue = dayPayments.length
    ? Math.round(dayPayments.reduce((s, p) => s + (p.amount || 0), 0) / 100)
    : null;

  return {
    date,
    downloads: fmtBreakdown(androidDownloads, iosDownloads),
    views: fmtBreakdown(androidViews, iosViews),
    impressions: fmtBreakdown(androidImpr, iosImpr),
    admobRevenue: fmtBreakdown(androidRevInr, iosRevInr),
    razorpayRevenue: rzRevenue !== null ? `₹${rzRevenue}` : "N/A",
  };
}

async function generateExcel(rows) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Last 60 Days");

  ws.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Total Downloads", key: "downloads", width: 26 },
    { header: "Episode Views", key: "views", width: 24 },
    { header: "AdMob Impressions", key: "impressions", width: 26 },
    { header: "AdMob Revenue (INR)", key: "admobRevenue", width: 26 },
    { header: "Revenue (Razorpay)", key: "razorpayRevenue", width: 22 },
  ];

  ws.getRow(1).font = { bold: true };

  rows.forEach((r) => ws.addRow(r));

  // Compute totals from the formatted strings
  const pickTotal = (val) => {
    if (!val || val === "N/A") return 0;
    const str = String(val);
    const m = str.match(/=\s*([0-9]+)/); // handles "a + b = total"
    if (m) return parseInt(m[1], 10) || 0;
    const digits = str.replace(/[^0-9]/g, ""); // handles "₹1234"
    return digits ? parseInt(digits, 10) : 0;
  };

  let totalDownloads = 0;
  let totalViews = 0;
  let totalImpressions = 0;
  let totalAdmobRevenue = 0;
  let totalRazorpay = 0;

  for (const r of rows) {
    totalDownloads += pickTotal(r.downloads);
    totalViews += pickTotal(r.views);
    totalImpressions += pickTotal(r.impressions);
    totalAdmobRevenue += pickTotal(r.admobRevenue);
    totalRazorpay += pickTotal(r.razorpayRevenue);
  }

  // Add spacing and totals row
  ws.addRow({});
  ws.addRow({});
  const totalRow = ws.addRow({
    date: "Total",
    downloads: totalDownloads,
    views: totalViews,
    impressions: totalImpressions,
    admobRevenue: `₹${totalAdmobRevenue}`,
    razorpayRevenue: `₹${totalRazorpay}`,
  });
  totalRow.font = { bold: true };

  const out = path.join(__dirname, "60-days-report.xlsx");
  // Center-align all cells for a cleaner look
  ws.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
  });
  await wb.xlsx.writeFile(out);
  console.log(`✅ Excel written: ${out}`);
}

async function main() {
  console.log("Generating last 60 days report (IST)...");
  const dates = lastNDatesIST(62);
  const result = [];
  for (const d of dates) {
    const row = await fetchForDate(d);
    result.push(row);
    await new Promise((r) => setTimeout(r, 300));
  }
  await generateExcel(result);
}

main().catch((e) => {
  console.error("Failed:", e?.message || e);
  process.exit(1);
});
