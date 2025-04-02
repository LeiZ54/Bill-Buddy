import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import FriendsPage from "./pages/FriendsPage";
import GroupsPage from "./pages/GroupsPage";
import HistoryPage from "./pages/HistoryPage";
import AccountPage from "./pages/AccountPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import ExpenseDetailPage from "./pages/ExpenseDetailPage";
import GroupSettingPage from "./pages/GroupSettingPage";
import AddExpensePage from "./pages/AddExpensePage";
import ChooseGroup from "./pages/ChooseGroup";
import InviteLinkAcceptPage from "./pages/InviteLinkAcceptPage";

function App() {
  return (
      <Router>
          <Routes>
              <Route path="/" element={<Navigate to="/groups" replace />} />
              <Route path="/" element={<HomePage />}>
                  <Route path="friends" element={<FriendsPage />} />
                  <Route path="groups" element={<GroupsPage />} />
                  <Route path="groupDetail" element={<GroupDetailPage />} />
                  <Route path="expenseDetail" element={<ExpenseDetailPage />} />
                  <Route path="groupSetting" element={<GroupSettingPage />} />
                  <Route path="history" element={<HistoryPage />} />
                  <Route path="account" element={<AccountPage />} />
              </Route>
              <Route path="/addExpense" element={<AddExpensePage />} />
              <Route path="/chooseGroup" element={<ChooseGroup />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forget" element={<ForgotPasswordPage />} />
              <Route path="/reset" element={<ResetPasswordPage />} />
              <Route path="/inviteLink" element={<InviteLinkAcceptPage />} />
          </Routes>
      </Router>
  );
}

export default App;
