import { cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
    DEFAULT_LANGUAGE, isLanguage, label, localeOf, monthNames, readStoredLanguage,
    storeLanguage, translate, translateRich,
} from "./i18n";

const build = (lang, setLang) => ({
    lang,
    setLang,
    locale: localeOf(lang),
    months: monthNames(lang),
    t: (key, params) => translate(lang, key, params),
    rich: (key, params) => translateRich(lang, key, params)
        .map((part, i) => (isValidElement(part) ? cloneElement(part, { key: i }) : part)),
    // Beschriftungen aus den Daten übersetzen (Wochentage, Monate, Abteilungen)
    lbl: (value) => label(lang, value),
    pct: (n) => translate(lang, "pct", { n }),
});

// Ohne Provider (z. B. in Komponententests) gilt Deutsch
const LanguageContext = createContext(build(DEFAULT_LANGUAGE, () => {}));

export const LanguageProvider = ({ children }) => {
    const [lang, setLangState] = useState(readStoredLanguage);

    const setLang = useCallback((next) => {
        if (!isLanguage(next)) return;
        setLangState(next);
        storeLanguage(next);
    }, []);

    // Screenreader und Rechtschreibprüfung brauchen die Sprache der Seite
    useEffect(() => {
        document.documentElement.lang = lang;
    }, [lang]);

    const value = useMemo(() => build(lang, setLang), [lang, setLang]);
    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
