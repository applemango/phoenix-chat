import {Socket, Channel} from "phoenix"
import { useEffect, useState } from "react";

const useChannel = (socket: Socket | null) => {
    const [channel, setChannel] = useState<Channel | null>(null);
    useEffect(() => {
        if(!process.browser)
            return
        if(!socket)
            return
        let channel = socket.channel("room:lobby", {})
        channel.join()
            .receive("ok", resp => { console.log("Joined successfully", resp) })
            .receive("error", resp => { console.log("Unable to join", resp) })
        setChannel(channel)
    },[socket])
    return channel
}
export default useChannel;;