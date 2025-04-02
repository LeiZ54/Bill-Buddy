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
    onSubmit: (groupName: string, groupType: string) => void;
    error: string;
    }) => {
    const [groupName, setGroupName] = useState('');
    const [groupType, setGroupType] = useState('other');

    if (!open) return null;


    const isCreateMode = mode === "create";
    const title = isCreateMode ? "Create New Group" : "Update Group";
    const submitButtonText = isCreateMode ? "Create" : "Update";
    const groupTypes = [
        { value: 'trip', label: 'Trip', image: '/group/trip.png' },
        { value: 'daily', label: 'Daily', image: '/group/daily.png' },
        { value: 'party', label: 'Party', image: '/group/party.png' },
        { value: 'other', label: 'Other', image: '/group/other.png' }
    ];


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">{title}</h3>

                {/* Group Type Selector */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Group Type
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {groupTypes.map((type) => (
                            <div
                                key={type.value}
                                onClick={() => setGroupType(type.value)}
                                className={`cursor-pointer p-2 border-2 rounded-lg flex flex-col items-center ${groupType === type.value
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <img
                                    src={type.image}
                                    alt={type.label}
                                    className="w-8 h-8 mb-1 object-contain"
                                />
                                <span className="text-sm text-gray-600">{type.label}</span>
                            </div>
                        ))}
                    </div>
                </div>


                {/* Group Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Group Name
                    </label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded mb-4"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                    />
                </div>
                {error && (
                    <span className="text-red-500 text-sm block mt-1">{error}</span>
                )}
                
                <div className="flex justify-end space-x-3">
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
                            onSubmit(groupName, groupType);
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