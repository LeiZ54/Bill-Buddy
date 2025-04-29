import { describe, expect, test, vi, beforeEach } from 'vitest';
import { useActivityStore } from '../stores/activityStore';
import api from '../util/axiosConfig';
import { act } from 'react-dom/test-utils';

const mockPage = (page: number, hasMore = true) => ({
    data: {
        content: [
            {
                id: page * 2 + 1, 
                userAvatar: 'avatar-a',
                objectPicture: 'picture-a',
                objectType: 'type-a',
                objectId: 5,
                descriptionHtml: `<p>Description for ${page * 2 + 1}</p>`,
                accessible: true,
                createdAt: new Date(),
            },
            {
                id: page * 2 + 2, 
                userAvatar: 'avatar-b',
                objectPicture: 'picture-b',
                objectType: 'type-b',
                objectId: 5,
                descriptionHtml: `<p>Description for ${page * 2 + 2}</p>`,
                accessible: false,
                createdAt: new Date(),
            },
        ],
        last: !hasMore,
    },
});

vi.mock('../util/axiosConfig');

describe('activityStore', () => {
    beforeEach(() => {
        useActivityStore.getState().clearData();
        vi.clearAllMocks();
    });

    test('fetchActivities 加载第一页活动', async () => {
        (api.get as any).mockResolvedValueOnce(mockPage(0, true));
        await act(() => useActivityStore.getState().fetchActivities());
        const state = useActivityStore.getState();
        expect(state.activities.length).toBe(2);
        expect(state.currentPage).toBe(0);
        expect(state.hasMore).toBe(true);
    });

    test('loadMoreActivities 应追加活动并更新分页', async () => {
        (api.get as any).mockResolvedValueOnce(mockPage(0, true));
        await act(() => useActivityStore.getState().fetchActivities());

        (api.get as any).mockResolvedValueOnce(mockPage(1, false));
        await act(() => useActivityStore.getState().loadMoreActivities());

        const state = useActivityStore.getState();
        expect(state.activities.length).toBe(4);
        expect(state.currentPage).toBe(1);
        expect(state.hasMore).toBe(false);
    });

    test('clearData 应该重置 state', () => {
        useActivityStore.setState({
            activities: [
                {
                    id: 1,
                    userAvatar: 'avatar-1',
                    objectPicture: 'picture-1',
                    objectType: 'type-1',
                    objectId: 5,
                    descriptionHtml: '<p>Initial description</p>',
                    accessible: true,
                    createdAt: new Date(),
                },
            ],
            currentPage: 3,
            hasMore: false,
        });

        useActivityStore.getState().clearData();

        const state = useActivityStore.getState();
        expect(state.activities).toEqual([]);
        expect(state.currentPage).toBe(0);
        expect(state.hasMore).toBe(true);
    });

    test('loadMoreActivities 不应在没有更多时触发', async () => {
        useActivityStore.setState({ hasMore: false });

        await act(() => useActivityStore.getState().loadMoreActivities());

        expect(api.get).not.toHaveBeenCalled();
    });

    test('isLoadingMore 状态在加载前后切换', async () => {
        (api.get as any).mockResolvedValueOnce(mockPage(0, true));
        await act(() => useActivityStore.getState().fetchActivities());

        (api.get as any).mockResolvedValueOnce(mockPage(1, false));
        const p = useActivityStore.getState().loadMoreActivities();
        expect(useActivityStore.getState().isLoadingMore).toBe(true);
        await act(() => p);
        expect(useActivityStore.getState().isLoadingMore).toBe(false);
    });
});
