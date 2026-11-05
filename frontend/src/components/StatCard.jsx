const StatCard = ({ label, value, color, icon }) => {
    return (
        <div
            className="stats-card"
            style={{ "--card-color": color }}
        >
            <div className="stats-card-text">
                <span className="stats-card-label">{label}</span>
                <span className="stats-card-value">{value}</span>
            </div>
            {icon && <span className="stats-card-icon" aria-hidden="true">{icon}</span>}
        </div>
    );
};

export default StatCard;
