import { useState, FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {

    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        console.log(username)
        console.log(password)

        if (!username || !password) {
            alert("Please enter both username and password.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post("http://localhost:8090/api/auth/login", { username, password });

            // check res
            if (response.status === 200) {
                console.log("Login successful:", response.data);
                const token = response.data.token;
                localStorage.setItem("authToken", token);
                navigate("/home");
            } else {
                setError("Invalid username or password.");
            }
        } catch (error) {
            console.error("Login failed:", error);
            setError("Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="flex min-h-screen items-center justify-center bg-white">
            <div className="w-full max-w-md rounded-xl bg-white p-8 border-2 border-black">
                {/* Logo & title */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Login</h2>
                </div>

                {/* login form */}
                <form className="mt-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-gray-700">UserName</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 w-full rounded border-gray-300 p-2 focus:border-green-500 focus:ring focus:ring-green-300 border-2 border-gray"
                            required
                        />
                    </div>

                    <div className="mt-4">
                        <label className="block text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 w-full rounded border-gray-300 p-2 focus:border-green-500 focus:ring focus:ring-green-300 border-2 border-gray"
                            required
                        />
                    </div>

                    {/* show error */}
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    {/* login buttom */}
                    <button
                        type="submit"
                        className={`mt-6 w-full rounded bg-green-500 py-2 text-white hover:bg-green-600 transition ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                    {/* forget */}
                    <div className="mt-4 text-center">
                        <a href="#" className="text-sm text-green-500 hover:underline">
                            Forget your password?
                        </a>
                    </div>
                </form>
            </div>
        </div >
    );
}
