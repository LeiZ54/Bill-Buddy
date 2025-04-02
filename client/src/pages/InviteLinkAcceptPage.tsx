import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { checkAuth } from "../services/auth";

const InviteLinkAcceptPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const inviteJWT = new URLSearchParams(location.search).get("token");
        sessionStorage.setItem("inviteJWT", inviteJWT || '');
        sessionStorage.removeItem("groupId");
        sessionStorage.removeItem("groupPage");
        sessionStorage.removeItem("groupType");
        sessionStorage.removeItem("groupName");
        sessionStorage.removeItem("groupItems");
        sessionStorage.removeItem("groupNetBalance");
        const verifyAndRedirect = () => {
            const isValid = checkAuth();
            if (!isValid) {
                localStorage.removeItem("token");
                localStorage.removeItem("token_exp");
                navigate("/login", { replace: true });
                return;
            }
            navigate("/groups");
        };

        verifyAndRedirect();
    }, [navigate, location.search]);

    return null;
};

export default InviteLinkAcceptPage;