import { Auth } from "@/lib/auth";
import { friend, friendsReq } from "@/lib/private";
import { Channel } from "phoenix";
import { useEffect, useState } from "react";
import useChannelOnEvent from "./useChannelOnEvent";

const FriendsMenu = ({channel, auth, friends, setFriends, friendsReq, setFriendsReq}:{
    channel: Channel | null,
    auth: Auth | null,
    friends: Array<friend> | null,
    setFriends: Function,
    friendsReq: friendsReq | null,
    setFriendsReq: Function,
}) => {
    const [userId, setUserId] = useState("")
    const request = async (id: number | string) => {
        if(!auth)
            return
        const [_, st] = await auth.post(`/user/friends/${id}/request`)
        if(st)
            channel?.push("request", {token: auth?.r, user_id: Number(id)})
        await reload()
    }
    const response = async (id: number | string, status: number) => {
        if(!auth)
            return
        const [_, st] = await auth.post(status === 2 ? `/user/friends/${id}/reject` : `/user/friends/${id}/accept`)
        if(st)
            channel?.push("response", {token: auth?.r, user_id: Number(id), status: status})
        await reload()
    }
    const reload = async () => {
        if(!auth)
            return
        const [res, status] = await auth.get("/user/friends") 
        const [res_, status_] = await auth.get("/user/friends/requests") 
        if(!(status && status_))
            return
        setFriends(res.data)
        setFriendsReq(res_.data)
    }
    useChannelOnEvent("request", async (msg)=> {
        await reload()
        console.log(msg);
    }, channel);
    useChannelOnEvent("response", async (msg)=> {
        await reload()
        console.log(msg);
    }, channel);
    useEffect(()=> {
        console.log(friendsReq, friends)
    },[friendsReq, friends])
    return <div>
        <h1>hey user:{auth?.rd?.sub}</h1>
        <input type="number" onChange={(e:any)=> setUserId(e.target.value)} value={userId} />
        <button onClick={()=> {
            request(Number(userId))
            //channel?.push("request", {token: auth?.r, user_id: 1})
        }}>REQUEST</button>
        {/*<button onClick={()=> {
            response(2, 1)
            //channel?.push("response", {token: auth?.r, user_id: 2, status: 1})
        }}>RESPONSE</button>*/}
        
        <h1>requests</h1>
        {friendsReq?.request.map((friend)=>
            <p>{friend.user_id}</p>
        )}
        <h1>response</h1>
        {friendsReq?.response.map((friend)=>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <p>{friend.user_id}</p>
                <div>
                    <button onClick={()=> {
                        response(friend.user_id, 1)
                    }}>accept</button>
                    <button onClick={()=> {
                        response(friend.user_id, 2)
                    }}>reject</button>
                </div>
            </div>
        )}
    </div>
}
export default FriendsMenu;