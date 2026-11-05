export const JAHR = 2026; // Demodaten existieren nur für 2026

export const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"];

export const PERIODEN = [
    { key: "week", label: "Woche" },
    { key: "month", label: "Monat" },
    { key: "quarter", label: "Quartal" },
    { key: "year", label: "Jahr" },
];

export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7));
export const fmt = (d) => d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });

export const isoWeek = (d) => {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
    return Math.ceil(((t - new Date(Date.UTC(t.getUTCFullYear(), 0, 1))) / 86400000 + 1) / 7);
};

export const clampToYear = (d) => {
    const min = new Date(JAHR, 0, 1);
    const max = new Date(JAHR, 11, 31);
    return d < min ? min : d > max ? max : d;
};

// Start/Ende und Beschriftung des gewählten Zeitraums
export const zeitraum = (periode, anker) => {
    if (periode === "week") {
        const von = mondayOf(anker);
        const bis = addDays(von, 6);
        return { von, bis, label: `KW ${isoWeek(von)} · ${fmt(von)} – ${fmt(bis)}` };
    }
    if (periode === "month") {
        return {
            von: new Date(anker.getFullYear(), anker.getMonth(), 1),
            bis: new Date(anker.getFullYear(), anker.getMonth() + 1, 0),
            label: `${MONATE[anker.getMonth()]} ${anker.getFullYear()}`,
        };
    }
    if (periode === "quarter") {
        const q = Math.floor(anker.getMonth() / 3);
        return {
            von: new Date(anker.getFullYear(), q * 3, 1),
            bis: new Date(anker.getFullYear(), q * 3 + 3, 0),
            label: `Q${q + 1} ${anker.getFullYear()}`,
        };
    }
    return { von: new Date(JAHR, 0, 1), bis: new Date(JAHR, 11, 31), label: `Jahr ${JAHR}` };
};

export const verschiebe = (periode, anker, richtung) => {
    if (periode === "week") return addDays(anker, 7 * richtung);
    if (periode === "month") return new Date(anker.getFullYear(), anker.getMonth() + richtung, 1);
    if (periode === "quarter") return new Date(anker.getFullYear(), anker.getMonth() + 3 * richtung, 1);
    return anker;
};

// Darf der Zeitraum nach dieser Verschiebung noch komplett im Demo-Jahr liegen?
export const verschiebungMoeglich = (periode, anker, richtung) => {
    if (periode === "year") return false;
    const z = zeitraum(periode, verschiebe(periode, anker, richtung));
    return z.von.getFullYear() === JAHR && z.bis.getFullYear() === JAHR;
};
