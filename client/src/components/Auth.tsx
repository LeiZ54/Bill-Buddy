import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Spin } from "antd";
import useAuthStore from "../stores/authStore";

const RequireAuth = () => {
    const { token, exp, isLoading, logout } = useAuthStore();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        if (!token) {
            setIsAuthenticated(false);
            return;
        }

        const currentTime = Date.now() / 1000;
        if (exp && exp < currentTime) {
            logout();
            setIsAuthenticated(false);
        } else {
            setIsAuthenticated(true);
        }
    }, [token, exp, logout]);

    if (isLoading || isAuthenticated === null) {
        return <div className="flex justify-center items-center"><Spin size="large" /></div>;
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default RequireAuth;
