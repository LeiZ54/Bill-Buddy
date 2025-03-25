import { useState, FormEvent } from "react";
import api from "../services/axiosConfig";
import LRHeader from "../components/LRHeader";
import { AxiosError } from 'axios';
import { useLocation, useNavigate } from "react-router-dom";

type FieldErrors = {
    password?: string;
    confirmPassword?: string;
    api?: string;
};

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || "";
    const jwt = location.state?.jwt || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<FieldErrors>({});

    const validateField = (name: keyof FieldErrors, value: string) => {
        const newErrors = { ...errors };
        delete newErrors[name];

        switch (name) {
            case 'password':
                if (!value) {
                    newErrors.password = "Password cannot be empty!";
                } else if (value.length < 6) {
                    newErrors.password = "Password must be at least 6 characters";
                }
                break;
            case 'confirmPassword':
                if (!value) {
                    newErrors.confirmPassword = "Please confirm password";
                } else if (value !== password) {
                    newErrors.confirmPassword = "Passwords do not match";
                }
                break;
        }
        setErrors(newErrors);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        validateField('password', password);
        validateField('confirmPassword', confirmPassword);
        if (Object.keys(errors).length > 0) return;

        try {
            // 调用重置密码接口（根据你的API调整）
            await api.post('/auth/reset-password', {
                email,
                newPassword: password,
                token: jwt,
            });
            navigate('/login');
        } catch (error) {
            if (error instanceof AxiosError) {
                const newErrors = { ...errors };
                newErrors.api = error.response?.data?.message || 'Password reset failed';
                setErrors(newErrors);
            }
        }
    };

    return (
        <div className="flex flex-col min-h-screen items-center bg-white pt-32">
            <LRHeader activeButton={""} />
            <div className="w-full max-w-xs sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg rounded-xl bg-white p-8 border-2 border-black">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
                </div>

                <form className="mt-6" onSubmit={handleSubmit} noValidate>
                    {/* email */}
                    <div className="mb-4">
                        <label className="block text-gray-700">Email</label>
                        <input
                            type="text"
                            value={email}
                            readOnly
                            className="mt-1 w-full rounded bg-gray-100 p-2 border-2 border-gray-300 text-gray-500"
                        />
                    </div>

                    {/* new password */}
                    <div className="mb-4">
                        <label className="block text-gray-700">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setErrors(prev => ({ ...prev, password: "" }));
                            }}
                            onBlur={(e) => validateField("password", e.target.value)}
                            className="mt-1 w-full rounded border-gray-300 p-2 focus:border-green-500 focus:ring focus:ring-green-300 border-2 border-gray"
                        />
                        {errors.password && (
                            <span className="text-red-500 text-sm">{errors.password}</span>
                        )}
                    </div>

                    {/* confirm password */}
                    <div className="mb-6">
                        <label className="block text-gray-700">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setErrors(prev => ({ ...prev, confirmPassword: "" }));
                            }}
                            onBlur={(e) => validateField("confirmPassword", e.target.value)}
                            className="mt-1 w-full rounded border-gray-300 p-2 focus:border-green-500 focus:ring focus:ring-green-300 border-2 border-gray"
                        />
                        {errors.confirmPassword && (
                            <span className="text-red-500 text-sm">{errors.confirmPassword}</span>
                        )}
                    </div>

                    {/* submit */}
                    <button
                        type="submit"
                        className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
                    >
                        Reset Password
                    </button>
                    {errors.api && (
                        <span className="text-red-500 text-sm">{errors.api}</span>
                    )}
                </form>
            </div>
        </div>
    );
}