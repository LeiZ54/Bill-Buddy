import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivityStore } from '../stores/activityStore';
import { Alert, Avatar, Spin, message } from 'antd';
import { useGroupDetailStore } from '../stores/groupDetailStore';
import { useExpenseStore } from '../stores/expenseStore';

const ActivityPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const { setActiveGroup } = useGroupDetailStore();
    const { setActiveExpense } = useExpenseStore();
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
    }, []);

    //touch bottome to load more data;

    const isLoadingRef = useRef(false);
    const hasMoreRef = useRef(true);
    const loadMoreRef = useRef(() => { });

    useEffect(() => {
        isLoadingRef.current = isLoadingMore;
        hasMoreRef.current = hasMore;
        loadMoreRef.current = loadMoreActivities;
    }, [isLoadingMore, hasMore, loadMoreActivities]);

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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
        >
            <div className="text-2xl p-4">
                Recent Activities
            </div>
            <>
                {isLoading ? (
                    <div className="flex justify-center p-4 py-10">
                        <Spin size="large" />
                    </div>
                ) : (
                    <>
                        {error ? (
                            <Alert message="Failed to get data!" type="error" className="mb-4" />
                        ) : activities.length === 0 ? (
                            <div className="text-center text-gray-500 py-10 text-lg">
                                There is no activities.
                            </div>
                        ) : (
                            <div className="flex flex-col bg-white mb-16">
                                {activities.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex flex-col p-4 bg-white rounded transition active:scale-95"
                                        onClick={() => {
                                            if (activity.accessible) {
                                                if (activity.objectType === "GROUP") {
                                                    setActiveGroup(activity.objectId);
                                                    navigate("/groups/detail");
                                                } else {
                                                    setActiveExpense(activity.objectId);
                                                    navigate("/groups/expense");
                                                }
                                            } else {
                                                message.error("This item has been deleted!");
                                            }
                                        }}
                                    >
                                        <div className="flex space-x-4 items-start">
                                            <div className="relative flex-shrink-0">
                                                <img
                                                    src={activity.objectPicture}
                                                    alt="background"
                                                    className="w-14 h-14 rounded-2xl"
                                                />
                                                <Avatar
                                                    src={activity.userAvatar}
                                                    alt="avatar"
                                                    className="w-8 h-8 rounded-full absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 border-2 border-white"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div
                                                    className="text-gray-800 text-sm"
                                                    dangerouslySetInnerHTML={{
                                                        __html: activity.descriptionHtml,
                                                    }}
                                                />
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {new Date(activity.createdAt).toLocaleDateString(undefined, {
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        year: 'numeric',
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </>




        </motion.div>

    );

}

export default ActivityPage;