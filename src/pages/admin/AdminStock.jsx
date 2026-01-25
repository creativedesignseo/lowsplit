import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Package, Plus, Loader2, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const AdminStock = () => {
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState('')
  const [formData, setFormData] = useState({
    slots: 4,
    price: 0,
    credentials_email: '',
    credentials_password: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*').eq('is_active', true)
    setServices(data || [])
  }

  const handleServiceChange = (e) => {
    const serviceId = e.target.value
    setSelectedService(serviceId)
    const service = services.find(s => s.id === serviceId)
    if (service) {
        setFormData(prev => ({
            ...prev,
            slots: service.max_slots,
            price: service.total_price / service.max_slots
        }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
        const { data: { user } } = await supabase.auth.getUser()
        const service = services.find(s => s.id === selectedService)

        const { error } = await supabase.from('subscription_groups').insert({
            service_id: selectedService,
            admin_id: user.id,
            title: `${service.name} (OFFICIAL)`,
            price_per_slot: formData.price,
            max_slots: formData.slots,
            slots_occupied: 0,
            status: 'available',
            visibility: 'public',
            credentials_login: formData.credentials_email,
            credentials_password: formData.credentials_password
        })

        if (error) throw error
        
        alert('Stock added successfully!')
        setFormData({ slots: 4, price: 0, credentials_email: '', credentials_password: '' })
        setSelectedService('')

    } catch (err) {
        alert('Error: ' + err.message)
    } finally {
        setIsSubmitting(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Manage Stock - LowSplit Admin</title>
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
            <Package className="w-8 h-8 text-[#EF534F]" />
            Inject Stock
        </h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Service</label>
                    <select 
                        className="w-full rounded-xl border-gray-200 focus:ring-[#EF534F] focus:border-[#EF534F] py-3"
                        value={selectedService}
                        onChange={handleServiceChange}
                        required
                    >
                        <option value="">Select Service...</option>
                        {services.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Slots (Total)</label>
                        <input 
                            type="number" 
                            className="w-full rounded-xl border-gray-200 py-3"
                            value={formData.slots}
                            onChange={e => setFormData({...formData, slots: parseInt(e.target.value)})}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Price per Slot (€)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            className="w-full rounded-xl border-gray-200 py-3"
                            value={formData.price}
                            onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                            required
                        />
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">Credentials (Secure)</h3>
                    <div className="space-y-4">
                        <input 
                            type="text" 
                            placeholder="Account Email / Username"
                            className="w-full rounded-xl border-gray-200 py-3"
                            value={formData.credentials_email}
                            onChange={e => setFormData({...formData, credentials_email: e.target.value})}
                        />
                         <input 
                            type="text" 
                            placeholder="Account Password"
                            className="w-full rounded-xl border-gray-200 py-3"
                            value={formData.credentials_password}
                            onChange={e => setFormData({...formData, credentials_password: e.target.value})}
                        />
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Save className="w-3 h-3" />
                            Credentials are encrypted at rest. Only members can see this.
                        </p>
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={isSubmitting || !selectedService}
                    className="w-full bg-[#0a0a0a] text-white font-bold py-4 rounded-xl hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Inject Inventory'}
                </button>
            </form>
        </div>
      </div>
    </>
  )
}

export default AdminStock
