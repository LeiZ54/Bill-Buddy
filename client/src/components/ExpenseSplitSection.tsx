import React, { useEffect } from 'react';
import GroupMemberList from './GroupMemberList';
import { easyGroup } from '../util/util';


interface ExpenseSplitSectionProps {
    setIsStep2Valid: (isValid: boolean) => void;
    selectedGroup: easyGroup|undefined;
    splitMethod: 'equally' | 'unequally';
    setSplitMethod: (method: 'equally' | 'unequally') => void;
    amount: string;
    setAmount: (value: string) => void;
    selectedMembers: number[];
    setSelectedMembers: (members: number[]) => void;
    amountsByMember: Record<number, string>;
    setAmountsByMember: (amounts: Record<number, string>) => void;
}

const ExpenseSplitSection: React.FC<ExpenseSplitSectionProps> = ({
    setIsStep2Valid,
    selectedGroup,
    splitMethod,
    setSplitMethod,
    amount,
    setAmount,
    selectedMembers,
    setSelectedMembers,
    amountsByMember,
    setAmountsByMember,
}) => {
    useEffect(() => {
        const validateForm = () => {
            let isValid = true;
            const amountNum = parseFloat(amount);
            if (amountNum <= 0 || isNaN(amountNum)) {
                isValid = false;
            }
            if (selectedMembers.length === 0) {
                isValid = false;
            }
            return isValid;
        };
        setIsStep2Valid(validateForm());
    }, [amount, selectedMembers]);

    useEffect(() =>{
        setAmount(calculateTotal());

    }, [selectedMembers, amountsByMember])
    
    const handleAmountChange = (value: string) => {
        if (/^\d*\.?\d*$/.test(value)) {
            setAmount(value);
        }
    };

    const handleMemberSelect = (memberId: number) => {
        const newSelected = selectedMembers.includes(memberId)
            ? selectedMembers.filter(id => id !== memberId)
            : [...selectedMembers, memberId];

        setSelectedMembers(newSelected);

        setAmountsByMember(prev => {
            const updated = { ...prev };
            if (newSelected.includes(memberId)) {
                updated[memberId] = prev[memberId] || '0.00';
            } else {
                delete updated[memberId];
            }
            return updated;
        });
    };

    const handleAmountChangeForMember = (memberId: number, value: string) => {
        if (/^\d*\.?\d*$/.test(value)) {
            setAmountsByMember(prev => {
                const newAmounts = { ...prev };
                const hasValue = value !== '' && value !== '0' && value !== '0.00';
                const isSelected = selectedMembers.includes(memberId);

                if (hasValue && !isSelected) {
                    setSelectedMembers([...selectedMembers, memberId]);
                }
                if (!hasValue && isSelected) {
                    setSelectedMembers(selectedMembers.filter(id => id !== memberId));
                }

                if (value === '') {
                    delete newAmounts[memberId];
                } else {
                    newAmounts[memberId] = value;
                }

                return newAmounts;
            });
        }
    };

    const calculateTotal = () => {
        return Object.values(amountsByMember).reduce(
            (sum, val) => sum + (Number(val) || 0),
            0
        ).toFixed(2);
    };

    return (
        <>
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
                        value={amount}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*\.?\d{0,2}$/.test(value)) {
                                handleAmountChange(value);
                            }
                        }}
                        onBlur={(e) => {
                            let value = e.target.value;
                            if (value) {
                                if (!value.includes('.')) value += '.00';
                                else if (value.split('.')[1]?.length === 1) value += '0';
                                handleAmountChange(value);
                            }
                        }}
                        className="w-full pl-8 p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        disabled={splitMethod === 'unequally'}
                    />
                </div>
            </div>

            {/* Split Method */}
            <div className="space-y-3">
                <div className="text-sm font-medium">Split method</div>
                <div className="grid grid-cols-2 gap-3">
                    <div
                        onClick={() => {
                            setSplitMethod('equally');
                            setAmount('');
                        }}
                        className={`p-3 rounded-lg ${splitMethod === 'equally'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Equally
                    </div>
                    <div
                        onClick={() => setSplitMethod('unequally')}
                        className={`p-3 rounded-lg ${splitMethod === 'unequally'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Unequally
                    </div>
                </div>
            </div>

            {/* Members */}
            <div className="space-y-4">
                <div>Choose members</div>
                <GroupMemberList
                    selectedGroup={selectedGroup}
                    splitMethod={splitMethod}
                    selectedMembers={selectedMembers}
                    amountsByMember={amountsByMember}
                    onSelect={handleMemberSelect}
                    onAmountChange={handleAmountChangeForMember}
                />
            </div>
        </>
    );
};

export default ExpenseSplitSection;
