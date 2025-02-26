import auth from "../components/auth";

const HomePage = () => {

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');

        window.location.replace('/');
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-3xl font-bold">Welcome to HomePage</h1>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default auth(HomePage);
