import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Footer from "./Footer";
import LanguageSwitch from "./LanguageSwitch";
import { useLanguage } from "../i18n/LanguageContext";
import "../styles/legal.css";

const LegalPage = ({ title, children }) => {
    const { t } = useLanguage();
    return (
    <div className="legal-page">
        <div className="lang-corner"><LanguageSwitch variant="light" /></div>
        <main className="legal-content">
            <Link to="/login" className="legal-back">
                <ArrowLeft size={16} aria-hidden="true" /> {t("legal.back")}
            </Link>
            <h1>{title}</h1>
            {children}
        </main>
        <Footer className="legal-footer" />
    </div>
    );
};

export default LegalPage;
