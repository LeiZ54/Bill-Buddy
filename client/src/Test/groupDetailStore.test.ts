import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useGroupDetailStore } from '../stores/groupDetailStore';
import axios from 'axios';
import { act } from 'react-dom/test-utils';

// ✅ mock localStorage
if (typeof localStorage === 'undefined') {
    let store: Record<string, string> = {};
    global.localStorage = {
        getItem: vi.fn((key) => store[key] ?? null),
        setItem: vi.fn((key, val) => { store[key] = String(val); }),
        removeItem: vi.fn((key) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
    };
}

// ✅ mock antd
vi.mock('antd', () => ({
    message: {
        success: vi.fn(),
    },
}));

// ✅ mock axiosConfig
vi.mock('../util/axiosConfig', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        interceptors: { request: { use: vi.fn() } },
    },
}));

import api from '../util/axiosConfig';
import { message } from 'antd';

describe('groupDetailStore', () => {
    beforeEach(() => {
        localStorage.clear();
        useGroupDetailStore.setState({
            activeGroup: null,
            groupData: null,
            isLoadingMore: false,
            currentPage: 0,
            hasMore: true,
            members: [],
            expenses: [],
            filters: {},
            ifDelete: false,
            friendList: [],
            cycleExpenses: [],
        });
        vi.clearAllMocks();
    });

    test('setActiveGroup 正常设置 ID', () => {
        useGroupDetailStore.getState().setActiveGroup(11);
        expect(useGroupDetailStore.getState().activeGroup).toBe(11);
    });

    test('setFilters 应设置 filters 且清空 expenses', () => {
        useGroupDetailStore.setState({ expenses: [{ id: 1 }] as any });
        useGroupDetailStore.getState().setFilters({ title: 'abc' });
        expect(useGroupDetailStore.getState().expenses).toEqual([]);
        expect(useGroupDetailStore.getState().filters.title).toBe('abc');
    });

    test('clearData 应清空部分状态', () => {
        useGroupDetailStore.setState({
            groupData: { id: 1 } as any,
            filters: { title: 'x' },
            expenses: [{ id: 1 }] as any,
            currentPage: 2,
        });
        useGroupDetailStore.getState().clearData();
        expect(useGroupDetailStore.getState().groupData).toBeNull();
        expect(useGroupDetailStore.getState().filters).toEqual({});
        expect(useGroupDetailStore.getState().expenses).toEqual([]);
        expect(useGroupDetailStore.getState().currentPage).toBe(0);
    });

    test('getGroup 应设置 groupData', async () => {
        useGroupDetailStore.setState({ activeGroup: 10 });
        (api.get as any).mockResolvedValueOnce({
            data: {
                groupId: 10,
                groupName: 'Test Group',
                type: 'Trip',
                defaultCurrency: 'USD',
                totalDebts: 200,
                owesCurrentUser: { A: 50 },
                currentUserOwes: { B: 30 },
            },
        });

        await useGroupDetailStore.getState().getGroup();
        expect(useGroupDetailStore.getState().groupData?.name).toBe('Test Group');
        expect(useGroupDetailStore.getState().groupData?.items.length).toBe(2);
    });

    test('fetchMember 应获取 members', async () => {
        useGroupDetailStore.setState({ activeGroup: 5 });
        (api.get as any).mockResolvedValueOnce({
            data: [{ id: 1, name: 'Tom' }],
        });

        await useGroupDetailStore.getState().fetchMember();
        expect(useGroupDetailStore.getState().members.length).toBe(1);
    });

    test('fetchCycleExpenses 应获取周期支出', async () => {
        useGroupDetailStore.setState({ activeGroup: 2 });
        (api.get as any).mockResolvedValueOnce({
            data: [{ id: 1 }],
        });

        await useGroupDetailStore.getState().fetchCycleExpenses();
        expect(useGroupDetailStore.getState().cycleExpenses.length).toBe(1);
    });

    test('fetchExpenses 应更新第一页支出', async () => {
        useGroupDetailStore.setState({ activeGroup: 1 });
        (api.get as any).mockResolvedValueOnce({
            data: {
                content: [{ id: 10 }],
                last: false,
            },
        });

        await useGroupDetailStore.getState().fetchExpenses();
        expect(useGroupDetailStore.getState().expenses.length).toBe(1);
    });

    test('loadMoreExpenses 应追加数据', async () => {
        useGroupDetailStore.setState({ activeGroup: 1, currentPage: 0, hasMore: true });
        (api.get as any).mockResolvedValueOnce({
            data: {
                content: [{ id: 2 }],
                last: false,
            },
        });

        await useGroupDetailStore.getState().loadMoreExpenses();
        expect(useGroupDetailStore.getState().expenses.length).toBe(1);
        expect(useGroupDetailStore.getState().currentPage).toBe(1);
    });

    test('editGroup 应调用 put 并修改 groupData', async () => {
        useGroupDetailStore.setState({
            groupData: { id: 9, name: 'Old', type: 'A' } as any,
        });

        (api.put as any).mockResolvedValueOnce({});
        await useGroupDetailStore.getState().editGroup('NewName', 'B');

        const state = useGroupDetailStore.getState();
        expect(state.groupData?.name).toBe('NewName');
        expect(message.success).toHaveBeenCalled();
    });

    test('getIfDelete 应设置 ifDelete', async () => {
        useGroupDetailStore.setState({ activeGroup: 3 });
        (api.get as any).mockResolvedValueOnce({ data: true });

        await useGroupDetailStore.getState().getIfDelete();
        expect(useGroupDetailStore.getState().ifDelete).toBe(true);
    });

    test('getFriendList 应更新 friendList', async () => {
        useGroupDetailStore.setState({ activeGroup: 1 });
        (api.get as any).mockResolvedValueOnce({
            data: { content: [{ id: 1, fullName: 'Friend' }] },
        });

        await useGroupDetailStore.getState().getFriendList();
        expect(useGroupDetailStore.getState().friendList.length).toBe(1);
    });

    test('addFriendsToGroup 应调用 POST', async () => {
        useGroupDetailStore.setState({ activeGroup: 100 });
        (api.post as any).mockResolvedValueOnce({});

        await useGroupDetailStore.getState().addFriendsToGroup([1, 2]);
        expect(api.post).toHaveBeenCalledWith('/groups/100/invite/friends', [1, 2]);
    });

    test('deleteGroup 应调用 DELETE', async () => {
        useGroupDetailStore.setState({ activeGroup: 100 });
        (api.delete as any).mockResolvedValueOnce({});

        await useGroupDetailStore.getState().deleteGroup();
        expect(api.delete).toHaveBeenCalledWith('/groups/100');
    });

    test('leaveGroup 应调用 DELETE 成员', async () => {
        useGroupDetailStore.setState({ activeGroup: 77 });
        (api.delete as any).mockResolvedValueOnce({});

        await useGroupDetailStore.getState().leaveGroup(66);
        expect(api.delete).toHaveBeenCalledWith('/groups/77/members/66');
    });
});
