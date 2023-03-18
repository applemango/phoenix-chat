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

  const [socket, connected, reset] = useSocket("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NzkwNTk3OTMsImV4cCI6MTY3OTA2MDY5MywibmJmIjoxNjc5MDU5NzkzLCJzdWIiOiIxIiwianRpIjoiYTkzOWZjNDgtZmJkNS00Njc4LWE5MTctM2VkZGI0ZWJhYjJkIiwicmVmcmVzaCI6ZmFsc2V9.b7p7IGGmCHg-CNyX9qdtTtba8Imj95s6mH42oAOIfPk")
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
    <button onClick={()=> {
      reset("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJKb2tlbiIsImV4cCI6MTY3OTA2MzM3OSwiaWF0IjoxNjc5MDU2MTc5LCJpc3MiOiJKb2tlbiIsImp0aSI6IjJ0Nmo5Y240OThqcXU5N241azAwMDAxNCIsIm5iZiI6MTY3OTA1NjE3OX0.tUCCx9fmWMh69XrD2y7OB1Z1IXKQY5aj_3eTSw3nWuM")
    }}>reset</button>
    <p>{connected.toString()}</p>
  </div>
}
