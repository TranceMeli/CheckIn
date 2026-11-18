import { useState, useEffect, useMemo } from "react";
import { Building2, ChevronLeft, ChevronRight, ClipboardCheck, Home, Plane } from "lucide-react";
import PeriodBar from "../components/PeriodBar";
import Karte from "../components/Karte";
import {
    JAHR, iso, addDays, mondayOf, fmt, isoWeek, clampToYear, zeitraum,
} from "../utils/zeitraum";
import { api } from "../api/api";
import { useLanguage } from "../i18n/LanguageContext";
import "../styles/dashboard.css";
import StatCard from "../components/StatCard";
import { FARBEN, quote } from "../components/chartConfig";
import {
    TrendChart, WeekdayChart, DepartmentShareChart, TargetMeter,
    YearHeatmap, AbsenceChart, OfficeRanking, TeamWeekGrid,
} from "../components/DashboardCharts";

function AdminDashboard() {
    const { t, lang, lbl, pct } = useLanguage();
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

    const { von, bis, label } = zeitraum(periode, anker, lang);

    useEffect(() => {
        api.get("/User/mitarbeiter")
            .then(res => setMitarbeiter(res.data))
            .catch(() => setFehler("dash.error.employees"));
    }, []);

    const filterParams = useMemo(() => {
        const p = {};
        if (filter.abteilung) p.abteilung = filter.abteilung;
        if (filter.userId) p.userId = filter.userId;
        return p;
    }, [filter]);

    useEffect(() => {
        let aktuell = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Ladezustand muss vor dem Request gesetzt werden
        setLoading(true);
        api.get("/Dashboard/overview", { params: { ...filterParams, von: iso(von), bis: iso(bis) } })
            .then(res => { if (aktuell) { setOverview(res.data); setFehler(""); } })
            .catch(() => aktuell && setFehler("dash.error.analysis"))
            .finally(() => aktuell && setLoading(false));
        return () => { aktuell = false; };
    }, [filterParams, periode, anker]); // eslint-disable-line react-hooks/exhaustive-deps -- von/bis ergeben sich aus periode und anker

    useEffect(() => {
        let aktuell = true;
        Promise.all([
            api.get("/Dashboard/verlauf", { params: { ...filterParams, jahr: JAHR } }),
            api.get("/Dashboard/heatmap", { params: { ...filterParams, jahr: JAHR } }),
        ])
            .then(([v, h]) => { if (aktuell) { setVerlauf(v.data); setHeatmap(h.data); } })
            .catch(() => aktuell && setFehler("dash.error.trend"));
        return () => { aktuell = false; };
    }, [filterParams]);

    useEffect(() => {
        let aktuell = true;
        api.get("/Dashboard/team-woche", { params: { montag: iso(wocheStart), abteilung: filter.abteilung || undefined } })
            .then(res => aktuell && setTeam(res.data))
            .catch(() => aktuell && setFehler("dash.error.week"));
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
    const tage = ["Mo", "Di", "Mi", "Do", "Fr"].map((wd, i) => t("day.format", { wd: lbl(wd), dd: String(addDays(wocheStart, i).getDate()).padStart(2, "0") }));

    const g = overview?.gesamt;

    return (
        <div className="dashboard">
            <div className="dash-head">
                <h1>{t("dash.admin.title")}</h1>

                <PeriodBar periode={periode} onPeriode={setPeriode} anker={anker} onAnker={setAnker} label={label} />
            </div>

            <div className="filter-row">
                <select name="abteilung" value={filter.abteilung} onChange={handleFilter} aria-label={t("dash.filter.department")}>
                    <option value="">{t("dash.filter.allDepartments")}</option>
                    {abteilungen.map(a => <option key={a} value={a}>{lbl(a)}</option>)}
                </select>
                <select name="userId" value={filter.userId} onChange={handleFilter} aria-label={t("dash.filter.employee")}>
                    <option value="">{t("dash.filter.allEmployees")}</option>
                    {gefilterteMitarbeiter.map(m => (
                        <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({lbl(m.abteilung)})</option>
                    ))}
                </select>
                <button type="button" onClick={handleReset}>{t("dash.filter.reset")}</button>
            </div>

            {fehler && <p className="form-error" role="alert">{t(fehler)}</p>}

            <div className={`dash-body${loading ? " is-loading" : ""}`} aria-busy={loading}>
                {g && (
                    <div className="stats-cards">
                        <StatCard label={t("dash.stat.officeRate")} value={pct(quote(g.office, g.total))} color={FARBEN.office} icon={<Building2 size={20} />} />
                        <StatCard label={t("dash.stat.homeRate")} value={pct(quote(g.homeOffice, g.total))} color={FARBEN.homeOffice} icon={<Home size={20} />} />
                        <StatCard label={t("dash.stat.absenceRate")} value={pct(quote(g.abwesend, g.total))} color={FARBEN.abwesend} icon={<Plane size={20} />} />
                        <StatCard label={t("dash.stat.total")} value={g.total} color={FARBEN.nav} icon={<ClipboardCheck size={20} />} />
                    </div>
                )}

                <Karte titel={t("dash.card.teamWeek", { week: isoWeek(wocheStart) })} hinweis={`${fmt(wocheStart, lang)} – ${fmt(wocheBis, lang)}`} className="chart-box--full">
                    <div className="week-nav">
                        <button type="button" aria-label={t("dash.week.prev")} disabled={!wocheVorOk} onClick={() => setWocheStart(addDays(wocheStart, -7))}><ChevronLeft size={16} /></button>
                        <button type="button" aria-label={t("dash.week.next")} disabled={!wocheNachOk} onClick={() => setWocheStart(addDays(wocheStart, 7))}><ChevronRight size={16} /></button>
                    </div>
                    <TeamWeekGrid data={team} tage={tage} />
                </Karte>

                <div className="charts-row charts-row--wide">
                    <Karte titel={t("dash.card.trend")} hinweis={t("dash.hint.target", { target: 60 })}>
                        <TrendChart data={verlauf} />
                    </Karte>
                    <Karte titel={t("dash.card.target")} hinweis={label}>
                        <TargetMeter office={g?.office ?? 0} total={g?.total ?? 0} />
                    </Karte>
                </div>

                <div className="charts-row">
                    <Karte titel={t("dash.card.byWeekday")} hinweis={label}>
                        <WeekdayChart data={overview?.wochentage ?? []} />
                    </Karte>
                    <Karte titel={t("dash.card.byDepartment")} hinweis={label}>
                        <DepartmentShareChart data={overview?.abteilungen ?? []} />
                    </Karte>
                </div>

                <Karte titel={t("dash.card.heatmap")} hinweis={`${JAHR}`} className="chart-box--full">
                    <YearHeatmap data={heatmap} />
                </Karte>

                <div className="charts-row">
                    <Karte titel={t("dash.card.absences")} hinweis={label}>
                        <AbsenceChart data={overview?.abteilungen ?? []} />
                    </Karte>
                    <Karte titel={t("dash.card.ranking")} hinweis={label}>
                        <OfficeRanking data={overview?.ranking ?? []} />
                    </Karte>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
