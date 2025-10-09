import { MetricsTable } from '../shared/MetricsTable.jsx';
import './OverviewTab.scss';

export const OverviewTab = ({ metrics }) => {
  return (
    <div className="overview-tab">
      <div className="tab-section">
        <h3>All Metrics Overview</h3>
        <MetricsTable metrics={metrics} loading={false} error={null} />
      </div>
    </div>
  );
};

