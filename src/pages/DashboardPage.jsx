import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const DashboardPage = () => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex justify-center items-center bg-[#FAFAFA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#EF534F]" />
      </div>
    )
  }

  if (!session) {
    return (
      <>
        <Helmet>
          <title>Dashboard - LowSplit</title>
        </Helmet>

        <section className="min-h-screen pt-[80px] pb-20 bg-[#FAFAFA]">
          <div className="max-w-md mx-auto px-4 text-center mt-10">
            <div className="bg-white border border-gray-100 rounded-[20px] p-8 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[#EF534F]/10 flex items-center justify-center mx-auto mb-6">
                <LogIn className="w-8 h-8 text-[#EF534F]" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Inicia sesión para continuar
              </h1>
              <p className="text-gray-600 mb-8">
                Necesitas una cuenta para acceder a tu dashboard y gestionar tus suscripciones.
              </p>
              <div className="flex flex-col gap-3">
                <Link 
                  to="/login" 
                  className="w-full py-3 rounded-full text-white font-bold transition-opacity hover:opacity-90"
                  style={{ background: '#EF534F' }}
                >
                  Iniciar sesión
                </Link>
                <Link 
                  to="/register" 
                  className="w-full py-3 rounded-full text-[#EF534F] font-bold border-2 border-[#EF534F] hover:bg-[#EF534F]/5 transition-colors"
                >
                  Crear cuenta
                </Link>
              </div>
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - LowSplit</title>
      </Helmet>

      <section className="min-h-screen pt-[80px] pb-20 bg-[#FAFAFA]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <span className="text-sm text-gray-500">
              {session.user.email}
            </span>
          </div>
          
          {/* Dashboard Content */}
          <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Mis suscripciones activas</h2>
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-500 mb-4">No tienes suscripciones activas actualmente.</p>
              <Link to="/explore" className="text-[#EF534F] font-medium hover:underline">
                Explorar servicios disponibles &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default DashboardPage
