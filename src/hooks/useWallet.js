import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export const useWallet = (userId) => {
  const queryClient = useQueryClient()

  // Obtener saldo de la billetera
  const { data: balance, isLoading: isLoadingBalance, error: balanceError } = useQuery({
    queryKey: ['wallet-balance', userId],
    queryFn: async () => {
      if (!userId) return 0
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return 0 // No existe billetera aún
        throw error
      }
      return data.balance
    },
    enabled: !!userId,
  })

  // Obtener historial de transacciones
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['wallet-transactions', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  return {
    balance,
    transactions,
    isLoading: isLoadingBalance || isLoadingTransactions,
    error: balanceError,
  }
}
