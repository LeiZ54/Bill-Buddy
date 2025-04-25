import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useFriendStore } from '../stores/friendStore';
import Topbar from '../components/TopBar';
import { Alert, Spin } from 'antd';
const FriendsPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const {fetchFriends, isLoadingMore, loadMoreFriends, hasMore, friends } = useFriendStore();
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                await fetchFriends();
            } catch (err) {
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
        console.log(friends);
    }, []);

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
                leftType="back"
                leftOnClick={() => {

                }}
                rightOnClick={() => {

                }}
                className="bg-transparent shadow-none"
            />

            <>
                {isLoading ? (
                    <Spin/>
                ) : (
                    <>
                        {friends ? <div></div> : <Alert message={"Failed to get data!"} type="error" className="mb-4"/>}
                    </>
                )}
            </>
            <div className="mb-40 bg-white">
                {friends.map((person) => (
                    <div key={person.fullName} className="border-b px-4">
                        <div className="flex space-x-4 py-2">
                            {/* <Avatar src={} /> */}
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <div className="text-2xl font-semibold">{person.fullName}</div>
                                    <div className="text-right leading-tight">
                                        {person.debtsWithCurrentUser >= 0 ? (
                                            <>
                                                <div className="text-green-600 text-sm">You lent</div>
                                                <div className="text-[#FFA700] font-bold text-lg">
                                                    USD{person.debtsWithCurrentUser.toFixed(2)}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-orange-600 text-sm">You owe</div>
                                                <div className="text-[#FFA700] font-bold text-lg">
                                                    USD{Math.abs(person.debtsWithCurrentUser).toFixed(2)}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

            </div>


        </motion.div>

    );

}
export default FriendsPage;