import { Link } from 'react-router-dom'
import { Globe } from 'lucide-react'

const Footer = () => {
  return (
    <footer>
      {/* Main Footer - #1D2A36 */}
      <div 
        className="overflow-hidden flex justify-center items-center"
        style={{ 
          background: '#1D2A36',
          paddingTop: '20px',
          paddingBottom: '20px',
          minHeight: '400px'
        }}
      >
        <div 
          className="flex justify-between items-start"
          style={{ width: '1366px', height: '200px' }}
        >
          {/* Acerca de */}
          <div 
            className="flex flex-col gap-3 p-2.5"
            style={{ width: '180px', height: '200px' }}
          >
            <span className="text-white text-sm font-bold" style={{ fontFamily: 'Inter' }}>
              ACERCA DE
            </span>
            <Link to="/about" className="text-white text-sm font-normal hover:underline" style={{ fontFamily: 'Inter' }}>
              Sobre nosotros
            </Link>
            <Link to="/contact" className="text-white text-sm font-normal hover:underline" style={{ fontFamily: 'Inter' }}>
              Contáctenos
            </Link>
            <Link to="/affiliates" className="text-white text-sm font-normal hover:underline" style={{ fontFamily: 'Inter' }}>
              Programa de afiliados
            </Link>
            <Link to="/suggest" className="text-white text-sm font-normal hover:underline" style={{ fontFamily: 'Inter' }}>
              Sugerir una suscripción
            </Link>
          </div>

          {/* Legal */}
          <div 
            className="flex flex-col gap-3 p-2.5"
            style={{ width: '180px', height: '200px' }}
          >
            <span className="text-white text-sm font-bold" style={{ fontFamily: 'Inter' }}>
              LEGAL
            </span>
            <Link to="/terms" className="text-white text-sm font-normal hover:underline" style={{ fontFamily: 'Inter' }}>
              Términos y condiciones
            </Link>
            <Link to="/privacy" className="text-white text-sm font-normal hover:underline" style={{ fontFamily: 'Inter' }}>
              Política de privacidad
            </Link>
            <Link to="/copyright" className="text-white text-sm font-normal hover:underline" style={{ fontFamily: 'Inter' }}>
              Derechos de autor
            </Link>
            <Link to="/refund" className="text-white text-sm font-normal hover:underline" style={{ fontFamily: 'Inter' }}>
              Politica de reembolso
            </Link>
            <Link to="/aml" className="text-white text-sm font-normal hover:underline" style={{ fontFamily: 'Inter' }}>
              Política ALD
            </Link>
          </div>

          {/* Idioma */}
          <div 
            className="flex flex-col gap-3 p-2.5"
            style={{ width: '180px', height: '200px' }}
          >
            <span className="text-white text-sm font-bold text-center" style={{ fontFamily: 'Inter' }}>
              IDIOMA
            </span>
            <button 
              className="flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 self-stretch"
              style={{ background: '#34404A' }}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center">
                <Globe className="w-[18px] h-[18px] text-white" />
              </div>
              <span className="text-white text-sm font-normal" style={{ fontFamily: 'Inter' }}>
                Español
              </span>
            </button>
          </div>

          {/* Servicio al cliente */}
          <div 
            className="flex flex-col gap-3"
            style={{ width: '381px', height: '200px' }}
          >
            <span className="text-white text-sm font-bold" style={{ fontFamily: 'Inter' }}>
              SERVICIO AL CLIENTE
            </span>
            <span className="text-white text-sm font-normal" style={{ fontFamily: 'Inter' }}>
              Apoyo
            </span>
            <span className="text-white text-sm font-normal" style={{ fontFamily: 'Inter' }}>
              Soporte 24 horas al día, 7 días a la semana, respuesta en 12 horas
            </span>
            
            {/* Payment icons placeholder */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gray-600 rounded-lg" />
              <div className="w-14 h-14 bg-gray-600 rounded-lg" />
              <div className="w-14 h-14 bg-gray-600 rounded-lg" />
              <div className="w-14 h-14 bg-gray-600 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer - Payment Methods #091924 */}
      <div 
        className="overflow-hidden flex justify-center items-center"
        style={{ 
          background: '#091924',
          paddingTop: '64px',
          paddingBottom: '64px',
          minHeight: '250px'
        }}
      >
        <div 
          className="flex justify-between items-center"
          style={{ width: '1366px' }}
        >
          {/* Visa */}
          <div 
            className="flex flex-col items-center justify-center rounded-lg overflow-hidden"
            style={{ width: '200px', height: '100px', padding: '10px', background: '#1D2A36' }}
          >
            <div className="text-white text-3xl font-bold tracking-wider">VISA</div>
          </div>

          {/* Mastercard */}
          <div 
            className="flex items-center justify-center rounded-lg overflow-hidden"
            style={{ width: '200px', height: '100px', padding: '10px', background: '#1D2A36' }}
          >
            <div className="relative" style={{ width: '100px', height: '62px' }}>
              <div 
                className="absolute rounded-full"
                style={{ width: '50px', height: '50px', left: '0', top: '6px', background: '#EB001B' }}
              />
              <div 
                className="absolute rounded-full"
                style={{ width: '50px', height: '50px', right: '0', top: '6px', background: '#F79E1B' }}
              />
            </div>
          </div>

          {/* Stripe */}
          <div 
            className="flex flex-col items-center justify-center rounded-lg overflow-hidden"
            style={{ width: '200px', height: '100px', padding: '10px', background: '#1D2A36' }}
          >
            <div className="text-white text-2xl font-bold">stripe</div>
          </div>

          {/* Apple Pay */}
          <div 
            className="flex flex-col items-center justify-center rounded-lg overflow-hidden"
            style={{ width: '200px', height: '100px', padding: '38px 38px 15px 38px', background: '#1D2A36' }}
          >
            <div className="text-white text-2xl font-semibold"> Pay</div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
