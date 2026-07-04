import axios from "axios";

export const api = axios.create({
    baseURL: "https://localhost:7005/api",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // Cookie (Refresh Token) wird automatisch mitgeschickt
});

// Access Token kommt von außen rein – nicht aus localStorage
let accessToken = null;

export const setAccessToken = (token) => {
    accessToken = token;
};

export const getAccessToken = () => accessToken;

// Jeder Request bekommt den Access Token aus dem Memory
api.interceptors.request.use(config => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

// Bei 401: einmal versuchen den Token per Refresh zu erneuern
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Andere Requests warten bis Refresh fertig ist
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Cookie wird automatisch mitgeschickt (withCredentials: true)
                const res = await axios.post(
                    "https://localhost:7005/api/Auth/refresh",
                    {},
                    { withCredentials: true }
                );

                const newToken = res.data.accessToken;
                setAccessToken(newToken);
                processQueue(null, newToken);

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                setAccessToken(null);
                // AuthContext übernimmt die Weiterleitung zum Login
                window.dispatchEvent(new Event("auth:logout"));
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);