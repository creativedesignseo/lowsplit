import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Check, ChevronLeft, ShieldCheck, Star, Clock, Calendar, UserCheck, Shield, MessageCircle, Users, MessageSquareText, Smile, Send, User, Plus, Loader2, Wallet, CreditCard, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getLogoUrl, getEmojiForSlug } from '../lib/utils'
import { useWallet } from '../hooks/useWallet'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const GroupDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [joining, setJoining] = useState(false)
  const [session, setSession] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  const { balance, isLoading: isLoadingWallet } = useWallet(session?.user?.id)

  // Fetch Group Data + Admin Profile + Service Info
  const { data: group, isLoading, error } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_groups')
        .select(`
            *,
            services (
                name,
                slug,
                max_slots,
                icon_url
            ),
            profiles!admin_id (
                username,
                reputation_score,
                avatar_url,
                created_at
            )
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    }
  })

  // Fetch Members
  const { data: members } = useQuery({
    queryKey: ['group-members', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memberships')
        .select(`
            id,
            joined_at,
            payment_status,
            profiles!user_id (
                username,
                avatar_url
            )
        `)
        .eq('group_id', id)
        .eq('payment_status', 'paid')
      
      if (error) throw error
      return data
    }
  })

  if (isLoading) {
    return (
        <div className="min-h-screen pt-24 flex justify-center items-center bg-[#f8f9fc]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EF534F]"></div>
        </div>
    )
  }

  if (error || !group) {
    return (
        <div className="min-h-screen pt-24 flex flex-col justify-center items-center bg-[#f8f9fc]">
            <h2 className="text-xl font-bold text-gray-900">Grupo no encontrado</h2>
            <Link to="/explore" className="mt-4 text-[#EF534F] hover:underline">Volver a explorar</Link>
        </div>
    )
  }

  const service = group.services
  const admin = group.profiles
  const logoUrl = getLogoUrl(service?.slug, service?.icon_url)
  const availableSlots = (service?.max_slots || 4) - (group.slots_occupied || 1)
  const username = admin?.username || 'Usuario'
  const memberSince = new Date(admin?.created_at).toLocaleDateString()
  
  // Calculate pricing (mock logic or from DB)
  const price = group.price_per_slot || 0
  const total = price + 0.35 // Service fee example

  // Payment button handler - shows modal if user has balance, otherwise direct to Stripe
  const handlePaymentClick = () => {
    if (!session) {
      navigate('/login', { state: { from: `/group/${id}` } })
      return
    }
    setShowPaymentModal(true)
  }

  // Pay with wallet only (full amount)
  const handlePayWithWallet = async () => {
    if (balance < total) {
      alert(`Saldo insuficiente. Tu saldo es €${balance.toFixed(2)} y el total es €${total.toFixed(2)}.`)
      return
    }

    setJoining(true)
    setShowPaymentModal(false)
    
    try {
      const { error: rpcError } = await supabase.rpc('handle_join_group_wallet', {
        p_user_id: session.user.id,
        p_group_id: id,
        p_amount: total,
        p_description: `Acceso a ${service.name}`
      })

      if (rpcError) throw rpcError

      await supabase.from('notifications').insert({
        user_id: session.user.id,
        title: '¡Bienvenido al grupo!',
        message: `Te has unido exitosamente a ${service.name}. Ya puedes ver tus credenciales en el dashboard.`,
        type: 'success'
      })

      alert('¡Te has unido al grupo con éxito!')
      navigate('/dashboard?tab=purchases')
    } catch (err) {
      console.error('Error joining group:', err)
      alert('Error al unirse al grupo: ' + err.message)
    } finally {
      setJoining(false)
    }
  }

  // Pay with card (Stripe checkout for full amount)
  const handlePayWithCard = async () => {
    setJoining(true)
    setShowPaymentModal(false)
    
    try {
      const response = await fetch('/.netlify/functions/create-group-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: id,
          userId: session.user.id,
          amount: total,
          serviceName: service.name
        })
      })

      const { sessionId, error } = await response.json()
      if (error) throw new Error(error)

      const stripe = await stripePromise
      await stripe.redirectToCheckout({ sessionId })
    } catch (err) {
      console.error('Error creating checkout:', err)
      alert('Error al procesar el pago: ' + err.message)
    } finally {
      setJoining(false)
    }
  }

  // Hybrid: Use wallet balance + card for remainder
  const handlePayHybrid = async () => {
    const walletAmount = Math.min(balance, total)
    const cardAmount = total - walletAmount

    setJoining(true)
    setShowPaymentModal(false)

    try {
      // First, deduct from wallet
      if (walletAmount > 0) {
        const { error: walletError } = await supabase.rpc('handle_partial_wallet_payment', {
          p_user_id: session.user.id,
          p_amount: walletAmount,
          p_description: `Pago parcial para ${service.name}`
        })
        if (walletError) throw walletError
      }

      // Then, redirect to Stripe for the rest
      if (cardAmount > 0) {
        const response = await fetch('/.netlify/functions/create-group-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId: id,
            userId: session.user.id,
            amount: cardAmount,
            serviceName: service.name,
            walletDeducted: walletAmount
          })
        })

        const { sessionId, error } = await response.json()
        if (error) throw new Error(error)

        const stripe = await stripePromise
        await stripe.redirectToCheckout({ sessionId })
      }
    } catch (err) {
      console.error('Error with hybrid payment:', err)
      alert('Error al procesar el pago: ' + err.message)
    } finally {
      setJoining(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Grupo de {service.name} - LowSplit</title>
      </Helmet>

      <div className="min-h-screen bg-[#f8f9fc] pt-[80px] pb-12">
        <div className="max-w-[1100px] mx-auto px-4">
            
            {/* Back Nav */}
            <div className="mb-6">
                <button 
                  onClick={() => navigate(-1)} 
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Volver
                </button>
            </div>

            {/* Main Layout: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                {/* LEFT COLUMN: Admin Info (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                    
                    {/* Admin Profile Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                        
                        {/* Service Background Accent */}
                        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-indigo-50 to-blue-50 z-0"></div>

                        <div className="relative z-10 flex flex-col items-center">
                            {/* Avatar with Service Badge */}
                            <div className="relative mb-3">
                                <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-gray-200 flex items-center justify-center overflow-hidden">
                                     {admin?.avatar_url ? (
                                        <img src={admin.avatar_url} alt={username} className="w-full h-full object-cover" />
                                     ) : (
                                        <span className="text-3xl text-gray-400 font-bold">{username.charAt(0).toUpperCase()}</span>
                                     )}
                                </div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm" title="Admin Verificado">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                            </div>

                            {/* Name & Role */}
                            <h2 className="text-xl font-bold text-gray-900">{username}</h2>
                            <p className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 uppercase tracking-wide">
                                Admin del Grupo
                            </p>

                            {/* Trust Score */}
                            <div className="mt-4 w-full bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-gray-500">Nivel de Confianza</span>
                                    <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                                        <Star className="w-3 h-3 fill-current" />
                                        {((admin?.reputation_score || 80) / 20).toFixed(1)}/5.0
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-yellow-400 h-full rounded-full" style={{ width: `${admin?.reputation_score || 80}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Verifications List */}
                        <div className="mt-6 space-y-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Verificaciones</h3>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="flex flex-col items-center gap-1 p-2 bg-green-50 rounded-lg border border-green-100">
                                    <UserCheck className="w-5 h-5 text-green-600" />
                                    <span className="text-[10px] font-medium text-green-700">Identidad</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 p-2 bg-green-50 rounded-lg border border-green-100">
                                    <Shield className="w-5 h-5 text-green-600" />
                                    <span className="text-[10px] font-medium text-green-700">Pago</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 p-2 bg-blue-50 rounded-lg border border-blue-100">
                                    <MessageCircle className="w-5 h-5 text-blue-600" />
                                    <span className="text-[10px] font-medium text-blue-700">Teléfono</span>
                                </div>
                            </div>
                        </div>

                        {/* Admin Stats */}
                        <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Actividad</h3>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Tiempo resp.</span>
                                <span className="font-medium text-blue-600">~ 2 horas</span>
                            </div>
                             <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Miembro desde</span>
                                <span className="font-medium text-gray-900">{memberSince}</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN: Contract/Subscription (8 cols) */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                        
                        {/* Header: Service + Slots */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white border border-gray-100 rounded-xl p-2 shadow-sm flex items-center justify-center">
                                     {logoUrl ? <img src={logoUrl} alt={service.name} className="w-full h-full object-contain" /> : <span className="text-3xl">{getEmojiForSlug(service.slug)}</span>}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{service.name} Family</h1>
                                    <p className="text-gray-500 text-sm">Compartido por {username}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="text-3xl font-black text-gray-900">
                                    {availableSlots}<span className="text-lg text-gray-400 font-medium">/{service.max_slots}</span>
                                </div>
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">PUESTOS LIBRES</span>
                            </div>
                        </div>

                        {/* Contract Details Table */}
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                             <div>
                                <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Periodo de facturación</span>
                                <span className="text-indigo-600 font-medium bg-indigo-50 px-3 py-1 rounded-full text-sm">Mensual</span>
                             </div>
                             <div>
                                <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Tipo de suscripción</span>
                                <span className="text-purple-600 font-medium bg-purple-50 px-3 py-1 rounded-full text-sm">Premium 4K</span>
                             </div>
                             <div>
                                <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Renovación</span>
                                <span className="text-gray-900 font-medium text-sm">Automática</span>
                             </div>
                             <div>
                                <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Método de entrega</span>
                                <span className="text-gray-900 font-medium text-sm">Credenciales (Email/Pass)</span>
                             </div>
                        </div>

                        <div className="border-t border-dashed border-gray-200 my-8"></div>

                        {/* Price & Action */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total a pagar ahora:</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-[#EF534F]">${total.toFixed(2)}</span>
                                    <span className="text-gray-400 font-medium">/ mes</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">* Incluye protección al comprador</p>
                            </div>

                             <button 
                                onClick={handlePaymentClick}
                                disabled={joining || availableSlots === 0}
                                className="w-full sm:w-auto px-8 py-4 bg-[#EF534F] hover:bg-[#e0403c] text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {joining ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <UserCheck className="w-5 h-5" />
                                        Unirme al Grupo
                                    </>
                                )}
                            </button>
                        </div>
                         
                         <div className="mt-6 text-center">
                            <a href="#" className="text-xs text-indigo-500 font-medium hover:underline flex items-center justify-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                ¿Tienes dudas? Contactar al admin
                            </a>
                         </div>

                    </div>
                </div>

            </div>

            {/* BOTTOM SECTION: Hub Features */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                
                {/* Members List (Left 3 cols) */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 min-h-[400px]">
                         <h3 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
                            <Users className="w-4 h-4 text-gray-400" />
                            Miembros
                         </h3>
                         <div className="space-y-5">
                             {/* Admin */}
                             <div className="flex items-center gap-3">
                                 <div className="relative">
                                     <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center overflow-hidden border border-indigo-100">
                                         {admin?.avatar_url ? <img src={admin.avatar_url} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-indigo-400" />}
                                     </div>
                                     <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                         <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                                     </div>
                                 </div>
                                 <div>
                                     <p className="text-sm font-bold text-gray-900 leading-tight">{username}</p>
                                     <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Admin</p>
                                 </div>
                             </div>
                             
                             {/* Other Members */}
                             {members?.map(m => (
                                <div key={m.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-left duration-300">
                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                                         {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-gray-400" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-700 leading-tight">{m.profiles?.username || 'Miembro'}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">Desde {new Date(m.joined_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</p>
                                    </div>
                                </div>
                             ))}

                             {/* Empty Slots Placeholder */}
                             {[...Array(availableSlots)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 opacity-30 cursor-help" title="¡Este puesto puedes ser tú!">
                                    <div className="w-10 h-10 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center">
                                         <Plus className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Puesto Libre</span>
                                </div>
                             ))}
                         </div>
                    </div>
                </div>

            {/* Interaction/Chat Area (Right 9 cols) */}
                <div className="lg:col-span-9">
                     <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 flex flex-col min-h-[400px] lg:min-h-[500px] relative overflow-hidden">
                         
                         {/* Chat Empty State (Reference style) */}
                         <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 text-center">
                            <div className="w-32 h-32 lg:w-40 lg:h-40 bg-gray-50 rounded-full flex items-center justify-center mb-6 lg:mb-8 relative">
                                <MessageSquareText className="w-12 h-12 lg:w-16 lg:h-16 text-gray-200" />
                                <div className="absolute -top-2 -right-2 w-8 h-8 lg:w-10 lg:h-10 bg-[#EF534F]/10 rounded-full flex items-center justify-center">
                                    <Smile className="w-4 h-4 lg:w-5 lg:h-5 text-[#EF534F]" />
                                </div>
                            </div>
                            <h3 className="text-xl lg:text-2xl font-black text-gray-900 mb-2">Muro del Grupo</h3>
                            <p className="text-gray-500 max-w-[340px] text-sm leading-relaxed">
                                Este es vuestro espacio privado para comentar fallos, renovaciones o simplemente saludar.
                            </p>
                         </div>

                         {/* Chat Footer */}
                         <div className="p-4 lg:p-6 bg-gray-50/50 border-t border-gray-100">
                             <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-[20px] p-2 pl-4 lg:pl-5 focus-within:border-indigo-300 focus-within:ring-8 focus-within:ring-indigo-50 transition-all shadow-sm">
                                 <Smile className="w-6 h-6 text-gray-300 hover:text-gray-500 cursor-pointer hidden sm:block" />
                                 <input 
                                    type="text" 
                                    placeholder="Escribe un mensaje..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 placeholder:text-gray-300 font-medium py-3 text-sm lg:text-base"
                                 />
                                 <button className="bg-[#1a1a1a] text-white p-3 lg:p-3.5 rounded-2xl hover:bg-black transition-all transform active:scale-90 flex items-center justify-center">
                                    <Send className="w-4 h-4 lg:w-5 lg:h-5" />
                                 </button>
                             </div>
                         </div>
                     </div>
                </div>

            </div>
        </div>
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">Método de Pago</h3>
                  <p className="text-white/80 text-sm mt-1">Elige cómo pagar €{total.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Balance Display */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tu saldo</p>
                    <p className="text-lg font-bold text-gray-900">€{balance.toFixed(2)}</p>
                  </div>
                </div>
                {balance >= total && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    Saldo suficiente
                  </span>
                )}
              </div>
            </div>

            {/* Payment Options */}
            <div className="p-6 space-y-3">
              {/* Option 1: Pay with Wallet (if sufficient balance) */}
              {balance >= total && (
                <button
                  onClick={handlePayWithWallet}
                  disabled={joining}
                  className="w-full p-4 border-2 border-green-500 bg-green-50 rounded-xl hover:bg-green-100 transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-900">Pagar con Billetera</p>
                    <p className="text-sm text-gray-500">Usar €{total.toFixed(2)} de tu saldo</p>
                  </div>
                  <span className="text-green-600 font-bold">Recomendado</span>
                </button>
              )}

              {/* Option 2: Hybrid Payment (if partial balance) */}
              {balance > 0 && balance < total && (
                <button
                  onClick={handlePayHybrid}
                  disabled={joining}
                  className="w-full p-4 border-2 border-indigo-500 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-900">Billetera + Tarjeta</p>
                    <p className="text-sm text-gray-500">
                      €{balance.toFixed(2)} saldo + €{(total - balance).toFixed(2)} tarjeta
                    </p>
                  </div>
                  <span className="text-indigo-600 font-bold">Recomendado</span>
                </button>
              )}

              {/* Option 3: Pay with Card */}
              <button
                onClick={handlePayWithCard}
                disabled={joining}
                className="w-full p-4 border-2 border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-900">Pagar con Tarjeta</p>
                  <p className="text-sm text-gray-500">Pago completo €{total.toFixed(2)}</p>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <p className="text-xs text-gray-400 text-center">
                🔒 Pago seguro procesado por Stripe
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default GroupDetailPage
