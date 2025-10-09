import './ComingSoonTab.scss';

export const ComingSoonTab = ({ title }) => {
  return (
    <div className="coming-soon-tab">
      <div className="coming-soon-content">
        <div className="icon">🚧</div>
        <h3>{title}</h3>
        <p>This feature is coming soon. API integration pending.</p>
      </div>
    </div>
  );
};

