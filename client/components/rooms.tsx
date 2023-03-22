import { room } from "@/lib/msg"
import { friend } from "@/lib/private"
import { SingleColorIcon } from "./chat"

export const RoomsMenu = ({rooms, users, room, onChange}:{
    rooms: Array<room>,
    users: Array<friend>
    room: string,
    onChange: (room?: room | friend, friend?: boolean) => void,
}) => {
    return <div style={{
        backgroundColor: '#fff',
        boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px',
        padding: 4,
        position: 'relative',
        zIndex: 2,
        height: '100vh',
    }}>
        <div style={{
            marginRight: 6,
            marginLeft: 6,
            width: 48,
            height: 48,
            backgroundColor: '#eee',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
        }} onClick={()=> onChange()}/>
        <div style={{
            width: 'calc(100% - 12px)',
            height: 2,
            borderRadius: 10,
            backgroundColor: '#0002',
            margin: '8px 6px'
        }} />
        {users.map((u, i)=> <div key={i} style={{
            width: 48,
            height: 48,
            marginLeft: 6,
            marginRight: 6,
            cursor: 'pointer'
        }} onClick={()=> onChange(u, true)}>
            <SingleColorIcon size={48} id={u.user_id} />
        </div>)}
        <div style={{
            width: 'calc(100% - 12px)',
            height: 2,
            borderRadius: 10,
            backgroundColor: '#0002',
            margin: '8px 6px'
        }} />
        {rooms.map((r, i)=> <div key={i} style={{
            height: 48,
            width: 48,
            backgroundColor: r.bcolor || '#eee',
            margin: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            border: room == r.name ? '3px solid #404258' : 'none',
            cursor: 'pointer',
            position: 'relative'
        }} onClick={()=> onChange(r, false)}>
            <p style={{
                color: r.color || '#666',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                fontSize: 28,
                lineHeight: 1,
            }}>{r.name[0]}</p>
            {!!r.notification &&
            <div style={{
                position: 'absolute',
                top: -6,
                backgroundColor: '#222',
                padding: `2px 4px 2px ${r.notification?.toString().length == 1 ? 5.5 : 4.5}px`,
                border: '1px solid #888',
                borderRadius: 10,
                right: -8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 11,
                width: r.notification?.toString().length == 1 ? 22.469 : 'fit-content',
            }}>
                <p style={{
                    fontSize: 11,
                    width: 'fit-content',
                    color: '#eee',
                    lineHeight: 1,
                }}>{r.notification}</p>
            </div>}
        </div>)}
    </div>
}