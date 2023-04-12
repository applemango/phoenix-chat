import { get, optionGet, optionPost, post } from "./fetch";
import { parseJwt } from "./token";

export class Auth {
    username: string | undefined = "";
    password: string | undefined = "";
    token: string | undefined = "";
    refreshToken: string | undefined = "";

    constructor(
        name?: string,
        pass?: string,
    ) {
        this.username = name;
        this.password = pass;

    }
    get rd() {
        if(!this.r)
            return null;
        return parseJwt(this.r)
    }
    get a() {
        let a_  = this.token;
        if (!(a_ && Date.now() >= parseJwt(a_).exp *1000) && a_) {
            return this.token
        }
        localStorage.removeItem("token")
        return null
    }
    get r() {
        let r = this.refreshToken;;
        if (!(r && Date.now() >= parseJwt(r).exp *1000) && r) {
            return this.refreshToken
        }
        localStorage.removeItem("refreshToken")
        localStorage.removeItem("token")
        return null
    }
    set(name: string, pass: string) {
        console.log(name, pass)
        this.username = name;
        this.password = pass;
    }
    async refresh() {
        if(!this.r)
            return false;
        const [res, status] = await post("/token/refresh", {
            header: {
                Authorization: `Bearer ${this.refreshToken}`
            },
            body: {}
        })
        if(!status) return false
        this.token = res.data.token;
        this.save()
        return true
    }
    async register() {
        if(!(this.username && this.password)) return false
        const [res, status] = await post("/user/register", {
            header: {},
            body: {
                username: this.username,
                password: this.password,
            }
        })
        if(!status) return false
        return true
    }
    async login() {
        if(!(this.username && this.password)) return false
        const [res, status] = await post("/token/create", {
            header: {},
            body: {
                username: this.username,
                password: this.password,
            }
        })
        if(!status) return false
        this.token = res.data.token,
        this.refreshToken = res.data.refresh_token
        this.save()
        return true
    }
    async get(url: string, option: optionGet = {
        header: {}
    }) {
        if(!this.r) return [false, false]
        if(!this.a) {
            const l = await this.refresh()
            if(!l) return [false, false]
        }
        if(!option.header.Authorization)
            option.header.Authorization = `Bearer ${this.a}`
        const [res, status] = await get(url, option)
        return [res, status]
    }
    async post(url: string, option: optionPost = {
        header: {},
        body: {}
    }) {
        if(!this.r) return [false, false]
        if(!this.a) {
            const l = await this.refresh()
            if(!l) return [false, false]
        }
        if(!option.header.Authorization)
            option.header.Authorization = `Bearer ${this.a}`
        const [res, status] = await post(url, option)
        return [res, status]
    }
    load() {
        let r = localStorage.getItem("refreshToken");
        let a  = localStorage.getItem("token")
        if (!(a && Date.now() >= parseJwt(a).exp *1000) && a) {
            this.token = a
        }
        if (!(r && Date.now() >= parseJwt(r).exp *1000) && r) {
            this.refreshToken = r
        }
    }
    save() {
        if(this.refreshToken)
            localStorage.setItem("refreshToken", this.refreshToken)
        if(this.token)
            localStorage.setItem("token", this.token)
        return
    }
}