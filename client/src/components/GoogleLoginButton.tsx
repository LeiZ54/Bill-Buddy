import { GoogleLogin } from "@react-oauth/google";
import api from "../services/axiosConfig";
import { saveJWT } from "../services/jwt";
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
    const navigate = useNavigate();
    const handleLogin = async (credentialResponse: any) => {
        const googleId = credentialResponse.credential;

        try {
            const response = await api.post("/auth/google", {
                googleId,
            });
            saveJWT(response);
            navigate('/');
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