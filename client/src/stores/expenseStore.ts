import { create } from 'zustand';
import { CycleExpenseData, ExpenseData, easyGroup } from '../util/util';
import api from '../util/axiosConfig';
import { persist } from 'zustand/middleware';

interface ExpenseState {
    activeExpense: number | null;
    expenseData: ExpenseData | null;
    groupList: easyGroup[];
    activeCycleExpense: number | null;
    cycleExpenseData: CycleExpenseData | null;
    setActiveExpense: (id: number) => void;
    setActiveCycleExpense: (id: number) => void;
    getExpense: () => Promise<void>;
    getCycleExpense: () => Promise<void>;
    fetchAllGroups: () => Promise<void>;
    getRecurrenceLabel: (time?: { recurrenceUnit: string; recurrenceInterval: number }) => string;
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


        }),
        {
            name: 'expense-storage', // localStorage key
            partialize: (state) => ({
                activeExpense: state.activeExpense,
            }),
        }
    )

);
