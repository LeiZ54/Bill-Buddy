import { create } from 'zustand';
import api from '../util/axiosConfig';
import { persist } from 'zustand/middleware';
import { FriendData } from '../util/util';
interface FriendState {
    friends: FriendData[];
    isLoadingMore: boolean;
    currentPage: number;
    hasMore: boolean;

    // public function
    fetchFriends: () => Promise<void>;
    loadMoreFriends: () => Promise<void>;
}

export const useFriendStore = create<FriendState>()(
    persist(
        (set, get) => ({
            friends: [],
            isLoadingMore: false,
            currentPage: 0,
            hasMore: true,

            fetchFriends: async () => {
                const res = await api.get(`/friends?page=0&size=10`);
                set({
                    friends: res.data.friends.content,
                    hasMore: !res.data.last,
                    currentPage: 0
                });
            },

            loadMoreFriends: async () => {
                const { currentPage, hasMore, isLoadingMore } = get();
                if (!hasMore || isLoadingMore) return;
                const nextPage = currentPage + 1;
                set({ isLoadingMore: true });
                try {
                    const res = await api.get(`/friends?page=${nextPage}&size=10`);
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
                friends: state.friends,
                currentPage: state.currentPage,
                hasMore: state.hasMore,
            }),
        }
    )
);
