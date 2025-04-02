import { useNavigate } from 'react-router-dom';

const AccountPage = () => {
    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("token_exp");
        localStorage.removeItem("userName");
        localStorage.removeItem("email");
        sessionStorage.clear();
        navigate('/');
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-3xl font-bold">Welcome to AccountPage</h1>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default AccountPage;