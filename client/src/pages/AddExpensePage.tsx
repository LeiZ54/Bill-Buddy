import { auth } from "../services/auth";
import api from "../services/axiosConfig";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from "../components/Topbar";
import GroupMemberList from "../components/GroupMemberList";
import { getUrlByType } from "../services/util";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AddExpensePage = () => {
    const navigate = useNavigate();
    const [expenseName, setExpenseName] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState<Date | null>(new Date());
    const [splitMethod, setSplitMethod] = useState<'equally' | 'unequally'>('equally');
    const groupId = sessionStorage.getItem("addExpenseGroupId") || sessionStorage.getItem("groupId") || '';
    const groupName = sessionStorage.getItem("addExpenseGroupName") || sessionStorage.getItem("groupName") || '';
    const groupType = sessionStorage.getItem("addExpenseGroupType") || sessionStorage.getItem("groupType") || 'other';
    const groupImage = getUrlByType(groupType);
    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
    const [amountsByMember, setAmountsByMember] = useState<Record<number, string>>({});
    const [errors, setErrors] = useState({
        name: '',
        amount: '',
        members: '',
        api: ''
    });

    const validateForm = () => {
        const newErrors = { name: '', amount: '', members: '', api: ''};
        let isValid = true;

        if (!expenseName.trim()) {
            newErrors.name = 'Expense name can not be empty!';
            isValid = false;
        }

        const amountNum = parseFloat(amount);
        if (amountNum <= 0 || isNaN(amountNum)) {
            newErrors.amount = 'Amount must be greater than 0!';
            isValid = false;
        }

        if (selectedMembers.length === 0) {
            newErrors.members = 'At least one member must be selected!';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            const payload = {
                groupId: Number(groupId),
                currency: "USD",
                description: expenseName,
                expenseDate: date?.toISOString(),
                participants: selectedMembers,
                amount: parseFloat(amount),
                shares: splitMethod === 'unequally'
                    ? selectedMembers.map(id => parseFloat(amountsByMember[id] || '0'))
                    : [],
            };

            await api.post('/expenses', payload);
            sessionStorage.removeItem("addExpenseGroupId");
            sessionStorage.removeItem("addExpenseGroupName");
            sessionStorage.removeItem("addExpenseGroupType");
            navigate('/groupDetail');
            sessionStorage.setItem("groupId", groupId.toString());
            sessionStorage.setItem("groupPage", "detail");
            sessionStorage.setItem("groupType", groupType);
            sessionStorage.setItem("groupName", groupName);

        } catch (err) {
            const newErrors = { name: '', amount: '', members: '', api: 'Failed to create expense!' };
            setErrors(newErrors);
        }
    };

    const handleMemberSelect = (memberId: number) => {
        setSelectedMembers(prev => {
            const newSelected = prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId];

            setAmountsByMember(prevAmounts => {
                const newAmounts = { ...prevAmounts };
                if (newSelected.includes(memberId)) {
                    newAmounts[memberId] = prevAmounts[memberId] || '0.00';
                } else {
                    delete newAmounts[memberId];
                }
                return newAmounts;
            });

            return newSelected;
        });
        setErrors(prev => ({ ...prev, members: '' }));
    };

    const handleAmountChangeForMember = (memberId: number, value: string) => {
        if (/^\d*\.?\d*$/.test(value)) {
            setAmountsByMember(prev => {
                const newAmounts = { ...prev };
                
                setSelectedMembers(prevSelected => {
                    const hasValue = value !== '' && value !== '0' && value !== '0.00';
                    const isSelected = prevSelected.includes(memberId);

                    if (hasValue && !isSelected) {
                        return [...prevSelected, memberId];
                    }
                    if (!hasValue && isSelected) {
                        return prevSelected.filter(id => id !== memberId);
                    }
                    return prevSelected;
                });

                if (value === '') {
                    delete newAmounts[memberId];
                } else {
                    newAmounts[memberId] = value;
                }

                return newAmounts;
            });
        }
    };

    const handleAmountChange = (value: string) => {
        if (/^\d*\.?\d*$/.test(value)) {
            setAmount(value);
            setErrors(prev => ({ ...prev, amount: '' }));
        }
    };

    const calculateTotal = () => {
        return Object.values(amountsByMember).reduce(
            (sum, val) => sum + (Number(val) || 0),
            0
        ).toFixed(2);
    };

    useEffect(() => {
        if (splitMethod === 'unequally') {
            setAmount(calculateTotal());
        }
    }, [amountsByMember, splitMethod]);

    return (
        <div className="fixed inset-x-0 top-0 bottom-16 overflow-y-auto p-4">
            <div className="mx-auto max-w-md">
                <Topbar
                    leftIcon="/group/back.png"
                    leftOnClick={() => navigate(-1)}
                    title="Add an expense"
                    rightText="Save"
                    rightOnClick={handleSubmit}
                />

                <div className="p-4 space-y-6">
                    {errors.api && (
                        <div className="text-red-500 text-sm mt-1">{errors.api}</div>
                    )}
                    {/* Group Info */}
                    <div className="flex items-center space-x-4 rounded-lg">
                        <img src={groupImage} alt="Group" className="w-12 h-12 rounded-full" />
                        <div className="font-medium">{groupName}</div>
                    </div>

                    {/* Expense Name */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Expense name</label>
                        <input
                            type="text"
                            value={expenseName}
                            onChange={(e) => {
                                setExpenseName(e.target.value)
                                setErrors(prev => ({ ...prev, name: '' }));
                            }}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        {errors.name && (
                            <div className="text-red-500 text-sm mt-1">{errors.name}</div>
                        )}
                    </div>

                    {/* Amount */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">
                            Total Amount
                            {splitMethod === 'unequally' && (
                                <span className="ml-2 text-gray-500 text-sm">(auto calculated)</span>
                            )}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="text"
                                value={splitMethod === 'unequally' ? calculateTotal() : amount}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                                        handleAmountChange(value);
                                    }
                                }}
                                onBlur={(e) => {
                                    let value = e.target.value;
                                    if (value) {
                                        if (!value.includes('.')) {
                                            value += '.00';
                                        } else if (value.split('.')[1]?.length === 1) {
                                            value += '0';
                                        }
                                        handleAmountChange(value);
                                    }
                                }}
                                className="w-full pl-8 p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                disabled={splitMethod === 'unequally'}
                            />
                        </div>
                        {errors.amount && (
                            <div className="text-red-500 text-sm mt-1">{errors.amount}</div>
                        )}
                    </div>


                    {/* Date Picker */}
                    <div className="space-y-1 flex flex-col">
                        <label className="text-sm font-medium">Date</label>
                        <DatePicker
                            selected={date}
                            onChange={(date: Date | null) => setDate(date)}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            dateFormat="MMMM d, yyyy"
                        />
                    </div>

                    {/* Split Method */}
                    <div className="space-y-3">
                        <div className="text-sm font-medium">Split method</div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    setSplitMethod('equally');
                                    setAmount('');
                                }}
                                className={`p-3 rounded-lg ${splitMethod === 'equally'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Equally
                            </button>
                            <button
                                onClick={() => setSplitMethod('unequally')}
                                className={`p-3 rounded-lg ${splitMethod === 'unequally'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Unequally
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>Choose members</div>
                        {errors.members && (
                            <div className="text-red-500 text-sm">{errors.members}</div>
                        )}
                        <GroupMemberList
                            splitMethod={splitMethod}
                            selectedMembers={selectedMembers}
                            amountsByMember={amountsByMember}
                            onSelect={handleMemberSelect}
                            onAmountChange={handleAmountChangeForMember}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default auth(AddExpensePage);