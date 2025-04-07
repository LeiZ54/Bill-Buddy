import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import Auth from "../components/Auth";
import NotFoundPage from '../pages/NotFoundPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import FriendsPage from '../pages/FriendsPage';
import GroupsPage from '../pages/GroupsPage';
import HistoryPage from '../pages/HistoryPage';
import AccountPage from '../pages/AccountPage';

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                element: <Auth />,
                children: [
                    {
                        path: "/",
                        element: <HomePage />,
                        children: [
                            { index: true, element: <Navigate to="/groups" replace /> },
                            { path: "friends", element: <FriendsPage /> },
                            { path: "groups", element: <GroupsPage /> },
                            { path: "history", element: <HistoryPage /> },
                            { path: "account", element: <AccountPage /> }
                        ]
                    }
                ]
            },
            {
                path: "login",
                element: <LoginPage />,
            },
            {
                path: "register",
                element: <RegisterPage />,
            },
            {
                path: "forgot",
                element: <ForgotPasswordPage />,
            },
            {
                path: "*",
                element: <NotFoundPage />,
            },
        ],
    },
]);