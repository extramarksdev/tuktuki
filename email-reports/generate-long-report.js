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
    // keep original formatted strings (compat)
    downloads: fmtBreakdown(androidDownloads, iosDownloads),
    views: fmtBreakdown(androidViews, iosViews),
    impressions: fmtBreakdown(androidImpr, iosImpr),
    admobRevenue: fmtBreakdown(androidRevInr, iosRevInr),
    razorpayRevenue: rzRevenue !== null ? `₹${rzRevenue}` : "N/A",
    // numeric fields for tabular columns
    downloadsAndroid: androidDownloads ?? null,
    downloadsIOS: iosDownloads ?? null,
    downloadsTotal:
      androidDownloads !== null && iosDownloads !== null
        ? androidDownloads + iosDownloads
        : (androidDownloads ?? 0) + (iosDownloads ?? 0),
    viewsAndroid: androidViews ?? null,
    viewsIOS: iosViews ?? null,
    viewsTotal:
      androidViews !== null && iosViews !== null
        ? androidViews + iosViews
        : (androidViews ?? 0) + (iosViews ?? 0),
    impressionsAndroid: androidImpr ?? null,
    impressionsIOS: iosImpr ?? null,
    impressionsTotal:
      androidImpr !== null && iosImpr !== null
        ? androidImpr + iosImpr
        : (androidImpr ?? 0) + (iosImpr ?? 0),
    admobRevAndroid: androidRevInr ?? null,
    admobRevIOS: iosRevInr ?? null,
    admobRevTotal:
      androidRevInr !== null && iosRevInr !== null
        ? androidRevInr + iosRevInr
        : (androidRevInr ?? 0) + (iosRevInr ?? 0),
    razorpayTotal: rzRevenue ?? null,
  };
}

async function generateExcel(rows) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Last ${process.env.EXCEL_REPORT_DAYS_COUNT} days`);
  
    // Adjust column widths: increase razorpay to 22, others slightly reduced
    ws.columns = [
      { header: "Date", key: "date", width: 14 },          // reduced from 16
      { header: "Android", key: "downloadsAndroid", width: 12 }, //was 14
      { header: "iOS", key: "downloadsIOS", width: 10 },
      { header: "Total", key: "downloadsTotal", width: 12 },
      { header: "Android", key: "viewsAndroid", width: 12 },
      { header: "iOS", key: "viewsIOS", width: 10 },
      { header: "Total", key: "viewsTotal", width: 12 },
      { header: "Android", key: "impressionsAndroid", width: 14 },
      { header: "iOS", key: "impressionsIOS", width: 12 },
      { header: "Total", key: "impressionsTotal", width: 14 },
      { header: "Android", key: "admobRevAndroid", width: 14 },
      { header: "iOS", key: "admobRevIOS", width: 12 },
      { header: "Total", key: "admobRevTotal", width: 14 },
      { header: "Total", key: "razorpayTotal", width: 22 }, // increased from 18
    ];
  
    // First header row with merged section labels: include "Date" only once
    const hdr1 = ws.getRow(1);
    hdr1.values = [
      "Date", // Only one Date header here
      "App Download", "", "",
      "Episode View", "", "",
      "AdMob Impressions", "", "",
      "AdMob Revenue (INR)", "", "",
      "Revenue (Razorpay)",
    ];
    hdr1.height = 24;
    hdr1.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  
    // Merge section labels accordingly, Date cell not merged
    ws.mergeCells(1, 2, 1, 4);
    ws.mergeCells(1, 5, 1, 7);
    ws.mergeCells(1, 8, 1, 10);
    ws.mergeCells(1, 11, 1, 13);
    ws.mergeCells(1, 14, 1, 14);
  
    // Color bands for section labels with alignment
    const band = (startCol, endCol, color) => {
      for (let c = startCol; c <= endCol; c++) {
        const cell = ws.getCell(1, c);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    };
  
    const dateTitle = ws.getCell(1, 1);
    dateTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF263238" } };
    dateTitle.alignment = { horizontal: "center", vertical: "middle" };
  
    band(2, 4, "FF1F3A5F");      // App Download - deep blue (unchanged)
    band(5, 7, "FF2B2D42");      // Episode View - slate (unchanged)
    band(8, 10, "FF00796B");     // AdMob Impressions - muted teal
    band(11, 13, "FF455A64");    // AdMob Revenue - soft dark gray-blue
    band(14, 14, "FF37474F");    // Razorpay Revenue - dark slate gray
  
    // Second header row: remove "Date" from first cell to avoid duplicate
    const hdr2 = ws.getRow(2);
    hdr2.values = [
      "",  // Empty cell for the first column - Date is already in first row
      "Android", "iOS", "Total",
      "Android", "iOS", "Total",
      "Android", "iOS", "Total",
      "Android", "iOS", "Total",
      "Total",
    ];
    hdr2.height = 22;
    hdr2.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
    for (let c = 1; c <= 14; c++) {
      const cell = ws.getCell(2, c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF263238" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }
  
    // Data rows: black font + row height ~18
    rows.forEach((r) => {
      const row = ws.addRow({
        date: r.date,
        downloadsAndroid: r.downloadsAndroid ?? "N/A",
        downloadsIOS: r.downloadsIOS ?? "N/A",
        downloadsTotal: r.downloadsTotal ?? "N/A",
        viewsAndroid: r.viewsAndroid ?? "N/A",
        viewsIOS: r.viewsIOS ?? "N/A",
        viewsTotal: r.viewsTotal ?? "N/A",
        impressionsAndroid: r.impressionsAndroid ?? "N/A",
        impressionsIOS: r.impressionsIOS ?? "N/A",
        impressionsTotal: r.impressionsTotal ?? "N/A",
        admobRevAndroid: r.admobRevAndroid !== null ? `₹${r.admobRevAndroid}` : "N/A",
        admobRevIOS: r.admobRevIOS !== null ? `₹${r.admobRevIOS}` : "N/A",
        admobRevTotal: r.admobRevTotal !== null ? `₹${r.admobRevTotal}` : "N/A",
        razorpayTotal: r.razorpayTotal !== null ? `₹${r.razorpayTotal}` : "N/A",
      });
  
      row.eachCell((cell) => {
        cell.font = { color: { argb: "FF000000" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
      row.height = 18;
    });
  
    // Totals row with increased boldness and black text
    const sum = (arr, pick) => arr.reduce((s, x) => s + (Number.isFinite(pick(x)) ? pick(x) : 0), 0);
    const tDownloads = sum(rows, (r) => r.downloadsTotal ?? 0);
    const tViews = sum(rows, (r) => r.viewsTotal ?? 0);
    const tImpr = sum(rows, (r) => r.impressionsTotal ?? 0);
    const tAdm = sum(rows, (r) => r.admobRevTotal ?? 0);
    const tRz = sum(rows, (r) => r.razorpayTotal ?? 0);
  
    ws.addRow({});
    ws.addRow({});
  
    const totalRow = ws.addRow({
      date: "Total",
      downloadsAndroid: "",
      downloadsIOS: "",
      downloadsTotal: tDownloads,
      viewsAndroid: "",
      viewsIOS: "",
      viewsTotal: tViews,
      impressionsAndroid: "",
      impressionsIOS: "",
      impressionsTotal: tImpr,
      admobRevAndroid: "",
      admobRevIOS: "",
      admobRevTotal: `₹${tAdm}`,
      razorpayTotal: `₹${tRz}`,
    });
    totalRow.font = { bold: true, size: 12, color: { argb: "FF000000" } };
    totalRow.height = 18;
    totalRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFCCCCCC" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
  
    const out = path.join(__dirname, `${process.env.EXCEL_REPORT_DAYS_COUNT}-days-report.xlsx`);
    await wb.xlsx.writeFile(out);
    console.log(`✅ Excel written: ${out}`);
  }
  
  

async function main() {
  console.log("Generating last " + process.env.EXCEL_REPORT_DAYS_COUNT + " days report (IST)...");
  const dates = lastNDatesIST(process.env.EXCEL_REPORT_DAYS_COUNT);
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
