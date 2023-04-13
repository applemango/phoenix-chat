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
export const Input = ({value, onChange, onPostImage, onSubmit}:{
    value: string,
    onChange: (value: string) => void,
    onPostImage: (file: File, id: number) => any,
    onSubmit: (value: string) => any,
}) => {
    const ref = useRef<any>(null)
    const [files, setFiles] = useState<Array<File>>([])
    const [image_preview, setImagePreview] = useState<Array<string>>([])
    return <div style={{
        width: '100%',
        backgroundColor: '#fff',
        borderTop: '1px solid #eee',
        padding: '8px 16px'
    }}>
        <div style={{
            display: 'flex',
        }}>
            {image_preview.map((image, i) => <div key={i}>
                <img style={{
                    width: 100,
                    height: 100,
                    borderRadius: 4,
                    marginBottom: 8,
                    marginRight: 8,
                    objectFit: 'cover'
                }} src={image} />
            </div>)}
        </div>
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
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
            }} ref={ref} multiple type="file" onChange={async (e: any)=> {
                const files_ = e.target.files
                setFiles(files_)
                setImagePreview(()=> {
                    const urls: any = []
                    for (let i = 0; i < files_.length; i++) {
                        const file = files_[i];
                        urls.push(window.URL.createObjectURL(file))
                    }
                    return urls
                })
                console.log(files_)
                //const file_name = await onPostImage(file)
                //setFileName(file_name)
                /*const file = e.target.files[0]
                const [res, status] = await post("/", {
                    data: file,
                    header: {},
                    is_json: false
                })
                console.log(file)*/
            }} />
            <textarea style={{
                height: 64,
                width: "96%",
                fontSize: 32,
                backgroundColor: '#fff',
                border: '1px solid #eee',
                padding: '8px 16px',
                borderRadius: 12,
                resize: "none"
            }} value={value} onChange={async (e: any)=> {
                const value = e.target.value
                if(e.target.value.slice(-1) == "\n") {
                    onChange("")
                    const res = await onSubmit(value.slice(0,-1))
                    if(!res?.id)
                        return
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        await onPostImage(file, res.id)
                    }
                    setFiles([])
                    setImagePreview([])
                    console.log(res)
                    return
                }
                onChange(e.target.value)
            }} placeholder='say something' />
        </div>
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
            height: '100%',
            overflowY: 'auto',
        }} messages={messages} />
        <Input value={input} onChange={setInput} onSubmit={async (value)=> {
            if(!(channel && value && auth)) return null
            if(!auth.a) {
                const res = await auth.refresh()
                if(!(res && auth.a)) return null
            }
            channel.push(room, {body: value, token: auth.a})
            const [res, status] = await auth.post(`/messages/${channel_name}`, {body: {body: value}, header:{}})
            return res.data
        }} onPostImage={async (file, id)=> {
            if(!auth || !auth.r) return
            const [res, status] = await auth.post(`/messages/${channel_name}/${id}/image`, {
                body: file,
                header: {},
                is_json: false
            })
            console.log(file, res, status)
            return res.data
        }} />
    </div>
}