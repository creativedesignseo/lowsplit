import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { ShieldAlert, RefreshCw, Smartphone } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const AdminAudit = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    setLoading(true)
    const { data, error } = await supabase
        .from('payment_transactions')
        .select(`
            *,
            memberships (
                id,
                role,
                subscription_groups (
                    title,
                    services (name)
                ),
                profiles (email, full_name)
            )
        `)
        .order('created_at', { ascending: false })
        .limit(50)
    
    if (error) console.error(error)
    setTransactions(data || [])
    setLoading(false)
  }

  return (
    <>
      <Helmet>
        <title>Audit - LowSplit Admin</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-black text-gray-900 mb-6">Financial Audit</h1>
        
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                    <tr>
                        <th className="px-4 py-3">ID / Method</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Time</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {transactions.map(tx => (
                        <tr key={tx.id}>
                            <td className="px-4 py-3 font-mono text-xs text-gray-600">
                                <div className="font-bold text-gray-900 truncate w-32" title={tx.stripe_payment_intent_id}>
                                    {tx.stripe_payment_intent_id?.startsWith('bizum_') ? (
                                        <span className="flex items-center gap-1 text-blue-600">
                                            <Smartphone className="w-3 h-3" /> Bizum
                                        </span>
                                    ) : (
                                        'Stripe'
                                    )}
                                </div>
                                {tx.id.slice(0,8)}...
                            </td>
                            <td className="px-4 py-3">
                                {tx.user_id} <br/>
                                {/* Note: We can't see profiles(email) if profiles RLS blocks it. Admin API should solve if Admin. */}
                            </td>
                            <td className="px-4 py-3 font-black text-gray-900">
                                €{tx.amount?.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold uppercase">
                                    {tx.status}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">
                                {new Date(tx.created_at).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </>
  )
}

export default AdminAudit
