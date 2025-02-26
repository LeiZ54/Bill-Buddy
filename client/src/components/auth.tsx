import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const auth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const WithAuth: React.FC<P> = (props) => {
        const navigate = useNavigate();

        useEffect(() => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
            }
        }, [navigate]);

        return <WrappedComponent {...props} />;
    };

    return WithAuth;
};

export default auth;
