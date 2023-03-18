import useAuth from "@/components/useLogin";
import { useRouter } from "next/router";

export default function Login() {
    const [auth, login] = useAuth()
    const router = useRouter()
    return <div>
        <button onClick={async ()=> {
            if(!auth) return
            auth.set("apple", "mango")
            const res = await auth.login()
            if(res)
                router.push("/")
        }}>login</button>
    </div>
}