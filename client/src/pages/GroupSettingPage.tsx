import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button, List, Alert, Avatar, Spin } from 'antd';
import { EditOutlined, UserAddOutlined, LinkOutlined, MailOutlined, LogoutOutlined, DeleteOutlined } from '@ant-design/icons';
import { useGroupStore } from '../stores/groupStore';
import Topbar from '../components/TopBar';
import { useNavigate } from 'react-router-dom';
import CreateGroupModal from '../components/CreateGroupModal';
import EmailInviteModal from '../components/EmailInviteModal';
import LinkInviteModal from '../components/LinkInviteModal';

const GroupSettingPage = () => {

    const { activeGroup, isLoading, error, fetchMember, members, resetError, getUrlByType } = useGroupStore();
    const navigate = useNavigate();
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

    useEffect(() => {
        resetError();
        fetchMember(activeGroup!.id);
    }, []);

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

            <CreateGroupModal
                open={isUpdateModaOpen}
                onCancel={() => setisUpdateModalOpen(false)}
                onSuccess={() => {}}
                isEdit
            />

            <EmailInviteModal
                open={isEmailModalOpen}
                onCancel={() => setisEmailModalOpen(false)}
                groupId={activeGroup!.id}
            />

            <LinkInviteModal
                open={isLinkModalOpen}
                onCancel={() => setisLinkModalOpen(false)}
                groupId={activeGroup!.id}
            />

            {/* Group Name Section */}
            <div className="mb-8">
                <div className="flex justify-between gap-4 mb-4">
                    <div>
                        <Avatar
                            src={getUrlByType(activeGroup.type)}
                            size={40}
                            className="flex-shrink-0 mr-4"
                        />
                        {activeGroup.name}
                    </div>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => { setisUpdateModalOpen(true) } }
                    >
                        Edit
                    </Button>
                </div>
            </div>

            {/* Members Section */}
            <div className="mb-8">
                <div className="flex-l justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Group members</h3>
                    <Button
                        type="text"
                        className="w-full text-left"
                        icon={<UserAddOutlined />}
                        size="large"
                    >
                        Add friends
                    </Button>
                    <Button
                        type="text"
                        className="w-full text-left"
                        size="large"
                        icon={<MailOutlined />}
                        onClick={ ()=>setisEmailModalOpen(true)}
                    >
                        Invite via email
                    </Button>
                    <Button
                        type="text"
                        className="w-full text-left"
                        size="large"
                        icon={<LinkOutlined />}
                        onClick={() => setisLinkModalOpen(true)}
                    >
                        Invite via link
                    </Button>


                    {
                        error ? (
                            < Alert message={error} type="error" className="m-4" />
                        ) : (
                            isLoading ? <Spin /> :
                            <List
                                dataSource={members}
                                renderItem={(member) => (
                                    <List.Item className="!px-0">
                                        <div className="flex justify-between w-full p-4">
                                            <span className="font-medium">{member.fullName}</span>
                                            <span className="text-gray-500 ml-2">{member.email}</span>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        )
                    }
                </div>
                <div className="mb-8">
                    <h3 className="font-medium">Other function</h3>

                    {/* Leave Group */}
                    <Button
                        type="text"
                        icon={<LogoutOutlined />}
                        className="w-full text-left"
                        size="large"
                    >
                        <span>Leave group</span>
                    </Button>

                    {/* Delete Group */}
                    <Button
                        type="text"
                        icon={<DeleteOutlined className="text-red-500" />}
                        className="w-full text-left"
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