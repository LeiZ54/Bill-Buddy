import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button, Alert, Avatar, Spin, message, Typography, Modal } from 'antd';
import {
    EditOutlined,
    UserAddOutlined,
    LinkOutlined,
    MailOutlined,
    LogoutOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import Topbar from '../components/TopBar';
import { useNavigate } from 'react-router-dom';
import AddFriendsToGroupModal from '../components/AddFriendsToGroupModal';
import CreateGroupModal from '../components/CreateGroupModal';
import EmailInviteModal from '../components/EmailInviteModal';
import LinkInviteModal from '../components/LinkInviteModal';
import useAuthStore from '../stores/authStore';
import { useGroupDetailStore } from '../stores/groupDetailStore';
import { useExpenseStore } from '../stores/expenseStore';
import { recurrenceOptions } from "../util/util.tsx";


const GroupSettingPage = () => {
    const { currencies } = useAuthStore();
    const { groupType, id, expenseTypes } = useAuthStore();
    const navigate = useNavigate();
    const {
        activeGroup,
        groupData,
        members,
        fetchMember,
        ifDelete,
        getIfDelete,
        leaveGroup,
        deleteGroup,
        getFriendList,
        cycleExpenses,
        fetchCycleExpenses,
    } = useGroupDetailStore();
    const { cycleExpenseData, getCycleExpense, setActiveCycleExpense } = useExpenseStore();

    const { Text, Title } = Typography;
    const [cycleModal, setCycleModal] = useState(false);

    const [isLoadingCycleExpense, setIsLoadingCycleExpense] = useState(false);
    const [cycleExpenseError, setCycleExpenseError] = useState("");
    const handleOpenModal = async (id: number) => {
        setCycleModal(true);
        try {
            setIsLoadingCycleExpense(true);
            setActiveCycleExpense(id);
            await getCycleExpense();
        } catch (error) {
            setCycleExpenseError("Failed to get data!");
        } finally {
            setIsLoadingCycleExpense(false);

        }
    };

    if (!activeGroup) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.2 }}
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

    const [isUpdateModalOpen, setisUpdateModalOpen] = useState(false);
    const [addFriendsToGroupModal, setAddFriendsToGroupModal] = useState(false);
    const [isEmailModalOpen, setisEmailModalOpen] = useState(false);
    const [isLinkModalOpen, setisLinkModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    useEffect(() => {
        if (activeGroup) {
            const fetchData = async () => {
                try {
                    setIsLoading(true);
                    await fetchMember();
                    await getIfDelete();
                    await getFriendList();
                    await fetchCycleExpenses();
                } catch (err) {
                    setError("Failed to get data!");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, []);
    const handleLeave = async () => {
        if (!ifDelete) return;
        try {
            setLeaving(true);
            await leaveGroup(id!);
            navigate("/groups")
        } catch (err) {
            message.error("Fail to leave group!");
        } finally {
            setLeaving(false);
        }
    };

    const handleDelete = async () => {
        if (!ifDelete || isDeleting) return;
        try {
            setIsDeleting(true);
            await deleteGroup();
            navigate("/groups");
        } catch (err) {
            message.error("Fail to delete group!");
        } finally {
            setIsDeleting(false);
        }
    };

    function findRecurrenceLabel(unit: string | null | undefined, interval: number | null | undefined) {
        if (!unit || interval == null) {
            return 'Custom';
        }

        const option = recurrenceOptions.find(
            (opt) => opt.unit === unit && opt.interval === interval
        );

        return option?.label ?? 'Custom';
    }

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
                title="Group settings"

            />

            <CreateGroupModal
                open={isUpdateModalOpen}
                onCancel={() => setisUpdateModalOpen(false)}
                onSuccess={() => {
                }}
                isEdit
            />

            <AddFriendsToGroupModal
                open={addFriendsToGroupModal}
                onCancel={() => setAddFriendsToGroupModal(false)}
                isGroup={false}
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

            <div className="mt-4 px-6">
                <div className="flex justify-between items-center gap-4 mb-4">
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

            <div className="px-4 mt-10 pb-16">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Spin size="large" />
                    </div>
                ) : error ? (
                    <Alert
                        message="Error"
                        description={error}
                        type="error"
                        showIcon
                    />
                ) : (
                    <>
                        {/* Members Section */}
                        <div className="flex-l justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Group members</h3>

                            <div className="w-full">
                                <div
                                    className="flex items-center px-5 py-3 w-full text-left text-lg transition active:scale-95"
                                    onClick={() => setAddFriendsToGroupModal(true)}
                                >
                                    <UserAddOutlined className="mr-8 text-2xl" />
                                    Add friends
                                </div>

                                <div
                                    className="flex items-center px-5 py-3 w-full text-left text-lg transition active:scale-95"
                                    onClick={() => setisEmailModalOpen(true)}
                                >
                                    <MailOutlined className="mr-8 text-2xl" />
                                    Invite via email
                                </div>

                                <div
                                    className="flex items-center px-5 py-3 w-full text-left text-lg transition active:scale-95"
                                    onClick={() => setisLinkModalOpen(true)}
                                >
                                    <LinkOutlined className="mr-8 text-2xl" />
                                    Invite via link
                                </div>
                            </div>

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
                        </div>

                        {/* Cycle Expenses */}
                        <div className="space-y-4 py-2">
                            <h3 className="text-lg font-medium">Cycle expenses</h3>
                            {cycleExpenses.map((expense) => (
                                <div key={expense.id} className="flex items-center space-x-4 px-4"
                                    onClick={() => {
                                        handleOpenModal(expense.id);
                                    }}
                                >
                                    <Avatar
                                        src={expenseTypes[expense.type]}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <Text className="text-lg font-medium">{expense.title}</Text>
                                </div>
                            ))}
                        </div>

                        <Modal
                            open={cycleModal}
                            onCancel={() => setCycleModal(false)}
                            title="Cycle Expense Details"
                            footer={null}
                        >
                            {isLoadingCycleExpense ? (
                                <div className="flex justify-center py-10">
                                    <Spin size="large" />
                                </div>
                            ) : cycleExpenseError ? (
                                <Alert
                                    message="Failed to load cycle expense"
                                    type="error"
                                />
                            ) : (
                                <div className="relative pb-40">
                                    <div className="flex justify-between items-center p-4 ">
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-gray-100 rounded p-2">
                                                <img src={cycleExpenseData?.type && expenseTypes[cycleExpenseData?.type]}
                                                    className="rounded w-12 h-12"
                                                    alt="icon" />
                                            </div>
                                            <div>
                                                <Text className="text-base font-medium">{cycleExpenseData?.title}</Text>
                                                <Title level={4}
                                                    className="!m-0 text-xl font-bold">

                                                    {groupData?.currency}{currencies[groupData!.currency]}{cycleExpenseData?.amount.toFixed(2)}
                                                </Title>
                                                <Text type="secondary" className="text-sm">
                                                    {"Created at "}{cycleExpenseData?.createdAt ? new Date(cycleExpenseData.createdAt).toLocaleDateString() : ''}{" by "}{cycleExpenseData?.payer.fullName}
                                                </Text>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 max-w-md mx-auto space-y-2">

                                        <div className="flex items-center space-x-2 text-xl">
                                            <Avatar src={cycleExpenseData?.payer.avatar} />
                                            <Text
                                                className="text-lg">{cycleExpenseData?.payer.fullName} paid {groupData?.currency + currencies[groupData!.currency] + cycleExpenseData?.amount.toFixed(2)}</Text>
                                        </div>


                                        <div className="ml-6 border-l pl-4 space-y-2">
                                            {cycleExpenseData?.participants
                                                .filter((member) => member.email !== cycleExpenseData?.payer.email)
                                                .map((member, index, arr) => {
                                                    const totalParticipants = arr.length + 1;
                                                    const sharedAmount = cycleExpenseData?.shareAmounts?.length
                                                        ? cycleExpenseData.shareAmounts[index]
                                                        : (cycleExpenseData?.amount ?? 0) / totalParticipants;

                                                    return (
                                                        <div key={member.id} className="flex items-center space-x-2">
                                                            <Avatar src={member.avatar}
                                                                className="w-6 h-6 rounded-full" />
                                                            <Text className="text-gray-700">
                                                                {`${member.fullName} owes ${groupData?.currency}${currencies[groupData!.currency]}${sharedAmount.toFixed(2)}`}
                                                            </Text>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                    <div className="text-black font-semibold">cycle period</div>
                                    <div
                                        className="px-2">{findRecurrenceLabel(cycleExpenseData?.recurrenceUnit, cycleExpenseData?.recurrenceInterval)}</div>


                                    {cycleExpenseData?.description ? (
                                        <>
                                            <div className="mt-2 text-black font-semibold">Description</div>
                                            <div className="px-2">
                                                {cycleExpenseData.description}
                                            </div>
                                        </>
                                    ) : (
                                        <></>
                                    )}



                                </div>
                            )}
                        </Modal>

                        {/* Other function */}
                        <div className="mb-8 mt-5 ">
                            <h3 className="text-lg font-medium">Other function</h3>

                            <div className="w-full">
                                {!ifDelete && (
                                    <div className="text-red-500 text-sm mt-1 px-5">
                                        <p>You can't leave or delete this group!</p>
                                        <p>Because it is not settled up.</p>
                                    </div>
                                )}

                                <div
                                    className="flex items-center px-5 py-3 w-full text-left text-lg transition active:scale-95"
                                    onClick={handleLeave}
                                >
                                    <LogoutOutlined className="mr-8 text-2xl" />
                                    {leaving ? 'Leaving...' : 'Leave group'}
                                </div>

                                <div
                                    className="flex items-center px-5 py-3 w-full text-left text-lg transition active:scale-95"
                                    onClick={handleDelete}
                                >
                                    <DeleteOutlined className="mr-8 text-2xl text-red-500" />
                                    {isDeleting ? 'Deleting...' : 'Delete group'}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

        </motion.div>
    );
};

export default GroupSettingPage;