import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useExpenseStore } from '../stores/expenseStore';
import { act } from 'react-dom/test-utils';
import axios from 'axios';

if (typeof localStorage === 'undefined') {
    let store: Record<string, string> = {};
    global.localStorage = {
        getItem: vi.fn((key) => store[key] ?? null),
        setItem: vi.fn((key, val) => { store[key] = String(val); }),
        removeItem: vi.fn((key) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
    };
}


vi.mock('axios');

vi.mock('antd', () => ({
    message: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('../util/axiosConfig', () => ({
    default: {
        get: vi.fn(),
        delete: vi.fn(),
        put: vi.fn(),
        interceptors: { request: { use: vi.fn() } },
    },
}));

import api from '../util/axiosConfig';
import { message } from 'antd';

describe('expenseStore', () => {
    beforeEach(() => {
        localStorage.clear();
        useExpenseStore.setState({
            activeExpense: null,
            expenseData: null,
            groupList: [],
            activeCycleExpense: null,
            cycleExpenseData: null,
        });
        vi.clearAllMocks();
    });

    test('setActiveExpense 正常设置 ID', () => {
        useExpenseStore.getState().setActiveExpense(123);
        expect(useExpenseStore.getState().activeExpense).toBe(123);
    });

    test('getExpense 成功更新 expenseData', async () => {
        useExpenseStore.setState({ activeExpense: 1 });

        (api.get as any).mockResolvedValueOnce({
            data: { id: 1, amount: 100 },
        });

        await useExpenseStore.getState().getExpense();

        expect(api.get).toHaveBeenCalledWith('/expenses/1');
        expect(useExpenseStore.getState().expenseData?.amount).toBe(100);
    });

    test('deleteExpense 应调用 DELETE 接口', async () => {
        useExpenseStore.setState({ activeExpense: 99 });

        (api.delete as any).mockResolvedValueOnce({});

        await useExpenseStore.getState().deleteExpense();

        expect(api.delete).toHaveBeenCalledWith('/expenses/99');
    });

    test('getCycleExpense 获取周期性数据', async () => {
        useExpenseStore.setState({ activeCycleExpense: 88 });

        (api.get as any).mockResolvedValueOnce({
            data: { type: 'Recurring' },
        });

        await useExpenseStore.getState().getCycleExpense();

        expect(useExpenseStore.getState().cycleExpenseData?.type).toBe('Recurring');
    });

    test('fetchAllGroups 应获取并设置 groupList', async () => {
        (api.get as any).mockResolvedValueOnce({
            data: {
                content: [{ id: 1, name: 'Group 1' }, { id: 2, name: 'Group 2' }],
            },
        });

        await useExpenseStore.getState().fetchAllGroups();

        expect(useExpenseStore.getState().groupList.length).toBe(2);
    });

    test('getRecurrenceLabel 正常返回标签', () => {
        const label = useExpenseStore
            .getState()
            .getRecurrenceLabel({ recurrenceUnit: 'MONTH', recurrenceInterval: 3 });

        expect(label).toBe('Season');

        const label2 = useExpenseStore
            .getState()
            .getRecurrenceLabel({ recurrenceUnit: 'WEEK', recurrenceInterval: 1 });

        expect(label2).toBe('Every 1 Week');
    });

    test('uploadImg 成功上传应更新 picture', async () => {
        useExpenseStore.setState({ activeExpense: 22 });

        (axios.post as any).mockResolvedValueOnce({
            data: { data: { url: 'http://img.com/test.png' } },
        });

        (api.put as any).mockResolvedValueOnce({});

        const file = new File(['test'], 'test.png', { type: 'image/png' });

        await useExpenseStore.getState().uploadImg(file);

        expect(axios.post).toHaveBeenCalled();
        expect(api.put).toHaveBeenCalledWith('expenses/22/picture', {
            picture: 'http://img.com/test.png',
        });
        expect(message.success).toHaveBeenCalled();
    });

    test('uploadImg 上传失败应调用 error', async () => {
        useExpenseStore.setState({ activeExpense: 22 });

        (axios.post as any).mockRejectedValueOnce(new Error('fail'));

        const file = new File(['test'], 'fail.png', { type: 'image/png' });

        await useExpenseStore.getState().uploadImg(file);

        expect(axios.post).toHaveBeenCalled();
        expect(message.error).toHaveBeenCalledWith('Upload failed!');
    });
});
