import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useFriendStore } from '../stores/friendStore';
import Topbar from '../components/TopBar';
import {Alert, Avatar, Spin} from 'antd';
import useAuthStore from "../stores/authStore.ts";
import { FriendData } from '../util/util.tsx';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
const FriendsPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const {fetchFriends, isLoadingMore, loadMoreFriends, hasMore, friends, setActiveFriend, clearData, filters, setFilters } = useFriendStore();
    const { currencies } = useAuthStore();
    const [error, setError] = useState("");

    useEffect(() => {
        setFilters("");
        return () => {
            clearData();
        }
    }, [])
    useEffect(() => {
        debouncedFetchFriends();
        return () => {
            debouncedFetchFriends.cancel();
        };
    }, [filters]);


    const debouncedFetchFriends = useMemo(() => {
        return debounce(async () => {
            try {
                setError("")
                clearData();
                setIsLoading(true);
                await fetchFriends();
            } catch (err) {
                setError("Failed to get data!");
            } finally {
                setIsLoading(false);
            }
        }, 500);
    }, [fetchFriends]);

    //touch bottome to load more data;
    useEffect(() => {
        const scrollContainer = document.querySelector('.ant-layout-content');
        const handleScroll = () => {
            if (!scrollContainer) return;
            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            if (scrollTop + clientHeight == scrollHeight && !isLoadingMore && hasMore) {
                loadMoreFriends();
            }
        };
        scrollContainer?.addEventListener('scroll', handleScroll);
        return () => scrollContainer?.removeEventListener('scroll', handleScroll);
    }, [isLoadingMore, loadMoreFriends]);

    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.3, delay: 0.2}}
        >
            <Topbar
                leftType="search"
                searchFunction={(value) => {
                    setFilters(value);
                }}
            />

            <>
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Spin size="large" />
                    </div>
                ) : (
                    <>
                        {error && <Alert message={"Failed to get data!"} type="error" className="mb-4"/>}
                    </>
                )}
            </>
            <div className="mb-40 bg-white mt-2">
                {friends.map((person: FriendData) => (
                    <div key={person.fullName} className="border-b px-6 py-4"
                        onClick={() => {
                            navigate("detail");
                            setActiveFriend(person);
                        }}>
                        <div className="flex items-start space-x-4">
                            <Avatar src={person.avatar} size={40}/>

                            <div className="flex flex-col items-start">
                                <div className="text-2xl font-semibold">{person.fullName}</div>

                                {person.netDebts && person.netDebts.length > 0 && (
                                    <div className="mt-2 flex flex-col ">
                                        {person.netDebts
                                            .filter(debt => debt.debtAmount !== 0)
                                            .map((debt, index) => (
                                                <div
                                                    key={index}
                                                    className={`text-sm ${debt.debtAmount > 0 ? 'text-green-600' : 'text-orange-500'}`}
                                                >
                                                    {person.fullName} {debt.debtAmount > 0 ? 'owes you' : 'lent you'}{' '}
                                                    {debt.group.defaultCurrency}{currencies[debt.group.defaultCurrency]}
                                                    {Math.abs(debt.debtAmount).toFixed(2)} in {debt.group.groupName}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>


        </motion.div>

    );

}
export default FriendsPage;