import { create } from 'zustand';
import { ExpenseDate } from '../util/util';

interface ExpenseState {
    expense: ExpenseDate[];
    getUrlByExpenseType: (type: string) => string;
    getRecurrenceLabel: (time?: { recurrenceUnit: string; recurrenceInterval: number }) => string;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
    expense: [],
    getUrlByExpenseType: (type: string): string => {
        return {
            trip: '/group/trip.png',
            daily: '/group/daily.png',
            party: '/group/party.png',
            other: '/group/other.png'
        }[type] || '/group/other.png';
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
}));
