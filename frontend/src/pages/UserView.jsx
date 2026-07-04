import { api } from "../api/api";

import { useState, useEffect } from "react";
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, XAxis, YAxis, Legend, Bar, CartesianGrid
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
                    <p key={p.name} style={{ margin: "4px 0 0", color: p.fill }}>
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

function UserView() {
    
    const [stats, setStats] = useState(null);
    const [gesamtStats, setGesamtStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const [filter, setFilter] = useState({
        monat: new Date().getMonth() + 1,
        jahr: new Date().getFullYear(),
    });

    const handleFilter = (e) => {
        const { name, value } = e.target;
        setFilter(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        const params = new URLSearchParams();
        if (filter.monat) params.append("monat", filter.monat);
        if (filter.jahr) params.append("jahr", filter.jahr);

        api.get(`/CheckIn/stats/me?${params.toString()}`)
            .then(res => setStats(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [filter]);

    useEffect(() => {
        const params = new URLSearchParams();
        params.append("jahr", filter.jahr);
        api.get(`/CheckIn/stats/me?${params.toString()}`)
            .then(res => setGesamtStats(res.data))
            .catch(err => console.error(err));
    }, [filter.jahr]);

    if (loading) return <p style={{ padding: 24, color: "#5E7B7A" }}>Lädt...</p>;
    if (!stats) return <p style={{ padding: 24, color: "#5E7B7A" }}>Keine Daten verfügbar</p>;

    const pieData = [
        { name: "Home Office", value: gesamtStats?.homeOfficeCount ?? 0 },
        { name: "Office",      value: gesamtStats?.officeCount ?? 0 },
        { name: "Abwesend",    value: gesamtStats?.abwesendCount ?? 0 },
    ].filter(d => d.value > 0);

    const pieColors = { "Home Office": FARBEN.HomeOffice, Office: FARBEN.Office, Abwesend: FARBEN.Abwesend };

    const barData = stats.monthly?.length > 0
        ? stats.monthly.map(d => ({
            Datum: d.date,
            "Home Office": d.homeOffice,
            Office: d.office,
            Abwesend: d.abwesend,
        }))
        : [{
            Datum: MONATE[filter.monat - 1],
            "Home Office": stats.homeOfficeCount,
            Office: stats.officeCount,
            Abwesend: stats.abwesendCount,
        }];

    const statItems = [
        { key: "homeOffice", label: "Home Office", value: stats.homeOfficeCount, color: FARBEN.HomeOffice },
        { key: "office",     label: "Office",      value: stats.officeCount,     color: FARBEN.Office },
        { key: "abwesend",   label: "Abwesend",    value: stats.abwesendCount,   color: FARBEN.Abwesend },
    ];

    return (
        <div className="user-view">
            <h2>Meine Statistik</h2>

            <div className="filter-row">
                <select name="monat" value={filter.monat} onChange={handleFilter}>
                    {MONATE.map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                </select>
                <select name="jahr" value={filter.jahr} onChange={handleFilter}>
                    {JAHRE.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
            </div>

            <div className="stats-cards">
                <StatCard label="Gesamt (Jahr)" value={gesamtStats?.total ?? 0} />
                {statItems.map(item => (
                    <StatCard key={item.key} label={item.label} value={item.value} color={item.color} />
                ))}
            </div>

            {stats.total === 0 ? (
                <div className="chart-box" style={{ textAlign: "center", padding: 40, color: "#5E7B7A" }}>
                    Keine Einträge für diesen Zeitraum
                </div>
            ) : (
                <div className="charts-row">
                    {gesamtStats?.total > 0 && (
                        <div className="chart-box">
                            <h3>Jahresübersicht {filter.jahr}</h3>
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
                                    <Legend
                                        formatter={(value) => (
                                            <span style={{ fontSize: 13, color: "#263445" }}>{value}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    <div className="chart-box">
                        <h3>{MONATE[filter.monat - 1]} {filter.jahr} – Tagesverlauf</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={barData} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E0F0EE" vertical={false} />
                                <XAxis dataKey="Datum" tick={{ fontSize: 12, fill: "#5E7B7A" }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#5E7B7A" }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend formatter={(value) => (
                                    <span style={{ fontSize: 13, color: "#263445" }}>{value}</span>
                                )} />
                                <Bar dataKey="Home Office" fill={FARBEN.HomeOffice} radius={[4,4,0,0]} />
                                <Bar dataKey="Office"      fill={FARBEN.Office}     radius={[4,4,0,0]} />
                                <Bar dataKey="Abwesend"    fill={FARBEN.Abwesend}   radius={[4,4,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserView;