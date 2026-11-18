import { useState, useEffect, useMemo, useCallback } from "react";
import { Building2, Home, Plane } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { api } from "../api/api";
import "../styles/dashboard.css";
import "../styles/manage.css";
import { JAHR } from "../utils/zeitraum";
import { useLanguage } from "../i18n/LanguageContext";


const STATUS = [
    { value: "Office", icon: <Building2 size={20} aria-hidden="true" />, klasse: "office" },
    { value: "HomeOffice", icon: <Home size={20} aria-hidden="true" />, klasse: "homeoffice" },
    { value: "Abwesend", icon: <Plane size={20} aria-hidden="true" />, klasse: "abwesend" },
];
const OHNE_ABTEILUNG = "Ohne Abteilung"; // Gruppenschlüssel für Personen ohne Abteilung

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s) => new Date(`${s}T00:00:00`);
const tagLabel = (s, locale) => parse(s).toLocaleDateString(locale, { weekday: "short", day: "2-digit", month: "2-digit" });
const monatLabel = (s, locale) => parse(s).toLocaleDateString(locale, { month: "long", year: "numeric" });

const heute = () => {
    const h = new Date();
    return h.getFullYear() === JAHR ? h : new Date(JAHR, 11, 31);
};

function AdminManage() {
    const { t, rich, lbl, locale } = useLanguage();
    const [mitarbeiter, setMitarbeiter] = useState([]);
    const [userId, setUserId] = useState("");
    const [datum, setDatum] = useState(() => iso(heute()));
    const [status, setStatus] = useState("Office");
    const [eintraege, setEintraege] = useState([]);
    const [bestehend, setBestehend] = useState(null);
    const [speichert, setSpeichert] = useState(false);
    const [fehlend, setFehlend] = useState(null);

    const maxDatum = iso(heute());
    const ausgewaehlt = mitarbeiter.find(m => m.id === userId);

    const nachAbteilung = useMemo(() => {
        const gruppen = {};
        mitarbeiter.forEach(m => (gruppen[m.abteilung || OHNE_ABTEILUNG] ??= []).push(m));
        return Object.entries(gruppen).sort(([a], [b]) => a.localeCompare(b));
    }, [mitarbeiter]);

    useEffect(() => {
        api.get("/User/mitarbeiter")
            .then(res => setMitarbeiter(res.data))
            .catch(() => toast.error(t("manage.toast.loadEmployees")));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps -- t wechselt nur mit der Sprache, dafür wird nicht neu geladen

    // Wer hat heute noch nicht eingecheckt? (nur an Werktagen)
    useEffect(() => {
        const h = heute();
        const wochentag = (h.getDay() + 6) % 7;
        if (wochentag > 4) return;
        const montag = new Date(h.getFullYear(), h.getMonth(), h.getDate() - wochentag);
        api.get("/Dashboard/team-woche", { params: { montag: iso(montag) } })
            .then(res => setFehlend(res.data.filter(m => m.tage[wochentag] == null)))
            .catch(() => setFehlend(null));
    }, []);

    const ladeEintraege = useCallback(async () => {
        if (!userId) { setEintraege([]); return; }
        const d = parse(datum);
        const von = new Date(d.getFullYear(), d.getMonth(), 1);
        const bis = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        try {
            const res = await api.get(`/User/${userId}/checkins`, { params: { von: iso(von), bis: iso(bis) } });
            setEintraege(res.data);
        } catch {
            toast.error(t("manage.toast.loadEntries"));
        }
    }, [userId, datum.slice(0, 7)]); // eslint-disable-line react-hooks/exhaustive-deps -- nur der Monat von datum ist relevant

    useEffect(() => { ladeEintraege(); }, [ladeEintraege]);

    // Hinweis auf vorhandenen Eintrag, sobald Datum oder Person wechseln
    useEffect(() => {
        const vorhanden = eintraege.find(e => e.datum === datum);
        setBestehend(vorhanden ? vorhanden.status : null);
    }, [eintraege, datum]);

    const speichern = async (overwrite) => {
        if (!userId || !datum || speichert) return;
        setSpeichert(true);
        try {
            await api({
                method: overwrite ? "put" : "post",
                url: `/User/${userId}/checkin`,
                data: { status, datum },
            });
            toast.success(overwrite ? t("manage.toast.changed") : t("manage.toast.added"));
            await ladeEintraege();
            setFehlend(f => f?.filter(m => m.userId !== userId) ?? f);
        } catch (err) {
            if (err.response?.status === 409) {
                setBestehend(err.response.data.bestehenderStatus);
            } else if (err.response?.status === 400) {
                toast.error(t("manage.toast.badDate"));
            } else {
                toast.error(t("manage.toast.saveFailed"));
            }
        } finally {
            setSpeichert(false);
        }
    };

    const waehle = (id, tag = null) => {
        setUserId(id);
        if (tag) setDatum(tag);
    };

    return (
        <div className="manage">
            <Toaster position="top-center" />
            <h1>{t("manage.title")}</h1>

            <div className="manage__grid">
                <section className="chart-box manage__form">
                    <h3>{t("manage.add")}</h3>

                    <label className="field">
                        <span>{t("manage.employee")}</span>
                        <select value={userId} onChange={e => waehle(e.target.value)}>
                            <option value="">{t("manage.choose")}</option>
                            {nachAbteilung.map(([abteilung, liste]) => (
                                <optgroup key={abteilung} label={abteilung === OHNE_ABTEILUNG ? t("dept.none") : lbl(abteilung)}>
                                    {liste.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                                </optgroup>
                            ))}
                        </select>
                    </label>

                    <label className="field">
                        <span>{t("manage.date")}</span>
                        <input type="date" value={datum} min={`${JAHR}-01-01`} max={maxDatum}
                            onChange={e => e.target.value && setDatum(e.target.value)} />
                    </label>

                    <fieldset className="field">
                        <legend>{t("manage.status")}</legend>
                        <div className="status-pick">
                            {STATUS.map(({ value, icon, klasse }) => (
                                <label key={value} className={`status-pick__option status-pick__option--${klasse}${status === value ? " is-on" : ""}`}>
                                    <input type="radio" name="status" value={value} checked={status === value}
                                        onChange={() => setStatus(value)} />
                                    {icon}
                                    {t(`status.${value}`)}
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    {bestehend && (
                        <p className="manage__hint" role="status">
                            {rich("manage.existing", { day: tagLabel(datum, locale), status: <strong>{t(`status.${bestehend}`)}</strong> })}
                        </p>
                    )}

                    <div className="manage__actions">
                        {bestehend ? (
                            <button type="button" className="btn btn--primary" disabled={!userId || speichert || bestehend === status}
                                onClick={() => speichern(true)}>
                                {speichert ? t("manage.saving") : t("manage.change")}
                            </button>
                        ) : (
                            <button type="button" className="btn btn--primary" disabled={!userId || speichert}
                                onClick={() => speichern(false)}>
                                {speichert ? t("manage.saving") : t("manage.addButton")}
                            </button>
                        )}
                    </div>
                </section>

                <section className="chart-box manage__list">
                    <h3>
                        {ausgewaehlt ? `${ausgewaehlt.firstName} ${ausgewaehlt.lastName}` : t("manage.entries")}
                        <span className="chart-box__hint">{monatLabel(datum, locale)}</span>
                    </h3>

                    {!ausgewaehlt ? (
                        <p className="chart-empty">{t("manage.pick")}</p>
                    ) : eintraege.length === 0 ? (
                        <p className="chart-empty">{t("manage.noEntries")}</p>
                    ) : (
                        <ul className="entry-list">
                            {eintraege.map(e => (
                                <li key={e.datum} className={e.datum === datum ? "is-selected" : ""}>
                                    <span>{tagLabel(e.datum, locale)}</span>
                                    <span className={`badge badge--${e.status.toLowerCase()}`}>{t(`status.${e.status}`)}</span>
                                    <button type="button" onClick={() => { setDatum(e.datum); setStatus(e.status); }}>{t("manage.edit")}</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            {fehlend && (
                <section className="chart-box">
                    <h3>{t("manage.missing")}<span className="chart-box__hint">{fehlend.length}</span></h3>
                    {fehlend.length === 0 ? (
                        <p className="chart-empty">{t("manage.missingNone")}</p>
                    ) : (
                        <ul className="missing-list">
                            {fehlend.map(m => (
                                <li key={m.userId}>
                                    <button type="button" onClick={() => waehle(m.userId, maxDatum)}>
                                        {m.name}<small>{lbl(m.abteilung)}</small>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}
        </div>
    );
}

export default AdminManage;
