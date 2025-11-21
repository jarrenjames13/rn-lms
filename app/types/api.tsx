export interface LoginPayload {
    external_id: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    users:{
        id: number;
        external_id: string;
        full_name: string;
        role: string;
    }
}