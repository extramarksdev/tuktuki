import fs from "fs";
import { JWT } from "google-auth-library";

async function getPlayDownloads() {
  const packageName = "com.tuktuki.app"; // 👈 your app ID

  // Load service account JSON
  const key = JSON.parse(fs.readFileSync("./service-account.json", "utf8"));

  // ✅ Create a JWT client — this is already the authenticated client
  const auth = new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ["https://www.googleapis.com/auth/playdeveloperreporting"],
  });

  console.log(key.client_email);

  // Example endpoint: crash rate metrics
  const url = `https://playdeveloperreporting.googleapis.com/v1beta1/apps/${packageName}/crashRateMetrics:query`;

  const body = {
    metrics: ["crashRate"],
    timelineSpec: {
      aggregationPeriod: "DAILY",
      startTime: "2025-09-01T00:00:00Z",
      endTime: "2025-10-01T00:00:00Z",
    },
  };

  // ✅ Make request directly using auth.request()
  const res = await auth.request({
    url,
    method: "POST",
    data: body,
  });

  console.log(JSON.stringify(res.data.body, null, 2));
}

getPlayDownloads().catch(console.error);
