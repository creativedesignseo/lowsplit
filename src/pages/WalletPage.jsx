import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, ChevronLeft, ChevronRight, Loader2, TrendingUp, CreditCard } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function WalletPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchWalletData()
    }
  }, [user, currentMonth])

  const checkAuth = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      navigate('/login')
      return
    }
    setUser(authUser)
  }

  const fetchWalletData = async () => {
    if (!user) return
    setLoading(true)

    try {
      // Fetch wallet
      const { data: walletData, error: walletError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (walletError && walletError.code !== 'PGRST116') {
        console.error('Wallet error:', walletError)
      }
      setWallet(walletData || { balance: 0, pending_balance: 0, total_earned: 0 })

      // Fetch transactions for current month
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59)

      const { data: txData, error: txError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())
        .order('created_at', { ascending: false })

      if (txError) console.error('Transactions error:', txError)
      setTransactions(txData || [])

    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
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
    return ['earning', 'topup', 'refund'].includes(type) ? '+' : '-'
  }

  if (loading && !wallet) {
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
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[24px] p-6 mb-6 text-white shadow-xl">
            <p className="text-sm text-gray-400 mb-1">Saldo disponible</p>
            <p className="text-4xl font-black mb-4">
              €{wallet?.balance?.toFixed(2) || '0.00'}
            </p>
            
            <div className="flex gap-4">
              {wallet?.pending_balance > 0 && (
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <div>
                    <p className="text-xs text-gray-400">Pendiente</p>
                    <p className="text-sm font-bold">€{wallet.pending_balance.toFixed(2)}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <div>
                  <p className="text-xs text-gray-400">Total ganado</p>
                  <p className="text-sm font-bold">€{wallet?.total_earned?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons (Future phases) */}
          <div className="flex gap-3 mb-8">
            <button 
              disabled
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-400 rounded-xl font-bold text-sm cursor-not-allowed"
            >
              <CreditCard className="w-4 h-4" />
              Retirar (próximamente)
            </button>
            <button 
              disabled
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-400 rounded-xl font-bold text-sm cursor-not-allowed"
            >
              <ArrowDownLeft className="w-4 h-4" />
              Recargar (próximamente)
            </button>
          </div>

          {/* Transactions History */}
          <div className="bg-white rounded-[20px] border border-gray-100 overflow-hidden">
            {/* Month Navigation */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Historial</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigateMonth(-1)}
                  className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-sm font-medium text-gray-600 min-w-[120px] text-center capitalize">
                  {formatMonth(currentMonth)}
                </span>
                <button 
                  onClick={() => navigateMonth(1)}
                  className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Transactions List */}
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-50 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-900 font-bold mb-1">Sin transacciones</p>
                <p className="text-sm text-gray-400">No tienes movimientos este mes</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{tx.description || tx.type}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(tx.created_at).toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <p className={`font-bold ${getTransactionColor(tx.type)}`}>
                      {getTransactionSign(tx.type)}€{Math.abs(tx.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Note */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Las ganancias de tus grupos aparecerán aquí automáticamente.
          </p>
          
        </div>
      </div>
    </>
  )
}
