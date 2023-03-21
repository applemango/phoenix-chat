import { Channel, Socket } from "phoenix"
import { useEffect, useState } from "react"
import useChannelOnEvent from "./useChannelOnEvent";

const useNotification = (socket: Socket | null, room: string, rooms: Array<String>): [Channel | null, (room: string, rooms: Array<string>)=> void] => {
    const [channel, setChannel] = useState<Channel | null>(null);

    const reset = (room: string, rooms: Array<String>) => {
        if(!socket) return
        if(channel) {
            channel.leave()
                .receive("ok", resp => { console.log("Leaved successfully", resp) })
                .receive("error", resp => { console.log("Unable to leave", resp) })
        }
        let channel_ = socket.channel(`notification:${room}`, {
            ids: rooms
        })
        channel_.join()
            .receive("ok", resp => { console.log("Notification: Joined successfully", resp) })
            .receive("error", resp => { console.log("Notification: Unable to join", resp) })
        setChannel(channel_)
    }

    useEffect(()=> {
    },[socket])
    return [channel, reset]
}
export default useNotification;