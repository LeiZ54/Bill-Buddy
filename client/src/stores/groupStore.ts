import { create } from 'zustand';
import api from '../util/axiosConfig';
import { GroupData, Group, Member } from '../util/util';
import { persist } from 'zustand/middleware';

interface GroupState {
    groups: GroupData[];
    isLoading: boolean;
    isLoadingMore: boolean;
    error: string | null;
    currentPage: number;
    hasMore: boolean;
    activeGroup: GroupData | null;
    members: Member[];
    inviteToken: string | null
    // public function
    setActiveGroup: (group: GroupData) => void;
    clearActiveGroup: () => void;
    fetchGroups: (page?: number) => Promise<void>;
    loadMoreGroups: () => Promise<void>;
    resetError: () => void;
    getUrlByType: (type: string) => string;
    fetchMember: (groupId: number) => Promise<void>;
    updateGroup: (newGroup: GroupData) => void;
    setInviteToken: (token: string | null) => void;

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
            members: [],
            inviteToken: null,

            setActiveGroup: (group) => set({ activeGroup: group }),
            clearActiveGroup: () => set({ activeGroup: null }),
            setInviteToken: (token) => set({ inviteToken: token }),

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
                    const transformedData = get()._transformGroups(result.content);
                    set({
                        groups: transformedData,
                        currentPage: page,
                        hasMore: !result.last,
                        isLoading: false
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
                    const transformedData = get()._transformGroups(result.content);
                    set(state => ({
                        groups: [...state.groups, ...transformedData],
                        currentPage: nextPage,
                        hasMore: !result.last,
                        isLoadingMore: false
                    }));
                } catch (err) {
                    set({ error: 'Failed to load more data!', isLoadingMore: false });
                }
            },

            getUrlByType: (type: string): string => {
                return {
                    trip: '/group/trip.png',
                    daily: '/group/daily.png',
                    party: '/group/party.png',
                    other: '/group/other.png'
                }[type] || '/group/other.png';
            },

            fetchMember: async (groupId: number) => {
                try {
                    set({ isLoading: true, error: null });
                    const response = await api.get(`/groups/${groupId}/members`);
                    set({ members: response.data, isLoading: false });
                } catch (err) {
                    set({ error: 'Failed to get data!', isLoading: false });
                }
            },

            updateGroup: (newGroup: GroupData) => {
                set({ activeGroup: newGroup });
            },

            resetError: () => {
                set({ error: null });
            }
        }),
        {
            name: 'group-storage', // localStorage key
            partialize: (state) => ({
                groups: state.groups,
                currentPage: state.currentPage,
                hasMore: state.hasMore,
                activeGroup: state.activeGroup,
            }),
        }
    )
);
