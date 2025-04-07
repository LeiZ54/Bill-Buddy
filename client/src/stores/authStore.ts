import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../util/axiosConfig';

import { jwtDecode } from 'jwt-decode';

interface AuthState {
    token: string | null;
    email: string | null;
    id: number | null;
    name: string | null;
    exp: number | null;
    isLoading: boolean;
    error: string | null;
    login: (loginEmail: string, loginPassword: string) => Promise<boolean>;
    loginWithGoogle: (googleId: string) => Promise<boolean>;
    register: (email: string, password: string, givenName: string, familyName: string) => Promise<boolean>;
    logout: () => void;
    resetError: () => void;
}

const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            email: null,
            id: null,
            name: null,
            exp: null,
            isLoading: false,
            error: null,

            login: async (loginEmail, loginPassword) => {
                try {
                    set({ isLoading: true, error: null });
                    const res = await api.post('/auth/login', { email: loginEmail, password: loginPassword });
                    const { token, email, id, name } = res.data;
                    const { exp } = jwtDecode(token); 
                    set({ token, email, id, name, exp });
                    return true;
                } catch (err: any) {
                    if (err.response.data.error) {
                        set({ error: err.response.data.error });
                    } else {
                        set({ error: "Network Error!" });
                    }
                    return false;
                } finally {
                    set({ isLoading: false });
                }
            },

            loginWithGoogle: async (googleId) => {
                try {
                    set({ isLoading: true, error: null });
                    const res = await api.post("/auth/google", { googleId });
                    const { token, email, id, name } = res.data;
                    const exp = jwtDecode(token).exp;
                    set({ token, email, id, name, exp });
                    return true;
                } catch (err) {
                    set({ error: 'Google login failed!' });
                    return false;
                } finally {
                    set({ isLoading: false });
                }
            },

            register: async (registerEmail, registerPassword, registerGivenName, registerFamilyName) => {
                try { 
                    set({ isLoading: true, error: null });
                    const res = await api.post('/auth/register', {
                        email: registerEmail,
                        password: registerPassword,
                        givenName: registerGivenName,
                        familyName: registerFamilyName
                    });
                    const { token, email, id, name } = res.data;
                    const exp = jwtDecode(token).exp;
                    set({ token, email, id, name, exp });
                    return true;
                } catch (err: any) {
                    if (err.response.data.error) {
                        set({ error: err.response.data.error });
                    } else {
                        set({ error: 'Network Error!' });
                    }
                    return false;
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: () => set({ token: null, email: null, id: null, name: null, exp: null }),
            resetError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage', // localStorage key
        }
    )
);

export default useAuthStore;
