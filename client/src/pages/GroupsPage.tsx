import { Spin, Alert } from 'antd';
import Topbar from '../components/TopBar';
import { useGroupStore } from '../stores/groupStore';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import GroupSection from '../components/GroupSection';
import CreateGroupModal from '../components/CreateGroupModal';
import AcceptInvitationModal from '../components/AcceptInvitationModal';
import { debounce } from 'lodash';

export default function GroupsPage() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showInvitationModal, setShowInvitationModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const {
        groups,
        isLoadingMore,
        hasMore,
        fetchGroups,
        loadMoreGroups,
        inviteToken,
        setInviteToken,
        filters,
        setFilters,
        clearData
    } = useGroupStore();
    useEffect(() => {
        setFilters("");
        return () => {
            clearData();
        }
    }, [])
    useEffect(() => {
        if (inviteToken != null) {
            setShowInvitationModal(true);
        }
        debouncedFetchGroups();
        return () => {
            debouncedFetchGroups.cancel();
        };
    }, [filters, inviteToken]);

    const debouncedFetchGroups = useMemo(() => {
        return debounce(async () => {
            try {
                setError("")
                setIsLoading(true); 
                clearData();
                await fetchGroups();
            } catch (err) {
                setError("Failed to get data!");
            } finally {
                setIsLoading(false);
            }
        }, 300);
    }, [fetchGroups]);

    //touch bottome to load more data;

    const isLoadingRef = useRef(false);
    const hasMoreRef = useRef(true);
    const loadMoreRef = useRef(() => { });

    useEffect(() => {
        isLoadingRef.current = isLoadingMore;
        hasMoreRef.current = hasMore;
        loadMoreRef.current = loadMoreGroups;
    }, [isLoadingMore, hasMore, loadMoreGroups]);

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
                rightText="Create"
                rightOnClick={() => setShowCreateModal(true)}
            />
            <>
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Spin size="large" />
                    </div>
                ) : (
                    <>
                        {error ? (
                            <Alert message={error} type="error" className="mb-4" />
                        ) : (
                            <div className="pt-4 mb-16">
                                {groups.length === 0 ? (
                                    <div className="text-center text-gray-500 py-10 text-lg">
                                        There is no groups.
                                    </div>
                                ) : (
                                    groups.map(group => (
                                        <GroupSection key={group.id} {...group} />
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </>


            <CreateGroupModal
                open={showCreateModal}
                onCancel={() => setShowCreateModal(false)}
                onSuccess={fetchGroups}
            />

            <AcceptInvitationModal
                visible={showInvitationModal}
                onCancel={() => {
                    setInviteToken(null);
                    setShowInvitationModal(false);
                }}
            />

        </motion.div >
    );
}