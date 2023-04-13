export type room = {
    name: string,
    color?: string,
    bcolor?: string,
    notification?: number,
}

export type message = {
    body: string,
    location: string,
    user_id: string,
    files: Array<message_file>
}

export type message_file = {
    type: string,
    path: string,
    token: string
}