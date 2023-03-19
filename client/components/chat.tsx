import { Auth } from "@/lib/auth"
import { message } from "@/lib/msg"
import { Channel } from "phoenix"
import { useEffect, useState } from "react"
import useChannelOnEvent from "./useChannelOnEvent"

export const Message = ({message}:{
    message: message
}) => {
    return <div>
        <p>{message.body}</p>
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
export const Input = ({value, onChange, onSubmit, style}:{
    value: string,
    onChange: (value: string) => void,
    onSubmit: (value: string) => void,
    style?: {
        container: React.CSSProperties,
        element: React.CSSProperties
    }
}) => {
    return <div style={style?.container}>
        <textarea style={style?.element} value={value} onChange={(e: any)=> {
            const value = e.target.value
            if(e.target.value.slice(-1) == "\n") {
                onChange("")
                onSubmit(value.slice(0,-1))
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
                height: 54,
                width: "96%",
                fontSize: 32,
                backgroundColor: '#fff',
                border: '1px solid #eee',
                padding: '8px 16px',
                borderRadius: 12,
                resize: "none"
            }
        }} value={input} onChange={setInput} onSubmit={async (value)=> {
            if(!(channel && value)) return
            channel.push(room, {body: value})
            if(auth) {
                await auth.post(`/messages/${channel_name}`, {body: value})
            }
        }} />
    </div>
}