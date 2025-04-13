import { Modal, Input, Button, message, Spin } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { useState } from 'react';
import api from '../util/axiosConfig';

interface LinkInviteModalProps {
    open: boolean;
    onCancel: () => void;
    groupId: number;
}

const LinkInviteModal = ({ open, onCancel, groupId }: LinkInviteModalProps) => {
    const [inviteLink, setInviteLink] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchInviteLink = async () => {
        try {
            setIsLoading(true);
            const response = await api.get<{ inviteLink: string }>(
                `/groups/${groupId}/invitation-link`
            );
            setInviteLink(response.data.inviteLink);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to get invitation link');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            message.success('Link copied to clipboard!');
        } catch (err) {
            message.error('Failed to copy link');
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <LinkOutlined />
                    <span>Invite via Link</span>
                </div>
            }
            open={open}
            onCancel={onCancel}
            onOk={onCancel}
            footer={null}
            afterOpenChange={(visible) => visible && fetchInviteLink()}
            destroyOnClose
        >
            {isLoading ? (
                <div className="text-center py-4">
                    <Spin />
                </div>
            ) : error ? (
                <div className="text-red-500">{error}</div>
            ) : (
                <div className="flex gap-2">
                    <Input.TextArea
                        value={inviteLink}
                        readOnly
                        autoSize={{minRows:6, maxRows:15}}
                        className="flex-1"
                        placeholder="Generating link..."
                    />
                    <Button
                        type="primary"
                        onClick={handleCopy}
                        disabled={!inviteLink}
                    >
                        Copy
                    </Button>
                </div>
            )}
        </Modal>
    );
};

export default LinkInviteModal;