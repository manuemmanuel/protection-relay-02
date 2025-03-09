'use client'

const WindowControls = () => {
  const handleMinimize = async () => {
    try {
      if (window?.electron) {
        await window.electron.minimize();
      } else {
        console.error('Electron API not found in window object');
      }
    } catch (error) {
      console.error('Error minimizing window:', error);
    }
  }

  const handleMaximize = async () => {
    try {
      if (window?.electron) {
        await window.electron.maximize();
      } else {
        console.error('Electron API not found in window object');
      }
    } catch (error) {
      console.error('Error maximizing window:', error);
    }
  }

  const handleClose = async () => {
    try {
      if (window?.electron) {
        await window.electron.close();
      } else {
        console.error('Electron API not found in window object');
      }
    } catch (error) {
      console.error('Error closing window:', error);
    }
  }

  return (
    <div className="fixed top-0 right-0 flex items-center h-8 px-2 space-x-2 bg-gray-900/50 z-50">
      <button
        onClick={handleMinimize}
        className="p-1 hover:bg-gray-700/50 rounded-full transition-colors text-gray-300"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect width="10" height="1" x="1" y="5.5" fill="currentColor" />
        </svg>
      </button>
      <button
        onClick={handleMaximize}
        className="p-1 hover:bg-gray-700/50 rounded-full transition-colors text-gray-300"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect width="9" height="9" x="1.5" y="1.5" fill="none" stroke="currentColor" />
        </svg>
      </button>
      <button
        onClick={handleClose}
        className="p-1 hover:bg-red-500/50 rounded-full transition-colors text-gray-300"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path
            d="M2.4 1.399L6 4.999l3.6-3.6 1.001 1-3.601 3.6 3.6 3.6-1 1.001-3.6-3.601-3.6 3.6-1-1 3.6-3.6-3.6-3.6z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  )
}

export default WindowControls 