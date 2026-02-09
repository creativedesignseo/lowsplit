import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Check, ChevronLeft, ShieldCheck, Star, Clock, Calendar, UserCheck, Shield, MessageCircle, Users, MessageSquareText, Smile, Send, User, Plus, Loader2, Wallet, CreditCard, X, ChevronRight, ThumbsUp, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getLogoUrl, getEmojiForSlug, calculateSlotPrice } from '../lib/utils'
import { useWallet } from '../hooks/useWallet'
import { loadStripe } from '@stripe/stripe-js'
import ServiceCard from '../components/ServiceCard'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const GroupDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [joining, setJoining] = useState(false)
  const [session, setSession] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Reviews Mock Data (GamsGo Style)
  const MOCK_REVIEWS = [
    { user: 'bud***', service: 'Cuenta de Netflix', comment: '¡Recomendado!', time: '22 minutes ago', rating: 5 },
    { user: 'gob***', service: 'Suscripción de YouTube', comment: '¡Recomendado!', time: '27 minutes ago', rating: 5 },
    { user: 'cmi***', service: 'Cuenta de Netflix', comment: '¡Recomendado!', time: '32 minutes ago', rating: 5 },
    { user: 'Ale***', service: 'Cuenta Disney Plus', comment: '¡Recomendado!', time: '1 hour ago', rating: 5 },
  ]

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
                description,
                max_slots,
                icon_url,
                total_price
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

  // Mock related services fetch or reuse from ExplorePage logic (simplified)
  const { data: relatedServices } = useQuery({
    queryKey: ['related-services'],
    queryFn: async () => {
        const { data } = await supabase
            .from('services')
            .select('*')
            .limit(4)
        return data || []
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
  const username = admin?.username || 'Usuario'
  
  // Calculate pricing
  const price = group.price_per_slot || 0
  const total = price + 0.35 // Service fee
  
  // Handlers
  const handlePaymentClick = () => {
    if (!session) {
      navigate('/login', { state: { from: `/group/${id}` } })
      return
    }
    setShowPaymentModal(true)
  }

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

  const handlePayHybrid = async () => {
    const walletAmount = Math.min(balance, total)
    const cardAmount = total - walletAmount
    setJoining(true)
    setShowPaymentModal(false)
    try {
      if (walletAmount > 0) {
        const { error: walletError } = await supabase.rpc('handle_partial_wallet_payment', {
          p_user_id: session.user.id,
          p_amount: walletAmount,
          p_description: `Pago parcial para ${service.name}`
        })
        if (walletError) throw walletError
      }
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
        <title>{service.name} - Oferta de {username} | LowSplit</title>
      </Helmet>

      <div className="min-h-screen bg-[#FAFAFA] pt-[80px] pb-12 font-sans">
        
        {/* Navigation Breadcrumb */}
        <div className="max-w-[1240px] mx-auto px-4 mb-6">
            <Link to={`/marketplace/list/${service.slug}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 font-medium">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Volver a todas las ofertas
            </Link>
        </div>

        <div className="max-w-[1240px] mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT COLUMN (Main Content) */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* 1. SERVICE DETAILS CARD */}
                    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6 sm:p-8 relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row gap-6">
                             {/* Product Image */}
                             <div className="w-full sm:w-[280px] h-[160px] sm:h-[180px] bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden flex-shrink-0 group">
                                {logoUrl ? (
                                    <img src={logoUrl} className="w-full h-full object-contain p-8 z-10 transition-transform group-hover:scale-105" alt={service.name} />
                                ) : (
                                    <span className="text-6xl z-10">{getEmojiForSlug(service.slug)}</span>
                                )}
                                {/* Background gradient effect */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-0"></div>
                                <div className="absolute bottom-3 left-3 z-10">
                                    <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                        4K UltraHD
                                    </span>
                                </div>
                             </div>

                             {/* Product Info */}
                             <div className="flex-1">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-2">
                                    {service.name} - Premium Compartido
                                </h1>
                                <div className="flex items-center gap-2 mb-4">
                                    <Check className="w-5 h-5 text-green-500 bg-green-50 rounded-full p-0.5" />
                                    <span className="text-lg font-medium text-gray-700">Cuenta estable - Visualización 4K</span>
                                </div>

                                <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm text-gray-600">
                                    <div className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-green-500 mt-0.5" />
                                        <div>
                                            <span className="block text-gray-400 text-xs">Región</span>
                                            <span className="font-medium text-gray-800">Global / España</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                                        <div>
                                            <span className="block text-gray-400 text-xs">Método</span>
                                            <span className="font-medium text-gray-800">Perfil compartido</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Zap className="w-4 h-4 text-gray-400 mt-0.5" />
                                        <div>
                                            <span className="block text-gray-400 text-xs">Dispositivos</span>
                                            <span className="font-medium text-gray-800">TV, PC, Móvil</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                                        <div>
                                            <span className="block text-gray-400 text-xs">Duración</span>
                                            <span className="font-medium text-gray-800">1 Mes (Renovable)</span>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* Notice Box */}
                         <div className="mt-6 bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                <ShieldCheck className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-blue-800 mb-1">Aviso importante</h4>
                                <p className="text-xs text-blue-700/80 leading-relaxed">
                                    Este grupo es gestionado por un usuario verificado de la comunidad ({username}). 
                                    LowSplit actúa como intermediario seguro, reteniendo el pago hasta que confirmes el acceso correcto.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 3. DESCRIPTION CARD */}
                    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            Descripción de la oferta
                        </h3>
                        <div className="prose prose-sm prose-gray max-w-none text-gray-600">
                             <p>
                                {service.description || `Únete a este grupo familiar de ${service.name} para disfrutar de todas las ventajas Premium. 
                                Cuenta compartida gestionada profesionalmente para garantizar estabilidad y privacidad en tu perfil.`}
                             </p>
                             <ul className="mt-4 space-y-2 list-none p-0">
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Garantía de funcionamiento durante todo el periodo.</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Soporte directo con el administrador del grupo.</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Renovación automática disponible si hay saldo.</li>
                             </ul>
                             <p className="mt-4 text-xs text-gray-400 italic">
                                Traducido automáticamente por LowSplit
                             </p>
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN (Sidebar) */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* 2. PRICE & PURCHASE CARD */}
                    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                                <span className="text-gray-500">Entrega garantizada</span>
                                <span className="font-bold text-gray-900 flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-gray-400" /> 20 minutos
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                                <span className="text-gray-500">Tiempo medio</span>
                                <span className="font-medium text-green-600 flex items-center gap-1">
                                    <Zap className="w-4 h-4" /> ~5 min
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm pb-1">
                                <span className="text-gray-500">Garantía</span>
                                <span className="font-bold text-gray-900 flex items-center gap-1">
                                    <ShieldCheck className="w-4 h-4 text-gray-400" /> 30 días
                                </span>
                            </div>

                            <div className="pt-4 pb-2">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-lg font-bold text-gray-900">Total:</span>
                                    <span className="text-4xl font-black text-[#EF534F]">€{total.toFixed(2)}</span>
                                </div>
                                
                                <button 
                                    onClick={handlePaymentClick}
                                    disabled={joining}
                                    className="w-full bg-[#EF534F] hover:bg-[#d64541] text-white font-bold py-3.5 rounded-full shadow-lg shadow-red-100 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Comprar ahora'}
                                </button>
                            </div>

                            <div className="pt-2 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                                    <span>Garantía de reembolso de 10 días</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Zap className="w-4 h-4 text-yellow-500" />
                                    <span>Opciones de pago rápido y seguro</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. VENDOR & REVIEWS CARD */}
                    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full border border-gray-200 overflow-hidden bg-gray-50">
                                {admin?.avatar_url ? (
                                    <img src={admin.avatar_url} alt={username} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                                        {username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-gray-900">{username}</span>
                                    <Check className="w-3.5 h-3.5 text-white bg-green-500 rounded-full p-0.5" />
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full mt-1 w-fit">
                                    <ThumbsUp className="w-3 h-3 fill-current" />
                                    99.04% ({admin?.reputation_score || 100} votos)
                                </div>
                            </div>
                        </div>

                        <h4 className="font-bold text-gray-900 mb-4 text-sm">Comentarios recientes</h4>
                        
                        <div className="space-y-4">
                            {MOCK_REVIEWS.map((review, i) => (
                                <div key={i} className="pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ThumbsUp className="w-3.5 h-3.5 text-blue-500 fill-current" />
                                        <span className="font-bold text-sm text-gray-800">{review.user}</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-xs text-gray-500 truncate max-w-[120px]">{review.service}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 font-medium mb-1">
                                        {review.comment}
                                    </p>
                                    <span className="text-xs text-gray-400">{review.time}</span>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-4 text-center text-sm font-bold text-gray-900 hover:underline">
                            Todos los comentarios
                        </button>
                    </div>

                </div>

            </div>

            {/* 5. EXPLORE MORE SECTION */}
            <div className="mt-12 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Explorar más</h3>
                    <div className="flex gap-2">
                        <button className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-400 transition-colors">
                             <ChevronLeft className="w-5 h-5" />
                        </button>
                         <button className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-400 transition-colors">
                             <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {relatedServices && relatedServices.map((svc) => (
                        <div key={svc.id} className="h-full"> 
                            {/* Reusing ServiceCard but constraining height */}
                            <ServiceCard service={svc} />
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>

      {/* Payment Modal (Preserved Logic) */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-[#EF534F] p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">Completar Compra</h3>
                  <p className="text-white/90 text-sm mt-1">Total a pagar: €{total.toFixed(2)}</p>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="text-white/80 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
               {/* Balance Info */}
               <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
                   <div className="flex items-center gap-3">
                       <Wallet className="text-gray-400 w-5 h-5" />
                       <span className="text-gray-600 text-sm">Tu saldo</span>
                   </div>
                   <span className="font-bold text-gray-900">€{balance.toFixed(2)}</span>
               </div>

               {balance >= total && (
                <button 
                    onClick={handlePayWithWallet} disabled={joining}
                    className="w-full text-left p-4 border rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
                >
                    <div className="flex justify-between mb-1">
                        <span className="font-bold text-gray-900 group-hover:text-green-700">Pagar con Saldo</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Recomendado</span>
                    </div>
                    <p className="text-xs text-gray-500">Descontar del saldo disponible</p>
                </button>
               )}

               <button 
                    onClick={handlePayWithCard} disabled={joining}
                    className="w-full text-left p-4 border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                    <div className="flex justify-between mb-1">
                        <span className="font-bold text-gray-900">Tarjeta de Crédito / Débito</span>
                    </div>
                    <p className="text-xs text-gray-500">Procesado seguro por Stripe</p>
                </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE STICKY FOOTER (Visible only on mobile/tablet) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] p-4 z-40 lg:hidden safe-area-bottom">
        <div className="flex items-center gap-4 max-w-md mx-auto">
            <button 
                onClick={handlePaymentClick}
                disabled={joining}
                className="flex-1 bg-[#EF534F] hover:bg-[#d64541] text-white font-bold py-3 px-6 rounded-full shadow-lg shadow-red-100 transition-all active:scale-95 flex items-center justify-center"
            >
                {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Comprar ahora'}
            </button>
            <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 font-medium">Total</span>
                <span className="text-xl font-black text-[#EF534F]">€{total.toFixed(2)}</span>
            </div>
        </div>
      </div>

    </>
  )
}

export default GroupDetailPage
