import { create } from 'zustand';
import { CycleExpenseData, ExpenseData, easyGroup } from '../util/util';
import api from '../util/axiosConfig';
import { persist } from 'zustand/middleware';
import { message } from 'antd';
import axios from 'axios';

interface ExpenseState {
    activeExpense: number | null;
    expenseData: ExpenseData | null;
    groupList: easyGroup[];
    activeCycleExpense: number | null;
    cycleExpenseData: CycleExpenseData | null;
    setActiveExpense: (id: number) => void;
    setActiveCycleExpense: (id: number) => void;
    getExpense: () => Promise<void>;
    deleteExpense: () => Promise<void>;
    getCycleExpense: () => Promise<void>;
    fetchAllGroups: () => Promise<void>;
    getRecurrenceLabel: (time?: { recurrenceUnit: string; recurrenceInterval: number }) => string;
    uploadImg: (img: any) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>()(
    persist(
        (set, get) => ({
            activeExpense: null,
            expenseData: null,
            groupList: [],
            activeCycleExpense: null,
            cycleExpenseData: null,
            setActiveExpense: (id: number) => {
                set({ activeExpense: id });
            },

            setActiveCycleExpense: (id: number) => {
                set({ activeCycleExpense: id });
            },

            getRecurrenceLabel: (time?: { recurrenceUnit: string; recurrenceInterval: number }): string => {
                if (!time) return '';
                const { recurrenceUnit, recurrenceInterval } = time;

                const unitLabelMap: Record<string, string> = {
                    DAY: 'Day',
                    WEEK: 'Week',
                    MONTH: 'Month',
                    YEAR: 'Year',
                };

                if (recurrenceUnit === 'MONTH' && recurrenceInterval === 3) return 'Season';
                if (recurrenceUnit === 'MONTH' && recurrenceInterval === 6) return 'Half Year';

                return `Every ${recurrenceInterval} ${unitLabelMap[recurrenceUnit]}${recurrenceInterval > 1 ? 's' : ''}`;
            },

            getExpense: async () => {
                const { activeExpense } = get();
                const res = await api.get(`/expenses/${activeExpense}`);
                set({ expenseData: res.data });
            },

            deleteExpense: async () => {
                const { activeExpense } = get();
                await api.delete(`/expenses/${activeExpense}`);
            },

            getCycleExpense: async () => {
                const { activeCycleExpense } = get();
                const res = await api.get(`/expenses/recurring/${activeCycleExpense}`);
                set({ cycleExpenseData: res.data });
            },

            fetchAllGroups: async () => {
                set({ groupList: [] });
                const res = await api.get(`/groups?page=0&size=100`);
                set({ groupList: res.data.content });
            },

            uploadImg: async (file) => {
                const { activeExpense } = get();
                const apiKey = '1523e50e1102802c71f7ac35fe49d0b5';
                const formData = new FormData();
                formData.append('image', file);
                let url;
                try {
                    const res = await axios.post(
                        `https://api.imgbb.com/1/upload?key=${apiKey}`,
                        formData
                    );
                    url = res.data.data.url;
                } catch (err) {
                    message.error('Upload failed!');
                    return;
                }
                await api.put(`expenses/${activeExpense}/picture`, {
                    picture: url
                });
                message.success('Upload successfully!');
            },


        }),
        {
            name: 'expense-storage', // localStorage key
            partialize: (state) => ({
                activeExpense: state.activeExpense,
                expenseData: state.expenseData,
                groupList: state.groupList,
                activeCycleExpense: state.activeCycleExpense,
                cycleExpenseData: state.cycleExpenseData
            }),
        }
    )

);
