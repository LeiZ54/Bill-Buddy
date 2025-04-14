export interface Group {
    groupId: number;
    groupName: string;
    type: string;
    owesCurrentUser: Record<string, number>;
    currentUserOwes: Record<string, number>;
}

interface ExpenseItem {
    person: string;
    amount: number;
    type: 'owe' | 'get';
}

export interface GroupData {
    id: number;
    name: string;
    type: string;
    items: ExpenseItem[];
    netBalance: number;
}

export interface Member {
    id: number;
    fullName: string;
    email: string;
}
export interface easyGroup {
    groupId: number;
    groupName: string;
    type: string;
}

export interface ExpenseDate {

}

export const expenseType = [
    'FOOD',
    'TRANSPORT',
    'HOUSING',
    'ENTERTAINMENT',
    'HEALTH',
    'SHOPPING',
    'EDUCATION',
    'GIFT',
    'SUBSCRIPTION',
    'SETTLE_UP',
    'OTHER',
];
export const recurrenceOptions = [
    { label: 'Day', unit: 'DAY', interval: 1 },
    { label: 'Week', unit: 'WEEK', interval: 1 },
    { label: 'Month', unit: 'MONTH', interval: 1 },
    { label: 'Season', unit: 'MONTH', interval: 3 },
    { label: 'Half Year', unit: 'MONTH', interval: 6 },
    { label: 'Year', unit: 'YEAR', interval: 1 },
    { label: 'Custom', unit: null, interval: null },
];
