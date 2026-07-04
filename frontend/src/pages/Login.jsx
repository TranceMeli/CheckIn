import { useState } from "react";
import '../styles/pages.css';
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import accountIcon from "../assets/account_icon.svg";
import { Toaster, toast } from "react-hot-toast";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
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
            loading: "Einloggen...",
            success: "Willkommen",
            error: "Email oder Passwort falsch",
        });
    };

    return (
        <div className="login-page">
            <Toaster position="top-center" />
            <div className="login-container">
                <h1>Willkommen bei CheckIn</h1>
                <img src={accountIcon} className="account-icon" alt="" />
                <form onSubmit={handleSubmit}>
                    <label>
                        Email
                        <input
                            type="email"
                            name="email"
                            value={credentials.email}
                            onChange={handleChange}
                            placeholder="name@firma.de"
                        />
                    </label>
                    <label>
                        Passwort
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
                    <button className="lBtn" type="submit">Einloggen</button>
                </form>
            </div>
        </div>
    );
};

export default Login;