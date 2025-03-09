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

// Add new interfaces for the panels
interface RelayStatus {
  status: 'healthy' | 'fault' | 'tripped';
  configuration: string;
  inputStatus: 'healthy' | 'fault';
  outputStatus: 'healthy' | 'fault';
  breakerStatus: 'open' | 'closed';
  faultStatus: boolean;
}

interface EnergyMetrics {
  activeEnergy: number;
  reactiveEnergy: number;
  apparentPower: number;
  powerFactor: number;
  loadConnected: boolean;
  energyConsumption: number;
}

// Add this interface near your other interfaces
interface RealTimeStatus {
  id: string;
  trip_button: number;
  reset_button: number;
  // ... other fields as needed
}

export default function Dashboard() {
  const [mounted, setMounted] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState(Object.keys(configurations)[0])
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<User | null>(null)
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null)
  const [relayStatus, setRelayStatus] = useState<RelayStatus>({
    status: 'healthy',
    configuration: selectedConfig,
    inputStatus: 'healthy',
    outputStatus: 'healthy',
    breakerStatus: 'closed',
    faultStatus: false
  });
  const [realTimeStatus, setRealTimeStatus] = useState<RealTimeStatus | null>(null);

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
      const { data, error } = await supabase
        .from('real_time_data')
        .select('*')
        .order('computer_ts', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching real-time data:', error)
        return
      }

      setRealTimeData(data)
    }

    // Initial fetch
    fetchRealTimeData()

    // Set up real-time subscription
    const subscription = supabase
      .channel('real_time_data_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'real_time_data' },
        (payload) => {
          setRealTimeData(payload.new as RealTimeData)
        }
      )
      .subscribe()

    // Fetch every 5 seconds as backup
    const interval = setInterval(fetchRealTimeData, 5000)

    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [supabase])

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // First try to fetch existing status
        const { data: existingData, error: fetchError } = await supabase
          .from('real_time_status')
          .select('*')
          .order('id', { ascending: false })
          .limit(1)
          .single();

        if (fetchError && fetchError.code === 'PGRST116') { // No rows returned
          // Create initial record if none exists
          const { data: newData, error: insertError } = await supabase
            .from('real_time_status')
            .insert({
              output_phase_c_over_voltage_status: 0,
              output_phase_c_over_voltage_set_value: 0,
              output_phase_a_under_voltage_status: 0,
              output_phase_a_under_voltage_set_value: 0,
              output_phase_b_under_voltage_status: 0,
              output_phase_b_under_voltage_set_value: 0,
              output_phase_c_under_voltage_status: 0,
              output_phase_c_under_voltage_set_value: 0,
              output_over_frequency_status: 0,
              output_over_frequency_set_value: 0,
              output_under_frequency_status: 0,
              output_under_frequency_set_value: 0,
              output_dc_over_voltage_status: 0,
              output_dc_over_voltage_set_value: 0,
              output_dc_under_voltage_status: 0,
              output_dc_under_voltage_set_value: 0,
              output_dc_over_current_status: 0,
              output_dc_over_current_set_value: 0,
              output_over_temperature_status: 0,
              output_over_temperature_set_value: 0,
              instantaneous_trip_characteristics_status: 0,
              inverse_time_characteristics_status: 0,
              definite_time_characteristics_status: 0,
              differential_relay_characteristics_status: 0,
              trip_button: 0,
              reset_button: 0
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setRealTimeStatus(newData);
        } else if (fetchError) {
          throw fetchError;
        } else {
          setRealTimeStatus(existingData);
        }
      } catch (error) {
        console.error('Error handling status:', error);
      }
    };

    // Initial fetch
    fetchStatus();

    // Subscribe to changes
    const subscription = supabase
      .channel('real_time_status_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'real_time_status' },
        (payload) => {
          setRealTimeStatus(payload.new as RealTimeStatus);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleTrip = async () => {
    try {
      const { data, error } = await supabase
        .from('real_time_status')
        .update({ trip_button: realTimeStatus?.trip_button === 1 ? 0 : 1 })
        .eq('id', realTimeStatus?.id)
        .select()
        .single();

      if (error) throw error;
      setRealTimeStatus(data);
    } catch (error) {
      console.error('Error updating trip status:', error);
    }
  };

  const handleReset = async () => {
    try {
      const { data, error } = await supabase
        .from('real_time_status')
        .update({ reset_button: realTimeStatus?.reset_button === 1 ? 0 : 1 })
        .eq('id', realTimeStatus?.id)
        .select()
        .single();

      if (error) throw error;
      setRealTimeStatus(data);
    } catch (error) {
      console.error('Error updating reset status:', error);
    }
  };

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
                    relayStatus.status === 'healthy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    relayStatus.status === 'fault' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {relayStatus.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Configuration:</span>
                  <span className="text-blue-400 font-medium">{selectedConfig}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Input/Output Status:</span>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    relayStatus.inputStatus === 'healthy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {relayStatus.inputStatus.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Circuit Breaker:</span>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    relayStatus.breakerStatus === 'closed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {relayStatus.breakerStatus.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Fault Status:</span>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    relayStatus.faultStatus ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}>
                    {relayStatus.faultStatus ? 'FAULT DETECTED' : 'NO FAULTS'}
                  </span>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={handleTrip}
                    className={`flex-1 py-2.5 rounded-lg transition-colors border font-medium ${
                      realTimeStatus?.trip_button === 1
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                    }`}
                  >
                    {realTimeStatus?.trip_button === 1 ? 'Tripped' : 'Trip'}
                  </button>
                  <button
                    onClick={handleReset}
                    className={`flex-1 py-2.5 rounded-lg transition-colors border font-medium ${
                      realTimeStatus?.reset_button === 1
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30'
                    }`}
                  >
                    {realTimeStatus?.reset_button === 1 ? 'Reset' : 'Reset'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 backdrop-blur-sm hover:border-gray-700 transition-colors">
              <h2 className="text-xl font-semibold text-gray-100 mb-6 flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                Energy Monitoring Panel
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Active Energy:</span>
                  <span className="text-gray-100 font-mono bg-gray-800/80 px-4 py-1.5 rounded-lg">
                    {(realTimeData?.a_phase_active_power ?? 0).toFixed(2)} kWh
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Reactive Energy:</span>
                  <span className="text-gray-100 font-mono bg-gray-800/80 px-4 py-1.5 rounded-lg">
                    {(realTimeData?.a_phase_reactive_power ?? 0).toFixed(2)} kVARh
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Apparent Power:</span>
                  <span className="text-gray-100 font-mono bg-gray-800/80 px-4 py-1.5 rounded-lg">
                    {(realTimeData?.a_phase_apparent_power ?? 0).toFixed(2)} kVA
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Power Factor:</span>
                  <span className="text-gray-100 font-mono bg-gray-800/80 px-4 py-1.5 rounded-lg">
                    {(realTimeData?.a_power_factor ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Frequency:</span>
                  <span className="text-gray-100 font-mono bg-gray-800/80 px-4 py-1.5 rounded-lg">
                    {(realTimeData?.frequency ?? 0).toFixed(2)} Hz
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Temperature:</span>
                  <span className="text-gray-100 font-mono bg-gray-800/80 px-4 py-1.5 rounded-lg">
                    {(realTimeData?.temperature ?? 0).toFixed(2)} °C
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Load Connected:</span>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    (realTimeData?.a_phase_current ?? 0) > 0 ? 
                    'bg-green-500/20 text-green-400 border border-green-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {(realTimeData?.a_phase_current ?? 0) > 0 ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg border border-gray-800/50">
                  <span className="text-gray-400">Energy Consumption:</span>
                  <span className="text-gray-100 font-mono bg-gray-800/80 px-4 py-1.5 rounded-lg">
                    {(realTimeData?.a_phase_active_power ?? 0).toFixed(2)} kW
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
              {Object.entries(configurations[selectedConfig]).map(([type, measurements]) => (
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
                              // Use consistent paths for current and voltage
                              const path = measureType === 'current' 
                                ? '/dashboard/details/input/current'
                                : measureType === 'voltage'
                                ? '/dashboard/details/input/voltage'
                                : measureType === 'dc'
                                ? '/dashboard/details/input/dc'
                                : '/dashboard/details/input/ac';
                              router.push(path);
                            }}
                            className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 rounded-lg 
                              hover:bg-blue-500/30 transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                        <div className="space-y-2">
                          {phases.map((phase: string) => {
                            let value = 0
                            if (realTimeData) {
                              // Map the phase to the corresponding data field
                              const fieldMap: { [key: string]: string } = {
                                'Phase A': measureType === 'voltage' ? 'a_phase_voltage' : 'a_phase_current',
                                'Phase B': measureType === 'voltage' ? 'b_phase_voltage' : 'b_phase_current',
                                'Phase C': measureType === 'voltage' ? 'c_phase_voltage' : 'c_phase_current',
                                'DC Voltage': 'dc_voltage',
                                'DC Current': 'dc_current',
                                'AC Voltage': 'a_phase_voltage', // Using Phase A for single phase
                                'AC Current': 'a_phase_current'  // Using Phase A for single phase
                              }
                              value = realTimeData[fieldMap[phase] as keyof RealTimeData] as number
                            }

                            return (
                              <div key={phase} 
                                className="flex justify-between items-center p-2 sm:p-3 bg-gray-800/50 
                                  rounded-lg border border-gray-700 text-sm sm:text-base"
                              >
                                <span className="text-gray-400">{phase}:</span>
                                <span className="text-gray-100 font-mono">
                                  {value.toFixed(2)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Sidebar />
    </div>
  )
} 