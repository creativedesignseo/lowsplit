import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Check, ChevronLeft, Monitor, Smartphone, Laptop, Globe, Loader2, AlertCircle, ShieldCheck, Zap, User, Users, MessageSquareText, Smile, Send, Shield, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { stripePromise } from '../lib/stripe'
import { MOCK_SERVICES } from '../lib/data'
import { getLogoUrl, getEmojiForSlug, calculateSlotPrice } from '../lib/utils'

const ServiceDetailPage = () => {
  const { id: slug } = useParams()
  
  // State for UI selections
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [selectedType, setSelectedType] = useState({ id: 1, name: '1 posición', description: 'Compartido', available: true })
  const [autoRenew, setAutoRenew] = useState(true)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [showBizumModal, setShowBizumModal] = useState(false)
  const navigate = useNavigate()

  // Handle Stripe Checkout
  const handlePayment = async () => {
    if (!selectedPlan || !service) return
    
    setIsProcessingPayment(true)
    setPaymentError(null)

    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession()
      
      // Call our Netlify Function to create checkout session
      const response = await fetch(
        '/.netlify/functions/create-checkout',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            serviceName: service.name,
            priceAmount: selectedPlan.totalPrice,
            months: selectedPlan.months,
            userEmail: session?.user?.email || null,
            groupId: null // Will be filled when joining specific group
          })
        }
      )

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Payment error:', error)
      setPaymentError(error.message || 'Error al procesar el pago')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Handle Bizum Payment (Manual)
  const handleBizumPayment = async () => {
    if (!selectedPlan || !service) return
    
    setIsProcessingPayment(true)
    
    try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
            navigate('/auth')
            return
        }

        const response = await fetch('/.netlify/functions/manual-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: session.user.id,
                userEmail: session.user.email,
                // Assuming we are in Explore mode (no specific group ID yet, so we just create transaction)
                // BUT wait, if we are in Explore, we don't have a groupId unless we select one. 
                // The current page logic is for "Service Detail", which implies creating a NEW subscription or joining?
                // The current flow in `ServiceDetailPage` doesn't seem to have `groupId` from params unless passed?
                // The `create-checkout` function had `groupId: null`. 
                // If this is "buy a plan", do we create a group? Or just a transaction?
                // The webhook logic for `create-checkout` creates a membership ONLY if `groupId` exists.
                // If I am buying generic credit? 
                // Ah, looking at `ShareSubscriptionPage`, that's where we create groups.
                // `ServiceDetailPage` seems to be for joining? Or buying "access"?
                // Let's look at `create-checkout` usage in `ServiceDetailPage`: `groupId: null`.
                // So buying here just records a transaction. It doesn't seem to assign a group unless one is picked.
                // Re-reading `ServiceDetailPage`... it doesn't have group selection.
                // It seems this page is for "Buying a Service" -> which might mean "Getting assigned to a group automatically" or "Credits"?
                // In Phase 4 logic: `memberships` require a `group_id`.
                // If `groupId` is null, the webhook does NOT create a membership.
                // So... what is the point of this page if it doesn't join a group?
                // Ah, maybe the user is supposed to find a group in `/explore` and click it?
                // Use case: "Netflix Premium" -> Buy.
                // If I click "Pagar", it creates a transaction.
                // Then what? Support manually assigns?
                // Given "LowSplit" model usually means joining a group.
                // For now, I will mirror the Stripe logic: `groupId: null`. 
                // The transaction will be recorded. The "Membership" creation might be manual by admin later?
                // Or maybe I should auto-create a group for them?
                // User said: "He enviado el pago" -> "Activación Inmediata".
                // If I treat this as "Add funds", fine.
                // Let's match `create-checkout` behavior.
                serviceName: service.name,
                amount: selectedPlan.totalPrice,
                months: selectedPlan.months
            })
        })

        const data = await response.json()
        
        if (data.error) throw new Error(data.error)

        // Success -> Redirect to Dashboard
        setShowBizumModal(false)
        navigate('/dashboard?payment=success_bizum')

    } catch (error) {
        console.error('Bizum error:', error)
        alert('Error al procesar: ' + error.message)
    } finally {
        setIsProcessingPayment(false)
    }
  }
  
  // Filters State
  const [filters, setFilters] = useState({
      planType: 'all',
      verified: false,
      instant: false,
      sortBy: 'price'
  })

  // Fetch specific service from Supabase
  const { data: service, isLoading: isLoadingService, error: errorService } = useQuery({
    queryKey: ['service', slug],
    queryFn: async () => {
      // 1. Try to find in MOCK_SERVICES first (for demo speed/reliability)
      const mock = MOCK_SERVICES.find(s => s.slug === slug || s.slug === slug.replace('-premium', ''))
      if (mock) return mock

      // 2. Fallback to DB
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('slug', slug)
        .single()
      
      if (error) throw error
      return data
    },
    initialData: () => MOCK_SERVICES.find(s => s.slug === slug || s.slug.includes(slug))
  })

  // Fetch Available Groups for this Service
  const { data: groups, isLoading: isLoadingGroups } = useQuery({
      queryKey: ['groups', service?.id, filters],
      enabled: !!service,
      queryFn: async () => {
          let query = supabase
              .from('subscription_groups')
              .select(`
                  *,
                  admin:profiles!admin_id (id, full_name, avatar_url, reputation_score)
              `)
              .eq('service_id', service.id)
              .eq('status', 'available')
          
          if (filters.verified) query = query.eq('invoice_verified', true)
          if (filters.instant) query = query.eq('instant_acceptance', true)
          
          const { data, error } = await query
          if (error) {
              console.warn("Could not fetch groups (possibly missing columns):", error)
              return [] 
          }
          
          // Client-side sorting because some fields might be calculated or JSON
          let sortedData = data || []
          if (filters.sortBy === 'price') sortedData.sort((a, b) => a.price_per_slot - b.price_per_slot)
          if (filters.sortBy === 'reputation') sortedData.sort((a, b) => (b.admin?.reputation_score || 0) - (a.admin?.reputation_score || 0))

          return sortedData
      }
  })

  // Dynamic Plans Calculation (for Official Stock reference)
  const plans = service ? (() => {
    const monthlyPrice = parseFloat(calculateSlotPrice(service.total_price, service.max_slots))
    return [
      { id: 1, months: 1, label: '1 Mes', pricePerMonth: monthlyPrice * 1.2, totalPrice: monthlyPrice * 1.2, save: 0 },
    ]
  })() : []

  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      setSelectedPlan(plans[0])
    }
  }, [plans, selectedPlan])


  if (isLoadingService) {
    return (
      <div className="min-h-screen pt-24 flex justify-center items-center bg-[#FAFAFA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#EF534F]" />
      </div>
    )
  }

  if (errorService || !service) {
    return (
      <div className="min-h-screen pt-24 px-4 text-center bg-[#FAFAFA]">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">Servicio no encontrado</h2>
        <Link to="/explore" className="mt-4 inline-flex px-6 py-2 bg-[#EF534F] text-white rounded-full font-medium shadow-lg shadow-red-200">
            Volver a explorar
        </Link>
      </div>
    )
  }

  const logoUrl = getLogoUrl(service.slug)
  const features = service.features || []

  return (
    <>
      <Helmet>
        <title>{service.name} - LowSplit</title>
        <meta name="description" content={service.description} />
      </Helmet>

      <div className="min-h-screen bg-[#FAFAFA] pt-[70px]">
        {/* Header con back button */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-[1100px] mx-auto px-4 py-4">
            <Link to="/explore" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#EF534F] transition-colors">
              <ChevronLeft className="w-4 h-4" />
              <span>Volver al catálogo</span>
            </Link>
          </div>
        </div>

        <div className="max-w-[1240px] mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
            
            {/* SIDEBAR FILTERS */}
            <div className="w-full lg:w-[320px] flex-shrink-0 space-y-8">
                {/* Intro Card */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 text-center">
                    <div className="w-20 h-20 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 overflow-hidden relative">
                        {logoUrl ? (
                            <img src={logoUrl} alt={service.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl">{getEmojiForSlug(service.slug)}</span>
                        )}
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">{service.name}</h1>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        Únete a un grupo verificado y ahorra hasta un 80% en tu suscripción mensual.
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-gray-400" /> 
                        Filtros
                    </h3>

                    {/* Filter: Plan Type */}
                    <div className="mb-8">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">Tipo de Plan</label>
                        <div className="flex flex-wrap gap-2">
                            <button className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-full">Todos</button>
                            <button className="px-4 py-2 bg-gray-100 text-gray-500 text-xs font-bold rounded-full hover:bg-gray-200 transition-colors">Premium</button>
                            <button className="px-4 py-2 bg-gray-100 text-gray-500 text-xs font-bold rounded-full hover:bg-gray-200 transition-colors">Estándar</button>
                        </div>
                    </div>

                    {/* Filter: Verified Invoice */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <ShieldCheck className="w-4 h-4 text-green-600" />
                                <span className="font-bold text-gray-900 text-sm">Factura Verificada</span>
                            </div>
                            <p className="text-xs text-gray-400 leading-tight">Solo grupos con recibo subido</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={filters.verified}
                                onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.checked }))} 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>

                    {/* Filter: Instant Acceptance */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Zap className="w-4 h-4 text-yellow-500" fill="currentColor" />
                                <span className="font-bold text-gray-900 text-sm">Aceptación Inmediata</span>
                            </div>
                            <p className="text-xs text-gray-400 leading-tight">Únete sin esperar aprobación</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={filters.instant}
                                onChange={(e) => setFilters(prev => ({ ...prev, instant: e.target.checked }))}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                        </label>
                    </div>

                     {/* Filter: Sort */}
                     <div className="border-t border-gray-100 pt-6">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">Ordenar por</label>
                        <div className="space-y-1">
                             <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors">
                                <span>Índice de confianza</span>
                                <ChevronLeft className="w-4 h-4 rotate-270 text-gray-300" />
                             </button>
                             <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors">
                                <span>Tiempo de respuesta</span>
                                <ChevronLeft className="w-4 h-4 rotate-270 text-gray-300" />
                             </button>
                             <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors">
                                <span>Precio más bajo</span>
                                <ChevronLeft className="w-4 h-4 rotate-270 text-gray-300" />
                             </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN LIST: Available Groups */}
            <div className="flex-1 space-y-4">
                
                {/* Official LowSplit Card (Pinned) */}
                <div className="bg-white rounded-[24px] p-4 pr-6 shadow-sm border border-red-50 flex flex-col sm:flex-row items-center gap-6 group hover:shadow-md transition-all relative overflow-hidden mb-6">
                     {/* "Official" Badge Banner */}
                     <div className="absolute top-0 right-0 bg-red-50 text-[#EF534F] text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest z-10">
                        Recomendado
                     </div>
                     
                     {/* Thick Red Bar */}
                     <div className="absolute left-3 top-3 bottom-3 w-1.5 bg-[#EF534F] rounded-full"></div>
                     
                     {/* Logo Section */}
                     <div className="pl-6 pt-2 sm:pt-0">
                        <div className="w-16 h-16 rounded-full border-2 border-[#EF534F] p-1 flex items-center justify-center bg-white shadow-sm relative">
                             <img src="/logo.png" className="w-full h-full object-contain rounded-full" alt="LowSplit" />
                             <div className="absolute -bottom-1 -right-1 bg-[#EF534F] text-white rounded-full p-0.5 border-2 border-white">
                                <ShieldCheck className="w-3 h-3" />
                             </div>
                        </div>
                     </div>

                     {/* Content Section */}
                     <div className="flex-1 text-center sm:text-left space-y-2">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                            <h3 className="text-xl font-black text-gray-900">LowSplit Oficial</h3>
                            <ShieldCheck className="w-5 h-5 text-[#EF534F]" fill="#FEF2F2" />
                        </div>
                        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                            <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-green-100">
                                <ShieldCheck className="w-3.5 h-3.5" /> Factura Verificada
                            </span>
                            <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-blue-100">
                                <Zap className="w-3.5 h-3.5" /> Automático
                            </span>
                        </div>
                     </div>

                     {/* Price & Action Section */}
                     <div className="flex items-center gap-6 pl-0 sm:pl-6 border-l-0 sm:border-l border-gray-100 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                            <div className="text-2xl font-black text-[#EF534F]">
                                €{(selectedPlan?.pricePerMonth || 3.99).toFixed(2)}
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block -mt-1">/mes</span>
                        </div>
                        <button 
                            onClick={handlePayment} 
                            className="bg-[#111111] hover:bg-black text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl shadow-gray-200 transition-transform transform active:scale-95"
                        >
                            Unirme
                        </button>
                     </div>
                </div>

                {/* User Groups List */}
                {groups && groups.length > 0 ? (
                    groups.map((group) => (
                    <div key={group.id} className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-4 group hover:border-[#EF534F]/30 hover:shadow-md transition-all">
                        
                        {/* User Info */}
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="relative">
                                {/* Dynamic Gradient Border based on score */}
                                <div className={`w-16 h-16 rounded-full p-[2px] ${
                                    (group.admin?.reputation_score || 0) >= 90 ? 'bg-gradient-to-tr from-blue-400 to-cyan-300' :
                                    (group.admin?.reputation_score || 0) >= 70 ? 'bg-gradient-to-tr from-pink-500 to-purple-400' :
                                    'bg-gray-100'
                                }`}>
                                    <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden">
                                        {group.admin?.avatar_url ? (
                                            <img src={group.admin.avatar_url} alt={group.admin.full_name} className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                                <User className="w-6 h-6 text-gray-300" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Score Badge */}
                                {group.admin?.reputation_score && (
                                    <div className={`absolute -bottom-1 -right-1 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white ${
                                        group.admin.reputation_score >= 90 ? 'bg-cyan-500' : 'bg-pink-500'
                                    }`}>
                                        {group.admin.reputation_score}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1">
                                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                                    {group.admin?.full_name || 'Usuario'}
                                    <span className={`w-2 h-2 rounded-full ${group.invoice_verified ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                </h3>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">está compartiendo <span className="text-gray-900 font-bold">{service.name}</span></p>
                                
                                {group.invoice_verified && (
                                    <div className="mt-2 inline-flex items-center gap-1 bg-[#00C48C] text-white text-[10px] font-bold px-2.5 py-1 rounded-[4px] uppercase tracking-wide shadow-sm shadow-green-200">
                                        <Check className="w-3 h-3" strokeWidth={4} /> Factura Verificada
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Spacer */}
                        <div className="flex-1"></div>

                        {/* Price & Action */}
                        <div className="flex items-center justify-between w-full sm:w-auto gap-8 pl-0 sm:pl-8 border-t sm:border-0 border-gray-50 pt-4 sm:pt-0">
                             <div className="text-right">
                                <div className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                    {group.instant_acceptance && <Zap className="w-5 h-5 text-yellow-400" fill="currentColor" />}
                                    €{group.price_per_slot.toFixed(2)}
                                </div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block -mt-1">/mes</span>
                             </div>
                             <Link to={`/group/${group.id}`} className="bg-[#111111] hover:bg-black text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl shadow-gray-200 transition-transform transform active:scale-95">
                                Únete
                             </Link>
                        </div>
                    </div>
                ))
               ) : (
                <div className="text-center py-12 bg-white rounded-[24px] border border-gray-100 border-dashed">
                    <p className="text-gray-400 mb-2">No hay grupos disponibles con estos filtros.</p>
                    <button 
                        onClick={() => setFilters({ planType: 'all', verified: false, instant: false, sortBy: 'price' })}
                        className="text-[#EF534F] text-sm font-bold hover:underline"
                    >
                        Limpiar filtros
                    </button>
                </div>
               )}

            </div>
            
            </div>
        </div>
      </div>

      {/* Bizum Modal */}
      {showBizumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Smartphone className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Pagar con Bizum</h3>
                    <p className="text-gray-500 mb-6">Envía el importe exacto al siguiente número para activar tu suscripción.</p>
                    
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">NÚMERO BIZUM</p>
                        <p className="text-3xl font-black text-gray-900 tracking-wider mb-2 select-all">+34 600 000 000</p>
                        <p className="text-sm text-gray-600">Concepto: <b>{service.name}</b></p>
                        <p className="text-sm text-gray-600 mt-1">Importe: <b className="text-[#EF534F]">€{selectedPlan?.totalPrice.toFixed(2)}</b></p>
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={handleBizumPayment}
                            disabled={isProcessingPayment}
                            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                        >
                            {isProcessingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : 'He enviado el pago'}
                        </button>
                        <button 
                            onClick={() => setShowBizumModal(false)}
                            className="w-full py-3 text-gray-500 font-medium hover:text-gray-800"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </>
  )
}

export default ServiceDetailPage
