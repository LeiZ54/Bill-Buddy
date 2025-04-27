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
import ActivityPage from '../pages/ActivityPage';
import AccountPage from '../pages/AccountPage';
import GroupDetailPage from '../pages/GroupDetailPage';
import GroupSettingPage from '../pages/GroupSettingPage';
import InviteLinkPage from '../pages/InviteLinkPage';
import AddPage from '../pages/AddPage';
import ExpenseDetailPage from '../pages/ExpenseDetailPage';
import FriendDetailPage from '../pages/FriendDetailPage';

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
                            {index: true, element: <Navigate to="/groups" replace />},
                            {
                                path: "friends", children: [
                                    { index: true, element: <FriendsPage /> },
                                    { path: "detail", element: <FriendDetailPage /> },
                                ] },
                            {
                                path: "groups", children: [
                                    { index: true, element: <GroupsPage /> },
                                    { path: "detail", element: <GroupDetailPage /> },
                                    { path: "setting", element: <GroupSettingPage /> },
                                    { path: "expense", element: <ExpenseDetailPage /> }
                                ]
                            },
                            { path: "activity", element: <ActivityPage /> },
                            { path: "account", element: <AccountPage /> }
                        ]
                    },
                    { path: "add", element: <AddPage /> },
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
                path: "inviteLink",
                element: <InviteLinkPage />,
            },
            {
                path: "*",
                element: <NotFoundPage />,
            },
        ],
    },
]);