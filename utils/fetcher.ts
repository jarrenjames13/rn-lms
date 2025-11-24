import axios from "axios";
import { BASE_URL } from "../utils/constants";

// Helper to build URL with query parameters

const buildUrlWithParams = (
    url: string,
    params: Record<string, string | number | boolean> = {}
): string => {
    const queryString = new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)])
    ).toString();
    return queryString ? `${url}?${queryString}` : url;
};

// Unified request function
const request = async <T = any>(
    method: "get" | "post" | "patch" | "delete",
    url: string,
    data?: any,
    params: Record<string, string | number | boolean> = {},
    headers: Record<string, string> = {}
) => {
    try {
        const fullUrl = buildUrlWithParams(BASE_URL + url, params);

        const config = {
            method,
            url: fullUrl,
            data,
            headers: {
                "X-Client-Type": "mobile",
                ...headers,
            },
        };

        const res = await axios<T>(config);
        return res;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response
        }
        throw error;
    }
};



// Exported functions
export const getData = <T = any>(
    url: string,
    params: Record<string, string | number | boolean> = {},
    headers: Record<string, string> = {}
) => request<T>("get", url, {}, params, headers);

export const postData = <T = any>(
    url: string,
    data: any,
    headers: Record<string, string> = {}
) => request<T>("post", url, data, {}, headers);

export const patchData = <T = any>(
    url: string,
    data: any,
    headers: Record<string, string> = {}
) => request<T>("patch", url, data, {}, headers);

export const deleteData = <T = any>(
    url: string,
    params: Record<string, string | number | boolean> = {},
    headers: Record<string, string> = {}
) => request<T>("delete", url, {}, params, headers);
