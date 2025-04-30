import { Form, Modal, InputNumber, Button, Select, Avatar, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { useGroupDetailStore } from '../stores/groupDetailStore';
import useAuthStore from '../stores/authStore';

const { Option } = Select;
const { Text } = Typography;

interface GroupModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function SettleUpModal({
    open,
    onCancel,
    onSuccess
}: GroupModalProps) {
    const { settleInfo, settleUp } = useGroupDetailStore();
    const { currencies } = useAuthStore();
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
    const [amount, setAmount] = useState<number | null>(null);
    const [maxAmount, setMaxAmount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);


    const handleCancel = () => {
        setSelectedUserId(null);
        setSelectedCurrency(null);
        setAmount(null);
        setMaxAmount(0);
        onCancel();
    };

    const selectedUser = settleInfo!.debts.find(d => d.user.id === selectedUserId);
    const availableCurrencies = selectedUser ? Object.keys(selectedUser.debts) : [];

    useEffect(() => {
        if (selectedUser && selectedCurrency) {
            const value = selectedUser.debts[selectedCurrency];
            setMaxAmount(value);
            setAmount(value);
        } else {
            setAmount(null);
            setMaxAmount(0);
        }
    }, [selectedUserId, selectedCurrency]);

    const isValidAmount = amount !== null && amount > 0 && amount <= maxAmount;
    const formValid = selectedUserId && selectedCurrency && isValidAmount;

    const handleSubmit = async () => {
        if (!formValid || !selectedCurrency || !selectedUserId || amount == null) return;
        try {
            setIsLoading(true);
            await settleUp(selectedUserId, selectedCurrency, amount);
            handleCancel();
            onSuccess();
        } catch (err) {
            message.error("Failed to settle up!");
            console.log(err);
        } finally {
            setIsLoading(false);
        }

    };

    return (
        <Modal
            title="Settle Up"
            open={open}
            onCancel={handleCancel}
            footer={[
                <Button
                    key="submit"
                    type="primary"
                    loading={isLoading}
                    onClick={handleSubmit}
                    disabled={!formValid || isLoading}
                >
                    Settle Up
                </Button>
            ]}
        >
            <Form layout="vertical">
                <Form.Item label="Select User">
                    <Select
                        placeholder="Select a user"
                        onChange={(val: number) => {
                            setSelectedUserId(val);
                            setSelectedCurrency(null);
                        }}
                        value={selectedUserId ?? undefined}
                    >
                        {settleInfo!.debts.map((d) => (
                            <Option key={d.user.id} value={d.user.id}>
                                <div className="flex items-center gap-2">
                                    <Avatar size={20} src={d.user.avatar} />
                                    <span>{d.user.fullName}</span>
                                    <span>{ d.user.email}</span>
                                </div>
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item label="Select Currency">
                    <Select
                        placeholder="Select currency"
                        disabled={!selectedUser}
                        onChange={(val: string) => setSelectedCurrency(val)}
                        value={selectedCurrency ?? undefined}
                    >
                        {availableCurrencies.map((currency) => (
                            <Option key={currency} value={currency}>
                                {currency}  {currencies[currency] }
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                {selectedCurrency && (
                    <div className="mb-3">
                        <Text type="secondary">
                            You need to pay <b>{selectedCurrency} {currencies[selectedCurrency]}{maxAmount.toFixed(2)}</b>
                        </Text>
                    </div>
                )}

                <Form.Item
                    label="You want to pay"
                    validateStatus={!isValidAmount && amount !== null ? 'error' : ''}
                    help={
                        !isValidAmount && amount !== null
                            ? `Amount must be greater than 0 and less than or equal to ${maxAmount.toFixed(2)}`
                            : ''
                    }
                >
                    <InputNumber
                        value={amount ?? undefined}
                        onChange={val => setAmount(val ?? null)}
                        addonBefore={selectedCurrency ?? ''}
                        className="w-full"
                        disabled={!selectedCurrency}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
