import {Alert, Avatar, Spin, Form, Button, Select, message, Input} from 'antd';
import {motion} from 'framer-motion';
import {useNavigate} from 'react-router-dom';
import Topbar from '../components/TopBar';
import {useEffect, useMemo, useState} from 'react';
import useAuthStore from '../stores/authStore';
import {useGroupDetailStore} from '../stores/groupDetailStore';
import { useExpenseStore } from '../stores/expenseStore';
import { debounce } from 'lodash';


export default function GroupDetailPage() {
    const {currencies} = useAuthStore();
    const [form] = Form.useForm();
    const {Option} = Select;
    const navigate = useNavigate();
    const {groupType, expenseTypes} = useAuthStore();
    const {
        activeGroup,
        groupData,
        getGroup,
        fetchExpenses,
        clearData,
        expenses,
        loadMoreExpenses,
        isLoadingMore,
        hasMore,
        filters,
        setFilters,
        members
    } = useGroupDetailStore();
    const {setActiveExpense} = useExpenseStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);


    useEffect(() => {
        if (activeGroup) {
            const fetchData = async () => {
                try {
                    clearData();
                    setIsLoading(true);
                    await getGroup();
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
            let loadingTimer = setTimeout(() => {
                setIsLoadingExpenses(true);
            }, 200); 
            debouncedFetchExpenses();
            const timer = setTimeout(() => {
                setIsLoadingExpenses(false);
            }, 500);

            return () => {
                clearTimeout(timer);
                clearTimeout(loadingTimer);
                debouncedFetchExpenses.cancel();
            };
        }
    }, [filters]);

    const debouncedFetchExpenses = useMemo(() => {
        return debounce(() => {
            fetchExpenses();
        }, 500);
    }, [fetchExpenses]);

    //touch bottome to load more data;
    useEffect(() => {
        const scrollContainer = document.querySelector('.ant-layout-content');
        const handleScroll = () => {
            if (!scrollContainer) return;
            const {scrollTop, scrollHeight, clientHeight} = scrollContainer;
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
        const {payer, title, year, month} = form.getFieldsValue();
        const newFilters: any = {};

        if (payer) {
            newFilters.payerId = payer;
        }
        if (title) {
            newFilters.title = title.trim();
        }
        if (year && month) {
            newFilters.month = `${year}-${month.toString().padStart(2, '0')}`;
        } else if (year || month) {
            message.error({
                content: 'Please select both year and month!',
                duration: 1,
                key: 'date_error'
            });
            setTimeout(() => {
                message.destroy();
            }, 1000);
            return;
        }

        setFilters(newFilters);
    };


    if (!groupData) {
        return (
            <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                transition={{duration: 0.2}}
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
                {(isLoading || isLoadingExpenses) ? (<Spin/>) :
                    <Alert message="Something Wrong!" type="error" className="m-4"/>}
            </motion.div>
        )
    }
    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.2}}

        >
            <div className="relative pb-16">
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
                    className="text-white"
                />
                </div>


                <div className="max-w-2xl mx-auto mt-6">
                    {/* group */}
                    <div className="flex flex-col items-start gap-4 bg-white rounded-lg">
                        <img
                            src={groupType[groupData.type]}
                            alt={groupData.type}
                            className="object-contain outline outline-4 outline-white rounded w-16 h-16 absolute ml-[15%]  top-[7rem] shadow-xl"
                        />
                        <div className="ml-[15%]">
                            <h2 className="text-3xl font-semibold mt-3">{groupData.name}</h2>
                            <p className={`text-lg font-semibold ${groupData.netBalance >= 0
                                ? 'text-green-600'
                                : 'text-orange-500'
                            }`}>
                                {groupData.netBalance >= 0 ? ' You lent ' : ' You owe '}
                                {groupData.currency}{currencies[groupData.currency]}
                                {Math.abs(groupData.netBalance).toFixed(2)}
                                {' overall'}
                            </p>
                            {groupData.items.map((item, index) => (
                                <div key={index}>
                                    <span>
                                        {item.type === 'get' ? 'You lent' : 'You owe'} {item.person}
                                    </span>
                                    <span className={`${item.type === 'get'
                                        ? 'text-green-600'
                                        : 'text-orange-500'
                                    }`}>
                                        {" " + groupData.currency}{currencies[groupData.currency]}
                                        {item.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                    </div>


                    <div className="max-w-2xl mx-2 px-0 mt-6">
                        <Form form={form} layout="vertical" className="w-full">
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Form.Item className="m-0 flex-1" name="title">
                                        <Input
                                            placeholder="Search Title"
                                            allowClear
                                            className="border p-1 rounded w-full"
                                        />
                                    </Form.Item>
                                    <Form.Item className="m-0 w-[30%]" name="payer">
                                        <Select
                                            className="border p-2 rounded w-full"
                                            placeholder="Payer"
                                        >
                                            {members.map((payer) => (
                                                <Option key={payer.id} value={payer.id}>
                                                    {payer.fullName}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </div>
                                <div className="flex items-center justify-between space-x-2">
                                    <Form.Item className="w-[26%] m-0" name="year">
                                        <Select
                                            className="border p-2 rounded w-full "
                                            placeholder="Year"
                                        >
                                            {generateYears().map((year) => (
                                                <Option key={year} value={year}>
                                                    {year}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    <Form.Item className="w-[28%] m-0" name="month">
                                        <Select
                                            className="border p-2 rounded w-full"
                                            placeholder="Month"
                                        >
                                            {generateMonths().map((month) => (
                                                <Option key={month} value={month}>
                                                    {month}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    <Form.Item className="m-0">
                                        <Button type="primary" onClick={handleApplyFilters}>
                                            Search
                                        </Button>
                                    </Form.Item>

                                    <Form.Item className="m-0">
                                        <Button
                                            type="default"
                                            onClick={() => {
                                                setFilters({});
                                                form.resetFields();
                                            }}
                                        >
                                            Clear
                                        </Button>
                                    </Form.Item>
                                </div>
                            </div>
                        </Form>
                    </div>


                    {/* expense list */}
                    <div className="mt-6">
                        {isLoadingExpenses ? (
                            <div className="flex justify-center py-10">
                                <Spin size="large" tip="Loading..." />
                            </div>
                        ) : (
                            (() => {
                                let lastMonth = '';

                                return expenses.reverse().map(expense => {
                                    const dateObj = new Date(expense.expenseDate);
                                    const monthLabel = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                                    const showMonthDivider = monthLabel !== lastMonth;
                                    lastMonth = monthLabel;

                                    return (
                                        <div key={expense.id}>
                                            {showMonthDivider && (
                                                <div className="text-black font-semibold px-4 mt-4 mb-2">{monthLabel}</div>
                                            )}

                                            <div
                                                className="flex items-center justify-between px-4 pt-2"
                                                onClick={() => {
                                                    setActiveExpense(expense.id);
                                                    navigate('/groups/expense');
                                                }}
                                            >
                                                <div className="flex flex-col items-center text-gray-400 mr-4">
                                                    <div>{dateObj.toLocaleString('en-US', { month: 'short' })}</div>
                                                    <div className="text-lg">{dateObj.getDate()}</div>
                                                </div>

                                                <div>
                                                    <Avatar shape="square" src={expenseTypes[expense.type]} className="w-12 h-12" />
                                                </div>

                                                <div className="flex-1 mx-4">
                                                    <div className=" text-lg leading-none">{expense.title}</div>
                                                    <div className="text-xs text-gray-500 pt-1">
                                                        {expense.payer.fullName} paid {expense.currency} {expense.amount.toFixed(2)}
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p className={`text-xs pb-1 ${expense.debtsAmount >= 0
                                                        ? 'text-green-600'
                                                        : 'text-orange-600'
                                                        }`}>
                                                        {expense.debtsAmount >= 0 ? ' You lent ' : ' You owe '}
                                                    </p>
                                                    <div className={`text-lg leading-none ${expense.debtsAmount >= 0
                                                        ? 'text-green-600'
                                                        : 'text-orange-600'
                                                        }`}>
                                                        {expense.currency}{currencies[expense.currency]}{Math.abs(expense.debtsAmount).toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()
                        )}
                    </div>


                </div>
            </div>
        </motion.div>
    )
}