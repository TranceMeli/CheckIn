const Unauthorized = () => (
    <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "60vh", gap: 12, color: "#5E7B7A"
    }}>
        <h2 style={{ color: "#EF4444", margin: 0 }}>Kein Zugriff</h2>
        <p style={{ margin: 0, fontSize: 14 }}>Du hast keine Berechtigung für diese Seite.</p>
    </div>
);

export default Unauthorized;