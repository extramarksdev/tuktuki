import { METRIC_LABELS, METRIC_SOURCES } from "../../constants/metrics.js";
import { formatCurrency, formatNumber } from "../../utils/formatters.js";
import "./MetricsTable.scss";

export const MetricsTable = ({ metrics, loading, error }) => {
  if (loading) {
    return <div className="metrics-table-loading">Loading metrics...</div>;
  }

  if (error) {
    return (
      <div className="metrics-table-error">Error loading metrics: {error}</div>
    );
  }

  const formatValue = (metricType, value) => {
    if (metricType.includes("revenue")) {
      return formatCurrency(value);
    }
    return formatNumber(value);
  };

  return (
    <div className="metrics-table-container">
      <table className="metrics-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Source</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(metrics).map(([metricType, data]) => (
            <tr
              key={metricType}
              className={data.disabled ? "row-disabled" : ""}
            >
              <td className="metric-label">{METRIC_LABELS[metricType]}</td>
              <td className="metric-value">
                {formatValue(metricType, data.value)}
              </td>
              <td className="metric-source">{METRIC_SOURCES[metricType]}</td>
              <td className="metric-status">
                {data.error ? (
                  <span className="status-error">Error</span>
                ) : data.disabled ? (
                  <span className="status-disabled">Mock Data</span>
                ) : (
                  <span className="status-success">Live</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
