import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Search, Check, ChevronDown, ChevronUp, LayoutGrid, Tv, Music, Bot, Monitor, BookOpen, GraduationCap, Sparkles, AlertCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Categorías
const categories = [
  { id: 'todo', name: 'Todo', icon: LayoutGrid },
  { id: 'streaming', name: 'SVOD', icon: Tv },
  { id: 'music', name: 'Music', icon: Music },
  { id: 'ai', name: 'AI', icon: Bot },
  { id: 'productivity', name: 'Productivity', icon: Monitor },
  { id: 'gaming', name: 'Gaming', icon: Monitor }, // Added gaming mapping
  { id: 'security', name: 'Security', icon: Monitor },
  { id: 'education', name: 'Education', icon: GraduationCap },
  { id: 'bundle', name: 'Bundle', icon: Sparkles },
]

import { getEmojiForSlug } from '../lib/utils'
import ServiceCard from '../components/ServiceCard'


const ExplorePage = () => {
  const [searchQuery, setSearchQuery] = useState('')
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

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          service.slug.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Map internal categories to filter IDs if needed, or simple direct match
    // Check if category name roughly matches or if 'todo'
    const matchesCategory = activeCategory === 'todo' || service.category === activeCategory
    
    return matchesSearch && matchesCategory
  })

  if (error) {
    return (
      <div className="min-h-screen pt-24 px-4 text-center text-red-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error al cargar servicios</h2>
        <p>{error.message}</p>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Explorar servicios - LowSplit</title>
        <meta name="description" content="Explora Netflix, Spotify, Disney+ y más. Encuentra suscripciones compartidas y ahorra hasta un 75%." />
      </Helmet>

      <div className="min-h-screen bg-[#FAFAFA] pt-[70px]">
        {/* Header */}
        <div className="bg-[#EF534F] py-12 sm:py-16">
          <div className="max-w-[1200px] mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Explora todos los servicios
            </h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto mb-8">
              Encuentra el servicio que quieres y ahorra hasta un 75% en tus suscripciones favoritas.
            </p>
            
            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar servicios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white rounded-full pl-12 pr-4 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeCategory === category.id
                      ? 'bg-[#EF534F] text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Results count */}
        <div className="max-w-[1200px] mx-auto px-4 mb-6">
          {isLoading ? (
             <p className="flex items-center gap-2 text-gray-500">
               <Loader2 className="w-4 h-4 animate-spin" /> Cargando servicios...
             </p>
          ) : (
            <p className="text-gray-600">
              {filteredServices.length} {filteredServices.length === 1 ? 'servicio encontrado' : 'servicios encontrados'}
            </p>
          )}
        </div>

        {/* Services grid */}
        {!isLoading && (
          <div className="max-w-[1200px] mx-auto px-4 pb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>

            {/* Empty state */}
            {filteredServices.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-600 text-lg mb-2">No se encontraron servicios</p>
                <p className="text-gray-400">Intenta con otra búsqueda o categoría</p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setActiveCategory('todo')
                  }}
                  className="mt-4 px-6 py-2 bg-[#EF534F] text-white rounded-full font-medium hover:opacity-90"
                >
                  Ver todos los servicios
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default ExplorePage
