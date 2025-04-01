import { useState } from 'react';

const EmailInviteModal = ({
    open,
    onClose,
    onSubmit,
    error,
    success
}: {
    open: boolean;
    onClose: () => void;
    onSubmit: (email: string) => void;
    error: string;
    success: string;
}) => {
    const [email, setEmail] = useState('');

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Invite via Email</h3>
                <input
                    type="email"
                    placeholder="Enter email address"
                    className="w-full p-2 border rounded mb-4"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                {error && (
                    <span className="text-red-500 text-sm block mt-1">{error}</span>
                )}
                {success && (
                    <span className="text-green-500 text-sm block mt-1">{success}</span>
                )}
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={() => {
                            onClose();
                            setEmail('');
                        }}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(email)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};
export default EmailInviteModal;