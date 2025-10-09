import { StatsSummary } from "../shared/StatsSummary.jsx";
import { formatCurrency } from "../../utils/formatters.js";
import "./RazorpayTab.scss";

export const RazorpayTab = ({ stats, subscriptions, paymentStats }) => {
  return (
    <div className="razorpay-tab">
      <div className="tab-section">
        <h3>Subscription Statistics</h3>
        <StatsSummary stats={stats} />
      </div>

      {paymentStats &&
        paymentStats.byDate &&
        paymentStats.byDate.length > 0 && (
          <div className="tab-section">
            <h3>Revenue by Date</h3>
            <div className="revenue-by-date-container">
              <table className="revenue-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Payments</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentStats.byDate.map((dayData) => (
                    <tr key={dayData.date}>
                      <td className="date-cell">{dayData.date}</td>
                      <td className="count-cell">{dayData.count}</td>
                      <td className="revenue-cell">
                        {formatCurrency(dayData.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {subscriptions && subscriptions.length > 0 && (
        <div className="tab-section">
          <h3>Recent Subscriptions</h3>
          <div className="subscriptions-table-container">
            <table className="subscriptions-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Plan ID</th>
                  <th>Status</th>
                  <th>Total Count</th>
                  <th>Paid Count</th>
                  <th>Remaining</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.slice(0, 10).map((sub) => (
                  <tr key={sub.id}>
                    <td className="sub-id">{sub.id}</td>
                    <td className="plan-id">{sub.plan_id}</td>
                    <td>
                      <span className={`status-badge ${sub.status}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td>{sub.total_count}</td>
                    <td className="paid-count">{sub.paid_count}</td>
                    <td>{sub.remaining_count}</td>
                    <td>
                      {new Date(sub.created_at * 1000).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
