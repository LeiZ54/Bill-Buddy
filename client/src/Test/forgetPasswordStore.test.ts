import { describe, test, expect, beforeEach } from 'vitest';
import { useForgetPasswordStore } from '../stores/forgotPasswordStore';


describe('forgetPasswordStore', () => {
    beforeEach(() => {
        useForgetPasswordStore.setState({ email: '', token: '' });
    });

    test('默认 email 和 token 应为空', () => {
        const state = useForgetPasswordStore.getState();
        expect(state.email).toBe('');
        expect(state.token).toBe('');
    });

    test('setEmail 应更新 email', () => {
        useForgetPasswordStore.getState().setEmail('test@example.com');
        expect(useForgetPasswordStore.getState().email).toBe('test@example.com');
    });

    test('setToken 应更新 token', () => {
        useForgetPasswordStore.getState().setToken('abc123');
        expect(useForgetPasswordStore.getState().token).toBe('abc123');
    });
});
