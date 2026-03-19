import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, TrendingUp, Users, DollarSign, CheckCircle, AlertCircle, ArrowRight, Star, MessageCircle, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import ReferralNotice from '../../components/ReferralNotice'

type Appointment = {
  id: string
  client_name: string
  time: string
  status: string
  notes: string | null
  services: { name: string; price: number }[] | null
}

type ProfileSetupData = {
  city: string | null
  phone: string | null
  avatar_url: string | null
  cover_url: string | null
  booking_enabled: boolean
  schedule: Record<string, { active: boolean; start: string; end: string }> | null
}

export default function DashboardHome() {
  const { user, profile } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [totalClients, setTotalClients] = useState(0)
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)
  const [activeServices, setActiveServices] = useState(0)
  const [profileSetup, setProfileSetup] = useState<ProfileSetupData | null>(null)
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'por aí'

  const todayDate = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)

      const [aptsRes, clientsRes, revenueRes, servicesRes, profileRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, client_name, time, status, notes, services(name, price)')
          .eq('profile_id', user.id)
          .eq('date', today)
          .neq('status', 'cancelled')
          .order('time'),
        supabase
          .from('appointments')
          .select('client_phone', { count: 'exact', head: false })
          .eq('profile_id', user.id),
        supabase
          .from('appointments')
          .select('services(price)')
          .eq('profile_id', user.id)
          .eq('status', 'completed')
          .gte('date', `${today.slice(0, 7)}-01`),
        supabase
          .from('services')
          .select('id', { count: 'exact', head: false })
          .eq('profile_id', user.id)
          .eq('active', true),
        supabase
          .from('profiles')
          .select('city, phone, avatar_url, cover_url, booking_enabled, schedule')
          .eq('id', user.id)
          .maybeSingle(),
      ])

      if (aptsRes.data) setAppointments(aptsRes.data as unknown as Appointment[])

      if (clientsRes.data) {
        const unique = new Set(clientsRes.data.map((row: { client_phone: string }) => row.client_phone))
        setTotalClients(unique.size)
      }

      if (revenueRes.data) {
        const total = (revenueRes.data as { services: { price: number }[] | null }[])
          .reduce((sum, row) => sum + (row.services?.[0]?.price ?? 0), 0)
        setMonthlyRevenue(total)
      }

      if (servicesRes.data) setActiveServices(servicesRes.data.length)
      if (profileRes.data) setProfileSetup(profileRes.data as ProfileSetupData)

      setLoading(false)
    }
    void load()
  }, [user, today])

  const confirmed = appointments.filter(appointment => appointment.status === 'confirmed').length
  const hasActiveSchedule = Boolean(
    profileSetup?.schedule &&
    Object.values(profileSetup.schedule).some(day => day?.active)
  )
  const setupItems = [
    {
      title: 'Perfil básico preenchido',
      done: Boolean(profile?.full_name && profile?.profession && profileSetup?.city && profileSetup?.phone),
      href: '/dashboard/configuracoes',
      cta: 'Completar perfil',
    },
    {
      title: 'Pelo menos 1 serviço ativo',
      done: activeServices > 0,
      href: '/dashboard/servicos',
      cta: 'Cadastrar serviço',
    },
    {
      title: 'Horário liberado para agendamento',
      done: Boolean(profileSetup?.booking_enabled && hasActiveSchedule),
      href: '/dashboard/configuracoes',
      cta: 'Ajustar horários',
    },
    {
      title: 'Foto ou banner no perfil',
      done: Boolean(profileSetup?.avatar_url || profileSetup?.cover_url),
      href: '/dashboard/configuracoes',
      cta: 'Personalizar perfil',
    },
  ]
  const setupProgress = Math.round((setupItems.filter(item => item.done).length / setupItems.length) * 100)
  const nextSetupItem = setupItems.find(item => !item.done)

  const stats = [
    {
      label: 'Faturamento do mês',
      value: `R$${monthlyRevenue.toLocaleString('pt-BR')}`,
      icon: <DollarSign size={20} className="text-emerald-600" />,
      bg: 'bg-emerald-50',
      change: 'este mês',
      href: '/dashboard/relatorios',
    },
    {
      label: 'Agendamentos hoje',
      value: `${appointments.length}`,
      icon: <Calendar size={20} className="text-indigo-600" />,
      bg: 'bg-indigo-50',
      change: `${confirmed} confirmados`,
      href: '/dashboard/agenda',
    },
    {
      label: 'Total de clientes',
      value: `${totalClients}`,
      icon: <Users size={20} className="text-purple-600" />,
      bg: 'bg-purple-50',
      change: 'unicos',
      href: '/dashboard/clientes',
    },
    {
      label: 'Avaliação média',
      value: profile?.rating ? `${Number(profile.rating).toFixed(1)}*` : '-',
      icon: <Star size={20} className="text-amber-500" />,
      bg: 'bg-amber-50',
      change: profile?.review_count ? `${profile.review_count} avaliações` : 'sem avaliações',
      href: '/dashboard/avaliacoes',
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{greeting}, {firstName}!</h1>
        <p className="text-slate-500 mt-1">
          {loading ? 'Carregando...' : appointments.length > 0 ? `Você tem ${appointments.length} agendamento${appointments.length > 1 ? 's' : ''} hoje. Vamos lá!` : 'Nenhum agendamento hoje. Bom descanso!'}
        </p>
      </div>

      <div className="mb-6">
        <ReferralNotice variant="compact" />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(stat => (
          <Link
            key={stat.label}
            to={stat.href}
            className="bg-white rounded-2xl p-5 border border-slate-100 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-slate-900">{loading ? '-' : stat.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
            <div className="mt-2 flex items-center justify-between gap-2 text-xs font-medium text-emerald-600">
              <span>{stat.change}</span>
              <span className="text-indigo-600">Abrir</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Agenda de hoje</h2>
              <p className="text-sm text-slate-500 capitalize">{todayDate}</p>
            </div>
            <Link to="/dashboard/agenda" className="text-sm text-indigo-600 font-medium flex items-center gap-1 hover:underline">
              Ver agenda <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="p-12 flex items-center justify-center text-slate-400">
              <Loader2 size={28} className="animate-spin" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Calendar size={40} className="mx-auto mb-3" />
              <p className="font-medium">Nenhum agendamento hoje</p>
              <p className="mt-1 text-sm">Seus próximos agendamentos aparecerão aqui</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {appointments.map(appointment => (
                <div key={appointment.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-14 text-center flex-shrink-0">
                    <div className="text-sm font-bold text-slate-900">{appointment.time.slice(0, 5)}</div>
                    <div className="text-xs text-slate-400">hoje</div>
                  </div>
                  <div className="w-0.5 h-10 bg-indigo-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">{appointment.client_name}</div>
                    <div className="text-sm text-slate-500">{appointment.services?.[0]?.name ?? 'Serviço'}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-slate-900">
                      {appointment.services?.[0]?.price ? `R$${appointment.services[0].price}` : '-'}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      appointment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {appointment.status === 'confirmed' ? 'Confirmado' : appointment.status === 'pending' ? 'Pendente' : 'Cancelado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="mb-4 font-bold text-slate-900">Ações rápidas</h3>
            <div className="space-y-2">
              <Link to="/dashboard/agenda" className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-colors group">
                <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <Calendar size={16} className="text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">Ver agenda completa</span>
                <ArrowRight size={14} className="text-slate-400 ml-auto" />
              </Link>
              <Link to="/dashboard/clientes" className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition-colors group">
                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Users size={16} className="text-purple-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">Gerenciar clientes</span>
                <ArrowRight size={14} className="text-slate-400 ml-auto" />
              </Link>
              <Link to="/dashboard/marketing" className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 transition-colors group">
                <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <TrendingUp size={16} className="text-amber-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">Ferramentas de marketing</span>
                <ArrowRight size={14} className="text-slate-400 ml-auto" />
              </Link>
              <Link to="/dashboard/whatsapp" className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 transition-colors group">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <MessageCircle size={16} className="text-green-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">Central WhatsApp</span>
                <ArrowRight size={14} className="text-slate-400 ml-auto" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900">Progresso do seu perfil</h3>
                <p className="mt-1 text-sm text-slate-500">Veja o que ja esta pronto para fortalecer seu perfil no app.</p>
              </div>
              <div className="rounded-2xl bg-indigo-50 px-3 py-2 text-right">
                <div className="text-lg font-bold text-indigo-700">{loading ? '-' : `${setupProgress}%`}</div>
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-indigo-400">concluido</div>
              </div>
            </div>

            <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${loading ? 0 : setupProgress}%` }} />
            </div>

            <div className="space-y-3">
              {setupItems.map(item => (
                <Link
                  key={item.title}
                  to={item.href}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 px-3 py-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50"
                >
                  {item.done ? (
                    <CheckCircle size={16} className="mt-0.5 flex-shrink-0 text-green-500" />
                  ) : (
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.done ? 'Pronto para uso' : item.cta}</p>
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-[0.18em] ${item.done ? 'text-green-500' : 'text-indigo-500'}`}>
                    {item.done ? 'ok' : 'abrir'}
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
              {nextSetupItem ? (
                <>
            Próximo passo recomendado: <Link to={nextSetupItem.href} className="font-semibold text-indigo-600 hover:underline">{nextSetupItem.cta.toLowerCase()}</Link>.
                </>
              ) : (
                <>
            Seu perfil já está bem configurado. O próximo ganho pode ser <Link to="/pricing" className="font-semibold text-indigo-600 hover:underline">destacar seu perfil com o Pro</Link>.
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
