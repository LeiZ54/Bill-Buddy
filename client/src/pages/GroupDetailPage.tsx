import {Alert, Avatar, Spin} from 'antd';
import {motion} from 'framer-motion';
import {useNavigate} from 'react-router-dom';
import Topbar from '../components/TopBar';
import {useEffect, useState} from 'react';
import useAuthStore from '../stores/authStore';
import {useGroupDetailStore} from '../stores/groupDetailStore';

export default function GroupDetailPage() {
    const {groupType,expenseTypes} = useAuthStore();
    const {activeGroup, groupData, getGroup, fetchExpenses, clearData, expenses} = useGroupDetailStore();

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (activeGroup) {
            const fetchData = async () => {
                try {
                    clearData();
                    setIsLoading(true);
                    await getGroup();
                    await fetchExpenses();
                } catch (err) {
                    console.error("Failed to load group:", err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();

        }
    }, []);


    const navigate = useNavigate();

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
                {isLoading ? (<Spin/>) : <Alert message="Something Wrong!" type="error" className="m-4"/>}
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
                    {/* expense list */}
                    <div className="mt-10">
                        {[...expenses].reverse().map(expense => (
                            <div
                                key={expense.id}
                                className="flex items-center justify-between py-2 border-b px-4"
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
        ;
}