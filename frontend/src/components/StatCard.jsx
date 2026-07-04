const StatCard = ({ label, value, color}) => {
    return (
        <div 
        className="stats-card"
        style={{ "--card-color": color}}
         >
            <span className="stats-card-label">{label}</span>
            <span className="stats-card-value"
            >
                {value}
            </span>
        </div>

    );
};

export default StatCard;