import { useEffect, useState } from 'react';
import api from "../services/axiosConfig";

interface Member {
    id: number;
    username: string;
    email: string;
}

const GroupMemberList = ({ groupId }: { groupId: number }) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const response = await api.get(`/groups/${groupId}/members`);
                setMembers(response.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load members');
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
                    <div>
                        <div className="font-medium">
                            {member.username}
                        </div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default GroupMemberList;