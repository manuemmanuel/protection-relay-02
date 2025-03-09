'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import DateTime from '@/components/DateTime'
import {
  ArrowLeft,
  Zap,
  Activity,
  Thermometer,
  Battery,
  Gauge
} from 'lucide-react'

interface OutputRealTimeData {
  id: string
  computer_ts: string
  a_phase_voltage: number
  a_phase_current: number
  a_phase_active_power: number
  a_phase_reactive_power: number
  a_phase_apparent_power: number
  a_power_factor: number
  b_phase_voltage: number
  b_phase_current: number
  b_phase_active_power: number
  b_phase_reactive_power: number
  b_phase_apparent_power: number
  b_power_factor: number
  c_phase_voltage: number
  c_phase_current: number
  c_phase_active_power: number
  c_phase_reactive_power: number
  c_phase_apparent_power: number
  c_power_factor: number
  frequency: number
  dc_voltage: number
  dc_current: number
  temperature: number
}

export default function OutputDetails() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [realTimeData, setRealTimeData] = useState<OutputRealTimeData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      console.log('Fetching data from output_real_time_data table...')
      const { data, error } = await supabase
        .from('output_real_time_data')
        .select('*')
        .order('computer_ts', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Error details:', error)
        throw error
      }

      if (data) {
        console.log('Received data:', data)
        setRealTimeData(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isSubscribed = true

    // Set up real-time subscription
    const setupSubscription = () => {
      console.log('Setting up real-time subscription...')
      const channel = supabase
        .channel('output_real_time_changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'output_real_time_data'
          },
          (payload) => {
            console.log('Real-time update received:', payload)
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              setRealTimeData(payload.new as OutputRealTimeData)
            }
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status)
        })

      return channel
    }

    // Initial fetch
    fetchData()
    
    // Set up real-time subscription
    const channel = setupSubscription()

    // Polling for updates every second
    const pollingInterval = setInterval(() => {
      if (isSubscribed) {
        console.log('Polling for updates...')
        fetchData()
      }
    }, 1000)

    return () => {
      console.log('Cleaning up subscriptions and intervals...')
      isSubscribed = false
      channel.unsubscribe()
      clearInterval(pollingInterval)
    }
  }, [supabase]) // Note: fetchData is intentionally omitted to avoid infinite loop

  const PhaseCard = ({ 
    phase,
    voltage,
    current,
    activePower,
    reactivePower,
    apparentPower,
    powerFactor,
    color
  }: {
    phase: string
    voltage: number
    current: number
    activePower: number
    reactivePower: number
    apparentPower: number
    powerFactor: number
    color: string
  }) => (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`bg-${color}-500/10 p-2 rounded-lg`}>
          <Zap size={24} className={`text-${color}-500`} />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold">Phase {phase}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-gray-800/40 rounded-lg p-3">
          <div className="text-sm text-gray-400">Voltage</div>
          <div className="text-lg sm:text-xl font-mono mt-1">{voltage.toFixed(2)} V</div>
        </div>
        <div className="bg-gray-800/40 rounded-lg p-3">
          <div className="text-sm text-gray-400">Current</div>
          <div className="text-lg sm:text-xl font-mono mt-1">{current.toFixed(2)} A</div>
        </div>
        <div className="bg-gray-800/40 rounded-lg p-3">
          <div className="text-sm text-gray-400">Active Power</div>
          <div className="text-lg sm:text-xl font-mono mt-1">{activePower.toFixed(2)} W</div>
        </div>
        <div className="bg-gray-800/40 rounded-lg p-3">
          <div className="text-sm text-gray-400">Reactive Power</div>
          <div className="text-lg sm:text-xl font-mono mt-1">{reactivePower.toFixed(2)} VAR</div>
        </div>
        <div className="bg-gray-800/40 rounded-lg p-3">
          <div className="text-sm text-gray-400">Apparent Power</div>
          <div className="text-lg sm:text-xl font-mono mt-1">{apparentPower.toFixed(2)} VA</div>
        </div>
        <div className="bg-gray-800/40 rounded-lg p-3">
          <div className="text-sm text-gray-400">Power Factor</div>
          <div className="text-lg sm:text-xl font-mono mt-1">{powerFactor.toFixed(3)}</div>
        </div>
      </div>
    </div>
  )

  const SystemCard = ({
    icon,
    title,
    value,
    unit,
    color,
    description
  }: {
    icon: React.ReactNode
    title: string
    value: number
    unit: string
    color: string
    description: string
  }) => (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`bg-${color}-500/10 p-2 rounded-lg`}>
          {icon}
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-semibold">{title}</h3>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
      <div className="bg-gray-800/40 rounded-lg p-4">
        <div className="text-2xl sm:text-3xl font-mono">
          {value.toFixed(2)} {unit}
        </div>
      </div>
    </div>
  )

  // Add debug display for raw data
  const DebugPanel = () => (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 sm:p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Debug Information</h3>
        <span className="text-sm text-gray-400">Raw Data View</span>
      </div>
      <pre className="bg-gray-800/40 rounded-lg p-4 overflow-auto text-sm">
        {JSON.stringify(realTimeData, null, 2)}
      </pre>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#111827] text-gray-100">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
      
      <div className="relative">
        <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-100 transition-colors group"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back to Dashboard</span>
              </button>
              <DateTime />
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Output Real-Time Data</h1>
                <p className="text-gray-400 mt-2">Comprehensive view of all output measurements</p>
              </div>
              <div className="text-sm text-gray-400">
                Table: output_real_time_data
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-blue-400 animate-pulse">Loading data from output_real_time_data...</div>
              </div>
            ) : realTimeData ? (
              <div className="grid gap-6">
                {/* Phase Data */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <PhaseCard
                    phase="A"
                    voltage={realTimeData.a_phase_voltage}
                    current={realTimeData.a_phase_current}
                    activePower={realTimeData.a_phase_active_power}
                    reactivePower={realTimeData.a_phase_reactive_power}
                    apparentPower={realTimeData.a_phase_apparent_power}
                    powerFactor={realTimeData.a_power_factor}
                    color="yellow"
                  />
                  <PhaseCard
                    phase="B"
                    voltage={realTimeData.b_phase_voltage}
                    current={realTimeData.b_phase_current}
                    activePower={realTimeData.b_phase_active_power}
                    reactivePower={realTimeData.b_phase_reactive_power}
                    apparentPower={realTimeData.b_phase_apparent_power}
                    powerFactor={realTimeData.b_power_factor}
                    color="blue"
                  />
                  <PhaseCard
                    phase="C"
                    voltage={realTimeData.c_phase_voltage}
                    current={realTimeData.c_phase_current}
                    activePower={realTimeData.c_phase_active_power}
                    reactivePower={realTimeData.c_phase_reactive_power}
                    apparentPower={realTimeData.c_phase_apparent_power}
                    powerFactor={realTimeData.c_power_factor}
                    color="red"
                  />
                </div>

                {/* System Parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <SystemCard
                    icon={<Activity size={24} className="text-purple-500" />}
                    title="Frequency"
                    value={realTimeData.frequency}
                    unit="Hz"
                    color="purple"
                    description="System frequency"
                  />
                  <SystemCard
                    icon={<Battery size={24} className="text-green-500" />}
                    title="DC Voltage"
                    value={realTimeData.dc_voltage}
                    unit="V"
                    color="green"
                    description="DC bus voltage"
                  />
                  <SystemCard
                    icon={<Gauge size={24} className="text-blue-500" />}
                    title="DC Current"
                    value={realTimeData.dc_current}
                    unit="A"
                    color="blue"
                    description="DC bus current"
                  />
                  <SystemCard
                    icon={<Thermometer size={24} className="text-orange-500" />}
                    title="Temperature"
                    value={realTimeData.temperature}
                    unit="°C"
                    color="orange"
                    description="System temperature"
                  />
                </div>

                {/* Timestamp */}
                <div className="text-sm text-gray-400 text-right">
                  Last updated: {new Date(realTimeData.computer_ts).toLocaleString()}
                </div>

                {/* Add debug panel in development */}
                {process.env.NODE_ENV === 'development' && <DebugPanel />}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="text-gray-400">No data available in output_real_time_data table</div>
                <button
                  onClick={() => fetchData()}
                  className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  Retry Loading
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
} 