import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from 'react-router-dom';
import api from "../util/axiosConfig";

const GoogleLoginButton = () => {
    const navigate = useNavigate();
    const handleLogin = async (credentialResponse: any) => {
        const googleId = credentialResponse.credential;

        try {
            const response = await api.post("/auth/google", {
                googleId,
            });
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