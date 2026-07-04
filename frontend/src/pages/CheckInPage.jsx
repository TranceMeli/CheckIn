import { useState, useEffect } from "react";
import { api } from "../api/api";
import { Home, Building2, Clock } from "lucide-react";
import Button from "../components/Button";
import { toast, Toaster } from "react-hot-toast";

const options = [
    { value: "HomeOffice", label: "Home Office", color: "43 96% 56%",  Icon: Home },
    { value: "Office",     label: "Office",      color: "168 84% 32%", Icon: Building2 },
    { value: "Abwesend",   label: "Abwesend",    color: "0 83% 60%",   Icon: Clock },
];

function CheckInPage() {
    const [selected, setSelected] = useState("");
    const [currentStatus, setCurrentStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [checkedInToday, setCheckedInToday] = useState(false);

    useEffect(() => {
        api.get("/CheckIn/checkin")
            .then(response => {
                const status = response.data.status || "";
                setSelected(status);
                setCurrentStatus(status);
                setCheckedInToday(response.data.alreadyCheckedIn);
            })
            .catch(err => {
                if (err.response?.status === 404) return;
                toast.error("Fehler beim Laden der Daten");
            });
    }, []);

    const hasChanged = selected && selected !== currentStatus && !checkedInToday;

    const handleConfirm = async () => {
        if (!hasChanged) return;
        setLoading(true);
        try {
            await api.post("/CheckIn/set-status", { status: selected });
            setCurrentStatus(selected);
            setCheckedInToday(true);
            toast.success("Erfolgreich eingecheckt!");
        } catch {
            toast.error("Speichern fehlgeschlagen");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Toaster position="top-center" />
            {checkedInToday && (
                <p style={{
                    textAlign: "center", padding: "12px 0 0",
                    color: "#5E7B7A", fontSize: 14
                }}>
                    Du hast heute bereits eingecheckt.
                </p>
            )}
            <div className="container">
                {options.map(opt => {
                    const isActive = selected === opt.value;
                    const isDisabled = checkedInToday && !isActive;
                    return (
                        <label
                            key={opt.value}
                            className={`card${isActive ? " active" : ""}${isDisabled ? " disabled" : ""}`}
                            style={{ "--color": opt.color }}
                        >
                            <input
                                type="radio"
                                name="status"
                                value={opt.value}
                                checked={isActive}
                                onChange={() => setSelected(opt.value)}
                            />
                            <div className="card-center">
                                <opt.Icon size={80} strokeWidth={1.5} />
                                <div className="card-title">{opt.label}</div>
                            </div>
                            {isActive && (
                                <div className="card-action">
                                    <Button
                                        label={loading ? "Speichert..." : "Einchecken"}
                                        onClick={handleConfirm}
                                        disabled={loading || checkedInToday}
                                        variant="primary"
                                    />
                                </div>
                            )}
                        </label>
                    );
                })}
            </div>
        </>
    );
}

export default CheckInPage;