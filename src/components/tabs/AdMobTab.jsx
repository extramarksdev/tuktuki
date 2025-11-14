import { formatCurrency, formatNumber } from "../../utils/formatters.js";
import "./AdMobTab.scss";

export const AdMobTab = ({ stats, error, message }) => {
  if (error || !stats) {
    return (
      <div className="admob-tab">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Unable to Load AdMob Data</h3>
          <p className="error-message">
            {message || "Failed to fetch AdMob metrics. Please check your configuration."}
          </p>
          <div className="error-details">
            <h4>Possible reasons:</h4>
            <ul>
            <li>AdMob OAuth credentials not configured in .env</li>
            <li>The Google account used for OAuth lacks AdMob access</li>
            <li>AdMob API not enabled in Google Cloud Console</li>
            <li>Invalid Publisher ID</li>
            </ul>
          </div>
          <div className="error-help">
            <p>💡 Need help? Check the README for setup instructions.</p>
          </div>
        </div>
      </div>
    );
  }

  // Just display raw data for now
  console.log("📊 AdMob Stats received:", stats);

  const dailyData = stats?.dailyData || [];
  const USD_TO_INR = 88.5;
  const totalRevenueINR = (stats?.revenue || 0) * USD_TO_INR;

  return (
    <div className="admob-tab">
      <div className="tab-section">
        <h3>AdMob Summary ({stats?.period || "last 30 days"})</h3>
        <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
          <div style={{ padding: "20px", background: "#f5f5f5", borderRadius: "8px", flex: 1 }}>
            <div style={{ fontSize: "14px", opacity: 0.7 }}>Impressions</div>
            <div style={{ fontSize: "28px", marginTop: "8px" }}>{formatNumber(stats?.impressions || 0)}</div>
          </div>
          <div style={{ padding: "20px", background: "#f5f5f5", borderRadius: "8px", flex: 1 }}>
            <div style={{ fontSize: "14px", opacity: 0.7 }}>Clicks</div>
            <div style={{ fontSize: "28px", marginTop: "8px" }}>{formatNumber(stats?.clicks || 0)}</div>
          </div>
          <div style={{ padding: "20px", background: "#f5f5f5", borderRadius: "8px", flex: 1 }}>
            <div style={{ fontSize: "14px", opacity: 0.7 }}>Revenue (INR)</div>
            <div style={{ fontSize: "28px", marginTop: "8px" }}>₹{formatNumber(totalRevenueINR.toFixed(2))}</div>
            <div style={{ fontSize: "12px", opacity: 0.6, marginTop: "4px" }}>
              ${(stats?.revenue || 0).toFixed(2)} USD
            </div>
          </div>
        </div>
      </div>

      {dailyData.length > 0 && (
        <div className="tab-section" style={{ marginTop: "30px" }}>
          <h3>Daily Breakdown</h3>
          <div style={{ overflowX: "auto", marginTop: "20px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Platform</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>Impressions</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>Clicks</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {dailyData.map((day, idx) => {
                  const revenueINR = day.revenue * USD_TO_INR;
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px" }}>{day.date}</td>
                      <td style={{ padding: "12px" }}>
                        {day.platform === "PLATFORM_IOS" ? "📱 iOS" : 
                         day.platform === "PLATFORM_ANDROID" ? "🤖 Android" : 
                         day.platform}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>{formatNumber(day.impressions)}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>{formatNumber(day.clicks)}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        ₹{formatNumber(revenueINR.toFixed(2))}
                        <div style={{ fontSize: "11px", opacity: 0.5 }}>${day.revenue.toFixed(2)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
