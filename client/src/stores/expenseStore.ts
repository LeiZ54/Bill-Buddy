import { create } from 'zustand';
import { ExpenseDate } from '../util/util';

interface ExpenseState {
    expense: ExpenseDate[];
    getRecurrenceLabel: (time?: { recurrenceUnit: string; recurrenceInterval: number }) => string;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
    expense: [],
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
}));
