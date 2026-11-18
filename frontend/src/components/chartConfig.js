export const FARBEN = {
    office: "#0D9488",
    homeOffice: "#F59E0B",
    abwesend: "#EF4444",
    nav: "#263445",
    muted: "#4F6B6A",
    grid: "#E0F0EE",
};

export const ZIEL_QUOTE = 60;

export const quote = (teil, gesamt) => (gesamt > 0 ? Math.round((teil / gesamt) * 100) : 0);
