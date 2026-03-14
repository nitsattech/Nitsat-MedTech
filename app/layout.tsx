'use client'

import './globals.css'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/HMSNavbar'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const pathname = usePathname()

  const hideNavbar = pathname === "/login"

  return (
    <html lang="en">
      <body>

        {!hideNavbar && <Navbar />}

        {children}

      </body>
    </html>
  )
}