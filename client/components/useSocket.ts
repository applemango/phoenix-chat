import {Socket} from "phoenix"
import { useEffect, useState } from "react";

const useSocket = (token: string= "apple"):  [Socket | null, boolean, (token: string)=> void] => {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [connected, setConnected] = useState(false)
    const reset = (token: string) => {
        if(socket) {
            socket.disconnect()
        }
        let socket_ = new Socket("ws://127.0.0.1:4000/socket", {params: {token: token}, })
        socket_.connect()
        socket_.onOpen(()=> {
            setConnected(true)
        })
        socket_.onClose(()=> {
            setConnected(false)
        })
        socket_.onError((e)=> {
            if(!socket_.isConnected()) {
                socket_.disconnect()
                setConnected(false)
            }
        })
        setSocket(socket_)
    }
    useEffect(() => {
        if(!process.browser)
            return
        let socket = new Socket("ws://127.0.0.1:4000/socket", {params: {token: token}, })
        socket.connect()
        socket.onOpen(()=> {
            setConnected(true)
        })
        socket.onClose(()=> {
            setConnected(false)
        })
        socket.onError((e)=> {
            if(!socket.isConnected()) {
                socket.disconnect()
                setConnected(false)
            }
        })
        setSocket(socket)
    },[])
    return [socket, connected, reset]
}
export default useSocket;