import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import ServiceCard from '../components/ServiceCard'
import { 
  LayoutGrid,
  Tv,
  Music,
  Bot,
  Monitor,
  BookOpen,
  GraduationCap,
  Sparkles,
  Clock,
  Key,
  Headphones,
  Shield,
  BadgeCheck,
  CreditCard,
  Loader2
} from 'lucide-react'

// Categorías
const categories = [
  { id: 'todo', name: 'Todo', icon: LayoutGrid },
  { id: 'streaming', name: 'SVOD', icon: Tv },
  { id: 'music', name: 'Music', icon: Music },
  { id: 'ai', name: 'AI', icon: Bot },
  { id: 'productivity', name: 'Productivity', icon: Monitor }, // Software mapped to productivity
  { id: 'gaming', name: 'Gaming', icon: Monitor },
  { id: 'education', name: 'Education', icon: GraduationCap },
  { id: 'bundle', name: 'Bundle', icon: Sparkles },
]

// Beneficios
const benefits = [
  { title: 'Entrega en tiempo real', description: 'Entrega en tiempo real después del pago sin esperas, llegada rápida para disipar sus preocupaciones', icon: Clock },
  { title: 'RESET RÁPIDO CONTRASEÑA', description: 'Haga clic en restablecer contraseña en la página de suscripción sin espera ni operación manual', icon: Key },
  { title: 'Soporte 24/7', description: 'Nuestro equipo está disponible las 24 horas para ayudarte con cualquier problema', icon: Headphones },
  { title: 'Pagos seguros', description: 'Transacciones cifradas y protegidas con los más altos estándares de seguridad', icon: Shield },
  { title: 'Cuentas verificadas', description: 'Todas las cuentas pasan por un proceso de verificación antes de ser listadas', icon: BadgeCheck },
  { title: 'Múltiples pagos', description: 'Acepta Visa, Mastercard, Stripe, Apple Pay y más métodos de pago', icon: CreditCard },
]

// Benefit Card
const BenefitCard = ({ title, description, icon: Icon }) => (
  <div className="flex items-start gap-3 p-6 bg-white rounded-[20px] w-full" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white" style={{ boxShadow: '-5px 6px 8.7px rgba(0, 0, 0, 0.07)' }}>
      <Icon className="w-5 h-5 text-[#EF534F]" />
    </div>
    <div className="flex flex-col gap-1">
      <h3 className="text-black text-base font-bold">{title}</h3>
      <p className="text-black/70 text-sm font-normal leading-relaxed">{description}</p>
    </div>
  </div>
)

const HomePage = () => {
  const [activeCategory, setActiveCategory] = useState('todo')
  
  // Fetch services from Supabase
  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
      
      if (error) throw error
      return data
    }
  })
  
  const filteredServices = services.filter(service => {
    if (activeCategory === 'todo') return true
    
    // Simple category matching
    // Note: Database uses 'streaming', 'music', etc.
    // Ensure categories array IDs match DB values or map them
    // 'svod' in UI map to 'streaming' in DB?
    if (activeCategory === 'svod' && service.category === 'streaming') return true
    if (activeCategory === 'software' && service.category === 'productivity') return true
    if (activeCategory === 'learning' && service.category === 'education') return true
    
    return service.category === activeCategory
  })

  return (
    <>
      <Helmet>
        <title>LowSplit - Comparte suscripciones y ahorra hasta 75%</title>
        <meta name="description" content="Comparte Netflix, Spotify, Disney+ y más. Ahorra hasta un 75%." />
      </Helmet>

      {/* Hero Section */}
      <section style={{ background: '#EF534F' }} className="pt-0">
        <div className="max-w-[1440px] mx-auto px-4 py-12">
          <div className="flex flex-col items-center gap-2 max-w-[1000px] mx-auto text-center mb-8">
            <h1 className="text-white font-medium text-2xl sm:text-3xl lg:text-[32px]">
              Comparta la suscripción premium más barato en LowSplit
            </h1>
            <p className="text-white/90 font-medium text-sm sm:text-base">
              Proporcionando streaming asequible y de alta calidad durante 6 años
            </p>
          </div>
          
          {/* Categories */}
          <div className="flex justify-center items-center gap-3 sm:gap-4 flex-wrap max-w-[1000px] mx-auto">
            {categories.map((cat) => {
              const IconComponent = cat.icon
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-[80px] sm:w-[100px] h-[60px] sm:h-[66px] rounded-[10px] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all
                    ${isActive ? 'bg-white scale-105' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  <IconComponent className={`w-6 h-6 sm:w-8 sm:h-8 ${isActive ? 'text-[#EF534F]' : 'text-white'}`} />
                  <span className={`text-[10px] sm:text-xs font-extrabold uppercase ${isActive ? 'text-[#EF534F]' : 'text-white'}`}>
                    {cat.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Service Cards */}
      <section className="bg-[#FAFAFA] relative">
        <div className="absolute left-0 right-0 top-0 h-[80px]" style={{ background: '#EF534F' }} />
        
        <div className="relative max-w-[1366px] mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#EF534F]" />
            </div>
          ) : error ? (
            <div className="text-center py-16 text-white">
              <p>Error al cargar servicios.</p>
            </div>
          ) : filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No hay servicios en esta categoría.</p>
            </div>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white py-12">
        <div className="max-w-[1366px] mx-auto px-4 flex flex-col items-center gap-8">
          <h2 className="text-black font-bold text-2xl sm:text-[32px] text-center">
            ¿Por qué más y más personas usan LowSplit?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
            {benefits.map((benefit, index) => (
              <BenefitCard key={index} {...benefit} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default HomePage
