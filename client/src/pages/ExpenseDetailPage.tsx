import { useNavigate } from 'react-router-dom';
import Topbar from "../components/Topbar";

const ExpenseDetailPage = () => {
    const navigate = useNavigate();
    const expense = JSON.parse(sessionStorage.getItem("currentExpense") || '{}');
    const userName = localStorage.getItem("userName");
    const formattedDate = new Date(expense.expenseDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    return (
        <div className="mx-auto max-w-md bg-white min-h-screen">
            <Topbar
                leftIcon="/group/back.png"
                leftOnClick={() => {
                    sessionStorage.setItem("groupPage", "detail");
                    sessionStorage.removeItem("currentExpense");
                    navigate("/groupDetail");
                }}
                title="Expense Detail"
            />

            <div className="p-4 space-y-6">
                {/* Title & Amount */}
                <div className="p-1">
                    <h1 className="text-xl font-bold text-gray-800 mb-1">{expense.description}</h1>
                    <p className="text-3xl font-bold text-green-600">${expense.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Paid by <span className="font-medium">
                            {expense.payer.username === userName ? 'You' : expense.payer.username}
                        </span> on {formattedDate}
                    </p>
                </div>

                {/* Breakdown */}
                <div className="p-1">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">
                        {expense.payer.username === userName ? 'You' : expense.payer.username} paid
                        <span className="text-green-600"> ${expense.amount.toFixed(2)}</span>
                    </h2>
                    <ul className="space-y-2 text-sm text-gray-700">
                        {expense.shares && Object.entries(expense.shares).map(([name, amount]) => (
                            <li key={name}>
                                {name === userName ? (
                                    <>
                                        You owe <span className="text-orange-600 font-medium">{expense.currency} {amount}</span>
                                    </>
                                ) : (
                                    <>
                                        {name} owes <span className="text-green-600 font-medium">{expense.currency} {amount}</span>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ExpenseDetailPage;
