import { motion } from 'framer-motion';
import Topbar from '../components/TopBar';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Form, Input, Tag, Avatar, Checkbox, Button, DatePicker, message, Select } from 'antd';
import useAuthStore from '../stores/authStore';
import { ExpenseTypeSelectorModal, GroupSelectorModal, RecurrenceTimeSelectorModal } from '../components/AddModal';
import { easyGroup } from '../util/util';
import { useExpenseStore } from '../stores/expenseStore';
import ExpenseSplitSection from '../components/ExpenseSplitSection';
import api from '../util/axiosConfig';
import { useGroupDetailStore } from '../stores/groupDetailStore';


const AddPage = () => {
    const navigate = useNavigate();
    const { groupType } = useAuthStore();
    const { getRecurrenceLabel } = useExpenseStore();
    const { setActiveGroup } = useGroupDetailStore();
    const [hideMask, setHideMask] = useState(false);
    const [form] = Form.useForm();
    const { id, currencies } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const [step, setStep] = useState(1);
    const [isStep1Valid, setIsStep1Valid] = useState(false);
    const [isStep2Valid, setIsStep2Valid] = useState(false);

    const [selectedGroup, setSelectedGroup] = useState<easyGroup>();
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

    const [selectedType, setSelectedType] = useState<string>("");
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

    const [recurrenceTime, setRecurrenceTime] = useState<{
        recurrenceUnit: string;
        recurrenceInterval: number;
    } | null>(null);
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);

    const [splitMethod, setSplitMethod] = useState<'equally' | 'unequally'>('equally');
    const [amount, setAmount] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
    const [amountsByMember, setAmountsByMember] = useState<Record<number, string>>({});

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
                groupId: selectedGroup!.groupId,
                payerId: id,
                title: allValues.title,
                amount: parseFloat(amount),
                currency: allValues.currency,
                description: allValues.description,
                expenseDate: allValues.date.toISOString(),
                participants: splitMethod === 'unequally'
                    ? participants : selectedMembers ,
                shares: splitMethod === 'unequally'
                    ? shares : [],
                type: allValues.type,
                isRecurring: allValues.isRecurring,
                recurrenceUnit: allValues.isRecurring
                    ? allValues.recurrenceTime.recurrenceUnit : null,
                recurrenceInterval: allValues.isRecurring
                    ? allValues.recurrenceTime.recurrenceInterval : null,
            };
            setLoading(true);
            await api.post('/expenses', payload);
            setLoading(false);
            message.success("Add expense successfully!")
            navigate('/groups');
        } catch (err) {
            setLoading(false);
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
                ...(form.getFieldValue('isRecurring') ? ['recurrenceTime'] : []),
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
                ...(form.getFieldValue('isRecurring') ? ['recurrenceTime'] : []),
            ], { validateOnly: true }).then(
                () => {
                    setIsStep1Valid(true)
                },
                () => setIsStep1Valid(false)
            );
      
    }, [form, values]);

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
                <Form form={form} className="p-4 max-w-2xl mx-auto" layout="vertical">
                    {step === 1 && (
                        <>
                            {/* Group */}
                            <Form.Item
                                label="Group"
                                name="groupId"
                                rules={[{ required: true, message: 'Please select a group!' }]}
                            >
                                <div className="flex items-center justify-between">
                                    <Tag
                                        color="blue"
                                        className="cursor-pointer rounded-full px-4 py-1 text-base h-auto  flex items-center justify-center gap-2"
                                        onClick={() => setIsGroupModalOpen(true)}
                                    >
                                        {selectedGroup ? (
                                            <>
                                                <Avatar
                                                    src={groupType[selectedGroup.type]}
                                                    className="flex-shrink-0 mr-2"
                                                    size={20}
                                                />
                                                {selectedGroup.groupName}
                                            </>
                                        ) : (
                                            <span>Please select a group</span>
                                        )}
                                    </Tag>
                                </div>
                            </Form.Item>

                            <GroupSelectorModal
                                open={isGroupModalOpen}
                                onCancel={() => setIsGroupModalOpen(false)}
                                onSelect={(group) => {
                                    setSelectedGroup(group);
                                    form.setFieldsValue({ groupId: group.groupId });
                                    setActiveGroup(group.groupId);
                                    setIsGroupModalOpen(false);
                                }}
                            />

                            {/* Expense Type */}
                            <Form.Item
                                label="Expense Type"
                                name="type"
                                rules={[{ required: true, message: 'Please select a type!' }]}
                            >
                                <div className="flex items-center justify-between">
                                    <Tag
                                        color="blue"
                                        className="cursor-pointer rounded-full px-4 py-1 text-base h-auto"
                                        onClick={() => setIsTypeModalOpen(true)}
                                    >
                                        {selectedType ? selectedType : 'Please select a type'}
                                    </Tag>
                                </div>
                            </Form.Item>

                            <ExpenseTypeSelectorModal
                                open={isTypeModalOpen}
                                onCancel={() => setIsTypeModalOpen(false)}
                                onSelect={(type) => {
                                    setSelectedType(type);
                                    form.setFieldsValue({ type });
                                }}
                            />

                            <Form.Item
                                label="Date"
                                name="date"
                                rules={[{ required: true, message: 'Please select a date!' }]}
                            >
                                <DatePicker className="w-full" />
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

                            <Form.Item shouldUpdate={(prev, curr) => prev.isRecurring !== curr.isRecurring}>
                                {({ getFieldValue }) => {
                                    return getFieldValue('isRecurring') ? (
                                        <Form.Item
                                            name="recurrenceTime"
                                            rules={[{ required: true, message: 'Please input recurrence time!' }]}
                                        >
                                            <Tag
                                                color="blue"
                                                className="cursor-pointer rounded-full px-4 py-1 text-base h-auto"
                                                onClick={() => setIsTimeModalOpen(true)}
                                            >
                                                {recurrenceTime ? (
                                                    <span>{getRecurrenceLabel(recurrenceTime)}</span>
                                                ) : (
                                                    <span>Please select recurrence time</span>
                                                )}
                                            </Tag>
                                        </Form.Item>
                                    ) : null;
                                }}
                            </Form.Item>

                            <RecurrenceTimeSelectorModal
                                open={isTimeModalOpen}
                                onCancel={() => setIsTimeModalOpen(false)}
                                onSelect={(val) => {
                                    setRecurrenceTime(val);
                                    setIsTimeModalOpen(false);
                                    form.setFieldsValue({ recurrenceTime: val });
                                }}
                            />

                            {/* Next */}
                            <Form.Item className="mt-6">
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
                                selectedGroup={selectedGroup}
                                splitMethod={splitMethod}
                                setSplitMethod={setSplitMethod}
                                amount={amount}
                                setAmount={setAmount}
                                selectedMembers={selectedMembers}
                                setSelectedMembers={setSelectedMembers}
                                amountsByMember={amountsByMember}
                                setAmountsByMember={setAmountsByMember}
                            />
                            {/* Submit */}
                            <Form.Item className="mt-6">
                                <Button
                                    type="primary"
                                    block
                                    loading={loading}
                                    disabled={!isStep2Valid}
                                    onClick={handleSubmit}
                                >
                                    Submit
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form>
            </motion.div>
        </div>
    );
};

export default AddPage;
