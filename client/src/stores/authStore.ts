import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import api from '../util/axiosConfig';

import {jwtDecode} from 'jwt-decode';
import {message} from "antd";

interface AuthState {
    token: string | null;
    email: string | null;
    id: number | null;
    name: string | null;
    exp: number | null;
    isLoading: boolean;
    error: string | null;
    groupType: { [key: string]: string };
    currencies: { [key: string]: string };
    expenseTypes: { [key: string]: string };
    familyName: string | null;
    givenName: string | null;


    login: (loginEmail: string, loginPassword: string) => Promise<boolean>;
    loginWithGoogle: (googleId: string) => Promise<boolean>;
    register: (email: string, password: string, givenName: string, familyName: string) => Promise<boolean>;
    logout: () => void;
    resetError: () => void;
    updateUserInfo: (familyName: string, givenName: string, email: string) => void;
}

const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            email: null,
            id: null,
            name: null,
            familyName: null,
            givenName: null,
            exp: null,
            isLoading: false,
            error: null,
            groupType: {},
            currencies: {},
            expenseTypes: {},

            login: async (loginEmail, loginPassword) => {
                try {
                    set({isLoading: true, error: null});
                    let res = await api.post('/auth/login', {email: loginEmail, password: loginPassword});
                    const {token, email, id, name, familyName, givenName} = res.data;
                    const {exp} = jwtDecode(token);
                    set({token, email, id, name, familyName, givenName, exp});
                    res = await api.get('/common/group-types');
                    set({groupType: res.data});
                    res = await api.get('/common/currencies');
                    set({currencies: res.data});
                    res = await api.get('/common/expense-types');
                    set({expenseTypes: res.data});
                    return true;
                } catch (err: any) {
                    if (err.response.data.error) {
                        set({error: err.response.data.error});
                    } else {
                        set({error: "Network Error!"});
                    }
                    return false;
                } finally {
                    set({isLoading: false});
                }
            },

            loginWithGoogle: async (googleId) => {
                try {
                    set({isLoading: true, error: null});
                    let res = await api.post("/auth/google", {googleId});
                    const {token, email, id, name, familyName, givenName} = res.data;
                    const exp = jwtDecode(token).exp;
                    set({token, email, id, name, familyName, givenName, exp});
                    res = await api.get('/common/group-types');
                    set({groupType: res.data});
                    res = await api.get('/common/currencies');
                    set({currencies: res.data});
                    res = await api.get('/common/expense-types');
                    set({expenseTypes: res.data});
                    return true;
                } catch (err) {
                    set({error: 'Google login failed!'});
                    return false;
                } finally {
                    set({isLoading: false});
                }
            },

            register: async (registerEmail, registerPassword, registerGivenName, registerFamilyName) => {
                try {
                    set({isLoading: true, error: null});
                    let res = await api.post('/auth/register', {
                        email: registerEmail,
                        password: registerPassword,
                        givenName: registerGivenName,
                        familyName: registerFamilyName
                    });
                    const {token, email, id, name, familyName, givenName} = res.data;
                    const exp = jwtDecode(token).exp;
                    set({token, email, id, name, familyName, givenName, exp});
                    res = await api.get('/common/group-types');
                    set({groupType: res.data});
                    res = await api.get('/common/currencies');
                    set({currencies: res.data});
                    res = await api.get('/common/expense-types');
                    set({expenseTypes: res.data});
                    return true;
                } catch (err: any) {
                    if (err.response.data.error) {
                        set({error: err.response.data.error});
                    } else {
                        set({error: 'Network Error!'});
                    }
                    return false;
                } finally {
                    set({isLoading: false});
                }
            },
            updateUserInfo: async (newFamilyName, newGivenName, newEmail) => {
                const { familyName, givenName, email, id } = get();
                if (familyName != newFamilyName || givenName != newGivenName || email != newEmail) {
                    const res = await api.post(`/users/${id}`, {
                        email: newEmail,
                        givenName: newGivenName,
                        familyName: newFamilyName
                    });
                    const { token, email, name, familyName, givenName } = res.data;
                    const exp = jwtDecode(token).exp;
                    set({ token, email, name, familyName, givenName, exp });
                    message.success('User Information updated successfully!');
                }
            },
            logout: () => {
                set({
                    token: null,
                    email: null,
                    id: null,
                    name: null,
                    familyName: null,
                    givenName: null,
                    exp: null,
                    groupType: {},
                    currencies: {},
                    expenseTypes: {}
                });
                localStorage.removeItem('auth-storage');
            },
            resetError: () => set({error: null}),
        }),
        {
            name: 'auth-storage', // localStorage key
            partialize: (state) => ({
                token: state.token,
                email: state.email,
                id: state.id,
                name: state.name,
                familyName: state.familyName,
                givenName: state.givenName,
                exp: state.exp,
                groupType: state.groupType,
                currencies: state.currencies,
                expenseTypes: state.expenseTypes
            }),
        }
    )
);

export default useAuthStore;
