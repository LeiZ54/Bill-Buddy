import { Alert,Spin } from 'antd';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/TopBar';
import { useEffect, useState } from 'react';
import { useExpenseStore } from '../stores/expenseStore';

export default function ExpenseDetailPage() {
    const { activeExpense, expenseData, getExpense } = useExpenseStore();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}

        >
                    <Topbar
                        leftType="back"
                        leftOnClick={() => {
                            navigate("/groups");
                        }}
                        rightOnClick={() => {
                            navigate("/groups/setting")
                        }}
                        className="bg-transparent shadow-none"
                    />

                    <div>
                        title: {expenseData.title}
                    </div>
            
        </motion.div>
    )
}