import { ChevronLeft, ChevronRight } from "lucide-react";
import { PERIODEN, verschiebe, verschiebungMoeglich } from "../utils/zeitraum";
import { useLanguage } from "../i18n/LanguageContext";

// Umschalter Woche/Monat/Quartal/Jahr mit Vor- und Zurück-Pfeilen
const PeriodBar = ({ periode, onPeriode, anker, onAnker, label }) => {
    const { t } = useLanguage();
    return (
    <>
        <div className="seg" role="group" aria-label={t("period.group")}>
            {PERIODEN.map(p => (
                <button key={p.key} type="button" className={periode === p.key ? "on" : ""}
                    aria-pressed={periode === p.key} onClick={() => onPeriode(p.key)}>
                    {t(`period.${p.key}`)}
                </button>
            ))}
        </div>

        <div className="stepper" aria-label={t("period.change")}>
            <button type="button" aria-label={t("period.prev")} disabled={!verschiebungMoeglich(periode, anker, -1)}
                onClick={() => onAnker(verschiebe(periode, anker, -1))}>
                <ChevronLeft size={16} />
            </button>
            <span>{label}</span>
            <button type="button" aria-label={t("period.next")} disabled={!verschiebungMoeglich(periode, anker, 1)}
                onClick={() => onAnker(verschiebe(periode, anker, 1))}>
                <ChevronRight size={16} />
            </button>
        </div>
    </>
    );
};

export default PeriodBar;
