import { useEffect, useState } from 'react';
import { Modal, List, Spin, message, Avatar, Radio, Grid, InputNumber, Select } from 'antd';
import api from '../util/axiosConfig';
import { easyGroup, expenseType, recurrenceOptions } from '../util/util';
import { useGroupStore } from '../stores/groupStore';

const { useBreakpoint } = Grid;


export const GroupSelectorModal = ({ open, onCancel, onSelect }: {
    open: boolean;
    onCancel: () => void;
    onSelect: (group: easyGroup) => void;
}) => {
    const [groups, setGroups] = useState<easyGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const { getUrlByType } = useGroupStore();

    const fetchAllGroups = async () => {
        let page = 0;
        const size = 10;
        let allGroups: easyGroup[] = [];
        let hasMore = true;

        setLoading(true);
        try {
            while (hasMore) {
                const res = await api.get(`/groups?page=${page}&size=${size}`);
                const content = res.data.content || [];
                allGroups = [...allGroups, ...content];

                if (res.data.last) {
                    hasMore = false;
                } else {
                    page += 1;
                }
            }
            setGroups(allGroups);
        } catch (err: any) {
            message.error(err?.response?.data?.error || "Network Error!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchAllGroups();
        }
    }, [open]);

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            title="Select a Group"
        >
            {loading ? (
                <div className="flex justify-center items-center py-6">
                    <Spin />
                </div>
            ) : (
                <div className="max-h-96 overflow-auto">
                    <List
                        dataSource={groups}
                        renderItem={(group) => (
                            <List.Item
                                key={group.groupId}
                                onClick={() => onSelect(group)}
                                className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                            >
                                <Avatar
                                    src={getUrlByType(group.type)}
                                    className="flex-shrink-0 mr-4"
                                />
                                {group.groupName}
                            </List.Item>
                        )}
                    />
                </div>
            )}
        </Modal>
    );
};

export const ExpenseTypeSelectorModal = ({ open, onCancel, onSelect }: {
    open: boolean;
    onCancel: () => void;
    onSelect: (expenseType: string) => void;
}) => {
    const [value, setValue] = useState<string>("other");
    const screens = useBreakpoint();


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
                    {expenseType.map((type) => (
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