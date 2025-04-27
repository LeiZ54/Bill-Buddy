import { create } from 'zustand';
import api from '../util/axiosConfig';
import { persist } from 'zustand/middleware';
import { FriendData } from '../util/util';
interface FriendState {
    activeFriend: FriendData | null;
    friends: FriendData[];
    isLoadingMore: boolean;
    currentPage: number;
    hasMore: boolean;
    filters: string;

    // public function
    clearData: () => void;
    fetchFriends: () => Promise<void>;
    loadMoreFriends: () => Promise<void>;
    setActiveFriend: (friend: FriendData) => void;
    setFilters: (filters: string) => void;
}

export const useFriendStore = create<FriendState>()(
    persist(
        (set, get) => ({
            activeFriend: null,
            friends: [],
            isLoadingMore: false,
            currentPage: 0,
            hasMore: true,
            filters:"",

            clearData: () => {
                set({ friends: [], currentPage: 0, hasMore: true });
            },

            setFilters: (filters: string) => {
                set({ filters: filters });
            },

            setActiveFriend: (friend: FriendData) => {
                set({ activeFriend: friend });
            },

            fetchFriends: async () => {
                const { filters } = get();
                const res = await api.get(`/friends?page=0&size=10&search=${filters}`);
                set({
                    friends: res.data.friends.content,
                    hasMore: !res.data.last,
                    currentPage: 0
                });
            },

            loadMoreFriends: async () => {
                const { currentPage, hasMore, isLoadingMore, filters } = get();
                if (!hasMore || isLoadingMore) return;
                const nextPage = currentPage + 1;
                set({ isLoadingMore: true });
                try {
                    const res = await api.get(`/friends?page=${nextPage}&size=10&search=${filters}`);
                    set(state => ({
                        friends: [...state.friends, ...res.data.friends.content],
                        hasMore: !res.data.last,
                        currentPage: nextPage
                    }));
                } finally {
                    set({ isLoadingMore: false });
                }
            },
        }),
        {
            name: 'friend-storage', // localStorage key
            partialize: (state) => ({
                activeFriend: state.activeFriend,
                friends: state.friends,
                currentPage: state.currentPage,
                hasMore: state.hasMore,
            }),
        }
    )
);
