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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
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
                    <Spin />
                ) : (
                    <>
                        {friends ? <div></div> : <Alert message={"Failed to get data!"} type="error" className="mb-4" />}
                    </>
                )}
            </>
        </motion.div>
    );

}
export default FriendsPage;