import auth from "../services/auth";
import api from "../services/axiosConfig";
import { useLocation, useNavigate  } from 'react-router-dom';
import CreateGroupModal from "../components/CreateGroupModal";
import EmailInviteModal from "../components/EmailInviteModal";
import GroupMemberList from "../components/GroupMemberList";

import { useState } from 'react';

const GroupSettingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { groupId, groupName } = location.state || {};
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEmailInviteModal, setShowEmailInviteModal] = useState(false);

    const handleCreateGroup = async (groupName: string) => {
        try {
            if (!groupName.trim()) {
                setError('Group name can not be empty!');
                return;
            }

            //await api.post('/groups', { groupName });
            // reflash
            setShowCreateModal(false);
        } catch (err) {
            setError('Failed to create group');
        }
    };

    const handleEmailInvite = async (email: string) => {
        try {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email.trim()) {
                setError('Email cannot be empty!');
                return;
            } else if (!emailRegex.test(email)) {
                setError('Please enter a valid email address');
                return;
            }
            await api.post(`/groups/${groupId}/invite?email=${email}`);
            setSuccess('Success to send invitation!');
            setError('');
        } catch (err) {
            setSuccess("");
            setError('Failed to send invitation!');
        }
    };


    return (
        <div>
            {/* update group */}
            <CreateGroupModal
                mode="creat"
                open={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setError("");
                }}
                onSubmit={handleCreateGroup}
                error={error}
            />
            {/* email invite */}
            <EmailInviteModal
                open={showEmailInviteModal}
                onClose={() => {
                    setShowEmailInviteModal(false);
                    setSuccess("");
                    setError("");
                }}
                onSubmit={handleEmailInvite}
                error={error}
                success={success}
            />

            <div className="mx-auto max-w-md space-y-6">
                {/* top bar */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/groupDetail', {
                            state: {
                                groupId,
                                groupName
                            }
                        })}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <img src="/group/back.png" className="w-6 h-6 rounded-full" />
                    </button>
                    <h1 className="text-lg font-medium">Group settings</h1>
                    <div className="w-6 h-6" ></div>
                </div>

                {/* content */}
                <div className="px-4 space-y-8">
                    {/* group name */}
                    <div className="space-y-4">
                        <h2 className="font-medium">Group name</h2>
                        <div className="flex justify-between items-center p-3">
                            <span>{groupName}</span>
                            <button className="text-green-500" onClick={() => { setShowCreateModal(true) } }>Edit</button>
                        </div>
                        <div className="w-full h-px bg-gray-300"></div>
                    </div>

                    {/* member manage */}
                    <div className="space-y-4">
                        <h2 className="font-medium">Group members</h2>
                        <div className="flex relative cursor-pointer hover:bg-gray-50 transition-colors p-2">
                            <img src="/group/AddFriends.png" className="w-6 h-6 mr-4" />
                            <span>Add friends to group</span>
                        </div>
                        <div className="flex relative cursor-pointer hover:bg-gray-50 transition-colors p-2">
                            <img src="/group/Link.png" className="w-6 h-6 mr-4" />
                            <span>Invite via link</span>
                        </div>
                        <div className="flex relative cursor-pointer hover:bg-gray-50 transition-colors p-2"
                            onClick={() => setShowEmailInviteModal(true)}
                        >
                            <img src="/group/Email.png" className="w-6 h-6 mr-4" />
                            <span>Invite via email</span>
                        </div>

                        {/* member list */}
                        <div className="space-y-4">
                            {groupId && (
                                <GroupMemberList groupId={groupId} />
                            )}
                        </div>
                        <div className="w-full h-px bg-gray-300"></div>
                    </div>
                    <div className="space-y-4">
                        <h2 className="font-medium">Other function</h2>
                        <div className="flex relative cursor-pointer hover:bg-gray-50 transition-colors p-2">
                            <img src="/group/leave.png" className="w-6 h-6 mr-4" />
                            <span>Leave group</span>
                        </div>

                        <div className="flex relative cursor-pointer hover:bg-gray-50 transition-colors p-2">
                            <img src="/group/delete.png" className="w-6 h-6 mr-4" />
                            <span className="text-red-500">Delete group</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default auth(GroupSettingPage);