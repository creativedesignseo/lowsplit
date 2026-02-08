import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, ChevronLeft, ChevronRight, Loader2, TrendingUp, CreditCard, PlusCircle, AlertCircle, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useWallet } from '../hooks/useWallet'
import RechargeModal from '../components/RechargeModal'

export default function WalletPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login')
      } else {
        setUser(session.user)
        
        // Manejar notificación de éxito si viene de Stripe
        const params = new URLSearchParams(window.location.search)
        if (params.get('success') === 'true') {
            supabase.from('notifications').insert({
                user_id: session.user.id,
                title: 'Recarga Exitosa',
                message: 'Tu saldo ha sido actualizado correctamente.',
                type: 'success'
            }).then(() => {
                window.history.replaceState({}, document.title, window.location.pathname)
            })
        }
      }
    })
  }, [])

  const { balance, transactions, isLoading, error } = useWallet(user?.id)

  const handleTopup = () => {
    setShowRechargeModal(true)
  }

  const handleDebugTopup = async () => {
    if (!user) return
    try {
      const { error } = await supabase.rpc('handle_wallet_topup', {
        p_user_id: user.id,
        p_amount: 10,
        p_stripe_id: 'debug_' + Date.now(),
        p_description: 'Recarga de depuración (Local)'
      })
      if (error) throw error
      alert('¡Saldo de prueba añadido! +10€ (Refresca si no cambia)')
      window.location.reload()
    } catch (error) {
      console.error('Debug topup error:', error)
      alert('Error en recarga de depuración: ' + error.message)
    }
  }

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }

  const formatMonth = (date) => {
    if (!date) return ''
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'earning':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />
      case 'purchase':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-blue-500" />
      case 'topup':
        return <ArrowDownLeft className="w-4 h-4 text-purple-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getTransactionColor = (type) => {
    switch (type) {
      case 'earning':
      case 'topup':
        return 'text-green-600'
      case 'purchase':
      case 'withdrawal':
        return 'text-red-500'
      default:
        return 'text-gray-600'
    }
  }

  const getTransactionSign = (type) => {
    return ['deposit', 'earning', 'topup', 'refund'].includes(type) ? '+' : '-'
  }

  if (isLoading && !balance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#EF534F]" />
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Mi Wallet | LowSplit</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4">
          
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#EF534F] to-[#ff7b54] flex items-center justify-center shadow-lg shadow-red-200">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Mi Wallet</h1>
              <p className="text-sm text-gray-500">Gestiona tus ganancias</p>
            </div>
          </div>

          {/* Balance Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[24px] p-8 mb-6 text-white shadow-xl relative overflow-hidden">
            {/* Design Accents */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#EF534F]/20 rounded-full blur-3xl"></div>
            
            <p className="text-sm font-medium text-gray-400 mb-1 relative z-10">Saldo disponible</p>
            <p className="text-5xl font-black mb-6 relative z-10">
              €{balance?.toFixed(2) || '0.00'}
            </p>
            
            <div className="flex flex-wrap gap-4 relative z-10">
                <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2 border border-white/5">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1">Total ganado</p>
                    <p className="text-lg font-bold">€0.00</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2 border border-white/5">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1">Pendiente</p>
                    <p className="text-lg font-bold">€0.00</p>
                  </div>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button 
              onClick={() => setShowRechargeModal(true)}
              className="flex items-center justify-center gap-3 py-4 bg-white text-gray-900 rounded-[18px] font-black text-sm border border-gray-100 shadow-sm hover:bg-gray-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-green-600" />
              </div>
              Recargar Saldo
            </button>
            <button 
              className="flex items-center justify-center gap-3 py-4 bg-gray-50 text-gray-400 rounded-[18px] font-black text-sm cursor-not-allowed opacity-60"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-gray-300" />
              </div>
              Retirar Fondos
            </button>

            {/* Debug Button only for Localhost */}
            {window.location.hostname === 'localhost' && (
              <button 
                onClick={handleDebugTopup}
                className="col-span-2 flex items-center justify-center gap-3 py-4 bg-yellow-400 text-yellow-900 rounded-[18px] font-black text-sm hover:bg-yellow-300 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-yellow-900" />
                </div>
                Añadir €10 (DEBUG LOCAL)
              </button>
            )}
          </div>

          {/* Transactions History */}
          <div className="bg-white rounded-[20px] border border-gray-100 overflow-hidden">
            {/* Month Navigation */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Historial</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigateMonth(-1)}
                  className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-sm font-medium text-gray-600 min-w-[120px] text-center capitalize">
                  {formatMonth(currentMonth)}
                </span>
                <button 
                  onClick={() => navigateMonth(1)}
                  className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Transactions List */}
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
              </div>
            ) : transactions?.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-bold">Sin movimientos aún</p>
                <p className="text-xs">Tus transacciones aparecerán aquí.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {transactions?.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        tx.type === 'deposit' ? 'bg-green-50' : 
                        tx.type === 'purchase' ? 'bg-red-50' : 'bg-gray-100'
                      }`}>
                        {tx.type === 'deposit' ? <ArrowDownLeft className="text-green-600" /> : 
                         tx.type === 'purchase' ? <ArrowUpRight className="text-red-600" /> : 
                         <Clock className="text-gray-400" />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-none mb-1.5">{tx.description || tx.type}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(tx.created_at).toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black ${
                        tx.type === 'deposit' ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {tx.type === 'deposit' ? '+' : '-'} €{Math.abs(tx.amount).toFixed(2)}
                      </p>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          
        </div>

        {/* Modal de Recarga Unificado */}
        <RechargeModal 
            isOpen={showRechargeModal} 
            onClose={() => setShowRechargeModal(false)} 
            user={user} 
        />
      </div>
    </>
  )
}
