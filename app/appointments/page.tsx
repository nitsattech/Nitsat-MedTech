'use client'

import { useState } from "react"

export default function AppointmentPage(){

const [form,setForm] = useState({

name:"",
mobile:"",
age:"",
gender:"Male",
doctor:"",
date:""

})

return(

<div className="p-6">

<h1 className="text-2xl font-bold mb-6">

New Appointment

</h1>

<div className="grid grid-cols-3 gap-4 bg-white p-6 rounded shadow">

<input
className="border p-2"
placeholder="Patient Name"
onChange={(e)=>setForm({...form,name:e.target.value})}
/>

<input
className="border p-2"
placeholder="Mobile"
onChange={(e)=>setForm({...form,mobile:e.target.value})}
/>

<input
className="border p-2"
placeholder="Age"
onChange={(e)=>setForm({...form,age:e.target.value})}
/>

<select
className="border p-2"
onChange={(e)=>setForm({...form,gender:e.target.value})}
>

<option>Male</option>
<option>Female</option>

</select>

<input
className="border p-2"
placeholder="Doctor"
onChange={(e)=>setForm({...form,doctor:e.target.value})}
/>

<input
type="date"
className="border p-2"
onChange={(e)=>setForm({...form,date:e.target.value})}
/>

<button className="bg-blue-600 text-white p-3 rounded col-span-3">

Create Appointment

</button>

</div>

</div>

)

}