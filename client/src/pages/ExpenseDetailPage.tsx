import { Alert, Avatar, Button, Modal, Spin, message } from 'antd';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/TopBar';
import { useEffect, useRef, useState } from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import useAuthStore from "../stores/authStore.ts";


import { Typography } from 'antd';
import { useGroupDetailStore } from '../stores/groupDetailStore.ts';
import { DeleteOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons';

export default function ExpenseDetailPage() {
    const { currencies, expenseTypes, id } = useAuthStore();
    const { activeExpense, expenseData, getExpense, deleteExpense, uploadImg } = useExpenseStore();
    const { setActiveGroup } = useGroupDetailStore();
    const { Title, Text } = Typography;
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");

    const [previewOpen, setPreviewOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageClick = () => {
        if (!expenseData?.picture && fileInputRef.current) {
            fileInputRef.current.click();
        } else {
            setPreviewOpen(true);
        }
    };

    console.log(expenseData);
    const fetchData = async () => {
        try {
            setIsLoading(true);
            await getExpense();
        } catch (err) {
            setError("Failed to get Data!");
        } finally {
            setIsLoading(false);
        }
    };
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                await uploadImg(file);
                await fetchData();
            } catch (err) {
                message.error("Upload failed");
            }
        }
    };

    useEffect(() => {
        if (activeExpense) {
            fetchData();
        }
    }, []);


    if (!expenseData) {
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
                    title={"Expense Detail"}
                />
                {(isLoading) ? (<Spin />) : <Alert message="Something Wrong!" type="error" className="m-4" />}
            </motion.div>
        )
    }

    const handleDelete = async () => {
        if (isDeleting) return;
        try {
            setIsDeleting(true);
            setActiveGroup(expenseData?.groupId!);
            await deleteExpense();
            navigate("/groups/detail");
        } catch (err) {
            message.error("Fail to delete expense!");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}

        >
            <Topbar
                leftType="back"
                leftOnClick={() => {
                    navigate("/groups/detail");
                    setActiveGroup(expenseData!.groupId);
                }}
            />

            <Modal
                open={previewOpen}
                footer={null}
                onCancel={() => setPreviewOpen(false)}
                centered
            >
                <div className="flex flex-col items-center space-y-4">
                    <img
                        alt="Preview"
                        src={expenseData.picture}
                        style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain' }}
                    />
                    <button
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => {
                            setPreviewOpen(false);
                            fileInputRef.current?.click();
                        }}
                    >
                        Reupload
                    </button>
                </div>
            </Modal>

            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Spin size="large" />
                </div>
            ) : error ? (
                <div className="text-red-500 text-center py-10">
                    {error}
                </div>
            ) : (
                <div className="relative">
                    <div className="flex justify-between items-center p-4 shadow-sm ">
                        <div className="flex items-center space-x-3">
                            <div className="bg-gray-100 rounded p-2">
                                <img src={expenseTypes[expenseData.type]} className="rounded w-12 h-12" alt="icon" />
                            </div>
                            <div>
                                <Text className="text-base font-medium">{expenseData.title}</Text>
                                <Title level={4}
                                    className="!m-0 text-xl font-bold">{expenseData.currency + currencies[expenseData.currency] + expenseData.amount.toFixed(2)}</Title>
                                <Text type="secondary" className="text-sm">
                                    {"Added by " + expenseData.payer.fullName + " on " + expenseData.expenseDate.split('T')[0]}
                                </Text>
                            </div>
                        </div>
                        <div
                            className="bg-gray-100 w-20 h-20 flex items-center justify-center"
                            onClick={handleImageClick}
                        >
                            {expenseData.picture ? (
                                <img
                                    src={expenseData.picture}
                                    className="w-full h-full object-contain"
                                    alt="Expense"
                                />
                            ) : (
                                <UploadOutlined className="text-xl text-gray-500" />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>



                    </div>

                    <div className="my-4 px-6 flex gap-4">
                        <Button
                            type="primary"
                            danger
                            icon={<DeleteOutlined />}
                            loading={isDeleting}
                            onClick={handleDelete}
                            className="flex-1 flex items-center justify-center text-lg"
                            disabled={expenseData?.payer?.id !== id || expenseData.settled}
                        >
                            Delete
                        </Button>
                    </div>

                    <div className="my-4 px-6 flex gap-4">
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => { navigate("edit") }}
                            className="flex-1 flex items-center justify-center text-lg"
                            disabled={expenseData?.payer?.id !== id || expenseData.settled}
                        >
                            Edit
                        </Button>
                    </div>
                    {expenseData?.payer?.id !== id && (
                        <p className="text-sm text-gray-500 text-center">
                            Only the payor can edit or delete this expense.
                        </p>
                    )}

                    <div className="pt-4 pl-6 space-y-2">
                        <div className="flex items-center text-xl">
                            <Avatar src={expenseData.payer.avatar} />
                            <Text className="text-lg">{expenseData.payer.fullName} paid {expenseData.currency + currencies[expenseData.currency] + expenseData.amount}</Text>
                        </div>

                        <div className="ml-6 pl-4 space-y-2">
                            {expenseData.shares
                                .filter(share => share.user.id !== expenseData.payer.id)
                                .map(share => (
                                    <div key={share.user.id} className="flex items-center space-x-2">
                                        <Avatar src={share.user.avatar} />
                                        <Text className="text-gray-700">
                                            {`${share.user.fullName} owes ${expenseData.currency}${currencies[expenseData.currency]}${share.shareAmount.toFixed(2)}`}
                                        </Text>
                                    </div>
                                ))}

                        </div>

                    </div>
                    {expenseData?.description ? (
                        <div className="mt-2 ml-8">
                            <div className=" text-black font-semibold text-lg">Description</div>
                            <div className="px-2">
                                {expenseData.description}
                            </div>
                        </div>
                    ) : (
                        <></>
                    )}
                    <div className="mt-2 ml-8">
                        <div className=" text-black font-semibold text-lg">Logs</div>
                        <div
                            dangerouslySetInnerHTML={{
                                __html: expenseData.logs,
                            }}
                        />
                    </div>

                </div>
            )}

        </motion.div>
    )
}