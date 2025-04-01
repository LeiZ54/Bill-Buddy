import { GoogleLogin } from "@react-oauth/google";
import api from "../services/axiosConfig";
import { useNavigate } from "react-router-dom";

const GoogleLoginButton = () => {
    const navigate = useNavigate();
    const parseJWT = (token: string) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            return null;
        }
    };
    const handleLogin = async (credentialResponse: any) => {
        const googleId = credentialResponse.credential;

        try {
            const response = await api.post("/auth/google", {
                googleId,
            });
            localStorage.setItem("token", response.data.token);
            const payload = parseJWT(response.data.token);
            localStorage.setItem("token_exp", payload.exp.toString());
            navigate("/");
        } catch (error) {
            console.error("Google login failed", error);
        }
    };

    return (
        <GoogleLogin
            onSuccess={handleLogin}
            onError={() => alert("Google login failed")}
        />
    );
};

export default GoogleLoginButton;