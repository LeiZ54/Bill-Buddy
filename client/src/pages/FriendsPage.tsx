import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFriendStore } from '../stores/friendStore';
import Topbar from '../components/TopBar';
import { Alert, Avatar, Spin } from 'antd';
import useAuthStore from "../stores/authStore.ts";
import { FriendData } from '../util/util.tsx';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
const FriendsPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const { fetchFriends, isLoadingMore, loadMoreFriends, hasMore, friends, setActiveFriend, clearData, filters, setFilters } = useFriendStore();
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
        }, 300);
    }, [fetchFriends]);

    //touch bottome to load more data;

    const isLoadingRef = useRef(false);
    const hasMoreRef = useRef(true);
    const loadMoreRef = useRef(() => { });

    useEffect(() => {
        isLoadingRef.current = isLoadingMore;
        hasMoreRef.current = hasMore;
        loadMoreRef.current = loadMoreFriends;
    }, [isLoadingMore, hasMore, loadMoreFriends]);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const clientHeight = window.innerHeight;
            const scrollHeight = document.documentElement.scrollHeight;
            const isBottom = scrollTop + clientHeight >= scrollHeight - 10;

            if (isBottom && !isLoadingRef.current && hasMoreRef.current) {
                loadMoreRef.current();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []); 

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
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
                        {error && (
                            <Alert message="Failed to get data!" type="error" className="mb-4" />
                        )}

                        <div className="mb-16 bg-white mt-4">
                            {friends.length === 0 ? (
                                <div className="text-center text-gray-500 py-10 text-lg">
                                    You do not have any friend.
                                </div>
                            ) : (
                                friends.map((person: FriendData) => (
                                    <div
                                        key={person.fullName}
                                        className="px-6 py-4 transition active:scale-95"
                                        onClick={() => {
                                            navigate("detail");
                                            setActiveFriend(person);
                                        }}
                                    >
                                        <div className="flex items-start space-x-4">
                                            <Avatar src={person.avatar} size={40} />

                                            <div className="flex flex-col items-start">
                                                <div className="flex items-end space-x-3">
                                                    <div className="text-2xl font-semibold">
                                                        {person.fullName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{person.email}</div>
                                                </div>

                                                {person.netDebts && person.netDebts.length > 0 && (
                                                    <div className="mt-2 flex flex-col ">
                                                        {person.netDebts
                                                            .filter((debt) => debt.debtAmount !== 0)
                                                            .map((debt, index) => (
                                                                <div
                                                                    key={index}
                                                                    className={`text-sm ${debt.debtAmount > 0
                                                                        ? "text-green-600"
                                                                        : "text-orange-500"
                                                                        }`}
                                                                >
                                                                    {debt.debtAmount > 0 ? "owes you" : "lent you"}{" "}
                                                                    <b>{currencies[debt.group.defaultCurrency]}
                                                                    {Math.abs(debt.debtAmount).toFixed(2)}</b>
                                                                    {" in group "}
                                                                    <b>"{debt.group.groupName}"</b>
                                                                </div>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </>



        </motion.div>

    );

}
export default FriendsPage;