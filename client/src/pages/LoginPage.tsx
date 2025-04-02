import { useState, FormEvent } from "react";
import api from "../services/axiosConfig";
import LRHeader from "../components/LRHeader";
import GoogleLoginButton from "../components/GoogleLoginButton"
import { AxiosError } from 'axios';
import { saveJWT } from "../services/jwt";
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const navigate = useNavigate();

    const validateField = (name: 'email' | 'password', value: string) => {
        const newErrors = { ...errors };

        if (!value.trim()) {
            newErrors[name] = `${name === 'email' ? 'Email' : 'Password'} cannot be empty!`;
        } else {
            delete newErrors[name];
        }

         
        if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            newErrors.email = "Please enter correct email!";
         }

        setErrors(newErrors);
    };


    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {};
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Please enter correct email!";
        if (!password.trim()) newErrors.password = "Please enter your password!";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setApiError(null);

        // Front end verification
        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await api.post("/auth/login", { email, password });
            if (response.status === 200) {
                saveJWT(response);
                navigate('/');
            }
        } catch (error) {
            if (error instanceof AxiosError && error.response?.data?.error) {
                setApiError(error.response.data.error);
            } else {
                setApiError("login fail, please try again!");
            }
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="flex flex-col min-h-screen items-center bg-white pt-32">
            <LRHeader activeButton={"login"} />
            <div className="w-full max-w-xs sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg rounded-xl bg-white p-8 border-2 border-black">
                {/* title */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Login</h2>
                </div>

                {/* login form */}
                <form className="mt-6" onSubmit={handleSubmit} noValidate>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Email</label>
                        <input
                            type="text"
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setErrors(prev => ({ ...prev, email: "" }));
                            }}
                            onBlur={(e) => {
                                validateField("email", e.target.value);
                            }}
                            className="mt-1 w-full rounded border-gray-300 p-2 focus:border-green-500 focus:ring focus:ring-green-300 border-2 border-gray"
                        />
                        {errors.email && (
                            <span className="text-red-500 text-sm">{errors.email}</span>
                        )}
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-bold text-gray-700">Password</label>
                        <input
                            type="password"
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setErrors(prev => ({ ...prev, password: "" }));
                            }}
                            onBlur={(e) => {
                                validateField("password", e.target.value);
                            }}
                            className="mt-1 w-full rounded border-gray-300 p-2 focus:border-green-500 focus:ring focus:ring-green-300 border-2 border-gray"
                        />
                        {errors.password && (
                            <span className="text-red-500 text-sm">{errors.password}</span>
                        )}
                    </div>

                
                    {/* login buttom */}
                    <button
                        type="submit"
                        className={`mt-6 w-full rounded bg-green-500 py-2 text-white hover:bg-green-600 transition ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                    {/* show api error */}
                    {apiError && <p className="text-red-500 text-sm mt-4">{apiError}</p>}
                    {/* forget */}
                    <div className="mt-4 text-center">
                        <a href="/forget" className="text-sm text-green-500 hover:underline">
                            Forgot your password?
                        </a>
                    </div>
                    <div className="mt-4 text-center">
                        <GoogleLoginButton />
                    </div>
                </form>

            </div>
        </div >
    );
}
