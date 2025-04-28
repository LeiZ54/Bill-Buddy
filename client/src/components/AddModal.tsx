import { useState } from 'react';
import { Modal, Avatar, Radio, Grid, InputNumber, Select } from 'antd';
import { recurrenceOptions } from '../util/util';
import useAuthStore from '../stores/authStore';

const { useBreakpoint } = Grid;


export const ExpenseTypeSelectorModal = ({ open, onCancel, onSelect }: {
    open: boolean;
    onCancel: () => void;
    onSelect: (expenseType: string) => void;
}) => {
    const [value, setValue] = useState<string>("other");
    const screens = useBreakpoint();
    const { expenseTypes } = useAuthStore();


    const handleChange = (val: string) => {
        setValue(val);
        onSelect(val); 
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            title="Select Expense Type"
        >
            <Radio.Group
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                className="w-full"
            >
                <div className={`grid grid-cols-2 gap-3 ${screens.xs ? '' : 'sm:grid-cols-4'}`}>
                    {Object.entries(expenseTypes).map(([type, url]) => (
                        <Radio.Button
                            key={type}
                            value={type}
                            className="h-full flex flex-col items-center p-4"
                            style={{
                                borderWidth: 2,
                                borderRadius: 8,
                            }}
                        >
                            <div className="flex flex-col items-center">
                                <Avatar src={url}/>
                                <span className="text-gray-600">{type}</span>
                            </div>
                        </Radio.Button>
                    ))}
                </div>
            </Radio.Group>
        </Modal>
    );
}


export const RecurrenceTimeSelectorModal = ({ open, onCancel, onSelect }: {
    open: boolean;
    onCancel: () => void;
    onSelect: (value: { recurrenceUnit: string; recurrenceInterval: number }) => void;
}) => {
    const [selected, setSelected] = useState<string | null>(null);
    const [customInterval, setCustomInterval] = useState<number>(1);
    const [customUnit, setCustomUnit] = useState<string>('DAY');
    const unitOptions = [
        { label: 'Day', value: 'DAY' },
        { label: 'Week', value: 'WEEK' },
        { label: 'Month', value: 'MONTH' },
        { label: 'Year', value: 'YEAR' },
    ];

    const handleConfirm = () => {
        if (selected === 'Custom') {
            onSelect({
                recurrenceUnit: customUnit,
                recurrenceInterval: customInterval,
            });
        } else {
            const match = recurrenceOptions.find((opt) => opt.label === selected);
            if (match && match.unit && match.interval) {
                onSelect({
                    recurrenceUnit: match.unit,
                    recurrenceInterval: match.interval,
                });
            }
        }
        onCancel();
    };

    return (
        <Modal
            open={open}
            title="Select Recurrence Time"
            onCancel={handleConfirm}
            footer={null}
        >
            <Radio.Group
                className="w-full"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
            >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                    {recurrenceOptions.map((opt) => (
                        <Radio.Button
                            key={opt.label}
                            value={opt.label}
                            className="h-full flex flex-col items-center p-3"
                            style={{
                                borderWidth: 2,
                                borderRadius: 8
                            }}
                        >
                            {opt.label}
                        </Radio.Button>
                    ))}
                </div>
            </Radio.Group>

            {selected === 'Custom' && (
                <div className="mt-6 space-y-2">
                    <InputNumber
                        min={1}
                        value={customInterval}
                        onChange={(val) => setCustomInterval(val ?? 1)}
                        placeholder="Interval"
                        className="w-full"
                    />
                    <Select
                        value={customUnit}
                        onChange={setCustomUnit}
                        className="w-full"
                        options={unitOptions}
                        placeholder="Select Unit"
                    />
                </div>
            )}
        </Modal>
    );
};