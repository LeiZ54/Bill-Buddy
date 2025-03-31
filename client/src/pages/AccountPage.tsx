import auth from "../services/auth";

const AccountPage = () => {

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("token_exp");
        window.location.replace('/');
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-3xl font-bold">Welcome to AccountPage</h1>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default auth(AccountPage);