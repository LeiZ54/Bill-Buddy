import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from "../components/Topbar";
import { getUrlByType } from "../services/util";
import api from "../services/axiosConfig";

interface Expense {
    id: number;
    description: string;
    amount: number;
    payer: {
        username: string;
    };
    shares: Record<string, number>;
    expenseDate: string;
}

interface ExpenseItem {
    person: string;
    amount: number;
    type: 'owe' | 'get';
}

const ExpenseList = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const groupId = Number(sessionStorage.getItem("groupId"));
    const currentUser = localStorage.getItem("userName") || '';
    const navigate = useNavigate();
    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const response = await api.get(`/expenses/group/${groupId}`);
                setExpenses(response.data);
            } catch (err) {
                setError('Failed to load expenses');
            } finally {
                setLoading(false);
            }
        };

        fetchExpenses();
    }, [groupId]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const month = date.toLocaleString('en-US', { month: 'short' });
        const day = date.getDate().toString().padStart(2, '0');
        return { month, day };
    };

    const getExpenseStatus = (expense: Expense) => {
        const isPayer = expense.payer.username === currentUser;
        const userShare = expense.shares[currentUser] || 0;
        const othersTotal = Object.entries(expense.shares)
            .filter(([username]) => username !== currentUser)
            .reduce((sum, [_, amount]) => sum + amount, 0);

        if (isPayer) {
            return {
                payer: 'You',
                type: 'lent',
                amount: othersTotal
            };
        }

        if (userShare > 0) {
            return {
                type: 'borrowed',
                amount: userShare
            };
        }

        return {
            type: 'not-involved',
            amount: 0
        };
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

    return (
        <div className="space-y-4">
            {expenses.length === 0 ? (
                <div className="text-center text-gray-500 text-lg py-4">
                    This group does not have any expenses
                </div>
            ) : (
                expenses.map(expense => {
                    const { month, day } = formatDate(expense.expenseDate);
                    const status = getExpenseStatus(expense);

                    return (
                        <div key={expense.id}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => {
                                sessionStorage.setItem("currentExpense", JSON.stringify(expense));
                                sessionStorage.setItem("groupPage", "expense");
                                navigate('/expenseDetail');
                            }}
                        >
                            <div className="flex items-center justify-between p-2">
                                {/* Date Section */}
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <div className="text-sm text-gray-500 uppercase">{month}</div>
                                        <div className="text-xl font-medium text-gray-700">{day}</div>
                                    </div>

                                    {/* Expense Details */}
                                    <div className="flex-1">
                                        <div className="text-xl font-medium">{expense.description}</div>
                                        <div className="text-sm text-gray-500">
                                            {expense.payer.username === currentUser ? "You" : expense.payer.username} paid ${expense.amount.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                {/* Status Section */}
                                <div className="text-right min-w-[120px]">
                                    {status.type === 'lent' && (
                                        <div className="text-green-600">
                                            <div>You lent</div>
                                            <div>${status.amount.toFixed(2)}</div>
                                        </div>
                                    )}
                                    {status.type === 'borrowed' && (
                                        <div className="text-orange-600">
                                            <div>You borrowed</div>
                                            <div>${status.amount.toFixed(2)}</div>
                                        </div>
                                    )}
                                    {status.type === 'not-involved' && (
                                        <div className="text-gray-400">Not involved</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

const GroupDetailPage = () => {
    const navigate = useNavigate();
    const groupName = sessionStorage.getItem("groupName");
    const groupType = sessionStorage.getItem("groupType");
    const groupImage = getUrlByType(groupType || 'other');
    const items = JSON.parse(sessionStorage.getItem("groupItems") || "[]");
    const netBalance = parseFloat(sessionStorage.getItem("groupNetBalance") || "0.00");
    const expenseItems = items as ExpenseItem[];
    return (
        <div className="mx-auto max-w-md space-y-6">
            <Topbar
                leftIcon="/group/back.png"
                leftOnClick={() => {
                    navigate('/groups');
                    sessionStorage.removeItem("groupId");
                    sessionStorage.removeItem("groupPage");
                    sessionStorage.removeItem("groupType");
                    sessionStorage.removeItem("groupName");
                    sessionStorage.removeItem("groupItems");
                    sessionStorage.removeItem("groupNetBalance");
                }}
                rightIcon="/group/set_button.png"
                rightOnClick={() => {
                    navigate('/groupSetting');
                    sessionStorage.setItem("groupPage", "setting");
                }}
            />

            <div className="flex flex-col px-4">
                {/* Group Header */}
                <div className="flex items-center gap-3">
                    <img src={groupImage} alt="Group" className="w-12 h-12 rounded-full" />
                    <div>
                        <h1 className="text-xl font-bold">{groupName}</h1>
                        <p className="text-sm text-gray-500 capitalize">{groupType}</p>
                    </div>
                </div>

                {/* Balance Info */}
                <div className="text-left mt-2">
                    <p className="text-xl font-semibold text-green-600">
                        {netBalance >= 0 ? 'You are owed' : 'You owe'} ${Math.abs(netBalance).toFixed(2)}
                    </p>
                    <ul className="text-sm text-gray-700">
                        {expenseItems.map((item, index) => (
                            <li key={index} className="mt-1">
                                <span>
                                    {item.type === 'get'
                                        ? `${item.person} owes you `
                                        : `You owe ${item.person} `}
                                </span>
                                <span className={`font-medium ${item.type === 'get' ? 'text-green-600' : 'text-orange-600'}`}>
                                    ${item.amount.toFixed(2)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>


            {/* Expense List */}
            <ExpenseList />
        </div>
    );
};
const LoadingSpinner = () => (
    <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

export default GroupDetailPage;