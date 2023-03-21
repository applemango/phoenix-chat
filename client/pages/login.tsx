import useAuth from "@/components/useLogin";
import { useRouter } from "next/router";

export default function Login() {
    const [auth, login] = useAuth()
    const router = useRouter()
    const LOGIN = async (n: string, p: string) => {
        if(!auth) return
        auth.set(n, p)
        const res = await auth.login()
        if(res)
            router.push("/")
    }
    return <div>
        <button onClick={async ()=> {
            LOGIN("apple", "mango")
        }}>login APPLE</button>

        <button onClick={async ()=> {
            LOGIN("abc", "osaka")
        }}>login ABC</button>
    </div>
}