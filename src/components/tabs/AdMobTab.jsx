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

  return (
    <div className="admob-tab">
      <div className="tab-section">
        <h3>AdMob Raw Data (Debugging)</h3>
        <div className="raw-data">
          <pre style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', overflow: 'auto' }}>
            {JSON.stringify(stats, null, 2)}
          </pre>
        </div>
      </div>

      <div className="tab-section">
        <h3>Quick Stats</h3>
        <p>Check the browser console and server logs to see the raw API response structure.</p>
      </div>
    </div>
  );
};
