import { de, MONTHS_DE, LABELS_DE } from "./messages.de";
import { en, MONTHS_EN, LABELS_EN } from "./messages.en";

export const LANGUAGES = ["de", "en"];
export const DEFAULT_LANGUAGE = "de";
export const STORAGE_KEY = "checkin.lang";

const MESSAGES = { de, en };
const MONTHS = { de: MONTHS_DE, en: MONTHS_EN };
const LABELS = { de: LABELS_DE, en: LABELS_EN };
// Sprache für Datumsformate und Wochentagsnamen (en-GB: Tag vor Monat, Montag als Wochenstart)
const LOCALES = { de: "de-DE", en: "en-GB" };

export const isLanguage = (lang) => LANGUAGES.includes(lang);
export const localeOf = (lang) => LOCALES[lang] ?? LOCALES[DEFAULT_LANGUAGE];
export const monthNames = (lang) => MONTHS[lang] ?? MONTHS[DEFAULT_LANGUAGE];

// Fehlt ein Schlüssel in der Zielsprache, wird der deutsche Text benutzt, zuletzt der Schlüssel selbst.
const template = (lang, key) => MESSAGES[lang]?.[key] ?? MESSAGES[DEFAULT_LANGUAGE][key] ?? key;

// Ersetzt {name} durch die Werte aus params
export const translate = (lang, key, params = {}) =>
    template(lang, key).replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));

// Wie translate, erlaubt aber React-Elemente als Werte (z. B. <strong>) und liefert eine Liste von Teilen
export const translateRich = (lang, key, params = {}) =>
    template(lang, key)
        .split(/(\{\w+\})/)
        .map((part) => {
            const name = part.match(/^\{(\w+)\}$/)?.[1];
            return name && name in params ? params[name] : part;
        })
        .filter((part) => part !== "");

// Beschriftung aus den Daten (Wochentag, Monat, Abteilung) in die gewählte Sprache übersetzen
export const label = (lang, value) => LABELS[lang]?.[value] ?? value;

export const readStoredLanguage = () => {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
    } catch {
        return DEFAULT_LANGUAGE;
    }
};

export const storeLanguage = (lang) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
        // Speicher blockiert (z. B. privater Modus): die Wahl gilt dann nur bis zum Neuladen
    }
};
