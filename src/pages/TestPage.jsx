import React from 'react';
import { Search, Globe, Check, Zap, Lock, Clock, CreditCard, ChevronUp, ChevronDown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

// Assumed Local Assets
const ASSETS = {
  netflix: "http://localhost:3845/assets/2771b174ac8287bcbd92158e861efddb5fc94bb6.png",
  spotify: "http://localhost:3845/assets/a052f6902fa69d2392841c01376eae41a31bec5b.png", 
  disney: "http://localhost:3845/assets/e654c53ad5e54807cc24ea5dd82c67a60bbe59e1.svg", 
  hbo: "http://localhost:3845/assets/7abb1420874c0c31915e9e8d3b115d3b0b2f5c27.svg", 
  
  // Local Icons
  plusIcon: "/icon/Plus circle.svg", 

  // Footer Logs
  visa: "http://localhost:3845/assets/763e15f734fb95f381c174d3a5eea33f9a10b51c.png",
  mastercard: "http://localhost:3845/assets/f82f1a23e206f95fe046a0bdc9125e1a65026cce.png",
  applePay: "http://localhost:3845/assets/32713fb0a434ad2b23b2cbcf781f046ed1303a60.png",
};

const ServiceCard = ({ title, price, logo, features }) => (
  // CLUSTER: Width 323px, Flex Col, Gap 0 to join cards but allow visual rounding overlap
  <div className="w-[323px] shrink-0 flex flex-col items-center relative group filter drop-shadow-xl hover:-translate-y-2 transition-transform duration-300">
    
    {/* TARJETA SUPERIOR: White, Fully Rounded [20px] to match Bottom request */}
    <div className="w-full h-[273px] flex flex-col justify-end items-center bg-[#FAFAFA] rounded-[20px] relative z-10 overflow-hidden shadow-sm">
        <div className="mb-12 relative z-10">
             {logo ? <img src={logo} alt={title} className="h-16 object-contain" /> : <span className="text-3xl font-bold text-black">{title}</span>}
        </div>
        {/* Removed Curve SVG as full rounding implies detailed separation or snowman shape.
            If the user explicitly asked to round the 'top part' like the 'bottom part', standard full rounding is standard. */}
    </div>

    {/* PLUS ICON - Centered on the seam */}
    <div className="absolute top-[273px] z-30 transform -translate-y-1/2">
         <div className="w-[48px] h-[48px] bg-[#EF534F] rounded-full flex items-center justify-center p-0 border-[4px] border-white shadow-sm">
             <img src={ASSETS.plusIcon} alt="Add" className="w-5 h-5 hue-rotate-180 brightness-200 contrast-200 invert" />
         </div>
    </div>

    {/* TARJETA INFERIOR: Pink background, Red text, Fully Rounded [20px] */}
    {/* Negative margin to pull it up slightly if needed, or keeping them flush */}
    <div className="w-full -mt-4 rounded-[20px] bg-[#FEEDEC] relative z-0 text-[#EF534F] overflow-hidden pt-12 pb-4 px-5">
        
        {/* Price Section */}
        <div className="flex items-baseline justify-center mb-4">
            <span className="text-lg font-bold opacity-90">$</span>
            <span className="text-4xl font-bold mx-1 tracking-tight">{price}</span>
            <span className="text-xs font-medium opacity-80">/mes</span>
        </div>

        {/* Features List */}
        <ul className="space-y-2 mb-4 text-left w-full pl-2">
           <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-[#EF534F] flex-shrink-0 mt-0.5" strokeWidth={3} />
              <span className="text-[#EF534F] text-sm font-medium">Cuenta Premium 4K UHD</span>
           </li>
           <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-[#EF534F] flex-shrink-0 mt-0.5" strokeWidth={3} />
              <span className="text-[#EF534F] text-sm font-medium">Admite múltiples dispositivos</span>
           </li>
           <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-[#EF534F] flex-shrink-0 mt-0.5" strokeWidth={3} />
              <span className="text-[#EF534F] text-sm font-medium">Sin anuncios</span>
           </li>
        </ul>

        {/* Expand Toggle */}
        <button className="flex flex-col items-center w-full py-1 opacity-60 hover:opacity-100 transition-opacity mb-2">
            <ChevronUp className="w-4 h-4 text-[#EF534F] opacity-50 -mb-2" />
            <ChevronDown className="w-4 h-4 text-[#EF534F]" />
        </button>

        <button className="w-full bg-[#EF534F] text-white py-3 rounded-full font-bold text-sm shadow-sm hover:opacity-90 transition-opacity uppercase tracking-wide">
            Comprar ahora
        </button>
        <button className="text-[#EF534F] text-xs font-bold hover:opacity-80 mt-3 underline w-full">
            Revisar detalle
        </button>
    </div>
  </div>
);

const FeatureItem = ({ icon: Icon, title, desc }) => (
    <div className="flex items-start gap-4 p-4">
        <div className="bg-red-50 p-2 rounded-full text-[#EF534F]">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <h4 className="font-bold text-gray-800 text-sm mb-1">{title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
        </div>
    </div>
)

const TestPage = () => {
    
  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      <Helmet>
        <title>GamsGo Clone - Test</title>
      </Helmet>

      {/* --- HEADER SECTION --- */}
      <header className="bg-[#EF534F] text-white pt-4 pb-32 relative overflow-hidden">
        {/* Top Bar */}
        <div className="container mx-auto px-4 flex justify-between items-center text-xs mb-8">
            <div className="font-black text-lg tracking-wider">LOGO</div>
            <div className="flex items-center gap-6 font-medium">
                <a href="#" className="hover:opacity-80">PÁGINA DE INICIO</a>
                <a href="#" className="hover:opacity-80">SOPORTE POST-VENTA</a>
                <a href="#" className="hover:opacity-80">SUSCRIPCIÓN</a>
                <div className="flex items-center gap-3 ml-4">
                    <Search className="w-4 h-4 cursor-pointer" />
                    <div className="flex items-center gap-1 cursor-pointer">
                        <Globe className="w-4 h-4" />
                        <span>Español</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-4 text-center relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Comparta la suscripción premium más barato en GamsGo
            </h1>
            <p className="text-white/80 text-sm mb-12">
                Proporcionando streaming asequible y de alta calidad durante 6 años
            </p>

            {/* Category Icons */}
            <div className="flex justify-center gap-8 mb-8 overflow-x-auto pb-4">
                {[
                    {name: "TODO", icon: Z}, 
                    {name: "Svod", icon: Zap}, 
                    {name: "MUSIC", icon: Zap}, 
                    {name: "AI", icon: Zap},
                    {name: "Software", icon: Zap}
                ].map((cat, idx) => (
                    <div key={idx} className={`flex flex-col items-center gap-2 cursor-pointer ${idx === 0 ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                        <div className={`p-3 rounded-xl ${idx === 0 ? 'bg-white text-[#EF534F]' : 'border border-white/30 text-white'}`}>
                            {idx === 0 ? <Zap className="w-6 h-6" /> : <cat.icon className="w-5 h-5" />}  
                        </div>
                        <span className="text-[10px] font-bold uppercase">{cat.name}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Curved Divider */}
         <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
            <svg className="relative block w-full h-[60px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-[#EF534F]"></path>
            </svg> 
        </div>
      </header>

      {/* --- SERVICES GRID --- */}
      <section className="container mx-auto px-4 -mt-20 relative z-20 pb-20">
        <div className="flex flex-wrap justify-center gap-6">
            <ServiceCard title="Netflix" price="5.33" logo={ASSETS.netflix} />
            <ServiceCard title="Spotify" price="2.57" logo={ASSETS.spotify} />
            <ServiceCard title="Disney+" price="2.74" logo={ASSETS.disney} />
            <ServiceCard title="HBO Max" price="4.25" logo={ASSETS.hbo} />
        </div>
      </section>

      {/* --- WHY US SECTION --- */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-16 text-gray-900">
                ¿Por qué más y más personas usan GamsGo?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12 max-w-5xl mx-auto">
                <FeatureItem 
                    icon={Clock}
                    title="Entrega en tiempo real"
                    desc="Entrega en tiempo real después del pago sin esperas, llegada rápida para disipar sus preocupaciones."
                />
                <FeatureItem 
                    icon={Lock}
                    title="RESET RÁPIDO CONTRASEÑA"
                    desc="Haga clic en restablecer contraseña en la página de suscripción sin espera ni operación manual."
                />
                 <FeatureItem 
                    icon={Zap}
                    title="Entrega en tiempo real"
                    desc="Entrega en tiempo real después del pago sin esperas, llegada rápida para disipar sus preocupaciones."
                />
                 <FeatureItem 
                    icon={Zap}
                    title="Entrega en tiempo real"
                    desc="Entrega en tiempo real después del pago sin esperas, llegada rápida para disipar sus preocupaciones."
                />
            </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#1A202C] text-white py-16 text-sm">
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                <div>
                    <h4 className="font-bold mb-6 text-gray-400">ACERCA DE</h4>
                    <ul className="space-y-3 text-gray-300">
                        <li><a href="#">Sobre nosotros</a></li>
                        <li><a href="#">Contáctenos</a></li>
                        <li><a href="#">Programa de afiliados</a></li>
                    </ul>
                </div>
                <div>
                     <h4 className="font-bold mb-6 text-gray-400">LEGAL</h4>
                    <ul className="space-y-3 text-gray-300">
                        <li><a href="#">Términos y condiciones</a></li>
                        <li><a href="#">Política de privacidad</a></li>
                        <li><a href="#">Derechos de autor</a></li>
                    </ul>
                </div>
                 <div>
                     <h4 className="font-bold mb-6 text-gray-400">IDIOMA</h4>
                     <button className="flex items-center gap-2 bg-gray-700 px-4 py-2 rounded-full text-xs">
                        <Globe className="w-3 h-3" /> Español
                     </button>
                </div>
                 <div>
                     <h4 className="font-bold mb-6 text-gray-400">SERVICIO AL CLIENTE</h4>
                     <p className="text-gray-400 mb-4 text-xs">
                         Soporte 24 horas al día, 7 días a la semana.
                     </p>
                     <div className="flex gap-2">
                        {/* Payment Icons */}
                        <div className="w-10 h-6 bg-white rounded flex items-center justify-center"><CreditCard className="text-black w-4 h-4" /></div>
                        <div className="w-10 h-6 bg-white rounded flex items-center justify-center"><CreditCard className="text-black w-4 h-4" /></div>
                     </div>
                </div>
            </div>
            
            <div className="border-t border-gray-700 pt-8 flex flex-wrap justify-between items-center opacity-50">
                 <div className="flex gap-4">
                     <img src={ASSETS.visa} alt="Visa" className="h-8" />
                     <img src={ASSETS.mastercard} alt="Mastercard" className="h-8" />
                     <img src={ASSETS.applePay} alt="Apple Pay" className="h-8" />
                 </div>
            </div>
        </div>
      </footer>
    </div>
  );
};

// Helper for 'Z' icon (Quick hack if Lucide missing)
const Z = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm14.25 6a.75.75 0 0 1-.22.53l-2.25 2.25a.75.75 0 1 1-1.06-1.06L15.44 12l-1.72-1.72a.75.75 0 1 1 1.06-1.06l2.25 2.25c.141.14.22.331.22.53Zm-10.28-.53a.75.75 0 0 0 0 1.06l2.25 2.25a.75.75 0 1 0 1.06-1.06L7.56 12l1.72-1.72a.75.75 0 0 0-1.06-1.06l-2.25 2.25Z" clipRule="evenodd" />
    </svg>
)

export default TestPage;
