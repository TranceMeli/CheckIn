import { useState, useEffect } from "react";
import { Building2, ClipboardCheck, Home, Plane } from "lucide-react";
import { api } from "../api/api";
import "../styles/dashboard.css";
import StatCard from "../components/StatCard";
import Karte from "../components/Karte";
import PeriodBar from "../components/PeriodBar";
import { FARBEN } from "../components/chartConfig";
import {
    TrendChart, WeekdayChart, TargetMeter, YearHeatmap, StatusDonut,
} from "../components/DashboardCharts";
import { JAHR, iso, clampToYear, zeitraum } from "../utils/zeitraum";
import { useLanguage } from "../i18n/LanguageContext";

function UserView() {
    const { t, lang } = useLanguage();
    const [periode, setPeriode] = useState("month");
    const [anker, setAnker] = useState(() => clampToYear(new Date()));
    const [overview, setOverview] = useState(null);
    const [verlauf, setVerlauf] = useState([]);
    const [heatmap, setHeatmap] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fehler, setFehler] = useState("");

    const { von, bis, label } = zeitraum(periode, anker, lang);

    useEffect(() => {
        let aktuell = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Ladezustand muss vor dem Request gesetzt werden
        setLoading(true);
        api.get("/CheckIn/dashboard/overview", { params: { von: iso(von), bis: iso(bis) } })
            .then(res => { if (aktuell) { setOverview(res.data); setFehler(""); } })
            .catch(() => aktuell && setFehler("dash.error.own"))
            .finally(() => aktuell && setLoading(false));
        return () => { aktuell = false; };
    }, [periode, anker]); // eslint-disable-line react-hooks/exhaustive-deps -- von/bis ergeben sich aus periode und anker

    // Jahresverlauf und Heatmap hängen nicht vom gewählten Zeitraum ab
    useEffect(() => {
        let aktuell = true;
        Promise.all([
            api.get("/CheckIn/dashboard/verlauf", { params: { jahr: JAHR } }),
            api.get("/CheckIn/dashboard/heatmap", { params: { jahr: JAHR } }),
        ])
            .then(([v, h]) => { if (aktuell) { setVerlauf(v.data); setHeatmap(h.data); } })
            .catch(() => aktuell && setFehler("dash.error.own"));
        return () => { aktuell = false; };
    }, []);

    const g = overview?.gesamt;

    return (
        <div className="dashboard">
            <div className="dash-head">
                <h1>{t("dash.user.title")}</h1>
                <PeriodBar periode={periode} onPeriode={setPeriode} anker={anker} onAnker={setAnker} label={label} />
            </div>

            {fehler && <p className="form-error" role="alert">{t(fehler)}</p>}

            <div className={`dash-body${loading ? " is-loading" : ""}`} aria-busy={loading}>
                {g && (
                    <div className="stats-cards">
                        <StatCard label={t("dash.stat.officeDays")} value={g.office} color={FARBEN.office} icon={<Building2 size={20} />} />
                        <StatCard label={t("dash.stat.homeDays")} value={g.homeOffice} color={FARBEN.homeOffice} icon={<Home size={20} />} />
                        <StatCard label={t("dash.stat.absentDays")} value={g.abwesend} color={FARBEN.abwesend} icon={<Plane size={20} />} />
                        <StatCard label={t("dash.stat.total")} value={g.total} color={FARBEN.nav} icon={<ClipboardCheck size={20} />} />
                    </div>
                )}

                <div className="charts-row charts-row--wide">
                    <Karte titel={t("dash.card.trendOwn")} hinweis={t("dash.hint.target", { target: 60 })}>
                        <TrendChart data={verlauf} />
                    </Karte>
                    <Karte titel={t("dash.card.target")} hinweis={label}>
                        <TargetMeter office={g?.office ?? 0} total={g?.total ?? 0} />
                    </Karte>
                </div>

                <div className="charts-row">
                    <Karte titel={t("dash.card.distribution")} hinweis={label}>
                        <StatusDonut data={g ?? { office: 0, homeOffice: 0, abwesend: 0 }} />
                    </Karte>
                    <Karte titel={t("dash.card.ownWeekdays")} hinweis={label}>
                        <WeekdayChart data={overview?.wochentage ?? []} />
                    </Karte>
                </div>

                <Karte titel={t("dash.card.heatmap")} hinweis={`${JAHR}`} className="chart-box--full">
                    <YearHeatmap data={heatmap} />
                </Karte>
            </div>
        </div>
    );
}

export default UserView;
