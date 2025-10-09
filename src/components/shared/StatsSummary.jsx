import { formatNumber, formatCurrency } from "../../utils/formatters.js";
import "./StatsSummary.scss";

export const StatsSummary = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="stats-summary">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Subscriptions</div>
          <div className="stat-value">{formatNumber(stats.total)}</div>
        </div>

        <div className="stat-card active">
          <div className="stat-label">Active</div>
          <div className="stat-value">{formatNumber(stats.active)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Created</div>
          <div className="stat-value">{formatNumber(stats.created)}</div>
        </div>

        <div className="stat-card completed">
          <div className="stat-label">Completed</div>
          <div className="stat-value">{formatNumber(stats.completed)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Paid Cycles</div>
          <div className="stat-value">{formatNumber(stats.totalPaid)}</div>
        </div>

        <div className="stat-card revenue">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">{formatCurrency(stats.revenue)}</div>
        </div>
      </div>
    </div>
  );
};
