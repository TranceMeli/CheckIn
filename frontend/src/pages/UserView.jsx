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

function UserView() {
    const [periode, setPeriode] = useState("month");
    const [anker, setAnker] = useState(() => clampToYear(new Date()));
    const [overview, setOverview] = useState(null);
    const [verlauf, setVerlauf] = useState([]);
    const [heatmap, setHeatmap] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fehler, setFehler] = useState("");

    const { von, bis, label } = zeitraum(periode, anker);

    useEffect(() => {
        let aktuell = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        api.get("/CheckIn/dashboard/overview", { params: { von: iso(von), bis: iso(bis) } })
            .then(res => { if (aktuell) { setOverview(res.data); setFehler(""); } })
            .catch(() => aktuell && setFehler("Deine Statistik konnte nicht geladen werden."))
            .finally(() => aktuell && setLoading(false));
        return () => { aktuell = false; };
    }, [periode, anker]); // eslint-disable-line react-hooks/exhaustive-deps

    // Jahresverlauf und Heatmap hängen nicht vom gewählten Zeitraum ab
    useEffect(() => {
        let aktuell = true;
        Promise.all([
            api.get("/CheckIn/dashboard/verlauf", { params: { jahr: JAHR } }),
            api.get("/CheckIn/dashboard/heatmap", { params: { jahr: JAHR } }),
        ])
            .then(([v, h]) => { if (aktuell) { setVerlauf(v.data); setHeatmap(h.data); } })
            .catch(() => aktuell && setFehler("Deine Statistik konnte nicht geladen werden."));
        return () => { aktuell = false; };
    }, []);

    const g = overview?.gesamt;

    return (
        <div className="dashboard">
            <div className="dash-head">
                <h1>Meine Statistik</h1>
                <PeriodBar periode={periode} onPeriode={setPeriode} anker={anker} onAnker={setAnker} label={label} />
            </div>

            {fehler && <p className="form-error" role="alert">{fehler}</p>}

            <div className={`dash-body${loading ? " is-loading" : ""}`} aria-busy={loading}>
                {g && (
                    <div className="stats-cards">
                        <StatCard label="Office-Tage" value={g.office} color={FARBEN.office} icon={<Building2 size={20} />} />
                        <StatCard label="Home-Office-Tage" value={g.homeOffice} color={FARBEN.homeOffice} icon={<Home size={20} />} />
                        <StatCard label="Abwesend (Tage)" value={g.abwesend} color={FARBEN.abwesend} icon={<Plane size={20} />} />
                        <StatCard label="Check-ins gesamt" value={g.total} color={FARBEN.nav} icon={<ClipboardCheck size={20} />} />
                    </div>
                )}

                <div className="charts-row charts-row--wide">
                    <Karte titel="Meine Office-Quote im Jahresverlauf" hinweis="Ziel 60 %">
                        <TrendChart data={verlauf} />
                    </Karte>
                    <Karte titel="Ziel-Quote" hinweis={label}>
                        <TargetMeter office={g?.office ?? 0} total={g?.total ?? 0} />
                    </Karte>
                </div>

                <div className="charts-row">
                    <Karte titel="Verteilung" hinweis={label}>
                        <StatusDonut data={g ?? { office: 0, homeOffice: 0, abwesend: 0 }} />
                    </Karte>
                    <Karte titel="Meine Wochentage" hinweis={label}>
                        <WeekdayChart data={overview?.wochentage ?? []} />
                    </Karte>
                </div>

                <Karte titel="Office-Anteil pro Kalenderwoche" hinweis={`${JAHR}`} className="chart-box--full">
                    <YearHeatmap data={heatmap} />
                </Karte>
            </div>
        </div>
    );
}

export default UserView;
