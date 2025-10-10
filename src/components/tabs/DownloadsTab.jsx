import { useState, useEffect, useRef } from "react";
import "./ComingSoonTab.scss";

export const DownloadsTab = ({
  downloads,
  date,
  error,
  message,
  onDateChange,
  playstoreDownloads,
  playstoreError,
  playstoreMessage,
  playstoreLastUpdated,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    return d.toISOString().split("T")[0];
  });
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (date) {
      setSelectedDate(date);
    }
  }, [date]);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (newDate && newDate.length === 10) {
      debounceTimer.current = setTimeout(() => {
        if (onDateChange) {
          onDateChange(newDate);
        }
      }, 1500);
    }
  };

  const handleDateBlur = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    if (onDateChange && selectedDate && selectedDate.length === 10) {
      onDateChange(selectedDate);
    }
  };

  const handleDateKeyDown = (e) => {
    if (e.key === "Enter" && onDateChange && selectedDate && selectedDate.length === 10) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      onDateChange(selectedDate);
    }
  };

  const isReportNotAvailable =
    message?.includes("not available") || message?.includes("404");

  return (
    <div className="coming-soon-tab">
      <div className="coming-soon-content">
        <div className="icon">📥</div>
        <h3>App Store Downloads</h3>
        <div style={{ marginTop: "20px", marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Select Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            onBlur={handleDateBlur}
            onKeyDown={handleDateKeyDown}
            style={{
              padding: "8px",
              fontSize: "14px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>
        <p style={{ fontSize: "28px", margin: "8px 0" }}>{downloads || 0}</p>
        {date ? <p style={{ opacity: 0.8 }}>for {date}</p> : null}
        {isReportNotAvailable && (
          <p
            style={{
              fontSize: "13px",
              opacity: 0.6,
              marginTop: "12px",
              maxWidth: "400px",
            }}
          >
            Report not available for this date. Try selecting an earlier date
            (2-3 days ago).
          </p>
        )}
        {error && !isReportNotAvailable && (
          <p style={{ fontSize: "13px", color: "#d32f2f", marginTop: "12px" }}>
            {message || "Failed to load data"}
          </p>
        )}

        <div
          style={{
            marginTop: "40px",
            paddingTop: "40px",
            borderTop: "1px solid #e0e0e0",
          }}
        >
          <div className="icon">🤖</div>
          <h3>Google Play Downloads</h3>
          <p style={{ fontSize: "28px", margin: "8px 0" }}>
            {playstoreDownloads || 0}
          </p>
          {playstoreLastUpdated && (
            <p style={{ opacity: 0.8, fontSize: "14px" }}>
              Last updated:{" "}
              {new Date(playstoreLastUpdated).toLocaleDateString()}
            </p>
          )}
          {playstoreMessage && !playstoreError && (
            <p style={{ fontSize: "13px", opacity: 0.6, marginTop: "12px" }}>
              {playstoreMessage}
            </p>
          )}
          {playstoreError && (
            <p
              style={{ fontSize: "13px", color: "#d32f2f", marginTop: "12px" }}
            >
              {playstoreMessage || "Failed to load Play Store data"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
