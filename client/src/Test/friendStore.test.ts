import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useFriendStore } from '../stores/friendStore';


if (typeof localStorage === 'undefined') {
    let store: Record<string, string> = {};
    globalThis.localStorage = {
        getItem: vi.fn((key) => store[key] ?? null),
        setItem: vi.fn((key, val) => { store[key] = String(val); }),
        removeItem: vi.fn((key) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
        get length() {
            return Object.keys(store).length;
        },
        key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    };
}


vi.mock('../util/axiosConfig', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
        interceptors: { request: { use: vi.fn() } },
    },
}));

import api from '../util/axiosConfig';

describe('friendStore', () => {
    beforeEach(() => {
        localStorage.clear();
        useFriendStore.setState({
            activeFriend: null,
            friends: [],
            friendData: null,
            isLoadingMore: false,
            currentPage: 0,
            hasMore: true,
            filters: '',
            groupList: [],
        });
        vi.clearAllMocks();
    });

    test('setActiveFriend 应更新 activeFriend', () => {
        useFriendStore.getState().setActiveFriend({ id: 101, name: 'A' } as any);
        expect(useFriendStore.getState().activeFriend).toBe(101);
    });

    test('setFilters 应更新 filters', () => {
        useFriendStore.getState().setFilters('abc');
        expect(useFriendStore.getState().filters).toBe('abc');
    });

    test('clearData 应重置 friends 和分页状态', () => {
        useFriendStore.setState({ friends: [1, 2] as any, currentPage: 2, hasMore: false });
        useFriendStore.getState().clearData();
        expect(useFriendStore.getState().friends).toEqual([]);
        expect(useFriendStore.getState().currentPage).toBe(0);
        expect(useFriendStore.getState().hasMore).toBe(true);
    });

    test('fetchFriends 应获取第一页数据', async () => {
        (api.get as any).mockResolvedValueOnce({
            data: {
                friends: { content: [{ id: 1 }], },
                last: false,
            },
        });

        await useFriendStore.getState().fetchFriends();
        const state = useFriendStore.getState();
        expect(state.friends.length).toBe(1);
        expect(state.currentPage).toBe(0);
        expect(state.hasMore).toBe(true);
    });

    test('loadMoreFriends 应追加数据', async () => {
        useFriendStore.setState({ currentPage: 0, hasMore: true, isLoadingMore: false });
        (api.get as any).mockResolvedValueOnce({
            data: {
                friends: { content: [{ id: 2 }] },
                last: false,
            },
        });

        await useFriendStore.getState().loadMoreFriends();
        expect(useFriendStore.getState().friends.length).toBe(1);
        expect(useFriendStore.getState().currentPage).toBe(1);
    });

    test('getFriendData 应更新 friendData', async () => {
        useFriendStore.setState({ activeFriend: 66 });
        (api.get as any).mockResolvedValueOnce({
            data: { id: 66, fullName: 'Jane' },
        });

        await useFriendStore.getState().getFriendData();
        expect(useFriendStore.getState().friendData?.fullName).toBe('Jane');
    });
    
    test('deleteFriend 应调用 DELETE', async () => {
        useFriendStore.setState({ activeFriend: 42 });
        (api.delete as any).mockResolvedValueOnce({});

        await useFriendStore.getState().deleteFriend();
        expect(api.delete).toHaveBeenCalledWith('/friends/42');
    });

    test('getGroupList 应更新 groupList', async () => {
        useFriendStore.setState({ activeFriend: 88 });
        (api.get as any).mockResolvedValueOnce({
            data: { content: [{ groupId: 1, groupName: 'Travel' }] },
        });

        await useFriendStore.getState().getGroupList();
        expect(useFriendStore.getState().groupList[0].groupName).toBe('Travel');
    });

    test('addFriendToGroup 应调用 POST', async () => {
        useFriendStore.setState({ activeFriend: 10 });
        (api.post as any).mockResolvedValueOnce({});

        await useFriendStore.getState().addFriendToGroup(777);
        expect(api.post).toHaveBeenCalledWith('/groups/777/invite/friends', [10]);
    });
});
