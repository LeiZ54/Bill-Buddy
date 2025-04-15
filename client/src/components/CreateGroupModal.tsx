import { Form, Modal, Input, Alert, Button, Radio, Grid, message, Select } from 'antd';
import { useState, useEffect } from 'react';
import api from '../util/axiosConfig';
import { useGroupStore } from '../stores/groupStore';
import useAuthStore from '../stores/authStore';

const { useBreakpoint } = Grid;

interface GroupModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    isEdit?: boolean;
}

export default function CreateGroupModal({
    open,
    onCancel,
    onSuccess,
    isEdit = false,
}: GroupModalProps) {
    const [form] = Form.useForm();
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState(null);
    const [formValid, setFormValid] = useState(false);
    const screens = useBreakpoint();
    const { activeGroup, updateGroup } = useGroupStore();
    const { groupType, currencies } = useAuthStore();

    useEffect(() => {
        if (open) {
            if (isEdit) {
                form.setFieldsValue({
                    groupName: activeGroup!.name,
                    groupType: activeGroup!.type
                });
            } else {
                form.resetFields();
            }
            setError(null);
        }
    }, [open, form, isEdit]);


    const values = Form.useWatch([], form);
    useEffect(() => {
        form.validateFields({ validateOnly: true }).then(
            () => setFormValid(true),
            () => setFormValid(false)
        );
    }, [form, values]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setIsCreating(true);
            setError(null);

            if (isEdit) {
                await api.put(`/groups/${activeGroup!.id}`, {
                    newName: values.groupName,
                    newType: values.groupType,
                    defaultCurrency: values.currency
                });
                activeGroup!.name = values.groupName;
                activeGroup!.type = values.groupType;
                activeGroup!.currency = values.currency;
                updateGroup(activeGroup!);
                message.success('Update group successfully!');
            } else {
                await api.post('/groups', {
                    groupName: values.groupName,
                    type: values.groupType,
                    defaultCurrency: values.currency
                });
                message.success('Create group successfully!');
            }
            onSuccess();
            onCancel();
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Network Error!');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Modal
            title={isEdit ? 'Update Group' : 'Create Group'}
            open={open}
            onCancel={onCancel}
            footer={[
                <Button
                    key="submit"
                    type="primary"
                    loading={isCreating}
                    onClick={handleSubmit}
                    disabled={!formValid || isCreating}
                >
                    {isEdit ? 'Update' : 'Create'}
                </Button>
            ]}
        >

            <Form form={form} initialValues={{ groupType: 'other', currency: 'USD' }} autoComplete="off">
                <Form.Item
                    label="Group Type"
                    name="groupType"
                    rules={[{ required: true, message: 'Please select a group type!' }]}
                >
                    <Radio.Group className="w-full">
                        <div className={`grid grid-cols-2 gap-3 ${screens.xs ? '' : 'sm:grid-cols-4'}`}>
                            {Object.entries(groupType).map(([key, url]) => (
                                <Radio.Button
                                    key={key}
                                    value={key}
                                    className="h-full flex flex-col items-center p-4"
                                    style={{
                                        borderWidth: 2,
                                        borderRadius: 8,
                                    }}
                                >
                                    <div className="flex flex-col items-center">
                                        <img
                                            src={url}
                                            alt={key}
                                            className="w-12 h-12 object-contain mb-2"
                                        />
                                        <span className="text-gray-600">{key}</span>
                                    </div>
                                </Radio.Button>
                            ))}
                        </div>
                    </Radio.Group>
                </Form.Item>

                <Form.Item
                    label="Group Name"
                    name="groupName"
                    rules={[{ required: true, message: 'Please input group name!' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Currency"
                    name="currency"
                    rules={[{ required: true, message: 'Please select a currency!' }]}
                >
                    <Select placeholder="Select a currency">
                        {Object.entries(currencies).map(([code, symbol]) => (
                            <Select.Option key={code} value={code}>
                                {code} ({symbol})
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
            {error && <Alert message={error} type="error" className="mb-4" />}
        </Modal>
    );
}