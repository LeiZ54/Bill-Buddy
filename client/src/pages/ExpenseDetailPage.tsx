import {Alert, Avatar, Modal, Radio, Spin} from 'antd';
import {motion} from 'framer-motion';
import {useNavigate} from 'react-router-dom';
import Topbar from '../components/TopBar';
import {useEffect, useState} from 'react';
import {useExpenseStore} from '../stores/expenseStore';
import useAuthStore from "../stores/authStore.ts";
import useBreakpoint from "antd/es/grid/hooks/useBreakpoint";


import { Typography } from 'antd';
import { useGroupDetailStore } from '../stores/groupDetailStore.ts';

export default function ExpenseDetailPage() {
    const { currencies, expenseTypes } = useAuthStore();
    const { activeExpense, expenseData, getExpense } = useExpenseStore();
    const { setActiveGroup } = useGroupDetailStore();
    const { Title, Text } = Typography;
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const screens = useBreakpoint();
    const [isChangeTypeModalOpen, setIsChangeTypeModalOpen] = useState(false);
    useEffect(() => {
        if (activeExpense) {
            const fetchData = async () => {
                try {
                    setIsLoading(true);
                    await getExpense();

                } catch (err) {
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();

        }
    }, []);


    if (!expenseData) {
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
                    title={"Expense Detail"}
                />
                {(isLoading) ? (<Spin/>) : <Alert message="Something Wrong!" type="error" className="m-4"/>}
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.2}}

        >
            <div className="relative pb-40">
                <Topbar
                    leftType="back"
                    leftOnClick={() => {
                        navigate("/groups/detail");
                        setActiveGroup(expenseData!.groupId);
                    }}
                />
                <div className="flex justify-between items-center p-4 shadow-sm ">
                    <div className="flex items-center space-x-3">
                        <div className="bg-gray-100 rounded p-2">
                            <img src={expenseTypes[expenseData.type]} className="rounded w-12 h-12" alt="icon"/>
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
                </div>
                <div className="p-6 max-w-md mx-auto space-y-2">

                    <div className="flex items-center space-x-2 text-xl">
                        <Avatar src={expenseData.payer.avatar}/>
                        <Text className="text-lg">{expenseData.payer.fullName} paid {expenseData.currency + currencies[expenseData.currency] + expenseData.amount}</Text>
                    </div>


                    <div className="ml-6 border-l pl-4 space-y-2">
                        {Object.entries(expenseData.shares)
                            .filter(([name]) => name !== expenseData.payer.fullName)
                            .map(([name, value]) => (
                                <div key={name} className="flex items-center space-x-2">
                                    {/*<Avatar src={expenseData.payer.avatar}/>*/}
                                    <Text className="text-gray-700">
                                        {`${name} owes ${expenseData.currency + currencies[expenseData.currency]}${value.toFixed(2)}`}
                                    </Text>
                                </div>
                            ))}
                    </div>

                </div>
                {expenseData?.description ? (
                    <div className="mt-10 p-6">
                        <div className=" text-black font-semibold">Description</div>
                        <div className="px-2">
                            {expenseData.description}
                        </div>
                    </div>
                ) : (
                    <></>
                )}

                <Modal
                    open={isChangeTypeModalOpen}
                    onCancel={() => {
                        setIsChangeTypeModalOpen(false);
                    }}
                    title={
                        <div className="text-center text-4xl font-bold">
                            Change Type
                        </div>
                    }
                    onOk={() => {

                    }}
                    style={{top: 20}}
                >
                    <Radio.Group>
                        <div className={`grid grid-cols-2 gap-3 ${screens.xs ? '' : 'sm:grid-cols-4'}`}>
                            {Object.entries(expenseTypes).map(([type, url]) => (
                                <Radio.Button
                                    key={type}
                                    value={type}
                                    className="h-full flex flex-col items-center p-4"
                                    style={{
                                        borderWidth: 2,
                                        borderRadius: 8,
                                    }}
                                >
                                    <div className="flex flex-col items-center">
                                        <Avatar src={url}/>
                                        <span className="text-gray-600">{type}</span>
                                    </div>
                                </Radio.Button>
                            ))}
                        </div>
                    </Radio.Group>
                </Modal>
            </div>

        </motion.div>
    )
}