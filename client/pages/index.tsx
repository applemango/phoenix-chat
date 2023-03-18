import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import { useEffect, useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

import {Socket} from "phoenix"
import useSocket from '@/components/useSocket'
import useChannel from '@/components/useCnannel'
import useChannelOnEvent from '@/components/useChannelOnEvent'
import useAuth from '@/components/useLogin'
import { useRouter } from 'next/router'
import { Room } from '@/components/chat'
export default function Home() {
  const [msg, setMsg] = useState("")
  const [msgs, setMsgs] = useState<Array<string>>([])

  const [auth, login] = useAuth()
  
  const [socket, connected, resetSocket] = useSocket("")
  const [channel, resetChannel] = useChannel(socket, "lobby")

  const router = useRouter()

  useEffect(()=> {
    if(!auth || !auth.token)
      return
    resetSocket(auth.token)
  },[login])

  useEffect(()=> {
    if(auth && !login)
      router.push("/login")
  })

  return <div>
    <Room channel={channel} room={"new_msg"} />
    <button onClick={()=> {
      resetChannel("test")
    }}>change</button>
  </div>
  /*useChannelOnEvent("new_msg", msg => {
    setMsgs((msgs) => [...msgs, msg.body])
    console.log(msg)
  }, channel)

  useEffect(()=> {
    if(!auth || !auth.token)
      return
    reset(auth.token)
  },[login])

  useEffect(()=> {
    if(auth && !login)
      router.push("/login")
  })

  return <div>
    {<p>{connected.toString()} {login.toString()}</p>
    <input type="text"
      value={msg}
      onChange={(e: any)=> setMsg(e.target.value)}
    />
    <button onClick={()=> {
      setMsg("")
      if(!(channel && msg)) return
      channel.push("new_msg", {body: msg})
    }}>send</button>
    <button onClick={()=> {
      reset("")
    }}>reset</button>
    
    <div>
      {msgs.map((msg, i) => <p key={i}>{msg}</p>)}
  </div>}
  
  </div>*/
}
