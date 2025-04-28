import { Modal, List, Avatar, Checkbox, Button, message } from "antd";
import { useState } from "react";
import { useGroupDetailStore } from "../stores/groupDetailStore";

type AddFriendsToGroupModalProps = {
    open: boolean;
    onCancel: () => void;
    isGroup: boolean;
};

export const AddFriendsToGroupModal = ({ open, onCancel, isGroup }: AddFriendsToGroupModalProps) => {
    const { friendList, addFrinedToGroup, fetchMember } = useGroupDetailStore();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const toggleSelection = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleInvite = async() => {
        try {
            setIsLoading(true);
            await addFrinedToGroup(selectedIds);
            await fetchMember();
            onCancel();
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Network Error!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            title={isGroup ? "Select Groups" : "Select Friends"}
        >
            <List
                dataSource={friendList}
                renderItem={(friend: any) => {
                    const checked = selectedIds.includes(friend.id);

                    return (

                        <List.Item
                            actions={
                                !friend.inGroup
                                    ? [
                                        <Checkbox
                                            checked={checked}
                                            onChange={() => toggleSelection(friend.id)}
                                        />,
                                    ]
                                    : []
                            }
                        >
                            <List.Item.Meta
                                avatar={<Avatar src={friend.avatar} />}
                                title={friend.fullName}
                                description={friend.email}
                            />
                            {friend.inGroup && (
                                <span className="text-gray-500 ml-1">
                                    Already in the group
                                </span>
                            )}
                        </List.Item>
                    );
                }}
            />
            <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Button type="primary" onClick={handleInvite} disabled={selectedIds.length === 0 || isLoading} loading={isLoading}>
                    Invite
                </Button>
            </div>
        </Modal>
    );
};

export default AddFriendsToGroupModal;
