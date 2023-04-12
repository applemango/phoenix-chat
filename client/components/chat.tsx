import { Auth } from "@/lib/auth"
import { post } from "@/lib/fetch"
import { message } from "@/lib/msg"
import { Channel } from "phoenix"
import { useEffect, useRef, useState } from "react"
import useChannelOnEvent from "./useChannelOnEvent"

export const SingleColorIcon = ({id, size = 38}:{
    id: number | string,
    size?: number
}) => {
    const colors = ['#F9ED69','#F08A5D','#B83B5E','#6A2C70',]
    const color = colors[Number(id) + 1 % colors.length]
    return <div style={{
        backgroundColor: color,
        width: size,
        height: size,
        borderRadius: '100%'
    }} />
}

export const Message = ({message}:{
    message: message
}) => {
    return <div style={{
        display: 'flex',
        padding: 2
    }}>
        <div style={{
            marginRight: 10
        }}>
            <SingleColorIcon id={message.user_id} />
        </div>
        <div>
            <p style={{
                fontWeight: 'bold'
            }}>{message.user_id}</p>
            <p>{message.body}</p>
        </div>
    </div>
}

export const Chat = ({messages, style}:{
    messages: Array<message>,
    style?: React.CSSProperties,
}) => {
    return <div style={Object.assign({
        padding: 12
    } as React.CSSProperties,style)}>
        {messages.map((msg, i) => <Message key={i} message={msg} />)}
    </div>
}
export const Input = ({value, onChange, onPostImage, onSubmit, style}:{
    value: string,
    onChange: (value: string) => void,
    onPostImage: (file: File) => any,
    onSubmit: (value: string, file_name: string) => void,
    style?: {
        container: React.CSSProperties,
        element: React.CSSProperties
    }
}) => {
    const ref = useRef<any>(null)
    const [file_name, setFileName] = useState("")
    return <div style={style?.container}>
        <button style={{
            width: 30,
            height: 30,
            backgroundColor: '#eee',
            borderRadius: '100%',
            border: 'none',
            margin: '0 6px',
            cursor: 'pointer'
        }} onClick={()=> {
            ref?.current?.click()
        }}>
        </button>
        <input style={{
            display: 'none'
        }} ref={ref} type="file" onChange={async (e: any)=> {
            const file = e.target.files[0]
            const file_name = await onPostImage(file)
            setFileName(file_name)
            /*const file = e.target.files[0]
            const [res, status] = await post("/", {
                data: file,
                header: {},
                is_json: false
            })
            console.log(file)*/
        }} />
        <textarea style={style?.element} value={value} onChange={(e: any)=> {
            const value = e.target.value
            if(e.target.value.slice(-1) == "\n") {
                onChange("")
                onSubmit(value.slice(0,-1), file_name)
                return
            }
            onChange(e.target.value)
        }} placeholder='say something' />
    </div>
}
export const Room = ({auth, channel, room, channel_name}:{
    auth: Auth | null,
    channel: Channel | null,
    room: string,
    channel_name: string
}) => {
    const [input, setInput] = useState("")
    const [messages, setMessages] = useState<Array<message>>([])
    useChannelOnEvent(room, msg => {
        setMessages((msgs) => [...msgs, msg])
        console.log(msg)
    }, channel)
    useEffect(()=> {const a = async () => {
        if(!auth) return
        const [res, status] = await auth.get(`/messages/${channel_name}`)
        if(!status) return
        console.log(res.data)
        setMessages(res.data)
    };a()},[channel])
    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100vh',
        width: '100%',
    }}>
        <Chat style={{
            width: '100%',
            height: "calc(100vh - 100px)",
            overflowY: 'auto',
        }} messages={messages} />
        <Input style={{
            container: {
                height: 80,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fff',
                borderTop: '1px solid #eee'
            },
            element: {
                height: 64,
                width: "96%",
                fontSize: 32,
                backgroundColor: '#fff',
                border: '1px solid #eee',
                padding: '8px 16px',
                borderRadius: 12,
                resize: "none"
            }
        }} value={input} onChange={setInput} onSubmit={async (value)=> {
            if(!(channel && value && auth)) return
            if(!auth.a) {
                const res = await auth.refresh()
                if(!(res && auth.a)) return
            }
            channel.push(room, {body: value, token: auth.a})
            if(auth) {
                await auth.post(`/messages/${channel_name}`, {body: {body: value}, header:{}})
            }
        }} onPostImage={async (file)=> {
            if(!auth || !auth.r) return
            const [res, status] = await auth.post(`/messages/${channel_name}/image`, {
                body: file,
                header: {},
                is_json: false
            })
            console.log(file, res, status)
            return res.data
        }} />
    </div>
}