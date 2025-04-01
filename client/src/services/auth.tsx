import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const auth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const WithAuth: React.FC<P> = (props) => {
        const navigate = useNavigate();

        const checkAuth = () => {
            const token = localStorage.getItem("token");
            const storedExp = localStorage.getItem("token_exp");

            if (!token || !storedExp) {
                navigate("/login");
                return false;
            }

            const expTime = parseInt(storedExp, 10);
            const currentTime = Math.floor(Date.now() / 1000);

            if (currentTime > expTime) {
                localStorage.removeItem("token");
                localStorage.removeItem("token_exp");
                navigate("/login");
                return false;
            }

            return true;
        };

        useEffect(() => {
            checkAuth();
        }, [navigate]);

        return checkAuth() ? <WrappedComponent {...props} /> : null;
    };

    return WithAuth;
};

export default auth;