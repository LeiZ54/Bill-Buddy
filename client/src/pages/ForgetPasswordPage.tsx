import { useState, FormEvent, useEffect } from "react";
import api from "../services/axiosConfig";
import LRHeader from "../components/LRHeader";
import { AxiosError } from 'axios';
import { useNavigate } from "react-router-dom";

type FieldErrors = {
    email?: string;
    code?: string;
};

export default function ForgetPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState<string>("");
    const [code, setCode] = useState<string>("");
    const [errors, setErrors] = useState<FieldErrors>({});
    const [countdown, setCountdown] = useState<number>(0);
    const [isSending, setIsSending] = useState(false);
    const [showVerification, setShowVerification] = useState(false);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [countdown]);

    const validateField = (name: keyof FieldErrors, value: string) => {
        const newErrors = { ...errors };
        delete newErrors[name];

        switch (name) {
            case 'email':
                if (!value) {
                    newErrors.email = "Email cannot be empty!";
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    newErrors.email = "Invalid email format!";
                }
                break;
            case 'code':
                if (!value) {
                    newErrors.code = "Code cannot be empty!";
                } else if (!/^\d{6}$/.test(value)) {
                    newErrors.code = "Please enter the 6-digit code";
                }
                break;
        }
        setErrors(newErrors);
    };

    const handleSendCode = async () => {
        validateField('email', email);
        if (errors.email) return;

        try {
            setIsSending(true);
            const res = await api.post(`/auth/forgot-password?email=${email}`);
            console.log(res);
            setShowVerification(true);
            setCountdown(60);
        } catch (error) {
            if (error instanceof AxiosError) {
                setErrors({
                    email: error.response?.data?.error || 'send code fail'
                });
            }
        } finally {
            setIsSending(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        validateField('code', code);
        if (errors.code) return;

        try {
            const respond = await api.post('/auth/verify-code', { email, code });
            const jwt = respond.data.token;
            navigate('/reset', { state: { email, jwt } });
        } catch (error) {
            if (error instanceof AxiosError) {
                setErrors({
                    code: error.response?.data?.message || 'code wrong'
                });
            }
        }
    };

    return (
        <div className="flex flex-col min-h-screen items-center bg-white pt-32">
            <LRHeader activeButton={""} />
            <div className="w-full max-w-xs sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg rounded-xl bg-white p-8 border-2 border-black">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Forget Password</h2>
                </div>

                <form className="mt-6" onSubmit={handleSubmit} noValidate>
                    {/* email */}
                    <div>
                        <label className="block text-gray-700">email</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setErrors(prev => ({ ...prev, email: "" }));
                                }}
                                onBlur={(e) => validateField("email", e.target.value)}
                                className="mt-1 w-full rounded border-gray-300 p-2 focus:border-green-500 focus:ring focus:ring-green-300 border-2 border-gray"
                            />
                            <button
                                type="button"
                                onClick={handleSendCode}
                                disabled={isSending || countdown > 0}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 whitespace-nowrap"
                            >
                                {countdown > 0 ? `resent(${countdown})` : 'send code'}
                            </button>
                        </div>
                        {errors.email && (
                            <span className="text-red-500 text-sm">{errors.email}</span>
                        )}
                    </div>

                    {/* input code */}
                    {showVerification && (
                        <div className="mt-4">
                            <label className="block text-gray-700">code</label>
                            <input
                                type="text"
                                value={code}
                                maxLength={6}
                                onChange={(e) => {
                                    setCode(e.target.value.replace(/\D/g, ''));
                                    setErrors(prev => ({ ...prev, code: "" }));
                                }}
                                onBlur={(e) => validateField("code", e.target.value)}
                                className="mt-1 w-full rounded border-gray-300 p-2 focus:border-green-500 focus:ring focus:ring-green-300 border-2 border-gray"
                            />
                            {errors.code && (
                                <span className="text-red-500 text-sm">{errors.code}</span>
                            )}
                        </div>
                    )}

                    {/* submit */}
                    {showVerification && (
                        <button
                            type="submit"
                            className="w-full mt-6 bg-green-500 text-white py-2 rounded hover:bg-green-600"
                        >
                            Submit
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}