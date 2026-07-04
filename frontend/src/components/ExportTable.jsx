import { useState, useEffect } from "react";
import { api } from "../api/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const JAHRE = [2024, 2025, 2026];
const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const SPALTEN = ["Datum", "Vorname", "Nachname", "Status", "Abteilung"];

function ExportTable() {
    const [data, setData] = useState([]);
    const [abteilungen, setAbteilungen] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({
        monat: new Date().getMonth() + 1,
        jahr: new Date().getFullYear(),
        abteilung: "",
        userId: "",
    });

    // Abteilungen dynamisch aus Userliste laden
    useEffect(() => {
        api.get("/User")
            .then(res => {
                const unique = [...new Set(res.data.map(u => u.abteilung).filter(Boolean))].sort();
                setAbteilungen(unique);
            })
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        const params = new URLSearchParams();
        if (filter.monat) params.append("monat", filter.monat);
        if (filter.jahr) params.append("jahr", filter.jahr);
        if (filter.abteilung) params.append("abteilung", filter.abteilung);
        if (filter.userId) params.append("userId", filter.userId);

        api.get(`/User/export?${params.toString()}`)
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [filter]);

    const handleFilter = (e) => {
        const { name, value } = e.target;
        setFilter(prev => ({ ...prev, [name]: value }));
    };

    const downloadCSV = () => {
        const header = SPALTEN.join(";");
        const rows = data.map(r => [r.datum, r.vorname, r.nachname, r.status, r.abteilung].join(";"));
        const csv = [header, ...rows].join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `checkin-export-${filter.jahr}-${filter.monat}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text(`CheckIn Export – ${MONATE[filter.monat - 1]} ${filter.jahr}`, 14, 16);
        autoTable(doc, {
            startY: 24,
            head: [SPALTEN],
            body: data.map(r => [r.datum, r.vorname, r.nachname, r.status, r.abteilung]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [60, 60, 60] },
        });
        doc.save(`checkin-export-${filter.jahr}-${filter.monat}.pdf`);
    };

    return (
        <div className="export-table">
            <h2>Export</h2>
            <div className="filter-row">
                <select name="monat" value={filter.monat} onChange={handleFilter}>
                    {MONATE.map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                </select>
                <select name="jahr" value={filter.jahr} onChange={handleFilter}>
                    {JAHRE.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
                <select name="abteilung" value={filter.abteilung} onChange={handleFilter}>
                    <option value="">Alle Abteilungen</option>
                    {abteilungen.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
            </div>

            <div className="export-actions">
                <button onClick={downloadCSV} disabled={data.length === 0}>CSV herunterladen</button>
                <button onClick={downloadPDF} disabled={data.length === 0}>PDF herunterladen</button>
            </div>

            {loading ? (
                <p>Lädt...</p>
            ) : data.length === 0 ? (
                <p>Keine Einträge für diesen Zeitraum</p>
            ) : (
                <table className="export-table__table">
                    <thead>
                        <tr>{SPALTEN.map(s => <th key={s}>{s}</th>)}</tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i}>
                                <td>{row.datum}</td>
                                <td>{row.vorname}</td>
                                <td>{row.nachname}</td>
                                <td>{row.status}</td>
                                <td>{row.abteilung}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default ExportTable;