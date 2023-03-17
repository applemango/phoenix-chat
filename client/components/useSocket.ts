import {Socket} from "phoenix"
import { useEffect, useState } from "react";

const useSocket = (token: string= "apple") => {
    const [socket, setSocket] = useState<Socket | null>(null)
    useEffect(() => {
        if(!process.browser)
            return
        let socket = new Socket("ws://127.0.0.1:4000/socket", {params: {token: token}, })
        socket.connect()
        setSocket(socket)
    },[])
    return socket
}
export default useSocket;