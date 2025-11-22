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
const request = async (
    method: "get" | "post" | "patch" | "delete",
    url: string,
    data: any = {},
    params: Record<string, string | number | boolean> = {},
) => {
    try {
        const fullUrl = buildUrlWithParams(BASE_URL + url, params);

        const config = {
            method,
            url: fullUrl,
            data,
            headers: {
                "X-Client-Type": "mobile",
            },
        };

        return await axios(config);
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response;
        }
        console.error(`${method.toUpperCase()} request failed:`, error);
        throw error;
    }
};

// Exported functions
export const getData = (
    url: string,
    params: Record<string, string | number | boolean> = {},
) => request("get", url, {}, params);

export const postData = (
    url: string,
    data: any,
) => request("post", url, data, {});

export const patchData = (
    url: string,
    data: any,
) => request("patch", url, data, {});

export const deleteData = (
    url: string,
    params: Record<string, string | number | boolean> = {},
) => request("delete", url, {}, params);