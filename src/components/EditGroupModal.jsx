import { useState, useEffect } from 'react'
import { X, Save, Key, Shield, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

const EditGroupModal = ({ group, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    sellable_cap: 0
  })

  // Calculate stats
  const maxSlots = group.services?.max_slots || 5
  // Real active members (excluding admin)
  const realSales = group.real_members || 0
  
  // Initialize form
  useEffect(() => {
    // Formula: TotalSellable = (Max - Occupied) + RealSales
    // Example: 5 Max - 3 Occupied + 0 Sales = 2 Sellable
    // Example: 5 Max - 4 Occupied + 1 Sales = 2 Sellable (still 2 capacity, 1 taken)
    const currentOccupied = group.slots_occupied || 1
    const currentAvailable = Math.max(0, maxSlots - currentOccupied)
    const calculatedCap = currentAvailable + realSales

    setFormData({
      login: group.login || '',
      password: group.password || '',
      sellable_cap: calculatedCap
    })
  }, [group, maxSlots, realSales])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Calculate new slots_occupied based on sellable_cap
      // NewAvailable = Cap - RealSales
      // NewOccupied = Max - NewAvailable
      const targetAvailable = Math.max(0, formData.sellable_cap - realSales)
      const newSlotsOccupied = Math.max(1, maxSlots - targetAvailable) // Min 1 (Admin)

      const { error } = await supabase
        .from('subscription_groups')
        .update({
          credentials_login: formData.login,
          credentials_password: formData.password,
          slots_occupied: newSlotsOccupied
        })
        .eq('id', group.id)

      if (error) throw error

      onUpdate() // Refresh dashboard
      onClose()
    } catch (err) {
      alert('Error updating group: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const maxSellable = maxSlots - 1 // Admin always takes 1

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#EF534F]" />
            Gestionar Grupo
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Slot Management */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">
              Oferta de Plazas
            </label>
            
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">Plazas a la Venta</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, sellable_cap: Math.max(realSales, prev.sellable_cap - 1) }))}
                    disabled={formData.sellable_cap <= realSales}
                    className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                  >
                    -
                  </button>
                  <span className="text-xl font-black text-gray-900 w-6 text-center">
                    {formData.sellable_cap}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, sellable_cap: Math.min(maxSellable, prev.sellable_cap + 1) }))}
                    disabled={formData.sellable_cap >= maxSellable}
                    className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between text-xs text-orange-600/80 px-1">
                <span>Mínimo: {realSales} (Vendidas)</span>
                <span>Máximo: {maxSellable}</span>
              </div>
            </div>
            
            <p className="text-xs text-gray-400 mt-2 flex items-start gap-1">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              Esto ajusta cuántas personas pueden unirse a tu grupo.
            </p>
          </div>

          {/* Credentials */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">
              Credenciales de Acceso
            </label>
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.login}
                  onChange={e => setFormData({...formData, login: e.target.value})}
                  placeholder="Email / Usuario"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#EF534F] focus:bg-white transition-colors outline-none text-sm font-medium"
                />
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="Contraseña / PIN"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#EF534F] focus:bg-white transition-colors outline-none text-sm font-medium"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#EF534F] text-white font-bold py-3 rounded-xl hover:bg-[#D32F2F] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-100"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Guardar Cambios
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default EditGroupModal
