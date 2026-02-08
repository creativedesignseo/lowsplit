import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left'
import Monitor from 'lucide-react/dist/esm/icons/monitor'
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check'
import Zap from 'lucide-react/dist/esm/icons/zap'
import User from 'lucide-react/dist/esm/icons/user'
import Check from 'lucide-react/dist/esm/icons/check'
import Store from 'lucide-react/dist/esm/icons/store'
import Loader2 from 'lucide-react/dist/esm/icons/loader-2'
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getLogoUrl, getEmojiForSlug, calculateSlotPrice } from '../lib/utils'

const MarketplaceListPage = () => {
  const { id: slug } = useParams()
  const navigate = useNavigate()

  // Filters State
  const [filters, setFilters] = useState({
      verified: false,
      instant: false,
      sortBy: 'price'
  })

  // Fetch Service Details
  const { data: service, isLoading: isLoadingService, error: errorService } = useQuery({
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
              console.warn("Could not fetch groups:", error)
              return [] 
          }
          
          // Client-side sorting
          let sortedData = data || []
          if (filters.sortBy === 'price') sortedData.sort((a, b) => a.price_per_slot - b.price_per_slot)
          if (filters.sortBy === 'reputation') sortedData.sort((a, b) => (b.admin?.reputation_score || 0) - (a.admin?.reputation_score || 0))

          return sortedData
      }
  })

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

  return (
    <>
      <Helmet>
        <title>{service.name} (Marketplace) - LowSplit</title>
        <meta name="description" content={`Encuentra grupos para compartir ${service.name} en el Marketplace de LowSplit.`} />
      </Helmet>

      <div className="min-h-screen bg-[#FAFAFA] pt-[70px]">
        {/* Header con back button */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-[1100px] mx-auto px-4 py-4 flex justify-between items-center">
            <Link to={`/service/${slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#EF534F] transition-colors">
              <ChevronLeft className="w-4 h-4" />
              <span>Volver a {service.name} Oficial</span>
            </Link>
          </div>
        </div>

        <div className="max-w-[1240px] mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
            
            {/* SIDEBAR FILTERS */}
            <div className="w-full lg:w-[320px] flex-shrink-0 space-y-6">
                
                {/* Intro Card */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 to-purple-500"></div>
                    <div className="w-16 h-16 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3 overflow-hidden">
                        {logoUrl ? (
                            <img src={logoUrl} alt={service.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl">{getEmojiForSlug(service.slug)}</span>
                        )}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-2">
                        <Store className="w-3 h-3" /> Marketplace
                    </div>
                    <h1 className="text-xl font-black text-gray-900 mb-2">{service.name}</h1>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        Explora ofertas de la comunidad. Precios competitivos y variedad de opciones.
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-gray-400" /> 
                        Filtros
                    </h3>

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
                             <button 
                                onClick={() => setFilters(prev => ({ ...prev, sortBy: 'reputation' }))}
                                className={`w-full flex items-center justify-between p-2 rounded-xl text-sm font-medium transition-colors ${filters.sortBy === 'reputation' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                             >
                                <span>Índice de confianza</span>
                                {filters.sortBy === 'reputation' && <Check className="w-4 h-4 text-gray-400" />}
                             </button>
                             <button 
                                onClick={() => setFilters(prev => ({ ...prev, sortBy: 'price' }))}
                                className={`w-full flex items-center justify-between p-2 rounded-xl text-sm font-medium transition-colors ${filters.sortBy === 'price' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                             >
                                <span>Precio más bajo</span>
                                {filters.sortBy === 'price' && <Check className="w-4 h-4 text-gray-400" />}
                             </button>
                        </div>
                    </div>
                </div>

                {/* Go Back to Official */}
                <Link to={`/service/${slug}`} className="block">
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-[20px] p-5 border border-red-100 hover:border-red-200 transition-colors text-center">
                        <h4 className="font-bold text-gray-900 mb-1">¿Prefieres lo oficial?</h4>
                        <p className="text-xs text-gray-600 mb-3">Garantía total y soporte 24/7 directo de LowSplit.</p>
                        <span className="inline-block px-4 py-2 bg-white text-[#EF534F] text-xs font-bold rounded-lg shadow-sm">
                            Ver Oferta Oficial
                        </span>
                    </div>
                </Link>

            </div>

            {/* MAIN LIST: Available Groups */}
            <div className="flex-1 space-y-4">
                
                <div className="flex items-center justify-between mb-2 px-2">
                    <h2 className="font-bold text-gray-900">
                        {groups?.length || 0} Ofertas disponibles
                    </h2>
                </div>

                {/* User Groups List */}
                {groups && groups.length > 0 ? (
                    groups.map((group) => (
                    <div key={group.id} className="bg-white rounded-[20px] p-3 sm:p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 group hover:border-blue-200 hover:shadow-md transition-all">
                        
                        {/* User Info */}
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-shrink-0">
                                {/* Dynamic Gradient Border based on score */}
                                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full p-[2px] ${
                                    (group.admin?.reputation_score || 0) >= 90 ? 'bg-gradient-to-tr from-blue-400 to-cyan-300' :
                                    (group.admin?.reputation_score || 0) >= 70 ? 'bg-gradient-to-tr from-pink-500 to-purple-400' :
                                    'bg-gray-100'
                                }`}>
                                    <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden">
                                        {group.admin?.avatar_url ? (
                                            <img src={group.admin.avatar_url} alt={group.admin.full_name} className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                                <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Score Badge */}
                                {group.admin?.reputation_score && (
                                    <div className={`absolute -bottom-1 -right-1 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white ${
                                        group.admin.reputation_score >= 90 ? 'bg-cyan-500' : 'bg-pink-500'
                                    }`}>
                                        {group.admin.reputation_score}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-1.5 truncate">
                                    {group.admin?.full_name || 'Usuario'}
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${group.invoice_verified ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                </h3>
                                
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {group.invoice_verified && (
                                        <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] uppercase tracking-wide border border-green-100">
                                            <Check className="w-2.5 h-2.5" strokeWidth={4} /> Factura OK
                                        </div>
                                    )}
                                    {group.instant_acceptance && (
                                        <div className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] uppercase tracking-wide border border-yellow-100">
                                            <Zap className="w-2.5 h-2.5" fill="currentColor" /> Auto
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Spacer */}
                        <div className="hidden sm:block flex-1"></div>

                        {/* Price & Action */}
                        <div className="flex items-center justify-between w-full sm:w-auto gap-4 pl-0 sm:pl-8 border-t sm:border-0 border-gray-50 pt-3 sm:pt-0">
                             <div className="text-right">
                                <div className="text-xl sm:text-2xl font-black text-gray-900">
                                    €{group.price_per_slot.toFixed(2)}
                                </div>
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block -mt-1">/mes</span>
                             </div>
                             <Link to={`/group/${group.id}`} className="bg-white border-2 border-gray-100 hover:border-gray-900 text-gray-900 px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap">
                                Ver
                             </Link>
                        </div>
                    </div>
                ))
               ) : (
                <div className="text-center py-12 bg-white rounded-[24px] border border-gray-100 border-dashed">
                    <p className="text-gray-400 mb-2">No se encontraron grupos con estos filtros.</p>
                    <button 
                        onClick={() => setFilters({ verified: false, instant: false, sortBy: 'price' })}
                        className="text-[#EF534F] text-sm font-bold hover:underline"
                    >
                        Ver todos los grupos
                    </button>
                    <div className="mt-8">
                         <h4 className="text-sm font-bold text-gray-900 mb-2">¿Quieres crear tu propio grupo?</h4>
                         <Link to="/create-group" className="inline-block px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium">
                            Compartir mi suscripción
                         </Link>
                    </div>
                </div>
               )}

            </div>
            
            </div>
        </div>
      </div>
    </>
  )
}

export default MarketplaceListPage
