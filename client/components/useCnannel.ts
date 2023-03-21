import {Socket, Channel} from "phoenix"
import { useEffect, useState } from "react";

const useChannel = (
    socket: Socket | null,
    room: string = "lobby"
): [Channel | null, (room: string)=> void] => {
    const [channel, setChannel] = useState<Channel | null>(null);
    useEffect(() => {
        reset(room)
    },[socket])
    const reset = (room: string) => {
        if(!socket || !process.browser) return
        channel?.leave()
            .receive("ok", resp => { console.log("Leaved successfully", resp) })
            .receive("error", resp => { console.log("Unable to leave", resp) })
        let channel_ = socket.channel(`room:${room}`, {})
        channel_.join()
            .receive("ok", resp => { console.log("Joined successfully", resp) })
            .receive("error", resp => { console.log("Unable to join", resp) })
        setChannel(channel_)
    }
    return [channel, reset]
}
export default useChannel;