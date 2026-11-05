import "../styles/components.css"
import { useAuth } from "../contexts/AuthContext";
import { NavLink } from "react-router-dom";
import { BarChart3, CheckSquare, UserCog, Table } from "lucide-react";

const LINKS = {
    Admin: [
        { to: "/dashboard", label: "Auswertungen", icon: <BarChart3 size={18} aria-hidden="true" /> },
        { to: "/manage", label: "Verwalten", icon: <UserCog size={18} aria-hidden="true" /> },
        { to: "/list", label: "Export", icon: <Table size={18} aria-hidden="true" /> },
    ],
    Mitarbeiter: [
        { to: "/checkin", label: "Check-in", icon: <CheckSquare size={18} aria-hidden="true" /> },
        { to: "/dashboard", label: "Auswertungen", icon: <BarChart3 size={18} aria-hidden="true" /> },
    ],
};

// variant "top": Leiste im Header (Desktop), "tab": Tab-Leiste am unteren Rand (Handy/Tablet)
const Navbar = ({ variant = "top" }) => {
    const { user } = useAuth();
    const links = LINKS[user?.role] ?? [];

    return (
        <nav className={`nav-${variant}`} aria-label={variant === "tab" ? "Hauptnavigation (unten)" : "Hauptnavigation"}>
            <ul>
                {links.map(({ to, label, icon }) => (
                    <li key={to}>
                        <NavLink to={to} className={({ isActive }) => (isActive ? "active" : undefined)}>
                            {icon}
                            <span>{label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Navbar;
