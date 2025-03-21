import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import FriendsPage from "./pages/FriendsPage";
import GroupsPage from "./pages/GroupsPage";
import HistoryPage from "./pages/HistoryPage";
import AccountPage from "./pages/AccountPage";
import AddPage from "./pages/AddPage";

function App() {
  return (
      <Router>
          <Routes>
              <Route path="/" element={<Navigate to="/groups" replace />} />
              <Route path="/" element={<HomePage />}>
                  <Route path="friends" element={<FriendsPage />} />
                  <Route path="groups" element={<GroupsPage />} />
                  <Route path="history" element={<HistoryPage />} />
                  <Route path="account" element={<AccountPage />} />
              </Route>
              <Route path="/add" element={<AddPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
          </Routes>
      </Router>
  );
}

export default App;
