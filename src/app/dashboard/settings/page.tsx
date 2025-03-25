"use client"
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Zap, AlertTriangle, Thermometer, Activity, Clock, Shield,
  User, LogOut, Mail, Building, Phone, Download
} from 'lucide-react'
import * as XLSX from 'xlsx'

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

interface Parameter {
  Parameter: string;
  Value: number;
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
  const [saveStatus, setSaveStatus] = useState<string>('')
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    company: '',
    phone: ''
  })
  const [parameters, setParameters] = useState<Parameter[]>([])
  const [loading, setLoading] = useState(true)

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
    const fetchParameters = async () => {
      try {
      const { data, error } = await supabase
          .from('parameters_table')
          .select('parameter, value')
          .order('parameter')

        if (error) throw error
        if (data) {
          // Transform the data to match our interface
          const transformedData = data.map(item => ({
            Parameter: item.parameter,
            Value: item.value
          }))
          setParameters(transformedData)
        }
      } catch (error) {
        console.error('Error fetching parameters:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchParameters()
  }, [])

  const handleStatusChange = async (field: keyof RealTimeStatus, value: number) => {
    const newStatus = { ...status, [field]: value }
    setStatus(newStatus)
    setSaveStatus('Saving...')

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

      setSaveStatus('Saved successfully!')
    } catch (error) {
      console.error('Error updating status:', error)
      setSaveStatus('Error saving changes')
    } finally {
      setTimeout(() => setSaveStatus(''), 3000)
    }
  }

  const handleProfileChange = async (field: keyof UserProfile, value: string) => {
    const newProfile = { ...profile, [field]: value }
    setProfile(newProfile)
    setSaveStatus('Saving...')

    const { error } = await supabase
      .from('user_profiles')
      .update(newProfile)
      .eq('id', profile.id)

    if (error) {
      console.error('Error updating profile:', error)
      setSaveStatus('Error saving changes')
    } else {
      setSaveStatus('Saved successfully!')
    }

    setTimeout(() => setSaveStatus(''), 3000)
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error logging out:', error)
    } else {
      router.push('/login')
    }
  }

  const handleExportToExcel = async () => {
    try {
      setSaveStatus('Saving...')
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No authenticated user')
      }

      // Fetch all records for the current user
      const { data, error } = await supabase
        .from('user_input_data')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!data || data.length === 0) {
        throw new Error('No data to export')
      }

      // Convert the data to worksheet format
      const worksheet = XLSX.utils.json_to_sheet(data)

      // Create workbook and add the worksheet
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Protection Settings')

      // Generate Excel file
      XLSX.writeFile(workbook, 'User Data Input.xlsx')
      
      setSaveStatus('Saved successfully!')
      setTimeout(() => setSaveStatus(''), 3000)
    } catch (error) {
      console.error('Error exporting data:', error)
      setSaveStatus('Error exporting data')
      setTimeout(() => setSaveStatus(''), 3000)
    }
  }

  const handleParameterChange = async (parameter: string, value: number) => {
    try {
      setSaveStatus('Saving...')
      
      // Update local state immediately for UI responsiveness
      setParameters(prev => 
        prev.map(p => 
          p.Parameter === parameter ? { ...p, Value: value } : p
        )
      )
      
      // Log for debugging
      console.log('Updating parameter:', parameter, 'to value:', value)
      
      // Update the database
      const { error } = await supabase
        .from('parameters_table')
        .update({ value: value })
        .eq('parameter', parameter)

      if (error) {
        console.error('Supabase error:', error)
        // Revert local state if database update fails
        setParameters(prev => 
          prev.map(p => 
            p.Parameter === parameter ? { ...p, Value: value === 1 ? 0 : 1 } : p
          )
        )
        throw error
      }
      
      setSaveStatus('Saved successfully!')
    } catch (error) {
      console.error('Error updating parameter:', error)
      setSaveStatus('Error saving changes')
    } finally {
      setTimeout(() => setSaveStatus(''), 3000)
    }
  }

  const handleResetAll = async () => {
    try {
      setSaveStatus('Resetting all parameters...')
      
      // Update local state first for immediate UI feedback
      setParameters(prev => 
        prev.map(p => ({ ...p, Value: 0 }))
      )
      
      // Get all parameter names
      const { data, error: fetchError } = await supabase
        .from('parameters_table')
        .select('parameter')
      
      if (fetchError) throw fetchError
      
      if (data) {
        // Update all parameters to 0 in the database
        const { error: updateError } = await supabase
          .from('parameters_table')
          .update({ value: 0 })
          .in('parameter', data.map(d => d.parameter))
        
        if (updateError) throw updateError
        
        setSaveStatus('All parameters reset successfully!')
      }
    } catch (error) {
      console.error('Error resetting parameters:', error)
      setSaveStatus('Error resetting parameters')
    } finally {
      setTimeout(() => setSaveStatus(''), 3000)
    }
  }

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

  const ProtectionParameter = ({ title, statusParam, valueParam }: { 
    title: string, 
    statusParam: string, 
    valueParam: string 
  }) => {
    // Convert UI parameter names to match database parameter names
    const dbStatusParam = statusParam.toLowerCase()
    const dbValueParam = valueParam.toLowerCase()

    return (
      <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 backdrop-blur-sm">
        <h3 className="text-lg font-medium text-white mb-4">{title}</h3>
        <div className="space-y-4">
            <div className="flex items-center justify-between">
            <span className="text-gray-300">Status</span>
            <div className="relative">
              <button
                onClick={() => handleParameterChange(dbStatusParam, getValue(dbStatusParam) === 1 ? 0 : 1)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  getValue(dbStatusParam) === 1 ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div 
                  className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                    getValue(dbStatusParam) === 1 ? 'translate-x-6' : 'translate-x-0'
                  }`} 
                />
              </button>
            </div>
          </div>
          {valueParam && getValue(dbStatusParam) === 1 && (
              <div>
              <label className="text-gray-300 block mb-2">Set Value</label>
                  <input
                type="number"
                value={getValue(dbValueParam) || 0}
                onChange={(e) => handleParameterChange(dbValueParam, Number(e.target.value))}
                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
              />
                </div>
          )}
              </div>
                </div>
    )
  }

  // Helper function to get parameter value
  const getValue = (parameter: string) => {
    const param = parameters.find(p => p.Parameter === parameter)
    console.log('Getting value for:', parameter, 'Found:', param)
    return param?.Value ?? 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Back Button and Reset All Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 bg-gray-800/50 rounded-lg 
                border border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Protection Settings</h1>
          </div>
          <button
            onClick={handleResetAll}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-300 bg-red-900/30 rounded-lg 
              border border-red-700/50 hover:bg-red-800/50 hover:border-red-600 transition-all duration-200"
          >
            Reset All Parameters
          </button>
        </div>

        {loading ? (
          <div className="text-white">Loading settings...</div>
        ) : (
          <div className="space-y-8">
            {/* Voltage Protection */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Voltage Protection</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Input Over Voltage */}
                <ProtectionParameter
                  title="Input Phase A Over Voltage"
                  statusParam="input_phase_a_over_voltage_status"
                  valueParam="input_phase_a_over_voltage_set_value"
                />
                <ProtectionParameter
                  title="Input Phase B Over Voltage"
                  statusParam="input_phase_b_over_voltage_status"
                  valueParam="input_phase_b_over_voltage_set_value"
                />
                <ProtectionParameter
                  title="Input Phase C Over Voltage"
                  statusParam="input_phase_c_over_voltage_status"
                  valueParam="input_phase_c_over_voltage_set_value"
                />
                <ProtectionParameter
                  title="Output Phase A Over Voltage"
                  statusParam="output_phase_a_over_voltage_status"
                  valueParam="output_phase_a_over_voltage_set_value"
                />
                <ProtectionParameter
                  title="Output Phase B Over Voltage"
                  statusParam="output_phase_b_over_voltage_status"
                  valueParam="output_phase_b_over_voltage_set_value"
                />
                <ProtectionParameter
                  title="Output Phase C Over Voltage"
                  statusParam="output_phase_c_over_voltage_status"
                  valueParam="output_phase_c_over_voltage_set_value"
                />
                <ProtectionParameter
                  title="Input DC Over Voltage"
                  statusParam="input_dc_over_voltage_status"
                  valueParam="input_dc_over_voltage_set_value"
                />
                <ProtectionParameter
                  title="Output DC Over Voltage"
                  statusParam="output_dc_over_voltage_status"
                  valueParam="output_dc_over_voltage_set_value"
                />

                {/* Input Under Voltage */}
                <ProtectionParameter
                  title="Input Phase A Under Voltage"
                  statusParam="input_phase_a_under_voltage_status"
                  valueParam="input_phase_a_under_voltage_set_value"
                />
                <ProtectionParameter
                  title="Input Phase B Under Voltage"
                  statusParam="input_phase_b_under_voltage_status"
                  valueParam="input_phase_b_under_voltage_set_value"
                />
                <ProtectionParameter
                  title="Input Phase C Under Voltage"
                  statusParam="input_phase_c_under_voltage_status"
                  valueParam="input_phase_c_under_voltage_set_value"
                />
                <ProtectionParameter
                  title="Output Phase A Under Voltage"
                  statusParam="output_phase_a_under_voltage_status"
                  valueParam="output_phase_a_under_voltage_set_value"
                />
                <ProtectionParameter
                  title="Output Phase B Under Voltage"
                  statusParam="output_phase_b_under_voltage_status"
                  valueParam="output_phase_b_under_voltage_set_value"
                />
                <ProtectionParameter
                  title="Output Phase C Under Voltage"
                  statusParam="output_phase_c_under_voltage_status"
                  valueParam="output_phase_c_under_voltage_set_value"
                />
                <ProtectionParameter
                  title="Input DC Under Voltage"
                  statusParam="input_dc_under_voltage_status"
                  valueParam="input_dc_under_voltage_set_value"
                />
                <ProtectionParameter
                  title="Output DC Under Voltage"
                  statusParam="output_dc_under_voltage_status"
                  valueParam="output_dc_under_voltage_set_value"
                />
                      </div>
            </section>

            {/* Current Protection */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Current Protection</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ProtectionParameter
                  title="Input Phase A Over Current"
                  statusParam="input_phase_a_over_current_status"
                  valueParam="input_phase_a_over_current_set_value"
                />
                <ProtectionParameter
                  title="Input Phase B Over Current"
                  statusParam="input_phase_b_over_current_status"
                  valueParam="input_phase_b_over_current_set_value"
                />
                <ProtectionParameter
                  title="Input Phase C Over Current"
                  statusParam="input_phase_c_over_current_status"
                  valueParam="input_phase_c_over_current_set_value"
                />
                <ProtectionParameter
                  title="Output Phase A Over Current"
                  statusParam="output_phase_a_over_current_status"
                  valueParam="output_phase_a_over_current_set_value"
                />
                <ProtectionParameter
                  title="Output Phase B Over Current"
                  statusParam="output_phase_b_over_current_status"
                  valueParam="output_phase_b_over_current_set_value"
                />
                <ProtectionParameter
                  title="Output Phase C Over Current"
                  statusParam="output_phase_c_over_current_status"
                  valueParam="output_phase_c_over_current_set_value"
                />
                <ProtectionParameter
                  title="Input DC Over Current"
                  statusParam="input_dc_over_current_status"
                  valueParam="input_dc_over_current_set_value"
                />
                <ProtectionParameter
                  title="Output DC Over Current"
                  statusParam="output_dc_over_current_status"
                  valueParam="output_dc_over_current_set_value"
                />
              </div>
            </section>

            {/* Frequency Protection */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Frequency Protection</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProtectionParameter
                  title="Input Over Frequency"
                  statusParam="input_over_frequency_status"
                  valueParam="input_over_frequency_set_value"
                />
                <ProtectionParameter
                  title="Output Over Frequency"
                  statusParam="output_over_frequency_status"
                  valueParam="output_over_frequency_set_value"
                />
                <ProtectionParameter
                  title="Input Under Frequency"
                  statusParam="input_under_frequency_status"
                  valueParam="input_under_frequency_set_value"
                />
                <ProtectionParameter
                  title="Output Under Frequency"
                  statusParam="output_under_frequency_status"
                  valueParam="output_under_frequency_set_value"
                />
              </div>
            </section>

            {/* Temperature Protection */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Temperature Protection</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProtectionParameter
                  title="Input Over Temperature"
                  statusParam="input_over_temperature_status"
                  valueParam="input_over_temperature_set_value"
                />
                <ProtectionParameter
                  title="Output Over Temperature"
                  statusParam="output_over_temperature_status"
                  valueParam="output_over_temperature_set_value"
            />
          </div>
            </section>

            {/* Relay Characteristics */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Relay Characteristics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 backdrop-blur-sm">
                  <h3 className="text-lg font-medium text-white mb-4">Instantaneous Trip</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Enable/Disable (0/1)</span>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        value={getValue('Instantaneous_Trip_Characteristics_status')}
                        onChange={(e) => {
                          const value = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 1);
                          handleParameterChange('Instantaneous_Trip_Characteristics_status', value);
                        }}
                        className="w-20 bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 backdrop-blur-sm">
                  <h3 className="text-lg font-medium text-white mb-4">Inverse Time</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Enable/Disable (0/1)</span>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        value={getValue('Inverse_Time_Characteristics_status')}
                        onChange={(e) => {
                          const value = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 1);
                          handleParameterChange('Inverse_Time_Characteristics_status', value);
                        }}
                        className="w-20 bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 backdrop-blur-sm">
                  <h3 className="text-lg font-medium text-white mb-4">Definite Time</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Enable/Disable (0/1)</span>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        value={getValue('Definite_Time_Characteristics_status')}
                        onChange={(e) => {
                          const value = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 1);
                          handleParameterChange('Definite_Time_Characteristics_status', value);
                        }}
                        className="w-20 bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 backdrop-blur-sm">
                  <h3 className="text-lg font-medium text-white mb-4">Differential Relay</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Enable/Disable (0/1)</span>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        value={getValue('Differential_Relay_Characteristics_status')}
                        onChange={(e) => {
                          const value = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 1);
                          handleParameterChange('Differential_Relay_Characteristics_status', value);
                        }}
                        className="w-20 bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Control Buttons */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Control</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 backdrop-blur-sm">
                  <h3 className="text-lg font-medium text-white mb-4">Trip</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">On/Off (1/0)</span>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        value={getValue('Trip_button')}
                        onChange={(e) => {
                          const value = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 1);
                          handleParameterChange('Trip_button', value);
                        }}
                        className="w-20 bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 backdrop-blur-sm">
                  <h3 className="text-lg font-medium text-white mb-4">Reset</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">On/Off (1/0)</span>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        value={getValue('Reset_button')}
                        onChange={(e) => {
                          const value = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 1);
                          handleParameterChange('Reset_button', value);
                        }}
                        className="w-20 bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {saveStatus && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-lg ${
            saveStatus.includes('Error') ? 'bg-red-600' : 'bg-green-600'
          } text-white shadow-lg`}>
            {saveStatus}
          </div>
        )}
      </div>
    </div>
  )
} 