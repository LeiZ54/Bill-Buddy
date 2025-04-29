import {motion} from 'framer-motion';
import Topbar from '../components/TopBar';
import {useNavigate} from 'react-router-dom';
import {useFriendStore} from '../stores/friendStore';
import {Avatar, Button, message} from "antd";
import useAuthStore from "../stores/authStore.ts";
import { useGroupDetailStore } from '../stores/groupDetailStore.ts';
import { DeleteOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import Alert from 'antd/es/alert/Alert';


export default function FriendDetailPage() {
    const navigate = useNavigate();
    const {activeFriend, deleteFriend, getGroupList} = useFriendStore();
    const { currencies, groupType } = useAuthStore();
    const { setActiveGroup } = useGroupDetailStore();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (activeFriend) {
            const fetchData = async () => {
                try {
                    setIsLoading(true);
                    await getGroupList();
                } catch (err) {
                    setError("Failed to get data!");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, []);

    const handleDelete = async () => {
        if (isDeleting) return;
        try {
            setIsDeleting(true);
            await deleteFriend();
            navigate("/friends");
        } catch (err) {
            message.error("Fail to delete friend!");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!activeFriend) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
            >
                <Topbar
                    leftType="back"
                    leftOnClick={() => {
                        navigate("/friends");
                    }}
                    className="text-white"
                />
                <Alert message="Something Wrong!" type="error" className="m-4" />
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.2, delay: 0.2}}
            className="mb-40"
        >
            <div className="relative pb-16">
                <div
                    className="w-full h-40 bg-cover bg-center"
                    style={{backgroundImage: "url('/Account/images.jpg')"}}
                ><Topbar
                    leftType="back"
                    leftOnClick={() => {
                        navigate("/friends");
                    }}
                    className="text-white"
                />
                </div>
                <div className="max-w-2xl mx-auto mt-6">
                    <div className="flex flex-col items-start gap-4 bg-white rounded-lg">
                        <img
                            src={activeFriend?.avatar}
                            className="object-contain outline outline-4 outline-white rounded w-16 h-16 absolute ml-[15%]  top-[7rem] shadow-xl"
                        />
                        <div className="ml-[15%]">
                            <h2 className="text-3xl font-semibold mt-3">{activeFriend?.fullName}</h2>
                            <div className="mt-5">
                                {activeFriend?.netDebts
                                    .filter(debt => debt.debtAmount !== 0)
                                    .map((debt, index) => (
                                    <div key={index}>
                                    <span>
                                        {activeFriend?.fullName + " "}
                                        {debt.debtAmount > 0 ? 'owes you' : 'lent you'}
                                    </span>
                                        <span className={`${debt.debtAmount > 0
                                            ? 'text-green-600'
                                            : 'text-orange-500'
                                        }`}>
                                        {" " + debt.group.defaultCurrency}{currencies[debt.group.defaultCurrency]}
                                            {debt.debtAmount.toFixed(2)}{" in " + debt.group.groupName}
                                    </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                    <div className="px-2">
                        <Button
                            type="primary"
                            danger
                            icon={<DeleteOutlined />}
                            loading={isDeleting}
                            onClick={handleDelete}
                            className="flex items-center justify-center w-full text-lg"
                        >
                            Delete friend
                        </Button>
                    </div>

                    <div className="mt-10  px-2">
                        <div className="text-black font-semibold px-4">Shared groups</div>
                        {activeFriend?.netDebts.map((debt, index) => (
                            <div
                                className="flex items-center justify-between px-4 pt-3 transition active:scale-95"
                                key={index}
                                onClick={() => {
                                    setActiveGroup(debt.group.groupId);
                                    navigate('/groups/detail');
                                }}
                            >

                                <div>
                                    <Avatar shape="square" src={groupType[debt.group.type]} className="w-12 h-12"/>
                                </div>

                                <div className="flex-1 mx-4">
                                    <div className=" text-lg leading-none">{debt.group.groupName}</div>
                                </div>

                            </div>
                        ))}

                    </div>
                </div>

            </div>


        </motion.div>
    )
}