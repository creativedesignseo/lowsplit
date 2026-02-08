import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { Camera, Edit2, Check, X, Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Toast from '../components/ui/Toast'
import Modal from '../components/ui/Modal'

const ProfilePage = () => {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // UI States
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false })
  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true })
  }

  // Edit States
  const [isEditingName, setIsEditingName] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  
  const [isEditingBirthDate, setIsEditingBirthDate] = useState(false)
  const [birthDate, setBirthDate] = useState('')
  
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })

  const [isEditingEmail, setIsEditingEmail] = useState(false) // Controls Modal Visibility
  const [newEmail, setNewEmail] = useState('')
  
  // Email Verification State
  const [isVerifyStep, setIsVerifyStep] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [timer, setTimer] = useState(0)
  const [captchaChecked, setCaptchaChecked] = useState(false)

  useEffect(() => {
    let interval
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [timer])

  // Notifications Mock State
  const [notifications, setNotifications] = useState({
    suspiciousLogin: true,
    rewards: true,
    discounts: true
  })

  useEffect(() => {
    getProfile()
  }, [])

  const getProfile = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        navigate('/login')
        return
      }

      setSession(session)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setProfile(data)
        // Split name logic
        const fullName = data.full_name || ''
        const lastSpaceIndex = fullName.lastIndexOf(' ')
        if (lastSpaceIndex !== -1) {
            setFirstName(fullName.substring(0, lastSpaceIndex))
            setLastName(fullName.substring(lastSpaceIndex + 1))
        } else {
            setFirstName(fullName)
            setLastName('')
        }
        setBirthDate(data.birth_date || '')
      }
    } catch (error) {
      console.error('Error loading profile', error)
      showToast('Error al cargar el perfil', 'error')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date(),
        })
        .eq('id', session.user.id)

      if (error) throw error
      setProfile({ ...profile, full_name: fullName })
      setIsEditingName(false)
      showToast('Nombre actualizado correctamente')
    } catch (error) {
      console.error('Error updating profile:', error)
      showToast(`Error: ${error.message}`, 'error')
    }
  }

  const updateBirthDate = async () => {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                birth_date: birthDate,
                updated_at: new Date(),
            })
            .eq('id', session.user.id)

        if (error) throw error
        setProfile({ ...profile, birth_date: birthDate })
        setIsEditingBirthDate(false)
        showToast('Fecha de nacimiento actualizada')
    } catch (error) {
        console.error('Error updating birth date:', error)
        showToast(`Error: ${error.message}`, 'error')
    }
  }

  const handleUpdateEmail = async () => {
    if (!captchaChecked) {
      showToast('Por favor confirma que no eres un robot.', 'error')
      return
    }
    
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
      
      setIsVerifyStep(true)
      setTimer(60) // Start 60s countdown
      // Eliminado el toast intermedio para no confundir
    } catch (error) {
      console.error('Error initiating email update:', error)
      if (error.message.includes('rate limit')) {
        showToast('Demasiados intentos. Por favor espera 1 hora.', 'error')
      } else {
        showToast(`Error: ${error.message}`, 'error')
      }
    }
  }

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) {
      showToast('El código debe tener al menos 6 dígitos', 'error')
      return
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: newEmail,
        token: otpCode,
        type: 'email_change'
      })

      if (error) throw error

      showToast('¡Correo electrónico actualizado con éxito!')
      
      setProfile({ ...profile, email: newEmail }) 
      const { data: { session: newSession } } = await supabase.auth.refreshSession()
      if (newSession) setSession(newSession)

      closeEmailModal()
    } catch (error) {
       console.error('Error verifying OTP detailed:', error)
       if (error.message.includes('Token has expired')) {
         showToast('El código ha expirado o es incorrecto.', 'error')
       } else {
         showToast(`Error de verificación: ${error.message}`, 'error')
       }
    }
  }

  const closeEmailModal = () => {
    setIsEditingEmail(false)
    // Reset states after a short delay for animation
    setTimeout(() => {
      setIsVerifyStep(false)
      setNewEmail('')
      setOtpCode('')
      setCaptchaChecked(false)
    }, 300)
  }

  const handleUpdatePassword = async () => {
    if (passwordForm.new.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error')
      return
    }

    if (passwordForm.new !== passwordForm.confirm) {
      showToast('Las contraseñas no coinciden', 'error')
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: passwordForm.new 
      })

      if (error) throw error

      showToast('Contraseña actualizada correctamente')
      setIsChangingPassword(false)
      setPasswordForm({ current: '', new: '', confirm: '' })
    } catch (error) {
      console.error('Error updating password:', error)
      showToast(`Error: ${error.message}`, 'error')
    }
  }

  const [uploading, setUploading] = useState(false)

  const handleAvatarUpload = async (event) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${session.user.id}/${Math.random()}.${fileExt}`

      setUploading(true)
      showToast('Subiendo imagen...')

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date()
        })
        .eq('id', session.user.id)

      if (updateError) throw updateError

      setProfile({ ...profile, avatar_url: publicUrl })
      showToast('Foto de perfil actualizada')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      showToast('Error al subir la imagen', 'error')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen pt-20 flex justify-center items-center bg-[#FAFAFA]">Cargando...</div>
  }

  return (
    <>
      <Helmet>
        <title>Perfil - LowSplit</title>
      </Helmet>

      {toast.visible && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, visible: false })} 
        />
      )}

      {/* Email Change Modal */}
      <Modal
        isOpen={isEditingEmail}
        onClose={closeEmailModal}
        title={isVerifyStep ? "Verificar correo electrónico" : "Cambiar correo electrónico"}
      >
        {!isVerifyStep ? (
          // STEP 1: Enter Email + Captcha
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva dirección de correo</label>
              <input 
                type="email" 
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EF534F]/20 focus:border-[#EF534F] text-gray-900"
                placeholder="ejemplo@correo.com"
                autoFocus
              />
            </div>
            
            {/* Styled Fake ReCAPTCHA */}
            <div className="bg-[#f9f9f9] border border-gray-300 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    id="captcha" 
                    checked={captchaChecked}
                    onChange={(e) => setCaptchaChecked(e.target.checked)}
                    className="w-6 h-6 border-2 border-gray-400 rounded cursor-pointer accent-[#EF534F]"
                  />
                </div>
                <label htmlFor="captcha" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                  No soy un robot
                </label>
              </div>
              <div className="flex flex-col items-center">
                 <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="recaptcha" className="w-8 opacity-70" />
                 <span className="text-[9px] text-gray-500 mt-1">reCAPTCHA</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button 
                onClick={closeEmailModal}
                className="flex-1 py-3 text-gray-500 font-medium hover:bg-gray-50 rounded-full transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleUpdateEmail}
                className="flex-1 py-3 bg-[#EF534F] text-white rounded-full font-bold hover:bg-[#d94440] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-100"
                disabled={!captchaChecked || !newEmail}
              >
                Enviar código
              </button>
            </div>
          </div>
        ) : (
          // STEP 2: Verify OTP
          <div className="space-y-6 text-center">
             <div className="text-sm text-gray-600 mb-6">
               Hemos enviado un código de verificación a <br/>
               <span className="font-bold text-gray-900 text-base">{newEmail}</span>
             </div>
             
             <div className="relative">
                 <input 
                   type="text" 
                   value={otpCode}
                   onChange={(e) => {
                     // Allow only numbers
                     if (/^\d*$/.test(e.target.value)) {
                       setOtpCode(e.target.value)
                     }
                   }}
                   className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-center tracking-[0.5em] text-2xl font-bold font-mono focus:border-[#EF534F] outline-none text-gray-800 bg-gray-50 transition-all placeholder:tracking-widest"
                   placeholder="00000000"
                   maxLength={10}
                 />
             </div>
             
             <div className="h-6">
               {timer > 0 ? (
                 <span className="text-sm font-medium text-[#EF534F] animate-pulse">Reenviar en {timer}s</span>
               ) : (
                 <button onClick={handleUpdateEmail} className="text-sm font-bold text-[#EF534F] hover:underline">
                   Reenviar código
                 </button>
               )}
             </div>

             <div className="flex items-center gap-3 pt-4">
              <button 
                onClick={() => setIsVerifyStep(false)}
                className="flex-1 py-3 text-gray-500 font-medium hover:bg-gray-50 rounded-full transition-colors"
              >
                Atrás
              </button>
              <button 
                onClick={handleVerifyOtp}
                className="flex-1 py-3 bg-[#EF534F] text-white rounded-full font-bold hover:bg-[#d94440] transition-colors shadow-lg shadow-red-200"
              >
                Confirmar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Password Change Modal */}
      <Modal
        isOpen={isChangingPassword}
        onClose={() => setIsChangingPassword(false)}
        title="Restablecer la contraseña"
      >
        <div className="space-y-4">
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña nueva</label>
             <input 
               type="password" 
               value={passwordForm.new}
               onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
               className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EF534F]/20 focus:border-[#EF534F] text-gray-900"
               placeholder="Mínimo 6 caracteres"
             />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
             <input 
               type="password" 
               value={passwordForm.confirm}
               onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
               className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EF534F]/20 focus:border-[#EF534F] text-gray-900"
               placeholder="Repite la contraseña"
             />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button 
              onClick={() => setIsChangingPassword(false)}
              className="flex-1 py-3 text-gray-500 font-medium hover:bg-gray-50 rounded-full transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleUpdatePassword}
              className="flex-1 py-3 bg-[#EF534F] text-white rounded-full font-bold hover:bg-[#d94440] transition-colors shadow-md shadow-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!passwordForm.new || !passwordForm.confirm}
            >
              Actualizar
            </button>
          </div>
        </div>
      </Modal>

      <section className="min-h-screen pt-24 pb-20 bg-[#FAFAFA]">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
          
          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-10">
            <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload').click()}>
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-sm bg-gray-200 flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                   <span className="text-2xl font-bold text-gray-400">
                     {profile?.full_name?.charAt(0) || session?.user?.email?.charAt(0).toUpperCase()}
                   </span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <input 
                type="file" 
                id="avatar-upload" 
                className="hidden" 
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <h2 className="text-sm text-gray-500 mb-1">Haga clic en la imagen para editar</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Name Card */}
            <div className="bg-white p-8 rounded-[20px] shadow-sm flex flex-col justify-between min-h-[160px]">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Nombre</h3>
              
              {isEditingName ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
                          <input 
                            type="text" 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-[#EF534F] text-lg"
                            placeholder="Nombre"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Apellido</label>
                          <input 
                            type="text" 
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-[#EF534F] text-lg"
                            placeholder="Apellido"
                          />
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={updateProfile}
                      className="px-6 py-2 bg-[#EF534F] text-white rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                      Validar
                    </button>
                    <button 
                      onClick={() => setIsEditingName(false)}
                      className="text-gray-500 text-sm hover:text-gray-700 underline"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-gray-600 text-lg block">{profile?.full_name || 'Sin nombre definido'}</span>
                    <span className="text-xs text-gray-400 mt-1 block">
                      Registrado en LowSplit desde {new Date(session?.user?.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="text-gray-900 font-bold underline text-sm hover:text-[#EF534F] transition-colors"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>

            {/* Birth Date (New) */}
            <div className="bg-white p-8 rounded-[20px] shadow-sm flex flex-col justify-between min-h-[160px]">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Fecha de nacimiento</h3>
                
                {isEditingBirthDate ? (
                     <div className="space-y-4">
                        <input 
                            type="date" 
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-[#EF534F] text-lg"
                        />
                        <div className="flex items-center gap-3">
                            <button 
                            onClick={updateBirthDate}
                            className="px-6 py-2 bg-[#EF534F] text-white rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
                            >
                            Validar
                            </button>
                            <button 
                            onClick={() => setIsEditingBirthDate(false)}
                            className="text-gray-500 text-sm hover:text-gray-700 underline"
                            >
                            Cancelar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-lg">
                            {profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString() : 'No definida'}
                        </span>
                        <button 
                            onClick={() => setIsEditingBirthDate(true)}
                            className="text-gray-900 font-bold underline text-sm hover:text-[#EF534F] transition-colors"
                        >
                            Editar
                        </button>
                    </div>
                )}
            </div>

            {/* Email Card (Simplified) */}
            <div className="bg-white p-8 rounded-[20px] shadow-sm flex flex-col justify-between min-h-[160px]">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Correo electrónico</h3>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{session?.user?.email}</span>
                <button 
                  onClick={() => {
                    setNewEmail('') // Reset email input
                    setIsEditingEmail(true) // Open Modal
                  }}
                  className="text-gray-900 font-bold underline text-sm hover:text-[#EF534F] transition-colors"
                >
                  Editar
                </button>
              </div>
            </div>

            {/* Password Card */}
            <div className="bg-white p-8 rounded-[20px] shadow-sm flex flex-col justify-between min-h-[160px]">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Restablecer la contraseña</h3>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 w-2/3">Mantén tu cuenta segura actualizando tu contraseña periódicamente.</span>
                <button 
                  onClick={() => setIsChangingPassword(true)}
                  className="text-gray-900 font-bold underline text-sm hover:text-[#EF534F] transition-colors"
                >
                  Editar
                </button>
              </div>
            </div>

            {/* Notifications Card */}
            <div className="bg-white p-8 rounded-[20px] shadow-sm md:row-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Notificación por correo electrónico</h3>
              
              <div className="space-y-8">
                {/* Switch Item 1 */}
                <div className="flex items-start gap-4 justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 mb-1">Notificación de inicio de sesión sospechoso</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Cuando inicie sesión desde una ubicación desconocida, recibirá una notificación.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifications.suspiciousLogin} onChange={() => {}} className="sr-only peer" />
                    <div className="w-6 h-6 border-2 border-[#EF534F] bg-[#EF534F] rounded flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  </label>
                </div>

                {/* Switch Item 2 */}
                <div className="flex items-start gap-4 justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 mb-1">Actividades de recompensa</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Participa en actividades para ganar créditos.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" checked={notifications.rewards} onChange={() => {}} className="sr-only peer" />
                    <div className="w-6 h-6 border-2 border-[#EF534F] bg-[#EF534F] rounded flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  </label>
                </div>

                {/* Switch Item 3 */}
                <div className="flex items-start gap-4 justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 mb-1">Descuentos y beneficios</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Promociones navideñas, descuentos exclusivos.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" checked={notifications.discounts} onChange={() => {}} className="sr-only peer" />
                    <div className="w-6 h-6 border-2 border-[#EF534F] bg-[#EF534F] rounded flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  </label>
                </div>

              </div>
            </div>

            {/* Spacer for layout matching */}
            <div className="hidden md:block"></div>

            {/* Delete Account */}
             <div className="md:col-span-2 flex justify-center mt-10">
               <button className="text-gray-300 text-sm hover:text-red-500 transition-colors underline">
                 Eliminar cuenta
               </button>
             </div>

          </div>
        </div>
      </section>
    </>
  )
}

export default ProfilePage
