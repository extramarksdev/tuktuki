// Your Apple credentials
import fs from "fs";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

const issuerId = "186f3bde-05a9-43e3-b21d-3144be9f7a69";
const keyId = "AWZPK9N2BZ";
const privateKeyPath = "./AuthKey_AWZPK9N2BZ.p8";
const appId = "6749609337"; // App Store Connect app ID

// Read private key
const privateKey = fs.readFileSync(privateKeyPath, "utf8");

// Generate JWT




// Generate JWT
function generateToken() {
    return jwt.sign({}, privateKey, {
        algorithm: "ES256",
        issuer: issuerId,
        header: { alg: "ES256", kid: keyId, typ: "JWT" },
        expiresIn: "20m",
    });
}

// Fetch downloads/units for a specific date
async function getUnitsByDate(dateStr) {
    try {
        const token = generateToken();

        // Use URLSearchParams to avoid invalid syntax
        const params = new URLSearchParams({
            'filter[reportDate]': dateStr,
            'filter[reportType]': 'sales',
            'filter[reportSubType]': 'summary',
            'filter[frequency]': 'DAILY'
        });

        const url = `https://api.appstoreconnect.apple.com/v1/salesReports?${params.toString()}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();
        console.log("Units/Downloads Data:", data);

    } catch (error) {
        console.error("Error fetching units/downloads:", error);
    }
}

// Example usage
getUnitsByDate("2025-10-01");