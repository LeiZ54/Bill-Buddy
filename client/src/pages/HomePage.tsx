import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import auth from "../components/auth";

const HomePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // useEffect(() => {
    //     const checkAuth = async () => {
    //         try {
    //             const token = localStorage.getItem("token");
    //             if (!token) {
    //                 navigate("/login");
    //                 return;
    //             }

    //             const response = await axios.get("/api/auth/check", {
    //                 headers: { Authorization: `Bearer ${token}` },
    //             });

    //             if (response.status !== 200) {
    //                 navigate("/login");
    //             }
    //         } catch (error) {
    //             console.error("Auth check failed:", error);
    //             navigate("/login");
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     checkAuth();
    // }, [navigate]);

    // if (loading) {
    //     return <div>Loading...</div>;
    // }

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-3xl font-bold">Welcome to HomePage</h1>
        </div>
    );
};

export default auth(HomePage);
