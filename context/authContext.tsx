import { LoginPayload, LoginResponse, LogoutResponse } from "@/types/api";
import { postData } from "@/utils/fetcher";
import { showToast } from "@/utils/toast/toast";
import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from "react";

interface AuthProps {
    authState?: {
        access_token: string | null;
        refresh_token: string | null;
        success: boolean | null;
        user: {
            user_id: number;
            external_id: string;
            full_name: string;
            role: string;
        } | null;
        isLoading: boolean; // Required, not optional
    };
    onLogin?: (payload: LoginPayload) => Promise<void>;
    onLogout?: () => Promise<void>;
}

const AuthContext = createContext<AuthProps>({});

export const useAuth = () => {
    return useContext(AuthContext);
}

export const AuthProvider = ({ children }: any) => {
    const [authState, setAuthState] = useState<{
        access_token: string | null;
        refresh_token: string | null;
        success: boolean | null;
        user: {
            user_id: number;
            external_id: string;
            full_name: string;
            role: string;
        } | null;
        isLoading: boolean;
    }>({
        access_token: null,
        refresh_token: null,
        success: null,
        user: null,
        isLoading: true,
    });

    useEffect(() => {
        const loadTokens = async () => {
            try {
                const access_token = await SecureStore.getItemAsync('access_token');
                const refresh_token = await SecureStore.getItemAsync('refresh_token');
                const user = await SecureStore.getItemAsync('user');

                if (access_token && refresh_token) {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
                    setAuthState({
                        access_token,
                        refresh_token,
                        success: true,
                        user: user ? JSON.parse(user) : null,
                        isLoading: false,
                    });
                } else {
                    // No tokens found - user is not authenticated
                    setAuthState({
                        access_token: null,
                        refresh_token: null,
                        success: null,
                        user: null,
                        isLoading: false,
                    });
                }
            } catch (error) {
                console.error('Error loading tokens:', error);
                setAuthState({
                    access_token: null,
                    refresh_token: null,
                    success: null,
                    user: null,
                    isLoading: false,
                });
            }
        };
        loadTokens();
    }, []);

    const login = async ({ external_id, password }: LoginPayload) => {
        if (!external_id || !password) {
            showToast({
                type: 'error',
                title: 'Login Failed',
                message: 'Please provide both external ID and password.'
            });
            return;
        }

        try {
            setAuthState(prev => ({ ...prev, isLoading: true }));

            const res = await postData<LoginResponse>('/auth/login', { external_id, password });
            const data = res.data;

            if (res.status === 200) {
                setAuthState({
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                    user: data.user,
                    success: data.success,
                    isLoading: false,
                });

                showToast({
                    type: 'success',
                    title: 'Login Successful',
                    message: data.message || 'Login successful.'
                });

                axios.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;

                await SecureStore.setItemAsync('access_token', data.access_token);
                await SecureStore.setItemAsync('refresh_token', data.refresh_token);
                await SecureStore.setItemAsync('user', JSON.stringify(data.user));
            } else if (res.status === 401 || res.status === 400) {
                console.log("Login failed with status:", res.status);

                showToast({
                    type: 'error',
                    title: 'Login Failed',
                    message: data.detail || "An error occurred during login."
                });
                setAuthState(prev => ({ ...prev, isLoading: false }));
            }
        } catch (error: any) {
            console.log("Login error caught:", error);

            showToast({
                type: 'error',
                title: 'Login Failed',
                message: error.message || 'Internal server error occurred during login.'
            });
            setAuthState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const logout = async () => {
        try {
            const refresh_token = await SecureStore.getItemAsync('refresh_token');
            if (!refresh_token) {
                // Clear local state even if no refresh token
                setAuthState({
                    access_token: null,
                    refresh_token: null,
                    success: null,
                    user: null,
                    isLoading: false,
                });
                return;
            }

            const res = await postData<LogoutResponse>('/auth/logout', {}, {
                Authorization: `Bearer ${refresh_token}`
            });
            const data = res.data;

            if (res.status === 200) {
                // Clear storage
                await SecureStore.deleteItemAsync('access_token');
                await SecureStore.deleteItemAsync('refresh_token');
                await SecureStore.deleteItemAsync('user');

                // Clear axios header
                delete axios.defaults.headers.common['Authorization'];

                // Update state
                setAuthState({
                    access_token: null,
                    refresh_token: null,
                    success: null,
                    user: null,
                    isLoading: false,
                });

                showToast({
                    type: 'success',
                    title: 'Logout Successful',
                    message: data.message || 'Logout successful.'
                });
            } else if (res.status === 401 || res.status === 400) {
                setAuthState({
                    access_token: null,
                    refresh_token: null,
                    success: null,
                    user: null,
                    isLoading: false,
                });

                showToast({
                    type: 'error',
                    title: 'Logout Failed',
                    message: data.detail || "An error occurred during logout."
                });
            }
        } catch (error: any) {
            setAuthState({
                    access_token: null,
                    refresh_token: null,
                    success: null,
                    user: null,
                    isLoading: false,
                });

            showToast({
                type: 'error',
                title: 'Logout Failed',
                message: error.message || 'Internal server error occurred during logout.'
            });
        }
    };

    const value = {
        onLogin: login,
        onLogout: logout,
        authState,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};