import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'

const ForgotPasswordPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const onSubmit = async (data) => {
    setLoading(true)
    setErrorMsg('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: window.location.origin + '/login',
      })

      if (error) throw error

      setSuccess(true)
    } catch (error) {
      console.error('Error sending reset email:', error.message)
      setErrorMsg('No se ha podido enviar el enlace. Inténtalo de nuevo más tarde.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Recuperar contraseña - LowSplit</title>
      </Helmet>

      <div className="min-h-screen flex">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
          {/* Back Button */}
          <Link
            to="/login"
            className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Volver al login</span>
          </Link>

          <div className="w-full max-w-md mt-10 lg:mt-0">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 mb-8">
              <img src="/Logo-lowsplit-light.svg" alt="LowSplit" className="h-8 w-auto" />
            </Link>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Recuperar contraseña</h1>
            <p className="text-gray-500 mb-8">
              Introduce tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            {success ? (
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-800 text-sm">
                  Te hemos enviado un enlace si el email existe. Revisa tu bandeja de entrada.
                </p>
              </div>
            ) : (
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

                {errorMsg && (
                  <p className="text-red-500 text-sm">{errorMsg}</p>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
              </form>
            )}

            {/* Back to Login Link */}
            <div className="text-center mt-6">
              <span className="text-gray-500 text-sm">¿Ya la recuerdas? </span>
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                Inicia sesión
              </Link>
            </div>
          </div>
        </div>

        {/* Right side - Branding */}
        <div className="hidden lg:flex flex-1 items-center justify-center" style={{ backgroundColor: '#1E293B' }}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/Logo-lowsplit.svg" alt="LowSplit" className="h-16 w-auto" />
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

export default ForgotPasswordPage
