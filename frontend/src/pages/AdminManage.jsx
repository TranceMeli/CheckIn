import { useState, useEffect } from "react";
import { api } from "../api/api";
import "../styles/dashboard.css";
import { toast, Toaster } from "react-hot-toast";

function AdminManage() {
    const [mitarbeiter, setMitarbeiter] = useState([]);
    const [checkInLoading, setCheckInLoading] = useState(false);
    const [adminCheckIn, setAdminCheckIn] = useState({
        userId: "",
        status: "HomeOffice",
    });

    useEffect(() => {
        api.get("/User")
            .then(res => setMitarbeiter(res.data))
            .catch(err => console.error(err));
    }, []);

    const handleAdminCheckIn = async () => {
        if (!adminCheckIn.userId || checkInLoading) return;
        setCheckInLoading(true);

        try {
            await api.post(`/User/${adminCheckIn.userId}/checkin`, {
                status: adminCheckIn.status,
            });
            toast.success("Erfolgreich eingecheckt!");
        } catch (err) {
            if (err.response?.status === 409) {
                toast.error("Bereits heute eingecheckt.");
            } else {
                toast.error("Fehler beim Einchecken.");
            }
        } finally {
            setCheckInLoading(false);
        }
    };

    return (
        <div className="admin-checkin-box">
            <Toaster position="top-center" />
            <h3>Nachträglich einchecken</h3>
            <div className="admin-checkin-row">
                <select
                    value={adminCheckIn.userId}
                    onChange={e => setAdminCheckIn({ ...adminCheckIn, userId: e.target.value })}
                >
                    <option value="">Mitarbeiter wählen</option>
                    {mitarbeiter.map(m => (
                        <option key={m.id} value={m.id}>
                            {m.firstName} {m.lastName} ({m.abteilung})
                        </option>
                    ))}
                </select>

                <select
                    value={adminCheckIn.status}
                    onChange={e => setAdminCheckIn({ ...adminCheckIn, status: e.target.value })}
                >
                    <option value="HomeOffice">Home Office</option>
                    <option value="Office">Office</option>
                    <option value="Abwesend">Abwesend</option>
                </select>

                <button onClick={handleAdminCheckIn} disabled={checkInLoading}>
                    {checkInLoading ? "Lädt..." : "Einchecken"}
                </button>
            </div>
        </div>
    );
}

export default AdminManage;