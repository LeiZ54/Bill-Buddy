import { useEffect, useState } from 'react';
import api from "../services/axiosConfig";

interface GroupMemberListProps {
    splitMethod?: 'equally' | 'unequally';
    selectedMembers?: number[];
    amountsByMember?: Record<number, string>;
    onSelect?: (memberId: number) => void;
    onAmountChange?: (memberId: number, value: string) => void;
}

interface Member {
    id: number;
    username: string;
    email: string;
}

const GroupMemberList = ({
    splitMethod,
    selectedMembers = [],
    amountsByMember = {},
    onSelect,
    onAmountChange
}: GroupMemberListProps) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const groupId = sessionStorage.getItem("groupId") || sessionStorage.getItem("addExpenseGroupId") || '';

    const isEnhancedMode = !!splitMethod;

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const response = await api.get(`/groups/${groupId}/members`);
                setMembers(response.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load members');
                console.log(err)
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, [groupId]);

    if (loading) return <div className="p-2 text-gray-500">Loading members...</div>;
    if (error) return <div className="p-2 text-red-500">{error}</div>;

    return (
        <div className="space-y-2">
            {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3">
                    {/* select */}
                    {isEnhancedMode && (
                        <div className="flex items-center gap-4 flex-1">
                            <button
                                onClick={() => onSelect?.(member.id)}
                                className={`w-6 h-6 border-2 rounded-full flex items-center justify-center 
                                    ${selectedMembers?.includes(member.id)
                                        ? 'bg-green-500 border-green-500'
                                        : 'border-gray-300'}`}
                            >
                                {selectedMembers?.includes(member.id) && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>

                            {/* group member */}
                            <div className="flex-1">
                                <div className="font-medium">{member.username}</div>
                                <div className="text-sm text-gray-500">{member.email}</div>
                            </div>
                        </div>
                    )}

                    {!isEnhancedMode && (
                        <div className="flex-1">
                            <div className="font-medium">{member.username}</div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                    )}

                    {/* amount */}
                    {isEnhancedMode && splitMethod === 'unequally' && (
                        <div className="ml-4 w-24 relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="text"
                                value={amountsByMember?.[member.id] || ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                                        onAmountChange?.(member.id, value);
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
                                        onAmountChange?.(member.id, value);
                                    }
                                }}
                                className="w-full pl-6 pr-2 py-1 border rounded-md text-right"
                                placeholder="0.00"
                            />
                        </div>
                    )}

                </div>
            ))}
        </div>
    );
};

export default GroupMemberList;