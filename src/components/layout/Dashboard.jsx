import { useState, useEffect } from "react";
import { Tabs } from "./Tabs.jsx";
import { RazorpayTab } from "../tabs/RazorpayTab.jsx";
import { OverviewTab } from "../tabs/OverviewTab.jsx";
import { ComingSoonTab } from "../tabs/ComingSoonTab.jsx";
import { DownloadsTab } from "../tabs/DownloadsTab.jsx";
import { fetchAllMetrics } from "../../services/metrics.service.js";
import { TABS } from "../../constants/tabs.js";
import "./Dashboard.scss";

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.RAZORPAY);
  const [selectedDate, setSelectedDate] = useState(null);

  const loadMetrics = async (date = null) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAllMetrics(date);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    loadMetrics(newDate);
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <p>Error loading data: {error}</p>
        </div>
      );
    }

    switch (activeTab) {
      case TABS.RAZORPAY:
        return (
          <RazorpayTab
            stats={data?.razorpayStats}
            subscriptions={data?.razorpaySubscriptions}
            paymentStats={data?.paymentStats}
          />
        );
      case TABS.ADMOB:
        return <ComingSoonTab title="Google AdMob Metrics" />;
      case TABS.DOWNLOADS:
        return (
          <DownloadsTab
            downloads={data?.metrics?.downloads?.value}
            date={data?.appstoreDate}
            error={data?.metrics?.downloads?.error}
            message={data?.metrics?.downloads?.message}
            onDateChange={handleDateChange}
            playstoreDownloads={data?.playstoreDownloads}
            playstoreError={data?.playstoreError}
            playstoreMessage={data?.playstoreMessage}
            playstorePeriod={data?.playstorePeriod}
          />
        );
      case TABS.EPISODES:
        return <ComingSoonTab title="Episode Views" />;
      case TABS.OVERVIEW:
        return <OverviewTab metrics={data?.metrics} />;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Tuktuki Dashboard</h1>
        <button
          onClick={loadMetrics}
          className="refresh-button"
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      <main className="dashboard-content">
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="tab-content">{renderTabContent()}</div>
      </main>
    </div>
  );
};
