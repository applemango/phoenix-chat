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
import { RoomsMenu } from '@/components/rooms'
import useNotification from '@/components/useNotification'
import { message, room } from '@/lib/msg'

export default function Home() {
  const [msg, setMsg] = useState("")
  const [msgs, setMsgs] = useState<Array<string>>([])

  const [rooms, setRooms] = useState<Array<room>>([
    {
      name: "lobby",
      bcolor: '#19A7CE',
      color: '#F6F1F1',
      notification: 0
    },
    {
      name: "test",
      bcolor: '#9E4784',
      color: '#F6F1F1',
      notification: 0
    },
    {
      name: "apple",
      bcolor: '#eee',
      color: '#555',
      notification: 0
    }
  ])

  const [auth, login] = useAuth()
  
  const [socket, connected, resetSocket] = useSocket("")
  const [room, setRoom] = useState("lobby")
  const [channel, resetChannel] = useChannel(socket, "lobby")
  const [nchannel, resetNotification] = useNotification(socket, "lobby", ["lobby"])

  useEffect(()=> {
    resetChannel(room)
  },[room])

  const router = useRouter()

  useEffect(()=> {
    if(!auth || !auth.a)
      return
    resetSocket(auth.a)
  },[login])

  useEffect(()=> {
    if(nchannel || !auth?.r || !socket || !connected)
      return
    resetNotification(auth.r, (new Array(rooms.length).fill(0).map((_, i)=> rooms[i].name)))
  },[connected])

  useEffect(()=> {
    if(auth && !login)
      router.push("/login")
  })

  useChannelOnEvent("new_msg", (msg)=> {
    const topic = msg.from.topic.split(":")[1]
    let room;
    setRoom((r)=> {
      room = r
      return r
    })
    if(topic == room)
      return
    setRooms(rooms=> rooms.map(room =>{
      if(topic != room.name)
        return room
      room.notification =
        room.notification
          ? room.notification + 1
          : 1
      return room
    }))
  },nchannel)

  return <div style={{
    display: 'flex',
  }}>
    <RoomsMenu onChange={(r)=> {
      setRoom(r.name)
      setRooms(rs => rs.map((r_, i)=> {
        if(r_.name != r.name) 
          return r_
        r_.notification = 0
        return r_
      }))
    }} room={room} rooms={rooms} />
    <Room auth={auth} channel={channel} channel_name={room} room={"new_msg"} />
  </div>
}
