import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { getEmojiForSlug, calculateSlotPrice, getLogoUrl, getDefaultFeatures } from '../lib/utils'

const ServiceCard = ({ service }) => {
  const [expanded, setExpanded] = useState(false)
  const [recentData, setRecentData] = useState({ buyer: 'user123', time: 5 })
  
  // Calcular precio por slot
  const pricePerSlot = calculateSlotPrice(service.total_price, service.max_slots)

  // Generate random buyer data only on mount
  useEffect(() => {
    setRecentData({
      buyer: 'user' + Math.floor(Math.random() * 999),
      time: Math.floor(Math.random() * 30) + 1
    })
  }, [])
  
  const logoEmoji = getEmojiForSlug(service.slug)
  const features = service.features || getDefaultFeatures(service.category)

  const logoUrl = getLogoUrl(service.slug, service.icon_url, 'full')

  return (
    <div className="spu-card-wrapper w-full h-full">
      <Link to={`/service/${service.slug}`} className="block h-full draggable-false group">
        <div className="flex flex-col h-full rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-[#fdf2f2]">
            
            {/* 1. TOP & MIDDLE WRAPPER (White Logo + Red Price) */}
            <div className="bg-white">
                {/* TOP BOX: Logo */}
                <div className="spu-card-top-box relative h-[120px] flex items-center justify-center bg-white z-10">
                    {logoUrl ? (
                         <img className="spu-logo h-12 w-auto max-w-[80%] object-contain z-10 transition-transform group-hover:scale-110" src={logoUrl} alt={service.name} loading="lazy" />
                    ) : (
                        <span className="text-6xl z-10">{logoEmoji}</span>
                    )}
                    
                    {/* Radian Div - The curve connector */}
                    <div 
                        className="spu-card-radian absolute bottom-0 left-0 right-0 h-[25px] z-0" 
                        style={{
                            background: '#EF534F',
                            borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
                            transform: 'scaleX(1.3)', 
                            bottom: '-1px'
                        }}
                    ></div>
                </div>

                {/* MIDDLE BOX: Price & Social Proof */}
                <div className="spu-card-bottom-box text-center pb-6 pt-2" style={{ background: '#EF534F' }}>
                    
                    {/* Buy Message */}
                    <div className="spu-buy-message mb-3 flex justify-center">
                         <div className="inline-block bg-black/10 rounded-full px-3 py-1 text-white text-[11px] font-medium">
                            <b>{recentData.buyer}</b> compró <b>1</b> hace {recentData.time} días
                        </div>
                    </div>

                    {/* Price */}
                    <div className="spu-price text-white font-bold mb-0 leading-none flex items-start justify-center gap-0.5">
                        <span className="text-xl mt-1">€</span>
                        <span className="text-[42px]">{pricePerSlot}</span>
                    </div>

                    <div className="spu-duration text-white/90 text-sm">
                        / mes
                    </div>
                </div>
            </div>

            {/* 2. BOTTOM WRAPPER (Features & Button) - Pinkish/White */}
            <div className="spu-intro-box flex-grow flex flex-col p-4 bg-[#fdf2f2] relative">
                 {/* Decorative curve from red to pink if needed, but usually flat here based on new image */}
                 
                 {/* Features List */}
                 <div className="space-y-2 mb-4 flex-grow">
                    {features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-start gap-2 max-w-[90%] mx-auto">
                            <Check className="w-3.5 h-3.5 text-[#EF534F] flex-shrink-0 mt-0.5" strokeWidth={3} />
                            <span className="text-[#EF534F] text-xs text-left leading-tight font-medium">{feature}</span>
                        </div>
                    ))}
                 </div>

                 {/* Button */}
                 <div className="mt-auto">
                    <button 
                        className="w-full py-2.5 rounded-full text-white font-bold text-sm uppercase tracking-wider transition-all hover:opacity-90 hover:scale-[1.02] shadow-sm"
                        style={{ background: '#EF534F' }}
                    >
                        Comprar Ahora
                    </button>
                    
                    <div className="text-center mt-2">
                         <span className="text-[#EF534F] text-xs font-bold underline cursor-pointer hover:opacity-80">
                            Revisar detalles
                         </span>
                    </div>
                 </div>
            </div>

        </div>
      </Link>
    </div>
  )
}

export default ServiceCard
