import { Link } from 'react-router-dom'
import { Globe } from 'lucide-react'

const Footer = () => {
  return (
    <footer>
      {/* Main Footer - #1D2A36 */}
      <div
        className="overflow-hidden"
        style={{ background: '#1D2A36' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Acerca de */}
            <div className="flex flex-col gap-3">
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
            <div className="flex flex-col gap-3">
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
            <div className="flex flex-col gap-3">
              <span className="text-white text-sm font-bold" style={{ fontFamily: 'Inter' }}>
                IDIOMA
              </span>
              <button
                className="flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 self-start"
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
            <div className="flex flex-col gap-3 col-span-2 md:col-span-1">
              <span className="text-white text-sm font-bold" style={{ fontFamily: 'Inter' }}>
                SERVICIO AL CLIENTE
              </span>
              <span className="text-white text-sm font-normal" style={{ fontFamily: 'Inter' }}>
                Apoyo
              </span>
              <span className="text-white text-sm font-normal" style={{ fontFamily: 'Inter' }}>
                Soporte 24 horas al día, 7 días a la semana, respuesta en 12 horas
              </span>

              {/* Payment methods (temporary text placeholder) */}
              <span className="text-xs text-gray-500">Visa · Mastercard · Stripe</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer - Payment Methods #091924 */}
      <div
        className="overflow-hidden"
        style={{ background: '#091924' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Visa */}
            <div
              className="flex flex-col items-center justify-center rounded-xl overflow-hidden h-24 p-2.5"
              style={{ background: '#1D2A36' }}
            >
              <div className="text-white text-3xl font-bold tracking-wider">VISA</div>
            </div>

            {/* Mastercard */}
            <div
              className="flex items-center justify-center rounded-xl overflow-hidden h-24 p-2.5"
              style={{ background: '#1D2A36' }}
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
              className="flex flex-col items-center justify-center rounded-xl overflow-hidden h-24 p-2.5"
              style={{ background: '#1D2A36' }}
            >
              <div className="text-white text-2xl font-bold">stripe</div>
            </div>

            {/* Apple Pay */}
            <div
              className="flex flex-col items-center justify-center rounded-xl overflow-hidden h-24 p-2.5"
              style={{ background: '#1D2A36' }}
            >
              <div className="text-white text-2xl font-semibold"> Pay</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
