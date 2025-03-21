import auth from "../services/auth";

const GroupsPage = () => {

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');

        window.location.replace('/');
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-3xl font-bold">Welcome to GroupsPage</h1>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default auth(GroupsPage);
