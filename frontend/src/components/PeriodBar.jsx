import { ChevronLeft, ChevronRight } from "lucide-react";
import { PERIODEN, verschiebe, verschiebungMoeglich } from "../utils/zeitraum";

// Umschalter Woche/Monat/Quartal/Jahr mit Vor- und Zurück-Pfeilen
const PeriodBar = ({ periode, onPeriode, anker, onAnker, label }) => (
    <>
        <div className="seg" role="group" aria-label="Zeitraum">
            {PERIODEN.map(p => (
                <button key={p.key} type="button" className={periode === p.key ? "on" : ""}
                    aria-pressed={periode === p.key} onClick={() => onPeriode(p.key)}>
                    {p.label}
                </button>
            ))}
        </div>

        <div className="stepper" aria-label="Zeitraum wechseln">
            <button type="button" aria-label="Voriger Zeitraum" disabled={!verschiebungMoeglich(periode, anker, -1)}
                onClick={() => onAnker(verschiebe(periode, anker, -1))}>
                <ChevronLeft size={16} />
            </button>
            <span>{label}</span>
            <button type="button" aria-label="Nächster Zeitraum" disabled={!verschiebungMoeglich(periode, anker, 1)}
                onClick={() => onAnker(verschiebe(periode, anker, 1))}>
                <ChevronRight size={16} />
            </button>
        </div>
    </>
);

export default PeriodBar;
