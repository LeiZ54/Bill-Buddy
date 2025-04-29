import { Modal, List, Avatar, Checkbox, Button, message } from "antd";
import { useState } from "react";
import { useGroupDetailStore } from "../stores/groupDetailStore";
import { useFriendStore } from "../stores/friendStore";
import Radio from "antd/es/radio/radio";
import useAuthStore from "../stores/authStore";

type AddFriendsToGroupModalProps = {
    open: boolean;
    onCancel: () => void;
    isGroup: boolean;
};

export const AddFriendsToGroupModal = ({ open, onCancel, isGroup }: AddFriendsToGroupModalProps) => {
    const { friendList, addFriendsToGroup, fetchMember } = useGroupDetailStore();
    const { groupType } = useAuthStore();
    const { groupList, addFriendToGroup, getFriendData} = useFriendStore();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const toggleSelection = (id: number) => {
        if (isGroup) {
            setSelectedIds([id]);
        } else {
            setSelectedIds((prev) =>
                prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
            );
        }
    };
    const handleInvite = async () => {
        try {
            setIsLoading(true);

            if (isGroup) {
                await addFriendToGroup(selectedIds[0]);
                await getFriendData();
            } else {
                await addFriendsToGroup(selectedIds);
                await fetchMember();
            }
            onCancel();
        } catch (err: any) {
            console.log(err);
            message.error(err.response?.data?.message || "Network Error!");
        } finally {
            setIsLoading(false);
        }
    };
    const dataSource = isGroup ? groupList : friendList;

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            title={isGroup ? "Select Group" : "Select Friends"}
        >
            <List
                dataSource={dataSource}
                renderItem={(item: any) => {
                    const isChecked = selectedIds.includes(isGroup ? item.groupId : item.id);

                    return (
                        <List.Item
                            actions={[
                                isGroup ? (
                                    !item.inGroup && (
                                        <Radio
                                            checked={isChecked}
                                            onChange={() => toggleSelection(item.groupId)}
                                        />
                                    )
                                ) : (
                                    !item.inGroup && (
                                        <Checkbox
                                            checked={isChecked}
                                            onChange={() => toggleSelection(item.id)}
                                        />
                                    )
                                ),
                            ]}
                        >

                            {isGroup ?
                                (
                                    <List.Item.Meta
                                        avatar={<Avatar src={groupType[item.type]} />}
                                        title={item.groupName}
                                    />
                                ) : (
                                    <List.Item.Meta
                                        avatar={<Avatar src={item.avatar} />}
                                        title={item.fullName}
                                        description={item.email}
                                    />
                                )}
                            {item.inGroup && (
                                <span className="text-gray-500 ml-1">
                                    Already in the group
                                </span>
                            )}
                        </List.Item>
                    );
                }}
            />

            <div style={{ textAlign: "right", marginTop: 16 }}>
                <Button
                    type="primary"
                    onClick={handleInvite}
                    disabled={selectedIds.length === 0 || isLoading}
                    loading={isLoading}
                >
                    Invite
                </Button>
            </div>
        </Modal>
    );
};

export default AddFriendsToGroupModal;
