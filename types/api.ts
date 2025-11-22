export interface LoginPayload {
    external_id: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    users:{
        user_id: number;
        external_id: string;
        full_name: string;
        role: string;
    }
    access_token: string;
    refresh_token: string;
}

export interface AuthProps{
    authState?:{
        access_token: string;
        refresh_token: string;
        users:{
            user_id: number;
            external_id: string;
            full_name: string;
            role: string;
        }
        success: boolean;
        message: string;
    }
    onLogin?: (payload:LoginPayload) => Promise<void>;
    onLogout?: () => Promise<void>;
}