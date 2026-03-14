"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from 'next/image'

export default function LoginPage(){

const router = useRouter()

const [email,setEmail] = useState("")
const [password,setPassword] = useState("")

const handleLogin = async () => {

const res = await fetch("/api/auth/login",{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({email,password})
})

const data = await res.json()

if(data.user){

localStorage.setItem("user",JSON.stringify(data.user))
localStorage.setItem("hospital",JSON.stringify(data.hospital))

router.push("/dashboard")

}else{
alert(data.error)
}

}

return(

<div className="h-screen w-screen flex overflow-hidden">

{/* LEFT SIDE IMAGE */}

<div className="w-1/2 relative">

	<Image
		src="/doctor-login.png"
		alt="Doctor illustration"
		fill
		className="object-cover"
		priority
	/>

{/* DARK OVERLAY */}

<div className="absolute inset-0 bg-blue-900/40"></div>

{/* WELCOME CARD */}

<div className="absolute bottom-12 left-12 right-12 bg-blue-600/90 backdrop-blur-md p-8 rounded-xl shadow-2xl text-white">

<div className="flex gap-5 items-start">

<div className="w-1 bg-white/70 h-20"></div>

<div>

<h2 className="text-2xl font-semibold mb-2">
NITSAT MEDTECH
</h2>

<p className="text-sm mb-2">
Welcome to Nitsat Hospital Management System
</p>

<p className="text-xs opacity-90">
Cloud based smart HMS platform with OPD, IPD, Lab,
Pharmacy and Billing integration.
</p>

</div>

</div>

</div>

</div>


{/* RIGHT SIDE LOGIN */}

<div className="w-1/2 flex items-center justify-center 
bg-gradient-to-br from-red-100 via-blue-300 to-red-200 relative overflow-hidden">
<div className="bg-white-80 backdrop-blur-md p-10 rounded-xl shadow-2xl w-[420px] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(0,0,0,0.2)]">

{/* LOGO */}

<div className="flex items-center mb-6">

	<div className="relative h-8 w-8 mr-2 flex-shrink-0">
		<Image src="/r.png.avif" alt="Nitsat logo" fill className="object-contain" />
	</div>

	<span className="font-semibold text-gray-700 text-lg">
		NITSAT
	</span>

</div>


<h2 className="text-xl font-semibold mb-1">
Login
</h2>

<p className="text-gray-400 text-sm mb-6">
Enter your credentials to login to your account
</p>


<input
type="email"
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
className="border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none rounded w-full p-3 mb-4 transition"
/>


<input
type="password"
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
className="border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none rounded w-full p-3 mb-5 transition"
/>


<button
onClick={handleLogin}
className="bg-blue-600 hover:bg-blue-700 transition text-white w-full p-3 rounded-lg shadow-lg"
>
Sign In
</button>


<p className="text-sm text-blue-600 mt-4 cursor-pointer">
Forgot Password?
</p>

</div>

</div>

</div>

)

}