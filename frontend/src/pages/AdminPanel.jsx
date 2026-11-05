import { useState, useEffect, useMemo } from "react";
import { Building2, ChevronLeft, ChevronRight, ClipboardCheck, Home, Plane } from "lucide-react";
import PeriodBar from "../components/PeriodBar";
import Karte from "../components/Karte";
import {
    JAHR, iso, addDays, mondayOf, fmt, isoWeek, clampToYear, zeitraum,
} from "../utils/zeitraum";
import { api } from "../api/api";
import "../styles/dashboard.css";
import StatCard from "../components/StatCard";
import { FARBEN, quote } from "../components/chartConfig";
import {
    TrendChart, WeekdayChart, DepartmentShareChart, TargetMeter,
    YearHeatmap, AbsenceChart, OfficeRanking, TeamWeekGrid,
} from "../components/DashboardCharts";

function AdminDashboard() {
    const [mitarbeiter, setMitarbeiter] = useState([]);
    const [filter, setFilter] = useState({ abteilung: "", userId: "" });
    const [periode, setPeriode] = useState("month");
    const [anker, setAnker] = useState(() => clampToYear(new Date()));
    const [wocheStart, setWocheStart] = useState(() => mondayOf(clampToYear(new Date())));

    const [overview, setOverview] = useState(null);
    const [verlauf, setVerlauf] = useState([]);
    const [heatmap, setHeatmap] = useState([]);
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fehler, setFehler] = useState("");

    const abteilungen = useMemo(
        () => [...new Set(mitarbeiter.map(u => u.abteilung).filter(Boolean))].sort(),
        [mitarbeiter],
    );

    const gefilterteMitarbeiter = filter.abteilung
        ? mitarbeiter.filter(m => m.abteilung === filter.abteilung)
        : mitarbeiter;

    const { von, bis, label } = zeitraum(periode, anker);

    useEffect(() => {
        api.get("/User/mitarbeiter")
            .then(res => setMitarbeiter(res.data))
            .catch(() => setFehler("Mitarbeiter konnten nicht geladen werden."));
    }, []);

    const filterParams = useMemo(() => {
        const p = {};
        if (filter.abteilung) p.abteilung = filter.abteilung;
        if (filter.userId) p.userId = filter.userId;
        return p;
    }, [filter]);

    useEffect(() => {
        let aktuell = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        api.get("/Dashboard/overview", { params: { ...filterParams, von: iso(von), bis: iso(bis) } })
            .then(res => { if (aktuell) { setOverview(res.data); setFehler(""); } })
            .catch(() => aktuell && setFehler("Auswertung konnte nicht geladen werden."))
            .finally(() => aktuell && setLoading(false));
        return () => { aktuell = false; };
    }, [filterParams, periode, anker]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        let aktuell = true;
        Promise.all([
            api.get("/Dashboard/verlauf", { params: { ...filterParams, jahr: JAHR } }),
            api.get("/Dashboard/heatmap", { params: { ...filterParams, jahr: JAHR } }),
        ])
            .then(([v, h]) => { if (aktuell) { setVerlauf(v.data); setHeatmap(h.data); } })
            .catch(() => aktuell && setFehler("Verlauf konnte nicht geladen werden."));
        return () => { aktuell = false; };
    }, [filterParams]);

    useEffect(() => {
        let aktuell = true;
        api.get("/Dashboard/team-woche", { params: { montag: iso(wocheStart), abteilung: filter.abteilung || undefined } })
            .then(res => aktuell && setTeam(res.data))
            .catch(() => aktuell && setFehler("Wochenraster konnte nicht geladen werden."));
        return () => { aktuell = false; };
    }, [wocheStart, filter.abteilung]);

    const handleFilter = (e) => {
        const { name, value } = e.target;
        if (name === "abteilung") setFilter({ abteilung: value, userId: "" });
        else setFilter({ ...filter, userId: value });
    };

    const handleReset = () => {
        setFilter({ abteilung: "", userId: "" });
        setPeriode("month");
        const heute = clampToYear(new Date());
        setAnker(heute);
        setWocheStart(mondayOf(heute));
    };

    const wocheBis = addDays(wocheStart, 4);
    const wocheVorOk = addDays(wocheStart, -7).getFullYear() === JAHR;
    const wocheNachOk = addDays(wocheStart, 7).getFullYear() === JAHR;
    const tage = ["Mo", "Di", "Mi", "Do", "Fr"].map((t, i) => `${t} ${String(addDays(wocheStart, i).getDate()).padStart(2, "0")}.`);

    const g = overview?.gesamt;

    return (
        <div className="dashboard">
            <div className="dash-head">
                <h1>Auswertungen</h1>

                <PeriodBar periode={periode} onPeriode={setPeriode} anker={anker} onAnker={setAnker} label={label} />
            </div>

            <div className="filter-row">
                <select name="abteilung" value={filter.abteilung} onChange={handleFilter} aria-label="Abteilung">
                    <option value="">Alle Abteilungen</option>
                    {abteilungen.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select name="userId" value={filter.userId} onChange={handleFilter} aria-label="Mitarbeiter">
                    <option value="">Alle Mitarbeiter</option>
                    {gefilterteMitarbeiter.map(m => (
                        <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.abteilung})</option>
                    ))}
                </select>
                <button type="button" onClick={handleReset}>Zurücksetzen</button>
            </div>

            {fehler && <p className="form-error" role="alert">{fehler}</p>}

            <div className={`dash-body${loading ? " is-loading" : ""}`} aria-busy={loading}>
                {g && (
                    <div className="stats-cards">
                        <StatCard label="Office-Quote" value={`${quote(g.office, g.total)} %`} color={FARBEN.office} icon={<Building2 size={20} />} />
                        <StatCard label="Home-Office-Quote" value={`${quote(g.homeOffice, g.total)} %`} color={FARBEN.homeOffice} icon={<Home size={20} />} />
                        <StatCard label="Abwesenheit" value={`${quote(g.abwesend, g.total)} %`} color={FARBEN.abwesend} icon={<Plane size={20} />} />
                        <StatCard label="Check-ins gesamt" value={g.total} color={FARBEN.nav} icon={<ClipboardCheck size={20} />} />
                    </div>
                )}

                <Karte titel={`Team-Anwesenheit · KW ${isoWeek(wocheStart)}`} hinweis={`${fmt(wocheStart)} – ${fmt(wocheBis)}`} className="chart-box--full">
                    <div className="week-nav">
                        <button type="button" aria-label="Vorige Woche" disabled={!wocheVorOk} onClick={() => setWocheStart(addDays(wocheStart, -7))}><ChevronLeft size={16} /></button>
                        <button type="button" aria-label="Nächste Woche" disabled={!wocheNachOk} onClick={() => setWocheStart(addDays(wocheStart, 7))}><ChevronRight size={16} /></button>
                    </div>
                    <TeamWeekGrid data={team} tage={tage} />
                </Karte>

                <div className="charts-row charts-row--wide">
                    <Karte titel="Office-Quote im Jahresverlauf" hinweis={`Ziel 60 %`}>
                        <TrendChart data={verlauf} />
                    </Karte>
                    <Karte titel="Ziel-Quote" hinweis={label}>
                        <TargetMeter office={g?.office ?? 0} total={g?.total ?? 0} />
                    </Karte>
                </div>

                <div className="charts-row">
                    <Karte titel="Verteilung nach Wochentag" hinweis={label}>
                        <WeekdayChart data={overview?.wochentage ?? []} />
                    </Karte>
                    <Karte titel="Abteilungen im Vergleich" hinweis={label}>
                        <DepartmentShareChart data={overview?.abteilungen ?? []} />
                    </Karte>
                </div>

                <Karte titel="Office-Anteil pro Kalenderwoche" hinweis={`${JAHR}`} className="chart-box--full">
                    <YearHeatmap data={heatmap} />
                </Karte>

                <div className="charts-row">
                    <Karte titel="Abwesenheiten je Abteilung" hinweis={label}>
                        <AbsenceChart data={overview?.abteilungen ?? []} />
                    </Karte>
                    <Karte titel="Meiste Office-Tage" hinweis={label}>
                        <OfficeRanking data={overview?.ranking ?? []} />
                    </Karte>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
