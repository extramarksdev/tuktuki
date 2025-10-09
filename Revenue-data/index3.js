import jwt from 'jsonwebtoken';
import https from 'node:https';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { URLSearchParams } from 'node:url';




// Configuration - Replace with your values
const ISSUER_ID = '186f3bde-05a9-43e3-b21d-3144be9f7a69'
const KEY_ID = 'AWZPK9N2BZ'
 const PRIVATE_KEY_STRING = fs.readFileSync('/home/abhishek/Desktop/Revenue-data/AuthKey_AWZPK9N2BZ.p8', 'utf8');

const VENDOR_NUMBER = '6900001234'
const REPORT_DATE = '2025-08-04' //YYY-MM-DD format (Pacific Time)
const APP_PRODUCT_ID = '6749609337';

// Generate JWT token (expires in 20 min)
function generateToken() {
  const payload = {
    iss: ISSUER_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (20 * 60), // 20 minutes
    aud: 'appstoreconnect-v1'
  };
  return jwt.sign(payload, PRIVATE_KEY_STRING, { algorithm: 'ES256', header: { kid: KEY_ID, typ: 'JWT' } });
}

// Fetch report from API
function fetchReport(token, callback) {
  const queryParams = {
    'filter[frequency]': 'DAILY',
    'filter[reportDate]': REPORT_DATE,
    'filter[reportSubType]': 'SUMMARY',
    'filter[reportType]': 'SALES',
    'filter[vendorNumber]': VENDOR_NUMBER,
    'filter[version]': '1_0' // Or '1_3' for newer format
  };
  const queryString = new URLSearchParams(queryParams).toString();
  const options = {
    hostname: 'api.appstoreconnect.apple.com',
    port: 443,
    path: `/v1/salesReports?${queryString}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  https.get(options, (res) => {
    let data = [];
    res.on('data', (chunk) => data.push(chunk));
    res.on('end', () => {
      const buffer = Buffer.concat(data);
      zlib.gunzip(buffer, (err, decompressed) => {
        if (err) {
          callback(err, null);
          return;
        }
        const tsvContent = decompressed.toString('utf-8'); // Or use iconv-lite for encoding issues
        callback(null, tsvContent);
      });
    });
  }).on('error', callback);
}

// Parse TSV and sum downloads (Units) for your app
function parseDownloads(tsvContent, productId) {
  const lines = tsvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split('\t');
  const unitsIndex = headers.indexOf('Units');
  const productIdIndex = headers.indexOf('Product Identifier');
  const productTypeIndex = headers.indexOf('Product Type Identifier');

  if (unitsIndex === -1 || productIdIndex === -1) {
    throw new Error('Required columns not found in report');
  }

  let totalDownloads = 0;
  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i].split('\t');
    const appProduct = fields[productIdIndex];
    const productType = fields[productTypeIndex];
    const units = parseInt(fields[unitsIndex] || 0, 10);

    // Filter for app downloads (Product Type '1' for iOS app sales/downloads)
    if (appProduct === productId && productType === '1' && !isNaN(units)) {
      totalDownloads += units;
    }
  }
  return totalDownloads;
}

// Main execution
const token = generateToken();
fetchReport(token, (err, tsvContent) => {
  if (err) {
    console.error('Error fetching report:', err);
    return;
  }
  try {
    const downloads = parseDownloads(tsvContent, APP_PRODUCT_ID);
    console.log(`Total downloads for ${REPORT_DATE}: ${downloads}`);
  } catch (parseErr) {
    console.error('Error parsing report:', parseErr);
  }
});