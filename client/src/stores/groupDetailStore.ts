import { create } from 'zustand';
import api from '../util/axiosConfig';
import { GroupData, Group, Member, ExpenseSimpleDate } from '../util/util';
import { persist } from 'zustand/middleware';
import { message } from 'antd';

interface GroupDetailState {
    activeGroup: number | null;
    groupData: GroupData | null;
    isLoadingMore: boolean;
    currentPage: number;
    hasMore: boolean;
    members: Member[];
    expenses: ExpenseSimpleDate[];
    // public function
    clearData: () => void;
    setActiveGroup: (id: number) => void;
    fetchMember: () => Promise<void>;
    getGroup: () => Promise<void>;
    editGroup: (newName: string, newType: string, defaultCurrency: string) => Promise<void>;
    fetchExpenses: () => Promise<void>;

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


            clearData: () => {
                set({ groupData: null, expenses: [] });
            },
            setActiveGroup: (id: number) => {
                set({ activeGroup: id });
            },

            editGroup: async (newName, newType, defaultCurrency) => {
                const { groupData } = get();
                await api.put(`/groups/${groupData!.id}`, {
                    newName,
                    newType,
                    defaultCurrency
                });
                groupData!.name = newName;
                groupData!.type = newType;
                groupData!.currency = defaultCurrency;
                message.success('Update group successfully!');
            },

            fetchMember: async () => {
                const { activeGroup } = get();
                const response = await api.get(`/groups/${activeGroup}/members`);
                set({ members: response.data});
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
                const { activeGroup } = get();
                const res =  await api.get(`expenses/group/${activeGroup}`);
                set({expenses: res.data});
            },
        }),
        {
            name: 'groupDetail-storage', // localStorage key
            partialize: (state) => ({
                groupData: state.groupData,
                currentPage: state.currentPage,
                hasMore: state.hasMore,
                activeGroup: state.activeGroup,
            }),
        }
    )
);
