import { Link, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useState, useEffect } from 'react'
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
  Loader2,
  Users
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
  { id: 'marketplace', name: 'Marketplace', icon: Users },
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
  <div className="flex items-start gap-3 p-6 bg-white rounded-2xl w-full" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white" style={{ boxShadow: '-5px 6px 8.7px rgba(0, 0, 0, 0.07)' }}>
      <Icon className="w-5 h-5 text-primary-500" />
    </div>
    <div className="flex flex-col gap-1">
      <h3 className="text-black text-base font-bold">{title}</h3>
      <p className="text-black/70 text-sm font-normal leading-relaxed">{description}</p>
    </div>
  </div>
)

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category_id') || 'todo'
  
  // Handler for category change
  const handleCategoryChange = (categoryId) => {
    if (categoryId === 'todo') {
       searchParams.delete('category_id')
       setSearchParams(searchParams)
    } else {
       setSearchParams({ category_id: categoryId })
    }
  }

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
    
    // Marketplace logic: Currently showing all or could filter by specific criteria
    // For now, if 'marketplace' is selected, we might want to show everything or a dedicated list.
    // Given the user request "marketplace donde deberian de estar las que ofrecen los usuario", 
    // we ideally would filter for "user generated" services/groups.
    // As a placeholder for "Marketplace", we'll just return true or filter by a 'marketplace' category if it existed.
    // Let's assume for now it filters nothing (behaves like 'todo') or we can refine logic later.
    if (activeCategory === 'marketplace') return true 

    // Simple category matching
    // Note: Database uses 'streaming', 'music', etc.
    // Ensure categories array IDs match DB values or map them
    // 'svod' in UI map to 'streaming' in DB?
    // Note: The UI category ID for 'streaming' is 'streaming' in the categories array above, but label is SVOD.
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
      <section className="bg-primary-500 pt-24 pb-6">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex flex-col items-center gap-2 max-w-[1000px] mx-auto text-center">
            <h1 className="text-white font-medium text-2xl sm:text-3xl lg:text-[32px]">
              Comparta la suscripción premium más barato en LowSplit
            </h1>
            <p className="text-white/90 font-medium text-sm sm:text-base">
              Proporcionando streaming asequible y de alta calidad durante 6 años
            </p>
          </div>
        </div>
      </section>
      
      {/* Categories - Sticky Bar */}
      <div className="sticky top-[64px] z-40 pb-4 pt-2 shadow-sm transition-all bg-primary-500">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="w-full overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 sm:gap-4 md:justify-center min-w-max px-2">
            {categories.map((cat) => {
              const IconComponent = cat.icon
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`w-[80px] sm:w-[100px] h-[60px] sm:h-[66px] rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all flex-shrink-0
                    ${isActive ? 'bg-white scale-105 shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  <IconComponent className={`w-6 h-6 sm:w-8 sm:h-8 ${isActive ? 'text-primary-500' : 'text-white'}`} />
                  <span className={`text-[10px] sm:text-xs font-extrabold uppercase ${isActive ? 'text-primary-500' : 'text-white'}`}>
                    {cat.name}
                  </span>
                </button>
              )
            })}
            </div>
          </div>
        </div>
      </div>

      {/* Service Cards */}
      <section className="bg-[#FAFAFA] relative">
        <div className="absolute left-0 right-0 top-0 h-[80px] bg-primary-500" />
        
        <div className="relative max-w-[1366px] mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : error ? (
            <div className="text-center py-16 text-white">
              <p>Error al cargar servicios.</p>
            </div>
          ) : filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
              {filteredServices.map((service) => (
                <ServiceCard 
                  key={service.id} 
                  service={service} 
                  customLink={activeCategory === 'marketplace' ? `/marketplace/list/${service.slug}` : null}
                />
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
