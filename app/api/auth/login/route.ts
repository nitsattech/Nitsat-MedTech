import { NextResponse } from "next/server"
import { runQuery, initializeDatabase } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {

try {

await initializeDatabase()

const { email, password } = await req.json()

const users = await runQuery<any>(`
SELECT 
u.id,
u.email,
u.full_name,
u.role,
u.hospital_id,
u.password_hash,
h.name as hospital_name

FROM users u

LEFT JOIN hospitals h
ON u.hospital_id = h.id

WHERE u.email = ?
`, [email])

const user = users[0]

if (!user) {
return NextResponse.json(
{ error: "User not found" },
{ status: 401 }
)
}

const valid = await bcrypt.compare(password, user.password_hash)

if (!valid) {
return NextResponse.json(
{ error: "Invalid password" },
{ status: 401 }
)
}

return NextResponse.json({

user: {
id: user.id,
name: user.full_name,
role: user.role
},

hospital: {
id: user.hospital_id,
name: user.hospital_name
}

})

} catch (error) {

console.error("Login error:", error)

return NextResponse.json(
{ error: "Server error" },
{ status: 500 }
)

}

}