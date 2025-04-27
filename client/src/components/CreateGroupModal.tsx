import { Form, Modal, Input, Button, Radio, Grid, message, Select } from 'antd';
import { useState, useEffect } from 'react';
import { useGroupStore } from '../stores/groupStore';
import useAuthStore from '../stores/authStore';
import { useGroupDetailStore } from '../stores/groupDetailStore';

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
    const [isLoading, setIsLoading] = useState(false);
    const [formValid, setFormValid] = useState(false);
    const screens = useBreakpoint();
    const { creatGroup } = useGroupStore();
    const { groupType, currencies } = useAuthStore();
    const { groupData, editGroup } = useGroupDetailStore();

    useEffect(() => {
        if (open) {
            if (isEdit) {
                form.setFieldsValue({
                    groupName: groupData!.name,
                    groupType: groupData!.type,
                    currencies: groupData!.currency
                });
            } else {
                form.resetFields();
            }
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
            setIsLoading(true);

            if (isEdit) {
                await editGroup(values.groupName, values.groupType, values.currency)
            } else {
                await creatGroup(values.groupName, values.groupType, values.currency);
            }
            onSuccess();
            onCancel();
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Network Error!');
        } finally {
            setIsLoading(false);
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
                    loading={isLoading}
                    onClick={handleSubmit}
                    disabled={!formValid || isLoading}
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
        </Modal>
    );
}