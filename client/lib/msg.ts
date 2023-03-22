export type room = {
    name: string,
    color?: string,
    bcolor?: string,
    notification?: number,
}

export type message = {
    body: string,
    location: string,
    user_id: string
}