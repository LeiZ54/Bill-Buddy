import { create } from 'zustand';
import api from '../util/axiosConfig';
import { persist } from 'zustand/middleware';
import { ActivityData } from '../util/util';
interface ActivityState {
    activities: ActivityData[];
    isLoadingMore: boolean;
    currentPage: number;
    hasMore: boolean;

    // public function
    clearData: () => void;
    fetchActivities: () => Promise<void>;
    loadMoreActivities: () => Promise<void>;
}

export const useActivityStore = create<ActivityState>()(
    persist(
        (set, get) => ({
            activities: [],
            isLoadingMore: false,
            currentPage: 0,
            hasMore: true,

            clearData: () => {
                set({ activities: [], currentPage: 0, hasMore: true });
            },

            fetchActivities: async () => {
                const res = await api.get(`/activities?page=0&size=10`);
                set({
                    activities: res.data.content,
                    hasMore: !res.data.last,
                    currentPage: 0
                });
            },

            loadMoreActivities: async () => {
                const { currentPage, hasMore, isLoadingMore } = get();
                if (!hasMore || isLoadingMore) return;
                const nextPage = currentPage + 1;
                set({ isLoadingMore: true });
                try {
                    const res = await api.get(`/activities?page=${nextPage}&size=10`);
                    set(state => ({
                        activities: [...state.activities, ...res.data.content],
                        hasMore: !res.data.last,
                        currentPage: nextPage
                    }));
                } finally {
                    set({ isLoadingMore: false });
                }
            },
        }),
        {
            name: 'activity-storage', // localStorage key
            partialize: (state) => ({
                activities: state.activities,
                currentPage: state.currentPage,
                hasMore: state.hasMore,
            }),
        }
    )
);
