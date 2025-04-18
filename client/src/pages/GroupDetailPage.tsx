import {Alert, Avatar, Spin, Form, Button, Select} from 'antd';
import {motion} from 'framer-motion';
import { useNavigate} from 'react-router-dom';
import Topbar from '../components/TopBar';
import {useEffect, useState} from 'react';
import useAuthStore from '../stores/authStore';
import {useGroupDetailStore} from '../stores/groupDetailStore';
import { useExpenseStore } from '../stores/expenseStore';

export default function GroupDetailPage() {
    const [form] = Form.useForm();
    const { Option } = Select;
    const navigate = useNavigate();
    const {groupType,expenseTypes} = useAuthStore();
    const { activeGroup, groupData, getGroup, fetchExpenses, clearData, expenses, fetchMember, loadMoreExpenses, isLoadingMore, hasMore, filters, setFilters } = useGroupDetailStore();
    const { setActiveExpense } = useExpenseStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);

    useEffect(() => {
        if (activeGroup) {
            const fetchData = async () => {
                try {
                    clearData();
                    setIsLoading(true);
                    await getGroup();
                    await fetchMember();
                } catch (err) {
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, []);

    //get expense
    useEffect(() => {
        if (activeGroup) {
            const fetchData = async () => {
                try {
                    setIsLoadingExpenses(true);
                    await fetchExpenses();
                } catch (err) {
                } finally {
                    setIsLoadingExpenses(false);
                }
            };
            fetchData();
        }
    }, [filters]);

    //touch bottome to load more data;
    useEffect(() => {
        const scrollContainer = document.querySelector('.ant-layout-content');
        const handleScroll = () => {
            if (!scrollContainer) return;
            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            if (scrollTop + clientHeight == scrollHeight && !isLoadingMore && hasMore) {
                loadMoreExpenses();
            }
        };
        scrollContainer?.addEventListener('scroll', handleScroll);
        return () => scrollContainer?.removeEventListener('scroll', handleScroll);
    }, [isLoadingMore, loadMoreExpenses]);


    const generateYears = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear - 10; i <= currentYear + 10; i++) {
            years.push(i);
        }
        return years;
    };

    const generateMonths = () => {
        const months = [];
        for (let i = 1; i <= 12; i++) {
            months.push(i);
        }
        return months;
    };
    const handleApplyFilters = () => {
        const values = form.getFieldsValue();
        const formattedDate = `${values.year}-${String(values.month).padStart(2, '0')}`;
        const newFilters = {
            month: formattedDate
        }
        setFilters(newFilters);
    };

    if (!groupData) {
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
                        navigate("/groups/setting");
                    }}
                    className="bg-transparent shadow-none"
                />
                {(isLoading || isLoadingExpenses) ? (<Spin />) : <Alert message="Something Wrong!" type="error" className="m-4" />}
            </motion.div>
        )
    }
    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.2}}

        >
            <div className="relative pb-72">
                <div
                    className="w-full h-40 bg-cover bg-center"
                    style={{backgroundImage: "url('/Account/images.jpg')"}}
                ><Topbar
                    leftType="back"
                    leftOnClick={() => {
                        navigate("/groups");
                    }}
                    rightOnClick={() => {
                        navigate("/groups/setting")
                    }}
                    className="bg-transparent shadow-none"
                /></div>


                <div className="max-w-2xl mx-auto mt-6">
                    {/* group */}
                    <div className="flex flex-col items-start gap-4 bg-white rounded-lg">
                        <img
                            src={groupType[groupData.type]}
                            alt={groupData.type}
                            className="object-contain outline outline-4 outline-white rounded w-16 h-16 absolute ml-[15%]  top-[7rem] shadow-xl"
                        />
                        <div className="ml-[15%]">
                            <h2 className="text-4xl font-bold mt-3">{groupData.name}</h2>
                            <p className={`text-sm  mt-2 ${groupData.netBalance >= 0
                                ? 'text-green-600'
                                : 'text-[#FFA700]'
                            }`}>
                                {groupData.netBalance >= 0 ? ' You lent ' : ' You owe '}
                                ${Math.abs(groupData.netBalance).toFixed(2)}

                            </p>
                        </div>
                    </div>

                    {/*  π”√ æ∑∂ */ }
                    <div className="max-w-2xl mx-auto mt-6 space-y-4 px-4">
                        <Form form={form} layout="vertical">
                            <Form.Item label="Year" name="year">
                                <Select
                                    className="border p-2 rounded"
                                    placeholder="Select Year"
                                >
                                    {generateYears().map((year) => (
                                        <Option key={year} value={year}>
                                            {year}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item label="Month" name="month">
                                <Select
                                    className="border p-2 rounded"
                                    placeholder="Select Month"
                                >
                                    {generateMonths().map((month) => (
                                        <Option key={month} value={month}>
                                            {month}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Button
                                type="primary"
                                onClick={handleApplyFilters}
                            >
                                Apply Filters
                            </Button>
                        </Form>
                    </div>

                    <Button
                        type="primary"
                        onClick={() => {
                            setFilters({});
                        }}
                    >
                        clear filter
                    </Button>
                    {/* expense list */}
                    <div className="mt-10">
                        {[...expenses].reverse().map(expense => (
                            <div
                                key={expense.id}
                                className="flex items-center justify-between py-2 border-b px-4"
                                onClick={() => {
                                    setActiveExpense(expense.id);
                                    navigate('/groups/expense');
                                }}
                            >
                                <div className="w-12 text-center">
                                    <div className="text-xl text-gray-400">
                                        {new Date(expense.expenseDate).toLocaleString('en-US', {month: 'short'})}
                                    </div>
                                    <div className="text-base font-bold">
                                        {new Date(expense.expenseDate).getDate()}
                                    </div>
                                </div>
                                <div className="border-2 border-gray-300 rounded-md flex-">
                                    <Avatar src={expenseTypes[expense.type]}/>
                                </div>
                                <div className="flex-1 mx-4">
                                    <div className="font-bold text-xl">{expense.title}</div>
                                    <div className="text-xs text-gray-500">
                                        {expense.payer.fullName} paid {expense.currency} {expense.amount.toFixed(2)}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className={`text-lg  mt-2 ${expense.debtsAmount >= 0
                                        ? 'text-green-600'
                                        : 'text-[#FFA700]'
                                    }`}>
                                        {expense.debtsAmount >= 0 ? ' You lent ' : ' You owe '}

                                    </p>
                                    <div className="text-xl text-[#FFA700] font-bold">
                                        {expense.currency}{expense.debtsAmount.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>

                </div>
            </div>
        </motion.div>
    )
}