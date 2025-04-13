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

export interface Invitaion {
    

}