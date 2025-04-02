import { useState, useEffect } from 'react';
import api from "../services/axiosConfig";
import { parseJWT } from "../services/jwt";
import { useNavigate } from 'react-router-dom';

interface JwtPayload {
    groupId: number;
    groupName: string;
    exp: number;
    iat: number;
}

const InviteAcceptModal = ({
    open,
    onClose,
    inviteJWT,
}: {
    open: boolean;
    onClose: () => void;
    inviteJWT: string;
    }) => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [groupInfo, setGroupInfo] = useState<JwtPayload | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!open) return;

        const verifyJWT = async () => {
            try {
                setLoading(true);
                setError('');
                const res = await api.get(`/groups/invitations/check?token=${encodeURIComponent(inviteJWT)}}`);
                if (res.data.joined) {
                    throw new Error('You are already in the group!');
                }

                const payload = parseJWT(inviteJWT) as JwtPayload;
                setGroupInfo(payload);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Invalid invitation link');
            } finally {
                setLoading(false);
            }
        };

        verifyJWT();
    }, [open, inviteJWT]);

    const handleAccept = async () => {
        try {
            setLoading(true);
            await api.post(`/groups/invitations/accept?token=${encodeURIComponent(inviteJWT)}`);
            onClose();
            navigate('groups');
        } catch (err) {
            setError('Failed to accept invitation!');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Group Invitation</h3>

                {loading ? (
                    <div className="text-center p-4">Verifying invitation...</div>
                ) : error ? (
                    <div className="text-red-500 text-sm mb-4 text-center">{error}</div>
                ) : groupInfo ? (
                    <div className="mb-4">
                        <div className="mb-3">
                            <label className="block text-sm text-gray-600 mb-1">
                                Group Name
                            </label>
                            <div className="font-medium">{groupInfo.groupName}</div>
                        </div>
                        <div className="mb-3">
                            <label className="block text-sm text-gray-600 mb-1">
                                Expiration Time
                            </label>
                            <div className="text-sm">
                                {new Date(groupInfo.exp * 1000).toLocaleString()}
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-400 disabled:opacity-50"
                        disabled={loading}
                    >
                        Close
                    </button>
                    {!error && groupInfo && (
                        <button
                            onClick={handleAccept}
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50"
                        >
                            {loading ? 'Accepting...' : 'Accept'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InviteAcceptModal;