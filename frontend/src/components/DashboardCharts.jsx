import { useEffect, useState } from "react";
import {
    Area, AreaChart, Bar, BarChart, Cell, CartesianGrid, Pie, PieChart, ReferenceLine,
    ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { FARBEN, ZIEL_QUOTE, quote } from "./chartConfig";

// Schmale Bildschirme: kürzere Beschriftungsspalte, damit die Balken Platz behalten
const useAchsenBreite = () => {
    const [schmal, setSchmal] = useState(() => window.matchMedia("(max-width: 600px)").matches);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 600px)");
        const onChange = (e) => setSchmal(e.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);
    return schmal ? 112 : 170;
};

// Respektiert die Systemeinstellung "Bewegung reduzieren"
const useAnimation = () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ChartTooltip = ({ active, payload, label, suffix = "" }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="chart-tooltip">
            <p className="chart-tooltip__title">{label}</p>
            {payload.map(p => (
                <p key={p.dataKey ?? p.name} style={{ color: p.color ?? p.fill }}>
                    {p.name}: <strong>{p.value}{suffix}</strong>
                </p>
            ))}
        </div>
    );
};

const Legende = ({ items }) => (
    <div className="chart-legend">
        {items.map(i => (
            <span key={i.label}><i style={{ background: i.farbe }} />{i.label}</span>
        ))}
    </div>
);

const STATUS_LEGENDE = [
    { label: "Office", farbe: FARBEN.office },
    { label: "Home Office", farbe: FARBEN.homeOffice },
    { label: "Abwesend", farbe: FARBEN.abwesend },
];

const Leer = ({ text = "Keine Daten für diesen Zeitraum" }) => <p className="chart-empty">{text}</p>;

// D1 – Office-Quote im Jahresverlauf
export function TrendChart({ data }) {
    const animate = useAnimation();
    const punkte = data.map(m => ({
        label: m.label,
        quote: m.total > 0 ? quote(m.office, m.total) : null,
    }));

    return (
        <div className="chart-plot">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={punkte} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke={FARBEN.grid} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: FARBEN.muted }} tickLine={false} />
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v} %`} tick={{ fill: FARBEN.muted }} tickLine={false} axisLine={false} />
                    <ReferenceLine y={ZIEL_QUOTE} stroke={FARBEN.homeOffice} strokeDasharray="4 4" />
                    <Tooltip content={<ChartTooltip suffix=" %" />} />
                    <Area isAnimationActive={animate} type="monotone" dataKey="quote" name="Office-Quote" stroke={FARBEN.office} strokeWidth={2.5}
                        fill={FARBEN.office} fillOpacity={0.1} connectNulls dot={false}
                        activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

// D2 – Verteilung nach Wochentag (prozentual gestapelt)
export function WeekdayChart({ data }) {
    const animate = useAnimation();
    if (!data.some(d => d.total > 0)) return <Leer />;
    const zeilen = data.map(d => ({ label: d.label, Office: d.office, "Home Office": d.homeOffice, Abwesend: d.abwesend }));
    return (
        <>
            <Legende items={STATUS_LEGENDE} />
            <div className="chart-plot chart-plot--sm">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zeilen} stackOffset="expand" margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                        <CartesianGrid stroke={FARBEN.grid} vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: FARBEN.muted }} tickLine={false} />
                        <YAxis tickFormatter={v => `${Math.round(v * 100)} %`} tick={{ fill: FARBEN.muted }} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltip suffix=" Tage" />} />
                        <Bar isAnimationActive={animate} dataKey="Office" stackId="s" fill={FARBEN.office} />
                        <Bar isAnimationActive={animate} dataKey="Home Office" stackId="s" fill={FARBEN.homeOffice} />
                        <Bar isAnimationActive={animate} dataKey="Abwesend" stackId="s" fill={FARBEN.abwesend} radius={[3, 3, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </>
    );
}

// D3 – Abteilungen in Prozent (100 % gestapelt, horizontal)
export function DepartmentShareChart({ data }) {
    const animate = useAnimation();
    const achsenBreite = useAchsenBreite();
    if (data.length === 0) return <Leer />;
    const zeilen = data.map(d => ({ label: d.label, Office: d.office, "Home Office": d.homeOffice, Abwesend: d.abwesend }));
    return (
        <>
            <Legende items={STATUS_LEGENDE} />
            <div className="chart-plot chart-plot--sm">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zeilen} layout="vertical" stackOffset="expand" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                        <CartesianGrid stroke={FARBEN.grid} horizontal={false} />
                        <XAxis type="number" tickFormatter={v => `${Math.round(v * 100)} %`} tick={{ fill: FARBEN.muted }} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="label" width={achsenBreite} tick={{ fill: FARBEN.nav }} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltip suffix=" Tage" />} />
                        <Bar isAnimationActive={animate} dataKey="Office" stackId="s" fill={FARBEN.office} />
                        <Bar isAnimationActive={animate} dataKey="Home Office" stackId="s" fill={FARBEN.homeOffice} />
                        <Bar isAnimationActive={animate} dataKey="Abwesend" stackId="s" fill={FARBEN.abwesend} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </>
    );
}

// D4 – Ziel-Quote als Meter
export function TargetMeter({ office, total }) {
    const q = quote(office, total);
    const erreicht = q >= ZIEL_QUOTE;
    return (
        <div className="meter-box">
            <div className="meter-box__value">
                {q} %<span> von {ZIEL_QUOTE} % Ziel</span>
            </div>
            <div className="meter" role="img" aria-label={`Office-Quote ${q} Prozent, Ziel ${ZIEL_QUOTE} Prozent`}>
                <i style={{ width: `${q}%` }} />
                <u style={{ left: `${ZIEL_QUOTE}%` }} />
            </div>
            <div className="meter-box__scale"><span>0 %</span><span>Ziel {ZIEL_QUOTE} %</span><span>100 %</span></div>
            <p className={`meter-box__note${erreicht ? " is-ok" : ""}`}>
                {total === 0
                    ? "Keine Check-ins im Zeitraum."
                    : erreicht
                        ? "Das Ziel ist erreicht."
                        : `${ZIEL_QUOTE - q} Prozentpunkte unter dem Ziel.`}
            </p>
        </div>
    );
}

// D5 – Jahres-Heatmap (eine Zelle pro Kalenderwoche)
export function YearHeatmap({ data }) {
    return (
        <>
            <div className="chart-legend">
                <span><i style={{ background: "hsl(175 30% 94%)" }} />wenig Office</span>
                <span><i style={{ background: "hsl(174 60% 70%)" }} /></span>
                <span><i style={{ background: "hsl(174 84% 32%)" }} />viel Office</span>
            </div>
            <div className="heatmap" role="img" aria-label="Office-Anteil pro Kalenderwoche im Jahr 2026">
                {data.map(w => {
                    const v = w.total > 0 ? w.office / w.total : null;
                    const farbe = v === null
                        ? "hsl(175 20% 96%)"
                        : `hsl(174 ${Math.round(20 + 64 * v)}% ${Math.round(95 - 63 * v)}%)`;
                    return (
                        <i key={w.woche} style={{ background: farbe }}
                            title={v === null ? `KW ${w.woche}: keine Daten` : `KW ${w.woche}: ${Math.round(v * 100)} % Office`} />
                    );
                })}
            </div>
            <div className="heatmap-axis"><span>KW 1</span><span>KW 26</span><span>KW 52</span></div>
        </>
    );
}

// D6 – Abwesenheiten je Abteilung
export function AbsenceChart({ data }) {
    const animate = useAnimation();
    const achsenBreite = useAchsenBreite();
    const zeilen = [...data]
        .map(d => ({ label: d.label, Abwesend: d.abwesend }))
        .sort((a, b) => b.Abwesend - a.Abwesend);
    if (zeilen.length === 0 || zeilen.every(z => z.Abwesend === 0)) return <Leer text="Keine Abwesenheiten im Zeitraum" />;
    return (
        <div className="chart-plot chart-plot--sm">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zeilen} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                    <CartesianGrid stroke={FARBEN.grid} horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: FARBEN.muted }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="label" width={achsenBreite} tick={{ fill: FARBEN.nav }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip suffix=" Tage" />} cursor={{ fill: "hsl(174 40% 95%)" }} />
                    <Bar isAnimationActive={animate} dataKey="Abwesend" barSize={16} radius={[0, 4, 4, 0]}>
                        {zeilen.map((z, i) => <Cell key={z.label} fill={i === 0 ? FARBEN.abwesend : "#F3A1A1"} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// Rangliste: meiste Office-Tage
export function OfficeRanking({ data }) {
    if (data.length === 0) return <Leer />;
    const max = Math.max(...data.map(d => d.office), 1);
    return (
        <ol className="ranking">
            {data.map((r, i) => (
                <li key={r.userId}>
                    <span className="ranking__pos">{i + 1}.</span>
                    <div>
                        <span>{r.name}</span>
                        <small>{r.abteilung}</small>
                        <div className="ranking__bar"><i style={{ width: `${(r.office / max) * 100}%` }} /></div>
                    </div>
                    <b>{r.office}</b>
                </li>
            ))}
        </ol>
    );
}

const STATUS_ZELLE = {
    Office: { label: "Office", klasse: "office" },
    HomeOffice: { label: "Home", klasse: "homeoffice" },
    Abwesend: { label: "Abw.", klasse: "abwesend" },
};

// Wochenraster pro Mitarbeiter
export function TeamWeekGrid({ data, tage }) {
    if (data.length === 0) return <Leer text="Keine Mitarbeiter in dieser Abteilung" />;
    return (
        <div className="table-scroll">
            <div className="week-grid" role="table">
                <span />
                {tage.map(t => <span key={t} className="week-grid__head">{t}</span>)}
                {data.map(m => (
                    <WeekRow key={m.userId} m={m} />
                ))}
            </div>
        </div>
    );
}

function WeekRow({ m }) {
    return (
        <>
            <span className="week-grid__name">{m.name}<small>{m.abteilung}</small></span>
            {m.tage.map((s, i) => {
                const z = s ? STATUS_ZELLE[s] : null;
                return (
                    <div key={i} className={`week-grid__cell week-grid__cell--${z ? z.klasse : "leer"}`}>
                        {z ? z.label : "–"}
                    </div>
                );
            })}
        </>
    );
}

// Verteilung als Ring: Anteile von Office / Home Office / Abwesend
export function StatusDonut({ data }) {
    const animate = useAnimation();
    const teile = [
        { name: "Office", value: data.office, farbe: FARBEN.office },
        { name: "Home Office", value: data.homeOffice, farbe: FARBEN.homeOffice },
        { name: "Abwesend", value: data.abwesend, farbe: FARBEN.abwesend },
    ].filter(t => t.value > 0);
    const gesamt = teile.reduce((summe, t) => summe + t.value, 0);
    if (gesamt === 0) return <Leer />;

    return (
        <>
            <Legende items={STATUS_LEGENDE} />
            <div className="chart-plot chart-plot--sm">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie isAnimationActive={animate} data={teile} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%"
                            paddingAngle={3} stroke="none"
                            label={({ percent }) => (percent >= 0.05 ? `${Math.round(percent * 100)} %` : "")}
                            labelLine={false}>
                            {teile.map(t => <Cell key={t.name} fill={t.farbe} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip suffix=" Tage" />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </>
    );
}
