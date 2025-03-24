'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Zap, AlertTriangle, Thermometer, Activity, Clock, Shield,
  User, LogOut, Mail, Building, Phone
} from 'lucide-react'

interface RealTimeStatus {
  id?: string
  // Input Phase A Parameters
  input_phase_a_over_current_status: number
  input_phase_a_over_current_set_value: number
  input_phase_a_over_voltage_status: number
  input_phase_a_over_voltage_set_value: number
  input_phase_a_under_voltage_status: number
  input_phase_a_under_voltage_set_value: number

  // Input Phase B Parameters
  input_phase_b_over_current_status: number
  input_phase_b_over_current_set_value: number
  input_phase_b_over_voltage_status: number
  input_phase_b_over_voltage_set_value: number
  input_phase_b_under_voltage_status: number
  input_phase_b_under_voltage_set_value: number

  // Input Phase C Parameters
  input_phase_c_over_current_status: number
  input_phase_c_over_current_set_value: number
  input_phase_c_over_voltage_status: number
  input_phase_c_over_voltage_set_value: number
  input_phase_c_under_voltage_status: number
  input_phase_c_under_voltage_set_value: number

  // Input Frequency Parameters
  input_over_frequency_status: number
  input_over_frequency_set_value: number
  input_under_frequency_status: number
  input_under_frequency_set_value: number

  // Input DC Parameters
  input_dc_over_voltage_status: number
  input_dc_over_voltage_set_value: number
  input_dc_under_voltage_status: number
  input_dc_under_voltage_set_value: number
  input_dc_over_current_status: number
  input_dc_over_current_set_value: number

  // Input Temperature Parameters
  input_over_temperature_status: number
  input_over_temperature_set_value: number

  // Output Phase A Parameters
  output_phase_a_over_current_status: number
  output_phase_a_over_current_set_value: number
  output_phase_a_over_voltage_status: number
  output_phase_a_over_voltage_set_value: number
  output_phase_a_under_voltage_status: number
  output_phase_a_under_voltage_set_value: number

  // Output Phase B Parameters
  output_phase_b_over_current_status: number
  output_phase_b_over_current_set_value: number
  output_phase_b_over_voltage_status: number
  output_phase_b_over_voltage_set_value: number
  output_phase_b_under_voltage_status: number
  output_phase_b_under_voltage_set_value: number

  // Output Phase C Parameters
  output_phase_c_over_current_status: number
  output_phase_c_over_current_set_value: number
  output_phase_c_over_voltage_status: number
  output_phase_c_over_voltage_set_value: number
  output_phase_c_under_voltage_status: number
  output_phase_c_under_voltage_set_value: number

  // Output Frequency Parameters
  output_over_frequency_status: number
  output_over_frequency_set_value: number
  output_under_frequency_status: number
  output_under_frequency_set_value: number

  // Output DC Parameters
  output_dc_over_voltage_status: number
  output_dc_over_voltage_set_value: number
  output_dc_under_voltage_status: number
  output_dc_under_voltage_set_value: number
  output_dc_over_current_status: number
  output_dc_over_current_set_value: number

  // Output Temperature Parameters
  output_over_temperature_status: number
  output_over_temperature_set_value: number

  // Trip Characteristics
  instantaneous_trip_characteristics_status: number
  inverse_time_characteristics_status: number
  definite_time_characteristics_status: number
  differential_relay_characteristics_status: number

  // Control Buttons
  trip_button: number
  reset_button: number
}

interface UserProfile {
  id: string
  name: string
  email: string
  company: string
  phone: string
}

interface FaultSettings {
  id?: string;
  user_id?: string;
  over_voltage_fault_enabled: boolean;
  over_voltage_set_value: number;
  over_voltage_time_chara: number;
  over_current_fault_enabled: boolean;
  over_current_set_value: number;
  over_current_time_chara: number;
}

// Add a Toggle Switch component for reusability and better click handling
const ToggleSwitch = ({ 
  id, 
  checked, 
  onChange 
}: { 
  id: string; 
  checked: boolean; 
  onChange: (checked: boolean) => void;
}) => (
  <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only peer"
    />
    <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none peer-focus:ring-2 
      peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full 
      peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
      after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border 
      after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500">
    </div>
  </label>
);

export default function Settings() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [status, setStatus] = useState<RealTimeStatus>({
    // Input Phase A Parameters
    input_phase_a_over_current_status: 1,
    input_phase_a_over_current_set_value: 10,
    input_phase_a_over_voltage_status: 0,
    input_phase_a_over_voltage_set_value: 10,
    input_phase_a_under_voltage_status: 0,
    input_phase_a_under_voltage_set_value: 0,

    // Input Phase B Parameters
    input_phase_b_over_current_status: 0,
    input_phase_b_over_current_set_value: 20,
    input_phase_b_over_voltage_status: 0,
    input_phase_b_over_voltage_set_value: 3,
    input_phase_b_under_voltage_status: 0,
    input_phase_b_under_voltage_set_value: 0,

    // Input Phase C Parameters
    input_phase_c_over_current_status: 0,
    input_phase_c_over_current_set_value: 40,
    input_phase_c_over_voltage_status: 0,
    input_phase_c_over_voltage_set_value: 0,
    input_phase_c_under_voltage_status: 0,
    input_phase_c_under_voltage_set_value: 0,

    // Input Frequency Parameters
    input_over_frequency_status: 0,
    input_over_frequency_set_value: 0,
    input_under_frequency_status: 0,
    input_under_frequency_set_value: 0,

    // Input DC Parameters
    input_dc_over_voltage_status: 0,
    input_dc_over_voltage_set_value: 0,
    input_dc_under_voltage_status: 0,
    input_dc_under_voltage_set_value: 0,
    input_dc_over_current_status: 0,
    input_dc_over_current_set_value: 0,

    // Input Temperature Parameters
    input_over_temperature_status: 0,
    input_over_temperature_set_value: 0,

    // Output Phase A Parameters
    output_phase_a_over_current_status: 0,
    output_phase_a_over_current_set_value: 0,
    output_phase_a_over_voltage_status: 0,
    output_phase_a_over_voltage_set_value: 50,
    output_phase_a_under_voltage_status: 0,
    output_phase_a_under_voltage_set_value: 0,

    // Output Phase B Parameters
    output_phase_b_over_current_status: 0,
    output_phase_b_over_current_set_value: 0,
    output_phase_b_over_voltage_status: 0,
    output_phase_b_over_voltage_set_value: 0,
    output_phase_b_under_voltage_status: 0,
    output_phase_b_under_voltage_set_value: 0,

    // Output Phase C Parameters
    output_phase_c_over_current_status: 0,
    output_phase_c_over_current_set_value: 0,
    output_phase_c_over_voltage_status: 0,
    output_phase_c_over_voltage_set_value: 0,
    output_phase_c_under_voltage_status: 0,
    output_phase_c_under_voltage_set_value: 0,

    // Output Frequency Parameters
    output_over_frequency_status: 0,
    output_over_frequency_set_value: 0,
    output_under_frequency_status: 0,
    output_under_frequency_set_value: 0,

    // Output DC Parameters
    output_dc_over_voltage_status: 0,
    output_dc_over_voltage_set_value: 0,
    output_dc_under_voltage_status: 0,
    output_dc_under_voltage_set_value: 0,
    output_dc_over_current_status: 0,
    output_dc_over_current_set_value: 0,

    // Output Temperature Parameters
    output_over_temperature_status: 0,
    output_over_temperature_set_value: 0,

    // Trip Characteristics
    instantaneous_trip_characteristics_status: 0,
    inverse_time_characteristics_status: 0,
    definite_time_characteristics_status: 0,
    differential_relay_characteristics_status: 0,

    // Control Buttons
    trip_button: 0,
    reset_button: 0
  })
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    company: '',
    phone: ''
  })
  const [faultSettings, setFaultSettings] = useState<FaultSettings>({
    over_voltage_fault_enabled: false,
    over_voltage_set_value: 0,
    over_voltage_time_chara: 0,
    over_current_fault_enabled: false,
    over_current_set_value: 0,
    over_current_time_chara: 0
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Fetch user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // Create initial profile
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert([{
              id: session.user.id,
              name: '',
              email: session.user.email,
              company: '',
              phone: ''
            }])
            .select()
            .single()

          if (!insertError && newProfile) {
            setProfile(newProfile)
          }
        }
        console.error('Error fetching profile:', profileError)
        return
      }

      if (profileData) {
        setProfile(profileData)
      }
    }

    fetchUserData()
  }, [supabase, router])

  useEffect(() => {
    const fetchStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('user_input_data')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('user_input_data')
            .insert([{
              ...status,
              user_id: session.user.id
            }])
            .select()
            .single()

          if (!insertError && newData) {
            setStatus(newData)
          }
        }
        console.error('Error fetching status:', error)
        return
      }

      if (data) {
        setStatus(data)
      }
    }

    fetchStatus()
  }, [supabase, router])

  useEffect(() => {
    const fetchFaultSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('fault_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Create initial fault settings
          const { data: newData, error: insertError } = await supabase
            .from('fault_settings')
            .insert([{
              user_id: session.user.id,
              over_voltage_fault_enabled: false,
              over_voltage_set_value: 0,
              over_voltage_time_chara: 0,
              over_current_fault_enabled: false,
              over_current_set_value: 0,
              over_current_time_chara: 0
            }])
            .select()
            .single();

          if (!insertError && newData) {
            setFaultSettings(newData);
          } else {
            console.error('Error creating fault settings:', insertError);
          }
        } else {
          console.error('Error fetching fault settings:', error);
        }
        return;
      }

      if (data) {
        setFaultSettings(data);
      }
    };

    fetchFaultSettings();
  }, [supabase, router]);

  const handleStatusChange = async (field: keyof RealTimeStatus, value: number) => {
    const newStatus = { ...status, [field]: value }
    setStatus(newStatus)
    setSaveStatus('saving')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No authenticated user')
      }

      // Handle trip and reset actions separately
      if (field === 'trip_button' || field === 'reset_button') {
        const actionType = field === 'trip_button' ? 'trip' : 'reset'
        
        // Insert a new control action
        const { error: actionError } = await supabase
          .from('relay_control_actions')
          .insert({
            action_type: actionType,
            status: 'pending',
            user_id: session.user.id
          })

        if (actionError) {
          throw actionError
        }
      }

      // Update all settings in user_input_data
      const { error: statusError } = await supabase
        .from('user_input_data')
        .upsert({
          ...newStatus,
          user_id: session.user.id,
          // Input Phase A Parameters
          input_phase_a_over_current_status: newStatus.input_phase_a_over_current_status,
          input_phase_a_over_current_set_value: newStatus.input_phase_a_over_current_set_value,
          input_phase_a_over_voltage_status: newStatus.input_phase_a_over_voltage_status,
          input_phase_a_over_voltage_set_value: newStatus.input_phase_a_over_voltage_set_value,
          input_phase_a_under_voltage_status: newStatus.input_phase_a_under_voltage_status,
          input_phase_a_under_voltage_set_value: newStatus.input_phase_a_under_voltage_set_value,

          // Input Phase B Parameters
          input_phase_b_over_current_status: newStatus.input_phase_b_over_current_status,
          input_phase_b_over_current_set_value: newStatus.input_phase_b_over_current_set_value,
          input_phase_b_over_voltage_status: newStatus.input_phase_b_over_voltage_status,
          input_phase_b_over_voltage_set_value: newStatus.input_phase_b_over_voltage_set_value,
          input_phase_b_under_voltage_status: newStatus.input_phase_b_under_voltage_status,
          input_phase_b_under_voltage_set_value: newStatus.input_phase_b_under_voltage_set_value,

          // Input Phase C Parameters
          input_phase_c_over_current_status: newStatus.input_phase_c_over_current_status,
          input_phase_c_over_current_set_value: newStatus.input_phase_c_over_current_set_value,
          input_phase_c_over_voltage_status: newStatus.input_phase_c_over_voltage_status,
          input_phase_c_over_voltage_set_value: newStatus.input_phase_c_over_voltage_set_value,
          input_phase_c_under_voltage_status: newStatus.input_phase_c_under_voltage_status,
          input_phase_c_under_voltage_set_value: newStatus.input_phase_c_under_voltage_set_value,

          // Input Frequency Parameters
          input_over_frequency_status: newStatus.input_over_frequency_status,
          input_over_frequency_set_value: newStatus.input_over_frequency_set_value,
          input_under_frequency_status: newStatus.input_under_frequency_status,
          input_under_frequency_set_value: newStatus.input_under_frequency_set_value,

          // Input DC Parameters
          input_dc_over_voltage_status: newStatus.input_dc_over_voltage_status,
          input_dc_over_voltage_set_value: newStatus.input_dc_over_voltage_set_value,
          input_dc_under_voltage_status: newStatus.input_dc_under_voltage_status,
          input_dc_under_voltage_set_value: newStatus.input_dc_under_voltage_set_value,
          input_dc_over_current_status: newStatus.input_dc_over_current_status,
          input_dc_over_current_set_value: newStatus.input_dc_over_current_set_value,

          // Input Temperature Parameters
          input_over_temperature_status: newStatus.input_over_temperature_status,
          input_over_temperature_set_value: newStatus.input_over_temperature_set_value,

          // Output Phase A Parameters
          output_phase_a_over_current_status: newStatus.output_phase_a_over_current_status,
          output_phase_a_over_current_set_value: newStatus.output_phase_a_over_current_set_value,
          output_phase_a_over_voltage_status: newStatus.output_phase_a_over_voltage_status,
          output_phase_a_over_voltage_set_value: newStatus.output_phase_a_over_voltage_set_value,
          output_phase_a_under_voltage_status: newStatus.output_phase_a_under_voltage_status,
          output_phase_a_under_voltage_set_value: newStatus.output_phase_a_under_voltage_set_value,

          // Output Phase B Parameters
          output_phase_b_over_current_status: newStatus.output_phase_b_over_current_status,
          output_phase_b_over_current_set_value: newStatus.output_phase_b_over_current_set_value,
          output_phase_b_over_voltage_status: newStatus.output_phase_b_over_voltage_status,
          output_phase_b_over_voltage_set_value: newStatus.output_phase_b_over_voltage_set_value,
          output_phase_b_under_voltage_status: newStatus.output_phase_b_under_voltage_status,
          output_phase_b_under_voltage_set_value: newStatus.output_phase_b_under_voltage_set_value,

          // Output Phase C Parameters
          output_phase_c_over_current_status: newStatus.output_phase_c_over_current_status,
          output_phase_c_over_current_set_value: newStatus.output_phase_c_over_current_set_value,
          output_phase_c_over_voltage_status: newStatus.output_phase_c_over_voltage_status,
          output_phase_c_over_voltage_set_value: newStatus.output_phase_c_over_voltage_set_value,
          output_phase_c_under_voltage_status: newStatus.output_phase_c_under_voltage_status,
          output_phase_c_under_voltage_set_value: newStatus.output_phase_c_under_voltage_set_value,

          // Output Frequency Parameters
          output_over_frequency_status: newStatus.output_over_frequency_status,
          output_over_frequency_set_value: newStatus.output_over_frequency_set_value,
          output_under_frequency_status: newStatus.output_under_frequency_status,
          output_under_frequency_set_value: newStatus.output_under_frequency_set_value,

          // Output DC Parameters
          output_dc_over_voltage_status: newStatus.output_dc_over_voltage_status,
          output_dc_over_voltage_set_value: newStatus.output_dc_over_voltage_set_value,
          output_dc_under_voltage_status: newStatus.output_dc_under_voltage_status,
          output_dc_under_voltage_set_value: newStatus.output_dc_under_voltage_set_value,
          output_dc_over_current_status: newStatus.output_dc_over_current_status,
          output_dc_over_current_set_value: newStatus.output_dc_over_current_set_value,

          // Output Temperature Parameters
          output_over_temperature_status: newStatus.output_over_temperature_status,
          output_over_temperature_set_value: newStatus.output_over_temperature_set_value,

          // Trip Characteristics
          instantaneous_trip_characteristics_status: newStatus.instantaneous_trip_characteristics_status,
          inverse_time_characteristics_status: newStatus.inverse_time_characteristics_status,
          definite_time_characteristics_status: newStatus.definite_time_characteristics_status,
          differential_relay_characteristics_status: newStatus.differential_relay_characteristics_status,

          // Control Buttons
          trip_button: newStatus.trip_button,
          reset_button: newStatus.reset_button
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .eq('id', status.id)
        .eq('user_id', session.user.id)

      if (statusError) {
        throw statusError
      }

      setSaveStatus('saved')
    } catch (error) {
      console.error('Error updating status:', error)
      setSaveStatus('error')
    }

    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  const handleProfileChange = async (field: keyof UserProfile, value: string) => {
    const newProfile = { ...profile, [field]: value }
    setProfile(newProfile)
    setSaveStatus('saving')

    const { error } = await supabase
      .from('user_profiles')
      .update(newProfile)
      .eq('id', profile.id)

    if (error) {
      console.error('Error updating profile:', error)
      setSaveStatus('error')
    } else {
      setSaveStatus('saved')
    }

    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error logging out:', error)
    } else {
      router.push('/login')
    }
  }

  const handleFaultSettingChange = async (field: keyof FaultSettings, value: boolean | number) => {
    const newSettings = { ...faultSettings, [field]: value };
    setFaultSettings(newSettings);
    setSaveStatus('saving');

    try {
      const { error } = await supabase
        .from('fault_settings')
        .update(newSettings)
        .eq('id', faultSettings.id)
        .eq('user_id', faultSettings.user_id);

      if (error) {
        console.error('Error updating fault settings:', error);
        setSaveStatus('error');
      } else {
        setSaveStatus('saved');
      }
    } catch (error) {
      console.error('Error updating fault settings:', error);
      setSaveStatus('error');
    }

    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const ProtectionCard = ({ 
    title, 
    description, 
    icon, 
    statusField, 
    valueField,
    iconBgColor,
    iconColor,
    unit = "V"
  }: { 
    title: string
    description: string
    icon: React.ReactNode
    statusField: keyof RealTimeStatus
    valueField: keyof RealTimeStatus
    iconBgColor: string
    iconColor: string
    unit?: string
  }) => (
    <div className="group bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden transition-all duration-300 hover:border-gray-700 hover:shadow-lg hover:shadow-yellow-500/5">
      <div className="p-6 border-b border-gray-800/50">
        <div className="flex items-center gap-4">
          <div className={`${iconBgColor} p-3 rounded-lg transition-transform duration-300 group-hover:scale-110`}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">{title}</h3>
              <ToggleSwitch
                id={statusField}
                checked={status[statusField] === 1}
                onChange={(checked) => handleStatusChange(statusField, checked ? 1 : 0)}
              />
            </div>
            <p className="text-gray-400 text-sm mt-1">{description}</p>
          </div>
        </div>
      </div>

      {status[statusField] === 1 && (
        <div className="p-6 bg-gray-900/50 space-y-6 animate-fadeIn">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Set Value ({unit})
            </label>
            <div className="relative group/input">
              <input
                type="number"
                value={status[valueField]}
                onChange={(e) => handleStatusChange(valueField, parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg 
                  text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all
                  group-hover/input:border-gray-600"
                placeholder={`Enter ${title.toLowerCase()} threshold`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{unit}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#111827] to-black text-gray-100">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
      </div>
      
      <div className="relative">
        <nav className="border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-xl sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-100 transition-all duration-300 group"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
                <span>Back to Dashboard</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors duration-300 group"
              >
                <LogOut size={20} className="group-hover:rotate-180 transition-transform duration-300" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Settings</h1>
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && (
                <span className="text-blue-400 text-sm animate-pulse">Saving changes...</span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-green-400 text-sm animate-fadeIn">Changes saved</span>
              )}
              {saveStatus === 'error' && (
                <span className="text-red-400 text-sm animate-fadeIn">Error saving changes</span>
              )}
            </div>
          </div>

          {/* User Profile Section */}
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-8 mb-12 hover:border-gray-700 transition-all duration-300 group">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-3 rounded-lg transition-transform duration-300 group-hover:scale-110">
                <User size={24} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">User Profile</h2>
                <p className="text-gray-400 text-sm">Manage your personal information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Full Name
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg 
                      text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all
                      group-hover:border-gray-600"
                    placeholder="Enter your full name"
                  />
                  <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-hover:text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg 
                      text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all
                      group-hover:border-gray-600"
                    placeholder="Enter your email"
                  />
                  <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-hover:text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Company
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => handleProfileChange('company', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg 
                      text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all
                      group-hover:border-gray-600"
                    placeholder="Enter your company name"
                  />
                  <Building size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-hover:text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Phone Number
                </label>
                <div className="relative group">
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg 
                      text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all
                      group-hover:border-gray-600"
                    placeholder="Enter your phone number"
                  />
                  <Phone size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-hover:text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Fault Protection Settings */}
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-8">Fault Protection Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Over Voltage Fault */}
            <div className="group bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden transition-all duration-300 hover:border-gray-700 hover:shadow-lg hover:shadow-yellow-500/5">
              <div className="p-6 border-b border-gray-800/50">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 p-3 rounded-lg transition-transform duration-300 group-hover:scale-110">
                    <Zap size={24} className="text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Over-voltage Fault</h3>
                      <ToggleSwitch
                        id="over_voltage_fault"
                        checked={faultSettings.over_voltage_fault_enabled}
                        onChange={(checked) => handleFaultSettingChange('over_voltage_fault_enabled', checked)}
                      />
                    </div>
                    <p className="text-gray-400 text-sm mt-1">Configure over-voltage protection settings</p>
                  </div>
                </div>
              </div>

              {faultSettings.over_voltage_fault_enabled && (
                <div className="p-6 bg-gray-900/50 space-y-6 animate-fadeIn">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Set Voltage (V)</label>
                      <div className="relative group/input">
                        <input
                          type="number"
                          value={faultSettings.over_voltage_set_value}
                          onChange={(e) => handleFaultSettingChange('over_voltage_set_value', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg 
                            text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all
                            group-hover/input:border-gray-600"
                          placeholder="Enter voltage threshold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">V</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Time Characteristic (ms)</label>
                      <div className="relative group/input">
                        <input
                          type="number"
                          value={faultSettings.over_voltage_time_chara}
                          onChange={(e) => handleFaultSettingChange('over_voltage_time_chara', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg 
                            text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all
                            group-hover/input:border-gray-600"
                          placeholder="Enter time characteristic"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Over Current Fault */}
            <div className="group bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden transition-all duration-300 hover:border-gray-700 hover:shadow-lg hover:shadow-red-500/5">
              <div className="p-6 border-b border-gray-800/50">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 p-3 rounded-lg transition-transform duration-300 group-hover:scale-110">
                    <AlertTriangle size={24} className="text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Over-current Fault</h3>
                      <ToggleSwitch
                        id="over_current_fault"
                        checked={faultSettings.over_current_fault_enabled}
                        onChange={(checked) => handleFaultSettingChange('over_current_fault_enabled', checked)}
                      />
                    </div>
                    <p className="text-gray-400 text-sm mt-1">Configure over-current protection settings</p>
                  </div>
                </div>
              </div>

              {faultSettings.over_current_fault_enabled && (
                <div className="p-6 bg-gray-900/50 space-y-6 animate-fadeIn">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Set Current (A)</label>
                      <div className="relative group/input">
                        <input
                          type="number"
                          value={faultSettings.over_current_set_value}
                          onChange={(e) => handleFaultSettingChange('over_current_set_value', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg 
                            text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all
                            group-hover/input:border-gray-600"
                          placeholder="Enter current threshold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">A</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Time Characteristic (ms)</label>
                      <div className="relative group/input">
                        <input
                          type="number"
                          value={faultSettings.over_current_time_chara}
                          onChange={(e) => handleFaultSettingChange('over_current_time_chara', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg 
                            text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all
                            group-hover/input:border-gray-600"
                          placeholder="Enter time characteristic"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Protection Settings Section */}
          <h2 className="text-2xl font-bold mb-6">Protection Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Voltage Protection */}
            <ProtectionCard
              title="Phase C Over-voltage"
              description="Protection against excessive voltage in Phase C"
              icon={<Zap size={24} className="text-yellow-500" />}
              statusField="output_phase_c_over_voltage_status"
              valueField="output_phase_c_over_voltage_set_value"
              iconBgColor="bg-yellow-500/10"
              iconColor="text-yellow-500"
              unit="V"
            />

            <ProtectionCard
              title="Phase A Under-voltage"
              description="Protection against low voltage in Phase A"
              icon={<Zap size={24} className="text-blue-500" />}
              statusField="output_phase_a_under_voltage_status"
              valueField="output_phase_a_under_voltage_set_value"
              iconBgColor="bg-blue-500/10"
              iconColor="text-blue-500"
              unit="V"
            />

            <ProtectionCard
              title="Phase B Under-voltage"
              description="Protection against low voltage in Phase B"
              icon={<Zap size={24} className="text-blue-500" />}
              statusField="output_phase_b_under_voltage_status"
              valueField="output_phase_b_under_voltage_set_value"
              iconBgColor="bg-blue-500/10"
              iconColor="text-blue-500"
              unit="V"
            />

            <ProtectionCard
              title="Phase C Under-voltage"
              description="Protection against low voltage in Phase C"
              icon={<Zap size={24} className="text-blue-500" />}
              statusField="output_phase_c_under_voltage_status"
              valueField="output_phase_c_under_voltage_set_value"
              iconBgColor="bg-blue-500/10"
              iconColor="text-blue-500"
              unit="V"
            />

            {/* Frequency Protection */}
            <ProtectionCard
              title="Over-frequency"
              description="Protection against high frequency"
              icon={<Activity size={24} className="text-purple-500" />}
              statusField="output_over_frequency_status"
              valueField="output_over_frequency_set_value"
              iconBgColor="bg-purple-500/10"
              iconColor="text-purple-500"
              unit="Hz"
            />

            <ProtectionCard
              title="Under-frequency"
              description="Protection against low frequency"
              icon={<Activity size={24} className="text-purple-500" />}
              statusField="output_under_frequency_status"
              valueField="output_under_frequency_set_value"
              iconBgColor="bg-purple-500/10"
              iconColor="text-purple-500"
              unit="Hz"
            />

            {/* DC Protection */}
            <ProtectionCard
              title="DC Over-voltage"
              description="Protection against excessive DC voltage"
              icon={<Zap size={24} className="text-yellow-500" />}
              statusField="output_dc_over_voltage_status"
              valueField="output_dc_over_voltage_set_value"
              iconBgColor="bg-yellow-500/10"
              iconColor="text-yellow-500"
              unit="V"
            />

            <ProtectionCard
              title="DC Under-voltage"
              description="Protection against low DC voltage"
              icon={<Zap size={24} className="text-blue-500" />}
              statusField="output_dc_under_voltage_status"
              valueField="output_dc_under_voltage_set_value"
              iconBgColor="bg-blue-500/10"
              iconColor="text-blue-500"
              unit="V"
            />

            <ProtectionCard
              title="DC Over-current"
              description="Protection against excessive DC current"
              icon={<AlertTriangle size={24} className="text-red-500" />}
              statusField="output_dc_over_current_status"
              valueField="output_dc_over_current_set_value"
              iconBgColor="bg-red-500/10"
              iconColor="text-red-500"
              unit="A"
            />

            <ProtectionCard
              title="Over-temperature"
              description="Protection against excessive temperature"
              icon={<Thermometer size={24} className="text-orange-500" />}
              statusField="output_over_temperature_status"
              valueField="output_over_temperature_set_value"
              iconBgColor="bg-orange-500/10"
              iconColor="text-orange-500"
              unit="°C"
            />
          </div>

          {/* Trip Characteristics */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-8 mt-12 border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-6 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></span>
              Trip Characteristics
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Instantaneous Trip</span>
                <ToggleSwitch
                  id="instantaneous_trip_characteristics_status"
                  checked={status.instantaneous_trip_characteristics_status === 1}
                  onChange={(checked) => handleStatusChange('instantaneous_trip_characteristics_status', checked ? 1 : 0)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Inverse Time</span>
                <ToggleSwitch
                  id="inverse_time_characteristics_status"
                  checked={status.inverse_time_characteristics_status === 1}
                  onChange={(checked) => handleStatusChange('inverse_time_characteristics_status', checked ? 1 : 0)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Definite Time</span>
                <ToggleSwitch
                  id="definite_time_characteristics_status"
                  checked={status.definite_time_characteristics_status === 1}
                  onChange={(checked) => handleStatusChange('definite_time_characteristics_status', checked ? 1 : 0)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Differential Relay</span>
                <ToggleSwitch
                  id="differential_relay_characteristics_status"
                  checked={status.differential_relay_characteristics_status === 1}
                  onChange={(checked) => handleStatusChange('differential_relay_characteristics_status', checked ? 1 : 0)}
                />
              </div>
            </div>
          </div>

          {/* Trip and Reset Controls */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-8 mt-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-6 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
              Control Actions
            </h2>
            <div className="flex gap-4">
              <button
                onClick={() => handleStatusChange('trip_button', 1)}
                className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-300 
                  bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30 
                  hover:bg-red-500/30 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
              >
                TRIP
              </button>
              <button
                onClick={() => handleStatusChange('reset_button', 1)}
                className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-300 
                  bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 border border-green-500/30 
                  hover:bg-green-500/30 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20"
              >
                RESET
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 