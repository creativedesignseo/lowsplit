import { useState, useEffect } from 'react'
import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    // Cargar notificaciones iniciales
    fetchNotifications()

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Change received!', payload)
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new, ...prev])
            setUnreadCount(prev => prev + 1)
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n))
            updateUnreadCount()
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id === payload.old.id))
            updateUnreadCount()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching notifications:', error)
      return
    }

    setNotifications(data || [])
    setUnreadCount(data?.filter(n => !n.is_read).length || 0)
  }

  const updateUnreadCount = () => {
    setNotifications(prev => {
      setUnreadCount(prev.filter(n => !n.is_read).length)
      return prev
    })
  }

  const markAsRead = async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    if (error) console.error('Error marking as read:', error)
  }

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) console.error('Error marking all as read:', error)
    else {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
    }
  }

  const deleteNotification = async (id) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) console.error('Error deleting notification:', error)
  }

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-[#EF534F] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h4 className="font-black text-gray-900 text-sm">Notificaciones</h4>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-black text-[#EF534F] uppercase tracking-widest hover:opacity-70 transition-opacity"
                >
                  Marcar todo
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-xs text-gray-400 font-medium">No tienes notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((n) => (
                    <div 
                      key={n.id}
                      className={`p-4 hover:bg-gray-50 transition-colors group relative ${!n.is_read ? 'bg-red-50/30' : ''}`}
                      onClick={() => !n.is_read && markAsRead(n.id)}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5">{getIcon(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-black text-gray-900 mb-0.5 ${!n.is_read ? 'pr-6' : ''}`}>
                            {n.title}
                          </p>
                          <p className="text-[11px] text-gray-500 leading-normal line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[9px] text-gray-400 mt-2 font-medium uppercase tracking-tighter">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {!n.is_read && (
                        <div className="absolute top-4 right-4 w-2 h-2 bg-[#EF534F] rounded-full" />
                      )}

                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(n.id)
                        }}
                        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-300 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
                <div className="p-3 bg-gray-50/50 border-t border-gray-50">
                    <button className="w-full py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">
                        Ver todas
                    </button>
                </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
