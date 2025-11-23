import { LoginPayload, LoginResponse } from "@/types/api";
import { postData } from "@/utils/fetcher";
import { showToast } from "@/utils/toast/toast";
import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from "react";

interface AuthProps{
authState?: {
    access_token: string | null;
    refresh_token: string | null;
    success: boolean | null;
    user:{
        user_id: number;
        external_id: string;
        full_name: string;
        role: string;
    }| null;
    message: string| null;
};
onLogin?:(payload:LoginPayload) => Promise<void>;
onLogout?:() => Promise<void>;
}

const AuthContext = createContext<AuthProps>({});

export const useAuth =() =>{
    return useContext(AuthContext);
}

export const AuthProvider =({children}:any) =>{
    const [authState, setAuthState] = useState<{
        access_token: string | null;
        refresh_token: string | null;
        success: boolean | null;
        user:{
            user_id: number;
            external_id: string;
            full_name: string;
            role: string;
        }| null;
        message: string| null;
    } >({
        access_token: null,
        refresh_token: null,
        success: null,
        user: null,
        message: null,
    });

    useEffect(() => {
        const loadTokens = async () => {
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
                    message: null,
                });
            }
    }
        loadTokens();
    }, [])

    const login = async ({external_id, password}: LoginPayload) =>{
        if( !external_id || !password) {
            showToast({
                type: 'error',
                title: 'Login Failed',
                message: 'Please provide both external ID and password.'
            })
            return;
        }
        try {
            const res = await postData<LoginResponse>('/auth/login',{external_id, password});
            const data = res.data;
            if(data.success){
                setAuthState({
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                    user: data.user,
                    success: data.success,
                    message: data.message,
                });
                showToast({
                    type: 'success',
                    title: 'Login Successful',
                    message: data.message
                });
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;

            await SecureStore.setItemAsync('access_token', data.access_token);
            await SecureStore.setItemAsync('refresh_token', data.refresh_token);
            await SecureStore.setItemAsync('user', JSON.stringify(data.user));
            }
        else{
            showToast({
                type: 'error',
                title: 'Login Failed',
                message: data.detail || "An error occurred during login."
            });
        }
        } catch (error: any) {
            showToast({
                type: 'error',
                title: 'Login Failed',
                message: error.message|| 'Internal server error occurred during login.'
            });
        }
    }

    const logout = async () =>{
        try {
            const refresh_token = await SecureStore.getItemAsync('refresh_token');
            if(!refresh_token) return;

            const res = await postData('/auth/logout',{},{
                Authorization: `Bearer ${refresh_token}`
            });
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('refresh_token');
            setAuthState({
                access_token: null,
                refresh_token: null,
                success: null,
                user: null,
                message: null,
            });
        } catch (error: any) {
            showToast({
                type: 'error',
                title: 'Logout Failed',
                message: error.message || 'Internal server error occurred during logout.'
            });
        }
    }

    const value ={
        onLogin: login,
        onLogout: logout,
        authState,
    };
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}




















