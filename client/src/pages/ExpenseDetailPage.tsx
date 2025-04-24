import {Alert, Avatar, Button, Modal, Radio, Spin} from 'antd';
import {motion} from 'framer-motion';
import {useNavigate} from 'react-router-dom';
import Topbar from '../components/TopBar';
import {useEffect, useState} from 'react';
import {useExpenseStore} from '../stores/expenseStore';
import useAuthStore from "../stores/authStore.ts";
import useBreakpoint from "antd/es/grid/hooks/useBreakpoint";


export default function ExpenseDetailPage() {
    const {activeExpense, expenseData, getExpense} = useExpenseStore();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const {expenseTypes} = useAuthStore();
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
                    }}
                    className="bg-transparent shadow-none"
                />

                <Button
                    type="default"
                    onClick={() => {
                        console.log(expenseData);
                        setIsChangeTypeModalOpen(true);
                    }}
                >
                    Clear
                </Button>
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
                    onOk={()=>{

                    }}
                    style={{ top: 20 }}
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