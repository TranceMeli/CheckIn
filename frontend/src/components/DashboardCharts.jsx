import { useEffect, useState } from "react";
import {
    Area, AreaChart, Bar, BarChart, Cell, CartesianGrid, Pie, PieChart, ReferenceLine,
    ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { FARBEN, ZIEL_QUOTE, quote } from "./chartConfig";
import { useLanguage } from "../i18n/LanguageContext";

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

const statusLegende = (t) => [
    { label: t("status.Office"), farbe: FARBEN.office },
    { label: t("status.HomeOffice"), farbe: FARBEN.homeOffice },
    { label: t("status.Abwesend"), farbe: FARBEN.abwesend },
];

// Reihen im Diagramm: dataKey bleibt deutsch (stabil), der angezeigte Name kommt aus der Sprache
const useReihen = () => {
    const { t, lbl } = useLanguage();
    const zeile = (d) => ({ label: lbl(d.label), Office: d.office, "Home Office": d.homeOffice, Abwesend: d.abwesend });
    return { zeile, legende: statusLegende(t), name: (status) => t(`status.${status}`) };
};

const Leer = ({ k = "chart.empty" }) => {
    const { t } = useLanguage();
    return <p className="chart-empty">{t(k)}</p>;
};

// Office-Quote im Jahresverlauf (Fläche mit Ziellinie)
export function TrendChart({ data }) {
    const animate = useAnimation();
    const { t, lbl, pct } = useLanguage();
    const punkte = data.map(m => ({
        label: lbl(m.label),
        quote: m.total > 0 ? quote(m.office, m.total) : null,
    }));

    return (
        <div className="chart-plot">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={punkte} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke={FARBEN.grid} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: FARBEN.muted }} tickLine={false} />
                    <YAxis domain={[0, 100]} tickFormatter={v => pct(v)} tick={{ fill: FARBEN.muted }} tickLine={false} axisLine={false} />
                    <ReferenceLine y={ZIEL_QUOTE} stroke={FARBEN.homeOffice} strokeDasharray="4 4" />
                    <Tooltip content={<ChartTooltip suffix={pct("")} />} />
                    <Area isAnimationActive={animate} type="monotone" dataKey="quote" name={t("chart.trendName")} stroke={FARBEN.office} strokeWidth={2.5}
                        fill={FARBEN.office} fillOpacity={0.1} connectNulls dot={false}
                        activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

// Verteilung nach Wochentag (prozentual gestapelt)
export function WeekdayChart({ data }) {
    const animate = useAnimation();
    const { t, pct } = useLanguage();
    const { zeile, legende, name } = useReihen();
    if (!data.some(d => d.total > 0)) return <Leer />;
    const zeilen = data.map(zeile);
    return (
        <>
            <Legende items={legende} />
            <div className="chart-plot chart-plot--sm">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zeilen} stackOffset="expand" margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                        <CartesianGrid stroke={FARBEN.grid} vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: FARBEN.muted }} tickLine={false} />
                        <YAxis tickFormatter={v => pct(Math.round(v * 100))} tick={{ fill: FARBEN.muted }} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltip suffix={` ${t("unit.days")}`} />} />
                        <Bar isAnimationActive={animate} dataKey="Office" name={name("Office")} stackId="s" fill={FARBEN.office} />
                        <Bar isAnimationActive={animate} dataKey="Home Office" name={name("HomeOffice")} stackId="s" fill={FARBEN.homeOffice} />
                        <Bar isAnimationActive={animate} dataKey="Abwesend" name={name("Abwesend")} stackId="s" fill={FARBEN.abwesend} radius={[3, 3, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </>
    );
}

// Abteilungsvergleich (100 % gestapelt, horizontal)
export function DepartmentShareChart({ data }) {
    const animate = useAnimation();
    const achsenBreite = useAchsenBreite();
    const { t, pct } = useLanguage();
    const { zeile, legende, name } = useReihen();
    if (data.length === 0) return <Leer />;
    const zeilen = data.map(zeile);
    return (
        <>
            <Legende items={legende} />
            <div className="chart-plot chart-plot--sm">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zeilen} layout="vertical" stackOffset="expand" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                        <CartesianGrid stroke={FARBEN.grid} horizontal={false} />
                        <XAxis type="number" tickFormatter={v => pct(Math.round(v * 100))} tick={{ fill: FARBEN.muted }} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="label" width={achsenBreite} tick={{ fill: FARBEN.nav }} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltip suffix={` ${t("unit.days")}`} />} />
                        <Bar isAnimationActive={animate} dataKey="Office" name={name("Office")} stackId="s" fill={FARBEN.office} />
                        <Bar isAnimationActive={animate} dataKey="Home Office" name={name("HomeOffice")} stackId="s" fill={FARBEN.homeOffice} />
                        <Bar isAnimationActive={animate} dataKey="Abwesend" name={name("Abwesend")} stackId="s" fill={FARBEN.abwesend} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </>
    );
}

// Ziel-Quote als Meter
export function TargetMeter({ office, total }) {
    const { t, pct } = useLanguage();
    const q = quote(office, total);
    const erreicht = q >= ZIEL_QUOTE;
    return (
        <div className="meter-box">
            <div className="meter-box__value">
                {pct(q)}<span> {t("chart.meter.of", { target: ZIEL_QUOTE })}</span>
            </div>
            <div className="meter" role="img" aria-label={t("chart.meter.aria", { q, target: ZIEL_QUOTE })}>
                <i style={{ width: `${q}%` }} />
                <u style={{ left: `${ZIEL_QUOTE}%` }} />
            </div>
            <div className="meter-box__scale"><span>{pct(0)}</span><span>{t("chart.meter.scaleTarget", { target: ZIEL_QUOTE })}</span><span>{pct(100)}</span></div>
            <p className={`meter-box__note${erreicht ? " is-ok" : ""}`}>
                {total === 0
                    ? t("chart.meter.none")
                    : erreicht
                        ? t("chart.meter.reached")
                        : t("chart.meter.below", { n: ZIEL_QUOTE - q })}
            </p>
        </div>
    );
}

// Jahres-Heatmap (eine Zelle pro Kalenderwoche)
export function YearHeatmap({ data }) {
    const { t, pct } = useLanguage();
    return (
        <>
            <div className="chart-legend">
                <span><i style={{ background: "hsl(175 30% 94%)" }} />{t("chart.heatmap.low")}</span>
                <span><i style={{ background: "hsl(174 60% 70%)" }} /></span>
                <span><i style={{ background: "hsl(174 84% 32%)" }} />{t("chart.heatmap.high")}</span>
            </div>
            <div className="heatmap" role="img" aria-label={t("chart.heatmap.aria", { year: 2026 })}>
                {data.map(w => {
                    const v = w.total > 0 ? w.office / w.total : null;
                    const farbe = v === null
                        ? "hsl(175 20% 96%)"
                        : `hsl(174 ${Math.round(20 + 64 * v)}% ${Math.round(95 - 63 * v)}%)`;
                    return (
                        <i key={w.woche} style={{ background: farbe }}
                            title={v === null ? t("chart.heatmap.noData", { week: w.woche }) : t("chart.heatmap.cell", { week: w.woche, pct: pct(Math.round(v * 100)) })} />
                    );
                })}
            </div>
            <div className="heatmap-axis"><span>{t("chart.heatmap.axis", { week: 1 })}</span><span>{t("chart.heatmap.axis", { week: 26 })}</span><span>{t("chart.heatmap.axis", { week: 52 })}</span></div>
        </>
    );
}

// Abwesenheiten je Abteilung (höchster Wert hervorgehoben)
export function AbsenceChart({ data }) {
    const animate = useAnimation();
    const achsenBreite = useAchsenBreite();
    const { t, lbl } = useLanguage();
    const zeilen = [...data]
        .map(d => ({ label: lbl(d.label), Abwesend: d.abwesend }))
        .sort((a, b) => b.Abwesend - a.Abwesend);
    if (zeilen.length === 0 || zeilen.every(z => z.Abwesend === 0)) return <Leer k="chart.emptyAbsences" />;
    return (
        <div className="chart-plot chart-plot--sm">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zeilen} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                    <CartesianGrid stroke={FARBEN.grid} horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: FARBEN.muted }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="label" width={achsenBreite} tick={{ fill: FARBEN.nav }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip suffix={` ${t("unit.days")}`} />} cursor={{ fill: "hsl(174 40% 95%)" }} />
                    <Bar isAnimationActive={animate} dataKey="Abwesend" name={t("status.Abwesend")} barSize={16} radius={[0, 4, 4, 0]}>
                        {zeilen.map((z, i) => <Cell key={z.label} fill={i === 0 ? FARBEN.abwesend : "#F3A1A1"} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// Rangliste: meiste Office-Tage
export function OfficeRanking({ data }) {
    const { lbl } = useLanguage();
    if (data.length === 0) return <Leer />;
    const max = Math.max(...data.map(d => d.office), 1);
    return (
        <ol className="ranking">
            {data.map((r, i) => (
                <li key={r.userId}>
                    <span className="ranking__pos">{i + 1}.</span>
                    <div>
                        <span>{r.name}</span>
                        <small>{lbl(r.abteilung)}</small>
                        <div className="ranking__bar"><i style={{ width: `${(r.office / max) * 100}%` }} /></div>
                    </div>
                    <b>{r.office}</b>
                </li>
            ))}
        </ol>
    );
}

const STATUS_ZELLE = {
    Office: { klasse: "office" },
    HomeOffice: { klasse: "homeoffice" },
    Abwesend: { klasse: "abwesend" },
};

// Wochenraster pro Mitarbeiter
export function TeamWeekGrid({ data, tage }) {
    const { t } = useLanguage();
    if (data.length === 0) return <Leer k="chart.emptyEmployees" />;
    return (
        <div className="table-scroll" role="region" aria-label={t("chart.grid.region")} tabIndex={0}>
            <div className="week-grid" role="table" aria-label={t("chart.grid.table")}>
                <div className="week-grid__row" role="row">
                    <span role="columnheader"><span className="sr-only">{t("chart.grid.employee")}</span></span>
                    {tage.map(t => <span key={t} role="columnheader" className="week-grid__head">{t}</span>)}
                </div>
                {data.map(m => (
                    <WeekRow key={m.userId} m={m} />
                ))}
            </div>
        </div>
    );
}

function WeekRow({ m }) {
    const { t, lbl } = useLanguage();
    return (
        <div className="week-grid__row" role="row">
            <span role="rowheader" className="week-grid__name">{m.name}<small>{lbl(m.abteilung)}</small></span>
            {m.tage.map((s, i) => {
                const z = s ? STATUS_ZELLE[s] : null;
                return (
                    <div key={i} role="cell" className={`week-grid__cell week-grid__cell--${z ? z.klasse : "leer"}`}>
                        {z ? t(`status.short.${s}`) : "–"}
                    </div>
                );
            })}
        </div>
    );
}

// Verteilung als Ring: Anteile von Office / Home Office / Abwesend
export function StatusDonut({ data }) {
    const animate = useAnimation();
    const { t, pct } = useLanguage();
    const { legende } = useReihen();
    const teile = [
        { name: t("status.Office"), value: data.office, farbe: FARBEN.office },
        { name: t("status.HomeOffice"), value: data.homeOffice, farbe: FARBEN.homeOffice },
        { name: t("status.Abwesend"), value: data.abwesend, farbe: FARBEN.abwesend },
    ].filter(t => t.value > 0);
    const gesamt = teile.reduce((summe, t) => summe + t.value, 0);
    if (gesamt === 0) return <Leer />;

    return (
        <>
            <Legende items={legende} />
            <div className="chart-plot chart-plot--sm">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie isAnimationActive={animate} data={teile} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%"
                            paddingAngle={3} stroke="none"
                            label={({ percent }) => (percent >= 0.05 ? pct(Math.round(percent * 100)) : "")}
                            labelLine={false}>
                            {teile.map(t => <Cell key={t.name} fill={t.farbe} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip suffix={` ${t("unit.days")}`} />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </>
    );
}
