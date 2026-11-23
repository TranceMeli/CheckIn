import "../styles/components.css"
import { useAuth } from "../contexts/AuthContext";
import { NavLink } from "react-router-dom";
import { BarChart3, CheckSquare, UserCog, Table } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

const LINKS = {
    Admin: [
        { to: "/dashboard", labelKey: "nav.dashboard", icon: <BarChart3 size={18} aria-hidden="true" /> },
        { to: "/manage", labelKey: "nav.manage", icon: <UserCog size={18} aria-hidden="true" /> },
        { to: "/list", labelKey: "nav.export", icon: <Table size={18} aria-hidden="true" /> },
    ],
    Mitarbeiter: [
        { to: "/checkin", labelKey: "nav.checkin", icon: <CheckSquare size={18} aria-hidden="true" /> },
        { to: "/dashboard", labelKey: "nav.dashboard", icon: <BarChart3 size={18} aria-hidden="true" /> },
    ],
};

// variant "top": Leiste im Header (Desktop), "tab": Tab-Leiste am unteren Rand (Handy/Tablet)
const Navbar = ({ variant = "top" }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const links = LINKS[user?.role] ?? [];

    return (
        <nav className={`nav-${variant}`} aria-label={variant === "tab" ? t("nav.mainBottom") : t("nav.main")}>
            <ul>
                {links.map(({ to, labelKey, icon }) => (
                    <li key={to}>
                        <NavLink to={to} className={({ isActive }) => (isActive ? "active" : undefined)}>
                            {icon}
                            <span>{t(labelKey)}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Navbar;
