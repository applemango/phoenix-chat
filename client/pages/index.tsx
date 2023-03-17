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

export default function Home() {
  const [msg, setMsg] = useState("")

  const socket = useSocket("apple")
  const channel = useChannel(socket)

  useChannelOnEvent("new_msg", msg => {
    console.log(msg)
  }, channel)

  return <div>
    <input type="text"
      value={msg}
      onChange={(e: any)=> setMsg(e.target.value)}
    />
    <button onClick={()=> {
      setMsg("")
      if(!(channel && msg)) return
      channel.push("new_msg", {body: msg})
    }}>send</button>
  </div>
}
