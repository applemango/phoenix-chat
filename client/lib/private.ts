export type friend = {
    room: string,
    user_id: number
}
export type friendSimple = {
    user_id: number
}
export type friendsReq = {
    request: Array<friendSimple>,
    response: Array<friendSimple>
}