import { useState, useEffect } from "react";
import { api } from "../api/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { JAHR } from "../utils/zeitraum";
import { useLanguage } from "../i18n/LanguageContext";

const JAHRE = [JAHR];
const SPALTEN = ["date", "first", "last", "status", "department"]; // Schlüssel der Spaltenüberschriften (export.col.*)

function ExportTable() {
    const { t, lbl, months } = useLanguage();
    const spalten = SPALTEN.map(k => t(`export.col.${k}`));
    const [data, setData] = useState([]);
    const [abteilungen, setAbteilungen] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({
        monat: new Date().getMonth() + 1,
        jahr: JAHRE[JAHRE.length - 1],
        abteilung: "",
        userId: "",
    });

    useEffect(() => {
        api.get("/User/mitarbeiter")
            .then(res => {
                const unique = [...new Set(res.data.map(u => u.abteilung).filter(Boolean))].sort();
                setAbteilungen(unique);
            })
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Ladezustand muss vor dem Request gesetzt werden
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
        const header = spalten.join(";");
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
        doc.text(t("export.pdfTitle", { month: months[filter.monat - 1], year: filter.jahr }), 14, 16);
        autoTable(doc, {
            startY: 24,
            head: [spalten],
            body: data.map(r => [r.datum, r.vorname, r.nachname, r.status, r.abteilung]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [60, 60, 60] },
        });
        doc.save(`checkin-export-${filter.jahr}-${filter.monat}.pdf`);
    };

    return (
        <div className="export-table">
            <h2>{t("export.title")}</h2>
            <div className="filter-row">
                <select name="monat" value={filter.monat} onChange={handleFilter} aria-label={t("export.month")}>
                    {months.map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                </select>
                <select name="jahr" value={filter.jahr} onChange={handleFilter} aria-label={t("export.year")}>
                    {JAHRE.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
                <select name="abteilung" value={filter.abteilung} onChange={handleFilter} aria-label={t("dash.filter.department")}>
                    <option value="">{t("dash.filter.allDepartments")}</option>
                    {abteilungen.map(a => <option key={a} value={a}>{lbl(a)}</option>)}
                </select>
            </div>

            <div className="export-actions">
                <button onClick={downloadCSV} disabled={data.length === 0}>{t("export.csv")}</button>
                <button onClick={downloadPDF} disabled={data.length === 0}>{t("export.pdf")}</button>
            </div>

            {loading ? (
                <p>{t("export.loading")}</p>
            ) : data.length === 0 ? (
                <p>{t("export.empty")}</p>
            ) : (
                <div className="table-scroll" role="region" aria-label={t("export.region")} tabIndex={0}>
                <table className="export-table__table">
                    <thead>
                        <tr>{SPALTEN.map((k, i) => <th key={k}>{spalten[i]}</th>)}</tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i}>
                                <td>{row.datum}</td>
                                <td>{row.vorname}</td>
                                <td>{row.nachname}</td>
                                <td>{row.status}</td>
                                <td>{lbl(row.abteilung)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            )}
        </div>
    );
}

export default ExportTable;