import { create } from 'zustand';
import api from '../util/axiosConfig';
import { GroupData, Group } from '../util/util';
import { persist } from 'zustand/middleware';
import { message } from 'antd';

interface GroupState {
    groups: GroupData[];
    isLoading: boolean;
    isLoadingMore: boolean;
    error: string | null;
    currentPage: number;
    hasMore: boolean;
    inviteToken: string | null
    // public function
    fetchGroups: (page?: number) => Promise<void>;
    loadMoreGroups: () => Promise<void>;
    resetError: () => void;
    setInviteToken: (token: string | null) => void;
    creatGroup: (groupName: string, type: string, defaultCurrency: string) => Promise<void>;

    // private function
    _transformGroups: (data: Group[]) => GroupData[];
}

export const useGroupStore = create<GroupState>()(
    persist(
        (set, get) => ({
            groups: [],
            isLoading: false,
            isLoadingMore: false,
            error: null,
            currentPage: 0,
            hasMore: true,
            activeGroup: null,
            inviteToken: null,

            setInviteToken: (token) => set({ inviteToken: token }),
            resetError: () => {
                set({ error: null });
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

            fetchGroups: async (page = 0) => {
                try {
                    set({ groups: [], isLoading: true, error: null });
                    const response = await api.get(`/groups/detail?page=${page}&size=10`);
                    const result = response.data;
                    const transformedData = get()._transformGroups(result.groupPage.content);
                    set({
                        groups: transformedData,
                        currentPage: page,
                        hasMore: !result.groupPage.last,
                        isLoading: false,
                    });
                } catch (err) {
                    set({ error: 'Failed to get data!', isLoading: false });
                }
            },

            loadMoreGroups: async () => {
                const { currentPage, hasMore, isLoadingMore } = get();
                if (!hasMore || isLoadingMore) return;
                try {
                    set({ isLoadingMore: true });
                    const nextPage = currentPage + 1;
                    const response = await api.get(`/groups/detail?page=${nextPage}&size=10`);
                    const result = response.data;
                    const transformedData = get()._transformGroups(result.groupPage.content);
                    set(state => ({
                        groups: [...state.groups, ...transformedData],
                        currentPage: nextPage,
                        hasMore: !result.groupPage.last,
                        isLoadingMore: false
                    }));
                } catch (err) {
                    set({ error: 'Failed to load more data!', isLoadingMore: false });
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
