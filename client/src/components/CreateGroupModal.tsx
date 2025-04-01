import { useState } from 'react';
const CreateGroupModal = ({
    mode,
    open,
    onClose,
    onSubmit,
    error
}: {
    mode: string;
    open: boolean;
    onClose: () => void;
    onSubmit: (groupName: string) => void;
    error: string;
    }) => {
    const [groupName, setGroupName] = useState('');

    if (!open) return null;


    const isCreateMode = mode === "create";
    const title = isCreateMode ? "Create New Group" : "Update Group";
    const submitButtonText = isCreateMode ? "Create" : "Update";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">{title}</h3>
                <input
                    type="text"
                    placeholder="Group name"
                    className="w-full p-2 border rounded mb-4"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                />
                <div className="flex justify-end space-x-3">
                    {error && (
                        <span className="px-4 py-2 text-red-500 text-sm block mt-1">{error}</span>
                    )}
                    <button
                        onClick={() => {
                            onClose();
                            setGroupName("");
                        }}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onSubmit(groupName);
                            setGroupName("");
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        {submitButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default CreateGroupModal;