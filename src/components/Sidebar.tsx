'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Menu, X, Settings, Sliders, Activity, FileText, Info, ChevronDown 
} from 'lucide-react'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const menuItems = [
    { icon: <Sliders size={20} />, label: 'Customization' },
    { 
      icon: <Settings size={20} />, 
      label: 'Settings',
      onClick: () => router.push('/dashboard/settings')
    },
    { icon: <Activity size={20} />, label: 'Self Diagnosis Test' },
    { icon: <FileText size={20} />, label: 'Instruction Manual' },
    { icon: <Info size={20} />, label: 'About Us' },
  ]

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 p-3 text-gray-100 bg-gray-800 rounded-full 
          hover:bg-gray-700 border border-gray-700 shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`fixed top-0 right-0 h-full w-64 bg-gray-900 transform transition-transform 
        duration-300 ease-in-out z-40 border-l border-gray-800
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="pt-16 px-4">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-gray-100
                hover:bg-gray-800 rounded-lg transition-colors"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
} 