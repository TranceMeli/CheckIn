import { useState, useEffect } from "react";
import { api } from "../api/api";
import "../styles/dashboard.css";
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
    Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from "recharts";
import StatCard from "../components/StatCard";

const FARBEN = {
    HomeOffice: "#F59E0B",
    Office:     "#0D9488",
    Abwesend:   "#EF4444",
};

const JAHRE = [2024, 2025, 2026];
const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div style={{
                background: "#fff", border: "1.5px solid #D1E8E6",
                borderRadius: 8, padding: "10px 14px", fontSize: 13
            }}>
                <p style={{ margin: 0, fontWeight: 600, color: "#263445" }}>{label}</p>
                {payload.map(p => (
                    <p key={p.name} style={{ margin: "4px 0 0", color: p.fill ?? p.color }}>
                        {p.name}: <strong>{p.value}</strong>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
            fontSize={12} fontWeight={600}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

function AdminDashboard() {
    const [mitarbeiter, setMitarbeiter] = useState([]);
    const [abteilungen, setAbteilungen] = useState([]);
    const [stats, setStats] = useState(null);
    const [abteilungStats, setAbteilungStats] = useState([]);
    const [loading, setLoading] = useState(false);

    const [filter, setFilter] = useState({
        abteilung: "",
        userId: "",
        monat: new Date().getMonth() + 1,
        jahr: new Date().getFullYear(),
    });

    useEffect(() => {
        api.get("/User")
            .then(res => {
                setMitarbeiter(res.data);
                const unique = [...new Set(res.data.map(u => u.abteilung).filter(Boolean))].sort();
                setAbteilungen(unique);
            })
            .catch(err => console.log(err));
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        const params = new URLSearchParams();
        if (filter.abteilung) params.append("abteilung", filter.abteilung);
        if (filter.userId) params.append("userId", filter.userId);
        if (filter.monat) params.append("monat", filter.monat);
        if (filter.jahr) params.append("jahr", filter.jahr);

        api.get(`/User/stats?${params.toString()}`)
            .then(res => setStats(res.data))
            .catch(err => console.log(err))
            .finally(() => setLoading(false));
    }, [filter]);

    useEffect(() => {
        const params = new URLSearchParams();
        if (filter.monat) params.append("monat", filter.monat);
        if (filter.jahr) params.append("jahr", filter.jahr);

        api.get(`/User/stats/abteilungen?${params.toString()}`)
            .then(res => setAbteilungStats(res.data))
            .catch(err => console.error(err));
    }, [filter.monat, filter.jahr]);

    const handleFilter = (e) => {
        const { name, value } = e.target;
        if (name === "userId" && value) {
            setFilter({ ...filter, userId: value, abteilung: "" });
        } else if (name === "abteilung") {
            setFilter({ ...filter, abteilung: value, userId: "" });
        } else {
            setFilter({ ...filter, [name]: value });
        }
    };

    const handleReset = () => setFilter({
        abteilung: "", userId: "",
        monat: new Date().getMonth() + 1,
        jahr: new Date().getFullYear(),
    });

    const gefilterteMitarbeiter = filter.abteilung
        ? mitarbeiter.filter(m => m.abteilung === filter.abteilung)
        : mitarbeiter;

    const selectedMitarbeiter = mitarbeiter.find(m => m.id === filter.userId);

    const pieData = stats ? [
        { name: "Home Office", value: stats.homeOfficeCount },
        { name: "Office",      value: stats.officeCount },
        { name: "Abwesend",    value: stats.abwesendCount },
    ].filter(d => d.value > 0) : [];

    const pieColors = { "Home Office": FARBEN.HomeOffice, Office: FARBEN.Office, Abwesend: FARBEN.Abwesend };

    const pieTitle = selectedMitarbeiter
        ? `${selectedMitarbeiter.firstName} ${selectedMitarbeiter.lastName}`
        : filter.abteilung ? filter.abteilung : "Alle Mitarbeiter";

    const statItems = stats ? [
        { key: "office",     label: "Office",      value: stats.officeCount,     color: FARBEN.Office },
        { key: "homeOffice", label: "Home Office",  value: stats.homeOfficeCount, color: FARBEN.HomeOffice },
        { key: "abwesend",   label: "Abwesend",     value: stats.abwesendCount,   color: FARBEN.Abwesend },
    ] : [];

    return (
        <div className="dashboard">
            <h1>Auswertungen</h1>

            <div className="filter-row">
                <select name="abteilung" value={filter.abteilung} onChange={handleFilter}>
                    <option value="">Alle Abteilungen</option>
                    {abteilungen.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select name="userId" value={filter.userId} onChange={handleFilter}>
                    <option value="">Alle Mitarbeiter</option>
                    {gefilterteMitarbeiter.map(m => (
                        <option key={m.id} value={m.id}>
                            {m.firstName} {m.lastName} ({m.abteilung})
                        </option>
                    ))}
                </select>
                <select name="monat" value={filter.monat} onChange={handleFilter}>
                    <option value="">Alle Monate</option>
                    {MONATE.map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                </select>
                <select name="jahr" value={filter.jahr} onChange={handleFilter}>
                    {JAHRE.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
                <button onClick={handleReset}>Zurücksetzen</button>
            </div>

            {loading && <p style={{ color: "#5E7B7A", padding: "8px 0" }}>Lädt...</p>}

            {stats && !loading && (
                <>
                    <div className="stats-cards">
                        <StatCard label="Gesamt" value={stats.total} />
                        {statItems.map(item => (
                            <StatCard key={item.key} label={item.label} value={item.value} color={item.color} />
                        ))}
                    </div>

                    <div className="charts-row">
                        <div className="chart-box">
                            <h3>{pieTitle} – {filter.monat ? MONATE[filter.monat - 1] : "Gesamt"} {filter.jahr}</h3>
                            {pieData.length === 0 ? (
                                <p style={{ textAlign: "center", color: "#5E7B7A", padding: 40 }}>
                                    Keine Einträge
                                </p>
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={95}
                                            paddingAngle={3}
                                            labelLine={false}
                                            label={CustomPieLabel}
                                        >
                                            {pieData.map(entry => (
                                                <Cell key={entry.name} fill={pieColors[entry.name]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend formatter={(value) => (
                                            <span style={{ fontSize: 13, color: "#263445" }}>{value}</span>
                                        )} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="chart-box">
                            <h3>Vergleich pro Abteilung – {filter.monat ? MONATE[filter.monat - 1] : "Gesamt"} {filter.jahr}</h3>
                            {abteilungStats.length === 0 ? (
                                <p style={{ textAlign: "center", color: "#5E7B7A", padding: 40 }}>
                                    Keine Daten
                                </p>
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart
                                        data={abteilungStats}
                                        margin={{ top: 8, right: 8, left: -16, bottom: 4 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E0F0EE" vertical={false} />
                                        <XAxis dataKey="abteilung" tick={{ fontSize: 11, fill: "#5E7B7A" }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#5E7B7A" }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend formatter={(value) => (
                                            <span style={{ fontSize: 13, color: "#263445" }}>{value}</span>
                                        )} />
                                        <Bar dataKey="homeOffice" name="Home Office" fill={FARBEN.HomeOffice} radius={[4,4,0,0]} />
                                        <Bar dataKey="office"     name="Office"      fill={FARBEN.Office}     radius={[4,4,0,0]} />
                                        <Bar dataKey="abwesend"   name="Abwesend"    fill={FARBEN.Abwesend}   radius={[4,4,0,0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default AdminDashboard;