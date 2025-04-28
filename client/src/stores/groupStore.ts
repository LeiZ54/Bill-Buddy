import { create } from 'zustand';
import api from '../util/axiosConfig';
import { GroupData, Group } from '../util/util';
import { persist } from 'zustand/middleware';
import { message } from 'antd';

interface GroupState {
    groups: GroupData[];
    isLoadingMore: boolean;
    currentPage: number;
    hasMore: boolean;
    inviteToken: string | null;
    filters: string;
    // public function
    clearData: () => void;
    fetchGroups: (page?: number) => Promise<void>;
    loadMoreGroups: () => Promise<void>;
    setInviteToken: (token: string | null) => void;
    creatGroup: (groupName: string, type: string, defaultCurrency: string) => Promise<void>;
    setFilters: (filters: string) => void;

    // private function
    _transformGroups: (data: Group[]) => GroupData[];
}

export const useGroupStore = create<GroupState>()(
    persist(
        (set, get) => ({
            groups: [],
            isLoadingMore: false,
            currentPage: 0,
            hasMore: true,
            activeGroup: null,
            inviteToken: null,
            filters: "",

            setInviteToken: (token) => set({ inviteToken: token }),

            clearData: () => {
                set({  groups: [], currentPage: 0, hasMore: true });
            },

            setFilters: (filters: string) => {
                set({ filters: filters });
            },

            _transformGroups: (data: Group[]) => {
                return data.map(group => {
                    const sumGet = Object.values(group.owesCurrentUser).reduce((a, b) => a + b, 0);
                    const sumOwe = Object.values(group.currentUserOwes).reduce((a, b) => a + b, 0);
                    const netBalance = sumGet - sumOwe;

                    return {
                        id: group.groupId,
                        name: group.groupName,
                        type: group.type,
                        netBalance,
                        currency:group.defaultCurrency,
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
                });
            },

            fetchGroups: async () => {
                const { filters } = get();
                set({ groups: [] });
                const response = await api.get(`/groups/detail?page=0&size=10&groupName=${filters}`);
                const result = response.data;
                const transformedData = get()._transformGroups(result.content);
                set({
                    groups: transformedData,
                    currentPage: 0,
                    hasMore: !result.last,
                });
            },

            loadMoreGroups: async () => {
                const { currentPage, hasMore, isLoadingMore, filters } = get();
                if (!hasMore || isLoadingMore) return;
                set({ isLoadingMore: true });
                const nextPage = currentPage + 1;
                try {
                    const response = await api.get(`/groups/detail?page=${nextPage}&size=10&groupName=${filters}`);
                    const result = response.data;
                    const transformedData = get()._transformGroups(result.content);
                    set(state => ({
                        groups: [...state.groups, ...transformedData],
                        currentPage: nextPage,
                        hasMore: !result.last,
                        isLoadingMore: false
                    }));
                } finally {
                    set({ isLoadingMore: false });
                }

            },
            creatGroup: async (groupName, type, defaultCurrency) => {
                await api.post('/groups', {
                    groupName,
                    type,
                    defaultCurrency
                });
                message.success('Create group successfully!');
            },
        }),
        {
            name: 'group-storage', // localStorage key
            partialize: (state) => ({
                groups: state.groups,
                currentPage: state.currentPage,
                hasMore: state.hasMore,
                inviteToken: state.inviteToken,
            }),
        }
    )
);
