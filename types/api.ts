export interface LoginPayload {
    external_id: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    user:{
        user_id: number;
        external_id: string;
        full_name: string;
        role: string;
    }
    access_token: string;
    refresh_token: string;
}

