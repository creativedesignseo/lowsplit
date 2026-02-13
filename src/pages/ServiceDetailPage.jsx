import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left'
import Loader2 from 'lucide-react/dist/esm/icons/loader-2'
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle'
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check'
import Zap from 'lucide-react/dist/esm/icons/zap'
import Smartphone from 'lucide-react/dist/esm/icons/smartphone'
import Check from 'lucide-react/dist/esm/icons/check'
import Store from 'lucide-react/dist/esm/icons/store'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getLogoUrl, getEmojiForSlug, calculateSlotPrice, getDefaultFeatures } from '../lib/utils'

const ServiceDetailPage = () => {
  const { id: slug } = useParams()
  
  // State for UI selections
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [showBizumModal, setShowBizumModal] = useState(false)
  const navigate = useNavigate()

  // Fetch specific service from Supabase
  const { data: service, isLoading: isLoadingService, error: errorService } = useQuery({
    queryKey: ['service', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('slug', slug)
        .single()
      
      if (error) {
        console.error('Error fetching service:', error)
        throw error
      }
      
      return data
    }
  })

  // Dynamic Plans Calculation (for Official Stock reference)
  const plans = service ? (() => {
    const monthlyPrice = parseFloat(calculateSlotPrice(service.total_price, service.max_slots))
    return [
      { id: 1, months: 1, label: '1 Mes', pricePerMonth: monthlyPrice, totalPrice: monthlyPrice, save: 0 },
    ]
  })() : []

  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      setSelectedPlan(plans[0])
    }
  }, [plans, selectedPlan])

  // Handle Stripe Checkout
  const handlePayment = async () => {
    if (!selectedPlan || !service) return
    
    setIsProcessingPayment(true)
    setPaymentError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(
        '/.netlify/functions/create-checkout',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceName: service.name,
            priceAmount: selectedPlan.totalPrice,
            months: selectedPlan.months,
            userEmail: session?.user?.email || null,
            userId: session?.user?.id || null,
            groupId: null 
          })
        }
      )

      const data = await response.json()
      if (data.error) throw new Error(data.error)
      if (data.url) window.location.href = data.url
    } catch (error) {
      console.error('Payment error:', error)
      setPaymentError(error.message || 'Error al procesar el pago')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Handle Bizum Payment
  const handleBizumPayment = async () => {
    if (!selectedPlan || !service) return
    setIsProcessingPayment(true)
    try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { navigate('/auth'); return }

        const response = await fetch('/.netlify/functions/manual-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: session.user.id,
                userEmail: session.user.email,
                serviceName: service.name,
                amount: selectedPlan.totalPrice,
                months: selectedPlan.months
            })
        })
        const data = await response.json()
        if (data.error) throw new Error(data.error)
        setShowBizumModal(false)
        navigate('/dashboard?payment=success_bizum')
    } catch (error) {
        console.error('Bizum error:', error)
        alert('Error al procesar: ' + error.message)
    } finally {
        setIsProcessingPayment(false)
    }
  }

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
        <Link to="/explore" className="mt-4 inline-flex px-6 py-2 bg-[#EF534F] text-white rounded-xl font-medium shadow-lg shadow-red-200">
            Volver a explorar
        </Link>
      </div>
    )
  }

  const logoUrl = getLogoUrl(service.slug, service.icon_url)
  const features = service.features || getDefaultFeatures(service.category)
  const monthlyPrice = selectedPlan?.pricePerMonth || 0

  return (
    <>
      <Helmet>
        <title>{service.name} - LowSplit Oficial</title>
        <meta name="description" content={`Consigue ${service.name} al mejor precio. Garantía total y activación inmediata.`} />
      </Helmet>

      <div className="min-h-screen bg-[#FAFAFA] pt-[70px]">
        {/* Header con back button */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-[1100px] mx-auto px-4 py-4 flex justify-between items-center">
            <Link to="/explore" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#EF534F] transition-colors">
              <ChevronLeft className="w-4 h-4" />
              <span>Volver</span>
            </Link>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
            
            {/* PRODUCT HERO */}
            <div className="bg-white rounded-[32px] p-6 sm:p-10 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
                
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                    
                    {/* Left: Image & Badge */}
                    <div className="flex-shrink-0 mx-auto md:mx-0">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white border-4 border-white shadow-2xl rounded-[2rem] flex items-center justify-center relative">
                            {logoUrl ? (
                                <img src={logoUrl} alt={service.name} className="w-full h-full object-cover rounded-[1.7rem]" />
                            ) : (
                                <span className="text-6xl">{getEmojiForSlug(service.slug)}</span>
                            )}
                            <div className="absolute -bottom-3 -right-3 bg-[#EF534F] text-white p-2 rounded-xl shadow-lg border-4 border-white">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Right: Info & CTA */}
                    <div className="flex-1 w-full text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-[#EF534F] text-xs font-black uppercase tracking-widest mb-3">
                            <Zap className="w-3 h-3" /> Oficial LowSplit
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 leading-tight">
                            {service.name}
                        </h1>
                        <p className="text-gray-500 text-lg mb-6 leading-relaxed max-w-xl mx-auto md:mx-0">
                            Suscríbete al servicio oficial gestionado por LowSplit. Sin esperas, sin intermediarios. Garantía total de funcionamiento.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                            <div className="text-center sm:text-left">
                                <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Precio Mensual</div>
                                <div className="text-4xl font-black text-[#EF534F]">
                                    €{monthlyPrice.toFixed(2)}
                                </div>
                            </div>
                            
                            <div className="h-10 w-px bg-gray-200 hidden sm:block"></div>

                            <button 
                                onClick={handlePayment}
                                className="w-full sm:w-auto px-8 py-4 bg-[#EF534F] hover:bg-[#e0403c] text-white rounded-xl font-bold text-lg shadow-xl shadow-red-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                            >
                                Unirme Ahora
                            </button>
                        </div>
                        
                        <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                           <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                                <Check className="w-4 h-4 text-green-500" strokeWidth={3} />
                                Activación Inmediata
                           </div>
                           <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                                <Check className="w-4 h-4 text-green-500" strokeWidth={3} />
                                Soporte 24/7
                           </div>
                           <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                                <Check className="w-4 h-4 text-green-500" strokeWidth={3} />
                                Cancelas cuando quieras
                           </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MARKETPLACE BANNER */}
            <div className="mt-8">
                <Link to={`/marketplace/list/${slug}`} className="group block">
                    <div className="bg-white hover:bg-gray-50 border-2 border-dashed border-gray-200 hover:border-[#EF534F] rounded-[24px] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-[#EF534F] group-hover:text-white transition-colors">
                                <Store className="w-7 h-7" />
                            </div>
                            <div className="text-center sm:text-left">
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#EF534F] transition-colors">
                                    ¿Buscas ofertas de otros usuarios?
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Explora el Marketplace para encontrar precios variados de nuestra comunidad.
                                </p>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <span className="inline-flex px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm group-hover:bg-[#EF534F] group-hover:text-white group-hover:border-[#EF534F] transition-all">
                                Ir al Marketplace
                            </span>
                        </div>
                    </div>
                </Link>
            </div>

            {/* FEATURES GRID */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-[#EF534F] mb-4">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">{feature}</h3>
                        <p className="text-sm text-gray-500">Incluido en tu suscripción oficial de LowSplit.</p>
                    </div>
                ))}
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
