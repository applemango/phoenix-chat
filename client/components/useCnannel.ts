import {Socket, Channel} from "phoenix"
import { useEffect, useState } from "react";

const useChannel = (
    socket: Socket | null,
    room: string = "lobby",
    reload: boolean = true,
    privates: boolean = false
): [Channel | null, (room: string, token?: string, privates?: boolean) => void] => {
    const [channel, setChannel] = useState<Channel | null>(null);
    useEffect(() => {
        if(!reload)
            return
        if(!room)
            return
        reset(room, undefined, privates)
    },[socket])
    const reset = (room: string, token?: string, privates?: boolean) => {
        if(!socket || !process.browser) return
        channel?.leave()
            .receive("ok", resp => { console.log("Leaved successfully", resp) })
            .receive("error", resp => { console.log("Unable to leave", resp) })
        let channel_ = socket.channel(`${(privates || token) ? "private" : "room"}:${room}`, token ? {
            token: token
        }:{})
        channel_.join()
            .receive("ok", resp => { console.log("Joined successfully", resp) })
            .receive("error", resp => { console.log("Unable to join", resp) })
        setChannel(channel_)
    }
    return [channel, reset]
}
export default useChannel;