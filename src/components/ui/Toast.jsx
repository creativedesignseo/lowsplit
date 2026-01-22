import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { useEffect } from 'react'

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500'
  const Icon = type === 'success' ? CheckCircle : AlertCircle

  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-full shadow-lg text-white ${bgColor} animate-fade-in-down transition-all`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded-full p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default Toast
