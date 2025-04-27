import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivityStore } from '../stores/activityStore';
import { Alert, Spin } from 'antd';

const ActivityPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const { activities, clearData, fetchActivities, loadMoreActivities, isLoadingMore, hasMore } = useActivityStore();
    useEffect(() => {
        const fetchData = async () => {
            try {
                clearData();
                setIsLoading(true);
                await fetchActivities();
            } catch (err) {
                setError("Failed to get data!")
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
        console.log(activities);
    }, []);

    //touch bottome to load more data;
    useEffect(() => {
        const scrollContainer = document.querySelector('.ant-layout-content');
        const handleScroll = () => {
            if (!scrollContainer) return;
            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            if (scrollTop + clientHeight == scrollHeight && !isLoadingMore && hasMore) {
                loadMoreActivities();
            }
        };
        scrollContainer?.addEventListener('scroll', handleScroll);
        return () => scrollContainer?.removeEventListener('scroll', handleScroll);
    }, [isLoadingMore, loadMoreActivities]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
        >
        <h1>Recent activity</h1>
            <>
                {isLoading ? (
                    <Spin />
                ) : (
                    <>
                        {error && <Alert message={"Failed to get data!"} type="error" className="mb-4" />}
                    </>
                )}
            </>
            <div className="mb-40 bg-white mt-2">

                {activities.map((activity) => (
                    <div key={activity.id} className="p-4 border rounded shadow-sm bg-white">
                        <div
                            className="text-gray-800 text-sm"
                            dangerouslySetInnerHTML={{
                                __html: (activity.descriptionHtml),
                            }}
                        />
                        <div className="text-xs text-gray-400 mt-1">
                            {new Date(activity.createdAt).toLocaleString()}
                        </div>
                    </div>
                ))}

            </div>


        </motion.div>

    );

}

export default ActivityPage;