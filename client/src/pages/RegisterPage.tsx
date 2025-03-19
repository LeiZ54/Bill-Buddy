import { useState, FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import LRHeader from "../components/LRHeader";
import { AxiosError } from 'axios';

export default function RegisterPage() {
    const [email, setemail] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [rePassword, setRePassword] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const [activeButton] = useState<string>("register");


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        setLoading(true);
        setError(null);

        if (password !== rePassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }


        let registerResponse;
        let loginResponse;
        try {
            registerResponse = await axios.post("http://localhost:8090/api/auth/register", {
                username,
                password,
                email,
            });
            // check res
            if (registerResponse.status === 200) {
                console.log("Login successful:", registerResponse.data);
                //auto login
                loginResponse = await axios.post("http://localhost:8090/api/auth/login", {
                    username,
                    password,
                });
                if (loginResponse.status === 200) {
                    console.log("Login successful:", loginResponse.data);
                    const token = loginResponse.data.token;
                    localStorage.setItem("token", token);
                    navigate("/");
                }
            }
        } catch (error) {
            if (error instanceof AxiosError && error.response?.data?.error) {
                setError(error.response?.data?.error);
            } else {
                setError("Register failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="flex flex-col min-h-screen items-center bg-white pt-32">
            <LRHeader activeButton={activeButton} />
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
                            onChange={(e) => setemail(e.target.value)}
                            className="mt-1 w-full rounded border-gray-300 p-2 focus:border-green-500 focus:ring focus:ring-green-300 border-2 border-gray"
                            required
                        />
                    </div>

                    <div className="mt-4">
                        <label className="block text-gray-700">Password</label>
                        <input
                            type="password"
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 w-full rounded border-gray-300 p-2 focus:border-green-500 focus:ring focus:ring-green-300 border-2 border-gray"
                            required
                        />
                    </div>

                    <div className="mt-4">
                        <label className="block text-gray-700">Confirm Password</label>
                        <input
                            type="password"
                            onChange={(e) => setRePassword(e.target.value)}
                            className="mt-1 w-full rounded border-gray-300 p-2 focus:border-green-500 focus:ring focus:ring-green-300 border-2 border-gray"
                            required
                        />
                    </div>

                    <div className="mt-4">
                        <label className="block text-gray-700">Username</label>
                        <input
                            type="text"
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 w-full rounded border-gray-300 p-2 focus:border-green-500 focus:ring focus:ring-green-300 border-2 border-gray"
                            required
                        />
                    </div>

                    {/* show error */}
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    {/* register buttom */}
                    <button
                        type="submit"
                        className={`mt-6 w-full rounded bg-green-500 py-2 text-white hover:bg-green-600 transition ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={loading}
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>

                </form>
            </div>
        </div >
    );
}
