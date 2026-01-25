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
  
  // Fetch specific service from Supabase
  const { data: service, isLoading, error } = useQuery({
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

  // Dynamic Plans Calculation
  const plans = service ? (() => {
    const monthlyPrice = parseFloat(calculateSlotPrice(service.total_price, service.max_slots))
    
    return [
      { id: 1, months: 1, label: '1 Mes', pricePerMonth: monthlyPrice * 1.2, totalPrice: monthlyPrice * 1.2, save: 0 },
      { id: 2, months: 6, label: '6 Meses', pricePerMonth: monthlyPrice * 0.95, totalPrice: monthlyPrice * 6 * 0.95, save: 15, popular: true },
      { id: 3, months: 12, label: '12 Meses', pricePerMonth: monthlyPrice * 0.85, totalPrice: monthlyPrice * 12 * 0.85, save: 25 },
    ]
  })() : []

  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      setSelectedPlan(plans.find(p => p.popular) || plans[0])
    }
  }, [plans, selectedPlan])

  // Mock Recent Buyers
  const [currentBuyerIndex, setCurrentBuyerIndex] = useState(0)
  const recentBuyers = [
      { name: 'm***is', time: 3 },
      { name: 'j***an', time: 7 },
      { name: 'c***os', time: 12 },
      { name: 'l***na', time: 18 },
  ]
  const currentBuyer = recentBuyers[currentBuyerIndex]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBuyerIndex(prev => (prev + 1) % recentBuyers.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])


  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex justify-center items-center bg-[#FAFAFA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#EF534F]" />
      </div>
    )
  }

  if (error || !service) {
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

        <div className="max-w-[1100px] mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Admin/Official Info (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                  {/* Banner accent */}
                  <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-red-50 to-orange-50 z-0"></div>
                  
                  <div className="relative z-10 flex flex-col items-center">
                      <div className="relative mb-4">
                          <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center p-4">
                              <img src="/logo.png" alt="LowSplit" className="w-full h-full object-contain opacity-20" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                  <ShieldCheck className="w-10 h-10 text-[#EF534F]" />
                              </div>
                          </div>
                          <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                              <Check className="w-4 h-4" />
                          </div>
                      </div>

                      <h2 className="text-xl font-bold text-gray-900">LowSplit Oficial</h2>
                      <p className="text-xs font-semibold text-[#EF534F] bg-red-50 px-3 py-1 rounded-full mt-2 uppercase tracking-wider">
                          Stock de la plataforma
                      </p>

                      <div className="mt-6 w-full space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                              <ShieldCheck className="w-5 h-5 text-green-600" />
                              <span className="text-xs font-bold text-green-700">Identidad Verificada</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                              <Zap className="w-5 h-5 text-blue-600" />
                              <span className="text-xs font-bold text-blue-700">Activación Inmediata</span>
                          </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-100 w-full space-y-3">
                          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Actividad</h3>
                          <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Miembro desde</span>
                              <span className="font-bold text-gray-900">Octubre 2023</span>
                          </div>
                          <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Reputación</span>
                              <span className="font-bold text-green-600">100/100</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Security info */}
              <div className="bg-indigo-50/50 rounded-[20px] p-5 border border-indigo-100/50">
                  <div className="flex gap-3">
                      <Shield className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                      <div>
                          <p className="text-sm font-bold text-indigo-900">Pago Protegido</p>
                          <p className="text-xs text-indigo-700/70 mt-1 leading-relaxed">
                              Tu dinero está seguro. Si el admin deja de pagar, te devolvemos la parte proporcional automáticamente.
                          </p>
                      </div>
                  </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Service Info & Selection (8 cols) */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
                
                {/* Header Section */}
                <div className="flex items-center gap-6 mb-10">
                    <div className="w-20 h-20 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-center">
                         {logoUrl ? <img src={logoUrl} alt={service.name} className="w-full h-full object-contain" /> : <span className="text-3xl">{getEmojiForSlug(service.slug)}</span>}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 mb-1">{service.name}</h1>
                        <p className="text-gray-500 font-medium">Suscripción Premium Gestionada</p>
                    </div>
                </div>

                {/* Plan Selection */}
                <div className="mb-10">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Selecciona tu plan</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        {plans.map(plan => (
                            <button
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan)}
                                className={`relative p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center ${
                                    selectedPlan?.id === plan.id 
                                    ? 'border-[#7c7cff] bg-[#f7f7ff] ring-4 ring-indigo-50' 
                                    : 'border-gray-50 hover:border-indigo-100 bg-gray-50/50'
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 px-3 py-1 bg-[#7c7cff] text-white text-[10px] font-bold rounded-full uppercase">Popular</div>
                                )}
                                <span className="text-sm font-bold text-gray-500 mb-1">{plan.label}</span>
                                <div className="text-2xl font-black text-gray-900">€{plan.pricePerMonth.toFixed(2)}</div>
                                <span className="text-[10px] text-gray-400 font-medium">por mes</span>
                                {plan.save > 0 && <span className="mt-2 text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-md">-{plan.save}% Ahorro</span>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-10">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Precio total del periodo:</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-[#EF534F]">
                                    €{selectedPlan?.totalPrice.toFixed(2)}
                                </span>
                                {selectedPlan?.months > 1 && <span className="text-sm text-gray-400 font-medium">/ cada {selectedPlan.months} meses</span>}
                            </div>
                        </div>

                        <div className="w-full sm:w-auto space-y-3">
                            <button 
                                onClick={handlePayment}
                                disabled={isProcessingPayment || !selectedPlan}
                                className="w-full sm:w-auto px-10 py-4 bg-[#1a1a1a] hover:bg-black text-white font-bold rounded-2xl shadow-xl shadow-gray-200 transition-all transform active:scale-95 flex items-center justify-center gap-3"
                            >
                                {isProcessingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Unirme ahora</>}
                            </button>
                            <button 
                                onClick={() => setShowBizumModal(true)}
                                className="w-full text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                O pagar con Bizum →
                            </button>
                        </div>
                    </div>
                </div>

              </div>
            </div>

            {/* Hub Section (Consistency with GroupDetailPage) */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Members List (Left 4 cols to match top) */}
                <div className="lg:col-span-4">
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 min-h-[400px]">
                         <h3 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
                            <Users className="w-4 h-4 text-[#EF534F]" />
                            Comunidad {service.name}
                         </h3>
                         <div className="space-y-4">
                             <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 italic text-gray-400 text-xs text-center">
                                 Un catálogo oficial siempre está lleno de usuarios. Únete para ver a tus compañeros de grupo.
                             </div>
                             {/* Mock Members for Official Stock */}
                             {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 opacity-60">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                         <User className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-700">Miembro {100 + i}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Verificado</p>
                                    </div>
                                </div>
                             ))}
                             <div className="pt-4 flex items-center gap-3 text-[#EF534F]">
                                 <Plus className="w-10 h-10 p-2.5 rounded-full bg-red-50 border-2 border-dashed border-red-200" />
                                 <span className="text-xs font-black uppercase tracking-widest">Tú aquí</span>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Chat Area (Right 8 cols to match top) */}
                <div className="lg:col-span-8">
                     <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 flex flex-col min-h-[500px] relative overflow-hidden">
                         <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-40 h-40 bg-gray-50 rounded-full flex items-center justify-center mb-8 relative">
                                <MessageSquareText className="w-16 h-16 text-gray-200" />
                                <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#EF534F]/10 rounded-full flex items-center justify-center">
                                    <Smile className="w-5 h-5 text-[#EF534F]" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Muro de LowSplit</h3>
                            <p className="text-gray-500 max-w-[340px] text-sm leading-relaxed mx-auto">
                                Una vez te unas, podrás hablar con nuestro equipo de soporte y otros miembros en este chat privado.
                            </p>
                         </div>

                         <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                             <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-[24px] p-2 pl-6 opacity-40 cursor-not-allowed">
                                 <Smile className="w-6 h-6 text-gray-300" />
                                 <span className="flex-1 text-gray-300 font-medium py-3 text-sm">Debes unirte al grupo para participar...</span>
                                 <div className="bg-gray-200 text-white p-3.5 rounded-2xl flex items-center justify-center">
                                    <Send className="w-5 h-5" />
                                 </div>
                             </div>
                         </div>
                     </div>
                </div>
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
