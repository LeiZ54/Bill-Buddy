export interface Group {
    groupId: number;
    groupName: string;
    type: string;
    defaultCurrency: string;
    owesCurrentUser: Record<string, number>;
    currentUserOwes: Record<string, number>;
    totalDebts: number;
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
    currency: string,
}

export interface FriendData {
    netDebts: NetDebts[];
    email: string;
    fullName: string;
    id: number;
    avatar: string;

}
interface NetDebts {
    group: NetDebts_Group;
    debtAmount: number;
}

interface NetDebts_Group {
    groupId: number;
    groupName: string;
    type: string;
    defaultCurrency: string;
}

export interface ActivityData {
    id: number;
    userAvatar: string;
    objectPicture: string;
    objectType: string;
    objectId: 5;
    descriptionHtml: string;
    accessible: boolean;
    createdAt: Date;
}

export interface Member {
    id: number;
    fullName: string;
    givenName: string;
    familyName: string;
    email: string;
    avatar: string;
}
export interface easyGroup {
    groupId: number;
    groupName: string;
    type: string;
}

export interface ExpenseSimpleData {
    id: number;
    title: string;
    payer: Member;
    type: string;
    amount: number;
    currency: string;
    expenseDate: string;
    debtsAmount: number;
}
export interface ExpenseData {
    groupId: number;
    id: number;
    title: string;
    payer: Member;
    picture: string;
    description: string;
    type: string;
    amount: number;
    currency: string;
    settled: boolean;
    logs: string;
    expenseDate: string;
    debtsAmount: number;
    shares: ExpenseDataShare[];
}

interface ExpenseDataShare {
    user: Member;
    shareAmount: number;
}

export interface CycleExpenseSimpleData {
    id: number;
    title: string;
    type: string;
}

export interface CycleExpenseData {
    id: number;
    title: string;
    group: number;
    payer: Member;
    description: string;
    type: string;
    amount: number;
    participants: Member[];
    shareAmounts: number[];
    currency: string;
    expenseDate: string;
    startDate: Date;
    recurrenceUnit: string;
    recurrenceInterval: number;
    createdAt: Date;

}

export const recurrenceOptions = [
    { label: 'Every Day', unit: 'DAY', interval: 1 },
    { label: 'Every Week', unit: 'WEEK', interval: 1 },
    { label: 'Every Month', unit: 'MONTH', interval: 1 },
    { label: 'Every Season', unit: 'MONTH', interval: 3 },
    { label: 'Half Year', unit: 'MONTH', interval: 6 },
    { label: 'Every Year', unit: 'YEAR', interval: 1 },
    { label: 'Custom', unit: null, interval: null },
];

export interface ExpenseFilter {
    title?: string;
    payerId?: string;
    type?: string;
    month?: string;
    showAll?: boolean;
}

export interface SettleInfo {
    groupId: number;
    groupCurrency: string;
    debts: SettleInfoDebts[];
}

interface SettleInfoDebts {
    user: Member;
    debts: Record<string, number>;
}