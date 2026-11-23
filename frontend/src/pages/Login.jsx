import { useState } from "react";
import '../styles/pages.css';
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/checkin_logo.svg";
import { Toaster, toast } from "react-hot-toast";
import Footer from "../components/Footer";
import LanguageSwitch from "../components/LanguageSwitch";
import { useLanguage } from "../i18n/LanguageContext";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [credentials, setCredentials] = useState({ email: "", password: "" });

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const loginRequest = async () => {
            const response = await axios.post(
                "https://localhost:7005/api/Auth/login",
                credentials,
                { withCredentials: true }
            );
            const { accessToken, roles } = response.data;
            login(accessToken, roles);
            const role = roles?.[0];
            if (role === "Admin" || role === "Mitarbeiter") {
                navigate("/dashboard");
            } else {
                navigate("/login");
            }
        };

        toast.promise(loginRequest(), {
            loading: t("login.loading"),
            success: t("login.success"),
            error: t("login.error"),
        });
    };

    return (
        <div className="login-page">
            <Toaster position="top-center" />
            <div className="lang-corner"><LanguageSwitch variant="light" /></div>
            <div className="login-container">
                <h1>{t("login.title")}</h1>
                <img src={logo} className="login-logo" alt="" />
                <form onSubmit={handleSubmit}>
                    <label>
                        {t("login.email")}
                        <input
                            type="email"
                            name="email"
                            value={credentials.email}
                            onChange={handleChange}
                            placeholder={t("login.emailPlaceholder")}
                        />
                    </label>
                    <label>
                        {t("login.password")}
                        <input
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            value={credentials.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                            required
                        />
                    </label>
                    <button className="lBtn" type="submit">{t("login.submit")}</button>
                </form>
            </div>
            <Footer className="login-footer" />
        </div>
    );
};

export default Login;