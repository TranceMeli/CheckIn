import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Outlet } from "react-router";

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    // Warten bis tryRestore fertig ist – verhindert Race Condition
    if (loading) return null;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;