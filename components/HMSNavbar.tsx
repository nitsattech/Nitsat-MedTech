'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function Navbar(){

const router = useRouter()

const [hospital,setHospital] = useState("")
const [user,setUser] = useState("")
const [time,setTime] = useState("")

useEffect(()=>{

const hospitalData = localStorage.getItem("hospital")
const userData = localStorage.getItem("user")

if(hospitalData){
const h = JSON.parse(hospitalData)
setHospital(h.name)
}

if(userData){
const u = JSON.parse(userData)
setUser(u.name)
}

const timer = setInterval(()=>{

const now = new Date().toLocaleString()

setTime(now)

},1000)

return ()=> clearInterval(timer)

},[])

const logout = ()=>{

localStorage.clear()

router.push("/login")

}

return(

<div className="w-full bg-teal-600 text-white flex justify-between items-center px-6 py-3">

<div className="text-lg font-bold">

🏥 {hospital || "Hospital HMS"}

</div>

<div className="flex items-center gap-5">

<div>{time}</div>

<div>👤 {user}</div>

<button 
onClick={()=>router.push("/dashboard")}
className="bg-white text-teal-600 px-3 py-1 rounded"
>
Home
</button>

<button
onClick={logout}
className="bg-red-500 px-3 py-1 rounded"
>
Logout
</button>

</div>

</div>

)

}