import api from "../services/axiosConfig";
import { getUrlByType } from "../services/util";
import { useNavigate  } from 'react-router-dom';
import CreateGroupModal from "../components/CreateGroupModal";
import EmailInviteModal from "../components/EmailInviteModal";
import LinkInviteModal from "../components/LinkInviteModal";
import GroupMemberList from "../components/GroupMemberList";
import Topbar from "../components/Topbar";
import { useState, useEffect } from 'react';

const GroupSettingPage = () => {
    const navigate = useNavigate();
    const groupId = Number(sessionStorage.getItem("groupId"));
    const [groupName, setGroupName] = useState('');
    const [url, setUrl] = useState('/group/other.png');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEmailInviteModal, setShowEmailInviteModal] = useState(false);
    const [showLinkInviteModal, setShowLinkInviteModal] = useState(false);

    useEffect(() => {
        setGroupName(sessionStorage.getItem("groupName") || '');
        setUrl(getUrlByType(sessionStorage.getItem("groupType") || 'other'));
    }, []);

    const handleUpdateGroup = async (groupNewName: string, groupNewType: string) => {
        try {
            if (!groupNewName.trim()) {
                setError('Group name can not be empty!');
                return;
            } else if (!groupNewType.trim()) {
                setError('Please select group type!');
            }

            await api.put(`/groups/${groupId}`, { newName: groupNewName, newType: groupNewType});
            sessionStorage.setItem("groupName", groupNewName);
            sessionStorage.setItem("groupType", groupNewType);
            setGroupName(groupNewName);
            setUrl(getUrlByType(groupNewType));
            // reflash
            setShowCreateModal(false);
            setError('');
        } catch (err) {
            setError('Failed to update group');
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
                onSubmit={handleUpdateGroup}
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

            {/* link invite */}
            <LinkInviteModal
                open={showLinkInviteModal}
                onClose={() => {
                    setShowLinkInviteModal(false);
                }}
            />

            <div className="mx-auto max-w-md space-y-6">
                {/* top bar */}
                <Topbar
                    leftIcon="/group/back.png"
                    leftOnClick={() => {
                        navigate('/groupDetail');
                        sessionStorage.setItem("groupPage", "detail");
                    }}
                    title="Group settings"
                />

                {/* content */}
                <div className="px-4 space-y-8">
                    {/* group name */}
                    <div className="space-y-4">
                        <h2 className="font-medium">Group type & name</h2>
                        <div className="flex justify-between items-center p-3">
                            <div className="flex">
                                <img src={url} alt="Logo" className="w-10 h-10 rounded-full" />
                                <span className="ml-4 text-2xl leading-10">{groupName}</span>
                            </div>
                            <button className="text-green-500 text-2xl leading-10" onClick={() => { setShowCreateModal(true) } }>Edit</button>
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
                        <div className="flex relative cursor-pointer hover:bg-gray-50 transition-colors p-2"
                            onClick={() => setShowLinkInviteModal(true)}
                        >
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
                            <GroupMemberList />
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

export default GroupSettingPage;