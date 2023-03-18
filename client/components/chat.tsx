import { message } from "@/lib/msg"
import { Channel } from "phoenix"
import { useState } from "react"
import useChannelOnEvent from "./useChannelOnEvent"

export const Chat = ({messages, style}:{
    messages: Array<message>,
    style?: React.CSSProperties,
}) => {
    return <div style={Object.assign({
    } as React.CSSProperties,style)}>
        {messages.map((msg, i) => <div key={i}>
            <p>{msg.body}</p>
        </div>)}
    </div>
}
export const Input = ({value, onChange, onSubmit}:{
    value: string,
    onChange: (value: string) => void,
    onSubmit: (value: string) => void,
}) => {
    return <div>
        <textarea value={value} onChange={(e: any)=> {
            const value = e.target.value
            if(e.target.value.slice(-1) == "\n") {
                onChange("")
                onSubmit(value.slice(0,-1))
                return
            }
            onChange(e.target.value)
        }} />
    </div>
}
export const Room = ({channel, room}:{
    channel: Channel | null,
    room: string
}) => {
    const [input, setInput] = useState("")
    const [messages, setMessages] = useState<Array<message>>([])
    useChannelOnEvent(room, msg => {
        setMessages((msgs) => [...msgs, msg])
        console.log(msg)
    }, channel)
    return <div>
        <Chat messages={messages} />
        <Input value={input} onChange={setInput} onSubmit={(value)=> {
            if(!(channel && value)) return
            channel.push(room, {body: value})
        }} />
    </div>
}