"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '../lib/api'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    async function autoLogin() {
      const token = localStorage.getItem('token')
      if (token) {
        router.push('/dashboard')
        return
      }
      // Auto-login with seed user for dev testing
      try {
        const data = await login('admin@example.com', 'password')
        localStorage.setItem('token', data.access_token)
        router.push('/dashboard')
      } catch {
        router.push('/login')
      }
    }
    autoLogin()
  }, [router])
  return null
}