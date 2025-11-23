export interface LoginPayload {
    external_id: string;
    password: string;
}

interface LoginResponseSuccess {
  success: true;
  message: string;
  user: { user_id: number; external_id: string; full_name: string; role: string };
  access_token: string;
  refresh_token: string;
}

interface LoginResponseError {
  success: false;
  detail: string;
}

export type LoginResponse = LoginResponseSuccess | LoginResponseError;