import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Lock, CheckCircle, Search, Plus, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getLogoUrl } from '../lib/utils'

const ShareSubscriptionPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState(null)
  const [session, setSession] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  
  // Form State
  const [formData, setFormData] = useState({
    slots: 1,
    price: '',
    email: '',
    password: '',
    notes: ''
  })

  // Filter services for selection
  const [searchTerm, setSearchTerm] = useState('')
  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Fetch session and services on mount
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      
      if (!session) {
        navigate('/login')
        return
      }

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        setError('Error cargando servicios')
        console.error(error)
      } else {
        setServices(data || [])
      }
      setLoading(false)
    }
    init()
  }, [navigate])

  const handleServiceSelect = (service) => {
    setSelectedService(service)
    setFormData(prev => ({
      ...prev,
      price: (service.total_price / service.max_slots * 1.2).toFixed(2)
    }))
    setStep(2)
  }

  const handleSubmit = async () => {
    if (!session || !selectedService) return
    
    setSubmitting(true)
    setError(null)

    try {
      // Build credentials string (in production: encrypt this!)
      const credentials = `Email: ${formData.email} | Password: ${formData.password}`

      const { error: insertError } = await supabase
        .from('subscription_groups')
        .insert({
          service_id: selectedService.id,
          admin_id: session.user.id,
          status: 'available',
          title: `${selectedService.name} - Compartido`,
          // access_credentials: credentials, // REMOVED - using specific columns now
          credentials_login: formData.email,
          credentials_password: formData.password,
          slots_occupied: 1, // Admin takes 1 slot
          price_per_slot: parseFloat(formData.price),
          next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days
        })

      if (insertError) throw insertError

      setStep(3)
    } catch (err) {
      console.error('Error creating group:', err)
      setError(err.message || 'Error al crear el grupo')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex justify-center items-center bg-[#FAFAFA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#EF534F]" />
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Compartir Suscripción - LowSplit</title>
      </Helmet>

      <div className="min-h-screen bg-[#FAFAFA] pt-[70px] pb-12">
        <div className="max-w-3xl mx-auto px-4">
          
          {/* Header */}
          <div className="text-center py-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Comparte y Ahorra</h1>
            <p className="text-gray-500">Convierte tus gastos mensuales en ingresos compartiendo tus cuentas.</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Stepper */}
          <div className="flex items-center justify-center gap-4 mb-10">
             {[1, 2, 3].map(s => (
                <div key={s} className={`flex items-center gap-2 ${step >= s ? 'text-[#EF534F]' : 'text-gray-300'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2
                        ${step >= s ? 'border-[#EF534F] bg-[#EF534F]/10' : 'border-gray-200 bg-white'}
                    `}>
                        {s}
                    </div>
                </div>
             ))}
          </div>

          <div className="bg-white rounded-[24px] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            
            {/* Step 1: Select Service */}
            {step === 1 && (
                <div className="p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Elige el servicio que tienes</h2>
                    
                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar servicio (Netflix, Spotify...)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 rounded-xl pl-12 pr-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-[#EF534F]/20"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredServices.map(service => (
                            <button
                                key={service.id}
                                onClick={() => handleServiceSelect(service)}
                                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-[#EF534F] hover:bg-[#fff5f5] transition-all group text-left"
                            >
                                <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center border border-gray-100 overflow-hidden relative">
                                    <img src={getLogoUrl(service.slug)} alt={service.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-[#EF534F] transition-colors">{service.name}</h3>
                                    <span className="text-xs text-gray-500">{service.category}</span>
                                </div>
                                <Plus className="w-5 h-5 text-gray-300 ml-auto group-hover:text-[#EF534F]" />
                            </button>
                        ))}

                        {filteredServices.length === 0 && (
                            <p className="col-span-2 text-center text-gray-400 py-10">No se encontraron servicios</p>
                        )}
                    </div>
                </div>
            )}

            {/* Step 2: Configuration */}
            {step === 2 && selectedService && (
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                             <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center border border-gray-100 overflow-hidden relative">
                                <img src={getLogoUrl(selectedService.slug)} alt={selectedService.name} className="w-full h-full object-cover" />
                             </div>
                             <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedService.name}</h2>
                                <button onClick={() => setStep(1)} className="text-sm text-[#EF534F] hover:underline">Cambiar servicio</button>
                             </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Slots */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">¿Cuántos perfiles libres tienes?</label>
                            <div className="flex gap-3">
                                {[1, 2, 3, 4].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setFormData({...formData, slots: num})}
                                        className={`w-12 h-12 rounded-xl font-bold text-lg border-2 transition-all
                                        ${formData.slots === num 
                                            ? 'border-[#EF534F] bg-[#EF534F] text-white' 
                                            : 'border-gray-200 text-gray-500 hover:border-[#EF534F]'
                                        }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Precio por perfil (mensual)</label>
                            <div className="relative max-w-[200px]">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">€</span>
                                <input 
                                    type="number" 
                                    value={formData.price}
                                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                                    className="w-full bg-gray-50 rounded-xl pl-8 pr-4 py-3 font-bold text-gray-900 border-2 border-transparent focus:border-[#EF534F] focus:bg-white transition-all outline-none"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Recomendado: €{(selectedService.total_price / selectedService.max_slots).toFixed(2)} - €{(selectedService.total_price / selectedService.max_slots * 1.3).toFixed(2)}</p>
                        </div>

                        {/* Credentials */}
                        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                             <div className="flex items-center gap-2 mb-3">
                                <Lock className="w-4 h-4 text-yellow-600" />
                                <h3 className="font-bold text-yellow-800 text-sm">Credenciales de Acceso</h3>
                             </div>
                             <p className="text-xs text-yellow-700/80 mb-4">
                                Éstas se compartirán SOLO con los usuarios que paguen. Se almacenan encriptadas de extremo a extremo.
                             </p>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input 
                                    type="email" 
                                    placeholder="Email de la cuenta"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full bg-white rounded-lg px-4 py-2 text-sm border border-yellow-200 focus:border-yellow-400 outline-none"
                                />
                                <input 
                                    type="text" 
                                    placeholder="Contraseña / PIN"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="w-full bg-white rounded-lg px-4 py-2 text-sm border border-yellow-200 focus:border-yellow-400 outline-none"
                                />
                             </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                        <button 
                            onClick={handleSubmit}
                            disabled={submitting || !formData.email || !formData.password}
                            className="bg-[#EF534F] text-white px-8 py-3 rounded-full font-bold hover:shadow-lg hover:shadow-red-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                            {submitting ? 'Creando...' : 'Crear Grupo'}
                        </button>
                    </div>
                </div>
            )}

             {/* Step 3: Success */}
             {step === 3 && (
                <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">¡Grupo Creado!</h2>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                        Tu grupo de <b>{selectedService?.name}</b> está activo. Te notificaremos cuando alguien compre un perfil y recibirás el pago.
                    </p>
                    <button 
                      onClick={() => navigate('/dashboard?tab=sales')}
                      className="bg-gray-900 text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all"
                    >
                        Ir a mi Dashboard
                    </button>
                </div>
             )}

          </div>
        </div>
      </div>
    </>
  )
}

export default ShareSubscriptionPage
