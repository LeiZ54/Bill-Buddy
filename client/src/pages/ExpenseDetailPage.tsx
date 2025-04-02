import { useNavigate } from 'react-router-dom';
import Topbar from "../components/Topbar";
const ExpenseDetailPage = () => {
    const navigate = useNavigate();
    const expense = JSON.parse(sessionStorage.getItem("currentExpense") || '[]');
    const userName = localStorage.getItem("userName");
    const formattedDate = new Date(expense.expenseDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
    return (
        <div className="mx-auto max-w-md">
            <Topbar
                leftIcon="/group/back.png"
                leftOnClick={() => navigate(-1)}
                title="Expense Detail"
            />
            {/* expense */}
            <div className="p-4 space-y-6">

                <div className="p-4">
                    <h1 className="text-xl mb-2">{expense.description}</h1>
                    <p className="text-3xl font-semibold font-medium">US${expense.amount.toFixed(2)}</p>
                    <p className="text-gray-500 mt-2">
                        Added by {expense.payer.username} on {formattedDate}
                    </p>
                </div>
                <div className="p-4 rounded-lg">
                    <h2 className="text-xl mb-3">{expense.payer.username} paid US${expense.amount.toFixed(2)}</h2>
                    <ul>
                        {expense.shares &&
                            Object.entries(expense.shares).map(([name, amount]) => (
                                <li key={name}>
                                    {name === userName
                                        ? `You owe ${expense.currency} ${amount}`
                                        : `${name} owes ${expense.currency} ${amount}`}
                                </li>
                            ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ExpenseDetailPage;