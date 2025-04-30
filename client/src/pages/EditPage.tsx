import { motion } from 'framer-motion';
import Topbar from '../components/TopBar';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Form, Input, Avatar, Button, DatePicker, message, Select } from 'antd';
import useAuthStore from '../stores/authStore';
import { useExpenseStore } from '../stores/expenseStore';
import ExpenseSplitSection from '../components/ExpenseSplitSection';
import api from '../util/axiosConfig';
import dayjs from 'dayjs';

const EditPage = () => {
    const navigate = useNavigate();
    const { expenseTypes } = useAuthStore();
    const { activeExpense, expenseData } = useExpenseStore();
    const [hideMask, setHideMask] = useState(false);
    const [form] = Form.useForm();
    const { id, currencies } = useAuthStore();
    const [submitting, setSubmitting] = useState(false);

    const [step, setStep] = useState(1);
    const [isStep1Valid, setIsStep1Valid] = useState(false);
    const [isStep2Valid, setIsStep2Valid] = useState(false);

    const [currency, setCurrency] = useState("USD");
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
            };
            setSubmitting(true);
            await api.put(`/expenses/${activeExpense}`, payload);
            setSubmitting(false);
            message.success("Edit expense successfully!")
            navigate('/groups/expense');
        } catch (err) {
        } finally {
            setSubmitting(false);
        }

    };

    const onNext = async () => {
        try {
            await form.validateFields([
                'type',
                'date',
                'title',
                'description',
                'currency',
            ]);
            setStep(2);
        } catch (err) {

        }
    };
    const values = Form.useWatch([], form);
    useEffect(() => {
        form.validateFields([
            'type',
            'date',
            'title',
            'description',
            'currency',
        ], { validateOnly: true }).then(
            () => {
                setIsStep1Valid(true)
            },
            () => setIsStep1Valid(false)
        );

    }, [form, values]);

    useEffect(() => {
        form.setFieldsValue({
            currency: expenseData?.currency,
            title: expenseData?.title,
            type: expenseData?.type,
            date: dayjs(expenseData?.expenseDate),
            description: expenseData?.description || "",
        });
        setAmount(String(expenseData?.amount || "0.00"));
        setCurrency(expenseData?.currency || "USD");
        const shares = expenseData?.shares || [];

        const allAmounts = shares.map(share => share.shareAmount);
        const allEqual = allAmounts.every(a => a === allAmounts[0]);
        if (allEqual) {
            setSplitMethod("equally");
        } else {
            setSplitMethod("unequally");
        }
        const amounts: Record<number, string> = {};
        const ids: number[] = [];

        for (const share of shares) {
            ids.push(share.user.id);
            amounts[share.user.id] = String(share.shareAmount);
        }

        setSelectedMembers(ids);
        setAmountsByMember(amounts);
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
                    leftOnClick={() => (step === 2 ? setStep(1) : navigate("/groups/expense"))}
                    title="Edit expense"
                />

                <Form form={form} className="p-4 max-w-2xl mx-auto" layout="vertical">
                    {step === 1 && (
                        <>

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
                                selectedGroup={expenseData?.groupId!}
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
            </motion.div>
        </div>
    );
};

export default EditPage;
