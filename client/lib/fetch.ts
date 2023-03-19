import axios, { AxiosError, AxiosResponse } from "axios";
import { url } from "./url";

type optionGet = {
    header: any;
}

type optionPost = {
    header: any;
    data: any;
}

export const get = async (link: string, options: optionGet = {
    header: {},
}): Promise<[AxiosResponse, true] | [any, false]> => {
    const u = url(link);
    options.header["Content-Type"] = "application/json";
    try {
        const res = await axios.get(
            u, {
                headers: options.header
            }
        )
        return [res, true];
    } catch (e: any) {
        return [e, false];
    }
}

export const post = async (link: string, options: optionPost = {
    header: {},
    data: {},
}) => {
    const u = url(link);
    options.header["Content-Type"] = "application/json";
    try {
        const res = await axios.post(
            u, JSON.stringify(options.data), {
                headers: options.header
            }
        )
        return [res, true];
    } catch (e: any) {
        return [e, false];
    }
}