'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function SignUp() {
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [securityPin, setSecurityPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      setLoading(false)
      return
    }

    if (securityPin.length !== 4) {
      setError("Security PIN must be 4 digits")
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            security_pin: securityPin,
          },
        },
      })

      if (error) throw error
      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#111827]">
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5"></div>
      
      <main className="relative flex-1 flex flex-col w-full min-h-screen p-4 sm:p-6 md:p-8">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md mx-4 sm:mx-8 md:mx-auto">
            <div className="space-y-6 sm:space-y-8 bg-gray-900/50 p-4 sm:p-6 md:p-8 rounded-xl border border-gray-800">
              <div className="text-center space-y-2 sm:space-y-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-100">Sign Up</h2>
                <p className="text-sm sm:text-base text-gray-400">
                  Create your account to get started
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-4 sm:space-y-6">
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg 
                      px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-100
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg 
                      px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-100
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg 
                      px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-100
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg 
                      px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-100
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="securityPin" className="block text-sm font-medium text-gray-300">
                    Security PIN (4 digits)
                  </label>
                  <input
                    id="securityPin"
                    type="password"
                    required
                    maxLength={4}
                    pattern="\d{4}"
                    value={securityPin}
                    onChange={(e) => setSecurityPin(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg 
                      px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-100
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-800/50 border border-gray-700 text-gray-100 
                    py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base
                    transition-all duration-200 hover:bg-gray-700/50 
                    disabled:opacity-50 disabled:hover:bg-gray-800/50"
                >
                  {loading ? 'Loading...' : 'Sign Up'}
                </button>
              </form>

              <div className="text-center text-xs sm:text-sm text-gray-400">
                <Link href="/login" className="hover:text-gray-100 transition-colors">
                  Already have an account? <span className="text-blue-400">Login</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 