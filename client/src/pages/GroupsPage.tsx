import { Spin, Alert, Button } from 'antd';
import Topbar from '../components/TopBar';
import { useGroupStore } from '../stores/groupStore';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GroupSection from '../components/GroupSection';
import CreateGroupModal from '../components/CreateGroupModal';
import AcceptInvitationModal from '../components/AcceptInvitationModal';

export default function GroupsPage() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showInvitationModal, setShowInvitationModal] = useState(false);
    const {
        groups,
        isLoading,
        isLoadingMore,
        error,
        hasMore,
        fetchGroups,
        loadMoreGroups,
        clearActiveGroup,
        resetError,
        inviteToken,
        setInviteToken
    } = useGroupStore();

    useEffect(() => {
        clearActiveGroup();
        resetError();
        fetchGroups();
        if (inviteToken != null) {
            setShowInvitationModal(true);
        }
    }, [fetchGroups]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
        >
            <Topbar
                leftType="search"
                rightText="Create group"
                rightOnClick={() => setShowCreateModal(true)}
            />
            {groups.map(group => (
                <GroupSection key={group.id} {...group} />
            ))}
            {error && <Alert message={error} type="error" className="mb-4" />}

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


            {isLoading && <Spin />}

        </motion.div >
    );
}