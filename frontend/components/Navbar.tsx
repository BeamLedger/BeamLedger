"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'

const Navbar: React.FC = () => {
  const router = useRouter()
  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }
  return (
    <nav className="flex items-center justify-between bg-blue-600 text-white p-4">
      <div className="font-bold text-lg">
        <Link href="/">Lighting Compliance</Link>
      </div>
      <div className="space-x-4">
        <Link href="/dashboard">Dashboard</Link>
        <button onClick={handleLogout} className="underline">Logout</button>
      </div>
    </nav>
  )
}

export default Navbar