import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Check, ChevronLeft, Monitor, Smartphone, Laptop, Globe, Loader2, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

import { getEmojiForSlug, calculateSlotPrice } from '../lib/utils'

const ServiceDetailPage = () => {
  // id comes from the route /service/:id, but we are passing the slug there.
  const { id: slug } = useParams()
  
  // State for UI selections
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [selectedType, setSelectedType] = useState({ id: 1, name: '1 posición', description: 'Compartido', available: true })
  const [autoRenew, setAutoRenew] = useState(false)
  
  // Fetch specific service from Supabase
  const { data: service, isLoading, error } = useQuery({
    queryKey: ['service', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('slug', slug)
        .single()
      
      if (error) throw error
      return data
    }
  })

  // Dynamic Plans Calculation based on fetched service
  const plans = service ? (() => {
    // Calculate base monthly price per user
    const monthlyPrice = parseFloat(calculateSlotPrice(service.total_price, service.max_slots))
    
    return [
      { id: 1, months: 1, pricePerMonth: monthlyPrice * 1.1, totalPrice: monthlyPrice * 1.1 }, // 1 month tends to be more expensive
      { id: 2, months: 6, pricePerMonth: monthlyPrice, totalPrice: monthlyPrice * 6 },
      { id: 3, months: 12, pricePerMonth: monthlyPrice * 0.9, totalPrice: monthlyPrice * 12 * 0.9 }, // Yearly discount
    ]
  })() : []

  // Initialize selected plan once data is loaded
  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      setSelectedPlan(plans[1]) // Default to 6 months if available
    }
  }, [plans, selectedPlan])

  // Mock Recent Buyers (Client side only)
  const [currentBuyerIndex, setCurrentBuyerIndex] = useState(0)
  const recentBuyers = [
      { name: 'ma***is', time: 3 },
      { name: 'jo***an', time: 7 },
      { name: 'ca***os', time: 12 },
      { name: 'lu***na', time: 18 },
  ]
  const currentBuyer = recentBuyers[currentBuyerIndex]

  // Rotación de compradores recientes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBuyerIndex(prev => (prev + 1) % recentBuyers.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])


  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#EF534F]" />
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="min-h-screen pt-24 px-4 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl text-gray-600">Servicio no encontrado</h2>
        <Link to="/explore" className="mt-4 inline-block text-[#EF534F] underline">Volver a explorar</Link>
      </div>
    )
  }

  const logoEmoji = getEmojiForSlug(service.slug)
  const features = service.features || []
  const detailFeatures = service.features || [] // Reusing same features for now

  return (
    <>
      <Helmet>
        <title>{service.name} - LowSplit</title>
        <meta name="description" content={service.description} />
      </Helmet>

      <div className="min-h-screen bg-[#FAFAFA] pt-[50px]">
        {/* Header con back button */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-[1200px] mx-auto px-4 py-3">
            <Link to="/explore" className="inline-flex items-center gap-2 text-gray-600 hover:text-[#EF534F]">
              <ChevronLeft className="w-5 h-5" />
              <span>Volver al catálogo</span>
            </Link>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Columna izquierda - Cover e info */}
            <div className="lg:col-span-2">
              {/* Cover box */}
              <div className="bg-white rounded-[20px] overflow-hidden shadow-sm mb-6">
                <div className="relative h-[200px] sm:h-[280px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="flex items-center gap-4">
                    <span className="text-6xl sm:text-8xl">{logoEmoji}</span>
                    <span 
                      className="text-4xl sm:text-5xl font-bold"
                      style={{ color: service.color || '#333' }}
                    >
                      {service.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contenido / Opciones */}
              <div className="bg-white rounded-[20px] p-6 shadow-sm">
                {/* Nombre */}
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                  {service.name}
                </h1>

                {/* Meses de compra */}
                <div className="mb-6">
                  <h4 className="text-gray-700 font-medium mb-3">Meses de compra</h4>
                  <div className="flex gap-3 flex-wrap">
                    {plans.map(plan => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`px-6 py-3 rounded-full border-2 font-medium transition-all
                          ${selectedPlan?.id === plan.id 
                            ? 'border-[#EF534F] bg-[#EF534F]/5 text-[#EF534F]' 
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                      >
                        {plan.months} meses
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seleccionar tipo */}
                <div className="mb-6">
                  <h4 className="text-gray-700 font-medium mb-3">Seleccionar tipo</h4>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => setSelectedType({ id: 1, name: '1 posición' })}
                      className={`px-6 py-3 rounded-full border-2 font-medium transition-all
                        ${selectedType.id === 1
                          ? 'border-[#EF534F] bg-[#EF534F]/5 text-[#EF534F]' 
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                    >
                      1 posición <span className="text-sm opacity-70">(Compartido)</span>
                    </button>
                  </div>
                </div>

                {/* Auto renovación */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Activar Renovación automática</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Al seleccionar esto, aceptas la Política de pagos recurrentes
                      </div>
                    </div>
                    <button
                      onClick={() => setAutoRenew(!autoRenew)}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        autoRenew ? 'bg-[#EF534F]' : 'bg-gray-300'
                      }`}
                    >
                      <span 
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                          autoRenew ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-4 mb-6">
                  {features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-[#EF534F]" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Descripción */}
                <div className="text-gray-600 leading-relaxed">
                  {service.description}
                </div>
              </div>

              {/* Detalles adicionales */}
              <div className="bg-white rounded-[20px] p-6 shadow-sm mt-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Características incluidas</h3>
                <ul className="space-y-3">
                  {detailFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#EF534F] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Columna derecha - Precio y compra */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-[20px] p-6 shadow-sm sticky top-[70px]">
                {/* Precio */}
                {selectedPlan && (
                  <div className="border-b border-gray-100 pb-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Precio:</span>
                      <span className="font-bold text-gray-900">${selectedPlan.totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Código de promoción y cupón:</span>
                      <span className="font-bold text-gray-900">$0.00</span>
                    </div>
                  </div>
                )}

                {/* Total */}
                {selectedPlan && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-900">Total:</span>
                    <div className="text-right">
                      <div className="font-bold text-2xl text-gray-900">
                        ${selectedPlan.totalPrice.toFixed(2)}
                      </div>
                      <div className="text-[#EF534F] font-medium">
                        ${selectedPlan.pricePerMonth.toFixed(2)} / mes
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-100 my-4"></div>

                {/* Código promocional */}
                <button className="text-[#EF534F] underline text-sm mb-4 w-full text-left hover:opacity-80">
                  ¿Tiene un código promocional o cupón?
                </button>

                {/* Botón comprar */}
                <button 
                  className="w-full py-4 rounded-full text-white font-bold text-lg uppercase tracking-wide transition-opacity hover:opacity-90"
                  style={{ background: '#EF534F' }}
                >
                  Únete ahora
                </button>

                {/* Comprador reciente */}
                <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium">
                      {currentBuyer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600">
                      <b>{currentBuyer.name}</b> compró <b>{currentBuyer.time}</b> hace minutos
                    </div>
                  </div>
                </div>

                {/* Dispositivos compatibles */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h4 className="text-sm text-gray-500 mb-3">Dispositivos compatibles</h4>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <Smartphone className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500">Mobile</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Laptop className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500">PC</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Monitor className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500">Mac</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Globe className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500">Web</span>
                    </div>
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
