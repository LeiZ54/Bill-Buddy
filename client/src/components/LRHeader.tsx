import { Link } from "react-router-dom";

const LRHeader = ({ activeButton }: { activeButton: string }) => {

    return (
        <header className="flex text-ms justify-between items-center p-4 fixed top-0 left-0 right-0 border-b border-gray-600">
            {/* logo + name */}
            <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Logo" className="w-8 h-8" />
                <span className="font-semibold">Bill Buddy</span>
            </div>

            {/* login & register */}
            <div className="flex gap-4">
                <Link
                    to="/login"
                    className={`px-2 py-1 rounded-xl ${activeButton === "login" ? "bg-green-500 text-white" : "border-green-600 text-green-600 hover:bg-green-100"}`}
                >
                    Login
                </Link>
                <Link
                    to="/register"
                    className={`px-2 py-1 rounded-xl ${activeButton === "register" ? "bg-green-500 text-white" : "border-green-600 text-green-600 hover:bg-green-100"}`}
                >
                    Sign Up
                </Link>
            </div>
        </header>
    );
};

export default LRHeader;
