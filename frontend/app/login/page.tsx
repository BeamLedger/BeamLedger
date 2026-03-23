"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '../../lib/api'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = await login(email, password)
      localStorage.setItem('token', data.access_token)
      setError('')
      router.push('/dashboard')
    } catch (err: any) {
      setError('Invalid credentials')
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 shadow-md rounded w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block mb-1 font-medium">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Log In
          </button>
        </form>
        <p className="mt-4 text-sm">Don&apos;t have an account? <a href="/register" className="text-blue-600 underline">Register</a></p>
      </div>
    </div>
  )
}

export default LoginPage