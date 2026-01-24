import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Check, ChevronLeft, Monitor, Smartphone, Laptop, Globe, Loader2, AlertCircle, ShieldCheck, Zap, User } from 'lucide-react'
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
            
            {/* Columna izquierda - Cover e info (8 cols) */}
            <div className="lg:col-span-8">
              {/* Main Card */}
              <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100 mb-6">
                
                {/* Header Banner */}
                <div className="relative h-[140px] bg-gradient-to-r from-gray-50 to-white flex items-center px-8">
                     <div className="absolute top-0 right-0 p-32 bg-[#EF534F]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                     
                     <div className="relative z-10 flex items-center gap-6">
                        <div className="w-24 h-24 bg-white rounded-[20px] shadow-sm flex items-center justify-center p-4 border border-gray-100">
                            {logoUrl ? (
                                <img src={logoUrl} alt={service.name} className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-4xl">{getEmojiForSlug(service.slug)}</span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">
                                {service.name}
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                                    Verificado
                                </span>
                                <span className="text-sm text-gray-500">Suscripción Premium Compartida</span>
                            </div>
                        </div>
                     </div>
                </div>

                <div className="p-8">
                    {/* Period Selector */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            1. Elige tu plan
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {plans.map(plan => (
                                <button
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan)}
                                    className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                                    ${selectedPlan?.id === plan.id 
                                        ? 'border-[#EF534F] bg-[#fff5f5]' 
                                        : 'border-gray-100 hover:border-gray-200 bg-white'
                                    }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-3 px-3 py-0.5 bg-[#EF534F] text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
                                            Más vendido
                                        </div>
                                    )}
                                    <div className="text-sm font-medium text-gray-600 mb-1">{plan.months} Meses</div>
                                    <div className="text-xl font-black text-gray-900">
                                        €{plan.pricePerMonth.toFixed(2)}
                                        <span className="text-xs font-normal text-gray-400">/mes</span>
                                    </div>
                                    {plan.save > 0 && (
                                        <div className="mt-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">
                                            Ahorra {plan.save}%
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Slots Selector */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            2. Selecciona cantidad
                        </h3>
                        <div className="flex gap-3">
                            <button
                                className={`px-6 py-3 rounded-xl border-2 font-bold transition-all text-sm flex items-center gap-2
                                ${selectedType.id === 1
                                    ? 'border-[#EF534F] bg-[#fff5f5] text-[#EF534F]' 
                                    : 'border-gray-100 text-gray-600 hover:border-gray-200'
                                }`}
                            >
                                <User className="w-4 h-4" />
                                1 Perfil
                            </button>
                             {/* Future: Add more slots logic */}
                        </div>
                    </div>

                    {/* Description & Warranty */}
                    <div className="border-t border-gray-100 pt-6">
                         <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl">
                            <ShieldCheck className="w-6 h-6 text-blue-600 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-blue-900 text-sm mb-1">Garantía de reembolso de 24h</h4>
                                <p className="text-xs text-blue-700/80 leading-relaxed">
                                    Si tienes algún problema con tu suscripción en las primeras 24 horas, te devolvemos el dinero sin preguntas. Soporte 24/7 incluido.
                                </p>
                            </div>
                         </div>
                    </div>

                </div>
              </div>
              
              {/* Features List */}
              <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100">
                 <h3 className="text-lg font-bold text-gray-900 mb-6">¿Qué incluye tu suscripción?</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3.5 h-3.5 text-green-600" strokeWidth={3} />
                            </div>
                            <span className="text-gray-700 font-medium text-sm">{feature}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                             <Zap className="w-3.5 h-3.5 text-purple-600" strokeWidth={3} />
                        </div>
                        <span className="text-gray-700 font-medium text-sm">Entrega inmediata</span>
                    </div>
                 </div>
              </div>

            </div>

            {/* Columna derecha - Sticky Summary (4 cols) */}
            <div className="lg:col-span-4">
              <div className="sticky top-[90px] space-y-4">
                
                {/* Summary Card */}
                <div className="bg-white rounded-[24px] p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
                    <h3 className="font-black text-xl text-gray-900 mb-6">Resumen</h3>
                    
                    {selectedPlan && (
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Servicio</span>
                                <span className="font-medium text-gray-900">{service.name}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Plan</span>
                                <span className="font-medium text-gray-900">{selectedPlan.label}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Posiciones</span>
                                <span className="font-medium text-gray-900">1 Perfil</span>
                            </div>
                            <div className="border-t border-dashed border-gray-200 my-2"></div>
                             <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-900">Total a pagar</span>
                                <div className="text-right">
                                    <div className="font-black text-3xl text-[#EF534F]">
                                        €{selectedPlan.totalPrice.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {paymentError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                        {paymentError}
                      </div>
                    )}

                    <button 
                        onClick={handlePayment}
                        disabled={isProcessingPayment || !selectedPlan}
                        className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-red-200 hover:shadow-red-300 transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ background: '#EF534F' }}
                    >
                        {isProcessingPayment ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          'Pagar ahora'
                        )}
                    </button>

                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                        <Monitor className="w-3 h-3" /> Pago 100% Seguro y Encriptado
                    </div>
                </div>

                {/* Social Proof */}
                <div className="bg-white/80 backdrop-blur rounded-[20px] p-4 border border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black text-white flex items-center justify-center font-bold text-sm">
                        {currentBuyer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-0.5">Actividad reciente</p>
                        <p className="text-sm text-gray-900 leading-tight">
                            <b>{currentBuyer.name}</b> compró hace <b>{currentBuyer.time} min</b>
                        </p>
                    </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

export default ServiceDetailPage
