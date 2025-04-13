import { Modal, Form, Input, Button, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useState } from 'react';
import api from '../util/axiosConfig';

interface EmailInviteModalProps {
    open: boolean;
    onCancel: () => void;
    groupId: number;
}

const EmailInviteModal = ({ open, onCancel, groupId }: EmailInviteModalProps) => {
    const [form] = Form.useForm();
    const [isSending, setIsSending] = useState(false);

    const onFinish = async (values: { email: number }) => {
        try {
            setIsSending(true);
            await api.post(`/groups/${groupId}/invite?email=${values.email}`);
            message.success('Invitation sent successfully!');
            form.resetFields();
            onCancel();
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Network Error!');
        } finally {
            setIsSending(false);
        }
    };
    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <MailOutlined />
                    <span>Invite via Email</span>
                </div>
            }
            open={open}
            onCancel={onCancel}
            footer={null}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
            >
                <Form.Item
                    label="Email address"
                    name="email"
                    rules={[
                        { required: true, message: 'Please input email address' },
                        { type: 'email', message: 'Please enter a valid email address' }
                    ]}
                    validateFirst
                >
                    <Input/>
                </Form.Item>

                <div className="flex justify-end gap-2">
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isSending}
                        disabled={isSending}
                    >
                        Send Invite
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default EmailInviteModal;