'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex min-h-screen bg-[#111827]">
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5"></div>
      
      <main className="relative flex-1 flex flex-col w-full min-h-screen p-4 sm:p-6 md:p-8">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md mx-4 sm:mx-8 md:mx-auto">
            <div className="space-y-6 sm:space-y-8 bg-gray-900/50 p-4 sm:p-6 md:p-8 rounded-xl border border-gray-800">
              <div className="text-center space-y-2 sm:space-y-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-100 leading-tight">
                  Protection Relay
                </h1>
                <p className="text-sm sm:text-base text-gray-400 max-w-sm mx-auto">
                  Welcome to the Solid State Transformer Protection Relay System
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <Link 
                  href="/login"
                  className="block w-full bg-gray-800/50 border border-gray-700 text-gray-100 
                    py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base
                    text-center transition-all duration-200 hover:bg-gray-700/50"
                >
                  Login
                </Link>
                
                <Link 
                  href="/signup"
                  className="block w-full bg-gray-800/50 border border-gray-700 text-gray-100 
                    py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base
                    text-center transition-all duration-200 hover:bg-gray-700/50"
                >
                  Sign Up
                </Link>
              </div>

              <div className="text-center text-xs sm:text-sm text-gray-400">
                <p>
                  By continuing, you agree to our{' '}
                  <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                    Terms of Service
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
