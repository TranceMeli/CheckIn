import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

const Footer = ({ className = "footer" }) => {
    const { t } = useLanguage();
    return (
        <footer className={className}>
            <span>{t("footer.demo")}</span>
            <nav aria-label={t("footer.legal")}>
                <Link to="/impressum">{t("footer.imprint")}</Link>
                <Link to="/datenschutz">{t("footer.privacy")}</Link>
            </nav>
        </footer>
    );
};

export default Footer;
