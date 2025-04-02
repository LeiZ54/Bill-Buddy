import { useState, useEffect } from 'react';
import api from "../services/axiosConfig";

const LinkInviteModal = ({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    const [link, setLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copySuccess, setCopySuccess] = useState('');

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        } catch (err) {
            setCopySuccess('Failed to copy!');
        }
    };

    useEffect(() => {
        if (!open) {
            setLink('');
            setError('');
            setLoading(false);
            setCopySuccess('');
            return;
        }

        const fetchInviteLink = async () => {
            try {
                setLoading(true);
                const groupId = sessionStorage.getItem('groupId');

                if (!groupId) {
                    throw new Error('Group ID not found in session');
                }

                const response = await api.get<{ inviteLink: string }>(
                    `/groups/${groupId}/invitation-link`
                );

                setLink(response.data.inviteLink);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to get invitation link');
                setLink('');
            } finally {
                setLoading(false);
            }
        };

        fetchInviteLink();
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Invite via Link</h3>
                <p className="text-sm text-gray-600 mb-2">
                    Anyone can follow this link to join group. Only share it with people you trust.
                </p>

                {loading ? (
                    <div className="p-4 text-center text-gray-500">Loading...</div>
                ) : (
                        <div className='mt-4'>
                            <textarea
                                value={link}
                                readOnly
                                rows={6}
                                className="w-full p-2 border rounded mb-4 text-sm bg-gray-50 select-all break-all whitespace-pre-wrap font-mono"
                                placeholder={error ? 'Failed to load link' : undefined}
                                spellCheck={false}
                            />

                        {copySuccess && (
                            <div className="text-green-600 text-sm mb-2 text-center">
                                {copySuccess}
                            </div>
                        )}

                        {error && (
                            <div className="text-red-500 text-sm mb-4">{error}</div>
                        )}
                    </div>
                )}
                <div className="flex justify-end space-x-3">
                    {link && (
                        <div className="flex justify-end">
                            <button
                                onClick={handleCopy}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50"
                                disabled={loading}
                            >
                                Copy
                            </button>
                        </div>
                    )}
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50"
                            disabled={loading}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LinkInviteModal;