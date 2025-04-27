import { useState, useEffect } from 'react';
import { Modal, Spin, Alert, Button, message, Avatar } from 'antd';
import { jwtDecode } from 'jwt-decode';
import { useGroupStore } from '../stores/groupStore';
import api from '../util/axiosConfig';
import useAuthStore from '../stores/authStore';

interface InvitationModalProps {
    visible: boolean;
    onCancel: () => void;
}

interface InvitationData {
    groupType: string;
    groupName: string;
}

const AcceptInvitationModal = ({ visible, onCancel }: InvitationModalProps) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [type, setType] = useState("other");
    const [groupName, setGroupName] = useState("");
    const [accepting, setAccepting] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);

    const { inviteToken, fetchGroups } = useGroupStore();
    const { groupType } = useAuthStore();

    useEffect(() => {
        const checkInvitation = async () => {
            try {
                setLoading(true);
                const response = await api.get(`groups/invitations/check?token=${inviteToken}`);
                const decoded = jwtDecode<InvitationData>(inviteToken || '');
                setHasJoined(response.data.joined);
                setGroupName(decoded.groupName);
                setType(decoded.groupType || 'other');
            } catch (err: any) {
                setError(err?.response?.data?.error || "Network Error!");
            } finally {
                setLoading(false);
            }
        };

        if (visible) {
            checkInvitation();
        }
    }, [visible]);

    const handleAccept = async () => {
        try {
            setAccepting(true);
            await api.post(`groups/invitations/accept?token=${inviteToken}`);
            message.success('Joined group successfully!');
            fetchGroups();
            onCancel();
        } catch (err: any) {
            message.error(err?.response?.data?.error || "Network Error!");
        } finally {
            setAccepting(false);
        }
    };

    return (
        <Modal
            title="Group Invitation"
            open={visible}
            onCancel={onCancel}
            footer={null}
            closable={!accepting}
            maskClosable={!accepting}
        >
            <div className="p-4">
                {loading ? (
                    <div className="text-center">
                        <Spin />
                    </div>
                ) : error ? (
                    <Alert message={error} type="error" />
                ) : groupName ? (
                    <div className="space-y-4">
                        {hasJoined && (
                            <Alert
                                message="You've already joined this group!"
                                type="warning"
                                showIcon
                                className="mb-4"
                            />
                        )}

                        <div className="flex items-center">
                            <Avatar
                                src={groupType[type]}
                                size={40}
                                className="flex-shrink-0 mr-4"
                            />
                            <div>
                                <h3 className="text-lg font-semibold">{groupName}</h3>
                            </div>
                        </div>
                        {!hasJoined && (<div className="flex justify-end gap-2 mt-6">
                            <Button
                                onClick={onCancel}
                                disabled={accepting}
                            >
                                Decline
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleAccept}
                                loading={accepting}
                            >
                                Accept
                            </Button>
                        </div>)}

                    </div>
                ) : null}
            </div>
        </Modal>
    );
};

export default AcceptInvitationModal;