import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { api, setAccessToken } from "../api/api";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

const extractUserData = (token) => {
    try {
        const decoded = jwtDecode(token);
        return {
            email: decoded.email ?? "",
            username: decoded.username ?? "",
            role: decoded[ROLE_CLAIM] ?? decoded.role ?? null,
            exp: decoded.exp,
        };
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const logout = useCallback(async (callApi = true) => {
        if (callApi) {
            try {
                await api.post("/Auth/logout");
            } catch {
                // Cookie-Löschung passiert trotzdem
            }
        }
        setAccessToken(null);
        setUser(null);
        navigate("/login");
    }, [navigate]);

    // Beim App-Start: prüfen ob noch ein gültiger Refresh Token im Cookie ist
    useEffect(() => {
        const tryRestore = async () => {
            try {
                const res = await api.post("/Auth/refresh", {}, { withCredentials: true });
                const { accessToken } = res.data;
                setAccessToken(accessToken);
                const userData = extractUserData(accessToken);
                if (userData) setUser(userData);
            } catch {
                // Kein gültiger Cookie → bleibt ausgeloggt
            } finally {
                setLoading(false);
            }
        };
        tryRestore();
    }, []);

    // api.jsx feuert dieses Event wenn Refresh fehlschlägt
    useEffect(() => {
        const handleForcedLogout = () => logout(false);
        window.addEventListener("auth:logout", handleForcedLogout);
        return () => window.removeEventListener("auth:logout", handleForcedLogout);
    }, [logout]);

    const login = (accessToken) => {
        setAccessToken(accessToken);
        const userData = extractUserData(accessToken);
        if (userData) setUser(userData);
    };

    const isAdmin = () => user?.role === "Admin";
    const isUser = () => user?.role === "Mitarbeiter";

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);