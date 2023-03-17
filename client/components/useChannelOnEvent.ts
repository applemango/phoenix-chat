import {Socket, Channel} from "phoenix"
import { useEffect } from "react";

const useChannelOnEvent = (
    name: string,
    handler: (msg: any) => void,
    channel: Channel | null,
) => {
    useEffect(() => {
        if(!(channel && name)) return
        channel.on(name, msg => handler(msg))
    },[channel])
}
export default useChannelOnEvent;