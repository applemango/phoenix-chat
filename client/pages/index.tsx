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
import { friend, friendsReq } from '@/lib/private'
import FriendsMenu from '@/components/friends'

export default function Home() {
  const [rooms, setRooms] = useState<Array<room>>([{name: "lobby",bcolor: '#19A7CE',color: '#F6F1F1',notification: 0},{name: "test",bcolor: '#9E4784',color: '#F6F1F1',notification: 0},{name: "apple",bcolor: '#eee',color: '#555',notification: 0}])

  const [auth, login] = useAuth()

  const [privateRoom, setPrivateRoom] = useState<boolean>(false)
  
  const [socket, connected, resetSocket] = useSocket("")
  const [room, setRoom] = useState("")
  const [channel, resetChannel] = useChannel(socket, "")
  const [notificationChannel, resetNotificationChannel] = useNotification(socket, "lobby", ["lobby"])

  const [friendChannel, resetFriendChannel] = useChannel(socket, "")

  const [friends, setFriends] = useState<Array<friend>>([])
  const [friendsReq, setFriendsReq] = useState<friendsReq | null>(null)

  useEffect(()=> {
    if(privateRoom || !room)
      return
    resetChannel(room)
  },[room])

  const router = useRouter()

  useEffect(()=> {
    if(!auth || !auth.a)
      return
    resetSocket(auth.a)
    const _ = async () => {
      const a = async () => {
        const [res, status] = await auth.get("/user/friends")
        if(!status) return
        setFriends(res.data)
      };await a()
      const b = async () => {
        const [res, status] = await auth.get("/user/friends/requests")
        if(!status) return
        setFriendsReq(res.data)
      };await b()
    }
    _()
  },[login])

  useEffect(()=> {
    if(notificationChannel || !auth?.r || !socket || !connected)
      return
    resetNotificationChannel(auth.r, (new Array(rooms.length).fill(0).map((_, i)=> rooms[i].name)))
    resetFriendChannel(auth.rd.sub, auth.r, "friend")
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
  },notificationChannel)

  return <div style={{
    display: 'flex',
  }}>
    <RoomsMenu onChange={async (d?: any, t?: boolean)=> {
      if(!d) {
        setRoom("")
        return
      }
      if(!t) {
        setPrivateRoom(false)
        setRoom(d.name)
        setRooms(rs => rs.map((r_, i)=> {
          if(r_.name != d.name) 
            return r_
          r_.notification = 0
          return r_
        }))
        return
      }
      if(!auth)
        return
      const [res, status] = await auth.get(`/user/friends/${d.user_id}/token`)
      if(!status)
        return
      setPrivateRoom(true)
      setRoom(d.room)
      resetChannel(d.room, res.data.token, "private")
    }} users={friends} room={room} rooms={rooms} />
    {!room 
      ? <FriendsMenu
          auth={auth}
          channel={friendChannel}
          friends={friends}
          friendsReq={friendsReq}
          setFriends={setFriends}
          setFriendsReq={setFriendsReq}
        />
      : <Room
          auth={auth}
          channel={channel}
          channel_name={room}
          room={"new_msg"}
        />
    }
  </div>
}
