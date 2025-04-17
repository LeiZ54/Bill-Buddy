import {Alert, Spin} from 'antd';
import {motion} from 'framer-motion';
import {useNavigate} from 'react-router-dom';
import Topbar from '../components/TopBar';
import {useEffect, useState} from 'react';
import useAuthStore from '../stores/authStore';
import { useGroupDetailStore } from '../stores/groupDetailStore';

export default function GroupDetailPage() {
    const { groupType } = useAuthStore();
    const { activeGroup, groupData, getGroup, fetchExpenses, clearData, expenses } = useGroupDetailStore();

    const [ isLoading, setIsLoading ] = useState(false);

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
                {isLoading ? (<Spin />) : <Alert message="Something Wrong!" type="error" className="m-4" />}
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
                            <h2 className="text-4xl font-bold mt-3" >{groupData.name}</h2>
                            <p className={`text-sm  mt-2 ${groupData.netBalance >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                                {groupData.netBalance >= 0 ? ' You lent ' : ' You owe '}
                                ${Math.abs(groupData.netBalance).toFixed(2)}

                            </p>
                        </div>
                    </div>
                    {/* expense list */}
                    {expenses.map(expense => (
                        <div>title:{expense.title}</div>
                    ))}


                </div>
            </div>
        </motion.div>
    );
}