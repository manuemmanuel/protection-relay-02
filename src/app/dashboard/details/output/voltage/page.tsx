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
  "A Phase Voltage": number;
  "B Phase Voltage": number;
  "C Phase Voltage": number;
  "Frequency": number;
}

interface PhaseData {
  amplitude: number;
  frequency: number;
  phaseShift: number;
}

interface HistoricalData {
  id: string;
  timestamp: string;
  a_phase_voltage: number;
  b_phase_voltage: number;
  c_phase_voltage: number;
  frequency: number;
}

interface OutputRealTimeData {
  id: string;
  computer_ts: string;
  "A Phase Voltage": number;
  "B Phase Voltage": number;
  "C Phase Voltage": number;
  "Frequency": number;
}

export default function VoltageDetails() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [realTimeData, setRealTimeData] = useState<RealTimeData[]>([])
  const [outputRealTimeData, setOutputRealTimeData] = useState<OutputRealTimeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [outputLoading, setOutputLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
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
        "A Phase Voltage": data["A Phase Voltage"],
        "B Phase Voltage": data["B Phase Voltage"],
        "C Phase Voltage": data["C Phase Voltage"],
        frequency: data["Frequency"]
      })

      // First check if data with this timestamp already exists
      const { data: existingData } = await supabase
        .from('historical_voltage')
        .select('id')
        .eq('timestamp', data.computer_ts)
        .single()

      if (existingData) {
        console.log('Voltage data for this timestamp already exists, skipping...')
        return
      }

      const { data: savedData, error } = await supabase
        .from('historical_voltage')
        .insert({
          timestamp: data.computer_ts,
          "A Phase Voltage": data["A Phase Voltage"],
          "B Phase Voltage": data["B Phase Voltage"],
          "C Phase Voltage": data["C Phase Voltage"],
          frequency: data["Frequency"]
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
      console.error('Error saving historical voltage data:', error)
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
        .from('historical_voltage')
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
      console.error('Error fetching historical voltage data:', error)
    }
  }

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout
    let outputPollingInterval: NodeJS.Timeout
    let historicalPollingInterval: NodeJS.Timeout
    let isSubscribed = true
    let animationFrameId: number | undefined

    const fetchData = async () => {
      if (!isSubscribed || isPaused) return
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('output_real_time_data')
          .select(`
            id,
            computer_ts,
            "A Phase Voltage",
            "B Phase Voltage",
            "C Phase Voltage",
            "Frequency"
          `)
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
          amplitude: latestData["A Phase Voltage"],
          frequency: latestData["Frequency"],
          phaseShift: 0
        },
        'Phase B': {
          amplitude: latestData["B Phase Voltage"],
          frequency: latestData["Frequency"],
          phaseShift: 2 * Math.PI / 3
        },
        'Phase C': {
          amplitude: latestData["C Phase Voltage"],
          frequency: latestData["Frequency"],
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
            table: 'output_real_time_data'
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
                  Math.abs(newData["A Phase Voltage"] - lastData["A Phase Voltage"]) > threshold ||
                  Math.abs(newData["B Phase Voltage"] - lastData["B Phase Voltage"]) > threshold ||
                  Math.abs(newData["C Phase Voltage"] - lastData["C Phase Voltage"]) > threshold

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

    const fetchOutputData = async () => {
      if (!isSubscribed || isPaused) return
      try {
        console.log('Fetching output real-time data...')
        const { data, error } = await supabase
          .from('output_real_time_data')
          .select('*')
          .order('computer_ts', { ascending: false })
          .limit(1)
          .single()

        if (error) {
          console.error('Error fetching output data:', error)
          throw error
        }

        if (data && isSubscribed) {
          console.log('Received output data:', data)
          setOutputRealTimeData(data)
        }
      } catch (error) {
        console.error('Error in output data fetch:', error)
      } finally {
        if (isSubscribed) setOutputLoading(false)
      }
    }

    const setupOutputSubscription = () => {
      console.log('Setting up output real-time subscription...')
      const channel = supabase
        .channel('output_real_time_changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'output_real_time_data'
          },
          (payload) => {
            console.log('Output real-time update received:', payload)
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              setOutputRealTimeData(payload.new as OutputRealTimeData)
            }
          }
        )
        .subscribe((status) => {
          console.log('Output subscription status:', status)
        })

      return channel
    }

    // Initial fetches
    fetchData()
    fetchOutputData()
    fetchHistoricalData()
    
    // Set up subscriptions only if not paused
    const inputChannel = !isPaused ? setupSubscription() : null
    const outputChannel = !isPaused ? setupOutputSubscription() : null

    // Polling for updates with reduced frequency
    pollingInterval = setInterval(async () => {
      if (!isSubscribed || isPaused) return
      try {
        const { data, error } = await supabase
          .from('output_real_time_data')
          .select(`
            id,
            computer_ts,
            "A Phase Voltage",
            "B Phase Voltage",
            "C Phase Voltage",
            "Frequency"
          `)
          .order('computer_ts', { ascending: false })
          .limit(1)
          .single()

        if (error) throw error

        if (data && isSubscribed) {
          console.log('Received output data:', data)
          setOutputRealTimeData(data)
        }
      } catch (error) {
        console.error('Error in polling interval:', error)
      }
    }, 2000)

    // Historical data refresh with longer interval
    historicalPollingInterval = setInterval(() => {
      if (!isPaused) {
        fetchHistoricalData()
      }
    }, 10000) // Increased from 5000ms to 10000ms

    // Cleanup
    return () => {
      isSubscribed = false
      inputChannel?.unsubscribe()
      outputChannel?.unsubscribe()
      clearInterval(pollingInterval)
      clearInterval(historicalPollingInterval)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [supabase, isPaused]) // Added isPaused to dependencies

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
    const currentFrequency = userFrequency ?? latestData["Frequency"]
    
    // Calculate the maximum amplitude among all phases
    const maxAmplitude = Math.max(
      Math.abs(latestData["A Phase Voltage"]),
      Math.abs(latestData["B Phase Voltage"]),
      Math.abs(latestData["C Phase Voltage"])
    )
    
    // Sort time points to ensure proper rendering
    const sortedTimePoints = [...timePoints].sort((a, b) => a - b)
    
    // Create datasets with segments
    const datasets = [
      {
        label: 'Phase A',
        data: sortedTimePoints.map(t => ({
          x: t,
          y: latestData["A Phase Voltage"] * Math.sin(2 * Math.PI * currentFrequency * (t/1000) - Math.PI/2)
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
          y: latestData["B Phase Voltage"] * Math.sin(2 * Math.PI * currentFrequency * (t/1000) + 2 * Math.PI / 3 - Math.PI/2)
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
          y: latestData["C Phase Voltage"] * Math.sin(2 * Math.PI * currentFrequency * (t/1000) + 4 * Math.PI / 3 - Math.PI/2)
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
        text: 'Output Voltage Waveform',
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
          text: 'Voltage (V)',
          color: '#9CA3AF'
        },
        min: -Math.ceil((realTimeData[0]?.["A Phase Voltage"] || 240) * 1.2),
        max: Math.ceil((realTimeData[0]?.["A Phase Voltage"] || 240) * 1.2),
        grid: { color: '#374151' },
        ticks: { 
          color: '#9CA3AF',
          callback: function(this: Scale<CoreScaleOptions>, tickValue: number | string) {
            return typeof tickValue === 'number' ? tickValue.toFixed(1) + ' V' : tickValue
          }
        }
      }
    }
  }

  const ScopeControl = () => {
    const latestData = realTimeData[0]
    const currentFrequency = userFrequency ?? (latestData?.["Frequency"] ?? 50)

    return (
      <div className="bg-gray-900/50 p-3 xs:p-4 sm:p-6 rounded-lg xs:rounded-xl border border-gray-800 
        backdrop-blur-sm">
        <div className="flex flex-col gap-3 xs:gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-100">
                Scope Control
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                Adjust visualization scope
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
              {currentFrequency}
            </span>
          </div>
          {userFrequency !== null && (
            <p className="text-xs text-amber-400/80">
              ⚠️ Scope manually adjusted. Real-time scope: {latestData?.["Frequency"].toFixed(2)}
            </p>
          )}
        </div>
      </div>
    )
  }

  const handleManualSave = async () => {
    if (realTimeData.length > 0) {
      await saveHistoricalData(realTimeData[0])
    }
  }

  // Add pause/resume button component
  const PauseResumeButton = () => (
    <button
      onClick={() => setIsPaused(!isPaused)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
        isPaused 
          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
          : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
      }`}
    >
      {isPaused ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Resume Updates
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pause Updates
        </>
      )}
    </button>
  )

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
                Output Voltage Details
              </h1>
              <p className="text-xs xs:text-sm sm:text-base text-gray-400">
                Real-time three-phase voltage waveform analysis
              </p>
            </div>
            <div className="w-full xs:w-auto flex items-center gap-3">
              <PauseResumeButton />
              <DateTime />
            </div>
          </div>

          {/* Main Content */}
          <div className="grid gap-3 xs:gap-4 sm:gap-6">
            {loading || outputLoading ? (
              <div className="flex items-center justify-center h-[400px] bg-gray-900/50 rounded-xl">
                <div className="text-blue-400">Loading...</div>
              </div>
            ) : (
              <>
                {isPaused && (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-lg">
                    ⚠️ Real-time updates are paused. Click "Resume Updates" to continue receiving live data.
                  </div>
                )}
                <ScopeControl />
                <div className="bg-gray-900/50 p-2 xs:p-3 sm:p-4 md:p-6 rounded-lg xs:rounded-xl border 
                  border-gray-800 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">Input Voltage Waveform</h3>
                  <div className="h-[250px] xs:h-[300px] sm:h-[400px] lg:h-[500px]">
                    <Line data={generateWaveformData()} options={chartOptions} />
                  </div>
                </div>

                {/* Output Voltage Data */}
                <div className="bg-gray-900/50 p-4 sm:p-6 rounded-xl border border-gray-800 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">Output Voltage Data</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {outputRealTimeData && (
                      <>
                        <div className="bg-gray-800/40 p-4 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                            <h4 className="text-gray-300">Phase A Output</h4>
                          </div>
                          <div className="text-2xl font-mono mt-2">
                            {outputRealTimeData["A Phase Voltage"].toFixed(2)} V
                          </div>
                        </div>
                        <div className="bg-gray-800/40 p-4 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                            <h4 className="text-gray-300">Phase B Output</h4>
                          </div>
                          <div className="text-2xl font-mono mt-2">
                            {outputRealTimeData["B Phase Voltage"].toFixed(2)} V
                          </div>
                        </div>
                        <div className="bg-gray-800/40 p-4 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                            <h4 className="text-gray-300">Phase C Output</h4>
                          </div>
                          <div className="text-2xl font-mono mt-2">
                            {outputRealTimeData["C Phase Voltage"].toFixed(2)} V
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 mt-4">
                    Last updated: {outputRealTimeData ? new Date(outputRealTimeData.computer_ts).toLocaleString() : 'N/A'}
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
                            {data.amplitude.toFixed(2)} V
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 xs:p-3 bg-gray-800/40 rounded-lg">
                          <span className="text-xs xs:text-sm sm:text-base text-gray-400">Scope</span>
                          <span className="text-xs xs:text-sm sm:text-base text-gray-100 font-mono 
                            bg-gray-800/80 px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 rounded-lg">
                            {userFrequency !== null ? `${userFrequency}` : `${data.frequency}`}
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
                            *Visualization scope (Real: {data.frequency}, T: {(1000 / data.frequency).toFixed(2)} ms)
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
                          <th className="p-2">Phase A (V)</th>
                          <th className="p-2">Phase B (V)</th>
                          <th className="p-2">Phase C (V)</th>
                          <th className="p-2">Scope</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historicalData.map((item) => (
                          <tr 
                            key={`${item.id}-${item.timestamp}`} 
                            className="border-t border-gray-800 text-gray-100"
                          >
                            <td className="p-2">{new Date(item.timestamp).toLocaleString()}</td>
                            <td className="p-2">{item.a_phase_voltage.toFixed(2)}</td>
                            <td className="p-2">{item.b_phase_voltage.toFixed(2)}</td>
                            <td className="p-2">{item.c_phase_voltage.toFixed(2)}</td>
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