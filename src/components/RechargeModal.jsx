import { useState } from 'react'
import { X, Loader2, Plus, Wallet } from 'lucide-react'

export default function RechargeModal({ isOpen, onClose, user }) {
  const [rechargeAmount, setRechargeAmount] = useState(10)
  const [recharging, setRecharging] = useState(false)

  if (!isOpen) return null

  const handleTopup = async () => {
    if (!user) return
    setRecharging(true)
    try {
      const response = await fetch('/.netlify/functions/create-topup-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: rechargeAmount,
          userId: user.id,
          userEmail: user.email
        })
      })

      if (!response.ok) {
        const text = await response.text()
        console.error('Server error response:', text)
        if (window.location.port !== '8888') {
          throw new Error(`Estás en el puerto ${window.location.port}. Para que las funciones funcionen localmente debes usar el puerto 8888 (http://localhost:8888)`)
        }
        throw new Error(`Error del servidor (${response.status}). Revisa que 'netlify dev' esté funcionando correctamente.`)
      }

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Error al crear sesión de pago')
      }
    } catch (error) {
      console.error('Recharge error:', error)
      alert('Error al iniciar la recarga: ' + error.message)
    } finally {
      setRecharging(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100">
        <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#EF534F] flex items-center justify-center">
                <Wallet className="w-6 h-6" />
            </div>
            <div className="flex-1">
                <h3 className="text-xl font-black text-gray-900 leading-tight">Recargar Billetera</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-0.5">Saldo Inmediato</p>
            </div>
            <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="space-y-6">
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Selecciona monto</label>
                <div className="grid grid-cols-3 gap-3">
                    {[10, 20, 50].map(amount => (
                        <button 
                            key={amount}
                            onClick={() => setRechargeAmount(amount)}
                            className={`py-4 rounded-2xl font-black text-lg border transition-all ${
                                rechargeAmount === amount 
                                ? 'bg-[#EF534F] text-white border-[#EF534F] shadow-lg shadow-red-100' 
                                : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300'
                            }`}
                        >
                            €{amount}
                        </button>
                    ))}
                </div>
            </div>

            <div className="group">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Otro monto (€)</label>
                <div className="relative">
                    <input 
                        type="number" 
                        min="5"
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(Number(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xl font-black focus:outline-none focus:border-[#EF534F] focus:ring-4 focus:ring-red-50 transition-all"
                    />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 font-medium">Mínimo de recarga: €5.00</p>
            </div>

            <div className="pt-4 flex gap-3">
                <button 
                    onClick={onClose}
                    className="flex-1 py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleTopup}
                    disabled={recharging || rechargeAmount < 5}
                    className="flex-1 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {recharging ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continuar <Plus className="w-4 h-4" /></>}
                </button>
            </div>
        </div>
      </div>
    </div>
  )
}
