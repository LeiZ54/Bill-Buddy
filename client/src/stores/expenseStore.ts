import { create } from 'zustand';
import { ExpenseData, easyGroup } from '../util/util';
import api from '../util/axiosConfig';
import { persist } from 'zustand/middleware';

interface ExpenseState {
    activeExpense: number | null;
    expenseData: ExpenseData | null;
    groupList: easyGroup[];
    setActiveExpense: (id: number) => void;
    getExpense: () => Promise<void>;
    fetchAllGroups: () => Promise<void>;
    getRecurrenceLabel: (time?: { recurrenceUnit: string; recurrenceInterval: number }) => string;
}

export const useExpenseStore = create<ExpenseState>()(
    persist(
        (set, get) => ({
            activeExpense: null,
            expenseData: null,
            groupList: [],
            setActiveExpense: (id: number) => {
                set({ activeExpense: id });
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

            fetchAllGroups: async () => {
                set({ groupList: [] });
                const res = await api.get(`/groups?page=0&size=100`);
                set({ groupList: res.data.content });
            },


        }),
        {
            name: 'expense-storage', // localStorage key
            partialize: (state) => ({
                activeExpense: state.activeExpense,
            }),
        }
    )

);
