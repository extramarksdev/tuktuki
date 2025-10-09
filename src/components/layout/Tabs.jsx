import { TABS, TAB_LABELS } from "../../constants/tabs.js";
import "./Tabs.scss";

export const Tabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    TABS.RAZORPAY,
    TABS.ADMOB,
    TABS.DOWNLOADS,
    TABS.EPISODES,
    TABS.OVERVIEW,
  ];

  return (
    <div className="tabs">
      <div className="tabs-container">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => onTabChange(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
    </div>
  );
};
