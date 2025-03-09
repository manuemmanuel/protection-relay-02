'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import DateTime from '@/components/DateTime'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Scale,
  CoreScaleOptions
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface RealTimeData {
  id: string;
  computer_ts: string;
  a_phase_current: number;
  b_phase_current: number;
  c_phase_current: number;
  frequency: number;
}

interface PhaseData {
  amplitude: number;
  frequency: number;
  phaseShift: number;
}

interface HistoricalData {
  id: string;
  timestamp: string;
  a_phase_current: number;
  b_phase_current: number;
  c_phase_current: number;
  frequency: number;
}

export default function CurrentDetails() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [realTimeData, setRealTimeData] = useState<RealTimeData[]>([])
  const [loading, setLoading] = useState(true)
  const [phaseData, setPhaseData] = useState<{[key: string]: PhaseData}>({
    'Phase A': { amplitude: 5, frequency: 50, phaseShift: 0 },
    'Phase B': { amplitude: 5, frequency: 50, phaseShift: 2 * Math.PI / 3 },
    'Phase C': { amplitude: 5, frequency: 50, phaseShift: 4 * Math.PI / 3 }
  })
  const [userFrequency, setUserFrequency] = useState<number | null>(null)
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null)
  const [animationTime, setAnimationTime] = useState(0)

  const colors = {
    'Phase A': 'rgba(255, 206, 86, 1)', // yellow
    'Phase B': 'rgba(54, 162, 235, 1)',  // blue
    'Phase C': 'rgba(255, 99, 132, 1)'   // red
  }

  const handleFrequencyChange = (newFrequency: number) => {
    setUserFrequency(newFrequency)
  }

  const saveHistoricalData = async (data: RealTimeData) => {
    try {
      console.log('Attempting to save historical data:', {
        timestamp: data.computer_ts,
        a_phase_current: data.a_phase_current,
        b_phase_current: data.b_phase_current,
        c_phase_current: data.c_phase_current,
        frequency: data.frequency
      })

      // First check if data with this timestamp already exists
      const { data: existingData } = await supabase
        .from('historical_data')
        .select('id')
        .eq('timestamp', data.computer_ts)
        .single()

      if (existingData) {
        console.log('Data for this timestamp already exists, skipping...')
        return
      }

      const { data: savedData, error } = await supabase
        .from('historical_data')
        .insert({
          timestamp: data.computer_ts,
          a_phase_current: data.a_phase_current,
          b_phase_current: data.b_phase_current,
          c_phase_current: data.c_phase_current,
          frequency: data.frequency
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }
      
      console.log('Successfully saved historical data:', savedData)
      setLastSavedTimestamp(data.computer_ts)
      
      // Fetch fresh historical data after successful save
      await fetchHistoricalData()
    } catch (error) {
      console.error('Error saving historical data:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      } else {
        console.error('Unknown error type:', error)
      }
    }
  }

  const fetchHistoricalData = async () => {
    try {
      const { data, error } = await supabase
        .from('historical_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100)

      if (error) throw error
      
      if (data) {
        setHistoricalData(data)
        if (data.length > 0) {
          setLastSavedTimestamp(data[0].timestamp)
        }
      }
    } catch (error) {
      console.error('Error fetching historical data:', error)
    }
  }

  const handleManualSave = async () => {
    if (realTimeData.length > 0) {
      await saveHistoricalData(realTimeData[0])
    }
  }

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout
    let historicalPollingInterval: NodeJS.Timeout
    let isSubscribed = true
    let animationFrameId: number | undefined

    const fetchData = async () => {
      if (!isSubscribed) return
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('real_time_data')
          .select('*')
          .order('computer_ts', { ascending: false })
          .limit(100)

        if (error) throw error

        if (data && data.length > 0 && isSubscribed) {
          setRealTimeData(data)
          updatePhaseData(data[0])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        if (isSubscribed) setLoading(false)
      }
    }

    const updatePhaseData = (latestData: RealTimeData) => {
      setPhaseData({
        'Phase A': {
          amplitude: latestData.a_phase_current,
          frequency: latestData.frequency,
          phaseShift: 0
        },
        'Phase B': {
          amplitude: latestData.b_phase_current,
          frequency: latestData.frequency,
          phaseShift: 2 * Math.PI / 3
        },
        'Phase C': {
          amplitude: latestData.c_phase_current,
          frequency: latestData.frequency,
          phaseShift: 4 * Math.PI / 3
        }
      })
    }

    const setupSubscription = () => {
      const channel = supabase
        .channel('real_time_data_changes')
        .on('postgres_changes', 
          {
            event: '*',
            schema: 'public',
            table: 'real_time_data'
          },
          async (payload) => {
            if (!isSubscribed) return
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const newData = payload.new as RealTimeData
              
              // Get the latest data from state instead of using realTimeData directly
              setRealTimeData(current => {
                const lastData = current[0]
                const threshold = 0.1

                const hasAmplitudeChange = !lastData ||
                  Math.abs(newData.a_phase_current - lastData.a_phase_current) > threshold ||
                  Math.abs(newData.b_phase_current - lastData.b_phase_current) > threshold ||
                  Math.abs(newData.c_phase_current - lastData.c_phase_current) > threshold

                if (hasAmplitudeChange) {
                  // Call saveHistoricalData outside of the state update
                  void saveHistoricalData(newData)
                }

                const updated = [newData, ...current.filter(item => item.id !== newData.id)]
                return updated.slice(0, 100)
              })

              updatePhaseData(newData)
            }
          }
        )
        .subscribe()

      return channel
    }

    // Set up the channels and polling
    const channel = setupSubscription()
    
    // Initial fetch
    fetchData()
    fetchHistoricalData()

    // Polling for real-time updates
    pollingInterval = setInterval(async () => {
      if (!isSubscribed) return
      try {
        const { data, error } = await supabase
          .from('real_time_data')
          .select('*')
          .order('computer_ts', { ascending: false })
          .limit(1)
          .single()

        if (!error && data && isSubscribed) {
          setRealTimeData(current => {
            const lastData = current[0]
            const threshold = 0.1

            const hasAmplitudeChange = !lastData ||
              Math.abs(data.a_phase_current - lastData.a_phase_current) > threshold ||
              Math.abs(data.b_phase_current - lastData.b_phase_current) > threshold ||
              Math.abs(data.c_phase_current - lastData.c_phase_current) > threshold

            if (hasAmplitudeChange) {
              // Call saveHistoricalData outside of the state update
              void saveHistoricalData(data)
            }

            if (current[0]?.id !== data.id) {
              return [data, ...current.slice(0, 99)]
            }
            return current
          })
          
          updatePhaseData(data)
        }
      } catch (error) {
        console.error('Error in polling interval:', error)
      }
    }, 1000)

    // Add periodic refresh of historical data
    historicalPollingInterval = setInterval(() => {
      if (isSubscribed) {
        fetchHistoricalData()
      }
    }, 5000) // Refresh every 5 seconds

    // Cleanup
    return () => {
      isSubscribed = false
      channel.unsubscribe()
      clearInterval(pollingInterval)
      clearInterval(historicalPollingInterval)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [supabase]) // Keep only supabase in dependencies

  const generateWaveformData = () => {
    if (!realTimeData.length) return { datasets: [] }

    const duration = 20
    const samplingRate = 50
    const totalPoints = samplingRate
    
    // Use animationTime for continuous animation
    const timePoints = Array.from(
      { length: totalPoints }, 
      (_, i) => ((i * duration) / totalPoints + animationTime) % duration
    )
    
    const latestData = realTimeData[0]
    const currentFrequency = userFrequency ?? latestData.frequency
    
    // Calculate the maximum amplitude among all phases
    const maxAmplitude = Math.max(
      Math.abs(latestData.a_phase_current),
      Math.abs(latestData.b_phase_current),
      Math.abs(latestData.c_phase_current)
    )
    
    // Sort time points to ensure proper rendering
    const sortedTimePoints = [...timePoints].sort((a, b) => a - b)
    
    // Create datasets with segments
    const datasets = [
      {
        label: 'Phase A',
        data: sortedTimePoints.map(t => ({
          x: t,
          y: latestData.a_phase_current * Math.sin(2 * Math.PI * currentFrequency * (t/1000))
        })),
        borderColor: colors['Phase A'],
        backgroundColor: colors['Phase A'].replace('1)', '0.5)'),
        tension: 0.4,
        segment: {
          borderColor: (ctx: { p0: { parsed: { x: number } }; p1: { parsed: { x: number } } }) => 
            shouldBreakLine(ctx, duration) ? 'transparent' : colors['Phase A']
        }
      },
      {
        label: 'Phase B',
        data: sortedTimePoints.map(t => ({
          x: t,
          y: latestData.b_phase_current * Math.sin(2 * Math.PI * currentFrequency * (t/1000) + 2 * Math.PI / 3)
        })),
        borderColor: colors['Phase B'],
        backgroundColor: colors['Phase B'].replace('1)', '0.5)'),
        tension: 0.4,
        segment: {
          borderColor: (ctx: { p0: { parsed: { x: number } }; p1: { parsed: { x: number } } }) => 
            shouldBreakLine(ctx, duration) ? 'transparent' : colors['Phase B']
        }
      },
      {
        label: 'Phase C',
        data: sortedTimePoints.map(t => ({
          x: t,
          y: latestData.c_phase_current * Math.sin(2 * Math.PI * currentFrequency * (t/1000) + 4 * Math.PI / 3)
        })),
        borderColor: colors['Phase C'],
        backgroundColor: colors['Phase C'].replace('1)', '0.5)'),
        tension: 0.4,
        segment: {
          borderColor: (ctx: { p0: { parsed: { x: number } }; p1: { parsed: { x: number } } }) => 
            shouldBreakLine(ctx, duration) ? 'transparent' : colors['Phase C']
        }
      }
    ]

    return { datasets, maxAmplitude }
  }

  // Helper function to determine if a line segment should be broken
  const shouldBreakLine = (ctx: any, duration: number) => {
    if (!ctx.p0 || !ctx.p1) return false
    const xDiff = Math.abs(ctx.p0.parsed.x - ctx.p1.parsed.x)
    return xDiff > duration / 2
  }

  // Add new useEffect for animation
  useEffect(() => {
    let animationFrameId: number
    let lastTimestamp = 0
    
    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp
      const delta = timestamp - lastTimestamp
      
      // Update animation time (adjust speed by changing the divisor)
      setAnimationTime(prev => (prev + delta / 1000) % 20)
      
      lastTimestamp = timestamp
      animationFrameId = requestAnimationFrame(animate)
    }
    
    animationFrameId = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [])

  // Update chartOptions
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    devicePixelRatio: 1,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#9CA3AF' }
      },
      title: {
        display: true,
        text: 'Input Current Waveform',
        color: '#9CA3AF'
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        title: {
          display: true,
          text: 'Time (ms)',
          color: '#9CA3AF'
        },
        min: 0,
        max: 20,
        grid: { color: '#374151' },
        ticks: { color: '#9CA3AF' }
      },
      y: {
        type: 'linear' as const,
        title: {
          display: true,
          text: 'Current (A)',
          color: '#9CA3AF'
        },
        min: -Math.ceil((realTimeData[0]?.a_phase_current || 10) * 1.2),
        max: Math.ceil((realTimeData[0]?.a_phase_current || 10) * 1.2),
        grid: { color: '#374151' },
        ticks: { 
          color: '#9CA3AF',
          callback: function(this: Scale<CoreScaleOptions>, tickValue: number | string) {
            return typeof tickValue === 'number' ? tickValue.toFixed(1) + ' A' : tickValue
          }
        }
      }
    }
  }

  const FrequencyControl = () => {
    const latestData = realTimeData[0]
    const currentFrequency = userFrequency ?? (latestData?.frequency ?? 50)

    return (
      <div className="bg-gray-900/50 p-3 xs:p-4 sm:p-6 rounded-lg xs:rounded-xl border border-gray-800 
        backdrop-blur-sm">
        <div className="flex flex-col gap-3 xs:gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-100">
                Frequency Control
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                Adjust visualization frequency
              </p>
            </div>
            <button
              onClick={() => setUserFrequency(null)}
              className={`text-xs xs:text-sm px-2 py-1 rounded-lg transition-colors ${
                userFrequency === null 
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-gray-800/40 text-gray-400 hover:bg-gray-800/60 hover:text-gray-300'
              }`}
            >
              Reset to Real-time
            </button>
          </div>
          <div className="flex items-center gap-3 xs:gap-4">
            <input
              type="range"
              min="1"
              max="100"
              value={currentFrequency}
              onChange={(e) => handleFrequencyChange(Number(e.target.value))}
              className="flex-grow h-1.5 xs:h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                accent-blue-500 hover:accent-blue-400 transition-all"
            />
            <span className="text-gray-300 font-mono bg-gray-800/80 px-2 py-1 xs:px-3 xs:py-1.5 
              rounded-lg min-w-[60px] xs:min-w-[70px] sm:min-w-[80px] text-center 
              text-xs xs:text-sm sm:text-base">
              {currentFrequency} Hz
            </span>
          </div>
          {userFrequency !== null && (
            <p className="text-xs text-amber-400/80">
              ⚠️ Frequency manually adjusted. Real-time frequency: {latestData?.frequency.toFixed(2)} Hz
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-w-full bg-[#111827] overflow-x-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 min-w-full"></div>
      
      <main className="relative z-10 min-h-screen p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-3 xs:space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header Section */}
          <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 xs:gap-4">
            <div className="space-y-1.5 xs:space-y-2 w-full xs:w-auto">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center space-x-1.5 xs:space-x-2 text-blue-400 hover:text-blue-300 
                  transition-colors bg-blue-500/10 px-2.5 py-1.5 xs:px-3 sm:px-4 sm:py-2 rounded-lg 
                  hover:bg-blue-500/20 text-xs xs:text-sm sm:text-base"
              >
                <svg className="w-3 h-3 xs:w-4 xs:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Dashboard</span>
              </button>
              <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-100 
                tracking-tight leading-tight">
                Input Current Details
              </h1>
              <p className="text-xs xs:text-sm sm:text-base text-gray-400">
                Real-time three-phase current waveform analysis
              </p>
            </div>
            <div className="w-full xs:w-auto flex justify-end mt-2 xs:mt-0">
              <DateTime />
            </div>
          </div>

          {/* Main Content */}
          <div className="grid gap-3 xs:gap-4 sm:gap-6">
            {loading ? (
              <div className="flex items-center justify-center h-[400px] bg-gray-900/50 rounded-xl">
                <div className="text-blue-400">Loading...</div>
              </div>
            ) : (
              <>
                <FrequencyControl />
                <div className="bg-gray-900/50 p-2 xs:p-3 sm:p-4 md:p-6 rounded-lg xs:rounded-xl border 
                  border-gray-800 backdrop-blur-sm">
                  <div className="h-[250px] xs:h-[300px] sm:h-[400px] lg:h-[500px]">
                    <Line data={generateWaveformData()} options={chartOptions} />
                  </div>
                </div>

                {/* Phase Information Cards */}
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4">
                  {Object.entries(phaseData).map(([phase, data]) => (
                    <div 
                      key={phase} 
                      className="bg-gray-900/50 p-3 xs:p-4 sm:p-6 rounded-lg xs:rounded-xl border border-gray-800 
                        backdrop-blur-sm hover:border-gray-700 transition-colors"
                    >
                      <h3 
                        className="text-sm xs:text-base sm:text-lg lg:text-xl font-semibold mb-3 xs:mb-4 
                          flex items-center gap-1.5 xs:gap-2" 
                        style={{color: colors[phase as keyof typeof colors]}}
                      >
                        <div className="w-1.5 h-1.5 xs:w-2 sm:w-3 xs:h-2 sm:h-3 rounded-full animate-pulse" 
                          style={{backgroundColor: colors[phase as keyof typeof colors]}}
                        />
                        {phase}
                      </h3>
                      <div className="space-y-2 xs:space-y-3 sm:space-y-4">
                        <div className="flex justify-between items-center p-2 xs:p-3 bg-gray-800/40 rounded-lg">
                          <span className="text-xs xs:text-sm sm:text-base text-gray-400">Amplitude</span>
                          <span className="text-xs xs:text-sm sm:text-base text-gray-100 font-mono 
                            bg-gray-800/80 px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 rounded-lg">
                            {data.amplitude.toFixed(2)} A
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 xs:p-3 bg-gray-800/40 rounded-lg">
                          <span className="text-xs xs:text-sm sm:text-base text-gray-400">Frequency</span>
                          <span className="text-xs xs:text-sm sm:text-base text-gray-100 font-mono 
                            bg-gray-800/80 px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 rounded-lg">
                            {userFrequency !== null ? `${userFrequency} Hz*` : `${data.frequency} Hz`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 xs:p-3 bg-gray-800/40 rounded-lg">
                          <span className="text-xs xs:text-sm sm:text-base text-gray-400">Time Period</span>
                          <span className="text-xs xs:text-sm sm:text-base text-gray-100 font-mono 
                            bg-gray-800/80 px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 rounded-lg">
                            {(1000 / (userFrequency ?? data.frequency)).toFixed(2)} ms
                          </span>
                        </div>
                        {userFrequency !== null && (
                          <p className="text-xs text-amber-400/80">
                            *Visualization frequency (Real: {data.frequency} Hz, T: {(1000 / data.frequency).toFixed(2)} ms)
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Historical Data Table */}
                <div className="bg-gray-900/50 p-3 xs:p-4 sm:p-6 rounded-lg xs:rounded-xl border 
                  border-gray-800 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-100">Historical Data</h3>
                      <button
                        onClick={handleManualSave}
                        className="text-xs xs:text-sm px-2 py-1 bg-blue-500/20 text-blue-400 
                          hover:bg-blue-500/30 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Save Current Data
                      </button>
                      <button
                        onClick={fetchHistoricalData}
                        className="text-xs xs:text-sm px-2 py-1 bg-green-500/20 text-green-400 
                          hover:bg-green-500/30 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Data
                      </button>
                    </div>
                    <div className="text-xs text-gray-400">
                      Last saved: {lastSavedTimestamp ? new Date(lastSavedTimestamp).toLocaleString() : 'Never'}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-400">
                          <th className="p-2">Timestamp</th>
                          <th className="p-2">Phase A (A)</th>
                          <th className="p-2">Phase B (A)</th>
                          <th className="p-2">Phase C (A)</th>
                          <th className="p-2">Frequency (Hz)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historicalData.map((item) => (
                          <tr 
                            key={`${item.id}-${item.timestamp}`} 
                            className="border-t border-gray-800 text-gray-100"
                          >
                            <td className="p-2">{new Date(item.timestamp).toLocaleString()}</td>
                            <td className="p-2">{item.a_phase_current.toFixed(2)}</td>
                            <td className="p-2">{item.b_phase_current.toFixed(2)}</td>
                            <td className="p-2">{item.c_phase_current.toFixed(2)}</td>
                            <td className="p-2">{item.frequency.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 