import { create } from 'zustand';

interface ForgetPasswordState {
    email: string;
    token: string;
    setEmail: (email: string) => void;
    setToken: (token: string) => void;
}

export const useForgetPasswordStore = create<ForgetPasswordState>((set) => ({
    email: '',
    token: '',
    setEmail: (email) => set({ email }),
    setToken: (token) => set({ token }),
}));
