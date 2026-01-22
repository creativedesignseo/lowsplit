import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { getEmojiForSlug, calculateSlotPrice } from '../lib/utils'

const ServiceCard = ({ service }) => {
  const [expanded, setExpanded] = useState(false)
  const [recentData, setRecentData] = useState({ buyer: 'user123', time: 5 })
  
  // Calcular precio por slot
  const pricePerSlot = calculateSlotPrice(service.total_price, service.max_slots)

  // Generate random buyer data only on mount to avoid hydration mismatch if SSR (though this is SPA)
  // or simple random per render might be jittery.
  useEffect(() => {
    setRecentData({
      buyer: 'user' + Math.floor(Math.random() * 999),
      time: Math.floor(Math.random() * 30) + 1
    })
  }, [])
  
  const logoEmoji = getEmojiForSlug(service.slug)
  const features = service.features || []

  return (
    <div className="spu-card-wrapper w-full max-w-[323px] flex flex-col h-full mx-auto">
      {/* Card principal con link */}
      <Link to={`/service/${service.slug}`} className="block flex-grow">
        <div className="spu-card-box rounded-[20px] overflow-hidden flex flex-col h-full">
          {/* TOP BOX - Logo en fondo blanco */}
          <div 
            className="spu-card-top-box relative bg-white flex items-center justify-center"
            style={{ height: '140px' }}
          >
            {/* Logo */}
            <div className="flex items-center gap-3">
              <span className="text-4xl">{logoEmoji}</span>
              <span 
                className="text-2xl font-bold"
                style={{ color: service.color || '#333' }}
              >
                {service.name}
              </span>
            </div>
            
            {/* Curva SVG */}
            <div className="absolute bottom-0 left-0 right-0">
              <svg 
                viewBox="0 0 323 40" 
                className="w-full h-[40px]"
                preserveAspectRatio="none"
              >
                <path 
                  d="M0,40 L0,20 Q161.5,0 323,20 L323,40 Z" 
                  fill="#EF534F"
                />
              </svg>
            </div>
          </div>
          
          {/* BOTTOM BOX - Precio en coral */}
          <div 
            className="spu-card-bottom-box text-center px-4 pb-4"
            style={{ background: '#EF534F' }}
          >
            {/* Mensaje de compra reciente */}
            <div className="spu-buy-message text-white/90 text-sm py-2">
              <b>{recentData.buyer}</b> compró hace <b>{recentData.time}</b> min
            </div>
            
            {/* Precio */}
            <div className="spu-price text-white">
              <span className="text-2xl align-top">$</span>
              <span className="text-5xl font-bold">{pricePerSlot}</span>
            </div>
            
            {/* Duración */}
            <div className="spu-duration text-white/80 text-sm">
              / mes
            </div>
          </div>
        </div>
      </Link>
      
      {/* INTRO BOX - Features */}
      <div 
        className="spu-intro-box rounded-b-[20px] -mt-1"
        style={{ background: '#FEEDEC' }}
      >
        <div className="spu-intro-bg-box px-5 py-4">
          {/* Lista de features */}
          <ul className="space-y-2 mb-3 min-h-[80px]">
            {features.slice(0, expanded ? undefined : 3).map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#EF534F] flex-shrink-0 mt-0.5" strokeWidth={3} />
                <span className="text-[#EF534F] text-sm leading-tight text-left">{feature}</span>
              </li>
            ))}
          </ul>
          
          {/* Ver más/menos */}
          {features.length > 3 && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="view-more-box flex flex-col items-center w-full py-1 hover:bg-red-50/50 rounded-lg transition-colors"
            >
              <ChevronUp 
                className={`w-4 h-4 text-[#EF534F] transition-opacity ${expanded ? 'opacity-100' : 'opacity-30'}`} 
              />
              <ChevronDown 
                className={`w-4 h-4 text-[#EF534F] transition-opacity ${expanded ? 'opacity-30' : 'opacity-100'}`} 
              />
            </button>
          )}
          
          {/* Botón Comprar */}
          <Link to={`/service/${service.slug}`}>
            <button 
              className="spu-btn w-full py-3 rounded-full text-white font-bold uppercase tracking-wide transition-opacity hover:opacity-90 mt-2"
              style={{ background: '#EF534F' }}
            >
              Comprar Ahora
            </button>
          </Link>
          
          {/* Link revisar detalles */}
          <Link 
            to={`/service/${service.slug}`}
            className="block text-center text-[#EF534F] font-bold text-sm mt-3 underline hover:opacity-80"
          >
            Revisar detalles
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ServiceCard
