import { useState, FormEvent } from "react";
import api from "../services/axiosConfig";
import { useNavigate } from "react-router-dom";
import LRHeader from "../components/LRHeader";
import { AxiosError } from 'axios';

type FieldErrors = {
    email?: string;
    username?: string;
    password?: string;
    rePassword?: string;
    api?: string;
};


export default function RegisterPage() {
    const [email, setEmail] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [rePassword, setRePassword] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<FieldErrors>({});
    const navigate = useNavigate();

    const checkEmailAvailability = async (email: string) => {
        try {
            const response = await api.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
            if (response.data.available) {
                setErrors(prev => ({ ...prev, email: "This email has already been registered!" }));
            }
        } catch (error) {
            console.error("email check failed:", error);
        }
    };

    const validateField = (name: keyof FieldErrors, value: string) => {
        const newErrors = { ...errors };

        delete newErrors[name];
        delete newErrors.api;

        switch (name) {
            case 'email':
                if (!value) {
                    newErrors.email = "Email cannot be empty!";
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    newErrors.email = "Invalid email format!";
                } else {
                    checkEmailAvailability(value);
                }
                break;
            case 'username':
                if (!value) {
                    newErrors.username = "UserName cannot be empty!";
                } else if (value.length < 4) {
                    newErrors.username = "The UserName must be at least 4 characters!";
                } else if (!/^[A-Za-z0-9]+$/.test(value)) {
                    newErrors.username = "The UserName can only contain letters and numbers!";
                }
                break;
            case 'password':
                if (!value) {
                    newErrors.password = "Password cannot be empty!";
                }else if (value.length < 6) {
                    newErrors.password = "Password must be at least 6 characters!";
                }
                break;
            case 'rePassword':
                if (!value) {
                    newErrors.rePassword = "RePassword cannot be empty!";
                }else if (value !== password) {
                    newErrors.rePassword = "RePassword inconsistency!";
                }
                break;
        }

        setErrors(newErrors);
    };

    const validateForm = () => {
        const newErrors: FieldErrors = {};

        if (!email) {
            newErrors.email = "Email cannot be empty!";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Invalid email format!";
        }

        if (!username) {
            newErrors.username = "UserName cannot be empty!";
        } else if (username.length < 4) {
            newErrors.username = "The UserName must be at least 4 characters!";
        } else if (!/^[A-Za-z0-9]+$/.test(username)) {
            newErrors.username = "The UserName can only contain letters and numbers!";
        }

        if (!password) {
            newErrors.password = "Password cannot be empty!";
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters!";
        }

        if (!rePassword) {
            newErrors.rePassword = "RePassword cannot be empty!";
        } else if (rePassword !== password) {
            newErrors.rePassword = "RePassword inconsistency!";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!validateForm()) return;

        setLoading(true);

        try {
            const registerResponse = await api.post("/auth/register", {
                username,
                password,
                email,
            });
            // check res
            if (registerResponse.status === 200) {
                //auto login
                const loginResponse = await api.post("/auth/login", {
                    username,
                    password,
                });
                localStorage.setItem("token", loginResponse.data.token);
                navigate("/");
            }
        } catch (error) {
            if (error instanceof AxiosError) {
                const serverError = error.response?.data?.error;

                const fieldErrors: FieldErrors = {};
                if (serverError.includes("Email")) {
                    fieldErrors.email = serverError;
                } else if (serverError.includes("Username")) {
                    fieldErrors.username = serverError;
                } else {
                    fieldErrors.api = serverError || "Register fail, please try again!";
                }

                setErrors(fieldErrors);
            }
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="flex flex-col min-h-screen items-center bg-white pt-32">
            <LRHeader activeButton={"register"} />
            <div className="w-full max-w-xs sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg rounded-xl bg-white p-8 border-2 border-black">
                {/* Logo & title */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Register</h2>
                </div>

                {/* login form */}
                <form className="mt-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-gray-700">Email Address</label>
                        <input
                            type="email"
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
                            <span className="text-red-500 text-sm block mt-1">{errors.email}</span>
                        )}
                    </div>

                    <div className="mt-4">
                        <label className="block text-gray-700">Password</label>
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
                            <span className="text-red-500 text-sm block mt-1">{errors.password}</span>
                        )}
                    </div>

                    <div className="mt-4">
                        <label className="block text-gray-700">Confirm Password</label>
                        <input
                            type="password"
                            onChange={(e) => {
                                setRePassword(e.target.value);
                                setErrors(prev => ({ ...prev, rePassword: "" }));
                            }}
                            onBlur={(e) => {
                                validateField("rePassword", e.target.value);
                            }}
                            className="mt-1 w-full rounded border-gray-300 p-2 focus:border-green-500 focus:ring focus:ring-green-300 border-2 border-gray"
                        />
                        {errors.rePassword && (
                            <span className="text-red-500 text-sm block mt-1">{errors.rePassword}</span>
                        )}
                    </div>

                    <div className="mt-4">
                        <label className="block text-gray-700">Username</label>
                        <input
                            type="text"
                            onChange={(e) => {
                                setUsername(e.target.value);
                                setErrors(prev => ({ ...prev, username: "" }));
                            }}
                            onBlur={(e) => {
                                validateField("username", e.target.value);
                            }}
                            className="mt-1 w-full rounded border-gray-300 p-2 focus:border-green-500 focus:ring focus:ring-green-300 border-2 border-gray"
                        />
                        {errors.username && (
                            <span className="text-red-500 text-sm block mt-1">{errors.username}</span>
                        )}
                    </div>

                    {/* register buttom */}
                    <button
                        type="submit"
                        className={`mt-6 w-full rounded bg-green-500 py-2 text-white hover:bg-green-600 transition ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={loading}
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>
                    {/* API error */}
                    {errors.api && <p className="text-red-500 text-sm mt-2">{errors.api}</p>}

                </form>
            </div>
        </div >
    );
}
