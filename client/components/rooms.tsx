import { room } from "@/lib/msg"

export const RoomsMenu = ({rooms, room, onChange}:{
    rooms: Array<room>,
    room: string,
    onChange: (room: room) => void
}) => {
    return <div style={{
        backgroundColor: '#fff',
        boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px',
        padding: 4,
        position: 'relative',
        zIndex: 2,
    }}>
        {rooms.map((r, i)=> <div style={{
            height: 48,
            width: 48,
            backgroundColor: r.bcolor || '#eee',
            margin: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            border: room == r.name ? '3px solid #404258' : 'none',
            cursor: 'pointer'
        }} onClick={()=> onChange(r)}>
            <p style={{
                color: r.color || '#666',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                fontSize: 28,
                lineHeight: 1,
            }}>{r.name[0]}</p>
        </div>)}
    </div>
}