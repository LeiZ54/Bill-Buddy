import {Alert, Avatar, Spin, Form, Select, Input} from 'antd';
import {motion} from 'framer-motion';
import {useNavigate} from 'react-router-dom';
import Topbar from '../components/TopBar';
import {useEffect, useMemo, useRef, useState} from 'react';
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
        members,
        fetchMember
    } = useGroupDetailStore();
    const {setActiveExpense} = useExpenseStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
    const [error, setError] = useState("");

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
            setIsLoadingExpenses(true);
            debouncedFetchExpenses();
            return () => {
                debouncedFetchExpenses.cancel();
            };
        }
    }, [filters]);

    const debouncedFetchExpenses = useMemo(() => {
        return debounce(async () => {
            try {
                setError("");
                await fetchExpenses();
            } catch (error) {
                setError("Failed to get data!");
            } finally {
                setIsLoadingExpenses(false);
            }
        }, 1000);
    }, [fetchExpenses]);

    //touch bottome to load more data;

    const isLoadingRef = useRef(false);
    const hasMoreRef = useRef(true);
    const loadMoreRef = useRef(() => { });

    useEffect(() => {
        isLoadingRef.current = isLoadingMore;
        hasMoreRef.current = hasMore;
        loadMoreRef.current = loadMoreExpenses;
    }, [isLoadingMore, hasMore, loadMoreExpenses]);

    useEffect(() => {
        const scrollContainer = document.querySelector('.ant-layout-content');

        const handleScroll = () => {
            if (!scrollContainer) return;

            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            const isBottom = scrollTop + clientHeight >= scrollHeight - 10;

            if (isBottom && !isLoadingRef.current && hasMoreRef.current) {
                loadMoreRef.current();
            }
        };

        scrollContainer?.addEventListener('scroll', handleScroll);
        return () => {
            scrollContainer?.removeEventListener('scroll', handleScroll);
        };
    }, []);


    const generateMonthsFromLatestExpense = (count: number): string[] => {
        let latestDate = new Date();

        let year = latestDate.getFullYear();
        let month = latestDate.getMonth() + 1;

        const result: string[] = [];

        for (let i = 0; i < count; i++) {
            const monthStr = String(month).padStart(2, '0');
            result.push(`${year}-${monthStr}`);

            month--;
            if (month === 0) {
                month = 12;
                year--;
            }
        }

        return result;
    };



    const handleApplyFilters = () => {
        const {payer, title, yearMonth} = form.getFieldsValue();
        const newFilters: any = {};

        if (payer) {
            newFilters.payerId = payer;
        }
        if (title) {
            newFilters.title = title.trim();
        }
        if (yearMonth) {
            newFilters.month = yearMonth;
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
                {(isLoading || isLoadingExpenses) ? (<></>
                ) :
                    <Alert message="Something Wrong!" type="error" className="m-4"/>}
            </motion.div>
        )
    }
    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{ duration: 0.2, delay: 0.2 }}

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


                    <div className="max-w-2xl mx-4 px-0 mt-6">
                        <Form form={form} layout="vertical" className="w-full">
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Form.Item className="m-0 flex-1" name="title">
                                        <Input
                                            placeholder="Search Title"
                                            allowClear
                                            className="border p-1 rounded w-full"
                                            onChange={() =>{ handleApplyFilters();}}
                                        />
                                    </Form.Item>
                                    <Form.Item className="m-0 w-[28%]" name="payer" initialValue="">
                                        <Select
                                            className=" rounded w-full !p-0"
                                            placeholder="Payer"
                                            onSelect={() => { handleApplyFilters(); }}
                                        >
                                            <Option value="">All</Option>
                                            {members.map((payer) => (
                                                <Option key={payer.id} value={payer.id}>
                                                    {payer.fullName}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    <Form.Item className="w-[34%] m-0" name="yearMonth" initialValue="">
                                        <Select
                                            className="rounded w-full !p-0"
                                            placeholder="YYYY-MM"
                                            onSelect={handleApplyFilters}
                                            allowClear
                                        >
                                            <Option value="">All</Option>

                                            {generateMonthsFromLatestExpense(60).map((yearMonth,index) => (
                                                <Option key={index} value={yearMonth}>
                                                    {yearMonth}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </div>



                            </div>
                        </Form>
                    </div>


                    {/* expense list */}
                    <div className="mt-6">
                        {isLoadingExpenses ? (
                            <div className="flex justify-center py-10">
                                <Spin size="large" />
                            </div>
                        ) : error ? (
                            <div className="text-red-500 text-center py-10">
                                {error}
                            </div>
                        ) : expenses.length === 0 ? (
                            <div className="text-gray-500 text-center py-10 text-lg">
                                There is no expense
                            </div>
                        ) : (
                            (() => {
                                let lastMonth = '';

                                return expenses.map(expense => {
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
                                                className="flex items-center justify-between px-4 pt-2 transition active:scale-95"
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