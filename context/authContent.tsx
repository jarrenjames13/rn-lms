// import { LoginPayload } from "@/types/api"

interface AuthProps{
authState?: {
    access_token: string;
    refresh_token: string;
    success: boolean;
}
onLogin?:(
    external_id:string,
    password:string
) => Promise<void>;
onLogout?:() => Promise<void>;
}

