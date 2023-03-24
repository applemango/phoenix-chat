import {Socket, Channel} from "phoenix"
import { useEffect, useState } from "react";

const useChannel = (
    socket: Socket | null,
    room: string = "lobby",
    reload: boolean = true,
    base: string = "room"
): [Channel | null, (room: string, token?: string, base?: string) => void] => {
    const [channel, setChannel] = useState<Channel | null>(null);
    useEffect(() => {
        if(!reload)
            return
        if(!room)
            return
        reset(room, undefined, base)
    },[socket])
    const reset = (room: string, token?: string, base: string = "room") => {
        if(!socket || !process.browser) return
        channel?.leave()
            .receive("ok", resp => { console.log("Leaved successfully", resp) })
            .receive("error", resp => { console.log("Unable to leave", resp) })
        let channel_ = socket.channel(`${base}:${room}`, token ? {
            token: token
        }:{})
        channel_.join()
            .receive("ok", resp => { console.log("Joined successfully: ".concat(base,":",room), resp) })
            .receive("error", resp => { console.log("Unable to join", resp) })
        setChannel(channel_)
    }
    return [channel, reset]
}
export default useChannel;