import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button, List, Alert, Avatar, Spin } from 'antd';
import { EditOutlined, UserAddOutlined, LinkOutlined, MailOutlined, LogoutOutlined, DeleteOutlined } from '@ant-design/icons';
import Topbar from '../components/TopBar';
import { useNavigate } from 'react-router-dom';
import CreateGroupModal from '../components/CreateGroupModal';
import EmailInviteModal from '../components/EmailInviteModal';
import LinkInviteModal from '../components/LinkInviteModal';
import useAuthStore from '../stores/authStore';
import { useGroupDetailStore } from '../stores/groupDetailStore';

const GroupSettingPage = () => {


    const { groupType } = useAuthStore();
    const navigate = useNavigate();
    const { activeGroup, groupData, members, fetchMember } = useGroupDetailStore();

    if (!activeGroup) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
            <Topbar
                leftType="back"
                leftOnClick={() => {
                    navigate("/groups/detail");
                }}
                title={"Group settings"}
            />
                < Alert message="Something Wrong!" type="error" className="m-4" />;
            </motion.div>
        ) 
    }

    const [isUpdateModaOpen, setisUpdateModalOpen] = useState(false);
    const [isEmailModalOpen, setisEmailModalOpen] = useState(false);
    const [isLinkModalOpen, setisLinkModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (activeGroup) {
            const fetchData = async () => {
                try {
                    setIsLoading(true);
                    await fetchMember();
                } catch (err) {
                    setError("Failed to get data!");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, []);

    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
        >
            <Topbar

                leftType="back"
                leftOnClick={() => {
                    navigate("/groups/detail");
                }}
                title="Group settings"

            />

            <CreateGroupModal
                open={isUpdateModaOpen}
                onCancel={() => setisUpdateModalOpen(false)}
                onSuccess={() => {}}
                isEdit
            />

            <EmailInviteModal
                open={isEmailModalOpen}
                onCancel={() => setisEmailModalOpen(false)}
                groupId={activeGroup}
            />

            <LinkInviteModal
                open={isLinkModalOpen}
                onCancel={() => setisLinkModalOpen(false)}
                groupId={activeGroup}
            />


            <div className="w-[100%] mx-auto border-gray-400 my-0 mt-2"/>
            <div className="mt-4 px-6">
                <div className="flex justify-between gap-4 mb-4">
                    <div>
                        <Avatar
                            src={groupType[groupData!.type]}
                            size={60}
                            className="flex-shrink-0 mr-4"
                        />
                        <span className="text-xl font-semibold">{groupData!.name}</span>
                    </div>
                    <Button
                        type="text"
                        icon={<EditOutlined className="text-blue-500" />}
                        onClick={() => {
                            setisUpdateModalOpen(true)
                        }}
                        className="text-base font-medium text-blue-500"
                    >
                        Edit
                    </Button>
                </div>
            </div>

            {/* Members Section */}
            <div className="px-4 mt-10">
                <div className="flex-l justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Group members</h3>

                    <div className="w-full">
                        <div
                            className="flex items-center px-5 py-3 w-full text-left text-lg"
                        >
                            <UserAddOutlined className="mr-8 text-2xl" />
                            Add friends
                        </div>

                        <div
                            className="flex items-center px-5 py-3 w-full text-left text-lg"
                            onClick={() => setisEmailModalOpen(true)}
                        >
                            <MailOutlined className="mr-8 text-2xl" />
                            Invite via email
                        </div>

                        <div
                            className="flex items-center px-5 py-3 w-full text-left text-lg"
                            onClick={() => setisLinkModalOpen(true)}
                        >
                            <LinkOutlined className="mr-8 text-2xl" />
                            Invite via link
                        </div>
                    </div>


                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Spin size="large" />
                        </div>
                    ) : error ? (
                        <div className="m-4 text-red-500">{error}</div>
                    ) : (
                        <div className="space-y-4 px-4 py-2">
                            {members.map((member) => (
                                <div key={member.email} className="flex items-center space-x-4">
                                    <img
                                        src={member.avatar}
                                        alt={member.fullName}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-black text-lg">{member.fullName}</span>
                                        <span className="text-gray-500 text-sm">{member.email}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}


                </div>

                <div className="mb-8 mt-5 ">
                    <h3 className="text-lg font-medium">Other function</h3>

                    <div className="w-full">
                        <div className="flex items-center px-5 py-3 w-full text-left text-lg">
                            <LogoutOutlined className="mr-8 text-2xl" />
                            Leave group
                        </div>

                        <div className="flex items-center px-5 py-3 w-full text-left text-lg">
                            <DeleteOutlined className="mr-8 text-2xl text-red-500" />
                            Delete group
                        </div>
                    </div>

                </div>

            </div>


        </motion.div>
    );
};

export default GroupSettingPage;