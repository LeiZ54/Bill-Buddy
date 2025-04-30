import { create } from 'zustand';
import api from '../util/axiosConfig';
import { GroupData, Group, Member, ExpenseSimpleData, ExpenseFilter, CycleExpenseSimpleData, SettleInfo } from '../util/util';
import { persist } from 'zustand/middleware';
import { message } from 'antd';

interface FriendList {
    id: number;
    avatar: string;
    fullName: string;
    emial: string;
    inGroup: boolean;
}

interface GroupDetailState {
    activeGroup: number | null;
    groupData: GroupData | null;
    isLoadingMore: boolean;
    currentPage: number;
    hasMore: boolean;
    members: Member[];
    expenses: ExpenseSimpleData[];
    filters: ExpenseFilter;
    ifDelete: boolean;
    friendList: FriendList[];
    cycleExpenses: CycleExpenseSimpleData[];
    settleInfo: SettleInfo | null;

    // public function
    clearData: () => void;
    setActiveGroup: (id: number) => void;
    setFilters: (filters: ExpenseFilter) => void;
    fetchMember: (id: number) => Promise<void>;
    loadMoreExpenses: () => Promise<void>;
    getGroup: () => Promise<void>;
    editGroup: (newName: string, newType: string) => Promise<void>;
    fetchExpenses: () => Promise<void>;
    fetchCycleExpenses: () => Promise<void>;
    getIfDelete: () => Promise<void>;
    leaveGroup: (id: number) => Promise<void>;
    deleteGroup: () => Promise<void>;
    getFriendList: () => Promise<void>;
    addFriendsToGroup: (selectedIds: number[]) => Promise<void>;
    getSettleInfo: () => Promise<void>;
    settleUp: (userId: number, currency: string, amount: number) => Promise<void>;


    // private function
}

export const useGroupDetailStore = create<GroupDetailState>()(
    persist(
        (set, get) => ({
            activeGroup: null,
            groupData: null,
            isLoading: false,
            isLoadingMore: false,
            error: null,
            currentPage: 0,
            hasMore: true,
            members: [],
            expenses: [],
            filters: {},
            ifDelete: false,
            friendList: [],
            cycleExpenses: [],
            settleInfo: null,

            clearData: () => {
                set({ groupData: null, expenses: [], filters: {}, currentPage: 0, hasMore: true });
            },

            setActiveGroup: (id: number) => {
                set({ activeGroup: id });
            },

            setFilters: (filters: ExpenseFilter) => {
                set({ filters: filters, expenses:[] });
            },

            editGroup: async (newName, newType) => {
                const { groupData } = get();
                await api.put(`/groups/${groupData!.id}`, {
                    newName,
                    newType,
                });
                groupData!.name = newName;
                groupData!.type = newType;
                message.success('Update group successfully!');
            },

            fetchMember: async (id: number) => {
                const response = await api.get(`/groups/${id}/members`);
                set({ members: response.data});
            },

            getIfDelete: async () => {
                const { activeGroup } = get();
                const response = await api.get(`/groups/${activeGroup}/is-settled`);
                set({ ifDelete: response.data });
            },

            getSettleInfo: async () => {
                const { activeGroup } = get();
                const response = await api.get(`/groups/${activeGroup}/settle-info`);
                set({ settleInfo: response.data });
            },

            settleUp: async (userId: number, currency: string, amount: number) => {
                const { activeGroup } = get();
                await api.post(`expenses/settle-up`, {
                    "groupId": activeGroup,
                    "to": userId,
                    "currency": currency,
                    "amount": amount
                });
            },

            leaveGroup: async (id: number) => {
                const { activeGroup } = get();
                await api.delete(`/groups/${activeGroup}/members/${id}`);
            },

            deleteGroup: async () => {
                const { activeGroup } = get();
                await api.delete(`/groups/${activeGroup}`);
            },

            getFriendList: async () => {
                const { activeGroup } = get();
                const res = await api.get(`/groups/${activeGroup}/friends?page=0&size=100`);
                set({friendList: res.data.content});
            },

            addFriendsToGroup: async (selectedIds:number[]) => {
                const { activeGroup } = get();
                await api.post(`/groups/${activeGroup}/invite/friends`, selectedIds);
            },

            getGroup: async () => {
                const { activeGroup } = get();
                const res = await api.get(`/groups/${activeGroup}`);
                const group: Group = res.data;
                const transformedData = {
                    id: group.groupId,
                    name: group.groupName,
                    type: group.type,
                    netBalance: group.totalDebts,
                    currency: group.defaultCurrency,
                    items: [
                        ...Object.entries(group.owesCurrentUser).map(([person, amount]) => ({
                            person,
                            amount,
                            type: "get" as const,
                        })),
                        ...Object.entries(group.currentUserOwes).map(([person, amount]) => ({
                            person,
                            amount,
                            type: "owe" as const,
                        })),
                    ],
                };
                set({ groupData: transformedData });
            },
            fetchExpenses: async () => {
                const { activeGroup, filters } = get();

                const queryParams = new URLSearchParams();
                queryParams.append('groupId', String(activeGroup));
                if (filters.title) queryParams.append('title', filters.title);
                if (filters.payerId) queryParams.append('payerId', filters.payerId);
                if (filters.type) queryParams.append('type', filters.type);
                if (filters.month) queryParams.append('month', filters.month);
                const showAll = filters.showAll ?? false;
                if (!showAll) {
                    queryParams.append('settled', 'false');
                }
                queryParams.append('page', String(0));
                queryParams.append('size', String(10));

                const res = await api.get(`/expenses?${queryParams.toString()}`);
                set({
                    expenses: res.data.content,
                    hasMore: !res.data.last,
                    currentPage: 0
                });
            },

            fetchCycleExpenses: async () => {
                const { activeGroup } = get();
                const res = await api.get(`/expenses/${activeGroup}/recurring`);
                set({ cycleExpenses: res.data });
            },

            loadMoreExpenses: async () => {
                const { activeGroup, filters, currentPage, hasMore, isLoadingMore } = get();
                if (!hasMore || isLoadingMore) return;
                const nextPage = currentPage + 1;
                const queryParams = new URLSearchParams();
                queryParams.append('groupId', String(activeGroup));
                if (filters.title) queryParams.append('title', filters.title);
                if (filters.payerId) queryParams.append('payerId', filters.payerId);
                if (filters.type) queryParams.append('type', filters.type);
                if (filters.month) queryParams.append('month', filters.month);
                if (typeof filters.settled === 'boolean') {
                    queryParams.append('settled', String(filters.settled));
                }
                queryParams.append('page', String(nextPage));
                queryParams.append('size', String(10));
                set({ isLoadingMore: true });
                try {
                    const res = await api.get(`/expenses?${queryParams.toString()}`);
                    set(state => ({
                        expenses: [...state.expenses, ...res.data.content],
                        hasMore: !res.data.last,
                        currentPage: nextPage
                    }));
                } finally {
                    set({ isLoadingMore: false });
                }
            },
        }),
        {
            name: 'groupDetail-storage', // localStorage key
            partialize: (state) => ({
                groupData: state.groupData,
                currentPage: state.currentPage,
                hasMore: state.hasMore,
                activeGroup: state.activeGroup,
                members: state.members,
                expenses: state.expenses,
                filters: state.filters,
                ifDelete: state.ifDelete,
                friendList: state.friendList,
                cycleExpenses: state.cycleExpenses,
                settleInfo: state.settleInfo,
            }),
        }
    )
);
