'use client'
import { useState, useEffect } from 'react'

export default function DateTime() {
  const [mounted, setMounted] = useState(false)
  const [dateTime, setDateTime] = useState('')

  useEffect(() => {
    setMounted(true)
    const updateTime = () => {
      const now = new Date()
      const date = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      const time = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
      setDateTime(`${date}\n${time}`)
    }
    
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!mounted) return null

  return (
    <div className="text-gray-300 text-sm space-y-1">
      {dateTime.split('\n').map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  )
} 