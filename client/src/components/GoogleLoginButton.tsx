import { GoogleLogin } from "@react-oauth/google";
import api from "../services/axiosConfig";
import { useNavigate } from "react-router-dom";

const GoogleLoginButton = () => {
    const navigate = useNavigate();
    const handleLogin = async (credentialResponse: any) => {
        const googleId = credentialResponse.credential;

        try {
            const response = await api.post("/auth/google", {
                googleId,
            });
            localStorage.setItem("token", response.data.token);
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