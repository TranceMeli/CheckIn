import { LANGUAGES } from "../i18n/i18n";
import { useLanguage } from "../i18n/LanguageContext";

// Umschalter DE | EN. Der zugängliche Name beginnt mit dem sichtbaren Text (WCAG 2.5.3 Label in Name). variant "dark" für die Kopfleiste, "light" für Anmeldung und Rechtsseiten.
const LanguageSwitch = ({ variant = "dark" }) => {
    const { lang, setLang, t } = useLanguage();

    return (
        <div className={`lang-switch lang-switch--${variant}`} role="group" aria-label={t("lang.group")}>
            {LANGUAGES.map(code => (
                <button key={code} type="button" lang={code} aria-pressed={lang === code}
                    aria-label={`${code.toUpperCase()} – ${t(`lang.${code}`)}`} onClick={() => setLang(code)}>
                    {code.toUpperCase()}
                </button>
            ))}
        </div>
    );
};

export default LanguageSwitch;
