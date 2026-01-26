import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Loader2, TrendingUp, Plus, ChevronRight, User, ShoppingBag, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getLogoUrl } from '../lib/utils'

const DashboardPage = () => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  
  // Dashboard State
  const [activeTab, setActiveTab] = useState('purchases')
  const [purchases, setPurchases] = useState([])
  const [sales, setSales] = useState([])
  const [loadingData, setLoadingData] = useState(false)

  // Credentials Edit State
  const [editingCreds, setEditingCreds] = useState(null) // group ID
  const [credsForm, setCredsForm] = useState({ login: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [savingCreds, setSavingCreds] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      if (session) {
        fetchDashboardData(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchDashboardData(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchDashboardData = async (userId) => {
    setLoadingData(true)
    try {
      // Fetch user's purchases (memberships where they are a member)
      const { data: membershipData, error: membershipError } = await supabase
        .from('memberships')
        .select(`
          id,
          role,
          payment_status,
          joined_at,
          subscription_groups (
            id,
            price_per_slot,
            next_payment_date,
            status,
            credentials_login,
            credentials_password,
            services (
              id,
              name,
              slug,
              category
            )
          )
        `)
        .eq('user_id', userId)
        .eq('role', 'member')

      if (membershipError) console.error('Memberships error:', membershipError)
      
      // Transform membership data to purchases format
      const purchasesData = (membershipData || []).map(m => ({
        id: m.id,
        groupId: m.subscription_groups?.id,
        service: m.subscription_groups?.services?.slug || 'unknown',
        name: m.subscription_groups?.services?.name || 'Servicio',
        plan: '1 Mes',
        price: m.subscription_groups?.price_per_slot || 0,
        renewal: m.subscription_groups?.next_payment_date || new Date().toISOString(),
        status: m.payment_status === 'paid' ? 'active' : 'pending',
        login: m.subscription_groups?.credentials_login,
        password: m.subscription_groups?.credentials_password
      }))
      setPurchases(purchasesData)

      // Fetch user's sales (groups where they are admin)
      const { data: groupsData, error: groupsError } = await supabase
        .from('subscription_groups')
        .select(`
          id,
          title,
          slots_occupied,
          price_per_slot,
          status,
          credentials_login,
          credentials_password,
          services (
            id,
            name,
            slug,
            max_slots
          )
        `)
        .eq('admin_id', userId)

      if (groupsError) console.error('Groups error:', groupsError)

      // Transform groups data to sales format
      const salesData = (groupsData || []).map(g => ({
        id: g.id,
        service: g.services?.slug || 'unknown',
        name: g.title || g.services?.name || 'Grupo',
        sold: g.slots_occupied || 1,
        total: g.services?.max_slots || 4,
        earnings: ((g.slots_occupied - 1) * (g.price_per_slot || 0)), // earnings from sold slots (excluding admin)
        pricePerSlot: g.price_per_slot || 0,
        status: g.status,
        login: g.credentials_login,
        password: g.credentials_password
      }))
      setSales(salesData)

    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const handleEditCreds = (group) => {
    setEditingCreds(group.id)
    setCredsForm({
        login: group.login || '',
        password: group.password || ''
    })
    setShowPassword(false)
  }

  const saveCreds = async () => {
      setSavingCreds(true)
      try {
          const { error } = await supabase
              .from('subscription_groups')
              .update({
                  credentials_login: credsForm.login,
                  credentials_password: credsForm.password
              })
              .eq('id', editingCreds)

          if (error) throw error

          // Refresh local state
          const updatedSales = sales.map(s => {
              if (s.id === editingCreds) {
                  return { ...s, login: credsForm.login, password: credsForm.password }
              }
              return s
          })
          setSales(updatedSales)
          setEditingCreds(null)
          
      } catch (error) {
          console.error('Error updating creds:', error)
          alert('Error al guardar credenciales')
      } finally {
          setSavingCreds(false)
      }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex justify-center items-center bg-[#FAFAFA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#EF534F]" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-[80px] pb-20 bg-[#FAFAFA] flex items-center justify-center">
         <div className="bg-white p-8 rounded-[24px] shadow-sm max-w-md w-full text-center border border-gray-100">
             <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <LogIn className="w-8 h-8 text-[#EF534F]" />
             </div>
             <h1 className="text-2xl font-black text-gray-900 mb-2">Acceso Requerido</h1>
             <p className="text-gray-500 mb-8">Inicia sesión para gestionar tus suscripciones.</p>
             <Link to="/login" className="block w-full py-3 bg-[#EF534F] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-red-200 transition-all">
                 Iniciar Sesión
             </Link>
         </div>
      </div>
    )
  }

  // Calculate totals from real data
  const totalSpent = purchases.reduce((acc, curr) => acc + curr.price, 0)
  const totalEarnings = sales.reduce((acc, curr) => acc + curr.earnings, 0)
  // Estimated savings: assume ~60% off original prices
  const totalSaved = totalSpent > 0 ? totalSpent * 0.6 : 0

  return (
    <>
      <Helmet>
        <title>Dashboard - LowSplit</title>
      </Helmet>

      <section className="min-h-screen pt-[80px] pb-20 bg-[#FAFAFA]">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
          
          {/* Header & Stats */}
          <div className="mb-8">
             <h1 className="text-3xl font-black text-gray-900 mb-6">Hola, {session.user.email?.split('@')[0]}</h1>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {/* Savings Card */}
                 <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[20px] p-6 text-white shadow-xl shadow-gray-200">
                     <div className="flex items-center gap-3 mb-4 opacity-80">
                         <Zap className="w-5 h-5 text-yellow-400" fill="currentColor" />
                         <span className="text-sm font-bold uppercase tracking-wider">Ahorro Total</span>
                     </div>
                     <div className="text-4xl font-black tracking-tight mb-1">€{totalSaved.toFixed(2)}</div>
                     <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded-md">Este mes</span>
                 </div>

                 {/* Spending Card */}
                 <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
                     <div className="flex items-center gap-3 mb-4 text-gray-500">
                         <ShoppingBag className="w-5 h-5" />
                         <span className="text-sm font-bold uppercase tracking-wider">Gastos</span>
                     </div>
                     <div className="text-3xl font-black text-gray-900 mb-1">€{totalSpent.toFixed(2)}</div>
                     <span className="text-xs text-gray-500">Mensual</span>
                 </div>

                 {/* Earnings Card */}
                 <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
                     <div className="flex items-center gap-3 mb-4 text-gray-500">
                         <TrendingUp className="w-5 h-5 text-green-500" />
                         <span className="text-sm font-bold uppercase tracking-wider">Ganancias</span>
                     </div>
                     <div className="text-3xl font-black text-gray-900 mb-1">€{totalEarnings.toFixed(2)}</div>
                     <span className="text-xs text-gray-500">Mensual</span>
                 </div>
             </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-6 mb-8 border-b border-gray-200">
              <button 
                  onClick={() => setActiveTab('purchases')}
                  className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all relative
                  ${activeTab === 'purchases' ? 'text-[#EF534F]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                  <ShoppingBag className="w-4 h-4" />
                  Mis Suscripciones
                  {activeTab === 'purchases' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EF534F] rounded-t-full"></div>}
              </button>

              <button 
                  onClick={() => setActiveTab('sales')}
                  className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all relative
                  ${activeTab === 'sales' ? 'text-[#EF534F]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                  <TrendingUp className="w-4 h-4" />
                  Mis Grupos (Ventas)
                  {activeTab === 'sales' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EF534F] rounded-t-full"></div>}
              </button>
          </div>

          {/* Loading Indicator */}
          {loadingData && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#EF534F]" />
            </div>
          )}

          {/* Content Area */}
          {!loadingData && (
            <div className="space-y-4">
                
                {/* PURCHASES LIST */}
                {activeTab === 'purchases' && (
                    <>
                      {purchases.length > 0 ? (
                        purchases.map(sub => (
                            <Link 
                                key={sub.id} 
                                to={sub.groupId ? `/group/${sub.groupId}` : '#'}
                                className="bg-white p-4 sm:p-6 rounded-[20px] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 group hover:border-[#EF534F]/30 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 overflow-hidden relative">
                                        <img src={getLogoUrl(sub.service)} alt={sub.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#EF534F] transition-colors">{sub.name}</h3>
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                            <span className={`px-2 py-0.5 rounded-md ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                              {sub.status === 'active' ? 'Activo' : 'Pendiente'}
                                            </span>
                                            <span>• Renueva el {new Date(sub.renewal).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row items-center justify-between w-full sm:w-auto gap-4 sm:gap-8">
                                    <div className="text-center sm:text-right">
                                        <p className="font-black text-gray-900 text-xl">€{sub.price.toFixed(2)}</p>
                                        <p className="text-xs text-gray-400">/{sub.plan}</p>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        {sub.status === 'active' && (
                                            <button 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setEditingCreds(sub.id + '_view');
                                                }}
                                                className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors flex items-center gap-2"
                                            >
                                                <Zap className="w-3.5 h-3.5" />
                                                Ver Acceso
                                            </button>
                                        )}
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#EF534F] group-hover:bg-[#EF534F]/10 transition-all">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-white rounded-[20px] border border-gray-100">
                            <p className="text-gray-500 mb-2">No tienes suscripciones activas.</p>
                            <p className="text-sm text-gray-400">Explora servicios y únete a un grupo para empezar a ahorrar.</p>
                        </div>
                      )}
                      
                      {/* Add New Subscription CTA */}
                      <Link to="/explore" className="block mt-6">
                          <div className="border-2 border-dashed border-gray-200 rounded-[20px] p-6 flex flex-col items-center justify-center text-gray-400 hover:border-[#EF534F] hover:text-[#EF534F] hover:bg-[#fff5f5] transition-all cursor-pointer h-[150px]">
                              <Plus className="w-8 h-8 mb-2" />
                              <span className="font-bold text-sm">Explorar nuevos servicios</span>
                          </div>
                      </Link>
                    </>
                )}

                {/* SALES LIST */}
                {activeTab === 'sales' && (
                    <>
                       {sales.length > 0 ? (
                           sales.map(group => (
                              <Link key={group.id} to={`/group/${group.id}`} className="bg-white p-4 sm:p-6 rounded-[20px] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 group hover:border-[#EF534F]/30 transition-all cursor-pointer">
                                  <div className="flex items-center gap-4 w-full sm:w-auto">
                                      <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 overflow-hidden relative">
                                          <img src={getLogoUrl(group.service)} alt={group.name} className="w-full h-full object-cover" />
                                      </div>
                                      <div>
                                          <h3 className="font-bold text-gray-900 text-lg">{group.name}</h3>
                                          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                                              <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                                                  <User className="w-3 h-3" />
                                                  {group.sold} / {group.total} ocupados
                                              </div>
                                              <span className={`px-2 py-0.5 rounded-md ${group.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {group.status === 'available' ? 'Disponible' : group.status === 'full' ? 'Lleno' : 'Cerrado'}
                                              </span>
                                          </div>
                                          
                                          {/* Manage Creds Button (Only for Owners) */}
                                          <button 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleEditCreds(group);
                                            }}
                                            className="text-xs font-bold text-[#EF534F] hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full transition-colors"
                                          >
                                              Gestionar Acceso 🔒
                                          </button>
                                      </div>
                                  </div>
                                  
                                  <div className="flex items-center justify-between w-full sm:w-auto gap-8">
                                      <div className="text-right">
                                          <p className="font-black text-green-600 text-xl">+€{group.earnings.toFixed(2)}</p>
                                          <p className="text-xs text-gray-400">mensuales</p>
                                      </div>
                                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#EF534F] group-hover:bg-[#EF534F]/10 transition-all">
                                          <ChevronRight className="w-5 h-5" />
                                      </div>
                                  </div>
                              </Link>
                           ))
                       ) : (
                          <div className="text-center py-12 bg-white rounded-[20px] border border-gray-100">
                              <p className="text-gray-500 mb-2">No has creado ningún grupo todavía.</p>
                              <p className="text-sm text-gray-400">Comparte tus suscripciones y empieza a generar ingresos.</p>
                          </div>
                       )}

                       <Link to="/share-subscription" className="block mt-6">
                          <div className="border-2 border-dashed border-gray-200 rounded-[20px] p-6 flex flex-col items-center justify-center text-gray-400 hover:border-[#EF534F] hover:text-[#EF534F] hover:bg-[#fff5f5] transition-all cursor-pointer h-[150px]">
                              <Plus className="w-8 h-8 mb-2" />
                              <span className="font-bold text-sm">Crear nuevo grupo</span>
                          </div>
                      </Link>
                    </>
                )}

            </div>
          )}
        </div>

        {/* Credentials Edit Modal */}
        {editingCreds && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-[24px] w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${editingCreds.toString().endsWith('_view') ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-[#EF534F]'}`}>
                            <Shield className={`w-6 h-6`} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900">
                                {editingCreds.toString().endsWith('_view') ? 'Credenciales de Acceso' : 'Gestionar Acceso'}
                            </h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                {editingCreds.toString().endsWith('_view') ? 'Información Confidencial' : 'Editar Datos del Grupo'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="group">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Email de la cuenta</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={editingCreds.toString().endsWith('_view') ? (purchases.find(p => p.id + '_view' === editingCreds)?.login || 'No disponible') : credsForm.login}
                                    readOnly={editingCreds.toString().endsWith('_view')}
                                    onChange={(e) => setCredsForm({...credsForm, login: e.target.value})}
                                    className={`w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none transition-all ${editingCreds.toString().endsWith('_view') ? 'cursor-text' : 'focus:border-[#EF534F] focus:ring-4 focus:ring-red-50'}`}
                                />
                                {editingCreds.toString().endsWith('_view') && (
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(purchases.find(p => p.id + '_view' === editingCreds)?.login)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-500 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded"
                                    >
                                        COPIAR
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="group">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Contraseña</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    value={editingCreds.toString().endsWith('_view') ? (purchases.find(p => p.id + '_view' === editingCreds)?.password || '••••••••') : credsForm.password}
                                    readOnly={editingCreds.toString().endsWith('_view')}
                                    onChange={(e) => setCredsForm({...credsForm, password: e.target.value})}
                                    className={`w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none transition-all ${editingCreds.toString().endsWith('_view') ? 'cursor-text' : 'focus:border-[#EF534F] focus:ring-4 focus:ring-red-50'}`}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 text-[10px] font-black tracking-widest"
                                >
                                    {showPassword ? "OCULTAR" : "VER"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {!editingCreds.toString().endsWith('_view') ? (
                        <div className="mt-8 flex gap-3">
                            <button 
                                onClick={() => setEditingCreds(null)}
                                className="flex-1 py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={saveCreds}
                                disabled={savingCreds}
                                className="flex-1 py-4 bg-[#EF534F] text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-red-200 transition-all disabled:opacity-50 flex justify-center items-center"
                            >
                                {savingCreds ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Datos'}
                            </button>
                        </div>
                    ) : (
                        <div className="mt-8">
                            <button 
                                onClick={() => { setEditingCreds(null); setShowPassword(false); }}
                                className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200"
                            >
                                Cerrar
                            </button>
                            <p className="text-center text-[10px] text-gray-400 mt-4 font-medium uppercase tracking-widest">
                                No compartas estos datos con nadie
                            </p>
                        </div>
                    )}
                </div>
            </div>
        )}
      </section>
    </>
  )
}

export default DashboardPage
