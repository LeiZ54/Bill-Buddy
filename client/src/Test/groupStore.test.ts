import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useGroupStore } from '../stores/groupStore';

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

vi.mock('antd', () => ({
    message: {
        success: vi.fn(),
    },
}));
vi.mock('../util/axiosConfig', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        interceptors: { request: { use: vi.fn() } },
    },
}));

import api from '../util/axiosConfig';
import { message } from 'antd';

describe('groupStore', () => {
    beforeEach(() => {
        useGroupStore.setState({
            groups: [],
            isLoadingMore: false,
            currentPage: 0,
            hasMore: true,
            inviteToken: null,
            filters: '',
        });
        vi.clearAllMocks();
    });

    test('setInviteToken 应更新 token', () => {
        useGroupStore.getState().setInviteToken('abc123');
        expect(useGroupStore.getState().inviteToken).toBe('abc123');
    });

    test('clearData 应清空分页状态', () => {
        useGroupStore.setState({ groups: [{ id: 1 }] as any, currentPage: 2 });
        useGroupStore.getState().clearData();
        expect(useGroupStore.getState().groups).toEqual([]);
        expect(useGroupStore.getState().currentPage).toBe(0);
    });

    test('setFilters 应更新 filters', () => {
        useGroupStore.getState().setFilters('trip');
        expect(useGroupStore.getState().filters).toBe('trip');
    });

    test('_transformGroups 应正确转换数据', () => {
        const raw = [{
            groupId: 1,
            groupName: 'G1',
            type: 'Trip',
            defaultCurrency: 'USD',
            owesCurrentUser: { A: 50 },
            currentUserOwes: { B: 20 },
        }];
        const result = useGroupStore.getState()._transformGroups(raw as any);
        expect(result[0].netBalance).toBe(30);
        expect(result[0].items.length).toBe(2);
    });

    test('fetchGroups 应获取第一页并转换', async () => {
        (api.get as any).mockResolvedValueOnce({
            data: {
                content: [
                    {
                        groupId: 1,
                        groupName: 'Team',
                        type: 'Work',
                        defaultCurrency: 'USD',
                        owesCurrentUser: { A: 40 },
                        currentUserOwes: {},
                    },
                ],
                last: false,
            },
        });

        await useGroupStore.getState().fetchGroups();

        const state = useGroupStore.getState();
        expect(state.groups.length).toBe(1);
        expect(state.groups[0].name).toBe('Team');
        expect(state.currentPage).toBe(0);
        expect(state.hasMore).toBe(true);
    });

    test('loadMoreGroups 应追加下一页数据', async () => {
        useGroupStore.setState({
            currentPage: 0,
            hasMore: true,
            isLoadingMore: false,
            groups: [],
        });

        (api.get as any).mockResolvedValueOnce({
            data: {
                content: [
                    {
                        groupId: 2,
                        groupName: 'Next',
                        type: 'Fun',
                        defaultCurrency: 'EUR',
                        owesCurrentUser: {},
                        currentUserOwes: { C: 30 },
                    },
                ],
                last: true,
            },
        });

        await useGroupStore.getState().loadMoreGroups();
        expect(useGroupStore.getState().groups.length).toBe(1);
        expect(useGroupStore.getState().groups[0].name).toBe('Next');
        expect(useGroupStore.getState().currentPage).toBe(1);
        expect(useGroupStore.getState().hasMore).toBe(false);
    });

    test('creatGroup 应调用 POST 并提示成功', async () => {
        (api.post as any).mockResolvedValueOnce({});
        await useGroupStore.getState().creatGroup('Trip', 'Travel', 'USD');
        expect(api.post).toHaveBeenCalledWith('/groups', {
            groupName: 'Trip',
            type: 'Travel',
            defaultCurrency: 'USD',
        });
        expect(message.success).toHaveBeenCalledWith('Create group successfully!');
    });
});
