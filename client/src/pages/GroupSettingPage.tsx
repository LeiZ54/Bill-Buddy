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
    const { activeGroup, groupData, fetchMember, members } = useGroupDetailStore();

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
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        try {
            setIsLoading(true);
            fetchMember();
        } catch (err) {
            setError("Failed to get data!");
        } finally {
            setIsLoading(false);
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
                title={<span className="text-xl font-bold">Group settings</span>}

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


            <div className="w-[100%] mx-auto border-t border-gray-400 my-0 mt-2"/>
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

                    <Button
                        type="text"
                        className="px-5 w-full text-left"
                        icon={<UserAddOutlined/>}
                        size="large"
                    >
                        Add friends
                    </Button>
                    <div className="w-[100%] mx-auto border-t border-gray-200 my-0"/>
                    <Button
                        type="text"
                        className="px-5 w-full text-left"
                        size="large"
                        icon={<MailOutlined/>}
                        onClick={() => setisEmailModalOpen(true)}
                    >
                        Invite via email
                    </Button>
                    <div className="w-[100%] mx-auto border-t border-gray-200 my-0"/>
                    <Button
                        type="text"
                        className="px-5 w-full text-left"
                        size="large"
                        icon={<LinkOutlined/>}
                        onClick={() => setisLinkModalOpen(true)}
                    >
                        Invite via link
                    </Button>


                    {
                        error ? (
                            < Alert message={error} type="error" className="m-4"/>
                        ) : (
                            isLoading ? <Spin/> :
                                <List
                                    dataSource={members}
                                    renderItem={(member) => (
                                        <List.Item className="!px-0">
                                            <div className="flex justify-between w-full px-5 py-2">
                                                <span className="font-bold">{member.fullName}</span>
                                                <span className="text-gray-500 ml-2">{member.email}</span>
                                            </div>
                                        </List.Item>
                                    )}
                                />
                        )
                    }
                </div>

                <div className="mb-8 mt-5 ">
                    <h3 className="text-lg font-medium">Other function</h3>

                    {/* Leave Group */}
                    <Button
                        type="text"
                        icon={<LogoutOutlined/>}
                        className="mt-2 w-full text-left px-5"
                        size="large"
                    >
                        <span>Leave group</span>
                    </Button>
                    <div className="w-[100%] mx-auto border-t border-gray-200 my-0"/>
                    {/* Delete Group */}
                    <Button
                        type="text"
                        icon={<DeleteOutlined className="text-red-500"/>}
                        className="w-full text-left px-5"
                        size="large"
                    >
                        <span className="text-red-500">Delete group</span>
                    </Button>

                </div>

            </div>


        </motion.div>
    );
};

export default GroupSettingPage;