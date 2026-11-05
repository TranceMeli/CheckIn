import { useEffect, useRef, useState } from "react";
import { User, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const ROLLEN = { Admin: "Administrator", Mitarbeiter: "Mitarbeiter" };

// Benutzer-Icon im Header: wird nur gerendert, wenn jemand eingeloggt ist
const UserMenu = () => {
    const { user, logout } = useAuth();
    const [offen, setOffen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!offen) return;
        const schliessen = (e) => {
            if (e.type === "keydown" ? e.key === "Escape" : !ref.current?.contains(e.target)) setOffen(false);
        };
        document.addEventListener("mousedown", schliessen);
        document.addEventListener("keydown", schliessen);
        return () => {
            document.removeEventListener("mousedown", schliessen);
            document.removeEventListener("keydown", schliessen);
        };
    }, [offen]);

    if (!user) return null;

    return (
        <div className="user-menu" ref={ref}>
            <button type="button" className="user-menu__trigger" aria-haspopup="menu" aria-expanded={offen}
                aria-label="Benutzermenü" onClick={() => setOffen(o => !o)}>
                <User size={18} aria-hidden="true" />
            </button>
            {offen && (
                <div className="user-menu__panel" role="menu">
                    <div className="user-menu__info">
                        <strong>{user.email}</strong>
                        <span>{ROLLEN[user.role] ?? user.role}</span>
                    </div>
                    <button type="button" role="menuitem" className="user-menu__item" onClick={() => logout()}>
                        <LogOut size={16} aria-hidden="true" /> Abmelden
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
