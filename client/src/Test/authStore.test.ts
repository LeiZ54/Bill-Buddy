import { describe, test, expect, vi, beforeEach } from 'vitest';
import useAuthStore from '../stores/authStore';
import { act } from 'react-dom/test-utils';

import api from '../util/axiosConfig';


vi.mock('jwt-decode', () => ({
    jwtDecode: vi.fn(() => ({ exp: 1234567890 })),
}));


vi.mock('antd', () => ({
    message: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));


vi.mock('../util/axiosConfig', () => ({
    default: {
        post: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        interceptors: {
            request: { use: vi.fn() },
        },
    },
}));

describe('authStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuthStore.getState().logout();

        vi.spyOn(window.localStorage.__proto__, 'removeItem').mockImplementation(() => {});
        vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {});
        vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => null);
        vi.spyOn(window.localStorage.__proto__, 'clear').mockImplementation(() => {});
    });

    test('登录成功应设置用户信息', async () => {
        (api.post as any).mockResolvedValueOnce({
            data: {
                token: 'test-token',
                email: 'test@example.com',
                avatar: 'avatar.png',
                id: 1,
                name: 'Test User',
                familyName: 'Family',
                givenName: 'Given',
            },
        });

        (api.get as any).mockResolvedValueOnce({ data: { group: 'friends' } });
        (api.get as any).mockResolvedValueOnce({ data: { USD: '美元' } });
        (api.get as any).mockResolvedValueOnce({ data: { travel: '差旅' } });

        const result = await act(() => useAuthStore.getState().login('test@example.com', '123456'));

        expect(result).toBe(true);

        const state = useAuthStore.getState();
        expect(state.token).toBe('test-token');
        expect(state.email).toBe('test@example.com');
        expect(state.groupType.group).toBe('friends');
        expect(state.currencies.USD).toBe('美元');
        expect(state.expenseTypes.travel).toBe('差旅');
    });

    test('登录失败应设置错误信息（带 response.data.error）', async () => {
        (api.post as any).mockRejectedValueOnce({
            response: {
                data: { error: 'Invalid credentials' },
            },
        });

        const result = await act(() => useAuthStore.getState().login('wrong@example.com', 'wrongpass'));

        expect(result).toBe(false);
        expect(useAuthStore.getState().error).toBe('Invalid credentials');
    });

    test('登录失败时 fallback 为 Network Error!', async () => {
        (api.post as any).mockRejectedValueOnce({});

        const result = await act(() => useAuthStore.getState().login('error@example.com', '123456'));

        expect(result).toBe(false);
        expect(useAuthStore.getState().error).toBe('Network Error!');
    });

    test('登出应清空所有字段', () => {
        useAuthStore.setState({
            token: 'abc',
            email: 'user@example.com',
            name: 'Test',
            id: 1,
            avatar: 'avatar',
            familyName: 'F',
            givenName: 'G',
            exp: 123,
            groupType: { a: 'b' },
            currencies: { USD: '美元' },
            expenseTypes: { travel: '差旅' },
        });

        useAuthStore.getState().logout();

        const state = useAuthStore.getState();
        expect(state.token).toBeNull();
        expect(state.name).toBeNull();
        expect(state.groupType).toEqual({});
        expect(localStorage.removeItem).toHaveBeenCalledWith('auth-storage');
    });

    test('resetError 应清除错误信息', () => {
        useAuthStore.setState({ error: 'Some error' });
        useAuthStore.getState().resetError();
        expect(useAuthStore.getState().error).toBeNull();
    });
});
