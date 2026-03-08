'use client'

import { useRouter } from 'next/navigation'

export default function AppointmentList(){

const router=useRouter()

return(

<div className="p-6">

<h1 className="text-xl font-bold mb-4">
Appointments
</h1>

<table className="w-full border">

<thead>

<tr>

<th>Patient</th>
<th>Mobile</th>
<th>Status</th>
<th>Action</th>

</tr>

</thead>

<tbody>

<tr>

<td>Ganesh Kumar</td>
<td>9999999999</td>
<td>Pending</td>

<td>

<button
className="bg-green-500 text-white px-3 py-1"
onClick={()=>router.push('/opd-flow/1')}
>

Start Visit

</button>

</td>

</tr>

</tbody>

</table>

</div>

)
}