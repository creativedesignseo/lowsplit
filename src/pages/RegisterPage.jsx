import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Zap, Eye, EyeOff, Check, Mail } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'

const RegisterPage = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: data.name,
          },
        },
      })

      if (error) throw error

      if (error) throw error
      
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Error signing up:', error.message)
      alert(error.message)
    }
  }

  return (
    <>
      <Helmet>
        <title>Crear cuenta - LowSplit</title>
      </Helmet>

      <div className="min-h-screen flex">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-1 bg-primary-500 items-center justify-center">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
                <img src="/Logo-lowsplit.svg" alt="LowSplit" className="h-16 w-auto" />
            </div>
            <p className="text-white/80 text-lg max-w-xs">
              Únete a miles de usuarios que ya ahorran en sus suscripciones
            </p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
              <img src="/Logo-lowsplit.svg" alt="LowSplit" className="h-8 w-auto" />
            </Link>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Crea tu cuenta</h1>
            <p className="text-gray-500 mb-8">Empieza a ahorrar en tus suscripciones favoritas</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'El nombre es requerido' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  placeholder="Tu nombre"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  {...register('email', { required: 'El email es requerido' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  placeholder="correo@ejemplo.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { 
                      required: 'La contraseña es requerida',
                      minLength: { value: 8, message: 'Mínimo 8 caracteres' }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all pr-12"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  {...register('terms', { required: 'Debes aceptar los términos' })}
                  className="mt-1 w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                />
                <label className="text-sm text-gray-600">
                  Acepto los{' '}
                  <Link to="/terms" className="text-primary-600 hover:underline">términos y condiciones</Link>
                  {' '}y la{' '}
                  <Link to="/privacy" className="text-primary-600 hover:underline">política de privacidad</Link>
                </label>
              </div>
              {errors.terms && (
                <p className="text-red-500 text-sm">{errors.terms.message}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Crear cuenta
              </button>
            </form>

            {/* Login Link */}
            <div className="text-center mt-6">
              <span className="text-gray-500 text-sm">¿Ya tienes cuenta? </span>
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                Inicia sesión
              </Link>
            </div>

            {/* Social Login */}
            <div className="mt-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">O continúa con</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-xl py-3 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-gray-700 font-medium">Google</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-xl py-3 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-gray-700 font-medium">Facebook</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 to-primary-600"></div>
              
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-green-500" />
                <div className="absolute bg-white rounded-full p-1 -bottom-1 -right-1 shadow-sm border border-gray-100">
                    <Check className="w-4 h-4 text-green-600" strokeWidth={3} />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Revisa tu correo!</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Hemos enviado un enlace de confirmación a tu email. <br/>
                <span className="text-sm font-medium text-primary-600">Es necesario verificarlo para entrar.</span>
              </p>

              <button
                onClick={() => navigate('/login')}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Entendido, ir al login
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default RegisterPage
