'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import DateTime from '@/components/DateTime'
import { User } from '@supabase/auth-helpers-nextjs'

type Phase = string;
type Measurement = {
  [key: string]: Phase[]
};
type Configuration = {
  [key: string]: Measurement
};

const configurations: { [key: string]: Configuration } = {
  'Three phase AC to Three phase AC': {
    input: {
      current: ['Phase A', 'Phase B', 'Phase C'],
      voltage: ['Phase A', 'Phase B', 'Phase C']
    },
    output: {
      current: ['Phase A', 'Phase B', 'Phase C'],
      voltage: ['Phase A', 'Phase B', 'Phase C']
    }
  },
  'DC to Three phase AC': {
    input: {
      dc: ['DC Current', 'DC Voltage']
    },
    output: {
      current: ['Phase A', 'Phase B', 'Phase C'],
      voltage: ['Phase A', 'Phase B', 'Phase C']
    }
  },
  'Three phase AC to DC': {
    input: {
      current: ['Phase A', 'Phase B', 'Phase C'],
      voltage: ['Phase A', 'Phase B', 'Phase C']
    },
    output: {
      dc: ['DC Current', 'DC Voltage']
    }
  },
  'DC to DC': {
    input: {
      dc: ['DC Current', 'DC Voltage']
    },
    output: {
      dc: ['DC Current', 'DC Voltage']
    }
  },
  'Single Phase AC to DC': {
    input: {
      ac: ['AC Current', 'AC Voltage']
    },
    output: {
      dc: ['DC Current', 'DC Voltage']
    }
  },
  'DC to Single Phase AC': {
    input: {
      dc: ['DC Current', 'DC Voltage']
    },
    output: {
      ac: ['AC Current', 'AC Voltage']
    }
  },
  'Single Phase AC to Single Phase AC': {
    input: {
      ac: ['AC Current', 'AC Voltage']
    },
    output: {
      ac: ['AC Current', 'AC Voltage']
    }
  }
}

// Add interface for real-time data
interface RealTimeData {
  id: number
  computer_ts: string
  "A Phase Voltage": number
  "A Phase Current": number
  "A Phase Active Power": number
  "A Phase Reactive Power": number
  "A Phase Apparent Power": number
  "A Power Factor": number
  "B Phase Voltage": number
  "B Phase Current": number
  "B Phase Active Power": number
  "B Phase Reactive Power": number
  "B Phase Apparent Power": number
  "B Power Factor": number
  "C Phase Voltage": number
  "C Phase Current": number
  "C Phase Active Power": number
  "C Phase Reactive Power": number
  "C Phase Apparent Power": number
  "C Power Factor": number
  "Frequency": number
  "DC Voltage": number
  "DC Current": number
  "Temperature": number
  created_at: string
}

interface OutputRealTimeData extends RealTimeData {} // Same structure as RealTimeData

// Update the interface to match the table structure
interface DeviceStatus {
  timestamp: string;
  relay_status: string | null;
  input_status: string | null;
  output_status: string | null;
  circuit_breaker_status: string | null;
  fault_type: string | null;
}

interface EnergyMetrics {
  activeEnergy: number;
  reactiveEnergy: number;
  apparentPower: number;
  powerFactor: number;
  loadConnected: boolean;
  energyConsumption: number;
}

export default function Dashboard() {
  const [mounted, setMounted] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState(Object.keys(configurations)[0])
  const [selectedPhase, setSelectedPhase] = useState<'A' | 'B' | 'C'>('A')
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<User | null>(null)
  const [inputData, setInputData] = useState<RealTimeData | null>(null)
  const [outputData, setOutputData] = useState<OutputRealTimeData | null>(null)
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);

  useEffect(() => {
    setMounted(true)
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
      }
    }
    checkUser()
  }, [])

  useEffect(() => {
    const fetchRealTimeData = async () => {
      // Fetch input data
      const { data: inputData, error: inputError } = await supabase
        .from('input_real_time_data')
        .select('*')
        .order('computer_ts', { ascending: false })
        .limit(1)
        .single()

      if (inputError) {
        console.error('Error fetching input real-time data:', inputError)
      } else {
        setInputData(inputData)
      }

      // Fetch output data
      const { data: outputData, error: outputError } = await supabase
        .from('output_real_time_data')
        .select('*')
        .order('computer_ts', { ascending: false })
        .limit(1)
        .single()

      if (outputError) {
        console.error('Error fetching output real-time data:', outputError)
      } else {
        setOutputData(outputData)
      }
    }

    // Initial fetch
    fetchRealTimeData()

    // Set up broadcast channel for input data
    const inputChannel = supabase
      .channel('input_realtime')
      .on('broadcast', { event: 'data_update' }, (payload: { payload: RealTimeData }) => {
        setInputData(payload.payload)
      })
      .subscribe()

    // Keep output data subscription as is
    const outputSubscription = supabase
      .channel('output_data_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'output_real_time_data' },
        (payload: { new: OutputRealTimeData }) => {
          setOutputData(payload.new)
        }
      )
      .subscribe()

    // Fetch every 5 seconds as backup
    const interval = setInterval(fetchRealTimeData, 5000)

    return () => {
      inputChannel.unsubscribe()
      outputSubscription.unsubscribe()
      clearInterval(interval)
    }
  }, [supabase])

  useEffect(() => {
    let isSubscribed = true;
    let statusPollingInterval: NodeJS.Timeout;

    const fetchDeviceStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('device_status')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;
        if (data && isSubscribed) {
          setDeviceStatus(data);
        }
      } catch (error) {
        console.error('Error fetching device status:', error);
      }
    };

    // Set up real-time subscription
    const channel = supabase
      .channel('device_status_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_status'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setDeviceStatus(payload.new as DeviceStatus);
          }
        }
      )
      .subscribe();

    // Initial fetch and polling
    fetchDeviceStatus();
    statusPollingInterval = setInterval(fetchDeviceStatus, 1000);

    return () => {
      isSubscribed = false;
      clearInterval(statusPollingInterval);
      channel.unsubscribe();
    };
  }, [supabase]);

  if (!mounted) return null

  return (
    <div className="min-h-screen min-w-full bg-[#111827] overflow-x-hidden overflow-y-auto">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 min-w-full"></div>
      
      <main className="relative z-10 min-h-screen p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 sm:mb-12 gap-4 mt-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-100 tracking-tight truncate">
              Solid State Transformer Protection Relay
            </h1>
            <DateTime />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8">
            <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 backdrop-blur-sm hover:border-gray-700 transition-colors">
              <h2 className="text-xl font-semibold text-gray-100 mb-6 flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
                Relay Indication Panel
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Relay Status:</span>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    deviceStatus?.relay_status?.toLowerCase() === 'healthy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    deviceStatus?.relay_status?.toLowerCase() === 'fault' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    deviceStatus?.relay_status?.toLowerCase() === 'tripped' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {deviceStatus?.relay_status?.toUpperCase() ?? 'UNKNOWN'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Configuration:</span>
                  <span className="text-blue-400 font-medium">{selectedConfig}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Input Status:</span>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    deviceStatus?.input_status?.toLowerCase() === 'healthy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {deviceStatus?.input_status?.toUpperCase() ?? 'UNKNOWN'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Output Status:</span>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    deviceStatus?.output_status?.toLowerCase() === 'healthy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {deviceStatus?.output_status?.toUpperCase() ?? 'UNKNOWN'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Circuit Breaker:</span>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    deviceStatus?.circuit_breaker_status?.toLowerCase() === 'closed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {deviceStatus?.circuit_breaker_status?.toUpperCase() ?? 'UNKNOWN'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Fault Status:</span>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    deviceStatus?.fault_type ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}>
                    {deviceStatus?.fault_type ? deviceStatus.fault_type.toUpperCase() : 'NO FAULTS'}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Last updated: {deviceStatus?.timestamp ? new Date(deviceStatus.timestamp).toLocaleString() : 'Never'}
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 backdrop-blur-sm hover:border-gray-700 transition-colors">
              <h2 className="text-xl font-semibold text-gray-100 mb-6 flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                Energy Monitoring Panel
              </h2>
              <div className="mb-4">
                <select
                  value={selectedPhase}
                  onChange={(e) => setSelectedPhase(e.target.value as 'A' | 'B' | 'C')}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 
                    text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                    appearance-none cursor-pointer"
                >
                  <option value="A">Phase A</option>
                  <option value="B">Phase B</option>
                  <option value="C">Phase C</option>
                </select>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Active Energy:</span>
                  <span className="text-gray-100 font-mono bg-gray-800/80 px-4 py-1.5 rounded-lg">
                    {(inputData?.[`${selectedPhase} Phase Active Power`] ?? 0).toFixed(2)} kWh
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Reactive Energy:</span>
                  <span className="text-gray-100 font-mono bg-gray-800/80 px-4 py-1.5 rounded-lg">
                    {(inputData?.[`${selectedPhase} Phase Reactive Power`] ?? 0).toFixed(2)} kVARh
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Apparent Power:</span>
                  <span className="text-gray-100 font-mono bg-gray-800/80 px-4 py-1.5 rounded-lg">
                    {(inputData?.[`${selectedPhase} Phase Apparent Power`] ?? 0).toFixed(2)} kVA
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Power Factor:</span>
                  <span className="text-gray-100 font-mono bg-gray-800/80 px-4 py-1.5 rounded-lg">
                    {(inputData?.[`${selectedPhase} Power Factor`] ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Frequency:</span>
                  <span className="text-gray-100 font-mono bg-gray-800/80 px-4 py-1.5 rounded-lg">
                    {(inputData?.["Frequency"] ?? 0).toFixed(2)} Hz
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Temperature:</span>
                  <span className="text-gray-100 font-mono bg-gray-800/80 px-4 py-1.5 rounded-lg">
                    {(inputData?.["Temperature"] ?? 0).toFixed(2)} °C
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <div className="bg-gray-900/50 p-3 sm:p-4 rounded-xl border border-gray-800">
              <select
                value={selectedConfig}
                onChange={(e) => setSelectedConfig(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-gray-800/50 border border-gray-700 
                  text-gray-100 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                  appearance-none cursor-pointer"
              >
                {Object.keys(configurations).map(config => (
                  <option key={config} value={config} className="bg-gray-900">
                    {config}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {Object.entries(configurations[selectedConfig]).map(([type, measurements]) => {
                const isInput = type === 'input';
                const data = isInput ? inputData : outputData;

                return (
                  <div key={type} className="space-y-4 sm:space-y-6">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 capitalize">
                      {type} Measurements
                    </h2>
                    <div className="space-y-4 sm:space-y-6 bg-gray-900/50 p-4 sm:p-6 rounded-xl border border-gray-800">
                      {Object.entries(measurements).map(([measureType, phases]) => (
                        <div key={measureType} className="space-y-2 sm:space-y-3">
                          <div className="flex justify-between items-center">
                            <h3 className="text-base sm:text-lg text-gray-300 capitalize font-medium">
                              {measureType}
                            </h3>
                            <button
                              onClick={() => {
                                const basePath = isInput ? '/dashboard/details/input' : '/dashboard/details/output';
                                let detailPath = `${basePath}/current`; // Default path
                                
                                // Handle routing based on configuration and measurement type
                                if (measureType === 'voltage') {
                                  detailPath = `${basePath}/voltage`;
                                } else if (measureType === 'dc') {
                                  detailPath = `${basePath}/dc`;
                                } else if (measureType === 'ac') {
                                  // For single phase AC, route to the same pages as three phase
                                  detailPath = phases.includes('AC Voltage') 
                                    ? `${basePath}/voltage`
                                    : `${basePath}/current`;
                                }
                                router.push(detailPath);
                              }}
                              className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 rounded-lg 
                                hover:bg-blue-500/30 transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                          <div className="space-y-2">
                            {phases.map((phase: string) => {
                              let value = 0;
                              if (data) {
                                const fieldMap: { [key: string]: keyof RealTimeData } = {
                                  'Phase A': measureType === 'voltage' ? 'A Phase Voltage' : 'A Phase Current',
                                  'Phase B': measureType === 'voltage' ? 'B Phase Voltage' : 'B Phase Current',
                                  'Phase C': measureType === 'voltage' ? 'C Phase Voltage' : 'C Phase Current',
                                  'DC Voltage': 'DC Voltage',
                                  'DC Current': 'DC Current',
                                  'AC Voltage': 'A Phase Voltage', // Map single phase AC to Phase A
                                  'AC Current': 'A Phase Current'  // Map single phase AC to Phase A
                                };
                                const field = fieldMap[phase];
                                if (field && data[field] !== undefined) {
                                  value = data[field] as number;
                                }
                              }

                              return (
                                <div key={phase} 
                                  className="flex justify-between items-center p-2 sm:p-3 bg-gray-800/50 
                                    rounded-lg border border-gray-700 text-sm sm:text-base"
                                >
                                  <span className="text-gray-400">{phase}:</span>
                                  <span className="text-gray-100 font-mono">
                                    {value.toFixed(2)} {measureType === 'voltage' ? 'V' : 'A'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      <Sidebar />
    </div>
  )
} 