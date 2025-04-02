import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const checkAuth = () => {
    const token = localStorage.getItem("token");
    const storedExp = localStorage.getItem("token_exp");

    if (!token || !storedExp) return false;

    const expTime = parseInt(storedExp, 10);
    return Math.floor(Date.now() / 1000) < expTime;
};


export const auth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const WithAuth: React.FC<P> = (props) => {
        const navigate = useNavigate();
        const [isAuthenticated, setIsAuthenticated] = useState(false);


        useEffect(() => {
            const verifyAuth = () => {
                const isValid = checkAuth();
                if (!isValid) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("token_exp");
                    navigate("/login", { replace: true });
                }
                setIsAuthenticated(isValid);
            };
            verifyAuth();
        }, [navigate]);
        if (isAuthenticated === false) {
            return null;
        }
        return <WrappedComponent {...props} />;
    };

    return WithAuth;
};