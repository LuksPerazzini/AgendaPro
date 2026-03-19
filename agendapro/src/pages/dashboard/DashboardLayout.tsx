import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, Calendar, Users, BarChart2, Settings, MessageCircle,
  Star, Megaphone, Menu, X, Zap, Bell, ChevronRight, LogOut, Gift, Check, Clock, CreditCard, Loader2, AlertCircle, Shield
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { addDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

type Notification = {
  id: string
  client_name: string
  time: string
  date: string
  status: string
  services: { name: string } | null
}

const baseNavItems = [
  { path: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Visão Geral', exact: true },
  { path: '/dashboard/agenda', icon: <Calendar size={18} />, label: 'Agenda' },
  { path: '/dashboard/clientes', icon: <Users size={18} />, label: 'Clientes' },
  { path: '/dashboard/relatorios', icon: <BarChart2 size={18} />, label: 'Relatórios' },
  { path: '/dashboard/marketing', icon: <Megaphone size={18} />, label: 'Marketing' },
  { path: '/dashboard/avaliacoes', icon: <Star size={18} />, label: 'Avaliações' },
  { path: '/dashboard/whatsapp', icon: <MessageCircle size={18} />, label: 'WhatsApp' },
  { path: '/dashboard/afiliados', icon: <Gift size={18} />, label: 'Indicações' },
  { path: '/dashboard/servicos', icon: <CreditCard size={18} />, label: 'Serviços' },
  { path: '/dashboard/configuracoes', icon: <Settings size={18} />, label: 'Configurações', exact: true },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifLoading, setNotifLoading] = useState(true)
  const [notifActionId, setNotifActionId] = useState<string | null>(null)
  const [notifError, setNotifError] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut, user, isAdmin } = useAuth()
  const notifRef = useRef<HTMLDivElement>(null)
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const tomorrowKey = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const navItems = isAdmin
    ? [...baseNavItems, { path: '/dashboard/contas', icon: <Shield size={18} />, label: 'Contas' }]
    : baseNavItems

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const displayName = profile?.full_name ?? 'Usuário'
  const displayPlan = isAdmin ? 'Administrador' : profile?.plan === 'pro' ? 'Plano PRO' : profile?.plan === 'business' ? 'Business' : 'Plano Gratuito'
  const planColor = isAdmin ? 'text-rose-300' : profile?.plan === 'free' ? 'text-slate-400' : 'text-amber-400'

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path) && path !== '/dashboard'
  }

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false)
      }
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!user) return
    let ignore = false

    const load = async () => {
      setNotifLoading(true)
      setNotifError('')

      const { data, error } = await supabase
        .from('appointments')
        .select('id, client_name, time, date, status, services(name)')
        .eq('profile_id', user.id)
        .in('status', ['pending', 'confirmed'])
        .gte('date', todayKey)
        .order('date')
        .order('time')
        .limit(10)

      if (ignore) return

      if (error) {
        setNotifError('Não foi possível carregar as notificações.')
        setNotifLoading(false)
        return
      }

      const nextNotifications = data as unknown as Notification[]
      setNotifications(nextNotifications)
      setUnreadCount(nextNotifications.filter(notification => notification.status === 'pending').length)
      setNotifLoading(false)
    }

    void load()

    const channel = supabase
      .channel(`appointments-notif-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `profile_id=eq.${user.id}` },
        () => {
          void load()
        },
      )
      .subscribe()

    return () => {
      ignore = true
      void supabase.removeChannel(channel)
    }
  }, [todayKey, user])

  const confirmNotif = async (id: string) => {
    setNotifActionId(id)
    setNotifError('')

    const previousNotifications = notifications
    setNotifications(current => current.map(notification => notification.id === id ? { ...notification, status: 'confirmed' } : notification))
    setUnreadCount(prev => Math.max(0, prev - 1))

    const { error } = await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', id)

    setNotifActionId(null)

    if (error) {
      setNotifications(previousNotifications)
      setUnreadCount(previousNotifications.filter(notification => notification.status === 'pending').length)
      setNotifError('Não foi possível confirmar esse agendamento agora.')
    }
  }

  const formatNotifDate = (date: string) => {
    if (date === todayKey) return 'Hoje'
    if (date === tomorrowKey) return 'Amanhã'
    return format(new Date(date + 'T12:00:00'), "d 'de' MMM", { locale: ptBR })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 transition-transform duration-300 md:static md:translate-x-0`}>
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white">AgendaPro</span>
          </Link>
          <button className="text-slate-400 md:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-slate-800 p-4">
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{displayName}</div>
              <div className={`text-xs font-medium ${planColor}`}>{displayPlan}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive(item.path, item.exact) ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:text-white">
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <button className="p-2 text-slate-500 md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>

          <div className="hidden items-center gap-1 text-sm text-slate-500 md:flex">
            <span>Dashboard</span>
            {location.pathname !== '/dashboard' && (
              <>
                <ChevronRight size={14} />
                <span className="font-medium capitalize text-slate-900">
                  {location.pathname.split('/').pop()}
                </span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(open => !open)}
                className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h3 className="text-sm font-bold text-slate-900">Notificações</h3>
                    <button onClick={() => setNotifOpen(false)} className="rounded-lg p-1 hover:bg-slate-100">
                      <X size={14} className="text-slate-400" />
                    </button>
                  </div>

                  {notifError && (
                    <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                      <AlertCircle size={14} /> {notifError}
                    </div>
                  )}

                  <div className="max-h-96 overflow-y-auto">
                    {notifLoading ? (
                      <div className="flex items-center justify-center p-8 text-slate-400">
                        <Loader2 size={24} className="animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <Bell size={32} className="mx-auto mb-2 text-slate-200" />
                        <p className="text-sm font-medium">Nenhuma notificação</p>
                        <p className="mt-1 text-xs">Novos agendamentos aparecem aqui</p>
                      </div>
                    ) : notifications.map(notification => (
                      <div key={notification.id} className={`border-b border-slate-50 px-4 py-3 transition-colors hover:bg-slate-50 ${notification.status === 'pending' ? 'bg-amber-50/50' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${notification.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {notification.status === 'pending' ? <Clock size={14} /> : <Check size={14} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">{notification.client_name}</p>
                            <p className="text-xs text-slate-500">
                              {notification.services?.name ?? 'Serviço'} · {formatNotifDate(notification.date)} às {notification.time.slice(0, 5)}
                            </p>
                            {notification.status === 'pending' && (
                              <button
                                onClick={() => void confirmNotif(notification.id)}
                                disabled={notifActionId === notification.id}
                                className="mt-1.5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                              >
                                {notifActionId === notification.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                Confirmar agendamento
                              </button>
                            )}
                          </div>
                          <span className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium ${notification.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {notification.status === 'pending' ? 'Pendente' : 'Confirmado'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 px-4 py-3">
                    <Link to="/dashboard/agenda" onClick={() => setNotifOpen(false)} className="text-xs font-medium text-indigo-600 hover:underline">
                      Ver agenda completa -&gt;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {!isAdmin && profile?.slug && (
              <Link
                to={`/professional/${profile.slug}`}
                className="rounded-lg border border-indigo-200 px-3 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
              >
                Ver meu perfil
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
