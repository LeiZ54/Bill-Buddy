import { motion } from 'framer-motion';
import Topbar from '../components/TopBar';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Form, Input, Avatar, Checkbox, Button, DatePicker, message, Select, Spin, InputNumber, Space } from 'antd';
import useAuthStore from '../stores/authStore';
import { useExpenseStore } from '../stores/expenseStore';
import ExpenseSplitSection from '../components/ExpenseSplitSection';
import api from '../util/axiosConfig';
import { useGroupDetailStore } from '../stores/groupDetailStore';
import dayjs from 'dayjs';
import Alert from 'antd/es/alert/Alert';

const AddPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { groupType, expenseTypes } = useAuthStore();
    const { groupList, fetchAllGroups } = useExpenseStore();
    const { groupData } = useGroupDetailStore();
    const [hideMask, setHideMask] = useState(false);
    const [form] = Form.useForm();
    const { id, currencies } = useAuthStore();
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    const [step, setStep] = useState(1);
    const [isStep1Valid, setIsStep1Valid] = useState(false);
    const [isStep2Valid, setIsStep2Valid] = useState(false);

    const [selectedGroup, setSelectedGroup] = useState<number>();
    const [currency, setCurrency] = useState("USD");

    const [splitMethod, setSplitMethod] = useState<'equally' | 'unequally'>('equally');
    const [amount, setAmount] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
    const [amountsByMember, setAmountsByMember] = useState<Record<number, string>>({});

    const recurrenceOptions = [
        { label: 'Every Day', value: 'DAY-1' },
        { label: 'Every Week', value: 'WEEK-1' },
        { label: 'Every Month', value: 'MONTH-1' },
        { label: 'Every Season', value: 'MONTH-3' },
        { label: 'Half Year', value: 'MONTH-6' },
        { label: 'Every Year', value: 'YEAR-1' },
        { label: 'Custom', value: 'CUSTOM' }
    ];

    const unitOptions = [
        { label: 'Day', value: 'DAY' },
        { label: 'Week', value: 'WEEK' },
        { label: 'Month', value: 'MONTH' },
        { label: 'Year', value: 'YEAR' },
    ];

    const [selectedRecurrence, setSelectedRecurrence] = useState<string>('DAY-1');
    const [customInterval, setCustomInterval] = useState<number>(1);
    const [customUnit, setCustomUnit] = useState<string>('DAY');
    const isRecurring = Form.useWatch('isRecurring', form);


    useEffect(() => {
        if (isRecurring && selectedRecurrence !== 'CUSTOM') {
            const [unit, interval] = selectedRecurrence.split('-');
            form.setFieldsValue({
                recurrenceUnit: unit,
                recurrenceInterval: parseInt(interval),
            });
        }
    }, [isRecurring, selectedRecurrence]);


    const handleSubmit = async () => {
        try {
            const allValues = form.getFieldsValue(true);
            let participants: number[] = [];
            let shares: number[] = [];

            if (splitMethod === 'unequally') {
                const entries = Object.entries(amountsByMember)
                    .map(([key, val]) => [Number(key), parseFloat(val)] as [number, number]);
                participants = entries.map(([id]) => id);
                shares = entries.map(([, amount]) => amount);
            } else {
                participants = selectedMembers;
            }
            const payload = {
                groupId: allValues.groupId,
                payerId: id,
                title: allValues.title,
                amount: parseFloat(amount),
                currency: allValues.currency,
                description: allValues.description,
                expenseDate: allValues.date.toISOString(),
                participants: splitMethod === 'unequally'
                    ? participants : selectedMembers,
                shares: splitMethod === 'unequally'
                    ? shares : [],
                type: allValues.type,
                isRecurring: allValues.isRecurring,
                recurrenceUnit: allValues.isRecurring
                    ? allValues.recurrenceUnit : null,
                recurrenceInterval: allValues.isRecurring
                    ? allValues.recurrenceInterval : null,
            };
            setSubmitting(true);
            await api.post('/expenses', payload);
            setSubmitting(false);
            message.success("Add expense successfully!")
            navigate('/groups');
        } catch (err) {
        } finally {
            setSubmitting(false);
        }

    };

    const onNext = async () => {
        try {
            await form.validateFields([
                'groupId',
                'type',
                'date',
                'title',
                'description',
                'isRecurring',
                'currency',
            ]);
            setStep(2);
        } catch (err) {

        }
    };
    const values = Form.useWatch([], form);
    useEffect(() => {
        form.validateFields([
            'groupId',
            'type',
            'date',
            'title',
            'description',
            'isRecurring',
            'currency',
        ], { validateOnly: true }).then(
            () => {
                setIsStep1Valid(true)
            },
            () => setIsStep1Valid(false)
        );

    }, [form, values]);

    useEffect(() => {
        if (location.state?.ifInGroup) {
            setSelectedGroup(groupData?.id);
            form.setFieldsValue({ groupId: groupData?.id, currency: groupData?.currency });
            setCurrency(groupData?.currency || "USD");
        }
        form.setFieldsValue({
            type: 'OTHER',
            date: dayjs(),
        });
        const fetchData = async () => {
            try {
                setLoading(true);
                await fetchAllGroups();
            } catch (error) {
                setError("Something Wrong!");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="relative w-full h-full min-h-screen overflow-hidden bg-white">
            {!hideMask && (
                <motion.div
                    initial={{
                        clipPath: 'circle(0% at 50% 100%)',
                        backgroundColor: '#3B82F6'
                    }}
                    animate={{
                        clipPath: 'circle(150% at 50% 100%)',
                        backgroundColor: '#3B82F6'
                    }}

                    onAnimationComplete={() => setHideMask(true)}
                    className="absolute inset-0 z-10"
                />
            )}

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="relative z-20"
            >
                <Topbar
                    leftType="back"
                    leftOnClick={() => (step === 2 ? setStep(1) : navigate(-1))}
                    title="Add an expense"
                />

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Spin size="large" />
                    </div>
                ) : error ? (
                    <Alert
                        message="Error"
                        description={error}
                        type="error"
                        showIcon
                        className="max-w-2xl mx-auto my-4"
                    />
                ) : (
                    <Form form={form} className="p-4 max-w-2xl mx-auto" layout="vertical">
                        {step === 1 && (
                            <>
                                {/* Group */}
                                <Form.Item
                                    label="Group"
                                    name="groupId"
                                    rules={[{ required: true, message: 'Please select a group!' }]}
                                >
                                    <Select
                                        placeholder="Select a group"
                                        optionLabelProp="label"
                                        onChange={(value) => setSelectedGroup(value)}
                                    >
                                        {groupList.map((group) => (
                                            <Select.Option
                                                key={group.groupId}
                                                value={group.groupId}
                                                label={group.groupName}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Avatar
                                                        src={groupType[group.type]}
                                                        size={20}
                                                        className="flex-shrink-0"
                                                    />
                                                    <span>{group.groupName}</span>
                                                </div>
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>


                                {/* Expense Type */}
                                <Form.Item
                                    label="Expense Type"
                                    name="type"
                                    rules={[{ required: true, message: 'Please select a type!' }]}
                                >
                                    <Select
                                        placeholder="Select a type"
                                        optionLabelProp="label"
                                    >
                                        {Object.entries(expenseTypes).map(([type, url]) => (
                                            <Select.Option key={type} value={type} label={type}>
                                                <div className="flex items-center gap-2">
                                                    <Avatar src={url as string} size={20} />
                                                    <span>{type}</span>
                                                </div>
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                {/* Date */}
                                <Form.Item
                                    label="Date"
                                    name="date"
                                    rules={[{ required: true, message: 'Please select a date!' }]}
                                >
                                    <DatePicker className="w-full" />
                                </Form.Item>

                                {/* Currency */}
                                <Form.Item
                                    label="Currency"
                                    name="currency"
                                    rules={[{ required: true, message: 'Please select a currency!' }]}
                                >
                                    <Select placeholder="Select a currency"
                                        onChange={(value) => {
                                            setCurrency(value);
                                        }}
                                    >
                                        {Object.entries(currencies).map(([code, symbol]) => (
                                            <Select.Option key={code} value={code}>
                                                {code} ({symbol})
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                {/* Title */}
                                <Form.Item
                                    label="Title"
                                    name="title"
                                    rules={[{ required: true, message: 'Please input title!' }]}
                                >
                                    <Input />
                                </Form.Item>

                                {/* Description */}
                                <Form.Item label="Description" name="description">
                                    <Input.TextArea rows={3} placeholder="Add description (optional)" />
                                </Form.Item>

                                {/* Recurring */}
                                <Form.Item name="isRecurring" valuePropName="checked">
                                    <Checkbox>This is a recurring expense</Checkbox>
                                </Form.Item>

                                {form.getFieldValue('isRecurring') && (
                                    <>
                                        <Form.Item label="Recurrence Time" required>
                                            <Select
                                                value={selectedRecurrence}
                                                onChange={(val) => setSelectedRecurrence(val)}
                                                placeholder="Select recurrence"
                                            >
                                                {recurrenceOptions.map((opt) => (
                                                    <Select.Option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>

                                        {selectedRecurrence === 'CUSTOM' && (
                                            <Space direction="vertical" className="w-full">
                                                <Form.Item
                                                    name="recurrenceInterval"
                                                    label="Custom Interval"
                                                    rules={[{ required: true, message: 'Please input interval!' }]}
                                                >
                                                    <InputNumber
                                                        min={1}
                                                        value={customInterval}
                                                        onChange={(val) => setCustomInterval(val ?? 1)}
                                                        className="w-full"
                                                    />
                                                </Form.Item>
                                                <Form.Item
                                                    name="recurrenceUnit"
                                                    label="Custom Unit"
                                                    rules={[{ required: true, message: 'Please select unit!' }]}
                                                >
                                                    <Select
                                                        value={customUnit}
                                                        onChange={setCustomUnit}
                                                        options={unitOptions}
                                                        className="w-full"
                                                    />
                                                </Form.Item>
                                            </Space>
                                        )}
                                    </>
                                )}


                                {/* Next */}
                                <Form.Item>
                                    <Button type="primary" block onClick={onNext} disabled={!isStep1Valid}>
                                        Next
                                    </Button>
                                </Form.Item>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <ExpenseSplitSection
                                    setIsStep2Valid={setIsStep2Valid}
                                    selectedGroup={selectedGroup!}
                                    splitMethod={splitMethod}
                                    setSplitMethod={setSplitMethod}
                                    amount={amount}
                                    setAmount={setAmount}
                                    selectedMembers={selectedMembers}
                                    setSelectedMembers={setSelectedMembers}
                                    amountsByMember={amountsByMember}
                                    setAmountsByMember={setAmountsByMember}
                                    currency={currency}
                                />
                                {/* Submit */}
                                <Form.Item className="mt-6">
                                    <Button
                                        type="primary"
                                        block
                                        loading={submitting}
                                        disabled={!isStep2Valid}
                                        onClick={handleSubmit}
                                    >
                                        Submit
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form>
                )}
            </motion.div>
        </div>
    );
};

export default AddPage;
