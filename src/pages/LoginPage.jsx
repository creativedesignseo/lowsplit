import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) throw error

      // Login successful
      window.location.href = '/' // or use navigate from react-router
    } catch (error) {
      console.error('Error logging in:', error.message)
      alert(error.message) // Simple alert for now, can be improved with toast
    }
  }

  return (
    <>
      <Helmet>
        <title>Iniciar sesión - LowSplit</title>
      </Helmet>

      <div className="min-h-screen flex">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 mb-8">
              <img src="/Logo-lowsplit.svg" alt="LowSplit" className="h-8 w-auto" />
            </Link>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Accede con</h1>
            <p className="text-gray-500 mb-8">Ingresa tus credenciales para continuar</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tu dirección de correo electrónico
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
                  Tu contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { required: 'La contraseña es requerida' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all pr-12"
                    placeholder="••••••••"
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

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Accede
              </button>
            </form>

            {/* Forgot Password */}
            <div className="text-center mt-6">
              <Link to="/forgot-password" className="text-gray-600 hover:text-gray-900 text-sm">
                ¿Has olvidado la contraseña?
              </Link>
            </div>

            {/* Register Link */}
            <div className="text-center mt-4">
              <span className="text-gray-500 text-sm">¿Por primera vez en LowSplit? </span>
              <Link to="/register" className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                Regístrate
              </Link>
            </div>

            {/* Social Login */}
            <div className="mt-8">
              <div className="flex items-center gap-4">
                <button className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-xl py-3 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-xl py-3 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-xl py-3 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Branding */}
        <div className="hidden lg:flex flex-1 bg-purple-600 items-center justify-center">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/Logo-lowsplit.svg" alt="LowSplit" className="h-16 w-auto invert grayscale-0 brightness-0" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <p className="text-white/80 text-lg max-w-xs">
              Comparte suscripciones de forma segura y ahorra hasta un 75%
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default LoginPage
