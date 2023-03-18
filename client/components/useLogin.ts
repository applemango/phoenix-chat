import { Auth } from "@/lib/auth";
import { useEffect, useState } from "react";

const useAuth = ():[Auth | null, boolean] => {
    const [auth, setAuth] = useState<Auth | null>(null)
    const [login, setLogin] = useState<boolean>(false)
    useEffect(()=> {const a = async () => {
        const auth_ = new Auth()
        auth_.load()
        if(auth_.token) {
            setLogin(true)
            return setAuth(auth_)
        }
        if(auth_.refreshToken) {
            const r = await auth_.refresh()
            if(!r)
                return setAuth(auth_)
            setLogin(true)
            return setAuth(auth_)
        }
        return setAuth(auth_)
    };a()},[])
    return [auth, login]
}
export default useAuth;
// authorization