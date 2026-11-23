import { useLanguage } from "../i18n/LanguageContext";

const Unauthorized = () => {
    const { t } = useLanguage();
    return (
    <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "60vh", gap: 12, color: "#4F6B6A"
    }}>
        <h2 style={{ color: "#EF4444", margin: 0 }}>{t("unauthorized.title")}</h2>
        <p style={{ margin: 0, fontSize: 14 }}>{t("unauthorized.text")}</p>
    </div>
    );
};

export default Unauthorized;